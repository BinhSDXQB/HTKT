'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getWardReportPerms } from '@/lib/ward-report-perms'
import { CATEGORY_MODEL, columnsForCategory, editableColumns, coerceCellValue } from '@/lib/ward-report-schema'

// CRUD trực tuyến cho 7 biểu mẫu HTKT xã/phường (Report*). Định tuyến qua
// CATEGORY_MODEL (camelCase = delegate Prisma) — dùng chung cho cả 7 loại,
// không lặp map. rowData được LỌC + ÉP KIỂU server-side theo SHEET_COLUMNS để
// chỉ ghi đúng trường hợp lệ (chặn field lạ / sai kiểu).

type Coords = {
  doDauLat?: number; doDauLng?: number
  doCuoiLat?: number; doCuoiLng?: number
  toaDoLat?: number; toaDoLng?: number
}

const db_ = db as unknown as Record<string, {
  create: (a: unknown) => Promise<unknown>
  createMany: (a: unknown) => Promise<{ count: number }>
  update: (a: unknown) => Promise<unknown>
  delete: (a: unknown) => Promise<unknown>
  findUnique: (a: unknown) => Promise<{ wardId: string } | null>
  findMany: (a: unknown) => Promise<Record<string, unknown>[]>
}>

// Các trường toạ độ (tuỳ loại) — sao chép nguyên khi nhân bản năm.
const COORD_KEYS = ['toaDoDauLat', 'toaDoDauLng', 'toaDoCuoiLat', 'toaDoCuoiLng', 'toaDoLat', 'toaDoLng']

function delegate(category: string) {
  const model = CATEGORY_MODEL[category]
  return model ? db_[model] : null
}

/** Lọc rowData: chỉ giữ trường khai báo trong SHEET_COLUMNS, ép kiểu theo cột. */
function sanitizeRow(category: string, rowData: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of columnsForCategory(category)) {
    if (Object.prototype.hasOwnProperty.call(rowData, c.field)) {
      out[c.field] = coerceCellValue(c.type, rowData[c.field])
    }
  }
  return out
}

/** Kiểm tra trường bắt buộc (server-side; bỏ STT vì tự đánh số). */
function missingRequired(category: string, data: Record<string, unknown>): string | null {
  for (const c of editableColumns(category)) {
    if (c.required && (data[c.field] === undefined || data[c.field] === null || data[c.field] === '')) {
      return c.name
    }
  }
  return null
}

function applyCoords(data: Record<string, unknown>, coords?: Coords) {
  if (!coords) return
  if (coords.doDauLat != null) data.toaDoDauLat = coords.doDauLat
  if (coords.doDauLng != null) data.toaDoDauLng = coords.doDauLng
  if (coords.doCuoiLat != null) data.toaDoCuoiLat = coords.doCuoiLat
  if (coords.doCuoiLng != null) data.toaDoCuoiLng = coords.doCuoiLng
  if (coords.toaDoLat != null) data.toaDoLat = coords.toaDoLat
  if (coords.toaDoLng != null) data.toaDoLng = coords.toaDoLng
}

export async function addWardReportRow(params: {
  wardId: string
  year: number
  category: string
  rowData: Record<string, unknown>
  coords?: Coords
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (!perms.canWrite) return { ok: false, error: 'Không có quyền nhập liệu.' }
  if (perms.limitWardId && perms.limitWardId !== params.wardId) {
    return { ok: false, error: 'Không có quyền sửa dữ liệu phường/xã khác.' }
  }

  const model = delegate(params.category)
  if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }

  const clean = sanitizeRow(params.category, params.rowData)
  const missing = missingRequired(params.category, clean)
  if (missing) return { ok: false, error: `Vui lòng nhập: ${missing}` }

  try {
    const data: Record<string, unknown> = {
      wardId: params.wardId,
      year: params.year,
      status: 'NHAP',
      createdById: user.id,
      ...clean,
    }
    applyCoords(data, params.coords)
    await model.create({ data })
    revalidatePath(`/dashboard/bao-cao/nhap-lieu/${params.category}`)
    return { ok: true }
  } catch (e) {
    console.error('[addWardReportRow]', e)
    return { ok: false, error: 'Lỗi lưu dữ liệu, vui lòng thử lại.' }
  }
}

