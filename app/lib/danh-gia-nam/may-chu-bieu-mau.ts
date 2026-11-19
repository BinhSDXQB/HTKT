// Lưu dữ liệu NHẬP theo biểu mẫu (cột jsonb "bieuMau", mig 058 v3).
// Cá nhân: Mẫu 2A/2B/2C (phần A, tự nhận mức, bảng III), Mẫu 04 (dòng KPI → tự tính điểm KPI), Mẫu 03 (mức quý, đề xuất xử lý),
// ý kiến đơn vị cấu thành. Tập thể: Mẫu 01 (bảng office_year_dept_reviews). Mẫu 05/06/07: chỉ TỔNG HỢP từ kết quả đã phê duyệt.
// Mọi UPDATE kèm điều kiện trạng thái chưa khoá và kiểm số dòng; chỉ ghi khoá có trong danh sách (bieu-mau-du-lieu.ts).
import 'server-only'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { isLeadership, isOfficeLeader, type CurrentUser } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { duocSuaPhan } from './quyen'
import { tongDiemNam, kiemTraDiemChung, type MucXepLoaiMa } from './tieu-chi'
import {
  oPhanA, chuanHoaPhanA, chuanHoaDongM04, chuanHoaBangIII, chuanHoaMucQuy, chuanHoaMuc, chuanHoaDiemTapThe, kpiTuMau04,
  O_MAU_01, MUC_HOP_LE, duDiemTapThe, oQuaDai, chuanHoaHop, type BieuMauTapThe, type DongTongHop,
} from './bieu-mau-du-lieu'
import { nap, ghiLog, layHoSoTheoId, chucVuNguoiThaoTac, tongHopTheoPhong, type KetQuaThaoTac } from './may-chu'
import type { TrangThaiDanhGia } from './trang-thai'
import { chuanHoaBienBan, thongKeThamDu, kiemTraBienBan, type BienBanHop } from './bien-ban-hop'
import { thanhPhanTrieuTap, layBienBan, chupYKien } from './bien-ban-db'
import { logAction } from '@/lib/audit'

const KHOA = 'Hồ sơ vừa bị khoá hoặc đổi trạng thái; tải lại trang.'
const MO = ['DU_THAO', 'TU_DANH_GIA', 'GUI_NHAN_XET', 'TONG_HOP', 'HOP_DANH_GIA']

export type PhanBieuMau = 'phanA' | 'tuNhanMuc' | 'm04' | 'bangIII' | 'yKienDonViCauThanh' | 'm03' | 'hopTapThe'

