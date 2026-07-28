import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { canImportSalary } from '@/lib/salary-perms'

// Cột trong sheet "Theodoi" (0-based), dữ liệu bắt đầu từ dòng 12 (index 11)
const COL = {
  cccd: 1,
  hoTen: 2,
  ngaySinh: 4,
  maNgach: 10,
  bac: 11,
  heSoLuong: 13,   // N — hệ số đang hưởng
  vuotKhung: 14,   // O — phụ cấp thâm niên vượt khung (vd 0.09)
  ngayHuong: 15,   // P — ngày hưởng lương hiện tại
  ngayMoi: 22,     // W — ngày nâng lương kế tiếp (đã tính sẵn)
}
const DATA_START_ROW = 11

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && !isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v)
  return null
}

// Serial Excel → Date (chỉ nhận năm hợp lệ để tránh giá trị rác)
function serialToDate(v: unknown): Date | null {
  const n = toNum(v)
  if (n == null || n < 3000) return null // < ~1908: bỏ (ngày rác do thiếu "ngày hưởng")
  const o = XLSX.SSF.parse_date_code(n)
  if (!o || !o.y || o.y < 2000 || o.y > 2100) return null
  return new Date(Date.UTC(o.y, o.m - 1, o.d))
}

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canImportSalary(user)) {
    return NextResponse.json({ error: 'Bạn không có quyền import dữ liệu lương.' }, { status: 403 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Chưa chọn file' }, { status: 400 })

  let wb: XLSX.WorkBook
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    wb = XLSX.read(buf, { type: 'buffer' })
  } catch {
    return NextResponse.json({ error: 'Không đọc được file Excel' }, { status: 400 })
  }

  const ws = wb.Sheets['Theodoi']
  if (!ws) {
    return NextResponse.json({
      error: 'Không tìm thấy sheet "Theodoi" trong file. Hãy dùng đúng file "Theo dõi lên lương".',
    }, { status: 400 })
  }

  const R = XLSX.utils.decode_range(ws['!ref']!)
  const cell = (r: number, c: number) => {
    const cc = ws[XLSX.utils.encode_cell({ r, c })]
    return cc ? cc.v : undefined
  }

  let updated = 0, created = 0, skippedNoCccd = 0, withNgay = 0
  const notFoundCreated: string[] = []

  for (let r = DATA_START_ROW; r <= R.e.r; r++) {
    const hoTen = cell(r, COL.hoTen)
    if (!hoTen || String(hoTen).trim() === '') continue

    const cccdRaw = cell(r, COL.cccd)
    const cccd = cccdRaw != null ? String(cccdRaw).trim() : ''
    if (!cccd) { skippedNoCccd++; continue }

    const heSoLuong  = toNum(cell(r, COL.heSoLuong))
    const vkRaw      = toNum(cell(r, COL.vuotKhung))
    const vuotKhung  = vkRaw && vkRaw > 0 ? vkRaw : null
    const ngaySinh   = serialToDate(cell(r, COL.ngaySinh))
    // Cột P = "ngày hưởng" = NGÀY LÊN LƯƠNG (bậc hiện tại) → ngayNangLuong
    const ngayLenLuong = serialToDate(cell(r, COL.ngayHuong))
    // Cột W = "ngày nâng lương kế tiếp (đã tính sẵn)" → ngayNangLuongKeTiep.
    // Chỉ nhận khi có "ngày hưởng" hợp lệ (nếu không, W là giá trị rác).
    const ngayKeTiep = ngayLenLuong ? serialToDate(cell(r, COL.ngayMoi)) : null
    if (ngayKeTiep) withNgay++

    // Chỉ cập nhật giá trị có thật — KHÔNG ghi đè bằng null để tránh xoá dữ liệu đã có
    const salaryData: { heSoLuong?: number; vuotKhung?: number; ngayNangLuong?: Date; ngayNangLuongKeTiep?: Date } = {}
    if (heSoLuong != null)    salaryData.heSoLuong = heSoLuong
    if (vuotKhung != null)    salaryData.vuotKhung = vuotKhung
    if (ngayLenLuong != null) salaryData.ngayNangLuong = ngayLenLuong
    if (ngayKeTiep != null)   salaryData.ngayNangLuongKeTiep = ngayKeTiep

    const existing = await db.canBo.findUnique({ where: { cccd }, select: { id: true } })
    if (existing) {
      await db.canBo.update({ where: { cccd }, data: salaryData })
      updated++
    } else {
      await db.canBo.create({
        data: {
          cccd,
          hoTen: String(hoTen).trim(),
          ngaySinh: ngaySinh ?? undefined,
          ...salaryData,
        },
      })
      created++
      notFoundCreated.push(String(hoTen).trim())
    }
  }

  return NextResponse.json({
    ok: true,
    updated,
    created,
    skippedNoCccd,
    withNgay,
    total: updated + created,
    notFoundCreated,
  })
}
