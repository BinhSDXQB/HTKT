'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@/lib/generated/prisma'
import {
  LINH_VUC_MAP, CAP_DUONG, PHAN_LOAI_DO_THI, chuanHoaTen, phanLoaiThoatNuoc, nhanDienQuocLoTinhLo,
  type LinhVuc, type KieuHinhHoc,
} from '@/lib/htkt-doi-tuong/danh-muc'
import { kiemHinhHoc, phanTramNgoaiRanh, type HinhHoc } from '@/lib/htkt-doi-tuong/hinh-hoc'
import { quyenTrenXa } from '@/lib/htkt-doi-tuong/truy-van'

// Bảng trung tâm đối tượng HTKT (htkt_doi_tuong — migration 049) cho xã/phường nhập liệu.
// Số hiệu đường xã/thôn theo Đ5 QĐ 56/2025/QĐ-UBND: dải số, chữ cái, chống trùng đều do CSDL (trigger + UNIQUE)
// chặn lần cuối; ở đây kiểm thẩm quyền: Đth. do UBND cấp xã quyết định (tài khoản xã được chốt "Đã quyết định"),
// ĐX. do UBND tỉnh quyết định (tài khoản xã chỉ "Đề xuất", Phòng HTKT/admin mới chốt).

const DUONG_DAN = '/dashboard/bao-cao/ha-tang-xa'

export type KetQua = { ok: boolean; error?: string; id?: string; maDoiTuong?: string }

export type DoiTuongForm = {
  id?: string
  maXa: string
  linhVuc: LinhVuc
  ten: string
  tuyenDuongId: string
  streetId: string
  capDuong: string
  phanLoaiDoThi: string
  thon: string
  shSo: string
  shChuCai: string
  shTrangThai: '' | 'DE_XUAT' | 'HIEU_LUC'
  shSoQd: string
  shNgayQd: string
  soHieuKhac: string
  soHieuCu: string
  tenCu: string
  giaTri: Record<string, string | boolean>   // theo LinhVucDef.truong[].key (đơn vị nhập, chưa nhân heSo)
  geometry: unknown | null
  ghiChu: string
}

const t = (s?: string | null) => (s && s.trim() ? s.trim() : null)
const soVN = (s: unknown): number | null => {
  if (s === null || s === undefined || s === '') return null
  if (typeof s === 'number') return Number.isFinite(s) ? s : null
  let v = String(s).trim().replace(/\s/g, '')
  if (v.includes(',') && !v.includes('.')) v = v.replace(',', '.')        // "1,5" kiểu VN
  else v = v.replace(/,/g, '')                                             // "1,234.5"
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}
const s2d = (s?: string | null) => {
  const m = s?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null
}

const KIEU_GEOM: Record<KieuHinhHoc, string[]> = {
  tuyen: ['LineString', 'MultiLineString'], diem: ['Point', 'MultiPoint'], vung: ['Polygon', 'MultiPolygon'],
}

/** Rút thông báo tiếng Việt từ lỗi CSDL (RAISE trong trigger, UNIQUE, CHECK). */
function loiCsdl(e: unknown): string {
  const err = e as { code?: string; message?: string; meta?: { message?: string; target?: unknown } }
  const msg = `${err?.meta?.message ?? ''} ${err?.message ?? ''}`
  if (err?.code === 'P2002' || /uq_htkt_so_hieu/.test(msg)) return 'Số hiệu này đã được dùng cho tuyến khác trong tỉnh — chọn số khác (bấm "Gợi ý").'
  if (/uq_htkt_street/.test(msg)) return 'Tuyến đô thị này đã gắn với một hồ sơ đường khác.'
  const ours = msg.match(/(Số \d+ ngoài dải[^\n"]*|[^\n"]*không được giao dải số hiệu[^\n"]*|Chưa có tuyến mang số hiệu[^\n"]*|Chỉ đường xã \(ĐX\.\)[^\n"]*|Tuyến đường liên kết phải[^\n"]*|Toạ độ phải là[^\n"]*|Kiểu hình học[^\n"]*|Mã định danh[^\n"]*|Dòng report_[^\n"]*)/)
  if (ours) return ours[1].trim()
  if (/ck_htkt_sh_hieu_luc/.test(msg)) return 'Số hiệu "Đã quyết định" phải có số và ngày quyết định.'
  if (/ck_htkt_co_nhan/.test(msg)) return 'Cần có tên đối tượng (hoặc số hiệu).'
  console.error('[htkt-doi-tuong]', e)
  return 'Không lưu được: lỗi CSDL.'
}

