'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

const WOSchema = z.object({
  title:           z.string().min(1, { message: 'Vui lòng nhập tiêu đề' }),
  type:            z.enum(['BAO_TRI_DINH_KY','SUA_CHUA','KIEM_TRA','NAO_VET','THAY_THE','CAI_TAO'], { message: 'Vui lòng chọn loại' }),
  domain:          z.enum(['GIAO_THONG','CAP_NUOC','THOAT_NUOC','CHIEU_SANG','CAY_XANH','MOI_TRUONG','CHINH_TRANG'], { message: 'Vui lòng chọn lĩnh vực' }),
  priority:        z.enum(['THAP','TRUNG','CAO','KHAN_CAP']).default('TRUNG'),
  assetId:         z.string().optional(),
  incidentId:      z.string().optional(),
  executingUnitId: z.string().optional(),
  plannedStart:    z.string().optional(),
  plannedEnd:      z.string().optional(),
  estimatedCost:   z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional()),
  description:     z.string().optional(),
  createdById:     z.string().min(1),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof WOSchema>, string[]>>
export type WOFormState = { error?: string; fieldErrors?: FieldErrors } | null

function genCode() {
  const d = new Date()
  return `CV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getTime()).slice(-4)}`
}

export async function createWorkOrderAction(prevState: WOFormState, formData: FormData): Promise<WOFormState> {
  const user = await requireAuth()
  const raw = Object.fromEntries(formData.entries())
  const parsed = WOSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors }

  const d = parsed.data
  const wo = await db.workOrder.create({
    data: {
      workOrderCode:   genCode(),
      title:           d.title,
      type:            d.type,
      domain:          d.domain,
      priority:        d.priority,
      status:          'MOI',
      assetId:         d.assetId || null,
      incidentId:      d.incidentId || null,
      executingUnitId: d.executingUnitId || null,
      plannedStart:    d.plannedStart ? new Date(d.plannedStart) : null,
      plannedEnd:      d.plannedEnd ? new Date(d.plannedEnd) : null,
      estimatedCost:   d.estimatedCost ?? null,
      description:     d.description || null,
      createdById:     user.id,
    },
  })

  await logAction({ userId: user.id, action: 'CREATE', module: 'phieu_cv', targetId: wo.id, targetType: 'WorkOrder', detail: `Tạo phiếu CV: ${wo.title}` })
  revalidatePath('/dashboard/phieu-cong-viec')
  redirect(`/dashboard/phieu-cong-viec/${wo.id}`)
}

export async function updateWOStatusAction(id: string, newStatus: string): Promise<{ error?: string }> {
  const user = await requireAuth()
  const wo = await db.workOrder.findUnique({ where: { id } })
  if (!wo) return { error: 'Không tìm thấy phiếu công việc' }

  await db.workOrder.update({
    where: { id },
    data: {
      status: newStatus as never,
      actualStart: newStatus === 'DANG_THUC_HIEN' ? new Date() : undefined,
      actualEnd: (newStatus === 'HOAN_THANH' || newStatus === 'NGHIEM_THU') ? new Date() : undefined,
    },
  })

  await logAction({ userId: user.id, action: 'UPDATE', module: 'phieu_cv', targetId: id, targetType: 'WorkOrder', detail: `Cập nhật trạng thái → ${newStatus}` })
  revalidatePath(`/dashboard/phieu-cong-viec/${id}`)
  revalidatePath('/dashboard/phieu-cong-viec')
  return {}
}
