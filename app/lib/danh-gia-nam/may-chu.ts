// Tầng máy chủ của hồ sơ đánh giá cuối năm (PATCH V7.1.1).
// Dùng SQL thô vào 3 bảng của migration 058 (không thêm model Prisma để khỏi đụng client đã sinh).
// Cần migration 058 đã áp; chưa áp thì giao diện báo chưa sẵn sàng (xem kiemTraBang).
// Sau phản biện Codex: mọi UPDATE nội dung kèm điều kiện trạng thái chưa khoá + kiểm số dòng; chuyển bước, nhật ký,
// ghi xếp loại chính thức cùng một giao dịch; sửa từng đoạn nhận xét bằng một câu lệnh nguyên tử.
import 'server-only'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { isLeadership, isOfficeLeader, canViewThongTinDang, type CurrentUser } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { chuyenTrangThai, traVe as traVeBuoc, type TrangThaiDanhGia } from './trang-thai'
import { duocXemHoSo, xacDinhVaiTro, duocSuaPhan, type LoaiHoSo, type NguCanhQuyen } from './quyen'
import { chonMauCaNhan } from './mau-bieu'
import { tongDiemNam, kiemTraDiemChung, type DieuKienXepLoai, type MucXepLoaiMa } from './tieu-chi'
import { tuBanGhi, tongHop, type DongDaoTao } from './dao-tao'
import { soanNhanXet, MUC_NHAN_XET, laDoanThieuDuLieu, type DoDai, type DuKienNhanXet } from './nhan-xet'
import { kiemTraHoSo, kiemTraThanhTichTrung, type DauVaoKiemTra, type DoanNhanXet, type VanDe } from './kiem-tra'
import { tongHopPhong, duThaoNhanXetTapThe, type HoSoTongHop, type TongHopPhong } from './tong-hop-phong'
import type { DuLieuCaNhan } from './xuat-mau'

export const LINH_VUC_DAO_TAO = 'van-phong-so/dao-tao-boi-duong'
const MUC_HOP_LE: readonly string[] = ['HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU']
const KHOA = 'Hồ sơ vừa bị khoá hoặc đổi trạng thái bởi người khác; tải lại trang.'
const GIO_VN = 7 * 3600 * 1000

/** Năm hợp lệ: số nguyên 2000–2100, ngược lại trả null (dùng chung cho trang và action). */
export function chuanNam(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim())
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null
}

export type DoanLuu = DoanNhanXet & { nguoiSua?: string; suaLuc?: string; tuDong?: boolean }

export type HoSoDanhGia = {
  id: string; canBoId: string; nam: number; loaiHoSo: LoaiHoSo; trangThai: TrangThaiDanhGia
  toChucId: string | null; mauApDung: string | null
  tuDanhGia: { noiDung?: string; nguoiSua?: string; suaLuc?: string }
  diemChung: Record<string, number | null>; diemQuy: Record<string, number | null>
  diemKpiTong: number | null; tongDiem: number | null
  nhanXet: DoanLuu[]; nhanXetLanhDao: string | null
  mucDeXuat: MucXepLoaiMa | null; mucPheDuyet: MucXepLoaiMa | null
  pheDuyetById: string | null; pheDuyetAt: Date | null; soQuyetDinh: string | null
}

type CanBoNgan = { id: string; hoTen: string; userId: string | null; toChucId: string | null; laLanhDao: boolean; capQuanLy: number | null; viTri: string | null; chucVu: string | null; tenPhong: string | null }

/** Điều kiện xếp loại lấy từ khoá đặc biệt trong diemQuy: top20 (1/0), soQuyXuatSac, soQuyKHT. */
export function dieuKienTuDiemQuy(q: Record<string, number | null>): DieuKienXepLoai {
  return { trongTop20: q.top20 === 1, soQuyXuatSac: q.soQuyXuatSac ?? 0, soQuyKhongHoanThanh: q.soQuyKHT ?? 0 }
}

export async function kiemTraBang(): Promise<boolean> {
  const r = await db.$queryRaw<{ n: number }[]>`select count(*)::int n from information_schema.tables where table_schema='public' and table_name in ('office_year_reviews','office_year_review_logs','office_year_dept_reviews')`
  return r[0]?.n === 3
}

export async function layCanBo(canBoId: string): Promise<CanBoNgan | null> {
  const cb = await db.canBo.findUnique({
    where: { id: canBoId },
    select: { id: true, hoTen: true, userId: true, toChucId: true, viTriViecLam: true, chucVu: true, chucDanh: { select: { isLanhDao: true, capQuanLy: true } }, toChuc: { select: { ten: true } } },
  })
  if (!cb) return null
  return { id: cb.id, hoTen: cb.hoTen, userId: cb.userId, toChucId: cb.toChucId, laLanhDao: cb.chucDanh?.isLanhDao ?? false, capQuanLy: cb.chucDanh?.capQuanLy ?? null, viTri: cb.viTriViecLam, chucVu: cb.chucVu, tenPhong: cb.toChuc?.ten ?? null }
}

/**
 * Chức vụ của NGƯỜI THAO TÁC lấy từ HỒ SƠ CÁN BỘ của chính họ (phòng + chức danh), không từ tài khoản
 * (users.toChucId) hay cờ isDepartmentLeader bật tay: hai thứ đó có thể lệch/ thiếu so với hồ sơ.
 * Trưởng phòng/Chánh VP (capQuanLy = 3) nhận xét được người cấp dưới CÙNG phòng; Phó phòng (4) chỉ được xem tổng hợp phòng.
 */
