'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  requireOfficeAccess,
  requireAuth,
  isLeadership,
  canViewOfficeSensitive,
  isOfficeLeader,
  canManageSalary,
  canReviewSalary,
  type CurrentUser,
} from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { getSoToChucIds } from '@/lib/office-scope'
import { logAction } from '@/lib/audit'
import { huongLuongNgachBac, chuanHoaPhanTramVuotKhung } from '@/lib/luong'

// ----- Phân quyền nghiệp vụ trong module Văn phòng Sở -----
function canManagePersonnel(user: CurrentUser): boolean {
  return isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'personnel_edit')
}
export type OfficeFormState = { error?: string; fieldErrors?: Record<string, string[]>; ok?: boolean } | null

// ============== Gắn cờ "Lãnh đạo phòng" (thủ công) ==============
// Chỉ admin + lãnh đạo Sở (nhóm LANH_DAO_SO) được bật/tắt. Cờ này khoá quyền
// duyệt nâng lương / nghỉ phép / xem dữ liệu nhạy cảm của phòng (isOfficeLeader).
export async function setDepartmentLeaderAction(
  canBoId: string,
  value: boolean
): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireAuth()
  if (!isLeadership(actor)) return { ok: false, error: 'Chỉ lãnh đạo Sở hoặc quản trị viên được gắn cờ lãnh đạo phòng.' }

  const cb = await db.canBo.findUnique({
    where: { id: canBoId },
    select: { id: true, hoTen: true, userId: true },
  })
  if (!cb) return { ok: false, error: 'Không tìm thấy hồ sơ cán bộ.' }
  if (!cb.userId) return { ok: false, error: 'Cán bộ này chưa có tài khoản đăng nhập nên không thể gắn cờ.' }

  await db.user.update({ where: { id: cb.userId }, data: { isDepartmentLeader: value } })
  await logAction({
    userId: actor.id,
    action: value ? 'SET_DEPT_LEADER' : 'UNSET_DEPT_LEADER',
    module: MODULES.OFFICE,
    targetId: cb.id,
    targetType: 'CanBo',
    detail: `${value ? 'Gắn' : 'Bỏ'} cờ lãnh đạo phòng: ${cb.hoTen}`,
  })

  revalidatePath(`/dashboard/van-phong-so/ho-so/${canBoId}`)
  revalidatePath('/dashboard/van-phong-so/ho-so')
  return { ok: true }
}

// ============== Lịch sử lương ==============
const SalarySchema = z.object({
  canBoId:      z.string().min(1),
  loai:         z.enum(['THUONG_XUYEN', 'TRUOC_HAN', 'DOT_XUAT', 'VUOT_KHUNG', 'KHAC']).default('THUONG_XUYEN'),
  bacLuong:     z.string().optional(),
  heSoLuong:    z.string().min(1, { message: 'Nhập hệ số lương' }),
  phuCapChucVu: z.string().optional(),
  vuotKhung:    z.string().optional(),
  ngayHuong:    z.string().min(1, { message: 'Chọn ngày hưởng' }),
  ngayNangTiep: z.string().optional(),
  soQuyetDinh:  z.string().optional(),
  ngayQuyetDinh:z.string().optional(),
  ghiChu:       z.string().optional(),
})

