// Áp dụng luân chuyển trong MỘT giao dịch: tài khoản đăng nhập, cờ lãnh đạo phòng, phân công chính, quá trình công tác.
// Gọi từ action lưu hồ sơ cán bộ (app/actions/can-bo.ts) với `tx` của giao dịch đang cập nhật can_bo.
// Sau phản biện Codex (17/11/2026): khoá dòng hồ sơ trước khi đọc trạng thái cũ; không đồng bộ tài khoản vào/ra các đơn vị
// mang quyền đặc biệt (Lãnh đạo Sở, Văn phòng Sở) nếu người thao tác không đủ thẩm quyền; không động vào tài khoản admin;
// hạ chức danh / thôi công tác thì tắt cờ lãnh đạo; từ chối ngày hiệu lực tương lai hoặc trước phân công đang giữ.
import 'server-only'
import type { db } from '@/lib/db'
import { lapKeHoach, moTaLuanChuyen, ngayTruoc, type KeHoachLuanChuyen } from '@/lib/luan-chuyen'

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]

/** Đơn vị mang quyền đặc biệt suy từ phòng của tài khoản (isLeadership / canAccessOffice). */
export const DON_VI_DAC_BIET: Record<string, 'LANH_DAO_SO' | 'VAN_PHONG'> = { LANH_DAO_SO: 'LANH_DAO_SO', VAN_PHONG_SO: 'VAN_PHONG' }
const THOI_CONG_TAC = new Set(['NGHI_HUU', 'CHUYEN_CONG_TAC', 'NGHI_VIEC'])

export class LoiLuanChuyen extends Error {}

export type KetQuaLuanChuyen = { keHoach: KeHoachLuanChuyen; moTa: string; ghiChu: string[]; canhBao: string[] }