async function chucVuNguoiThaoTac(user: CurrentUser): Promise<{ toChucId: string | null; cap: number | null }> {
  const cb = await db.canBo.findFirst({ where: { userId: user.id, trangThai: 'DANG_CONG_TAC' }, select: { toChucId: true, chucDanh: { select: { isLanhDao: true, capQuanLy: true } } } })
  if (!cb || !cb.chucDanh?.isLanhDao) return { toChucId: cb?.toChucId ?? null, cap: null }
  return { toChucId: cb.toChucId, cap: cb.chucDanh.capQuanLy }
}

export async function nguCanhQuyen(user: CurrentUser, cb: Pick<CanBoNgan, 'userId' | 'toChucId'> & { capQuanLy?: number | null }): Promise<NguCanhQuyen> {
  const co = (a: string) => hasPermission(user.permissions, MODULES.OFFICE, a)
  const v = await chucVuNguoiThaoTac(user)
  const capDuoi = cb.capQuanLy === undefined || cb.capQuanLy === null || cb.capQuanLy > 3
  return {
    laChinhChu: !!cb.userId && cb.userId === user.id,
    laLanhDaoSo: isLeadership(user),
    laLanhDaoVanPhong: isOfficeLeader(user),
    laLanhDaoCungPhong: v.cap === 3 && !!v.toChucId && v.toChucId === cb.toChucId && capDuoi,
    coQuyenQuanLyDanhGia: co('annual_evaluation_manage'),
    coQuyenPheDuyet: co('annual_evaluation_approve'),
    coQuyenXemDang: canViewThongTinDang(user, false),
    coQuyenQuanLyDang: co('party_review_manage') || user.role.name === 'admin',
  }
}

const THU_TU_MUC = MUC_NHAN_XET.map((m) => m[0] as string)
function sapDoan(ds: DoanLuu[]): DoanLuu[] {
  const vt = (m: string) => { const i = THU_TU_MUC.indexOf(m); return i < 0 ? 99 : i }
  return [...ds].sort((a, b) => vt(a.muc) - vt(b.muc))
}

function chuyenHang(r: Record<string, unknown>): HoSoDanhGia {
  const so = (v: unknown) => (v === null || v === undefined ? null : Number(v))
  return {
    id: String(r.id), canBoId: String(r.canBoId), nam: Number(r.nam), loaiHoSo: r.loaiHoSo as LoaiHoSo, trangThai: r.trangThai as TrangThaiDanhGia,
    toChucId: (r.toChucId as string) ?? null, mauApDung: (r.mauApDung as string) ?? null,
    tuDanhGia: (r.tuDanhGia as HoSoDanhGia['tuDanhGia']) ?? {}, diemChung: (r.diemChung as HoSoDanhGia['diemChung']) ?? {}, diemQuy: (r.diemQuy as HoSoDanhGia['diemQuy']) ?? {},
    diemKpiTong: so(r.diemKpiTong), tongDiem: so(r.tongDiem), nhanXet: sapDoan((r.nhanXet as DoanLuu[]) ?? []), nhanXetLanhDao: (r.nhanXetLanhDao as string) ?? null,
    mucDeXuat: (r.mucDeXuat as MucXepLoaiMa) ?? null, mucPheDuyet: (r.mucPheDuyet as MucXepLoaiMa) ?? null,
    pheDuyetById: (r.pheDuyetById as string) ?? null, pheDuyetAt: (r.pheDuyetAt as Date) ?? null, soQuyetDinh: (r.soQuyetDinh as string) ?? null,
  }
}

export async function layHoSo(canBoId: string, nam: number, loai: LoaiHoSo): Promise<HoSoDanhGia | null> {
  const r = await db.$queryRaw<Record<string, unknown>[]>`select * from office_year_reviews where "canBoId"=${canBoId} and nam=${nam} and "loaiHoSo"=${loai}`
  return r[0] ? chuyenHang(r[0]) : null
}
export async function layHoSoTheoId(id: string): Promise<HoSoDanhGia | null> {
  const r = await db.$queryRaw<Record<string, unknown>[]>`select * from office_year_reviews where id=${id}`
  return r[0] ? chuyenHang(r[0]) : null
}

type Ghi = Pick<typeof db, '$executeRaw'>
export async function ghiLog(reviewId: string, loai: string, userId: string | null, p: { tu?: string; den?: string; lyDo?: string; chiTiet?: unknown } = {}, c: Ghi = db) {
  await c.$executeRaw`insert into office_year_review_logs (id,"reviewId",loai,"tuTrangThai","denTrangThai","userId","lyDo","chiTiet") values (${randomUUID()},${reviewId},${loai},${p.tu ?? null},${p.den ?? null},${userId},${p.lyDo ?? null},${p.chiTiet === undefined ? null : JSON.stringify(p.chiTiet)}::jsonb)`
}

export type KetQuaThaoTac = { ok: true; hoSo: HoSoDanhGia } | { ok: false; loi: string }

/** Tạo hồ sơ nếu chưa có. Chỉ người có vai trò THU_KY_TONG_HOP (hoặc chính chủ với hồ sơ của mình) mới tạo. */
export async function taoHoSo(user: CurrentUser, canBoId: string, nam: number, loai: LoaiHoSo): Promise<KetQuaThaoTac> {
  const cb = await layCanBo(canBoId)
  if (!cb) return { ok: false, loi: 'Không tìm thấy cán bộ.' }
  const ctx = await nguCanhQuyen(user, cb)
  const vt = xacDinhVaiTro(loai, ctx)
  if (!vt.includes('THU_KY_TONG_HOP') && !vt.includes('CHINH_CHU')) return { ok: false, loi: 'Bạn không có quyền lập hồ sơ đánh giá cho cán bộ này.' }
  const mau = loai === 'CBCCVC' ? chonMauCaNhan({ laNguoiDungDau: cb.capQuanLy === 1, laLanhDaoQuanLy: cb.laLanhDao }) : null
  await db.$executeRaw`insert into office_year_reviews (id,"canBoId",nam,"loaiHoSo","toChucId","mauApDung","createdById") values (${randomUUID()},${canBoId},${nam},${loai},${cb.toChucId},${mau},${user.id}) on conflict ("canBoId",nam,"loaiHoSo") do nothing`
  const hs = await layHoSo(canBoId, nam, loai)
  return hs ? { ok: true, hoSo: hs } : { ok: false, loi: 'Không tạo được hồ sơ.' }
}

