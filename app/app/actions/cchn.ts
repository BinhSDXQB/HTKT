'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireDeptAccess } from '@/lib/auth'
import { LINH_VUC } from '@/lib/cchn/danh-muc'
import { thanhPhanApDung } from '@/lib/cchn/danh-gia'

// Hồ sơ đề nghị cấp chứng chỉ hành nghề HĐXD — Phòng QLHĐ-XD (NĐ 212/2026 Đ27–40). Bảng: cchn_ho_so,
// cchn_kinh_nghiem (migration 047). Khi cấp: ghi sổ httt_nang_luc_ca_nhan + mã định danh trong CÙNG transaction.
// Đã qua phản biện Codex 14/10/2026: cập nhật có điều kiện (không ghi đè hồ sơ đã cấp), thử lại khi trùng mã hồ sơ,
// cấp chứng chỉ atomic + chặn ở server (kết quả Hội đồng, thông báo, đủ thành phần), thời hạn người nước ngoài.

const DEPT = 'PHONG_QLHD_XD'
const DUONG_DAN = '/dashboard/phong-qlhd-xd/chung-chi-nha-thau/ho-so'

export type KinhNghiemForm = {
  tenCongTrinh: string; diaDiem: string; chuDauTu: string; loaiCongTrinh: string
  capCongTrinh: string; nhomDuAn: string; capPheDuyetQh: string; loaiQuyHoach: string
  vaiTro: string; phanViec: string; tuNgay: string; denNgay: string
  taiLieu: string; soHieuTaiLieu: string; phuHopNoiDung: '' | 'co' | 'khong'; ghiChu: string
}

export type HoSoForm = {
  id?: string
  maHoSo?: string
  loaiThuTuc: 'CAP_MOI' | 'CAP_LAI' | 'CHUYEN_DOI'
  truongHop: string; hinhThucNop: string; ngayNop: string
  hoTen: string; ngaySinh: string; gioiTinh: string; laCongDanVN: boolean; quocTich: string
  maDinhDanh: string; dienThoai: string; email: string; diaChi: string; donViCongTac: string
  trinhDo: string; chuyenNganh: string; coSoDaoTao: string; namTotNghiep: string; soHieuVanBang: string
  vanBangNuocNgoai: boolean; vanBangTrenCsdl: boolean
  linhVuc: string; noiDung: string; loaiCongTrinh: string; hangDeNghi: string; hanhNgheDocLap: boolean
  soCchnCu: string; ngayBatDauKn: string; nguonBatDauKn: string
  thanhPhan: Record<string, boolean>
  trangThai: string; ngayYeuCauBoSung: string; noiDungBoSung: string; ngayNhanDu: string
  ngayHoiDong: string; hangHoiDong: string; ketLuanHoiDong: string; ngayThongBao: string
  ngayCap: string; soChungChi: string; ghiChu: string
  nangLucCaNhanId?: string | null
  kinhNghiem: KinhNghiemForm[]
}

export type HoSoRow = {
  id: string; maHoSo: string; hoTen: string; maDinhDanhAn: string | null; loaiThuTuc: string
  linhVuc: string | null; hangDeNghi: string | null; ngayNop: string; trangThai: string; soChungChi: string | null
}

export type KetQua = { ok: boolean; error?: string; id?: string; maHoSo?: string }

