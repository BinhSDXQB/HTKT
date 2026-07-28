'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

const InspectionSchema = z.object({
  assetId:       z.string().min(1, { message: 'Vui lòng chọn tài sản' }),
  templateId:    z.string().min(1, { message: 'Vui lòng chọn mẫu kiểm tra' }),
  scheduledDate: z.string().min(1, { message: 'Vui lòng chọn ngày kiểm tra' }),
  inspectorId:   z.string().min(1),
  notes:         z.string().optional(),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof InspectionSchema>, string[]>>
export type InspectionFormState = { error?: string; fieldErrors?: FieldErrors } | null

function genCode() {
  const d = new Date()
  return `KT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getTime()).slice(-4)}`
}

export async function createInspectionAction(prevState: InspectionFormState, formData: FormData): Promise<InspectionFormState> {
  const user = await requireAuth()
  const raw = Object.fromEntries(formData.entries())
  const parsed = InspectionSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors }

  const { assetId, templateId, scheduledDate, notes } = parsed.data

  const ins = await db.inspection.create({
    data: {
      inspectionCode: genCode(),
      assetId,
      templateId,
      scheduledDate: new Date(scheduledDate),
      inspectorId: user.id,
      notes: notes || null,
      status: 'NHAP',
    },
  })

  await logAction({ userId: user.id, action: 'CREATE', module: 'kiem_tra', targetId: ins.id, targetType: 'Inspection', detail: `Tạo phiếu kiểm tra: ${ins.inspectionCode}` })
  revalidatePath('/dashboard/kiem-tra')
  redirect(`/dashboard/kiem-tra/${ins.id}`)
}