async function nap(user: CurrentUser, reviewId: string) {
  const hs = await layHoSoTheoId(reviewId)
  if (!hs) return null
  const cb = await layCanBo(hs.canBoId)
  if (!cb) return null
  // Quyền theo PHÒNG TẠI THỜI ĐIỂM ĐÁNH GIÁ (toChucId lưu trên hồ sơ), không theo phòng hiện tại của cán bộ
  const ctx = await nguCanhQuyen(user, { userId: cb.userId, toChucId: hs.toChucId ?? cb.toChucId, capQuanLy: cb.capQuanLy })
  const vaiTro = xacDinhVaiTro(hs.loaiHoSo, ctx)
  return { hs, cb, ctx, vaiTro, xem: duocXemHoSo(hs.loaiHoSo, ctx) }
}

/** Mở hồ sơ để xem: ghi nhật ký xem với hồ sơ Đảng, ghi từ chối nếu không có quyền. */
export async function moHoSo(user: CurrentUser, reviewId: string) {
  const n = await nap(user, reviewId)
  if (!n) return null
  if (!n.xem) {
    if (n.hs.loaiHoSo === 'DANG_VIEN') await ghiLog(n.hs.id, 'TU_CHOI_TRUY_CAP', user.id)
    return { tuChoi: true as const }
  }
  if (n.hs.loaiHoSo === 'DANG_VIEN') await ghiLog(n.hs.id, 'XEM_HO_SO', user.id)
  return { tuChoi: false as const, ...n }
}

export type BanSua = {
  tuDanhGia?: string; nhanXetLanhDao?: string; diemChung?: Record<string, number | null>; diemQuy?: Record<string, number | null>
  diemKpiTong?: number | null; mucDeXuat?: MucXepLoaiMa | null
}

// Trạng thái còn cho sửa nội dung — kiểm ngay trong câu UPDATE để chặn đua với thao tác trình/duyệt
// (xem duocSuaPhan: từ TRINH_PHE_DUYET trở đi khoá).
export async function luuNoiDung(user: CurrentUser, reviewId: string, b: BanSua): Promise<KetQuaThaoTac> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.' }
  const { hs, vaiTro } = n
  const cam = (p: 'tuDanhGia' | 'nhanXet' | 'diem' | 'mucDeXuat') => !duocSuaPhan(p, hs.trangThai, vaiTro)
  if (b.tuDanhGia !== undefined) {
    if (cam('tuDanhGia')) return { ok: false, loi: 'Chỉ chính chủ được sửa tự đánh giá, và chỉ ở bước "Tự đánh giá".' }
    const so = await db.$executeRaw`update office_year_reviews set "tuDanhGia"=${JSON.stringify({ noiDung: b.tuDanhGia, nguoiSua: user.id, suaLuc: new Date().toISOString() })}::jsonb,"updatedAt"=now() where id=${hs.id} and "trangThai"='TU_DANH_GIA'`
    if (so !== 1) return { ok: false, loi: KHOA }
  }
  if (b.nhanXetLanhDao !== undefined) {
    if (cam('nhanXet')) return { ok: false, loi: 'Bạn không được sửa nhận xét ở bước này.' }
    const so = await db.$executeRaw`update office_year_reviews set "nhanXetLanhDao"=${b.nhanXetLanhDao || null},"updatedAt"=now() where id=${hs.id} and "trangThai" in ('DU_THAO','TU_DANH_GIA','GUI_NHAN_XET','TONG_HOP','HOP_DANH_GIA')`
    if (so !== 1) return { ok: false, loi: KHOA }
  }
  if (b.diemChung !== undefined || b.diemQuy !== undefined || b.diemKpiTong !== undefined) {
    if (cam('diem')) return { ok: false, loi: 'Bạn không được sửa điểm ở bước này.' }
    const diemChung = b.diemChung ?? hs.diemChung
    const kt = kiemTraDiemChung(diemChung)
    if (kt.loi.length) return { ok: false, loi: kt.loi.join('; ') }
    const kpi = b.diemKpiTong === undefined ? hs.diemKpiTong : b.diemKpiTong
    if (kpi !== null && (kpi < 0 || kpi > 100)) return { ok: false, loi: 'Điểm KPI tổng phải từ 0 đến 100.' }
    const tong = kpi === null ? null : tongDiemNam(kt.tong, kpi)
    const so = await db.$executeRaw`update office_year_reviews set "diemChung"=${JSON.stringify(diemChung)}::jsonb,"diemQuy"=${JSON.stringify(b.diemQuy ?? hs.diemQuy)}::jsonb,"diemKpiTong"=${kpi},"tongDiem"=${tong},"updatedAt"=now() where id=${hs.id} and "trangThai" in ('DU_THAO','TU_DANH_GIA','GUI_NHAN_XET','TONG_HOP','HOP_DANH_GIA')`
    if (so !== 1) return { ok: false, loi: KHOA }
  }
  if (b.mucDeXuat !== undefined) {
    if (cam('mucDeXuat')) return { ok: false, loi: 'Bạn không được sửa mức đề xuất ở bước này.' }
    if (b.mucDeXuat !== null && !MUC_HOP_LE.includes(b.mucDeXuat)) return { ok: false, loi: 'Mức xếp loại không hợp lệ.' }
    const so = await db.$executeRaw`update office_year_reviews set "mucDeXuat"=${b.mucDeXuat},"updatedAt"=now() where id=${hs.id} and "trangThai" in ('DU_THAO','TU_DANH_GIA','GUI_NHAN_XET','TONG_HOP','HOP_DANH_GIA')`
    if (so !== 1) return { ok: false, loi: KHOA }
  }
  await ghiLog(hs.id, 'SUA_NOI_DUNG', user.id, { chiTiet: { cacPhan: Object.keys(b) } })
  return { ok: true, hoSo: (await layHoSoTheoId(hs.id))! }
}