/** Lưu một phần biểu mẫu cá nhân. raw = dữ liệu form đã gom theo tên ô. */
export async function luuBieuMauCaNhan(user: CurrentUser, reviewId: string, phan: PhanBieuMau, raw: Record<string, unknown> & { dong?: { A: Record<string, unknown>[]; B: Record<string, unknown>[] } }): Promise<KetQuaThaoTac> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.' }
  const { hs, vaiTro } = n
  if (hs.loaiHoSo !== 'CBCCVC') return { ok: false, loi: 'Biểu mẫu này dành cho hồ sơ đánh giá công chức, viên chức.' }
  const laChinhChuSua = duocSuaPhan('tuDanhGia', hs.trangThai, vaiTro) // chính chủ, bước Tự đánh giá
  const thuKySua = duocSuaPhan('diem', hs.trangThai, vaiTro)
  const nhanXetSua = duocSuaPhan('nhanXet', hs.trangThai, vaiTro)
  const duoc: Record<PhanBieuMau, boolean> = {
    phanA: laChinhChuSua, tuNhanMuc: laChinhChuSua,
    m04: laChinhChuSua || thuKySua, bangIII: laChinhChuSua || thuKySua,
    yKienDonViCauThanh: nhanXetSua && vaiTro.includes('NGUOI_NHAN_XET'), m03: thuKySua,
    // Kết quả họp tập thể phòng: thư ký tổng hợp / lãnh đạo phòng ghi, ở bước Tổng hợp hoặc Họp đánh giá
    hopTapThe: thuKySua && (hs.trangThai === 'TONG_HOP' || hs.trangThai === 'HOP_DANH_GIA'),
  }
  if (!duoc[phan]) return { ok: false, loi: phan === 'phanA' || phan === 'tuNhanMuc' ? 'Chỉ chính chủ được viết phần tự kiểm điểm, và chỉ ở bước "Tự đánh giá".' : 'Bạn không được sửa phần này ở bước hiện tại.' }
  // Chính chủ sửa thì hồ sơ phải còn ở bước Tự đánh giá; người khác thì ở các bước chưa khoá
  const trangThaiChoPhep = laChinhChuSua && !thuKySua && !nhanXetSua ? ['TU_DANH_GIA'] : MO
  const dai = oQuaDai(raw)
  if (dai) return { ok: false, loi: `Ô ${dai} quá dài (tối đa 8.000 ký tự); rút gọn rồi lưu lại.` }

  let giaTri: unknown
  let capNhatKpi: number | null | undefined
  if (phan === 'phanA') {
    const ma = (hs.mauApDung as '2A' | '2B' | '2C' | null) ?? '2C'
    giaTri = { ...(hs.bieuMau.phanA ?? {}), ...chuanHoaPhanA(raw, oPhanA(ma)) }
  } else if (phan === 'tuNhanMuc') giaTri = chuanHoaMuc(raw.tuNhanMuc)
  else if (phan === 'm04') {
    const a = chuanHoaDongM04(raw.dong?.A ?? []), b = chuanHoaDongM04(raw.dong?.B ?? [])
    if (!a.ok) return { ok: false, loi: `Nhóm A: ${a.loi}` }
    if (!b.ok) return { ok: false, loi: `Nhóm B: ${b.loi}` }
    giaTri = { A: a.giaTri, B: b.giaTri }
    capNhatKpi = kpiTuMau04(giaTri as { A: typeof a.giaTri; B: typeof b.giaTri }).tong
  } else if (phan === 'bangIII') {
    const b = chuanHoaBangIII(raw); if (!b.ok) return { ok: false, loi: b.loi }; giaTri = b.giaTri
  } else if (phan === 'yKienDonViCauThanh') giaTri = String(raw.noiDung ?? '').slice(0, 8000)
  else if (phan === 'hopTapThe') {
    // Có biên bản của phòng thì ngày họp, chủ trì, số người dự họp LẤY TỪ BIÊN BẢN (không nhập lệch)
    const bb = hs.toChucId ? await layBienBan(hs.toChucId, hs.nam) : null
    if (bb?.chot) return { ok: false, loi: 'Biên bản họp của đơn vị đã chốt; ý kiến tập thể là một phần biên bản. Mở lại biên bản để sửa.' }
    const vao = bb ? { ...raw, ngayHop: bb.ngayHop ?? '', chuTri: bb.thanhVien.find((x) => x.canBoId === bb.chuTriId)?.hoTen ?? '', soNguoiDuHop: String(thongKeThamDu(bb).coMat) } : raw
    const r = chuanHoaHop(vao); if (!r.ok) return { ok: false, loi: r.loi }; giaTri = r.giaTri
  }
  else {
    giaTri = { ...(hs.bieuMau.m03 ?? {}), mucQuy: { ...(hs.bieuMau.m03?.mucQuy ?? {}), ...chuanHoaMucQuy(raw) }, ...(raw.deXuatXuLy !== undefined ? { deXuatXuLy: String(raw.deXuatXuLy).slice(0, 4000) } : {}) }
  }

  const gt = JSON.stringify(giaTri)
  let so: number
  if (capNhatKpi !== undefined) {
    // Mẫu 04 có dòng → điểm KPI tổng do hệ thống TỰ TÍNH từ các dòng (không nhập tay song song)
    const tong = capNhatKpi === null ? null : tongDiemNam(kiemTraDiemChung(hs.diemChung).tong, capNhatKpi)
    so = await db.$executeRaw`update office_year_reviews set "bieuMau" = jsonb_set("bieuMau", ${[phan]}::text[], ${gt}::jsonb, true), "diemKpiTong" = ${capNhatKpi}, "tongDiem" = ${tong}, "updatedAt" = now() where id = ${hs.id} and "trangThai" = any(${trangThaiChoPhep})`
  } else {
    so = await db.$executeRaw`update office_year_reviews set "bieuMau" = jsonb_set("bieuMau", ${[phan]}::text[], ${gt}::jsonb, true), "updatedAt" = now() where id = ${hs.id} and "trangThai" = any(${trangThaiChoPhep})`
  }
  if (so !== 1) return { ok: false, loi: KHOA }
  await ghiLog(hs.id, 'SUA_NOI_DUNG', user.id, { chiTiet: { bieuMau: phan } })
  return { ok: true, hoSo: (await layHoSoTheoId(hs.id))! }
}

