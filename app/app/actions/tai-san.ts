'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

// ─── Schema ──────────────────────────────────────────────────────────────────

const AssetSchema = z.object({
  assetCode:     z.string().min(1, { message: 'Mã tài sản không được để trống' }),
  nationalCode:  z.string().optional(),
  name:          z.string().min(1, { message: 'Tên tài sản không được để trống' }),
  lyTrinh:       z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  viTriDuong:    z.string().optional(),
  assetTypeId:   z.string().min(1, { message: 'Vui lòng chọn loại tài sản' }),
  domain:        z.enum(['GIAO_THONG','CAP_NUOC','THOAT_NUOC','CHIEU_SANG','CAY_XANH','MOI_TRUONG','CHINH_TRANG'], {
    message: 'Vui lòng chọn lĩnh vực',
  }),
  address:       z.string().optional(),
  wardId:        z.string().optional(),
  streetId:      z.string().optional(),
  latitude:      z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional()),
  longitude:     z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional()),
  installDate:   z.string().optional(),
  warrantyExpiry:z.string().optional(),
  manufacturer:  z.string().optional(),
  model:         z.string().optional(),
  serialNumber:  z.string().optional(),
  condition:     z.enum(['TOT','KHA','TRUNG_BINH','XAU','HONG']).default('TOT'),
  status:        z.enum(['DANG_SU_DUNG','DUNG_TAM','DANG_SUA_CHUA','NGUNG_SU_DUNG','THOAI_HOA']).default('DANG_SU_DUNG'),
  notes:         z.string().optional(),
})

type AssetFieldErrors = Partial<Record<keyof z.infer<typeof AssetSchema>, string[]>>

export type AssetFormState = {
  error?: string
  fieldErrors?: AssetFieldErrors
} | null

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createAssetAction(
  prevState: AssetFormState,
  formData: FormData
): Promise<AssetFormState> {
  const user = await requireAuth()

  const raw = Object.fromEntries(formData.entries())

  // Thu thập techSpecs từ các trường spec_KEY
  const techSpecsRaw: Record<string, string | boolean> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('spec_') && value !== '') {
      const specKey = key.slice(5)
      const sv = String(value)
      techSpecsRaw[specKey] = sv === 'true' ? true : sv === 'false' ? false : sv
    }
  }
  const techSpecs = Object.keys(techSpecsRaw).length > 0 ? techSpecsRaw : null

  const parsed = AssetSchema.safeParse(raw)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as AssetFieldErrors }
  }

  const data = parsed.data

  const existing = await db.asset.findUnique({ where: { assetCode: data.assetCode } })
  if (existing) return { error: `Mã tài sản "${data.assetCode}" đã tồn tại.` }

  const asset = await db.asset.create({
    data: {
      assetCode:     data.assetCode,
      nationalCode:  data.nationalCode || null,
      name:          data.name,
      assetTypeId:   data.assetTypeId,
      domain:        data.domain,
      address:       data.address || null,
      wardId:        data.wardId || null,
      streetId:      data.streetId || null,
      latitude:      data.latitude ?? null,
      longitude:     data.longitude ?? null,
      installDate:   data.installDate ? new Date(data.installDate) : null,
      warrantyExpiry:data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      manufacturer:  data.manufacturer || null,
      model:         data.model || null,
      serialNumber:  data.serialNumber || null,
      condition:     data.condition,
      status:        data.status,
      notes:         data.notes || null,
      lyTrinh:       data.lyTrinh ?? null,
      viTriDuong:    data.viTriDuong || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      techSpecs:     techSpecs as any,
    },
  })

  await logAction({ userId: user.id, action: 'CREATE', module: 'tai_san', targetId: asset.id, targetType: 'Asset', detail: `Tạo tài sản: ${asset.name} (${asset.assetCode})` })
  revalidatePath('/dashboard/tai-san')
  redirect('/dashboard/tai-san')
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateAssetAction(
  id: string,
  prevState: AssetFormState,
  formData: FormData
): Promise<AssetFormState> {
  const user = await requireAuth()

  const raw = Object.fromEntries(formData.entries())

  const techSpecsRaw: Record<string, string | boolean> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('spec_') && value !== '') {
      const specKey = key.slice(5)
      const sv = String(value)
      techSpecsRaw[specKey] = sv === 'true' ? true : sv === 'false' ? false : sv
    }
  }
  const techSpecs = Object.keys(techSpecsRaw).length > 0 ? techSpecsRaw : null

  const parsed = AssetSchema.safeParse(raw)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as AssetFieldErrors }
  }

  const data = parsed.data

  const existing = await db.asset.findFirst({ where: { assetCode: data.assetCode, NOT: { id } } })
  if (existing) return { error: `Mã tài sản "${data.assetCode}" đã được dùng bởi tài sản khác.` }

  const asset = await db.asset.update({
    where: { id },
    data: {
      assetCode:     data.assetCode,
      nationalCode:  data.nationalCode || null,
      name:          data.name,
      assetTypeId:   data.assetTypeId,
      domain:        data.domain,
      address:       data.address || null,
      wardId:        data.wardId || null,
      streetId:      data.streetId || null,
      latitude:      data.latitude ?? null,
      longitude:     data.longitude ?? null,
      installDate:   data.installDate ? new Date(data.installDate) : null,
      warrantyExpiry:data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      manufacturer:  data.manufacturer || null,
      model:         data.model || null,
      serialNumber:  data.serialNumber || null,
      condition:     data.condition,
      status:        data.status,
      notes:         data.notes || null,
      lyTrinh:       data.lyTrinh ?? null,
      viTriDuong:    data.viTriDuong || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      techSpecs:     techSpecs as any,
    },
  })

  await logAction({ userId: user.id, action: 'UPDATE', module: 'tai_san', targetId: asset.id, targetType: 'Asset', detail: `Cập nhật tài sản: ${asset.name}` })
  revalidatePath('/dashboard/tai-san')
  revalidatePath(`/dashboard/tai-san/${id}`)
  redirect(`/dashboard/tai-san/${id}`)
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteAssetAction(id: string): Promise<{ error?: string }> {
  const user = await requireAuth()

  const asset = await db.asset.findUnique({ where: { id } })
  if (!asset) return { error: 'Tài sản không tồn tại.' }

  // Kiểm tra liên kết
  const [woCount, inCount, incCount] = await Promise.all([
    db.workOrder.count({ where: { assetId: id } }),
    db.inspection.count({ where: { assetId: id } }),
    db.incident.count({ where: { assetId: id } }),
  ])

  if (woCount + inCount + incCount > 0) {
    return { error: 'Không thể xoá — tài sản đang có phiếu công việc, kiểm tra hoặc sự cố liên quan.' }
  }

  await db.asset.delete({ where: { id } })
  await logAction({ userId: user.id, action: 'DELETE', module: 'tai_san', targetId: id, targetType: 'Asset', detail: `Xoá tài sản: ${asset.name}` })
  revalidatePath('/dashboard/tai-san')
  redirect('/dashboard/tai-san')
}
