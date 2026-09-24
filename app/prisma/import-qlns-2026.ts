// Import/đồng bộ hồ sơ cán bộ từ file "QLNS - SXD QUANG TRI (mới gửi 14.5.26)s.xlsx".
// Đối chiếu khoá: CCCD (cột BA) → fallback theo họ tên. Idempotent — chạy lại an toàn.
// Chạy: node_modules/.bin/jiti prisma/import-qlns-2026.ts

import * as xlsx from 'xlsx'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { convertQueQuan } from '../lib/que-quan'
import { tinhNgayNghiHuu } from '../lib/nghi-huu'
import { chuanHoaPhanTramVuotKhung } from '../lib/luong'

const FILE = 'C:/QLNS - SXD QUANG TRI (mới gửi 14.5.26)s.xlsx'
const DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:Postgres%402025@localhost:5432/ql_htkt'
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

// ── Helpers ──────────────────────────────────────────────────────────────────

function normName(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
}

function cleanText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
  return s === '' ? null : s
}

/** Serial Excel hoặc chuỗi d/m/yyyy → Date (UTC, chỉ phần ngày). */
function toDate(cell: xlsx.CellObject | undefined): Date | null {
  if (!cell || cell.v == null) return null
  if (cell.t === 'n') {
    const serial = Number(cell.v)
    if (!isFinite(serial) || serial < 367 || serial > 80000) return null
    return new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000)
  }
  const s = String(cell.v).trim()
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/)
  if (!m) return null
  let [, d, mo, y] = m
  let year = parseInt(y, 10)
  if (y.length <= 2) year += year > 30 ? 1900 : 2000
  const day = parseInt(d, 10), month = parseInt(mo, 10)
  if (month > 12 || day > 31) return null
  return new Date(Date.UTC(year, month - 1, day))
}

function toNum(cell: xlsx.CellObject | undefined): number | null {
  if (!cell || cell.v == null) return null
  const n = typeof cell.v === 'number' ? cell.v : parseFloat(String(cell.v).replace(',', '.'))
  return isFinite(n) ? n : null
}

function normCccd(raw: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  // Thiếu số 0 đầu (Excel cắt) → bù cho đủ 12 số
  if (digits.length === 11 && !digits.startsWith('0')) return '0' + digits
  return digits
}

function addYears(d: Date | null, years: number): Date | null {
  if (!d) return null
  const out = new Date(d)
  out.setUTCFullYear(out.getUTCFullYear() + years)
  return out
}

// ── Đọc file ─────────────────────────────────────────────────────────────────

interface RowData {
  row: number
  sectionOrdinal: number   // 1..24 = to_chuc.thuTu
  sectionName: string
  hoTen: string
  cccdRaw: string | null
  // các cột còn lại gom trong fields
  cells: Record<string, xlsx.CellObject | undefined>
}

const wb = xlsx.readFile(FILE)
const ws = wb.Sheets['DS SXD']
const range = xlsx.utils.decode_range(ws['!ref'] as string)

const rows: RowData[] = []
let ordinal = 0
let sectionName = ''
for (let r = 2; r <= range.e.r; r++) {
  const cell = (col: string) => ws[`${col}${r + 1}`] as xlsx.CellObject | undefined
  const b = cleanText(cell('B')?.v) ?? ''
  const c = cleanText(cell('C')?.v) ?? ''
  if (!c) continue
  if (normName(c) === 'hết') break
  if (/^[ivxlcdm]+$/i.test(b) && !/^\d+$/.test(b)) {
    // Dòng tiêu mục (số La Mã) — file đánh nhầm vài chỗ nên đếm theo thứ tự xuất hiện
    ordinal++
    sectionName = c
    continue
  }
  if (ordinal === 0) continue
  const cells: Record<string, xlsx.CellObject | undefined> = {}
  for (let cc = 0; cc <= range.e.c; cc++) {
    const col = xlsx.utils.encode_col(cc)
    cells[col] = cell(col)
  }
  rows.push({ row: r + 1, sectionOrdinal: ordinal, sectionName, hoTen: c, cccdRaw: cleanText(cell('BA')?.v), cells })
}