// ── Tập thể (Mẫu 01) ────────────────────────────────────────────────────────
export type HoSoTapThe = {
  id: string; toChucId: string; nam: number; trangThai: TrangThaiDanhGia; bieuMau: BieuMauTapThe
  mucTuDeXuat: MucXepLoaiMa | null; mucPheDuyet: MucXepLoaiMa | null; pheDuyetAt: Date | null
}

function hangTapThe(r: Record<string, unknown>): HoSoTapThe {
  return { id: String(r.id), toChucId: String(r.toChucId), nam: Number(r.nam), trangThai: r.trangThai as TrangThaiDanhGia, bieuMau: (r.bieuMau as BieuMauTapThe) ?? {},
    mucTuDeXuat: (r.mucTuDeXuat as MucXepLoaiMa) ?? null, mucPheDuyet: (r.mucPheDuyet as MucXepLoaiMa) ?? null, pheDuyetAt: (r.pheDuyetAt as Date) ?? null }
}

export async function layHoSoTapThe(toChucId: string, nam: number): Promise<HoSoTapThe | null> {
  const r = await db.$queryRaw<Record<string, unknown>[]>`select * from office_year_dept_reviews where "toChucId" = ${toChucId} and nam = ${nam}`
  return r[0] ? hangTapThe(r[0]) : null
}

/** Quyền trên hồ sơ tập thể: soạn = Trưởng phòng của CHÍNH phòng đó (theo hồ sơ cán bộ) hoặc VP/người quản lý đánh giá; duyệt = lãnh đạo Sở / quyền phê duyệt. */
export async function quyenTapThe(user: CurrentUser, toChucId: string): Promise<{ xem: boolean; soan: boolean; duyet: boolean }> {
  const v = await chucVuNguoiThaoTac(user)
  const quanLy = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'annual_evaluation_manage')
  const truongPhong = v.cap === 3 && v.toChucId === toChucId
  const duyet = isLeadership(user) || hasPermission(user.permissions, MODULES.OFFICE, 'annual_evaluation_approve')
  const xem = duyet || quanLy || ((v.cap === 3 || v.cap === 4) && v.toChucId === toChucId)
  return { xem, soan: truongPhong || quanLy, duyet }
}

export type KetQuaTapThe = { ok: true; hoSo: HoSoTapThe } | { ok: false; loi: string }

export async function taoHoSoTapThe(user: CurrentUser, toChucId: string, nam: number): Promise<KetQuaTapThe> {
  const q = await quyenTapThe(user, toChucId)
  if (!q.soan) return { ok: false, loi: 'Chỉ Trưởng phòng của phòng này hoặc Văn phòng Sở được lập báo cáo tập thể.' }
  const d = await tongHopTheoPhong(toChucId, nam)
  await db.$executeRaw`insert into office_year_dept_reviews (id, "toChucId", nam, "duThaoNhanXet", "createdById") values (${randomUUID()}, ${toChucId}, ${nam}, ${JSON.stringify(d?.duThao ?? [])}::jsonb, ${user.id}) on conflict ("toChucId", nam) do nothing`
  const h = await layHoSoTapThe(toChucId, nam)
  return h ? { ok: true, hoSo: h } : { ok: false, loi: 'Không lập được hồ sơ.' }
}