function num(v?: string): number | null {
  if (!v || v.trim() === '') return null
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export async function addSalaryHistoryAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageSalary(user)) return { error: 'Bạn không có quyền cập nhật lương.' }

  const parsed = SalarySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const heSo = num(d.heSoLuong)
  if (heSo === null) return { fieldErrors: { heSoLuong: ['Hệ số lương không hợp lệ'] } }

  const canBo = await db.canBo.findUnique({ where: { id: d.canBoId } })
  if (!canBo) return { error: 'Không tìm thấy cán bộ.' }

  const bac = d.bacLuong ? parseInt(d.bacLuong, 10) : null

  // Chuẩn hoá % vượt khung: staff dán nhầm số kiểu Excel phần trăm (0.09) thay vì 9 — vẫn hay gặp
  // dù ô này nhập tay, vì hay copy từ file Excel gốc. Xem lib/luong.ts.
  const vuotKhungChuan = chuanHoaPhanTramVuotKhung(num(d.vuotKhung))

  await db.officeSalaryHistory.create({
    data: {
      canBoId:       d.canBoId,
      loai:          d.loai,
      bacLuong:      Number.isFinite(bac as number) ? bac : null,
      heSoLuong:     heSo,
      phuCapChucVu:  num(d.phuCapChucVu),
      vuotKhung:     vuotKhungChuan,
      ngayHuong:     new Date(d.ngayHuong),
      ngayNangTiep:  d.ngayNangTiep ? new Date(d.ngayNangTiep) : null,
      soQuyetDinh:   d.soQuyetDinh || null,
      ngayQuyetDinh: d.ngayQuyetDinh ? new Date(d.ngayQuyetDinh) : null,
      ghiChu:        d.ghiChu || null,
      createdById:   user.id,
    },
  })

  // Đồng bộ trạng thái hiện hành sang bảng can_bo (để chatbot & danh sách dùng)
  // ngayHuong = NGÀY LÊN LƯƠNG; ngayNangTiep = NGÀY ĐẾN HẠN lần sau (cho cảnh báo)
  await db.canBo.update({
    where: { id: d.canBoId },
    data: {
      heSoLuong:           heSo,
      phuCap:              num(d.phuCapChucVu) ?? canBo.phuCap,
      vuotKhung:           vuotKhungChuan ?? canBo.vuotKhung,
      ngayNangLuong:       d.ngayHuong ? new Date(d.ngayHuong) : canBo.ngayNangLuong,
      ngayNangLuongKeTiep: d.ngayNangTiep ? new Date(d.ngayNangTiep) : canBo.ngayNangLuongKeTiep,
    },
  })

  await logAction({
    userId: user.id, action: 'CREATE', module: MODULES.OFFICE,
    targetId: d.canBoId, targetType: 'OfficeSalaryHistory',
    detail: `Thêm mốc lương (${d.loai}) hệ số ${heSo} cho ${canBo.hoTen}`,
  })
  revalidatePath(`/dashboard/van-phong-so/ho-so/${d.canBoId}`)
  revalidatePath('/dashboard/van-phong-so/luong')
  return { ok: true }
}

// ============== Quá trình công tác ==============
const WorkSchema = z.object({
  canBoId:     z.string().min(1),
  tuNgay:      z.string().min(1, { message: 'Chọn ngày bắt đầu' }),
  denNgay:     z.string().optional(),
  donVi:       z.string().min(1, { message: 'Nhập đơn vị công tác' }),
  chucVu:      z.string().optional(),
  noiDung:     z.string().optional(),
  soQuyetDinh: z.string().optional(),
  ghiChu:      z.string().optional(),
})

export async function addWorkHistoryAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManagePersonnel(user)) return { error: 'Bạn không có quyền cập nhật hồ sơ.' }

  const parsed = WorkSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const canBo = await db.canBo.findUnique({ where: { id: d.canBoId } })
  if (!canBo) return { error: 'Không tìm thấy cán bộ.' }

  await db.officeWorkHistory.create({
    data: {
      canBoId:     d.canBoId,
      tuNgay:      new Date(d.tuNgay),
      denNgay:     d.denNgay ? new Date(d.denNgay) : null,
      donVi:       d.donVi,
      chucVu:      d.chucVu || null,
      noiDung:     d.noiDung || null,
      soQuyetDinh: d.soQuyetDinh || null,
      ghiChu:      d.ghiChu || null,
      createdById: user.id,
    },
  })

  await logAction({
    userId: user.id, action: 'CREATE', module: MODULES.OFFICE,
    targetId: d.canBoId, targetType: 'OfficeWorkHistory',
    detail: `Thêm quá trình công tác cho ${canBo.hoTen}: ${d.donVi}`,
  })
  revalidatePath(`/dashboard/van-phong-so/ho-so/${d.canBoId}`)
  return { ok: true }
}

