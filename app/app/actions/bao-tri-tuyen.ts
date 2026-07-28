'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser, isLeadership } from '@/lib/auth'

const LINH_VUC = 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon'
const TO_CHUC_ID = 'tc_ban_bao_tri_gt'
const ALLOWED_MA = ['BAN_BAO_TRI_GT', 'PHONG_HTKT']

async function genMa(): Promise<string> {
  const year = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    const n = Math.floor(100000 + Math.random() * 900000)
    const ma = `BT-${year}-${n}`
    const existed = await db.nghiepVuBanGhi.findUnique({ where: { maBanGhi: ma }, select: { id: true } })
    if (!existed) return ma
  }
  return `BT-${year}-${Date.now().toString().slice(-6)}`
}

export type BaoTriTuyenInput = {
  id?: string
  tieuDe: string
  diaBan: string
  ghiChu?: string | null
  chieuDai?: number | null
  matCat?: number | null
  matCatQH?: number | null
  diemDau?: string | null
  diemCuoi?: string | null
  ketCau?: string | null
  tinhTrang?: string | null
  namBaoTri?: number | null
  toaDoDauLat?: number | null
  toaDoDauLng?: number | null
  toaDoCuoiLat?: number | null
  toaDoCuoiLng?: number | null
  namDuyTu?: number | null
  kinhPhiDuyTu?: number | null
  noiDungDuyTu?: string | null
  donViThucHien?: string | null
}

async function checkEdit(diaBan?: string | null): Promise<{ ok: boolean; userId: string }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (isLeadership(user)) return { ok: true, userId: user.id }

  if (user.toChucId) {
    const tc = await db.toChuc.findUnique({ where: { id: user.toChucId }, select: { ma: true } })
    if (tc?.ma && ALLOWED_MA.includes(tc.ma)) return { ok: true, userId: user.id }
  }

  if (user.wardId) {
    const ward = await db.administrativeUnit.findUnique({
      where: { id: user.wardId },
      select: { name: true },
    })
    const wardName = ward?.name ?? ''
    if (wardName && (!diaBan || diaBan === wardName)) return { ok: true, userId: user.id }
  }

  return { ok: false, userId: user.id }
}

export async function saveBaoTriTuyen(
  input: BaoTriTuyenInput
): Promise<{ ok: boolean; error?: string }> {
  const { ok, userId } = await checkEdit(input.diaBan)
  if (!ok) return { ok: false, error: 'Không có quyền thực hiện thao tác này.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customFields: Record<string, any> = {}
  if (input.chieuDai != null) customFields.chieuDai = input.chieuDai
  if (input.matCat != null) customFields.matCat = input.matCat
  if (input.matCatQH != null) customFields.matCatQH = input.matCatQH
  if (input.diemDau) customFields.diemDau = input.diemDau
  if (input.diemCuoi) customFields.diemCuoi = input.diemCuoi
  if (input.ketCau) customFields.ketCau = input.ketCau
  if (input.tinhTrang) customFields.tinhTrang = input.tinhTrang
  if (input.namBaoTri != null) customFields.namBaoTri = input.namBaoTri
  if (input.toaDoDauLat != null) customFields.toaDoDauLat = input.toaDoDauLat
  if (input.toaDoDauLng != null) customFields.toaDoDauLng = input.toaDoDauLng
  if (input.toaDoCuoiLat != null) customFields.toaDoCuoiLat = input.toaDoCuoiLat
  if (input.toaDoCuoiLng != null) customFields.toaDoCuoiLng = input.toaDoCuoiLng
  if (input.namDuyTu != null) customFields.namDuyTu = input.namDuyTu
  if (input.kinhPhiDuyTu != null) customFields.kinhPhiDuyTu = input.kinhPhiDuyTu
  if (input.noiDungDuyTu) customFields.noiDungDuyTu = input.noiDungDuyTu
  if (input.donViThucHien) customFields.donViThucHien = input.donViThucHien

  const commonData = {
    tieuDe: input.tieuDe,
    diaBan: input.diaBan,
    ghiChu: input.ghiChu || null,
    customFields: customFields as never,
  }

  try {
    if (input.id) {
      const cur = await db.nghiepVuBanGhi.findUnique({
        where: { id: input.id },
        select: { deletedAt: true },
      })
      if (!cur || cur.deletedAt) return { ok: false, error: 'Không tìm thấy bản ghi.' }
      await db.nghiepVuBanGhi.update({ where: { id: input.id }, data: commonData })
    } else {
      await db.nghiepVuBanGhi.create({
        data: {
          ...commonData,
          linhVuc: LINH_VUC,
          toChucId: TO_CHUC_ID,
          maBanGhi: await genMa(),
          trangThai: 'DANG_HOAT_DONG',
          createdById: userId,
        },
      })
    }

    revalidatePath('/dashboard/phong-htkt/bao-tri-duong')
    revalidatePath('/dashboard/trung-tam-bao-tri/tuyen-duong-mat-cat-lon')
    return { ok: true }
  } catch (e) {
    console.error('[saveBaoTriTuyen]', e)
    return { ok: false, error: 'Lỗi lưu dữ liệu, vui lòng thử lại.' }
  }
}

export async function deleteBaoTriTuyen(id: string): Promise<{ ok: boolean; error?: string }> {
  const record = await db.nghiepVuBanGhi.findUnique({
    where: { id },
    select: { diaBan: true, deletedAt: true },
  })
  if (!record || record.deletedAt) return { ok: false, error: 'Không tìm thấy bản ghi.' }

  const { ok } = await checkEdit(record.diaBan)
  if (!ok) return { ok: false, error: 'Không có quyền xoá bản ghi này.' }

  try {
    await db.nghiepVuBanGhi.update({ where: { id }, data: { deletedAt: new Date() } })
    revalidatePath('/dashboard/phong-htkt/bao-tri-duong')
    revalidatePath('/dashboard/trung-tam-bao-tri/tuyen-duong-mat-cat-lon')
    return { ok: true }
  } catch (e) {
    console.error('[deleteBaoTriTuyen]', e)
    return { ok: false, error: 'Lỗi xoá dữ liệu, vui lòng thử lại.' }
  }
}