export async function luuTapThe(user: CurrentUser, toChucId: string, nam: number, phan: 'phanA' | 'diem' | 'bangIII' | 'mucTuDeXuat', raw: Record<string, unknown>): Promise<KetQuaTapThe> {
  const q = await quyenTapThe(user, toChucId)
  if (!q.soan) return { ok: false, loi: 'Bạn không có quyền soạn báo cáo tập thể của phòng này.' }
  const h = await layHoSoTapThe(toChucId, nam)
  if (!h) return { ok: false, loi: 'Chưa lập hồ sơ tập thể.' }
  if (!MO.includes(h.trangThai)) return { ok: false, loi: 'Báo cáo đã trình hoặc đã phê duyệt, không sửa được.' }
  const dai = oQuaDai(raw)
  if (dai) return { ok: false, loi: `Ô ${dai} quá dài (tối đa 8.000 ký tự).` }
  let so: number
  if (phan === 'mucTuDeXuat') {
    const m = chuanHoaMuc(raw.muc)
    so = await db.$executeRaw`update office_year_dept_reviews set "mucTuDeXuat" = ${m}, "updatedAt" = now() where id = ${h.id} and "trangThai" = any(${MO})`
  } else {
    let gt: unknown
    if (phan === 'phanA') gt = { ...(h.bieuMau.phanA ?? {}), ...chuanHoaPhanA(raw, O_MAU_01) }
    else if (phan === 'bangIII') { const b = chuanHoaBangIII(raw); if (!b.ok) return { ok: false, loi: b.loi }; gt = b.giaTri }
    else { const d = chuanHoaDiemTapThe(raw); if (!d.ok) return { ok: false, loi: d.loi }; gt = d.giaTri }
    const khoa = phan === 'diem' ? null : phan
    so = khoa
      ? await db.$executeRaw`update office_year_dept_reviews set "bieuMau" = jsonb_set("bieuMau", ${[khoa]}::text[], ${JSON.stringify(gt)}::jsonb, true), "updatedAt" = now() where id = ${h.id} and "trangThai" = any(${MO})`
      : await db.$executeRaw`update office_year_dept_reviews set "bieuMau" = "bieuMau" || ${JSON.stringify(gt)}::jsonb, "updatedAt" = now() where id = ${h.id} and "trangThai" = any(${MO})`
  }
  if (so !== 1) return { ok: false, loi: KHOA }
  return { ok: true, hoSo: (await layHoSoTapThe(toChucId, nam))! }
}

/** Tập thể: trình (người soạn) → phê duyệt với mức do người duyệt chọn (lãnh đạo Sở) → lưu; trả về có lý do. Không tự quyết. */
export async function chuyenBuocTapThe(user: CurrentUser, toChucId: string, nam: number, thaoTac: 'trinh' | 'duyet' | 'luu' | 'traVe', muc?: string, lyDo?: string): Promise<KetQuaTapThe> {
  const q = await quyenTapThe(user, toChucId)
  const h = await layHoSoTapThe(toChucId, nam)
  if (!h) return { ok: false, loi: 'Chưa lập hồ sơ tập thể.' }
  let so = 0
  if (thaoTac === 'trinh') {
    if (!q.soan) return { ok: false, loi: 'Bạn không có quyền trình.' }
    if (!duDiemTapThe(h.bieuMau)) return { ok: false, loi: 'Chưa đủ điểm cả 6 tiêu chí chung và 2 điểm KPI để trình.' }
    if (!h.mucTuDeXuat) return { ok: false, loi: 'Chưa có mức tập thể tự đề xuất.' }
    // Kiểm đủ điểm NGAY TRONG câu UPDATE (dữ liệu có thể vừa bị người khác xoá) và ghi người trình để chặn tự duyệt
    so = await db.$executeRaw`update office_year_dept_reviews set "trangThai" = 'TRINH_PHE_DUYET', "bieuMau" = jsonb_set("bieuMau", '{trinh}', jsonb_build_object('boi', ${user.id}::text, 'luc', now()::text), true), "updatedAt" = now()
      where id = ${h.id} and "trangThai" = any(${MO}) and "mucTuDeXuat" is not null
        and jsonb_array_length(coalesce("bieuMau"->'diemChung6', '[]'::jsonb)) = 6
        and not exists (select 1 from jsonb_array_elements(coalesce("bieuMau"->'diemChung6', '[]'::jsonb)) e where e = 'null'::jsonb)
        and "bieuMau"->'kpiA' is not null and "bieuMau"->'kpiA' <> 'null'::jsonb and "bieuMau"->'kpiB' is not null and "bieuMau"->'kpiB' <> 'null'::jsonb`
  } else if (thaoTac === 'duyet') {
    if (!q.duyet) return { ok: false, loi: 'Chỉ lãnh đạo Sở (hoặc người được cấp quyền phê duyệt) được phê duyệt.' }
    if (!muc || !MUC_HOP_LE.includes(muc as MucXepLoaiMa)) return { ok: false, loi: 'Người phê duyệt phải chọn mức xếp loại tập thể.' }
    // Người phê duyệt phải KHÁC người lập và người trình
    so = await db.$executeRaw`update office_year_dept_reviews set "trangThai" = 'DA_PHE_DUYET', "mucPheDuyet" = ${muc}, "pheDuyetById" = ${user.id}, "pheDuyetAt" = now(), "updatedAt" = now()
      where id = ${h.id} and "trangThai" = 'TRINH_PHE_DUYET' and coalesce("bieuMau"->'trinh'->>'boi', '') <> ${user.id} and coalesce("createdById", '') <> ${user.id}`
    if (so !== 1) {
      const lai = await layHoSoTapThe(toChucId, nam)
      if (lai?.trangThai === 'TRINH_PHE_DUYET') return { ok: false, loi: 'Người lập hoặc người trình không được tự phê duyệt báo cáo tập thể.' }
    }
  } else if (thaoTac === 'luu') {
    if (!q.soan && !q.duyet) return { ok: false, loi: 'Bạn không có quyền.' }
    so = await db.$executeRaw`update office_year_dept_reviews set "trangThai" = 'LUU_HO_SO', "updatedAt" = now() where id = ${h.id} and "trangThai" = 'DA_PHE_DUYET'`
  } else {
    if (!q.duyet) return { ok: false, loi: 'Chỉ người phê duyệt được trả báo cáo đã trình về.' }
    if (!lyDo?.trim()) return { ok: false, loi: 'Cần nêu lý do trả về.' }
    so = await db.$executeRaw`update office_year_dept_reviews set "trangThai" = 'DU_THAO', "ghiChu" = ${`Trả về: ${lyDo.trim()}`}, "updatedAt" = now() where id = ${h.id} and "trangThai" = 'TRINH_PHE_DUYET'`
  }
  if (so !== 1) return { ok: false, loi: KHOA }
  return { ok: true, hoSo: (await layHoSoTapThe(toChucId, nam))! }
}