// ----- Phân quyền nghiệp vụ thi đua – khen thưởng / đánh giá / kỷ luật -----
function canManageReward(user: CurrentUser): boolean {
  return isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'reward_manage')
}
function canManageEvaluation(user: CurrentUser): boolean {
  return isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'annual_evaluation_manage')
}
function canManageDiscipline(user: CurrentUser): boolean {
  return isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'discipline_manage')
}

function intOrNull(v?: string): number | null {
  if (!v || v.trim() === '') return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

// ============== Thi đua, khen thưởng ==============
const RewardSchema = z.object({
  canBoId:         z.string().min(1),
  rewardTitleId:   z.string().optional(),
  movementId:      z.string().optional(),
  nam:             z.string().min(4, { message: 'Nhập năm' }),
  danhHieu:        z.string().optional(),
  capKhen:         z.string().optional(),
  soQuyetDinh:     z.string().optional(),
  ngayQuyetDinh:   z.string().optional(),
  coQuanQuyetDinh: z.string().optional(),
  thanhTich:       z.string().optional(),
  ghiChu:          z.string().optional(),
})

export async function addRewardRecordAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageReward(user)) return { error: 'Bạn không có quyền cập nhật thi đua – khen thưởng.' }

  const parsed = RewardSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const nam = intOrNull(d.nam)
  if (nam === null) return { fieldErrors: { nam: ['Năm không hợp lệ'] } }

  const canBo = await db.canBo.findUnique({ where: { id: d.canBoId } })
  if (!canBo) return { error: 'Không tìm thấy cán bộ.' }

  await db.officeRewardRecord.create({
    data: {
      canBoId:         d.canBoId,
      rewardTitleId:   d.rewardTitleId || null,
      movementId:      d.movementId || null,
      nam,
      danhHieu:        d.danhHieu || null,
      capKhen:         d.capKhen || null,
      soQuyetDinh:     d.soQuyetDinh || null,
      ngayQuyetDinh:   d.ngayQuyetDinh ? new Date(d.ngayQuyetDinh) : null,
      coQuanQuyetDinh: d.coQuanQuyetDinh || null,
      thanhTich:       d.thanhTich || null,
      ghiChu:          d.ghiChu || null,
      createdById:     user.id,
    },
  })

  await logAction({
    userId: user.id, action: 'CREATE', module: MODULES.OFFICE,
    targetId: d.canBoId, targetType: 'OfficeRewardRecord',
    detail: `Thêm khen thưởng năm ${nam} cho ${canBo.hoTen}`,
  })
  revalidatePath(`/dashboard/van-phong-so/ho-so/${d.canBoId}`)
  revalidatePath('/dashboard/van-phong-so/thi-dua-khen-thuong')
  return { ok: true }
}

// ============== Đánh giá, xếp loại hằng năm ==============
const EvalSchema = z.object({
  canBoId:         z.string().min(1),
  nam:             z.string().min(4, { message: 'Nhập năm' }),
  mucXepLoai:      z.enum([
    'HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU',
  ]),
  laChienSiThiDua: z.string().optional(),
  soQuyetDinh:     z.string().optional(),
  ngayQuyetDinh:   z.string().optional(),
  ghiChu:          z.string().optional(),
})

