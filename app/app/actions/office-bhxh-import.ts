'use server'

import { revalidatePath } from 'next/cache'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { crossCheckCccd } from '@/lib/cccd'

export type BhxhImportState = {
  ok?: boolean
  error?: string
  tongDong?: number
  capNhat?: number
  khongTimThay?: string[]
  canhBao?: string[]
} | null

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

// Nhận diện cột theo tên tiêu đề (linh hoạt)
function detectColumns(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {}
  headerRow.eachCell((cell, col) => {
    const h = norm(cell.value)
    if (!map.cccd && /(cccd|căn cước|can cuoc|cmnd|định danh|dinh danh)/.test(h)) map.cccd = col
    else if (!map.bhxh && /(bhxh|bảo hiểm|bao hiem|sổ bh|so bh)/.test(h)) map.bhxh = col
    else if (!map.ngayBhxh && /(tham gia|ngày đóng|ngay dong|từ ngày|tu ngay)/.test(h)) map.ngayBhxh = col
    else if (!map.mst && /(thuế|thue|mst)/.test(h)) map.mst = col
  })
  return map
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  const s = String(v).trim()
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/** Import dữ liệu BHXH/MST từ Excel, đối chiếu theo CCCD. */
export async function importBhxhAction(prev: BhxhImportState, formData: FormData): Promise<BhxhImportState> {
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) return { error: 'Bạn không có quyền cập nhật hồ sơ cán bộ.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Chưa chọn tệp Excel.' }

  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(await file.arrayBuffer())
  } catch {
    return { error: 'Không đọc được tệp Excel (.xlsx).' }
  }
  const ws = wb.worksheets[0]
  if (!ws) return { error: 'Tệp không có sheet dữ liệu.' }

  const cols = detectColumns(ws.getRow(1))
  if (!cols.cccd) return { error: 'Không tìm thấy cột CCCD trong tệp (tiêu đề dòng 1).' }

  let tongDong = 0
  let capNhat = 0
  const khongTimThay: string[] = []
  const canhBao: string[] = []

  const rowCount = ws.rowCount
  for (let r = 2; r <= rowCount; r++) {
    const row = ws.getRow(r)
    const cccd = String(row.getCell(cols.cccd).value ?? '').replace(/\s/g, '')
    if (!cccd) continue
    tongDong++

    const canBo = await db.canBo.findUnique({
      where: { cccd },
      select: { id: true, hoTen: true, gioiTinh: true, ngaySinh: true },
    })
    if (!canBo) { khongTimThay.push(cccd); continue }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (cols.bhxh) {
      const v = String(row.getCell(cols.bhxh).value ?? '').replace(/\s/g, '')
      if (v) data.maSoBHXH = v
    }
    if (cols.mst) {
      const v = String(row.getCell(cols.mst).value ?? '').replace(/\s/g, '')
      if (v) data.maSoThue = v
    }
    if (cols.ngayBhxh) {
      const d = parseDate(row.getCell(cols.ngayBhxh).value)
      if (d) data.ngayThamGiaBHXH = d
    }
    if (Object.keys(data).length > 0) {
      await db.canBo.update({ where: { id: canBo.id }, data })
      capNhat++
    }

    // Đối chiếu CCCD với hồ sơ
    const mis = crossCheckCccd({ cccd, gioiTinh: canBo.gioiTinh as 'NAM' | 'NU' | null, ngaySinh: canBo.ngaySinh })
    for (const m of mis) canhBao.push(`${canBo.hoTen} (${cccd}): ${m.message}`)
  }

  await logAction({
    userId: user.id, action: 'IMPORT', module: MODULES.OFFICE, targetType: 'CanBo',
    detail: `Import BHXH/MST: ${capNhat}/${tongDong} cập nhật, ${khongTimThay.length} không khớp CCCD`,
  })
  revalidatePath('/dashboard/van-phong-so/ho-so')
  return { ok: true, tongDong, capNhat, khongTimThay, canhBao }
}