// ── Mẫu 05 / 06 / 07 (tổng hợp toàn Sở, chỉ mức ĐÃ PHÊ DUYỆT) ────────────────
export function duocXemTongHopSo(user: CurrentUser): boolean {
  return isLeadership(user) || isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'annual_evaluation_manage')
}

export async function duLieuTongHopSo(nam: number): Promise<DongTongHop[]> {
  const r = await db.$queryRaw<{ hoTen: string; chucVu: string | null; phong: string | null; doiTuong: string | null; laLanhDao: boolean | null; muc: string | null }[]>`
    select cb."hoTen", cb."chucVu", tc.ten phong, cb."doiTuong", cd."isLanhDao" "laLanhDao", r."mucPheDuyet" muc
    from office_year_reviews r join can_bo cb on cb.id = r."canBoId"
    left join to_chuc tc on tc.id = coalesce(r."toChucId", cb."toChucId") left join chuc_danh cd on cd.id = cb."chucDanhId"
    where r.nam = ${nam} and r."loaiHoSo" = 'CBCCVC' and r."trangThai" in ('DA_PHE_DUYET', 'LUU_HO_SO')
    order by cd."capQuanLy" nulls last, cb."hoTen"`
  return r.map((x) => ({
    hoTen: x.hoTen, viTri: [x.chucVu, x.phong].filter(Boolean).join(', '),
    doiTuong: (x.doiTuong as DongTongHop['doiTuong']) ?? null, laLanhDao: !!x.laLanhDao, muc: (x.muc as MucXepLoaiMa) ?? null,
  }))
}

// ── Biên bản cuộc họp nhận xét, đánh giá cuối năm (một biên bản / phòng / năm) ─────────
// Vòng đời: soạn (sửa nhiều lần, chặn ghi đè đồng thời bằng phienBan) → CHỐT (biên bản đã thông qua: khoá, chụp ý kiến từng người)
// → hồ sơ cá nhân trình theo bản chốt. Mở lại chỉ khi chưa có hồ sơ nào của đơn vị đã trình/đã duyệt. Tách khỏi trạng thái Mẫu 01.
const KHOA_BB = 'Biên bản vừa được người khác sửa hoặc đã chốt; tải lại trang rồi nhập lại.'
type KqBienBan = { ok: true; bb: BienBanHop } | { ok: false; loi: string }