export async function updateWardReportRow(params: {
  id: string
  category: string
  rowData: Record<string, unknown>
  coords?: Coords
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (!perms.canWrite) return { ok: false, error: 'Không có quyền sửa liệu.' }

  const model = delegate(params.category)
  if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }

  const clean = sanitizeRow(params.category, params.rowData)
  const missing = missingRequired(params.category, clean)
  if (missing) return { ok: false, error: `Vui lòng nhập: ${missing}` }

  try {
    const existing = await model.findUnique({ where: { id: params.id }, select: { wardId: true } })
    if (!existing) return { ok: false, error: 'Không tìm thấy bản ghi.' }
    if (perms.limitWardId && perms.limitWardId !== existing.wardId) {
      return { ok: false, error: 'Không có quyền sửa dữ liệu phường/xã khác.' }
    }

    const data: Record<string, unknown> = { ...clean }
    applyCoords(data, params.coords)
    await model.update({ where: { id: params.id }, data })
    revalidatePath(`/dashboard/bao-cao/nhap-lieu/${params.category}`)
    return { ok: true }
  } catch (e) {
    console.error('[updateWardReportRow]', e)
    return { ok: false, error: 'Lỗi cập nhật dữ liệu, vui lòng thử lại.' }
  }
}

export async function deleteWardReportRow(params: {
  id: string
  category: string
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (!perms.canWrite) return { ok: false, error: 'Không có quyền xoá dữ liệu.' }

  const model = delegate(params.category)
  if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }

  try {
    const existing = await model.findUnique({ where: { id: params.id }, select: { wardId: true } })
    if (!existing) return { ok: false, error: 'Không tìm thấy bản ghi.' }
    if (perms.limitWardId && perms.limitWardId !== existing.wardId) {
      return { ok: false, error: 'Không có quyền xoá dữ liệu phường/xã khác.' }
    }

    await model.delete({ where: { id: params.id } })
    revalidatePath(`/dashboard/bao-cao/nhap-lieu/${params.category}`)
    return { ok: true }
  } catch (e) {
    console.error('[deleteWardReportRow]', e)
    return { ok: false, error: 'Lỗi xoá dữ liệu, vui lòng thử lại.' }
  }
}

/** Sao chép toàn bộ dòng của 1 biểu mẫu từ năm nguồn → năm đích (trạng thái NHAP). */
export async function copyWardReportYear(params: {
  category: string
  wardId: string
  fromYear: number
  toYear: number
}): Promise<{ ok: boolean; error?: string; count?: number }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (!perms.canWrite) return { ok: false, error: 'Không có quyền nhập liệu.' }
  if (perms.limitWardId && perms.limitWardId !== params.wardId) {
    return { ok: false, error: 'Không có quyền sửa dữ liệu phường/xã khác.' }
  }

  const model = delegate(params.category)
  if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }
  if (params.fromYear === params.toYear) return { ok: false, error: 'Năm nguồn và năm đích trùng nhau.' }

  try {
    const rows = await model.findMany({ where: { wardId: params.wardId, year: params.fromYear } })
    if (rows.length === 0) {
      return { ok: false, error: `Năm ${params.fromYear} chưa có dữ liệu để sao chép.` }
    }

    const cols = columnsForCategory(params.category)
    const data = rows.map((r) => {
      const o: Record<string, unknown> = {
        wardId: params.wardId,
        year: params.toYear,
        status: 'NHAP',
        createdById: user.id,
      }
      for (const c of cols) if (r[c.field] != null) o[c.field] = r[c.field]
      for (const k of COORD_KEYS) if (r[k] != null) o[k] = r[k]
      return o
    })

    const res = await model.createMany({ data })
    revalidatePath(`/dashboard/bao-cao/nhap-lieu/${params.category}`)
    return { ok: true, count: res.count ?? data.length }
  } catch (e) {
    console.error('[copyWardReportYear]', e)
    return { ok: false, error: 'Lỗi sao chép dữ liệu, vui lòng thử lại.' }
  }
}