export async function addEvaluationAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageEvaluation(user)) return { error: 'Bạn không có quyền cập nhật đánh giá xếp loại.' }

  const parsed = EvalSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const nam = intOrNull(d.nam)
  if (nam === null) return { fieldErrors: { nam: ['Năm không hợp lệ'] } }

  const canBo = await db.canBo.findUnique({ where: { id: d.canBoId } })
  if (!canBo) return { error: 'Không tìm thấy cán bộ.' }

  // Mỗi cán bộ chỉ 1 đánh giá/năm → upsert theo (canBoId, nam)
  const data = {
    mucXepLoai:      d.mucXepLoai,
    laChienSiThiDua: d.laChienSiThiDua === 'on' || d.laChienSiThiDua === 'true',
    soQuyetDinh:     d.soQuyetDinh || null,
    ngayQuyetDinh:   d.ngayQuyetDinh ? new Date(d.ngayQuyetDinh) : null,
    ghiChu:          d.ghiChu || null,
  }
  await db.officeAnnualEvaluation.upsert({
    where: { canBoId_nam: { canBoId: d.canBoId, nam } },
    update: data,
    create: { canBoId: d.canBoId, nam, createdById: user.id, ...data },
  })

  await logAction({
    userId: user.id, action: 'UPSERT', module: MODULES.OFFICE,
    targetId: d.canBoId, targetType: 'OfficeAnnualEvaluation',
    detail: `Đánh giá xếp loại năm ${nam} cho ${canBo.hoTen}: ${d.mucXepLoai}`,
  })
  revalidatePath(`/dashboard/van-phong-so/ho-so/${d.canBoId}`)
  revalidatePath('/dashboard/van-phong-so/danh-gia')
  return { ok: true }
}

// ============== Kỷ luật, kéo dài nâng lương ==============
const DisciplineSchema = z.object({
  canBoId:                z.string().min(1),
  hinhThuc:               z.enum([
    'KHIEN_TRACH', 'CANH_CAO', 'HA_BAC_LUONG', 'GIANG_CHUC', 'CACH_CHUC', 'BUOC_THOI_VIEC', 'KHAC',
  ]),
  lyDo:                   z.string().optional(),
  tuNgay:                 z.string().min(1, { message: 'Chọn ngày bắt đầu' }),
  denNgay:                z.string().optional(),
  soThangKeoDaiNangLuong: z.string().optional(),
  soQuyetDinh:            z.string().optional(),
  ngayQuyetDinh:          z.string().optional(),
  ghiChu:                 z.string().optional(),
})

export async function addDisciplineAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageDiscipline(user)) return { error: 'Bạn không có quyền cập nhật kỷ luật.' }

  const parsed = DisciplineSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const canBo = await db.canBo.findUnique({ where: { id: d.canBoId } })
  if (!canBo) return { error: 'Không tìm thấy cán bộ.' }

  await db.officeDisciplineRecord.create({
    data: {
      canBoId:                d.canBoId,
      hinhThuc:               d.hinhThuc,
      lyDo:                   d.lyDo || null,
      tuNgay:                 new Date(d.tuNgay),
      denNgay:                d.denNgay ? new Date(d.denNgay) : null,
      soThangKeoDaiNangLuong: intOrNull(d.soThangKeoDaiNangLuong),
      soQuyetDinh:            d.soQuyetDinh || null,
      ngayQuyetDinh:          d.ngayQuyetDinh ? new Date(d.ngayQuyetDinh) : null,
      ghiChu:                 d.ghiChu || null,
      createdById:            user.id,
    },
  })

  await logAction({
    userId: user.id, action: 'CREATE', module: MODULES.OFFICE,
    targetId: d.canBoId, targetType: 'OfficeDisciplineRecord',
    detail: `Thêm kỷ luật (${d.hinhThuc}) cho ${canBo.hoTen}`,
  })
  revalidatePath(`/dashboard/van-phong-so/ho-so/${d.canBoId}`)
  revalidatePath('/dashboard/van-phong-so/danh-gia')
  return { ok: true }
}

// ============== Quy trình rà soát nâng lương (Commit 4) ==============
function canApproveSalaryCase(user: CurrentUser): boolean {
  return isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_approve_department')
}

const RA_SOAT_WINDOW_DAYS = 90