/** Sửa MỘT đoạn nhận xét bằng một câu lệnh nguyên tử (không đọc-rồi-ghi cả mảng, nên hai người sửa hai đoạn không đè nhau). */
export async function suaDoanNhanXet(user: CurrentUser, reviewId: string, muc: string, noiDung: string, nguon: string[]): Promise<KetQuaThaoTac> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.' }
  if (!duocSuaPhan('nhanXet', n.hs.trangThai, n.vaiTro)) return { ok: false, loi: 'Bạn không được sửa nhận xét ở bước này.' }
  if (!THU_TU_MUC.includes(muc)) return { ok: false, loi: 'Mục nhận xét không hợp lệ.' }
  // Đoạn sửa tay không còn mang các khẳng định tự động (khangDinh*) của bản tự soạn: nội dung đã khác.
  const moi = JSON.stringify({ muc, noiDung, nguon, nguoiSua: user.id, suaLuc: new Date().toISOString() })
  const so = await db.$executeRaw`update office_year_reviews set "nhanXet"=(select coalesce(jsonb_agg(e),'[]'::jsonb) from jsonb_array_elements("nhanXet") e where e->>'muc' <> ${muc}) || jsonb_build_array(${moi}::jsonb),"updatedAt"=now() where id=${n.hs.id} and "trangThai" in ('DU_THAO','TU_DANH_GIA','GUI_NHAN_XET','TONG_HOP','HOP_DANH_GIA')`
  if (so !== 1) return { ok: false, loi: KHOA }
  await ghiLog(n.hs.id, 'SUA_NOI_DUNG', user.id, { chiTiet: { doan: muc } })
  return { ok: true, hoSo: (await layHoSoTheoId(n.hs.id))! }
}

const chuanTen = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
type BanGhiDaoTao = { id: string; tieuDe: string; ngayGhiNhan: Date | null; customFields: unknown }

/** Nạp MỘT lần toàn bộ bản ghi đào tạo (dùng cho cả phòng, tránh N+1). */
export async function layBanGhiDaoTao(): Promise<BanGhiDaoTao[]> {
  return db.nghiepVuBanGhi.findMany({ where: { linhVuc: LINH_VUC_DAO_TAO, deletedAt: null }, select: { id: true, tieuDe: true, ngayGhiNhan: true, customFields: true } })
}

/** Khớp theo họ tên (học viên là ô chữ). Trùng họ tên với người khác → KHÔNG tự gán, trả cờ để hiển thị. */
export function khopDaoTao(bg: BanGhiDaoTao[], cb: Pick<CanBoNgan, 'id' | 'hoTen'>, nam: number, soNguoiCungTen: number): { dong: DongDaoTao[]; trungTen: boolean } {
  if (soNguoiCungTen > 1) return { dong: [], trungTen: bg.some((b) => chuanTen(String(((b.customFields ?? {}) as Record<string, unknown>).hocVien ?? '')) === chuanTen(cb.hoTen)) }
  const ten = chuanTen(cb.hoTen)
  const ra: DongDaoTao[] = []
  for (const b of bg) {
    const cf = (b.customFields ?? {}) as Record<string, unknown>
    if (chuanTen(String(cf.hocVien ?? '')) !== ten) continue
    const d = tuBanGhi({ id: b.id, canBoId: cb.id, toChucMa: null, tieuDe: b.tieuDe, ngayGhiNhan: b.ngayGhiNhan, customFields: b.customFields }, nam)
    if (d && d.nam === nam) ra.push(d)
  }
  return { dong: ra, trungTen: false }
}

async function demCungTen(hoTen: string): Promise<number> {
  return db.canBo.count({ where: { hoTen: { equals: hoTen, mode: 'insensitive' } } })
}

export async function layDaoTaoCanBo(cb: Pick<CanBoNgan, 'id' | 'hoTen' | 'toChucId'>, nam: number): Promise<DongDaoTao[]> {
  return khopDaoTao(await layBanGhiDaoTao(), cb, nam, await demCungTen(cb.hoTen)).dong
}

function trangThaiTaiNgayChot(c: { trangThai: string; ngayHoanThanh: Date | null }, cuoiNam: Date): string {
  // Việc hoàn thành SAU ngày cuối năm đánh giá thì tại thời điểm chốt năm vẫn là đang làm
  if (c.trangThai === 'HOAN_THANH' && c.ngayHoanThanh && c.ngayHoanThanh.getTime() >= cuoiNam.getTime() - GIO_VN) return 'DANG_LAM'
  return c.trangThai
}

