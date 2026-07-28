'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { getSoToChucIds } from '@/lib/office-scope'
import { logAction } from '@/lib/audit'
import { getLeaveBalance } from '@/lib/office-leave-policy'
import { STAGE, canActOnStage, nextStatusAfter, initialStatus } from '@/lib/office-leave-roles'
import { verifyPdfSignatures } from '@/lib/pdf-signature'
import { workingDays, calendarDays } from '@/lib/working-days'

export type LeaveFormState =
  | { ok?: boolean; warning?: string; error?: string; fieldErrors?: Record<string, string[]> }
  | null

const LEAVE_PATH = '/dashboard/nghi-phep'

/** Hồ sơ cán bộ gắn với tài khoản hiện tại (thuộc phạm vi Sở). */
async function getMyCanBo(userId: string) {
  const soIds = await getSoToChucIds()
  return db.canBo.findFirst({
    where: { userId, toChucId: { in: soIds } },
    select: { id: true, hoTen: true, toChucId: true },
  })
}

/**
 * Số ngày mặc định khi cán bộ không tự nhập:
 *  - PHEP_NAM: NGÀY LÀM VIỆC (trừ T7/CN/lễ) — vì phép năm chỉ trừ ngày làm việc.
 *  - Loại khác: tổng ngày dương lịch (gồm 2 đầu mút).
 */
function defaultSoNgay(loaiNghi: string, from: Date, to: Date): number {
  return loaiNghi === 'PHEP_NAM' ? workingDays(from, to) : calendarDays(from, to)
}

const CreateSchema = z.object({
  loaiNghi: z.enum(['PHEP_NAM', 'OM', 'THAI_SAN', 'KHONG_LUONG', 'VIEC_RIENG', 'BU', 'KHAC']).default('PHEP_NAM'),
  tuNgay:   z.string().min(1, { message: 'Chọn ngày bắt đầu' }),
  denNgay:  z.string().min(1, { message: 'Chọn ngày kết thúc' }),
  soNgay:   z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive().optional()),
  lyDo:            z.string().optional(),
  nguoiBanGiao:    z.string().optional(),
  noiNghi:         z.string().optional(),
  dienThoaiLienHe: z.string().optional(),
  deNghiUngLuong:  z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).default(false),
})

/** Cán bộ TỰ tạo đơn nghỉ phép cho chính mình. */
export async function createLeaveAction(prev: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const user = await requireAuth()
  const canBo = await getMyCanBo(user.id)
  if (!canBo) return { error: 'Tài khoản chưa được gắn hồ sơ cán bộ thuộc Sở. Vui lòng liên hệ Văn phòng Sở.' }

  const parsed = CreateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const tu = new Date(d.tuNgay)
  const den = new Date(d.denNgay)
  if (den < tu) return { fieldErrors: { denNgay: ['Ngày kết thúc phải sau ngày bắt đầu'] } }

  const soNgay = d.soNgay ?? defaultSoNgay(d.loaiNghi, tu, den)

  // Định mức phép năm (chỉ áp với phép năm)
  const balance = await getLeaveBalance(canBo.id, tu.getFullYear())
  let warning: string | undefined
  if (d.loaiNghi === 'PHEP_NAM' && soNgay > balance.conLai) {
    warning = `Số ngày nghỉ (${soNgay}) VƯỢT số phép năm còn lại (${balance.conLai}/${balance.dinhMuc} ngày). ` +
      `Đơn vẫn được gửi để cấp trên xem xét.`
  }

  const requesterIsOwnDeptLeader = Boolean(user.isDepartmentLeader && user.toChucId && user.toChucId === canBo.toChucId)
  const trangThai = initialStatus(requesterIsOwnDeptLeader)

  const rec = await db.officeLeaveRequest.create({
    data: {
      canBoId: canBo.id,
      loaiNghi: d.loaiNghi,
      tuNgay: tu,
      denNgay: den,
      soNgay,
      lyDo: d.lyDo || null,
      nguoiBanGiao: d.nguoiBanGiao || null,
      noiNghi: d.noiNghi || null,
      dienThoaiLienHe: d.dienThoaiLienHe || null,
      deNghiUngLuong: d.deNghiUngLuong,
      trangThai,
      dinhMucPhep: balance.dinhMuc,
      daNghiTruoc: balance.daNghi,
      createdById: user.id,
    },
  })
  await logAction({
    userId: user.id, action: 'CREATE', module: MODULES.OFFICE, targetId: rec.id,
    targetType: 'OfficeLeaveRequest', detail: `Tạo đơn nghỉ phép (${soNgay} ngày) — ${canBo.hoTen}`,
  })
  revalidatePath(LEAVE_PATH)
  return { ok: true, warning }
}

