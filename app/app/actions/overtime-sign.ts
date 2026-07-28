'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { canManageOvertimeFor } from '@/lib/overtime/access'
import { KY_TAY } from '@/lib/overtime/roles'
import { logAction } from '@/lib/audit'

export type SignFormState = { ok?: boolean; error?: string } | null

const BASE_PATH = '/dashboard/cham-cong-lam-them'
const MAX = 15 * 1024 * 1024 // 15MB

async function loadAuth(timesheetId: string) {
  const ts = await db.overtimeTimesheet.findUnique({ where: { id: timesheetId }, select: { id: true, toChucId: true, tenPhong: true, thang: true, nam: true } })
  if (!ts) return null
  const user = await requireAuth()
  if (!(await canManageOvertimeFor(user, ts.toChucId))) return null
  return { ts, user }
}

/** Tải lên BẢN ĐÃ KÝ TAY (scan/ảnh/PDF) — không ký số. */
export async function uploadSignedFileAction(prev: SignFormState, formData: FormData): Promise<SignFormState> {
  const id = String(formData.get('id') || '')
  const file = formData.get('file')
  const auth = await loadAuth(id)
  if (!auth) return { error: 'Không tìm thấy bảng hoặc không có quyền.' }
  if (!(file instanceof File) || file.size === 0) return { error: 'Hãy chọn tệp bản đã ký (PDF hoặc ảnh).' }
  if (file.size > MAX) return { error: 'Tệp quá lớn (tối đa 15MB).' }

  const name = (file as File).name || 'ban-da-ky'
  const ok = /\.(pdf|jpg|jpeg|png|webp|heic|tif|tiff)$/i.test(name) || /^(application\/pdf|image\/)/.test(file.type)
  if (!ok) return { error: 'Chỉ nhận tệp PDF hoặc ảnh (jpg/png/webp/tiff).' }

  const buf = Buffer.from(await file.arrayBuffer())

  // Mỗi bảng giữ 1 bản đã ký mới nhất
  await db.overtimeSignature.deleteMany({ where: { timesheetId: id, capCode: KY_TAY } })
  await db.overtimeSignature.create({
    data: {
      timesheetId: id,
      capCode: KY_TAY,
      nguoiKyId: auth.user.id,
      fileName: name,
      fileData: buf,
      ghiChu: file.type || null,
    },
  })
  await db.overtimeTimesheet.update({ where: { id }, data: { trangThai: 'DA_KY' } })

  await logAction({
    userId: auth.user.id, action: 'UPDATE', module: MODULES.OFFICE,
    targetId: id, targetType: 'OvertimeTimesheet',
    detail: `Tải lên bản đã ký tay — ${auth.ts.tenPhong} tháng ${auth.ts.thang}/${auth.ts.nam}`,
  })
  revalidatePath(`${BASE_PATH}/${id}`)
  return { ok: true }
}

/** Gỡ bản đã ký (quay lại trạng thái đang nhập). */
export async function removeSignedFileAction(timesheetId: string): Promise<SignFormState> {
  const auth = await loadAuth(timesheetId)
  if (!auth) return { error: 'Không tìm thấy bảng hoặc không có quyền.' }
  await db.overtimeSignature.deleteMany({ where: { timesheetId, capCode: KY_TAY } })
  await db.overtimeTimesheet.update({ where: { id: timesheetId }, data: { trangThai: 'NHAP' } })
  await logAction({
    userId: auth.user.id, action: 'UPDATE', module: MODULES.OFFICE,
    targetId: timesheetId, targetType: 'OvertimeTimesheet', detail: 'Gỡ bản đã ký tay',
  })
  revalidatePath(`${BASE_PATH}/${timesheetId}`)
  return { ok: true }
}