export async function layDuKien(cb: CanBoNgan, nam: number): Promise<DuKienNhanXet> {
  // Cột chỉ có ngày (@db.Date) đọc theo UTC; cột thời điểm (createdAt, ngayHoanThanh) tính theo giờ Việt Nam (UTC+7)
  const dau = new Date(Date.UTC(nam, 0, 1)); const cuoi = new Date(Date.UTC(nam + 1, 0, 1))
  const dauTs = new Date(dau.getTime() - GIO_VN); const cuoiTs = new Date(cuoi.getTime() - GIO_VN)
  const cv = cb.userId ? await db.congViec.findMany({
    where: { nguoiPhuTrachId: cb.userId, deletedAt: null, OR: [{ ngayHetHan: { gte: dau, lt: cuoi } }, { ngayBatDau: { gte: dau, lt: cuoi } }, { createdAt: { gte: dauTs, lt: cuoiTs } }] },
    select: { id: true, tieuDe: true, trangThai: true, tienDo: true, dinhKem: true, ngayHoanThanh: true },
  }) : []
  const kt = await db.officeRewardRecord.findMany({ where: { canBoId: cb.id, nam }, select: { id: true, danhHieu: true, thanhTich: true, rewardTitle: { select: { ten: true } } } })
  const kl = await db.officeDisciplineRecord.findMany({ where: { canBoId: cb.id, tuNgay: { lt: cuoi }, OR: [{ denNgay: null }, { denNgay: { gte: dau } }] }, select: { id: true, hinhThuc: true, lyDo: true } })
  const cungTen = await demCungTen(cb.hoTen)
  const dtk = khopDaoTao(await layBanGhiDaoTao(), cb, nam, cungTen)
  return {
    nam, hoTen: cb.hoTen, tenPhong: cb.tenPhong, chucVu: cb.chucVu, viTriViecLam: cb.viTri, laLanhDaoQuanLy: cb.laLanhDao,
    congViec: cv.map((c) => ({ id: c.id, tieuDe: c.tieuDe, trangThai: trangThaiTaiNgayChot(c, cuoi), tienDo: c.tienDo, soMinhChung: c.dinhKem.length })),
    thanhTich: kt.map((k) => ({ id: k.id, noiDung: `${k.danhHieu ?? k.rewardTitle?.ten ?? 'Khen thưởng'}${k.thanhTich ? ` — ${k.thanhTich}` : ''}` })),
    hanChe: kl.map((k) => ({ id: k.id, noiDung: `Hình thức kỷ luật ${k.hinhThuc}${k.lyDo ? `: ${k.lyDo}` : ''}`, daKhacPhuc: null })),
    daoTao: tongHop(dtk.dong, nam), khoaHoc: dtk.dong.map((d) => ({ id: d.id, tenKhoa: d.tenKhoa, ketQua: d.ketQua, coChungChi: d.coChungChi ?? null })),
    daoTaoChuaGan: dtk.trungTen ? 'Có cán bộ khác trùng họ tên; chưa tự gán khoá đào tạo, cần liên kết thủ công.' : undefined,
  }
}

/** Soạn tự động từ dữ liệu hệ thống. KHÔNG ghi đè đoạn đã có người sửa tay. */
export async function soanTuDong(user: CurrentUser, reviewId: string, doDai: DoDai): Promise<KetQuaThaoTac> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.' }
  if (n.hs.loaiHoSo !== 'CBCCVC') return { ok: false, loi: 'Soạn tự động chỉ áp dụng cho hồ sơ đánh giá công chức, viên chức; hồ sơ Đảng do cá nhân tự viết.' }
  if (!duocSuaPhan('nhanXet', n.hs.trangThai, n.vaiTro)) return { ok: false, loi: 'Bạn không được sửa nhận xét ở bước này.' }
  const du = await layDuKien(n.cb, n.hs.nam)
  du.tongDiem = n.hs.tongDiem
  du.dieuKienXepLoai = dieuKienTuDiemQuy(n.hs.diemQuy)
  const moi = soanNhanXet(du, doDai)
  // Đọc lại ngay trước khi gộp để không đè đoạn vừa được sửa tay sau lúc nạp dữ liệu
  const hienTai = (await layHoSoTheoId(n.hs.id))!
  const cu = new Map(hienTai.nhanXet.map((d) => [d.muc, d]))
  const gop: DoanLuu[] = moi.map((m) => (cu.get(m.muc)?.nguoiSua ? cu.get(m.muc)! : { ...m, tuDong: true, suaLuc: new Date().toISOString() }))
  for (const [muc, d] of cu) if (!gop.some((g) => g.muc === muc)) gop.push(d)
  const so = await db.$executeRaw`update office_year_reviews set "nhanXet"=${JSON.stringify(gop)}::jsonb,"updatedAt"=now() where id=${n.hs.id} and "trangThai" in ('DU_THAO','TU_DANH_GIA','GUI_NHAN_XET','TONG_HOP','HOP_DANH_GIA')`
  if (so !== 1) return { ok: false, loi: KHOA }
  await ghiLog(n.hs.id, 'SUA_NOI_DUNG', user.id, { chiTiet: { soanTuDong: doDai } })
  return { ok: true, hoSo: (await layHoSoTheoId(n.hs.id))! }
}