/** Sinh danh sách dự kiến nâng lương đến hạn (theo ngayNangLuong ≤ window ngày hoặc đã quá hạn). */
export async function generateRegularReviewListAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canReviewSalary(user)) return { error: 'Bạn không có quyền rà soát nâng lương.' }

  const namRaSoat = parseInt(String(formData.get('namRaSoat') ?? ''), 10) || new Date().getFullYear()
  const withinDays = parseInt(String(formData.get('withinDays') ?? ''), 10) || RA_SOAT_WINDOW_DAYS
  const dotRaSoat = (formData.get('dotRaSoat') as string) || null

  const now = new Date()
  const limit = new Date(now)
  limit.setDate(limit.getDate() + withinDays)

  // Cán bộ TOÀN SỞ có mốc nâng lương kế tiếp ≤ limit (gồm quá hạn).
  // LOẠI Người lao động (hợp đồng): hưởng lương khoán/thoả thuận, KHÔNG nâng lương
  // ngạch bậc định kỳ → không đưa vào danh sách rà soát.
  const soIds = await getSoToChucIds()
  const canBoRaw = await db.canBo.findMany({
    where: {
      toChucId: { in: soIds },
      ngayNangLuong: { not: null, lte: limit },
      doiTuong: { not: 'NGUOI_LAO_DONG' },
    },
    select: { id: true, heSoLuong: true, ngayNangLuong: true, doiTuong: true, loaiHinh: true },
  })
  // Lọc thêm theo quy tắc hưởng lương ngạch bậc (bắt trường hợp doiTuong null nhưng là HĐ).
  const canBoList = canBoRaw.filter((cb) => huongLuongNgachBac(cb))

  // Một câu lệnh thay cho 2 truy vấn/cán bộ; skipDuplicates dựa vào @@unique(canBoId, namRaSoat, loai)
  // nên hồ sơ đã có được giữ nguyên, và hai người bấm cùng lúc không tạo trùng.
  const { count: created } = await db.officeSalaryReviewCase.createMany({
    data: canBoList.map((cb) => ({
      canBoId:     cb.id,
      loai:        'THUONG_XUYEN' as const,
      namRaSoat,
      dotRaSoat,
      ngayDenHan:  cb.ngayNangLuong,
      heSoHienTai: cb.heSoLuong,
      trangThai:   'DU_KIEN' as const,
      createdById: user.id,
    })),
    skipDuplicates: true,
  })

  await logAction({
    userId: user.id, action: 'GENERATE_LIST', module: MODULES.OFFICE,
    targetType: 'OfficeSalaryReviewCase',
    detail: `Sinh danh sách rà soát nâng lương ${namRaSoat} (≤${withinDays} ngày): tạo mới ${created} hồ sơ`,
  })
  revalidatePath('/dashboard/van-phong-so/nang-luong')
  return { ok: true }
}

const ReviewSchema = z.object({
  id:            z.string().min(1),
  ketLuanRaSoat: z.enum(['DU_DIEU_KIEN', 'CHUA_DU_DIEU_KIEN', 'CAN_KIEM_TRA']),
  noiDungRaSoat: z.string().optional(),
  canCuPhapLy:   z.string().optional(),
  heSoDeXuat:    z.string().optional(),
  bacDeXuat:     z.string().optional(),
  ngayHuongMoi:  z.string().optional(),
})