export async function luuDoiTuong(f: DoiTuongForm): Promise<KetQua> {
  const user = await requireAuth()
  const q = await quyenTrenXa(user, f.maXa)
  if (!q || !q.ghi) return { ok: false, error: 'Không có quyền nhập liệu cho xã/phường này.' }
  const lv = LINH_VUC_MAP[f.linhVuc]
  if (!lv) return { ok: false, error: 'Lĩnh vực không hợp lệ.' }

  const cu = f.id ? await db.htkt_doi_tuong.findFirst({ where: { id: f.id, deleted_at: null } }) : null
  if (f.id && !cu) return { ok: false, error: 'Không tìm thấy đối tượng (có thể đã bị xoá).' }
  if (cu && cu.ma_xa !== q.xa.code) return { ok: false, error: 'Đối tượng không thuộc xã/phường đang thao tác.' }
  if (cu && cu.linh_vuc !== f.linhVuc) return { ok: false, error: 'Không đổi lĩnh vực của đối tượng đã có mã định danh — xoá và tạo mới.' }

  // ── Đường: cấp + số hiệu ──
  const laDuong = f.linhVuc === 'DUONG'
  const cap = laDuong ? (t(f.capDuong) ?? 'CHUA_PHAN_CAP') : null
  if (cap && !CAP_DUONG.some((c) => c.value === cap)) return { ok: false, error: 'Cấp đường không hợp lệ.' }
  const coSo = laDuong && (cap === 'DUONG_XA' || cap === 'DUONG_THON') && t(f.shSo) !== null
  const shSo = coSo ? soVN(f.shSo) : null
  if (coSo && (shSo === null || !Number.isInteger(shSo) || shSo <= 0)) return { ok: false, error: 'Số hiệu phải là số tự nhiên.' }
  const shChuCai = coSo ? t(f.shChuCai)?.toUpperCase() ?? null : null
  let shTrangThai: string | null = coSo ? (f.shTrangThai || 'DE_XUAT') : null
  const shSoQd = coSo ? t(f.shSoQd) : null
  const shNgayQd = coSo ? s2d(f.shNgayQd) : null

  // Thẩm quyền Đ5 k2: số hiệu đường xã do UBND tỉnh đặt → xã chỉ đề xuất, không tự chốt / sửa số đã chốt.
  if (!q.laSo) {
    const cuChotDx = cu?.cap_duong === 'DUONG_XA' && cu.sh_trang_thai === 'HIEU_LUC'
    if (cuChotDx && (cu.sh_so !== shSo || (cu.sh_chu_cai ?? null) !== shChuCai || cap !== 'DUONG_XA' || shTrangThai !== 'HIEU_LUC'
                     || (cu.sh_so_qd ?? null) !== shSoQd || (cu.sh_ngay_qd?.getTime() ?? null) !== (shNgayQd?.getTime() ?? null)))
      return { ok: false, error: 'Số hiệu đường xã đã được UBND tỉnh quyết định — chỉ Sở Xây dựng (Phòng HTKT) được thay đổi.' }
    if (cap === 'DUONG_XA' && shTrangThai === 'HIEU_LUC' && !cuChotDx)
      shTrangThai = 'DE_XUAT'
  }
  if (shTrangThai === 'HIEU_LUC' && (!shSoQd || !shNgayQd))
    return { ok: false, error: 'Số hiệu "Đã quyết định" cần số và ngày quyết định.' }
  if (coSo && q.xa.dxTu === null) return { ok: false, error: `${q.xa.name} không được giao dải số hiệu theo Điều 5 QĐ 56/2025/QĐ-UBND.` }

  // ── Trường theo lĩnh vực: cột có kiểu + thong_so ──
  const cot: Record<string, unknown> = {}
  const thongSo: Record<string, unknown> = { ...((cu?.thong_so as Record<string, unknown>) ?? {}) }
  for (const tr of lv.truong) {
    const raw = f.giaTri[tr.key]
    let v: unknown
    if (tr.kind === 'boolean') v = raw === true || raw === 'true' ? true : raw === false || raw === 'false' ? false : null
    else if (tr.kind === 'number' || tr.kind === 'integer') {
      const x = soVN(raw)
      if (x !== null && x < 0) return { ok: false, error: `${tr.label} không được âm.` }
      v = x === null ? null : tr.kind === 'integer' ? Math.round(x) : Math.round(x * (tr.heSo ?? 1) * 10) / 10
    } else if (tr.kind === 'select' && tr.options && t(String(raw ?? '')) && !tr.options.some((o) => o.value === raw)) {
      return { ok: false, error: `${tr.label}: giá trị không hợp lệ.` }
    } else v = t(raw === undefined || raw === null ? '' : String(raw))
    if (tr.key.startsWith('ts.')) { if (v === null) delete thongSo[tr.key.slice(3)]; else thongSo[tr.key.slice(3)] = v }
    else cot[tr.key] = v
  }
  if (cot.nam_su_dung != null && ((cot.nam_su_dung as number) < 1900 || (cot.nam_su_dung as number) > 2100))
    return { ok: false, error: 'Năm đưa vào sử dụng không hợp lệ.' }

  // ── Hình học ──
  let geometry: HinhHoc | null = null
  let ngoaiRanh: number | null = null
  if (f.geometry) {
    const k = kiemHinhHoc(f.geometry)
    if (!k.ok) return { ok: false, error: k.loi }
    if (!lv.hinhHoc.some((kieu) => KIEU_GEOM[kieu].includes(k.g.type)))
      return { ok: false, error: `${lv.label} chỉ nhận hình học dạng ${lv.hinhHoc.map((x) => ({ tuyen: 'tuyến', diem: 'điểm', vung: 'vùng' }[x])).join(' / ')}.` }
    geometry = k.g
    ngoaiRanh = await phanTramNgoaiRanh(k.g, q.xa.code)
  }

  // ── Liên kết tuyến đường / tuyến đô thị ──
  const tuyenDuongId = lv.trenTuyen || laDuong ? t(f.tuyenDuongId) : null
  if (tuyenDuongId && tuyenDuongId === f.id) return { ok: false, error: 'Không thể chọn chính nó làm tuyến chính.' }
  const streetId = laDuong ? t(f.streetId) : null
  if (streetId) {
    const st = await db.street.findFirst({ where: { id: streetId, wardId: q.xa.id }, select: { id: true } })
    if (!st) return { ok: false, error: 'Tuyến đô thị không thuộc xã/phường này.' }
  }
  const phanLoai = cap === 'DUONG_DO_THI' ? t(f.phanLoaiDoThi) : null
  if (phanLoai && !PHAN_LOAI_DO_THI.some((p) => p.value === phanLoai)) return { ok: false, error: 'Nhóm đường đô thị không hợp lệ.' }

  const data = {
    ten: t(f.ten), cap_duong: cap, phan_loai_do_thi: phanLoai, thon: laDuong ? t(f.thon) : null,
    sh_so: shSo, sh_chu_cai: shChuCai, sh_trang_thai: shTrangThai, sh_so_qd: shSoQd, sh_ngay_qd: shNgayQd,
    so_hieu_khac: laDuong ? t(f.soHieuKhac) : null, so_hieu_cu: laDuong ? t(f.soHieuCu) : null, ten_cu: laDuong ? t(f.tenCu) : null,
    diem_dau: null as string | null, diem_cuoi: null as string | null, vi_tri: null as string | null,
    chieu_dai_m: null as number | null, be_rong_nen_m: null as number | null, be_rong_mat_m: null as number | null,
    ket_cau_mat: null as string | null, dien_tich_m2: null as number | null, so_luong: null as number | null,
    nam_su_dung: null as number | null, tinh_trang: null as string | null, don_vi_quan_ly: null as string | null,
    de_xuat_dieu_chinh: null as string | null,
    ...cot,
    thong_so: thongSo as Prisma.InputJsonValue,
    geometry: geometry ? (geometry as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    ngoai_ranh_pct: ngoaiRanh,
    ghi_chu: t(f.ghiChu),
    updated_by_id: user.id,
    tuyen_duong: tuyenDuongId ? { connect: { id: tuyenDuongId } } : f.id ? { disconnect: true } : undefined,
    street: streetId ? { connect: { id: streetId } } : f.id ? { disconnect: true } : undefined,
  }

  try {
    const r = f.id
      ? await db.htkt_doi_tuong.update({ where: { id: f.id }, data: data as unknown as Prisma.htkt_doi_tuongUpdateInput, select: { id: true, ma_doi_tuong: true } })
      : await db.htkt_doi_tuong.create({
          data: { ...data, linh_vuc: f.linhVuc, xa: { connect: { code: q.xa.code } }, created_by_id: user.id } as unknown as Prisma.htkt_doi_tuongCreateInput,
          select: { id: true, ma_doi_tuong: true },
        })
    revalidatePath(`${DUONG_DAN}/${q.xa.code}`)
    return { ok: true, id: r.id, maDoiTuong: r.ma_doi_tuong }
  } catch (e) {
    return { ok: false, error: loiCsdl(e) }
  }
}

export async function xoaDoiTuong(maXa: string, id: string): Promise<KetQua> {
  const user = await requireAuth()
  const q = await quyenTrenXa(user, maXa)
  if (!q || !q.ghi) return { ok: false, error: 'Không có quyền.' }
  const cu = await db.htkt_doi_tuong.findFirst({ where: { id, ma_xa: maXa, deleted_at: null }, select: { cap_duong: true, sh_trang_thai: true } })
  if (!cu) return { ok: false, error: 'Không tìm thấy đối tượng.' }
  if (!q.laSo && cu.cap_duong === 'DUONG_XA' && cu.sh_trang_thai === 'HIEU_LUC')
    return { ok: false, error: 'Đường xã đã có số hiệu do UBND tỉnh quyết định — liên hệ Sở Xây dựng để thu hồi trước khi xoá.' }
  try {
    // Xoá mềm: số hiệu được giải phóng, trigger ghi lịch sử. Gỡ liên kết các dòng Biểu mẫu để "Nạp từ Biểu mẫu"
    // gắn lại được vào hồ sơ đúng; đối tượng đang "nằm trên tuyến" này được gỡ tuyến.
    const w = { doiTuongId: id }
    const bo = { doiTuongId: null }
    await db.$transaction([
      db.reportDuong.updateMany({ where: w, data: bo }), db.reportDienCS.updateMany({ where: w, data: bo }),
      db.reportThoatNuoc.updateMany({ where: w, data: bo }), db.reportCayXanh.updateMany({ where: w, data: bo }),
      db.reportCongVien.updateMany({ where: w, data: bo }), db.reportCapNuoc.updateMany({ where: w, data: bo }),
      db.reportBaiDoXe.updateMany({ where: w, data: bo }),
      db.htkt_doi_tuong.updateMany({ where: { tuyen_duong_id: id }, data: { tuyen_duong_id: null, updated_by_id: user.id } }),
      db.htkt_doi_tuong.update({ where: { id }, data: { deleted_at: new Date(), updated_by_id: user.id } }),
    ])
    revalidatePath(`${DUONG_DAN}/${maXa}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: loiCsdl(e) }
  }
}

/** Gợi ý số hiệu còn trống trong dải của xã (soGoc: dùng chung số cho đường thứ hai → chữ cái tiếp theo). */
export async function goiYSoHieu(maXa: string, cap: string, soGoc?: number | null): Promise<{ so: number; chuCai: string | null; kyHieu: string } | null> {
  const user = await requireAuth()
  const q = await quyenTrenXa(user, maXa)
  if (!q || (cap !== 'DUONG_XA' && cap !== 'DUONG_THON')) return null
  const goc = soGoc && Number.isInteger(soGoc) && soGoc > 0 ? soGoc : null
  const [r] = await db.$queryRaw<{ so: number; chu_cai: string | null; ky_hieu: string }[]>`
    SELECT so, chu_cai, ky_hieu FROM fn_htkt_goi_y_so_hieu(${maXa}, ${cap}, ${goc}::int)`
  return r ? { so: Number(r.so), chuCai: r.chu_cai, kyHieu: r.ky_hieu } : null
}

export async function layHinhHoc(maXa: string, id: string): Promise<unknown | null> {
  const user = await requireAuth()
  const q = await quyenTrenXa(user, maXa)
  if (!q) return null
  const r = await db.htkt_doi_tuong.findFirst({ where: { id, ma_xa: maXa, deleted_at: null }, select: { geometry: true } })
  return r?.geometry ?? null
}

// ── NẠP TỪ 7 BIỂU MẪU: tạo hồ sơ gốc + gắn doiTuongId, tự liên kết tuyến đường theo tên ──────────────────
export type KetQuaNap = {
  ok: boolean; error?: string
  taoMoi: number; lienKet: number; ganTuyen: number; ganStreet: number
  theoLinhVuc: Record<string, number>
  boQua: { bang: string; ten: string; lyDo: string }[]
}

type ToaDo = { lat: number | null; lng: number | null }
const hopLe = (p: ToaDo) => p.lat !== null && p.lng !== null && p.lng >= 105.4 && p.lng <= 107.8 && p.lat >= 15.9 && p.lat <= 18.3
const diem = (lat: number | null | undefined, lng: number | null | undefined): ToaDo => ({ lat: lat ?? null, lng: lng ?? null })
const khoa = (lv: string, ten: string | null, dau?: string | null, cuoi?: string | null) =>
  `${lv}|${chuanHoaTen(ten)}|${chuanHoaTen(dau)}|${chuanHoaTen(cuoi)}`

export async function napTuBieuMau(maXa: string, nam: number): Promise<KetQuaNap> {
  const rong: KetQuaNap = { ok: false, taoMoi: 0, lienKet: 0, ganTuyen: 0, ganStreet: 0, theoLinhVuc: {}, boQua: [] }
  const user = await requireAuth()
  const q = await quyenTrenXa(user, maXa)
  if (!q || !q.ghi) return { ...rong, error: 'Không có quyền.' }
  if (!Number.isInteger(nam) || nam < 2000 || nam > 2100) return { ...rong, error: 'Năm không hợp lệ.' }
  const wardId = q.xa.id
  const kq: KetQuaNap = { ...rong, ok: true }

  try {
    await db.$transaction(async (tx) => {
      // Khoá theo xã để hai người bấm "Nạp" cùng lúc không tạo trùng.
      await tx.$queryRaw`SELECT 1 AS k FROM pg_advisory_xact_lock(hashtext(${'htkt_nap:' + maXa}))`
      const hienCo = await tx.htkt_doi_tuong.findMany({
        where: { ma_xa: maXa, deleted_at: null },
        select: { id: true, linh_vuc: true, ten: true, diem_dau: true, diem_cuoi: true, street_id: true },
      })
      const theoKhoa = new Map(hienCo.map((h) => [khoa(h.linh_vuc, h.ten, h.diem_dau, h.diem_cuoi), h.id]))
      const duongTheoTen = new Map<string, string | null>()   // tên chuẩn hoá → id (null = trùng tên, không tự gắn)
      const ghiTen = (ten: string | null, id: string) => {
        const k = chuanHoaTen(ten); if (!k) return
        duongTheoTen.set(k, duongTheoTen.has(k) && duongTheoTen.get(k) !== id ? null : id)
      }
      hienCo.filter((h) => h.linh_vuc === 'DUONG').forEach((h) => ghiTen(h.ten, h.id))

      const tao = async (
        lv: LinhVuc, ten: string, dau: string | null, cuoi: string | null,
        data: Omit<Prisma.htkt_doi_tuongCreateInput, 'ma_doi_tuong' | 'xa' | 'linh_vuc' | 'ten'>,
        tuyenTheoTen: string | null,
      ): Promise<{ id: string; moi: boolean }> => {
        const k = khoa(lv, ten, dau, cuoi)
        const co = theoKhoa.get(k)
        if (co) return { id: co, moi: false }
        let tuyen: string | null = null
        if (tuyenTheoTen) tuyen = duongTheoTen.get(chuanHoaTen(tuyenTheoTen)) ?? null
        const r = await tx.htkt_doi_tuong.create({
          data: {
            ...data, linh_vuc: lv, ten,
            xa: { connect: { code: maXa } }, created_by_id: user.id, updated_by_id: user.id,
            ...(tuyen ? { tuyen_duong: { connect: { id: tuyen } } } : {}),
          },
          select: { id: true },
        })
        if (tuyen) kq.ganTuyen++
        theoKhoa.set(k, r.id)
        kq.theoLinhVuc[lv] = (kq.theoLinhVuc[lv] ?? 0) + 1
        return { id: r.id, moi: true }
      }
      const dem = (moi: boolean) => (moi ? kq.taoMoi++ : kq.lienKet++)
      const ts = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '')) as Prisma.InputJsonValue
      const toaDoTuyen = (a: ToaDo, b: ToaDo) => ({
        ...(hopLe(a) ? { toaDoDau: [a.lng, a.lat] } : {}), ...(hopLe(b) ? { toaDoCuoi: [b.lng, b.lat] } : {}),
      })
      const point = (p: ToaDo) => (hopLe(p) ? ({ type: 'Point', coordinates: [p.lng, p.lat] } as Prisma.InputJsonValue) : undefined)

      // 1) ĐƯỜNG — trước, để các lĩnh vực sau gắn được "nằm trên tuyến".
      const streets = q.xa.laPhuong ? await tx.street.findMany({ where: { wardId }, select: { id: true, name: true } }) : []
      const streetTheoTen = new Map<string, string | null>()
      for (const s of streets) { const k = chuanHoaTen(s.name); streetTheoTen.set(k, streetTheoTen.has(k) ? null : s.id) }
      const daGanStreet = new Set(hienCo.map((h) => h.street_id).filter(Boolean) as string[])

      for (const r of await tx.reportDuong.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const ql = nhanDienQuocLoTinhLo(r.tenDuong)
        const cap = ql?.cap ?? (q.xa.laPhuong ? 'DUONG_DO_THI' : 'CHUA_PHAN_CAP')
        const sid = q.xa.laPhuong ? streetTheoTen.get(chuanHoaTen(r.tenDuong)) ?? null : null
        const ganSt = sid && !daGanStreet.has(sid)
        const { id, moi } = await tao('DUONG', r.tenDuong, r.diemDau, r.diemCuoi, {
          cap_duong: cap, so_hieu_khac: ql?.soHieu ?? null, diem_dau: r.diemDau, diem_cuoi: r.diemCuoi,
          chieu_dai_m: r.chieuDaiKm !== null ? Math.round(r.chieuDaiKm * 10000) / 10 : null,
          be_rong_nen_m: r.nenM, be_rong_mat_m: r.matM, ket_cau_mat: r.ketCauMat, ghi_chu: r.ghiChu,
          thong_so: ts({ heTraiM: r.heTraiM, hePhaiM: r.hePhaiM, giaiPhanCachM: r.giaiPhanCachM,
            ...toaDoTuyen(diem(r.toaDoDauLat, r.toaDoDauLng), diem(r.toaDoCuoiLat, r.toaDoCuoiLng)), nguon: `report_duong ${nam}` }),
          ...(ganSt ? { street: { connect: { id: sid! } } } : {}),
        }, null)
        if (moi && ganSt) { daGanStreet.add(sid!); kq.ganStreet++ }
        if (moi) ghiTen(r.tenDuong, id)
        await tx.reportDuong.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }

      // 2) CHIẾU SÁNG
      for (const r of await tx.reportDienCS.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const { id, moi } = await tao('CHIEU_SANG', r.tuyenDuong, null, null, {
          chieu_dai_m: r.chieuDaiCSKm !== null ? Math.round(r.chieuDaiCSKm * 10000) / 10 : null,
          so_luong: r.soColDen, nam_su_dung: r.namDauTu && r.namDauTu >= 1900 && r.namDauTu <= 2100 ? r.namDauTu : null, ghi_chu: r.ghiChu,
          thong_so: ts({ loaiDen: r.loaiDenChuan ?? r.loaiDen, loaiDenGoc: r.loaiDen, congSuatW: r.congSuatW, chieuSangPhia: r.chieuSangPhia, nguon: `report_dien_cs ${nam}` }),
          geometry: point(diem(r.toaDoLat, r.toaDoLng)),
        }, r.tuyenDuong)
        await tx.reportDienCS.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }

      // 3) THOÁT NƯỚC — phân loại mưa / thải / chung từ cột "loại nước" (dòng không rõ: bỏ qua, báo lại).
      for (const r of await tx.reportThoatNuoc.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const lv = phanLoaiThoatNuoc(r.loaiNuoc)
        if (!lv) { kq.boQua.push({ bang: 'Thoát nước', ten: r.tuyen, lyDo: `Chưa rõ nước mưa hay nước thải (cột loại nước: "${r.loaiNuoc ?? ''}")` }); continue }
        const { id, moi } = await tao(lv, r.tuyen, r.diemDau, r.diemCuoi, {
          diem_dau: r.diemDau, diem_cuoi: r.diemCuoi, chieu_dai_m: r.chieuDaiM,
          nam_su_dung: r.namSuDung && r.namSuDung >= 1900 && r.namSuDung <= 2100 ? r.namSuDung : null, ghi_chu: r.ghiChu,
          thong_so: ts({ kichThuocCong: r.kichThuocCong, phia: r.chieuSangPhia, loaiNuocGoc: r.loaiNuoc,
            ...toaDoTuyen(diem(r.toaDoDauLat, r.toaDoDauLng), diem(r.toaDoCuoiLat, r.toaDoCuoiLng)), nguon: `report_thoat_nuoc ${nam}` }),
        }, r.tuyen)
        await tx.reportThoatNuoc.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }

      // 4) CÂY XANH
      for (const r of await tx.reportCayXanh.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const { id, moi } = await tao('CAY_XANH', r.tuyen, r.diemDau, r.diemCuoi, {
          diem_dau: r.diemDau, diem_cuoi: r.diemCuoi, so_luong: r.soLuongCay, ghi_chu: r.ghiChu,
          thong_so: ts({ chungLoaiCay: r.chungLoaiCay, phiaTrong: r.chieuSangPhia,
            ...toaDoTuyen(diem(r.toaDoDauLat, r.toaDoDauLng), diem(r.toaDoCuoiLat, r.toaDoCuoiLng)), nguon: `report_cay_xanh ${nam}` }),
        }, r.tuyen)
        await tx.reportCayXanh.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }

      // 5) CÔNG VIÊN
      for (const r of await tx.reportCongVien.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const { id, moi } = await tao('CONG_VIEN', r.tenCongVien, null, null, {
          vi_tri: r.viTri, dien_tich_m2: r.dienTichM2, so_luong: r.soLuongCay, ghi_chu: r.ghiChu,
          thong_so: ts({ dienTichThamCoM2: r.dienTichThamCoM2, chungLoaiCay: r.chungLoaiCay, nguon: `report_cong_vien ${nam}` }),
          geometry: point(diem(r.toaDoLat, r.toaDoLng)),
        }, null)
        await tx.reportCongVien.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }

      // 6) CẤP NƯỚC
      for (const r of await tx.reportCapNuoc.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const { id, moi } = await tao('CAP_NUOC', r.tuyenDuong, null, null, {
          vi_tri: r.diaChi, so_luong: r.soHoGiaDinh, ghi_chu: r.ghiChu,
          thong_so: ts({ hienTrang: r.hienTrang, duKienNguon: r.duKienNguon, nguon: `report_cap_nuoc ${nam}` }),
        }, r.tuyenDuong)
        await tx.reportCapNuoc.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }

      // 7) BÃI ĐỖ XE
      for (const r of await tx.reportBaiDoXe.findMany({ where: { wardId, year: nam, doiTuongId: null }, orderBy: { createdAt: 'asc' } })) {
        const { id, moi } = await tao('BAI_DO_XE', r.tenBai, null, null, {
          vi_tri: r.diaDiem, dien_tich_m2: r.dienTichM2, so_luong: r.soViTriDo, ghi_chu: r.ghiChu,
          thong_so: ts({ coTramSacDien: r.coTramSacDien, nguon: `report_bai_do_xe ${nam}` }),
        }, null)
        await tx.reportBaiDoXe.update({ where: { id: r.id }, data: { doiTuongId: id } })
        dem(moi)
      }
    }, { timeout: 120_000, maxWait: 10_000 })
  } catch (e) {
    return { ...rong, error: loiCsdl(e) }
  }
  revalidatePath(`${DUONG_DAN}/${maXa}`)
  return kq
}