export async function chayKiemTra(hs: HoSoDanhGia, cb: CanBoNgan): Promise<VanDe[]> {
  const du = await layDuKien(cb, hs.nam)
  const truoc = await db.officeAnnualEvaluation.findUnique({ where: { canBoId_nam: { canBoId: cb.id, nam: hs.nam - 1 } }, select: { mucXepLoai: true } })
  const klTruoc = await db.officeDisciplineRecord.count({ where: { canBoId: cb.id, tuNgay: { lt: new Date(Date.UTC(hs.nam, 0, 1)) }, OR: [{ denNgay: null }, { denNgay: { gte: new Date(Date.UTC(hs.nam - 1, 0, 1)) } }] } })
  const tc = await db.$queryRaw<{ userId: string | null; luc: Date }[]>`select "userId", "createdAt" luc from office_year_review_logs where "reviewId"=${hs.id} and loai='TU_CHOI_TRUY_CAP'`
  const dauVao: DauVaoKiemTra = {
    nam: hs.nam,
    canBo: { id: cb.id, hoTen: cb.hoTen, laNguoiDungDau: cb.capQuanLy === 1, laLanhDaoQuanLy: cb.laLanhDao },
    mauApDung: hs.mauApDung ?? undefined,
    nhanXet: hs.nhanXet, congViec: du.congViec, khoaHoc: du.khoaHoc,
    diemChung: hs.diemChung, diemKpiTong: hs.diemKpiTong, tongDiemNhap: hs.tongDiem, mucDeXuat: hs.mucDeXuat,
    dieuKienXepLoai: dieuKienTuDiemQuy(hs.diemQuy),
    kyTruoc: { nam: hs.nam - 1, mucXepLoai: (truoc?.mucXepLoai as MucXepLoaiMa) ?? null, soHanChe: klTruoc },
    truyCap: tc.map((t) => ({ nguoiXemId: t.userId ?? '?', laChinhChu: false, coQuyenXem: false, loaiHoSo: hs.loaiHoSo, luc: t.luc.toISOString() })),
  }
  const vd = kiemTraHoSo(dauVao)
  // Thành tích trùng giữa các cá nhân cùng phòng cùng năm (chỉ nêu khi liên quan tới người này)
  if (hs.loaiHoSo === 'CBCCVC' && cb.toChucId) {
    const cungPhong = await db.officeRewardRecord.findMany({ where: { nam: hs.nam, canBo: { toChucId: cb.toChucId } }, select: { canBoId: true, danhHieu: true, thanhTich: true } })
    const ds = cungPhong.map((k) => ({ canBoId: k.canBoId, noiDung: `${k.danhHieu ?? ''} ${k.thanhTich ?? ''}`.trim() }))
    vd.push(...kiemTraThanhTichTrung(ds).filter((v) => (v.duLieu?.canBoIds as string[] | undefined)?.includes(cb.id)))
  }
  return vd
}

/** Chuyển sang bước kế tiếp. Không tự động: luôn do một người có vai trò phù hợp bấm. Mọi thay đổi + nhật ký cùng một giao dịch. */
export async function chuyenBuoc(user: CurrentUser, reviewId: string, mucPheDuyet?: string): Promise<KetQuaThaoTac> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.' }
  const { hs, cb, vaiTro } = n
  const dk = { coTuDanhGia: !!hs.tuDanhGia.noiDung?.trim(), coNhanXetLanhDao: !!hs.nhanXetLanhDao?.trim(), coMucDeXuat: !!hs.mucDeXuat }
  let kq: ReturnType<typeof chuyenTrangThai> | null = null
  let loi0: string | null = null
  for (const vt of vaiTro) {
    const r = chuyenTrangThai({ tu: hs.trangThai, vaiTro: vt, nguoiThaoTacId: user.id, chinhChuId: cb.userId, dieuKien: dk })
    if (r.ok) { kq = r; break }
    loi0 ??= r.loi
  }
  if (!kq || !kq.ok) return { ok: false, loi: loi0 ?? 'Bạn không có vai trò để chuyển bước này.' }
  const den = kq.den
  if (den === 'TRINH_PHE_DUYET' && hs.loaiHoSo === 'CBCCVC') {
    const loi = (await chayKiemTra(hs, cb)).filter((v) => v.mucDo === 'LOI')
    if (loi.length) return { ok: false, loi: `Còn ${loi.length} lỗi cần sửa trước khi trình: ${loi.slice(0, 3).map((v) => v.thongDiep).join(' | ')}` }
  }
  if (den === 'DA_PHE_DUYET' && (!mucPheDuyet || !MUC_HOP_LE.includes(mucPheDuyet))) return { ok: false, loi: 'Người phê duyệt phải chọn mức xếp loại chính thức.' }
  try {
    await db.$transaction(async (tx) => {
      if (den === 'DA_PHE_DUYET') {
        // Mức chính thức chỉ được ghi khi UPDATE trạng thái thật sự sửa ĐÚNG 1 dòng (chặn phê duyệt kép / hồ sơ vừa bị trả về)
        const so = await tx.$executeRaw`update office_year_reviews set "trangThai"='DA_PHE_DUYET',"mucPheDuyet"=${mucPheDuyet},"pheDuyetById"=${user.id},"pheDuyetAt"=now(),"updatedAt"=now() where id=${hs.id} and "trangThai"='TRINH_PHE_DUYET'`
        if (so !== 1) throw new Error('XUNG_DOT')
        if (hs.loaiHoSo === 'CBCCVC') {
          const cu = await tx.officeAnnualEvaluation.findUnique({ where: { canBoId_nam: { canBoId: hs.canBoId, nam: hs.nam } }, select: { mucXepLoai: true, soQuyetDinh: true } })
          const ghiChu = `Phê duyệt qua hồ sơ đánh giá năm ${hs.nam}${cu ? `; thay mức cũ ${cu.mucXepLoai}${cu.soQuyetDinh ? ` (QĐ ${cu.soQuyetDinh})` : ''}` : ''}`
          // Đổi mức thì bỏ số/ngày quyết định cũ (không để mức mới trông như được quyết định cũ xác nhận)
          await tx.officeAnnualEvaluation.upsert({
            where: { canBoId_nam: { canBoId: hs.canBoId, nam: hs.nam } },
            update: { mucXepLoai: mucPheDuyet as never, soQuyetDinh: null, ngayQuyetDinh: null, ghiChu },
            create: { canBoId: hs.canBoId, nam: hs.nam, mucXepLoai: mucPheDuyet as never, createdById: user.id, ghiChu },
          })
        }
      } else {
        const so = await tx.$executeRaw`update office_year_reviews set "trangThai"=${den},"updatedAt"=now() where id=${hs.id} and "trangThai"=${hs.trangThai}`
        if (so !== 1) throw new Error('XUNG_DOT')
      }
      await ghiLog(hs.id, 'CHUYEN_BUOC', user.id, { tu: hs.trangThai, den }, tx)
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'XUNG_DOT') return { ok: false, loi: 'Hồ sơ vừa được người khác chuyển bước; tải lại trang.' }
    throw e
  }
  await logAction({ userId: user.id, action: 'DANH_GIA_NAM_CHUYEN_BUOC', module: MODULES.OFFICE, targetId: hs.id, targetType: 'office_year_reviews', detail: `${hs.loaiHoSo} ${hs.nam}: ${hs.trangThai} → ${den}` })
  return { ok: true, hoSo: (await layHoSoTheoId(hs.id))! }
}