/** Cấp duyệt KÝ SỐ: tải lên bản PDF đã ký, kiểm tra chữ ký, chuyển bước kế tiếp. */
export async function signLeaveStageAction(prev: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') || '')
  const yKien = String(formData.get('yKien') || '')
  const soTienUngRaw = String(formData.get('soTienUng') || '')
  const file = formData.get('file')

  const req = await db.officeLeaveRequest.findUnique({
    where: { id },
    include: { canBo: { select: { toChucId: true, hoTen: true } }, _count: { select: { signatures: true } } },
  })
  if (!req) return { error: 'Không tìm thấy đơn.' }
  if (!(req.trangThai in STAGE)) return { error: 'Đơn không ở bước cần ký duyệt.' }
  if (!canActOnStage(user, req.trangThai, req.canBo.toChucId)) {
    return { error: 'Bạn không có quyền ký duyệt ở bước này.' }
  }
  if (!(file instanceof File) || file.size === 0) return { error: 'Cần tải lên bản PDF đã ký số.' }

  const buf = Buffer.from(await file.arrayBuffer())
  const res = verifyPdfSignatures(buf)
  if (!res.isPdf) return { error: 'Tệp tải lên không phải PDF.' }
  const priorCount = req._count.signatures
  if (res.soChuKy < priorCount + 1) {
    return { error: `Bản tải lên chưa có thêm chữ ký số của cấp này (phát hiện ${res.soChuKy} chữ ký, cần ≥ ${priorCount + 1}).` }
  }

  const stage = STAGE[req.trangThai]
  await db.officeLeaveSignature.create({
    data: {
      leaveRequestId: id,
      capCode: stage.capCode,
      nguoiKyId: user.id,
      fileName: (file as File).name || 'don-nghi-phep-da-ky.pdf',
      fileData: buf,
      soChuKy: res.soChuKy,
      signerCN: res.signerCN,
      signerSerial: res.signerSerial,
      signingTime: res.signingTime,
      hopLe: res.hopLe,
      ghiChuKiemTra: res.ghiChu,
    },
  })

  const next = nextStatusAfter(req.trangThai, req.deNghiUngLuong)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    trangThai: next,
    [stage.idField]: user.id,
    [stage.ngayField]: new Date(),
    [stage.yKienField]: yKien || null,
  }
  if (stage.capCode === 'TAI_CHINH' && soTienUngRaw) data.soTienUng = Number(soTienUngRaw)
  await db.officeLeaveRequest.update({ where: { id }, data })

  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetId: id,
    targetType: 'OfficeLeaveRequest', detail: `Ký số (${stage.capCode}) đơn nghỉ phép ${req.canBo.hoTen} → ${next}`,
  })
  revalidatePath(LEAVE_PATH)
  return { ok: true, warning: res.hopLe ? undefined : 'Đã lưu nhưng KIỂM TRA TOÀN VẸN chữ ký chưa đạt — kiểm tra lại file đã ký.' }
}

/** Từ chối tại cấp hiện tại. */
export async function rejectLeaveStageAction(prev: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') || '')
  const ghiChu = String(formData.get('ghiChu') || '')

  const req = await db.officeLeaveRequest.findUnique({
    where: { id }, include: { canBo: { select: { toChucId: true, hoTen: true } } },
  })
  if (!req) return { error: 'Không tìm thấy đơn.' }
  if (!(req.trangThai in STAGE)) return { error: 'Đơn không ở bước có thể từ chối.' }
  if (!canActOnStage(user, req.trangThai, req.canBo.toChucId)) {
    return { error: 'Bạn không có quyền xử lý ở bước này.' }
  }

  const stage = STAGE[req.trangThai]
  await db.officeLeaveRequest.update({
    where: { id },
    data: { trangThai: 'TU_CHOI', tuChoiCap: stage.capCode, ghiChuTuChoi: ghiChu || null },
  })
  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetId: id,
    targetType: 'OfficeLeaveRequest', detail: `Từ chối (${stage.capCode}) đơn nghỉ phép ${req.canBo.hoTen}`,
  })
  revalidatePath(LEAVE_PATH)
  return { ok: true }
}