/** Văn phòng rà soát: ghi kết luận đủ/chưa đủ/cần kiểm tra + đề xuất hệ số/bậc. */
export async function reviewSalaryCaseAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canReviewSalary(user)) return { error: 'Bạn không có quyền rà soát nâng lương.' }

  const parsed = ReviewSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const c = await db.officeSalaryReviewCase.findUnique({ where: { id: d.id }, include: { canBo: true } })
  if (!c) return { error: 'Không tìm thấy hồ sơ rà soát.' }
  if (c.trangThai === 'DA_BAN_HANH') return { error: 'Hồ sơ đã ban hành, không thể sửa rà soát.' }

  const bac = d.bacDeXuat ? parseInt(d.bacDeXuat, 10) : null
  await db.officeSalaryReviewCase.update({
    where: { id: d.id },
    data: {
      ketLuanRaSoat: d.ketLuanRaSoat,
      noiDungRaSoat: d.noiDungRaSoat || null,
      canCuPhapLy:   d.canCuPhapLy || null,
      heSoDeXuat:    num(d.heSoDeXuat),
      bacDeXuat:     Number.isFinite(bac as number) ? bac : null,
      ngayHuongMoi:  d.ngayHuongMoi ? new Date(d.ngayHuongMoi) : null,
      nguoiRaSoatId: user.id,
      ngayRaSoat:    new Date(),
      // Giữ ở DANG_RA_SOAT (trừ khi đã đẩy tiếp); không tự động trình
      trangThai:     c.trangThai === 'DU_KIEN' ? 'DANG_RA_SOAT' : c.trangThai,
    },
  })

  await logAction({
    userId: user.id, action: 'REVIEW', module: MODULES.OFFICE,
    targetId: d.id, targetType: 'OfficeSalaryReviewCase',
    detail: `Rà soát nâng lương ${c.canBo.hoTen}: ${d.ketLuanRaSoat}`,
  })
  revalidatePath('/dashboard/van-phong-so/nang-luong')
  revalidatePath(`/dashboard/van-phong-so/nang-luong/${d.id}`)
  return { ok: true }
}

/** Trình lãnh đạo duyệt (chỉ khi đã rà soát đủ điều kiện). */
export async function submitSalaryCaseAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canReviewSalary(user)) return { error: 'Bạn không có quyền trình hồ sơ.' }
  const id = String(formData.get('id') ?? '')
  const c = await db.officeSalaryReviewCase.findUnique({ where: { id }, include: { canBo: true } })
  if (!c) return { error: 'Không tìm thấy hồ sơ.' }
  if (c.trangThai !== 'DANG_RA_SOAT') return { error: 'Chỉ trình hồ sơ đang ở trạng thái Đang rà soát.' }
  if (c.ketLuanRaSoat !== 'DU_DIEU_KIEN') return { error: 'Chỉ trình hồ sơ có kết luận "Đủ điều kiện".' }

  await db.officeSalaryReviewCase.update({ where: { id }, data: { trangThai: 'CHO_DUYET' } })
  await logAction({
    userId: user.id, action: 'SUBMIT', module: MODULES.OFFICE,
    targetId: id, targetType: 'OfficeSalaryReviewCase', detail: `Trình duyệt nâng lương ${c.canBo.hoTen}`,
  })
  revalidatePath('/dashboard/van-phong-so/nang-luong')
  revalidatePath(`/dashboard/van-phong-so/nang-luong/${id}`)
  return { ok: true }
}

/** Lãnh đạo Văn phòng duyệt hoặc từ chối. */
export async function decideSalaryCaseAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canApproveSalaryCase(user)) return { error: 'Bạn không có quyền duyệt nâng lương.' }
  const id = String(formData.get('id') ?? '')
  const approve = String(formData.get('approve') ?? '') === 'true'
  const c = await db.officeSalaryReviewCase.findUnique({ where: { id }, include: { canBo: true } })
  if (!c) return { error: 'Không tìm thấy hồ sơ.' }
  if (c.trangThai !== 'CHO_DUYET') return { error: 'Chỉ duyệt hồ sơ đang chờ duyệt.' }

  await db.officeSalaryReviewCase.update({
    where: { id },
    data: { trangThai: approve ? 'DA_DUYET' : 'TU_CHOI', nguoiDuyetId: user.id, ngayDuyet: new Date() },
  })
  await logAction({
    userId: user.id, action: approve ? 'APPROVE' : 'REJECT', module: MODULES.OFFICE,
    targetId: id, targetType: 'OfficeSalaryReviewCase',
    detail: `${approve ? 'Duyệt' : 'Không duyệt'} nâng lương ${c.canBo.hoTen}`,
  })
  revalidatePath('/dashboard/van-phong-so/nang-luong')
  revalidatePath(`/dashboard/van-phong-so/nang-luong/${id}`)
  return { ok: true }
}