const d2s = (d: Date | null | undefined) =>
  d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` : ''
const s2d = (s?: string | null) => {
  const m = s?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))   // 00:00 UTC, khớp kiểu DATE
  return Number.isNaN(d.getTime()) ? null : d
}
const laTrungMa = (e: unknown) => (e as { code?: string })?.code === 'P2002'
const t = (s?: string | null) => (s && s.trim() ? s.trim() : null)
const anMa = (m: string | null) => (m && m.length > 4 ? `${'•'.repeat(m.length - 4)}${m.slice(-4)}` : m)

export async function listHoSo(): Promise<HoSoRow[]> {
  await requireDeptAccess(DEPT)
  const rows = await db.cchn_ho_so.findMany({
    where: { deleted_at: null }, orderBy: [{ ngay_nop: 'desc' }, { created_at: 'desc' }], take: 500,
    select: { id: true, ma_ho_so: true, ho_ten: true, ma_dinh_danh: true, loai_thu_tuc: true, linh_vuc: true,
      hang_de_nghi: true, ngay_nop: true, trang_thai: true, so_chung_chi: true },
  })
  return rows.map((r) => ({
    id: r.id, maHoSo: r.ma_ho_so, hoTen: r.ho_ten, maDinhDanhAn: anMa(r.ma_dinh_danh), loaiThuTuc: r.loai_thu_tuc,
    linhVuc: r.linh_vuc, hangDeNghi: r.hang_de_nghi, ngayNop: d2s(r.ngay_nop), trangThai: r.trang_thai, soChungChi: r.so_chung_chi,
  }))
}

export async function getHoSo(id: string): Promise<HoSoForm | null> {
  await requireDeptAccess(DEPT)
  const r = await db.cchn_ho_so.findFirst({
    where: { id, deleted_at: null },
    include: { cchn_kinh_nghiem: { orderBy: { stt: 'asc' } } },
  })
  if (!r) return null
  return {
    id: r.id, maHoSo: r.ma_ho_so,
    loaiThuTuc: r.loai_thu_tuc as HoSoForm['loaiThuTuc'], truongHop: r.truong_hop ?? '', hinhThucNop: r.hinh_thuc_nop, ngayNop: d2s(r.ngay_nop),
    hoTen: r.ho_ten, ngaySinh: d2s(r.ngay_sinh), gioiTinh: r.gioi_tinh ?? '', laCongDanVN: r.la_cong_dan_vn, quocTich: r.quoc_tich ?? '',
    maDinhDanh: r.ma_dinh_danh ?? '', dienThoai: r.dien_thoai ?? '', email: r.email ?? '', diaChi: r.dia_chi ?? '', donViCongTac: r.don_vi_cong_tac ?? '',
    trinhDo: r.trinh_do ?? '', chuyenNganh: r.chuyen_nganh ?? '', coSoDaoTao: r.co_so_dao_tao ?? '',
    namTotNghiep: r.nam_tot_nghiep ? String(r.nam_tot_nghiep) : '', soHieuVanBang: r.so_hieu_van_bang ?? '',
    vanBangNuocNgoai: r.van_bang_nuoc_ngoai, vanBangTrenCsdl: r.van_bang_tren_csdl,
    linhVuc: r.linh_vuc ?? '', noiDung: r.noi_dung ?? '', loaiCongTrinh: r.loai_cong_trinh ?? '', hangDeNghi: r.hang_de_nghi ?? '',
    hanhNgheDocLap: r.hanh_nghe_doc_lap, soCchnCu: r.so_cchn_cu ?? '', ngayBatDauKn: d2s(r.ngay_bat_dau_kn), nguonBatDauKn: r.nguon_bat_dau_kn ?? '',
    thanhPhan: (r.thanh_phan ?? {}) as Record<string, boolean>,
    trangThai: r.trang_thai, ngayYeuCauBoSung: d2s(r.ngay_yeu_cau_bo_sung), noiDungBoSung: r.noi_dung_bo_sung ?? '', ngayNhanDu: d2s(r.ngay_nhan_du),
    ngayHoiDong: d2s(r.ngay_hoi_dong), hangHoiDong: r.hang_hoi_dong ?? '', ketLuanHoiDong: r.ket_luan_hoi_dong ?? '', ngayThongBao: d2s(r.ngay_thong_bao),
    ngayCap: d2s(r.ngay_cap), soChungChi: r.so_chung_chi ?? '', ghiChu: r.ghi_chu ?? '', nangLucCaNhanId: r.nang_luc_ca_nhan_id,
    kinhNghiem: r.cchn_kinh_nghiem.map((k) => ({
      tenCongTrinh: k.ten_cong_trinh, diaDiem: k.dia_diem ?? '', chuDauTu: k.chu_dau_tu ?? '', loaiCongTrinh: k.loai_cong_trinh ?? '',
      capCongTrinh: k.cap_cong_trinh ?? '', nhomDuAn: k.nhom_du_an ?? '', capPheDuyetQh: k.cap_phe_duyet_qh ?? '', loaiQuyHoach: k.loai_quy_hoach ?? '',
      vaiTro: k.vai_tro, phanViec: k.phan_viec ?? '', tuNgay: d2s(k.tu_ngay), denNgay: d2s(k.den_ngay),
      taiLieu: k.tai_lieu ?? '', soHieuTaiLieu: k.so_hieu_tai_lieu ?? '',
      phuHopNoiDung: k.phu_hop_noi_dung === null ? '' : k.phu_hop_noi_dung ? 'co' : 'khong', ghiChu: k.ghi_chu ?? '',
    })),
  }
}

function kiemTra(f: HoSoForm): string | null {
  if (!f.hoTen?.trim()) return 'Vui lòng nhập họ tên người đề nghị.'
  if (!s2d(f.ngayNop)) return 'Vui lòng nhập ngày nộp hồ sơ.'
  if (f.laCongDanVN && f.maDinhDanh.trim() && !/^\d{12}$/.test(f.maDinhDanh.trim())) return 'Số định danh cá nhân phải gồm 12 chữ số.'
  if (f.namTotNghiep && !/^\d{4}$/.test(f.namTotNghiep.trim())) return 'Năm tốt nghiệp phải là 4 chữ số.'
  for (const [i, k] of f.kinhNghiem.entries()) {
    if (!k.tenCongTrinh.trim()) return `Công trình dòng ${i + 1}: chưa nhập tên.`
    if (!k.vaiTro) return `Công trình dòng ${i + 1}: chưa chọn vai trò.`
    const tu = s2d(k.tuNgay), den = s2d(k.denNgay)
    if (tu && den && tu > den) return `Công trình dòng ${i + 1}: "từ ngày" sau "đến ngày".`
  }
  if (f.trangThai === 'DA_CAP') return 'Dùng nút "Cấp chứng chỉ" để chuyển sang trạng thái đã cấp.'
  return null
}

async function sinhMaHoSo(nam: number): Promise<string> {
  const tienTo = `CCHN-${nam}-`
  const cuoi = await db.cchn_ho_so.findFirst({ where: { ma_ho_so: { startsWith: tienTo } }, orderBy: { ma_ho_so: 'desc' }, select: { ma_ho_so: true } })
  const so = cuoi ? Number(cuoi.ma_ho_so.slice(tienTo.length)) + 1 : 1
  return `${tienTo}${String(so).padStart(4, '0')}`
}

export async function saveHoSo(f: HoSoForm): Promise<KetQua> {
  const user = await requireDeptAccess(DEPT)
  const loi = kiemTra(f)
  if (loi) return { ok: false, error: loi }

  const data = {
    loai_thu_tuc: f.loaiThuTuc, truong_hop: t(f.truongHop), hinh_thuc_nop: f.hinhThucNop || 'TRUC_TUYEN', ngay_nop: s2d(f.ngayNop)!,
    ho_ten: f.hoTen.trim(), ngay_sinh: s2d(f.ngaySinh), gioi_tinh: t(f.gioiTinh), la_cong_dan_vn: f.laCongDanVN,
    quoc_tich: f.laCongDanVN ? 'Việt Nam' : t(f.quocTich), loai_ma: f.laCongDanVN ? 'SO_DINH_DANH_CN' : 'HO_CHIEU',
    ma_dinh_danh: t(f.maDinhDanh), dien_thoai: t(f.dienThoai), email: t(f.email), dia_chi: t(f.diaChi), don_vi_cong_tac: t(f.donViCongTac),
    trinh_do: t(f.trinhDo), chuyen_nganh: t(f.chuyenNganh), co_so_dao_tao: t(f.coSoDaoTao),
    nam_tot_nghiep: f.namTotNghiep ? Number(f.namTotNghiep) : null, so_hieu_van_bang: t(f.soHieuVanBang),
    van_bang_nuoc_ngoai: f.vanBangNuocNgoai, van_bang_tren_csdl: f.vanBangTrenCsdl,
    linh_vuc: t(f.linhVuc), noi_dung: t(f.noiDung), loai_cong_trinh: t(f.loaiCongTrinh), hang_de_nghi: t(f.hangDeNghi),
    hanh_nghe_doc_lap: f.hanhNgheDocLap, so_cchn_cu: t(f.soCchnCu), ngay_bat_dau_kn: s2d(f.ngayBatDauKn), nguon_bat_dau_kn: t(f.nguonBatDauKn),
    thanh_phan: f.thanhPhan ?? {},
    trang_thai: f.trangThai || 'MOI_TIEP_NHAN', ngay_yeu_cau_bo_sung: s2d(f.ngayYeuCauBoSung), noi_dung_bo_sung: t(f.noiDungBoSung),
    ngay_nhan_du: s2d(f.ngayNhanDu), ngay_hoi_dong: s2d(f.ngayHoiDong), hang_hoi_dong: t(f.hangHoiDong), ket_luan_hoi_dong: t(f.ketLuanHoiDong),
    ngay_thong_bao: s2d(f.ngayThongBao), ghi_chu: t(f.ghiChu), updated_at: new Date(),
  }
  const dongKn = f.kinhNghiem.map((k, i) => ({
    stt: i + 1, ten_cong_trinh: k.tenCongTrinh.trim(), dia_diem: t(k.diaDiem), chu_dau_tu: t(k.chuDauTu), loai_cong_trinh: t(k.loaiCongTrinh),
    cap_cong_trinh: t(k.capCongTrinh), nhom_du_an: t(k.nhomDuAn), cap_phe_duyet_qh: t(k.capPheDuyetQh), loai_quy_hoach: t(k.loaiQuyHoach),
    vai_tro: k.vaiTro, phan_viec: t(k.phanViec), tu_ngay: s2d(k.tuNgay), den_ngay: s2d(k.denNgay),
    tai_lieu: t(k.taiLieu), so_hieu_tai_lieu: t(k.soHieuTaiLieu),
    phu_hop_noi_dung: k.phuHopNoiDung === '' ? null : k.phuHopNoiDung === 'co', ghi_chu: t(k.ghiChu),
  }))

  try {
    if (f.id) {
      const id = f.id
      const ketQua = await db.$transaction(async (tx) => {
        // Điều kiện trong chính câu UPDATE: không ghi đè hồ sơ đã cấp/đã xoá dù có thao tác đồng thời.
        const n = await tx.cchn_ho_so.updateMany({ where: { id, deleted_at: null, trang_thai: { not: 'DA_CAP' } }, data })
        if (n.count !== 1) return null
        await tx.cchn_kinh_nghiem.deleteMany({ where: { ho_so_id: id } })
        if (dongKn.length) await tx.cchn_kinh_nghiem.createMany({ data: dongKn.map((k) => ({ ...k, ho_so_id: id })) })
        return tx.cchn_ho_so.findUnique({ where: { id }, select: { ma_ho_so: true } })
      })
      if (!ketQua) return { ok: false, error: 'Không lưu được: hồ sơ không còn hoặc đã cấp chứng chỉ (thay đổi chứng chỉ thực hiện qua thủ tục cấp lại).' }
      revalidatePath(DUONG_DAN)
      return { ok: true, id, maHoSo: ketQua.ma_ho_so }
    }
    for (let lan = 0; lan < 5; lan++) {
      const maHoSo = await sinhMaHoSo(data.ngay_nop.getUTCFullYear())
      try {
        const created = await db.cchn_ho_so.create({
          data: { ...data, ma_ho_so: maHoSo, created_by_id: user.id, to_chuc_id: user.toChucId, cchn_kinh_nghiem: { create: dongKn } },
          select: { id: true },
        })
        revalidatePath(DUONG_DAN)
        return { ok: true, id: created.id, maHoSo }
      } catch (e) {
        if (!laTrungMa(e)) throw e   // trùng mã do tạo đồng thời → sinh lại mã
      }
    }
    return { ok: false, error: 'Không sinh được mã hồ sơ, vui lòng thử lại.' }
  } catch (e) {
    console.error('[saveHoSo]', e)
    return { ok: false, error: 'Lỗi lưu hồ sơ, vui lòng thử lại.' }
  }
}

/**
 * Cấp chứng chỉ. Chặn ở server:
 *  - cấp mới/chuyển đổi: trạng thái "Đủ điều kiện" + đã có ngày kết quả Hội đồng, hạng Hội đồng, ngày thông báo (Đ30 k2, k4);
 *  - đủ thành phần hồ sơ theo Đ39;
 *  - thời hạn: công dân VN cấp mới/chuyển đổi = 10 năm; người nước ngoài theo giấy phép lao động/thẻ tạm trú, ≤ 10 năm;
 *    cấp lại = theo chứng chỉ cũ (Đ27 k5).
 * Ghi sổ httt_nang_luc_ca_nhan + mã định danh + chuyển hồ sơ sang DA_CAP trong CÙNG một transaction.
 */
export async function capChungChi(id: string, p: { soChungChi: string; ngayCap: string; thoiHan?: string; coQuanCap?: string }): Promise<KetQua> {
  await requireDeptAccess(DEPT)
  const hs = await db.cchn_ho_so.findFirst({ where: { id, deleted_at: null } })
  if (!hs) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  if (hs.trang_thai === 'DA_CAP') return { ok: false, error: 'Hồ sơ đã cấp chứng chỉ.' }
  const capLai = hs.loai_thu_tuc === 'CAP_LAI'
  if (!capLai) {
    if (hs.trang_thai !== 'DU_DIEU_KIEN') return { ok: false, error: 'Chỉ cấp khi hồ sơ ở trạng thái "Đủ điều kiện" (Đ30 k2, k4).' }
    if (!hs.ngay_hoi_dong || !hs.hang_hoi_dong || !hs.ngay_thong_bao) {
      return { ok: false, error: 'Cần nhập ngày có kết quả Hội đồng, hạng Hội đồng đánh giá và ngày thông báo kết quả trước khi cấp (Đ30 k4).' }
    }
  }
  const tp = (hs.thanh_phan ?? {}) as Record<string, boolean>
  const thieu = thanhPhanApDung({ loaiThuTuc: hs.loai_thu_tuc as 'CAP_MOI', truongHop: hs.truong_hop, laCongDanVN: hs.la_cong_dan_vn,
    vanBangTrenCsdl: hs.van_bang_tren_csdl, soCchnCu: hs.so_cchn_cu, hanhNgheDocLap: hs.hanh_nghe_doc_lap }).filter((x) => !tp[x.key])
  if (thieu.length) return { ok: false, error: `Còn thiếu thành phần hồ sơ (Đ39): ${thieu.map((x) => x.label).join('; ')}` }

  const ngayCap = s2d(p.ngayCap)
  if (!p.soChungChi?.trim() || !ngayCap) return { ok: false, error: 'Nhập số chứng chỉ và ngày cấp.' }
  const muoiNam = new Date(ngayCap); muoiNam.setUTCFullYear(muoiNam.getUTCFullYear() + 10)
  let thoiHan = s2d(p.thoiHan)
  if (capLai && !thoiHan) return { ok: false, error: 'Cấp lại: nhập thời hạn theo chứng chỉ cũ (Đ27 k5).' }
  if (!capLai && !hs.la_cong_dan_vn) {
    if (!thoiHan) return { ok: false, error: 'Người nước ngoài: nhập thời hạn theo giấy phép lao động hoặc thẻ tạm trú (Đ27 k5).' }
    if (thoiHan > muoiNam) return { ok: false, error: 'Thời hạn chứng chỉ của người nước ngoài không quá 10 năm (Đ27 k5).' }
  }
  if (!thoiHan) thoiHan = muoiNam
  if (thoiHan <= ngayCap) return { ok: false, error: 'Thời hạn phải sau ngày cấp.' }

  const lv = LINH_VUC.find((x) => x.value === hs.linh_vuc)
  const loaiMa = hs.la_cong_dan_vn ? 'SO_DINH_DANH_CN' : 'HO_CHIEU'
  const soCC = p.soChungChi.trim()
  try {
    const xong = await db.$transaction(async (tx) => {
      // Giữ chỗ hồ sơ trước: nếu thao tác khác đã cấp/đổi trạng thái thì dừng, không tạo bản ghi năng lực mồ côi.
      const giu = await tx.cchn_ho_so.updateMany({
        where: { id, deleted_at: null, trang_thai: capLai ? { not: 'DA_CAP' } : 'DU_DIEU_KIEN' },
        data: { trang_thai: 'DA_CAP', so_chung_chi: soCC, ngay_cap: ngayCap, updated_at: new Date() },
      })
      if (giu.count !== 1) return false
      // Cấp lại: cùng một chứng chỉ (mã số không đổi — Đ27 k8) → cập nhật dòng sổ cũ nếu tìm thấy theo số chứng chỉ cũ.
      const cu = capLai && hs.so_cchn_cu
        ? await tx.httt_nang_luc_ca_nhan.findFirst({ where: { so_chung_chi: hs.so_cchn_cu.trim(), deleted_at: null }, select: { id: true } })
        : null
      const duLieuNl = {
          ho_ten: hs.ho_ten, ma_dinh_danh: hs.ma_dinh_danh, loai_ma: loaiMa, quoc_tich: hs.quoc_tich,
          linh_vuc_hanh_nghe: lv ? `${lv.label}${hs.noi_dung ? ' — ' + hs.noi_dung : ''}` : null,
          hang_chung_chi: capLai ? hs.hang_de_nghi : hs.hang_hoi_dong,
          thoi_han_chung_chi: thoiHan, co_so_dao_tao: hs.co_so_dao_tao, trinh_do_chuyen_mon: hs.trinh_do,
          so_chung_chi: soCC, loai_cap: hs.loai_thu_tuc, ly_do_cap: hs.truong_hop, quyet_dinh_cap: null,
          co_quan_cap: t(p.coQuanCap) ?? 'Sở Xây dựng tỉnh Quảng Trị', ngay_cap: ngayCap,
          to_chuc_id: hs.to_chuc_id, created_by_id: hs.created_by_id,
          truong_bo_sung: { ho_so_cchn_id: hs.id, ma_ho_so: hs.ma_ho_so },
      }
      const nl = cu
        ? await tx.httt_nang_luc_ca_nhan.update({ where: { id: cu.id }, data: { ...duLieuNl, updated_at: new Date() }, select: { id: true } })
        : await tx.httt_nang_luc_ca_nhan.create({ data: duLieuNl, select: { id: true } })
      let dinhDanhId: string | null = null
      if (hs.ma_dinh_danh) {
        const dd = await tx.httt_dinh_danh.upsert({
          where: { loai_doi_tuong_ma_dinh_danh: { loai_doi_tuong: 'NANG_LUC_CA_NHAN', ma_dinh_danh: hs.ma_dinh_danh } },
          update: { bang_local: 'httt_nang_luc_ca_nhan', id_local: nl.id },
          create: { loai_doi_tuong: 'NANG_LUC_CA_NHAN', ma_dinh_danh: hs.ma_dinh_danh, loai_ma: loaiMa,
            bang_local: 'httt_nang_luc_ca_nhan', id_local: nl.id, trang_thai_dong_bo: 'DA_KHOI_TAO', thoi_diem_khoi_tao: new Date() },
          select: { id: true },
        })
        dinhDanhId = dd.id
        await tx.httt_nang_luc_ca_nhan.update({ where: { id: nl.id }, data: { dinh_danh_id: dinhDanhId } })
      }
      await tx.cchn_ho_so.update({ where: { id }, data: { nang_luc_ca_nhan_id: nl.id } })
      return true
    })
    if (!xong) return { ok: false, error: 'Hồ sơ vừa được thao tác ở nơi khác (đã cấp hoặc đổi trạng thái) — tải lại trang.' }
  } catch (e) {
    console.error('[capChungChi]', e)
    return { ok: false, error: laTrungMa(e) ? 'Số chứng chỉ hoặc mã định danh bị trùng.' : 'Lỗi khi cấp chứng chỉ, vui lòng thử lại.' }
  }
  revalidatePath(DUONG_DAN)
  revalidatePath('/dashboard/nang-luc-hdxd')
  return { ok: true, id }
}

export async function deleteHoSo(id: string): Promise<KetQua> {
  await requireDeptAccess(DEPT)
  const hs = await db.cchn_ho_so.findFirst({ where: { id, deleted_at: null }, select: { trang_thai: true } })
  if (!hs) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  if (hs.trang_thai === 'DA_CAP') return { ok: false, error: 'Không xoá hồ sơ đã cấp chứng chỉ.' }
  await db.cchn_ho_so.update({ where: { id }, data: { deleted_at: new Date() } })
  revalidatePath(DUONG_DAN)
  return { ok: true }
}