export async function traVeBuocTruoc(user: CurrentUser, reviewId: string, lyDo: string): Promise<KetQuaThaoTac> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.' }
  if (!n.vaiTro.some((v) => v !== 'CHINH_CHU')) return { ok: false, loi: 'Chỉ người nhận xét, thư ký tổng hợp hoặc cấp phê duyệt mới trả hồ sơ về.' }
  const r = traVeBuoc(n.hs.trangThai, lyDo)
  if (!r.ok) return { ok: false, loi: r.loi }
  try {
    await db.$transaction(async (tx) => {
      const so = await tx.$executeRaw`update office_year_reviews set "trangThai"=${r.den},"updatedAt"=now() where id=${n.hs.id} and "trangThai"=${n.hs.trangThai}`
      if (so !== 1) throw new Error('XUNG_DOT')
      await ghiLog(n.hs.id, 'TRA_VE', user.id, { tu: n.hs.trangThai, den: r.den, lyDo }, tx)
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'XUNG_DOT') return { ok: false, loi: KHOA }
    throw e
  }
  return { ok: true, hoSo: (await layHoSoTheoId(n.hs.id))! }
}

// ── Dashboard phòng ─────────────────────────────────────────────────────────
export type DuLieuPhong = { tenPhong: string; tong: TongHopPhong; duThao: string[]; nhanSu: (HoSoTongHop & { chucVu: string | null; soKhoa: number })[] }

export async function duocXemTongHopPhong(user: CurrentUser, toChucId: string): Promise<boolean> {
  if (isLeadership(user) || isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'annual_evaluation_manage')) return true
  // Trưởng/Phó phòng theo HỒ SƠ CÁN BỘ của chính phòng đó (không theo tài khoản hay cờ bật tay)
  const v = await chucVuNguoiThaoTac(user)
  return (v.cap === 3 || v.cap === 4) && v.toChucId === toChucId
}

export async function tongHopTheoPhong(toChucId: string, nam: number): Promise<DuLieuPhong | null> {
  const tc = await db.toChuc.findUnique({ where: { id: toChucId }, select: { ten: true, ma: true } })
  if (!tc) return null
  // Danh sách = người hiện thuộc phòng ∪ người có hồ sơ năm đó ghi nhận thuộc phòng này (phòng tại thời điểm đánh giá)
  const hs = await db.$queryRaw<{ canBoId: string; trangThai: string; tongDiem: number | null; mucDeXuat: string | null; mucPheDuyet: string | null }[]>`select "canBoId","trangThai","tongDiem"::float8 "tongDiem","mucDeXuat","mucPheDuyet" from office_year_reviews where nam=${nam} and "loaiHoSo"='CBCCVC' and "toChucId"=${toChucId}`
  const idHs = hs.map((h) => h.canBoId)
  const nguoi = await db.canBo.findMany({ where: { OR: [{ toChucId, trangThai: 'DANG_CONG_TAC' }, { id: { in: idHs } }] }, select: { id: true, hoTen: true, chucVu: true }, orderBy: { hoTen: 'asc' } })
  const theoNguoi = new Map(hs.map((h) => [h.canBoId, h]))
  // Nạp đào tạo MỘT lần + đếm trùng tên MỘT lần (không N+1)
  const bg = await layBanGhiDaoTao()
  const tenTrung = await db.canBo.groupBy({ by: ['hoTen'], _count: { _all: true } })
  const dem = new Map(tenTrung.map((t) => [t.hoTen.toLowerCase(), t._count._all]))
  const dt: DongDaoTao[] = []
  for (const p of nguoi) dt.push(...khopDaoTao(bg, p, nam, dem.get(p.hoTen.toLowerCase()) ?? 1).dong.map((d) => ({ ...d, toChucMa: tc.ma })))
  const dsHs: HoSoTongHop[] = nguoi.map((p) => {
    const h = theoNguoi.get(p.id)
    return { canBoId: p.id, hoTen: p.hoTen, trangThai: (h?.trangThai as TrangThaiDanhGia) ?? null, tongDiem: h?.tongDiem ?? null, mucDeXuat: (h?.mucDeXuat as MucXepLoaiMa) ?? null, mucPheDuyet: (h?.mucPheDuyet as MucXepLoaiMa) ?? null }
  })
  const dau = new Date(Date.UTC(nam, 0, 1)); const cuoi = new Date(Date.UTC(nam + 1, 0, 1))
  const dauTs = new Date(dau.getTime() - GIO_VN); const cuoiTs = new Date(cuoi.getTime() - GIO_VN)
  const cv = await db.congViec.findMany({ where: { toChucId, deletedAt: null, OR: [{ ngayHetHan: { gte: dau, lt: cuoi } }, { createdAt: { gte: dauTs, lt: cuoiTs } }] }, select: { trangThai: true, tienDo: true, tieuDe: true, ngayHetHan: true, ngayHoanThanh: true } })
  const tong = tongHopPhong(dsHs, cv.map((c) => ({ ...c, trangThai: trangThaiTaiNgayChot(c, cuoi) })), dt, nam)
  const theoCanBo = new Map<string, number>()
  for (const d of dt) theoCanBo.set(d.canBoId, (theoCanBo.get(d.canBoId) ?? 0) + 1)
  return {
    tenPhong: tc.ten, tong, duThao: duThaoNhanXetTapThe(tc.ten, nam, tong),
    nhanSu: dsHs.map((h) => ({ ...h, chucVu: nguoi.find((p) => p.id === h.canBoId)?.chucVu ?? null, soKhoa: theoCanBo.get(h.canBoId) ?? 0 })),
  }
}

