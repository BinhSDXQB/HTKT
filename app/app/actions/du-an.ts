'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

const ProjectSchema = z.object({
  name:            z.string().min(1, { message: 'Vui lòng nhập tên dự án' }),
  nationalCode:    z.string().optional(),
  domain:          z.enum(['GIAO_THONG','CAP_NUOC','THOAT_NUOC','CHIEU_SANG','CAY_XANH','MOI_TRUONG','CHINH_TRANG'], { message: 'Vui lòng chọn lĩnh vực' }),
  type:            z.enum(['XAY_MOI','CAI_TAO','BAO_TRI_LON','KHAC']).default('XAY_MOI'),
  wardId:          z.string().optional(),
  investor:        z.string().optional(),
  executingUnitId: z.string().optional(),
  totalBudget:     z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional()),
  fundingSource:   z.string().optional(),
  startDate:       z.string().optional(),
  endDate:         z.string().optional(),
  decisionNumber:  z.string().optional(),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof ProjectSchema>, string[]>>
export type ProjectFormState = { error?: string; fieldErrors?: FieldErrors } | null

function genCode() {
  const d = new Date()
  return `DA-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getTime()).slice(-4)}`
}

export async function createProjectAction(prevState: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const user = await requireAuth()
  const raw = Object.fromEntries(formData.entries())
  const parsed = ProjectSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors }

  const d = parsed.data
  const project = await db.project.create({
    data: {
      projectCode:     genCode(),
      nationalCode:    d.nationalCode || null,
      name:            d.name,
      domain:          d.domain,
      type:            d.type,
      wardId:          d.wardId || null,
      investor:        d.investor || null,
      executingUnitId: d.executingUnitId || null,
      totalBudget:     d.totalBudget ?? null,
      fundingSource:   d.fundingSource || null,
      startDate:       d.startDate ? new Date(d.startDate) : null,
      endDate:         d.endDate ? new Date(d.endDate) : null,
      decisionNumber:  d.decisionNumber || null,
      status:          'CHUAN_BI',
    },
  })

  await logAction({ userId: user.id, action: 'CREATE', module: 'du_an', targetId: project.id, targetType: 'Project', detail: `Tạo dự án: ${project.name}` })
  revalidatePath('/dashboard/du-an')
  redirect(`/dashboard/du-an/${project.id}`)
}
