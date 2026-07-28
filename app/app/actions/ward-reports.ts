'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { getWardReportPerms, canEditReport } from '@/lib/ward-report-perms'

const CATEGORY_LABEL: Record<string, string> = {
  DUONG: 'Đường giao thông',
  DIEN_CHIEU_SANG: 'Điện chiếu sáng',
  CAY_XANH: 'Cây xanh',
  CONG_VIEN: 'Công viên',
  DIEN_TONG_HOP: 'Điện tổng hợp',
  THOAT_NUOC_BC: 'Thoát nước',
  CAP_NUOC_BC: 'Cấp nước',
  KHAC: 'Bãi đỗ xe',
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteWardReportAction(id: string): Promise<void> {
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  const report = await db.wardReport.findUnique({ where: { id }, select: { wardId: true, category: true, year: true } })
  if (!report) redirect('/dashboard/bao-cao/du-lieu-phuong-xa')

  if (!canEditReport(perms, report.wardId)) redirect('/forbidden')

  await db.wardReport.delete({ where: { id } })
  await logAction({ userId: user.id, action: 'DELETE', module: 'bao_cao', targetId: id, targetType: 'WardReport', detail: `Xóa báo cáo: ${CATEGORY_LABEL[report.category]} năm ${report.year}` })
  revalidatePath('/dashboard/bao-cao/du-lieu-phuong-xa')
  redirect('/dashboard/bao-cao/du-lieu-phuong-xa')
}

// ── Update status ────────────────────────────────────────────────────────────

export async function updateWardReportStatusAction(id: string, status: 'NHAP' | 'CHINH_THUC'): Promise<void> {
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  const report = await db.wardReport.findUnique({ where: { id }, select: { wardId: true } })
  if (!report || !canEditReport(perms, report.wardId)) redirect('/forbidden')

  await db.wardReport.update({ where: { id }, data: { status } })
  await logAction({ userId: user.id, action: 'UPDATE', module: 'bao_cao', targetId: id, targetType: 'WardReport', detail: `Cập nhật trạng thái → ${status}` })
  revalidatePath(`/dashboard/bao-cao/du-lieu-phuong-xa/${id}`)
  revalidatePath('/dashboard/bao-cao/du-lieu-phuong-xa')
}

// ── Update rows (save edits) ─────────────────────────────────────────────────

const UpdateRowsSchema = z.object({
  columns: z.string(),
  rows: z.string(),
  notes: z.string().optional(),
})

export type UpdateRowsState = { error?: string; success?: string } | null

export async function updateWardReportRowsAction(
  id: string,
  prevState: UpdateRowsState,
  formData: FormData
): Promise<UpdateRowsState> {
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  const report = await db.wardReport.findUnique({ where: { id }, select: { wardId: true } })
  if (!report || !canEditReport(perms, report.wardId)) {
    return { error: 'Bạn không có quyền chỉnh sửa báo cáo này.' }
  }

  const parsed = UpdateRowsSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ' }

  let columns: string[]
  let rows: (string | number | null)[][]
  try {
    columns = JSON.parse(parsed.data.columns)
    rows = JSON.parse(parsed.data.rows)
  } catch {
    return { error: 'Dữ liệu JSON không hợp lệ' }
  }

  await db.wardReport.update({
    where: { id },
    data: { columns, rows, notes: parsed.data.notes || null },
  })

  await logAction({ userId: user.id, action: 'UPDATE', module: 'bao_cao', targetId: id, targetType: 'WardReport', detail: `Cập nhật dữ liệu báo cáo (${rows.length} hàng)` })
  revalidatePath(`/dashboard/bao-cao/du-lieu-phuong-xa/${id}`)
  return { success: 'Đã lưu dữ liệu thành công!' }
}

// ── Create manual ─────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  wardId:   z.string().optional(),
  year:     z.preprocess(v => Number(v), z.number().min(2000).max(2100)),
  month:    z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().min(1).max(12).optional()),
  category: z.enum(['DUONG','DIEN_CHIEU_SANG','CAY_XANH','CONG_VIEN','DIEN_TONG_HOP','THOAT_NUOC_BC','CAP_NUOC_BC','KHAC']),
  notes:    z.string().optional(),
})

export type CreateWardReportState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createWardReportAction(
  prevState: CreateWardReportState,
  formData: FormData
): Promise<CreateWardReportState> {
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  if (!perms.canWrite) return { error: 'Bạn không có quyền tạo báo cáo.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = CreateSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const d = parsed.data

  // Phường/xã chỉ được tạo báo cáo cho ward của mình
  const effectiveWardId = perms.limitWardId ?? d.wardId ?? null
  if (perms.limitWardId && d.wardId && d.wardId !== perms.limitWardId) {
    return { error: 'Bạn chỉ được tạo báo cáo cho đơn vị của mình.' }
  }

  const report = await db.wardReport.create({
    data: {
      wardId:      effectiveWardId,
      year:        d.year,
      month:       d.month ?? null,
      category:    d.category,
      columns:     ['STT', 'Tên', 'Ghi chú'],
      rows:        [],
      notes:       d.notes || null,
      createdById: user.id,
    },
  })

  await logAction({ userId: user.id, action: 'CREATE', module: 'bao_cao', targetId: report.id, targetType: 'WardReport', detail: `Tạo báo cáo: ${CATEGORY_LABEL[d.category]} năm ${d.year}` })
  revalidatePath('/dashboard/bao-cao/du-lieu-phuong-xa')
  redirect(`/dashboard/bao-cao/du-lieu-phuong-xa/${report.id}`)
}
