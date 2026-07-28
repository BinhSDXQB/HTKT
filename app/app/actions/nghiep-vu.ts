'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getNghiepVuSchema } from '@/lib/nghiep-vu/schema'

// ===== Hồ sơ nghiệp vụ động (dùng chung mọi phòng — QĐ 331) =====
// Cô lập dữ liệu theo toChucId (phòng sở hữu). Người dùng tới được trang đã qua gate
// requireDeptAccess (admin hoặc cán bộ phòng đó), nên scope theo toChucId là đủ.

export type NvRecord = {
  id: string
  maBanGhi: string
  tieuDe: string
  trangThai: string
  diaBan: string | null
  ngayGhiNhan: string | null
  ghiChu: string | null
  customFields: Record<string, unknown>
  createdByName: string | null
  createdAt: string
}

export type NvSaveInput = {
  id?: string
  linhVuc: string
  tieuDe: string
  trangThai: string
  diaBan?: string
  ngayGhiNhan?: string
  ghiChu?: string
  customFields: Record<string, string>
}

export type NvResult = { ok: boolean; error?: string; id?: string }

// Ép kiểu customFields theo schema lĩnh vực (number → số; bỏ trường rỗng).
function coerceCustomFields(linhVuc: string, raw: Record<string, string>): Record<string, unknown> {
  const schema = getNghiepVuSchema(linhVuc)
  if (!schema) return {}
  const out: Record<string, unknown> = {}
  for (const f of schema.fields) {
    const v = (raw?.[f.key] ?? '').toString().trim()
    if (!v) continue
    if (f.type === 'number') {
      const n = Number(v.replace(/[,\s]/g, ''))
      if (!Number.isNaN(n)) out[f.key] = n
    } else {
      out[f.key] = v
    }
  }
  return out
}

function parseDate(v?: string): Date | null {
  if (!v || !v.trim()) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Danh sách bản ghi của một lĩnh vực — scope theo phòng. */
export async function listNghiepVu(linhVuc: string): Promise<NvRecord[]> {
  const user = await requireAuth()
  if (!getNghiepVuSchema(linhVuc)) return []

  const where: Record<string, unknown> = { linhVuc, deletedAt: null }
  if (user.role.name !== 'admin') {
    where.toChucId = user.toChucId ?? '__none__'
  }

  const rows = await db.nghiepVuBanGhi.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { createdBy: { select: { name: true } } },
  })

  return rows.map((r) => ({
    id: r.id,
    maBanGhi: r.maBanGhi,
    tieuDe: r.tieuDe,
    trangThai: r.trangThai,
    diaBan: r.diaBan,
    ngayGhiNhan: r.ngayGhiNhan ? r.ngayGhiNhan.toISOString() : null,
    ghiChu: r.ghiChu,
    customFields: (r.customFields as Record<string, unknown>) ?? {},
    createdByName: r.createdBy?.name ?? null,
    createdAt: r.createdAt.toISOString(),
  }))
}

async function genMaBanGhi(): Promise<string> {
  const year = new Date().getFullYear()
  for (let i = 0; i < 8; i++) {
    const n = Math.floor(100000 + Math.random() * 900000)
    const ma = `NV-${year}-${n}`
    const existed = await db.nghiepVuBanGhi.findUnique({ where: { maBanGhi: ma }, select: { id: true } })
    if (!existed) return ma
  }
  return `NV-${year}-${Date.now().toString().slice(-6)}`
}

/** Tạo hoặc cập nhật bản ghi nghiệp vụ. */
export async function saveNghiepVu(input: NvSaveInput): Promise<NvResult> {
  const user = await requireAuth()
  const schema = getNghiepVuSchema(input.linhVuc)
  if (!schema) return { ok: false, error: 'Lĩnh vực không hợp lệ.' }
  const tieuDe = (input.tieuDe ?? '').trim()
  if (!tieuDe) return { ok: false, error: 'Vui lòng nhập ' + schema.tieuDeLabel.toLowerCase() + '.' }

  const customFields = coerceCustomFields(input.linhVuc, input.customFields)
  const data = {
    tieuDe,
    trangThai: input.trangThai || 'MOI',
    diaBan: input.diaBan?.trim() || null,
    ngayGhiNhan: parseDate(input.ngayGhiNhan),
    ghiChu: input.ghiChu?.trim() || null,
    customFields: customFields as never,
  }

  // Cập nhật
  if (input.id) {
    const cur = await db.nghiepVuBanGhi.findUnique({
      where: { id: input.id },
      select: { toChucId: true, createdById: true, linhVuc: true },
    })
    if (!cur || cur.linhVuc !== input.linhVuc) return { ok: false, error: 'Không tìm thấy bản ghi.' }
    const canEdit =
      user.role.name === 'admin' ||
      (cur.toChucId && cur.toChucId === user.toChucId) ||
      cur.createdById === user.id
    if (!canEdit) return { ok: false, error: 'Bạn không có quyền sửa bản ghi này.' }
    await db.nghiepVuBanGhi.update({ where: { id: input.id }, data })
    return { ok: true, id: input.id }
  }

  // Tạo mới
  if (user.role.name !== 'admin' && !user.toChucId) {
    return { ok: false, error: 'Tài khoản chưa gắn phòng/đơn vị nên không thể tạo bản ghi.' }
  }
  const created = await db.nghiepVuBanGhi.create({
    data: {
      ...data,
      linhVuc: input.linhVuc,
      toChucId: user.toChucId ?? null,
      maBanGhi: await genMaBanGhi(),
      createdById: user.id,
    },
  })
  return { ok: true, id: created.id }
}

/** Xoá mềm bản ghi — admin / cùng phòng / người tạo. */
export async function deleteNghiepVu(id: string): Promise<NvResult> {
  const user = await requireAuth()
  const cur = await db.nghiepVuBanGhi.findUnique({
    where: { id },
    select: { toChucId: true, createdById: true },
  })
  if (!cur) return { ok: false, error: 'Không tìm thấy bản ghi.' }
  const canDelete =
    user.role.name === 'admin' ||
    (cur.toChucId && cur.toChucId === user.toChucId) ||
    cur.createdById === user.id
  if (!canDelete) return { ok: false, error: 'Bạn không có quyền xoá bản ghi này.' }
  await db.nghiepVuBanGhi.update({ where: { id }, data: { deletedAt: new Date() } })
  return { ok: true }
}