const IssueSchema = z.object({
  id:            z.string().min(1),
  soQuyetDinh:   z.string().min(1, { message: 'Nhập số quyết định' }),
  ngayQuyetDinh: z.string().optional(),
  heSoMoi:       z.string().min(1, { message: 'Nhập hệ số lương mới' }),
  ngayHuongMoi:  z.string().min(1, { message: 'Chọn ngày hưởng' }),
  ngayNangTiep:  z.string().optional(),
})

/** Ban hành QĐ nâng lương: ghi 1 mốc OfficeSalaryHistory + đồng bộ can_bo, đóng hồ sơ. */
export async function issueSalaryCaseAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageSalary(user)) return { error: 'Bạn không có quyền ban hành nâng lương.' }

  const parsed = IssueSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  const c = await db.officeSalaryReviewCase.findUnique({ where: { id: d.id }, include: { canBo: true } })
  if (!c) return { error: 'Không tìm thấy hồ sơ.' }
  if (c.trangThai !== 'DA_DUYET') return { error: 'Chỉ ban hành hồ sơ đã được duyệt.' }

  const heSo = num(d.heSoMoi)
  if (heSo === null) return { fieldErrors: { heSoMoi: ['Hệ số lương không hợp lệ'] } }
  const ngayNangTiep = d.ngayNangTiep ? new Date(d.ngayNangTiep) : null

  await db.$transaction([
    db.officeSalaryHistory.create({
      data: {
        canBoId:       c.canBoId,
        loai:          c.loai,
        bacLuong:      c.bacDeXuat ?? null,
        heSoLuong:     heSo,
        ngayHuong:     new Date(d.ngayHuongMoi),
        ngayNangTiep,
        soQuyetDinh:   d.soQuyetDinh,
        ngayQuyetDinh: d.ngayQuyetDinh ? new Date(d.ngayQuyetDinh) : null,
        ghiChu:        `Ban hành từ hồ sơ rà soát ${c.namRaSoat}`,
        createdById:   user.id,
      },
    }),
    db.canBo.update({
      where: { id: c.canBoId },
      data: { heSoLuong: heSo, ngayNangLuong: ngayNangTiep ?? undefined },
    }),
    db.officeSalaryReviewCase.update({
      where: { id: d.id },
      data: {
        trangThai:     'DA_BAN_HANH',
        soQuyetDinh:   d.soQuyetDinh,
        ngayQuyetDinh: d.ngayQuyetDinh ? new Date(d.ngayQuyetDinh) : null,
        heSoDeXuat:    heSo,
        ngayHuongMoi:  new Date(d.ngayHuongMoi),
      },
    }),
  ])

  await logAction({
    userId: user.id, action: 'ISSUE', module: MODULES.OFFICE,
    targetId: d.id, targetType: 'OfficeSalaryReviewCase',
    detail: `Ban hành nâng lương ${c.canBo.hoTen}: QĐ ${d.soQuyetDinh}, hệ số ${heSo}`,
  })
  revalidatePath('/dashboard/van-phong-so/nang-luong')
  revalidatePath(`/dashboard/van-phong-so/nang-luong/${d.id}`)
  revalidatePath(`/dashboard/van-phong-so/ho-so/${c.canBoId}`)
  return { ok: true }
}

// Ghi log khi xem dữ liệu nhạy cảm (gọi từ server component khi mở hồ sơ có quyền sensitive)
export async function logSensitiveView(canBoId: string, hoTen: string): Promise<void> {
  const user = await requireOfficeAccess()
  if (!canViewOfficeSensitive(user)) return
  await logAction({
    userId: user.id, action: 'VIEW_SENSITIVE', module: MODULES.OFFICE,
    targetId: canBoId, targetType: 'CanBo', detail: `Xem dữ liệu nhạy cảm: ${hoTen}`,
  })
}