/** Người tạo huỷ đơn (khi chưa có chữ ký nào). */
export async function cancelLeaveAction(prev: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') || '')

  const req = await db.officeLeaveRequest.findUnique({
    where: { id },
    include: { canBo: { select: { userId: true, hoTen: true } }, _count: { select: { signatures: true } } },
  })
  if (!req) return { error: 'Không tìm thấy đơn.' }
  const isOwner = req.createdById === user.id || req.canBo.userId === user.id
  if (!isOwner) return { error: 'Chỉ người tạo đơn mới được huỷ.' }
  if (!(req.trangThai in STAGE)) return { error: 'Đơn đã kết thúc, không thể huỷ.' }
  if (req._count.signatures > 0) return { error: 'Đơn đã có chữ ký số, không thể huỷ.' }

  await db.officeLeaveRequest.update({ where: { id }, data: { trangThai: 'DA_HUY' } })
  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetId: id,
    targetType: 'OfficeLeaveRequest', detail: `Huỷ đơn nghỉ phép ${req.canBo.hoTen}`,
  })
  revalidatePath(LEAVE_PATH)
  return { ok: true }
}

/** Người tạo SỬA đơn (cho phép sửa mọi lúc — chỉ cảnh báo nếu đã ký). */
export async function updateLeaveAction(prev: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') || '')

  const req = await db.officeLeaveRequest.findUnique({
    where: { id },
    include: { canBo: { select: { id: true, userId: true, hoTen: true } }, _count: { select: { signatures: true } } },
  })
  if (!req) return { error: 'Không tìm thấy đơn.' }
  const isOwner = req.createdById === user.id || req.canBo.userId === user.id
  if (!isOwner) return { error: 'Chỉ người tạo đơn mới được sửa.' }

  const parsed = CreateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const tu = new Date(d.tuNgay)
  const den = new Date(d.denNgay)
  if (den < tu) return { fieldErrors: { denNgay: ['Ngày kết thúc phải sau ngày bắt đầu'] } }

  const soNgay = d.soNgay ?? defaultSoNgay(d.loaiNghi, tu, den)

  const balance = await getLeaveBalance(req.canBo.id, tu.getFullYear())
  let warning: string | undefined
  if (d.loaiNghi === 'PHEP_NAM' && soNgay > balance.conLai) {
    warning = `Số ngày nghỉ (${soNgay}) VƯỢT số phép năm còn lại (${balance.conLai}/${balance.dinhMuc} ngày).`
  }
  // Đã ký số mà sửa nội dung → bản PDF đã ký không còn khớp.
  if (req._count.signatures > 0) {
    warning = (warning ? warning + ' ' : '') +
      'Đơn đã có chữ ký số — bản PDF đã ký KHÔNG còn khớp với nội dung mới, cần ký lại.'
  }

  await db.officeLeaveRequest.update({
    where: { id },
    data: {
      loaiNghi: d.loaiNghi,
      tuNgay: tu,
      denNgay: den,
      soNgay,
      lyDo: d.lyDo || null,
      nguoiBanGiao: d.nguoiBanGiao || null,
      noiNghi: d.noiNghi || null,
      dienThoaiLienHe: d.dienThoaiLienHe || null,
      deNghiUngLuong: d.deNghiUngLuong,
      dinhMucPhep: balance.dinhMuc,
      daNghiTruoc: balance.daNghi,
    },
  })
  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE, targetId: id,
    targetType: 'OfficeLeaveRequest', detail: `Sửa đơn nghỉ phép (${soNgay} ngày) — ${req.canBo.hoTen}`,
  })
  revalidatePath(LEAVE_PATH)
  return { ok: true, warning }
}

/** Người tạo XOÁ HẲN đơn khỏi hệ thống (chỉ khi chưa có chữ ký số). */
export async function deleteLeaveAction(prev: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') || '')

  const req = await db.officeLeaveRequest.findUnique({
    where: { id },
    include: { canBo: { select: { userId: true, hoTen: true } }, _count: { select: { signatures: true } } },
  })
  if (!req) return { error: 'Không tìm thấy đơn.' }
  const isOwner = req.createdById === user.id || req.canBo.userId === user.id
  if (!isOwner) return { error: 'Chỉ người tạo đơn mới được xoá.' }
  if (req._count.signatures > 0) return { error: 'Đơn đã có chữ ký số, không thể xoá.' }

  await db.officeLeaveRequest.delete({ where: { id } })
  await logAction({
    userId: user.id, action: 'DELETE', module: MODULES.OFFICE, targetId: id,
    targetType: 'OfficeLeaveRequest', detail: `Xoá đơn nghỉ phép ${req.canBo.hoTen}`,
  })
  revalidatePath(LEAVE_PATH)
  return { ok: true }
}
