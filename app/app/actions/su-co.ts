'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

const IncidentSchema = z.object({
  title:        z.string().min(1, { message: 'Vui lòng nhập tiêu đề sự cố' }),
  domain:       z.enum(['GIAO_THONG','CAP_NUOC','THOAT_NUOC','CHIEU_SANG','CAY_XANH','MOI_TRUONG','CHINH_TRANG'], { message: 'Vui lòng chọn lĩnh vực' }),
  source:       z.enum(['BAO_CAO_NV','PHAN_ANH_CD','KET_QUA_KIEM','HE_THONG']).default('BAO_CAO_NV'),
  priority:     z.enum(['THAP','TRUNG','CAO','KHAN_CAP']).default('TRUNG'),
  assetId:      z.string().optional(),
  address:      z.string().optional(),
  wardId:       z.string().optional(),
  reporterName: z.string().optional(),
  reporterPhone:z.string().optional(),
  deadlineAt:   z.string().optional(),
  description:  z.string().optional(),
  reportedById: z.string().optional(),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof IncidentSchema>, string[]>>
export type IncidentFormState = { error?: string; fieldErrors?: FieldErrors } | null

function genCode() {
  const d = new Date()
  return `SC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getTime()).slice(-4)}`
}

export async function createIncidentAction(prevState: IncidentFormState, formData: FormData): Promise<IncidentFormState> {
  const user = await requireAuth()
  const raw = Object.fromEntries(formData.entries())
  const parsed = IncidentSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors }

  const d = parsed.data
  const inc = await db.incident.create({
    data: {
      incidentCode:  genCode(),
      title:         d.title,
      domain:        d.domain,
      source:        d.source,
      priority:      d.priority,
      assetId:       d.assetId || null,
      address:       d.address || null,
      wardId:        d.wardId || null,
      reporterName:  d.reporterName || null,
      reporterPhone: d.reporterPhone || null,
      deadlineAt:    d.deadlineAt ? new Date(d.deadlineAt) : null,
      description:   d.description || null,
      reportedById:  user.id,
      status:        'MOI',
    },
  })

  await logAction({ userId: user.id, action: 'CREATE', module: 'su_co', targetId: inc.id, targetType: 'Incident', detail: `Ghi nhận sự cố: ${inc.title}` })
  revalidatePath('/dashboard/su-co')
  redirect(`/dashboard/su-co/${inc.id}`)
}

export async function updateIncidentStatusAction(id: string, newStatus: string): Promise<{ error?: string }> {
  const user = await requireAuth()
  const inc = await db.incident.findUnique({ where: { id } })
  if (!inc) return { error: 'Không tìm thấy sự cố' }

  await db.incident.update({
    where: { id },
    data: {
      status: newStatus as never,
      resolvedAt: newStatus === 'DONG' ? new Date() : undefined,
      resolvedById: newStatus === 'DONG' ? user.id : undefined,
    },
  })

  await logAction({ userId: user.id, action: 'UPDATE', module: 'su_co', targetId: id, targetType: 'Incident', detail: `Cập nhật trạng thái → ${newStatus}` })
  revalidatePath(`/dashboard/su-co/${id}`)
  revalidatePath('/dashboard/su-co')
  return {}
}