// ── Xuất biểu mẫu ───────────────────────────────────────────────────────────
/** Dữ liệu để xuất Mẫu 2A/2B/2C/03/04. Chỉ hồ sơ CBCCVC; KHÔNG đọc thông tin Đảng của cán bộ. */
export async function duLieuXuatCaNhan(user: CurrentUser, reviewId: string): Promise<
  { ok: true; hs: HoSoDanhGia; cb: CanBoNgan; du: DuLieuCaNhan; tenNhiemVu: string[] } | { ok: false; loi: string; ma: number }
> {
  const n = await nap(user, reviewId)
  if (!n || !n.xem) return { ok: false, loi: 'Không có hồ sơ hoặc không có quyền.', ma: 403 }
  if (n.hs.loaiHoSo !== 'CBCCVC') return { ok: false, loi: 'Biểu mẫu này chỉ xuất cho hồ sơ đánh giá công chức, viên chức.', ma: 400 }
  const row = await db.canBo.findUnique({ where: { id: n.hs.canBoId }, select: { ngaySinh: true } })
  const du0 = await layDuKien(n.cb, n.hs.nam)
  const nx: NonNullable<DuLieuCaNhan['nhanXet']> = {}
  for (const d of n.hs.nhanXet) {
    if (laDoanThieuDuLieu(d) || !d.noiDung.trim()) continue
    if (['ket_qua_nhiem_vu', 'han_che', 'nguyen_nhan', 'khac_phuc', 'phuong_huong'].includes(d.muc)) nx[d.muc as keyof typeof nx] = d.noiDung
  }
  const ngay = row?.ngaySinh ? new Date(row.ngaySinh) : null
  const du: DuLieuCaNhan = {
    tenCoQuan: 'Sở Xây dựng Quảng Trị', tenDonVi: n.cb.tenPhong ?? '', nam: n.hs.nam, hoTen: n.cb.hoTen,
    ngaySinh: ngay ? `${String(ngay.getUTCDate()).padStart(2, '0')}/${String(ngay.getUTCMonth() + 1).padStart(2, '0')}/${ngay.getUTCFullYear()}` : null,
    chucVuChinhQuyen: n.cb.chucVu, viTriViecLam: n.cb.viTri, donViCongTac: n.cb.tenPhong ?? '',
    tuDanhGia: n.hs.tuDanhGia.noiDung ?? null, nhanXet: nx, diemChung: n.hs.diemChung, diemKpiTong: n.hs.diemKpiTong,
    nhanXetLanhDao: n.hs.nhanXetLanhDao, mucPheDuyet: n.hs.mucPheDuyet, diemQuy: n.hs.diemQuy,
  }
  return { ok: true, hs: n.hs, cb: n.cb, du, tenNhiemVu: du0.congViec.map((c) => c.tieuDe) }
}

/** Mẫu áp dụng cho một cán bộ + dữ liệu để xuất BẢN TRỐNG (chưa có hồ sơ): chỉ họ tên, ngày sinh, chức vụ, vị trí, đơn vị. */
export async function duLieuXuatTrong(user: CurrentUser, canBoId: string, nam: number): Promise<
  { ok: true; cb: CanBoNgan; mau: '2A' | '2B' | '2C'; du: DuLieuCaNhan; tenNhiemVu: string[] } | { ok: false; loi: string; ma: number }
> {
  const cb = await layCanBo(canBoId)
  if (!cb) return { ok: false, loi: 'Không tìm thấy cán bộ.', ma: 404 }
  if (!duocXemHoSo('CBCCVC', await nguCanhQuyen(user, cb))) return { ok: false, loi: 'Không có quyền.', ma: 403 }
  const row = await db.canBo.findUnique({ where: { id: canBoId }, select: { ngaySinh: true } })
  const ngay = row?.ngaySinh ? new Date(row.ngaySinh) : null
  const mau = chonMauCaNhan({ laNguoiDungDau: cb.capQuanLy === 1, laLanhDaoQuanLy: cb.laLanhDao })
  const du0 = await layDuKien(cb, nam)
  const du: DuLieuCaNhan = {
    tenCoQuan: 'Sở Xây dựng Quảng Trị', tenDonVi: cb.tenPhong ?? '', nam, hoTen: cb.hoTen,
    ngaySinh: ngay ? `${String(ngay.getUTCDate()).padStart(2, '0')}/${String(ngay.getUTCMonth() + 1).padStart(2, '0')}/${ngay.getUTCFullYear()}` : null,
    chucVuChinhQuyen: cb.chucVu, viTriViecLam: cb.viTri, donViCongTac: cb.tenPhong ?? '',
  }
  return { ok: true, cb, mau, du, tenNhiemVu: du0.congViec.map((c) => c.tieuDe) }
}