async function damBaoHangTapThe(toChucId: string, nam: number): Promise<string> {
  // createdById để trống: lập biên bản KHÔNG làm người đó thành "người lập Mẫu 01" (không ảnh hưởng quyền duyệt tập thể)
  await db.$executeRaw`insert into office_year_dept_reviews (id, "toChucId", nam, "duThaoNhanXet") values (${randomUUID()}, ${toChucId}, ${nam}, '[]'::jsonb) on conflict ("toChucId", nam) do nothing`
  return (await layHoSoTapThe(toChucId, nam))!.id
}

/**
 * Lưu biên bản: Trưởng phòng của phòng đó hoặc Văn phòng Sở (quyền soạn tập thể). Thành phần lấy từ hồ sơ cán bộ
 * (thanhPhanTrieuTap) hợp với danh sách đã lưu trước đó (giữ người đã dự họp nhưng sau đó chuyển đi).
 * raw.phienBan phải khớp bản đang lưu (chặn hai người cùng mở form ghi đè nhau).
 */
export async function luuBienBan(user: CurrentUser, toChucId: string, nam: number, raw: Record<string, unknown>): Promise<KqBienBan> {
  const q = await quyenTapThe(user, toChucId)
  if (!q.soan) return { ok: false, loi: 'Chỉ Trưởng phòng của phòng này hoặc Văn phòng Sở được lập biên bản họp.' }
  const tp = await thanhPhanTrieuTap(toChucId)
  if (!tp) return { ok: false, loi: 'Không tìm thấy phòng/đơn vị.' }
  const dai = oQuaDai(raw)
  if (dai) return { ok: false, loi: `Ô ${dai} quá dài (tối đa 8.000 ký tự).` }
  const cu = await layBienBan(toChucId, nam)
  if (cu?.chot) return { ok: false, loi: 'Biên bản đã chốt (đã thông qua). Mở lại biên bản trước khi sửa.' }
  const phienCu = String(raw.phienBan ?? '')
  if ((cu?.phienBan ?? '') !== phienCu) return { ok: false, loi: KHOA_BB }
  const ds = [...tp.ds]
  for (const x of cu?.thanhVien ?? []) if (!ds.some((d) => d.canBoId === x.canBoId)) ds.push({ canBoId: x.canBoId, hoTen: x.hoTen, chucVu: x.chucVu, vaiTro: x.vaiTro })
  const r = chuanHoaBienBan(raw, tp.loai, ds)
  if (!r.ok) return r
  const id = await damBaoHangTapThe(toChucId, nam)
  const bb: BienBanHop = { ...r.giaTri, phienBan: new Date().toISOString() }
  const so = await db.$executeRaw`update office_year_dept_reviews set "bieuMau" = jsonb_set("bieuMau", '{bienBan}', ${JSON.stringify(bb)}::jsonb, true), "updatedAt" = now()
    where id = ${id} and coalesce("bieuMau"->'bienBan'->>'phienBan', '') = ${phienCu} and coalesce(jsonb_typeof("bieuMau"->'bienBan'->'chot'), 'null') = 'null'`
  if (so !== 1) return { ok: false, loi: KHOA_BB }
  await logAction({ userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetId: id, targetType: 'office_year_dept_reviews', detail: `Lưu biên bản họp đánh giá năm ${nam}` })
  return { ok: true, bb }
}