export async function apDungLuanChuyen(tx: Tx, a: {
  canBoId: string
  userId: string | null
  toChucIdCu: string | null; toChucIdMoi: string | null
  chucDanhIdCu: string | null; chucDanhIdMoi: string | null
  trangThaiMoi?: string | null
  ngayHieuLuc: Date
  homNay: Date
  soQuyetDinh: string | null
  nguoiThaoTacId: string
  /** người thao tác là admin hoặc lãnh đạo Sở */
  nguoiThaoTacLaLanhDaoSo: boolean
  /** người thao tác là lãnh đạo Văn phòng Sở */
  nguoiThaoTacLaLanhDaoVP: boolean
}): Promise<KetQuaLuanChuyen> {
  const ghiChu: string[] = []
  const canhBao: string[] = []
  if (a.ngayHieuLuc.getTime() > a.homNay.getTime()) throw new LoiLuanChuyen('Chưa hỗ trợ luân chuyển có hiệu lực trong tương lai: nhập ngày hiệu lực là hôm nay hoặc trước đó, và lưu vào đúng ngày quyết định có hiệu lực.')

  const tk = a.userId ? await tx.user.findUnique({ where: { id: a.userId }, select: { toChucId: true, isDepartmentLeader: true, role: { select: { name: true } }, toChuc: { select: { ma: true } } } }) : null
  const pcMo = await tx.phanCong.findMany({ where: { canBoId: a.canBoId, laChinh: true, denNgay: null }, select: { id: true, tuNgay: true, toChucId: true, chucDanhId: true } })
  const thoiCongTac = !!a.trangThaiMoi && THOI_CONG_TAC.has(a.trangThaiMoi)
  // Thiếu chức danh: vẫn nhận diện phân công SAI PHÒNG để đóng, chỉ không tự mở phân công mới
  const phanCongKhop = thoiCongTac ? pcMo.length === 0
    : !a.toChucIdMoi ? true
    : !a.chucDanhIdMoi ? pcMo.every((p) => p.toChucId === a.toChucIdMoi)
    : pcMo.length === 1 && pcMo[0].toChucId === a.toChucIdMoi && pcMo[0].chucDanhId === a.chucDanhIdMoi

  // Tuần tự (không Promise.all): mọi truy vấn trong giao dịch dùng chung một kết nối
  const pCu = a.toChucIdCu ? await tx.toChuc.findUnique({ where: { id: a.toChucIdCu }, select: { ten: true, ma: true } }) : null
  const pMoi = a.toChucIdMoi ? await tx.toChuc.findUnique({ where: { id: a.toChucIdMoi }, select: { ten: true, ma: true } }) : null
  const cCu = a.chucDanhIdCu ? await tx.chucDanh.findUnique({ where: { id: a.chucDanhIdCu }, select: { ten: true } }) : null
  const cMoi = a.chucDanhIdMoi ? await tx.chucDanh.findUnique({ where: { id: a.chucDanhIdMoi }, select: { ten: true, isLanhDao: true } }) : null

  // Tài khoản có được đi theo hồ sơ không
  let coTheDongBo = !!tk && !thoiCongTac
  if (tk && tk.role.name === 'admin') { coTheDongBo = false; canhBao.push('Tài khoản quản trị (admin) không tự chuyển phòng theo hồ sơ; quản trị viên tự xử lý.') }
  const dacBiet = [DON_VI_DAC_BIET[pMoi?.ma ?? ''], DON_VI_DAC_BIET[tk?.toChuc?.ma ?? '']].filter(Boolean)
  if (coTheDongBo && dacBiet.includes('LANH_DAO_SO') && !a.nguoiThaoTacLaLanhDaoSo) {
    coTheDongBo = false; canhBao.push('Đơn vị Lãnh đạo Sở mang quyền truy cập mọi phòng: chỉ quản trị viên hoặc lãnh đạo Sở được chuyển tài khoản vào/ra. Hồ sơ đã lưu, tài khoản CHƯA chuyển.')
  } else if (coTheDongBo && dacBiet.includes('VAN_PHONG') && !a.nguoiThaoTacLaLanhDaoSo && !a.nguoiThaoTacLaLanhDaoVP) {
    coTheDongBo = false; canhBao.push('Văn phòng Sở mang quyền vào dữ liệu nhân sự: chỉ lãnh đạo Văn phòng, lãnh đạo Sở hoặc quản trị viên được chuyển tài khoản vào/ra. Hồ sơ đã lưu, tài khoản CHƯA chuyển.')
  }

  const k0 = lapKeHoach(a, coTheDongBo, { taiKhoanToChucId: tk ? tk.toChucId : undefined, phanCongKhop })
  const haChucDanh = k0.doiChucDanh && !cMoi?.isLanhDao
  const k: KeHoachLuanChuyen = { ...k0, tatCoLanhDao: !!tk?.isDepartmentLeader && (k0.capNhatTaiKhoan || haChucDanh || thoiCongTac) }
  const moTa = moTaLuanChuyen({ phongCu: pCu?.ten, phongMoi: pMoi?.ten, chucCu: cCu?.ten, chucMoi: cMoi?.ten }, k)
  if (!k.capNhatTaiKhoan && !k.tatCoLanhDao && !k.doiPhanCong && !k.ghiQuaTrinh) return { keHoach: k, moTa, ghiChu, canhBao }

  // Không cho nhập lùi ngày trước phân công đang giữ (sẽ làm lịch sử chồng lấn)
  if ((k.doiPhanCong || k.ghiQuaTrinh) && pcMo.some((p) => p.tuNgay && p.tuNgay.getTime() > a.ngayHieuLuc.getTime())) {
    throw new LoiLuanChuyen('Ngày hiệu lực trước ngày bắt đầu của phân công đang giữ: kiểm tra lại ngày quyết định.')
  }

  // 1–2. Tài khoản đi theo hồ sơ; tắt cờ lãnh đạo khi đổi phòng, hạ chức danh hoặc thôi công tác
  if (tk && a.userId && (k.capNhatTaiKhoan || k.tatCoLanhDao)) {
    await tx.user.update({ where: { id: a.userId }, data: { ...(k.capNhatTaiKhoan ? { toChucId: a.toChucIdMoi } : {}), ...(k.tatCoLanhDao ? { isDepartmentLeader: false } : {}) } })
    if (k.capNhatTaiKhoan) ghiChu.push(k.doiPhong ? 'Tài khoản đăng nhập chuyển sang phòng mới.' : 'Tài khoản đăng nhập đang lệch hồ sơ, đã đưa về đúng phòng theo hồ sơ.')
    if (k.tatCoLanhDao) ghiChu.push('Đã tắt cờ lãnh đạo phòng; lãnh đạo Sở bật lại nếu người này là lãnh đạo ở phòng mới.')
  }

  // 3. Phân công chính: đóng cái đang mở (sai), mở cái mới khi đủ đơn vị + chức danh và còn công tác
  if (k.doiPhanCong) {
    const ketThuc = thoiCongTac ? a.ngayHieuLuc : ngayTruoc(a.ngayHieuLuc)
    for (const p of pcMo) {
      if (!thoiCongTac && p.toChucId === a.toChucIdMoi && p.chucDanhId === a.chucDanhIdMoi) continue
      const den = p.tuNgay && p.tuNgay.getTime() > ketThuc.getTime() ? p.tuNgay : ketThuc
      await tx.phanCong.update({ where: { id: p.id }, data: { denNgay: den } })
    }
    const conMo = await tx.phanCong.count({ where: { canBoId: a.canBoId, laChinh: true, denNgay: null } })
    if (!thoiCongTac && conMo === 0 && a.toChucIdMoi && a.chucDanhIdMoi) {
      const trung = await tx.phanCong.findFirst({ where: { canBoId: a.canBoId, toChucId: a.toChucIdMoi, chucDanhId: a.chucDanhIdMoi, tuNgay: a.ngayHieuLuc } })
      if (trung) await tx.phanCong.update({ where: { id: trung.id }, data: { denNgay: null, laChinh: true, quyetDinhSo: a.soQuyetDinh ?? trung.quyetDinhSo } })
      else await tx.phanCong.create({ data: { canBoId: a.canBoId, toChucId: a.toChucIdMoi, chucDanhId: a.chucDanhIdMoi, laChinh: true, tuNgay: a.ngayHieuLuc, quyetDinhSo: a.soQuyetDinh } })
      ghiChu.push('Đã đóng phân công chính cũ và mở phân công chính mới.')
    } else if (thoiCongTac) ghiChu.push('Cán bộ thôi công tác: đã đóng phân công chính.')
    else if (!a.chucDanhIdMoi) ghiChu.push('Đã đóng phân công sai phòng; chưa mở phân công mới vì hồ sơ thiếu chức danh.')
  }

  // 4. Quá trình công tác: đóng dòng đang mở (kể cả dòng bắt đầu cùng ngày), ghi dòng mới
  if (k.ghiQuaTrinh && !thoiCongTac) {
    const ketThuc = ngayTruoc(a.ngayHieuLuc)
    const dangMo = await tx.officeWorkHistory.findMany({ where: { canBoId: a.canBoId, denNgay: null }, select: { id: true, tuNgay: true } })
    for (const w of dangMo) await tx.officeWorkHistory.update({ where: { id: w.id }, data: { denNgay: w.tuNgay.getTime() > ketThuc.getTime() ? w.tuNgay : ketThuc } })
    await tx.officeWorkHistory.create({ data: {
      canBoId: a.canBoId, tuNgay: a.ngayHieuLuc, donVi: pMoi?.ten ?? pCu?.ten ?? '(chưa có đơn vị)', chucVu: cMoi?.ten ?? null,
      noiDung: `Luân chuyển: ${moTa}`, soQuyetDinh: a.soQuyetDinh, createdById: a.nguoiThaoTacId,
    } })
    ghiChu.push('Đã ghi quá trình công tác.')
  }
  return { keHoach: k, moTa, ghiChu, canhBao }
}

/** Phân công chính ban đầu khi TẠO hồ sơ mới (đủ đơn vị + chức danh). Ngày bắt đầu để trống: chưa có quyết định xác nhận. */
export async function taoPhanCongBanDau(tx: Tx, canBoId: string, toChucId: string | null, chucDanhId: string | null): Promise<void> {
  if (!toChucId || !chucDanhId) return
  const co = await tx.phanCong.count({ where: { canBoId, laChinh: true, denNgay: null } })
  if (co === 0) await tx.phanCong.create({ data: { canBoId, toChucId, chucDanhId, laChinh: true } })
}
