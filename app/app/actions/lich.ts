'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// ===== Lịch công tác cá nhân =====
// Phạm vi xem: việc của mình + mục công khai (congKhai) cùng phòng + admin/Lãnh đạo
// Sở xem tất cả (helper lichScopeWhere ở lib/lich-scope.ts). Chỉ chủ lịch (hoặc
// admin) được sửa/xoá.

const LOAI = ['HOP', 'CONG_TAC', 'TRUC', 'NGHI', 'KHAC'] as const

export type LichFormState = { error?: string; fieldErrors?: Record<string, string[]>; ok?: boolean; id?: string } | null

function parseDateTime(v?: string | null): Date | null {
  if (!v || !v.trim()) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

const Schema = z.object({
  id:       z.string().optional(),
  tieuDe:   z.string().min(1, { message: 'Nhập tiêu đề' }),
  moTa:     z.string().optional(),
  diaDiem:  z.string().optional(),
  loai:     z.enum(LOAI).default('KHAC'),
  mauSac:   z.string().optional(),
  batDau:   z.string().min(1, { message: 'Chọn thời gian bắt đầu' }),
  ketThuc:  z.string().optional(),
  congKhai: z.string().optional(),  // 'on' khi tick
})

/** Tạo mới mục lịch của bản thân. */
export async function createLichAction(prev: LichFormState, formData: FormData): Promise<LichFormState> {
  const user = await requireAuth()
  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data
  const batDau = parseDateTime(d.batDau)
  if (!batDau) return { error: 'Thời gian bắt đầu không hợp lệ.' }
  const ketThuc = parseDateTime(d.ketThuc)
  if (ketThuc && ketThuc < batDau) return { error: 'Thời gian kết thúc phải sau thời gian bắt đầu.' }

  const lich = await db.lichCaNhan.create({
    data: {
      userId: user.id,
      toChucId: user.toChucId || null,
      tieuDe: d.tieuDe,
      moTa: d.moTa || null,
      diaDiem: d.diaDiem || null,
      loai: d.loai,
      mauSac: d.mauSac?.trim() || null,
      batDau,
      ketThuc,
      congKhai: d.congKhai === 'on',
    },
  })
  revalidatePath('/dashboard/cong-viec')
  return { ok: true, id: lich.id }
}

/** Sửa mục lịch — chỉ chủ lịch hoặc admin. */
export async function updateLichAction(prev: LichFormState, formData: FormData): Promise<LichFormState> {
  const user = await requireAuth()
  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data
  if (!d.id) return { error: 'Thiếu mã mục lịch.' }
  const cur = await db.lichCaNhan.findUnique({ where: { id: d.id }, select: { userId: true } })
  if (!cur || (cur.userId !== user.id && user.role.name !== 'admin')) return { error: 'Không có quyền sửa mục lịch này.' }
  const batDau = parseDateTime(d.batDau)
  if (!batDau) return { error: 'Thời gian bắt đầu không hợp lệ.' }
  const ketThuc = parseDateTime(d.ketThuc)
  if (ketThuc && ketThuc < batDau) return { error: 'Thời gian kết thúc phải sau thời gian bắt đầu.' }

  await db.lichCaNhan.update({
    where: { id: d.id },
    data: {
      tieuDe: d.tieuDe, moTa: d.moTa || null, diaDiem: d.diaDiem || null,
      loai: d.loai, mauSac: d.mauSac?.trim() || null,
      batDau, ketThuc, congKhai: d.congKhai === 'on',
    },
  })
  revalidatePath('/dashboard/cong-viec')
  return { ok: true, id: d.id }
}

/** Lưu (tạo nếu chưa có id, sửa nếu có) — dùng cho 1 form chung trên UI lịch. */
export async function saveLichAction(prev: LichFormState, formData: FormData): Promise<LichFormState> {
  const id = String(formData.get('id') ?? '').trim()
  return id ? updateLichAction(prev, formData) : createLichAction(prev, formData)
}

/** Xoá mềm mục lịch — chỉ chủ lịch hoặc admin. */
export async function deleteLichAction(prev: LichFormState, formData: FormData): Promise<LichFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const cur = await db.lichCaNhan.findUnique({ where: { id }, select: { userId: true } })
  if (!cur || (cur.userId !== user.id && user.role.name !== 'admin')) return { error: 'Không có quyền xoá mục lịch này.' }
  await db.lichCaNhan.update({ where: { id }, data: { deletedAt: new Date() } })
  revalidatePath('/dashboard/cong-viec')
  return { ok: true }
}