// ── Import ───────────────────────────────────────────────────────────────────

async function main() {
  const toChucs = await db.toChuc.findMany({ where: { thuTu: { gte: 1 } }, select: { id: true, ma: true, ten: true, thuTu: true } })
  const toChucByThuTu = new Map(toChucs.map((t) => [t.thuTu, t]))
  const chucDanhs = await db.chucDanh.findMany({ select: { id: true, ma: true } })
  const cdId = (ma: string) => chucDanhs.find((c) => c.ma === ma)?.id ?? null

  function mapChucDanh(chucVu: string | null, thuTu: number): string | null {
    if (!chucVu || thuTu > 12) return null // đơn vị sự nghiệp: giữ text, không gán chức danh Sở
    const cv = normName(chucVu)
    if (cv.includes('phó giám đốc')) return cdId('PHO_GIAM_DOC')
    if (cv.includes('giám đốc')) return cdId('GIAM_DOC')
    if (cv.includes('phó chánh văn phòng')) return cdId('PHO_CHANH_VP')
    if (cv.includes('chánh văn phòng')) return cdId('CHANH_VP')
    if (cv.includes('phó trưởng phòng') || cv.includes('phó phòng')) return cdId('PHO_TRUONG_PHONG')
    if (cv.includes('trưởng phòng')) return cdId('TRUONG_PHONG')
    if (cv.includes('kiến trúc sư')) return cdId('KIEN_TRUC_SU')
    if (cv.includes('kỹ sư')) return cdId('KY_SU')
    if (cv.includes('kế toán')) return cdId('KE_TOAN')
    if (cv.includes('văn thư')) return cdId('VAN_THU')
    if (cv.includes('thủ quỹ')) return cdId('THU_QUY')
    if (cv.includes('lái xe')) return cdId('LAI_XE')
    if (cv.includes('chuyên viên')) return cdId('CHUYEN_VIEN')
    return null
  }

  const dbCanBo = await db.canBo.findMany({ select: { id: true, cccd: true, hoTen: true, userId: true } })
  const byCccd = new Map(dbCanBo.map((c) => [c.cccd, c]))
  const byName = new Map<string, { id: string; cccd: string; hoTen: string; userId: string | null }[]>()
  for (const c of dbCanBo) {
    const k = normName(c.hoTen)
    byName.set(k, [...(byName.get(k) ?? []), c])
  }
  const excelCccdCount = new Map<string, number>()
  for (const r of rows) {
    const c = normCccd(r.cccdRaw)
    if (c) excelCccdCount.set(c, (excelCccdCount.get(c) ?? 0) + 1)
  }

  let created = 0, updated = 0
  const notes: string[] = []
  const seenIds = new Set<string>()

  for (const r of rows) {
    const cell = (col: string) => r.cells[col]
    const txt = (col: string) => cleanText(cell(col)?.v)
    const toChuc = toChucByThuTu.get(r.sectionOrdinal)
    if (!toChuc) { notes.push(`⚠ Dòng ${r.row}: không tìm thấy đơn vị thứ tự ${r.sectionOrdinal} (${r.sectionName})`); continue }

    const cccd = normCccd(r.cccdRaw)
    const cccdHopLe = !!cccd && cccd.length === 12 && (excelCccdCount.get(cccd) ?? 0) === 1
    const nameKey = normName(r.hoTen)

    // ── Khớp bản ghi: CCCD trước (tên phải khớp), sau đó theo tên ──
    let target: { id: string; cccd: string; userId: string | null } | null = null
    let doiCccd = false
    const hitCccd = cccd ? byCccd.get(cccd) : undefined
    if (hitCccd && normName(hitCccd.hoTen) === nameKey) {
      target = hitCccd
    } else {
      const hitsName = (byName.get(nameKey) ?? []).filter((c) => !seenIds.has(c.id))
      if (hitsName.length === 1) {
        target = hitsName[0]
        if (hitCccd) {
          notes.push(`⚠ Dòng ${r.row} ${r.hoTen}: CCCD file ${cccd} đang thuộc về "${hitCccd.hoTen}" trong CSDL — giữ CCCD cũ ${target.cccd}`)
        } else if (cccdHopLe && cccd !== target.cccd) {
          doiCccd = true
        } else if (cccd && !cccdHopLe) {
          notes.push(`⚠ Dòng ${r.row} ${r.hoTen}: CCCD file "${r.cccdRaw}" không hợp lệ — giữ CCCD cũ ${target.cccd}`)
        }
      } else if (hitsName.length > 1) {
        notes.push(`⚠ Dòng ${r.row} ${r.hoTen}: trùng tên ${hitsName.length} bản ghi trong CSDL, không xác định được — BỎ QUA`)
        continue
      }
    }

    const ngaySinhNam = toDate(cell('L'))
    const ngaySinhNu = toDate(cell('M'))
    const gioiTinh = (ngaySinhNu ? 'NU' : ngaySinhNam ? 'NAM' : null) as 'NAM' | 'NU' | null
    const ngaySinh = ngaySinhNam ?? ngaySinhNu
    const ngayHuongLuong = toDate(cell('Y'))
    const ngayBoNhiemGanNhat = toDate(cell('Q'))
    const queQuanTruoc = txt('G')
    const chucVu = txt('E')

    const data = {
      hoTen: r.hoTen,
      chucVu,
      phongBan: toChuc.ten,
      toChucId: toChuc.id,
      chucDanhId: mapChucDanh(chucVu, r.sectionOrdinal),
      soDienThoai: txt('F'),
      gioiTinh,
      ngaySinh,
      queQuanTruoc,
      queQuanSau: convertQueQuan(queQuanTruoc) ?? txt('H'),
      noiOTruoc: txt('I'),
      noiOHienNay: txt('J'),
      quangTriCuRa: txt('K'),
      loaiHinh: txt('N'),
      ngayVaoBienChe: toDate(cell('O')),
      boNhiemLanDau: txt('P'),
      ngayBoNhiemGanNhat,
      ngayBoNhiemTiepTheo: toDate(cell('R')) ?? addYears(ngayBoNhiemGanNhat, 5),
      // Cột S tính theo NĐ 135/2020 từ ngày sinh + giới tính (không lấy giá trị gõ tay)
      ngayVeHuu: tinhNgayNghiHuu(ngaySinh, gioiTinh),
      maNgach: txt('T'),
      bacLuong: toNum(cell('U')) != null ? Math.round(toNum(cell('U')) as number) : null,
      heSoLuong: toNum(cell('V')),
      phuCap: toNum(cell('W')),
      // Cột X: % vượt khung. File Excel gốc lưu ô "Phần trăm" dưới dạng phân số (9% → cell.v=0.09)
      // — chuẩn hoá về số nguyên % (xem lib/luong.ts). Sửa 24/9/26 sau khi phát hiện 5 hồ sơ từ
      // lần chạy trước bị ghi nhầm 0.05/0.06/0.09 thẳng vào CSDL — đã có script vá riêng
      // (prisma/sua-vuot-khung-sai-don-vi.ts) cho dữ liệu cũ; sửa ở đây để lần chạy sau không lặp lại.
      vuotKhung: chuanHoaPhanTramVuotKhung(toNum(cell('X'))),
      ngayNangLuong: ngayHuongLuong,
      ngayNangLuongKeTiep: toDate(cell('AA')) ?? addYears(ngayHuongLuong, 3),
      ngachHienHuong: txt('AB'),
      ngayBoNhiemNgach: toDate(cell('AC')),
      trinhDoChuyenMon: txt('AE'),
      chuyenNganh: txt('AF'),
      namTotNghiep: txt('AG'),
      heDaoTao: txt('AH'),
      trinhDoQLNN: txt('AI'),
      namDaoTaoQLNN: txt('AJ'),
      trinhDoLLCT: txt('AK'),
      namDaoTaoLLCT: txt('AL'),
      trinhDoNgoaiNgu: txt('AM'),
      namDaoTaoNgoaiNgu: txt('AN'),
      trinhDoTinHoc: txt('AO'),
      namDaoTaoTinHoc: txt('AP'),
      namDaoTaoCapPhong: txt('AQ'),
      namDaoTaoCapSo: txt('AR'),
      qpAn: txt('AS'),
      namDaoTaoQPAN: txt('AT'),
      soTheDang: txt('AU'),
      ngayKetNapDang: toDate(cell('AV')),
      ngayVaoDangChinhThuc: toDate(cell('AW')),
      chiBo: txt('AZ'),
      trangThai: 'DANG_CONG_TAC',
    }

    if (target) {
      seenIds.add(target.id)
      if (doiCccd && cccd) {
        await db.canBo.update({ where: { id: target.id }, data: { ...data, cccd } })
        // Tài khoản đăng nhập dùng CCCD làm email → đồng bộ
        if (target.userId) {
          const user = await db.user.findUnique({ where: { id: target.userId }, select: { email: true } })
          if (user?.email === target.cccd) {
            await db.user.update({ where: { id: target.userId }, data: { email: cccd } })
            notes.push(`✦ ${r.hoTen}: đã đổi CCCD ${target.cccd} → ${cccd} (đồng bộ cả tài khoản đăng nhập)`)
          } else {
            notes.push(`✦ ${r.hoTen}: đã đổi CCCD ${target.cccd} → ${cccd}`)
          }
        } else {
          notes.push(`✦ ${r.hoTen}: đã đổi CCCD ${target.cccd} → ${cccd}`)
        }
      } else {
        await db.canBo.update({ where: { id: target.id }, data })
      }
      updated++
    } else {
      // Tạo mới — bắt buộc có CCCD (unique). Thiếu thì dùng mã tạm để bổ sung sau.
      let newCccd = cccd
      if (!newCccd) {
        newCccd = 'TAM-' + nameKey.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-').toUpperCase()
        notes.push(`⚠ Dòng ${r.row} ${r.hoTen}: chưa có CCCD — tạo mã tạm ${newCccd}, cần bổ sung`)
      } else if (cccd && cccd.length !== 12) {
        notes.push(`⚠ Dòng ${r.row} ${r.hoTen}: CCCD "${cccd}" không đủ 12 số — cần kiểm tra lại`)
      }
      if (byCccd.has(newCccd)) {
        notes.push(`⚠ Dòng ${r.row} ${r.hoTen}: CCCD ${newCccd} đã tồn tại cho người khác — BỎ QUA`)
        continue
      }
      const moi = await db.canBo.create({ data: { ...data, cccd: newCccd } })
      byCccd.set(newCccd, { id: moi.id, cccd: newCccd, hoTen: r.hoTen, userId: null })
      seenIds.add(moi.id)
      created++
    }
  }

  // Người có trong CSDL nhưng không còn trong danh sách mới — chỉ liệt kê, không xoá
  const conLai = dbCanBo.filter((c) => !seenIds.has(c.id))
  console.log(`\n=== KẾT QUẢ: cập nhật ${updated}, thêm mới ${created} / ${rows.length} dòng file ===`)
  if (notes.length) console.log('\n' + notes.join('\n'))
  if (conLai.length) {
    console.log(`\n— ${conLai.length} người trong CSDL không có trong file (giữ nguyên, cần rà soát trạng thái):`)
    for (const c of conLai) console.log(`  • ${c.hoTen} (${c.cccd})`)
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