/** Chốt biên bản (đã thông qua tại cuộc họp): chỉ khi không còn lỗi; chụp ý kiến từng người; từ đó Word xuất theo bản chốt. */
export async function chotBienBan(user: CurrentUser, toChucId: string, nam: number, phienBan: string): Promise<KqBienBan> {
  const q = await quyenTapThe(user, toChucId)
  if (!q.soan) return { ok: false, loi: 'Bạn không có quyền chốt biên bản của đơn vị này.' }
  const bb = await layBienBan(toChucId, nam)
  const tp = await thanhPhanTrieuTap(toChucId)
  if (!bb) return { ok: false, loi: 'Chưa lập biên bản.' }
  if (bb.chot) return { ok: false, loi: 'Biên bản đã chốt.' }
  if ((bb.phienBan ?? '') !== phienBan) return { ok: false, loi: KHOA_BB }
  const yKien = await chupYKien(toChucId, nam)
  const loi = kiemTraBienBan(bb, tp?.ds ?? [], yKien.map((y) => y.canBoId)).filter((v) => v.mucDo === 'LOI').map((v) => v.thongDiep)
  const coMat = thongKeThamDu(bb).coMat
  for (const y of yKien) {
    const phieu = Object.values(y.bieuQuyet ?? {}).reduce<number>((t, v) => t + (v ?? 0), 0)
    if (phieu > coMat) loi.push(`${y.hoTen}: tổng phiếu biểu quyết (${phieu}) vượt số người có mặt (${coMat}).`)
  }
  if (loi.length) return { ok: false, loi: `Chưa chốt được: ${loi.slice(0, 3).join(' | ')}` }
  const chot = { luc: new Date().toISOString(), boi: user.id, yKien }
  const moi: BienBanHop = { ...bb, chot, phienBan: chot.luc }
  const so = await db.$executeRaw`update office_year_dept_reviews set "bieuMau" = jsonb_set("bieuMau", '{bienBan}', ${JSON.stringify(moi)}::jsonb, true), "updatedAt" = now()
    where "toChucId" = ${toChucId} and nam = ${nam} and coalesce("bieuMau"->'bienBan'->>'phienBan', '') = ${phienBan} and coalesce(jsonb_typeof("bieuMau"->'bienBan'->'chot'), 'null') = 'null'`
  if (so !== 1) return { ok: false, loi: KHOA_BB }
  await logAction({ userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetType: 'office_year_dept_reviews', targetId: toChucId, detail: `Chốt biên bản họp đánh giá năm ${nam} (${yKien.length} người)` })
  return { ok: true, bb: moi }
}

/** Mở lại biên bản đã chốt (có lý do). Từ chối nếu đã có hồ sơ của đơn vị trình/duyệt theo bản chốt (phải trả về trước). */
export async function moLaiBienBan(user: CurrentUser, toChucId: string, nam: number, lyDo: string): Promise<KqBienBan> {
  const q = await quyenTapThe(user, toChucId)
  if (!q.soan) return { ok: false, loi: 'Bạn không có quyền mở lại biên bản của đơn vị này.' }
  if (!lyDo.trim()) return { ok: false, loi: 'Cần nêu lý do mở lại biên bản.' }
  try {
    const bb = await db.$transaction(async (tx) => {
      // Khoá hàng biên bản trước (chờ giao dịch trình đang chạy xong), rồi mới đếm hồ sơ đã trình bằng truy vấn mới
      const r = await tx.$queryRaw<{ id: string; bb: BienBanHop | null }[]>`select id, "bieuMau"->'bienBan' bb from office_year_dept_reviews where "toChucId" = ${toChucId} and nam = ${nam} for update`
      const hien = r[0]?.bb
      if (!hien?.chot) throw new Error('CHUA_CHOT')
      const daTrinh = await tx.$queryRaw<{ n: number }[]>`select count(*)::int n from office_year_reviews where nam = ${nam} and "loaiHoSo" = 'CBCCVC' and "toChucId" = ${toChucId} and "trangThai" in ('TRINH_PHE_DUYET', 'DA_PHE_DUYET', 'LUU_HO_SO')`
      if (daTrinh[0].n > 0) throw new Error(`DA_TRINH:${daTrinh[0].n}`)
      const moi: BienBanHop = { ...hien, chot: null, phienBan: new Date().toISOString() }
      await tx.$executeRaw`update office_year_dept_reviews set "bieuMau" = jsonb_set("bieuMau", '{bienBan}', ${JSON.stringify(moi)}::jsonb, true), "updatedAt" = now() where id = ${r[0].id}`
      return moi
    })
    await logAction({ userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetType: 'office_year_dept_reviews', targetId: toChucId, detail: `Mở lại biên bản họp đánh giá năm ${nam}: ${lyDo.trim().slice(0, 300)}` })
    return { ok: true, bb }
  } catch (e) {
    if (e instanceof Error && e.message === 'CHUA_CHOT') return { ok: false, loi: 'Biên bản chưa chốt.' }
    if (e instanceof Error && e.message.startsWith('DA_TRINH:')) return { ok: false, loi: `Đã có ${e.message.slice(9)} hồ sơ của đơn vị trình/duyệt theo biên bản này; trả các hồ sơ đó về trước khi mở lại.` }
    throw e
  }
}
