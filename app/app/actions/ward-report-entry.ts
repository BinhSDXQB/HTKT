'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getWardReportPerms } from '@/lib/ward-report-perms'

export async function addWardReportRow(params: {
  wardId: string
  year: number
  category: string
  rowData: Record<string, unknown>
  coords?: { doDauLat?: number; doDauLng?: number; doCuoiLat?: number; doCuoiLng?: number; toaDoLat?: number; toaDoLng?: number }
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (!perms.canWrite) return { ok: false, error: 'Không có quyền nhập liệu.' }
  if (perms.limitWardId && perms.limitWardId !== params.wardId) {
    return { ok: false, error: 'Không có quyền sửa dữ liệu phường/xã khác.' }
  }

  try {
    const categoryMap: Record<string, string> = {
      'DUONG': 'ReportDuong',
      'DIEN_CHIEU_SANG': 'ReportDienCS',
      'THOAT_NUOC_BC': 'ReportThoatNuoc',
      'CAY_XANH': 'ReportCayXanh',
      'CONG_VIEN': 'ReportCongVien',
    }

    const model = categoryMap[params.category]
    if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }

    const data: Record<string, unknown> = {
      wardId: params.wardId,
      year: params.year,
      status: 'NHAP',
      createdById: user.id,
      ...params.rowData,
    }

    if (params.coords) {
      if (params.coords.doDauLat != null) data.toaDoDauLat = params.coords.doDauLat
      if (params.coords.doDauLng != null) data.toaDoDauLng = params.coords.doDauLng
      if (params.coords.doCuoiLat != null) data.toaDoCuoiLat = params.coords.doCuoiLat
      if (params.coords.doCuoiLng != null) data.toaDoCuoiLng = params.coords.doCuoiLng
      if (params.coords.toaDoLat != null) data.toaDoLat = params.coords.toaDoLat
      if (params.coords.toaDoLng != null) data.toaDoLng = params.coords.toaDoLng
    }

    await (db[model as never] as any).create({ data })
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
  coords?: { doDauLat?: number; doDauLng?: number; doCuoiLat?: number; doCuoiLng?: number; toaDoLat?: number; toaDoLng?: number }
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (!perms.canWrite) return { ok: false, error: 'Không có quyền sửa liệu.' }

  try {
    const categoryMap: Record<string, string> = {
      'DUONG': 'ReportDuong',
      'DIEN_CHIEU_SANG': 'ReportDienCS',
      'THOAT_NUOC_BC': 'ReportThoatNuoc',
      'CAY_XANH': 'ReportCayXanh',
      'CONG_VIEN': 'ReportCongVien',
    }

    const model = categoryMap[params.category]
    if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }

    const data: Record<string, unknown> = params.rowData

    if (params.coords) {
      if (params.coords.doDauLat != null) data.toaDoDauLat = params.coords.doDauLat
      if (params.coords.doDauLng != null) data.toaDoDauLng = params.coords.doDauLng
      if (params.coords.doCuoiLat != null) data.toaDoCuoiLat = params.coords.doCuoiLat
      if (params.coords.doCuoiLng != null) data.toaDoCuoiLng = params.coords.doCuoiLng
      if (params.coords.toaDoLat != null) data.toaDoLat = params.coords.toaDoLat
      if (params.coords.toaDoLng != null) data.toaDoLng = params.coords.toaDoLng
    }

    const existing = await (db[model as never] as any).findUnique({ where: { id: params.id }, select: { wardId: true } })
    if (!existing) return { ok: false, error: 'Không tìm thấy bản ghi.' }

    if (perms.limitWardId && perms.limitWardId !== existing.wardId) {
      return { ok: false, error: 'Không có quyền sửa dữ liệu phường/xã khác.' }
    }

    await (db[model as never] as any).update({ where: { id: params.id }, data })
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

  try {
    const categoryMap: Record<string, string> = {
      'DUONG': 'ReportDuong',
      'DIEN_CHIEU_SANG': 'ReportDienCS',
      'THOAT_NUOC_BC': 'ReportThoatNuoc',
      'CAY_XANH': 'ReportCayXanh',
      'CONG_VIEN': 'ReportCongVien',
    }

    const model = categoryMap[params.category]
    if (!model) return { ok: false, error: 'Danh mục không hợp lệ.' }

    const existing = await (db[model as never] as any).findUnique({ where: { id: params.id }, select: { wardId: true } })
    if (!existing) return { ok: false, error: 'Không tìm thấy bản ghi.' }

    if (perms.limitWardId && perms.limitWardId !== existing.wardId) {
      return { ok: false, error: 'Không có quyền xoá dữ liệu phường/xã khác.' }
    }

    await (db[model as never] as any).delete({ where: { id: params.id } })
    revalidatePath(`/dashboard/bao-cao/nhap-lieu/${params.category}`)
    return { ok: true }
  } catch (e) {
    console.error('[deleteWardReportRow]', e)
    return { ok: false, error: 'Lỗi xoá dữ liệu, vui lòng thử lại.' }
  }
}
