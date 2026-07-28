'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

const ConfigSchema = z.object({
  coQuanCapTren: z.string().optional(),
  tenCoQuan:     z.string().optional(),
  tenDonVi:      z.string().optional(),
  diaChi:        z.string().optional(),
  dienThoai:     z.string().optional(),
  email:         z.string().optional(),
  website:       z.string().optional(),
})

export type ConfigFormState = { error?: string; success?: string } | null

export async function saveFacilityConfigAction(prevState: ConfigFormState, formData: FormData): Promise<ConfigFormState> {
  const user = await requireAuth()
  const raw = Object.fromEntries(formData.entries())
  const parsed = ConfigSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ' }

  const d = parsed.data
  const existing = await db.facilityConfig.findFirst()

  const payload = {
    coQuanCapTren: d.coQuanCapTren ?? '',
    tenCoQuan:     d.tenCoQuan ?? '',
    tenDonVi:      d.tenDonVi ?? '',
    diaChi:        d.diaChi ?? '',
    dienThoai:     d.dienThoai ?? '',
    email:         d.email ?? '',
    website:       d.website ?? '',
  }

  if (existing) {
    await db.facilityConfig.update({ where: { id: existing.id }, data: payload })
  } else {
    await db.facilityConfig.create({ data: payload })
  }

  await logAction({ userId: user.id, action: 'UPDATE', module: 'admin', detail: 'Cập nhật thông tin cơ quan' })
  revalidatePath('/dashboard/cai-dat/co-quan')
  return { success: 'Đã lưu thông tin cơ quan' }
}
