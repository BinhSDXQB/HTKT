'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getQd72Auth } from '@/lib/qd72/auth'
import { coTheSua } from '@/lib/qd72/phan-quyen'
import { getEntryPhieu, type EntryField } from '@/lib/qd72/phieu-entry'

// CRUD bản ghi con Phiếu 02/03/04 (đường/dây-cáp/nguồn nước) trong 1 hồ sơ khảo sát.
// Ghi thẳng cột chính theo config phieu-entry; quyền theo hồ sơ cha (coTheSua + scope địa bàn).

const db_ = db as unknown as Record<string, {
  findMany: (a: unknown) => Promise<Record<string, unknown>[]>
  findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
  create: (a: unknown) => Promise<{ id: string }>
  update: (a: unknown) => Promise<{ id: string }>
}>

export type ChildResult = { ok: boolean; error?: string; id?: string }
export type ChildRow = { id: string; label: string; fields: Record<string, unknown> }

function coerce(f: EntryField, raw: unknown): unknown {
  if (raw === '' || raw === undefined || raw === null) return f.type === 'boolean' ? false : null
  if (f.type === 'number') { const n = Number(String(raw).replace(/,/g, '')); return Number.isFinite(n) ? n : null }
  if (f.type === 'integer') { const n = Number(String(raw).replace(/,/g, '')); return Number.isFinite(n) ? Math.round(n) : null }
  if (f.type === 'boolean') return raw === true || raw === 'true' || raw === 1 || raw === '1'
  return String(raw)
}

async function loadCaseForChild(caseId: string) {
  return (db as unknown as { qd72_survey_cases: { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> } })
    .qd72_survey_cases.findUnique({ where: { id: caseId }, select: { id: true, trang_thai: true, don_vi_hanh_chinh_id: true } })
}

export async function listChildRecords(caseId: string, phieuMa: string): Promise<ChildRow[]> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  const phieu = getEntryPhieu(phieuMa)
  if (!phieu) return []

  const select: Record<string, boolean> = { id: true }
  for (const f of phieu.fields) select[f.key] = true

  const rows = await db_[phieu.table].findMany({ where: { survey_case_id: caseId }, select, orderBy: { created_at: 'asc' }, take: 1000 })
  return rows.map((r) => {
    const fields: Record<string, unknown> = {}
    for (const f of phieu.fields) fields[f.key] = typeof r[f.key] === 'object' && r[f.key] !== null ? Number(r[f.key]) : r[f.key]
    return { id: r.id as string, label: (r[phieu.nameField] as string) ?? '(chưa đặt tên)', fields }
  })
}

export async function saveChildRecord(caseId: string, phieuMa: string, id: string | undefined, data: Record<string, unknown>): Promise<ChildResult> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  const phieu = getEntryPhieu(phieuMa)
  if (!phieu) return { ok: false, error: 'Phiếu không hợp lệ.' }

  const cur = await loadCaseForChild(caseId)
  if (!cur) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  if (auth.vaiTro === 'XA_PHUONG' && cur.don_vi_hanh_chinh_id !== auth.wardId) {
    return { ok: false, error: 'Không có quyền nhập hồ sơ địa bàn khác.' }
  }
  if (!coTheSua(auth.vaiTro, cur.trang_thai as string)) {
    return { ok: false, error: 'Hồ sơ không ở trạng thái được phép nhập/sửa.' }
  }

  // Chỉ ghi cột khai báo trong config (whitelist) + ép kiểu.
  const clean: Record<string, unknown> = {}
  for (const f of phieu.fields) clean[f.key] = coerce(f, data[f.key])
  const req = phieu.fields.find((f) => f.required)
  if (req && (clean[req.key] === null || clean[req.key] === '')) return { ok: false, error: `Vui lòng nhập: ${req.label}` }

  try {
    if (id) {
      const ex = await db_[phieu.table].findUnique({ where: { id }, select: { survey_case_id: true } })
      if (!ex || ex.survey_case_id !== caseId) return { ok: false, error: 'Không tìm thấy bản ghi.' }
      await db_[phieu.table].update({ where: { id }, data: clean })
      revalidatePath(`/dashboard/qd72/${caseId}`)
      return { ok: true, id }
    }
    const created = await db_[phieu.table].create({
      data: { ...clean, survey_case_id: caseId, don_vi_hanh_chinh_id: cur.don_vi_hanh_chinh_id, created_by_id: auth.userId },
    })
    revalidatePath(`/dashboard/qd72/${caseId}`)
    return { ok: true, id: created.id }
  } catch (e) {
    console.error('[saveChildRecord]', e)
    return { ok: false, error: 'Lỗi lưu dữ liệu, vui lòng thử lại.' }
  }
}

export async function deleteChildRecord(caseId: string, phieuMa: string, id: string): Promise<ChildResult> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  const phieu = getEntryPhieu(phieuMa)
  if (!phieu) return { ok: false, error: 'Phiếu không hợp lệ.' }

  const cur = await loadCaseForChild(caseId)
  if (!cur) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  if (auth.vaiTro === 'XA_PHUONG' && cur.don_vi_hanh_chinh_id !== auth.wardId) return { ok: false, error: 'Không có quyền.' }
  if (!coTheSua(auth.vaiTro, cur.trang_thai as string)) return { ok: false, error: 'Hồ sơ không ở trạng thái được phép sửa.' }

  try {
    const delegate = db_[phieu.table] as unknown as { delete: (a: unknown) => Promise<unknown> }
    await delegate.delete({ where: { id } })
    revalidatePath(`/dashboard/qd72/${caseId}`)
    return { ok: true }
  } catch (e) {
    console.error('[deleteChildRecord]', e)
    return { ok: false, error: 'Lỗi xoá dữ liệu.' }
  }
}
