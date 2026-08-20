// LẬP PHIẾU KHAI HIỆU LỰC cho các văn bản CHƯA ĐƯỢC KHAI trong hieu-luc-vbpl.json.
//
//   node scripts/lap-phieu-khai-hieu-luc.mjs          # in danh sách + khối JSON mẫu
//   node scripts/lap-phieu-khai-hieu-luc.mjs --excel  # kèm phiếu Excel để trình duyệt
//
// Vì sao cần: nhiều file trong kho mang tên máy sinh ("108_2026_TT-BCA_704772.docx",
// "Quyet dinh 1425.pdf") — người duyệt không thể biết đó là văn bản gì nếu không mở
// từng file. Script đọc phần đầu nội dung đã trích xuất trong CSDL để lấy số hiệu,
// ngày ban hành và trích yếu, rồi sinh phiếu cho người có thẩm quyền điền hiệu lực.
//
// ⚠️ MỌI THÔNG TIN Ở ĐÂY LÀ "MÁY ĐỌC", CHƯA XÁC NHẬN.
// Script KHÔNG tự quyết định hiệu lực. Chừng nào chưa khai, hệ thống vẫn coi văn bản
// là "can_kiem_chung" và chatbot nhắc người dùng đối chiếu bản chính thức.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const XUAT_EXCEL = process.argv.includes('--excel')

/**
 * Chuẩn hoá văn bản trích xuất từ PDF/DOCX, vá các lỗi OCR đã gặp THẬT trong kho:
 *   "năm 202 6"      → "năm 2026"   (OCR tách chữ số của năm)
 *   "ngày29 tháng"   → "ngày 29 tháng"
 *   "SỐ:1425/QĐ-TTg" → "Số: 1425/QĐ-TTg"
 *   "NĐ -CP"         → "NĐ-CP"      (khoảng trắng quanh dấu nối)
 */
function chuanHoa(t) {
  return t
    .replace(/\[Trang \d+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/năm\s*((?:19|20)\d)\s+(\d)\b/gi, 'năm $1$2')
    .replace(/\bngày(\d)/gi, 'ngày $1')
    .replace(/\bSỐ:\s*(?=\d)|\bSỐ(?=\d)/g, 'Số: ')   // chỉ header "SỐ:1425"/"SỐ1425", KHÔNG đụng "SỐ 104/2026" giữa câu
    .replace(/\s*-\s*(CP|TTg|BXD|BTC|BCA|BNV|BGTVT|VPQH|UBND|TW)\b/g, '-$1')
    .replace(/(\d)\s*\/\s*/g, '$1/')
    .trim()
}

/** Số văn bản suy từ TÊN FILE, dùng làm mốc đối chiếu số hiệu máy đọc. */
function soTuTenFile(tenFile) {
  const ten = tenFile
    .replace(/\.(pdf|docx?)$/i, '')
    .replace(/^\s*\d{1,2}\s*[.)]\s*/, '')   // bỏ số thứ tự đầu tên: "1.Nghi dinh 140_2025…"
  const day = ten.match(/(\d{1,5})[_\-. ](?:19|20)\d{2}/)
  if (day) return String(Number(day[1]))
  const sauTuKhoa = ten.match(/(?:Nghị định|Nghi dinh|Thông tư|Thong tu|Quyết định|Quyet dinh|Luật|Luat|QĐ|TT|NĐ|ND)\s*[^\d]{0,6}(\d{1,5})/i)
  if (sauTuKhoa) return String(Number(sauTuKhoa[1]))
  const cuoi = ten.match(/(\d{1,5})(?:[_\-. ]|$)/)
  return cuoi ? String(Number(cuoi[1])) : null
}

/** Mẫu số hiệu văn bản QPPL và văn bản cá biệt Việt Nam. */
const MAU_SO_HIEU = [
  /Số:\s*(\d{1,5}\/(?:19|20)\d{2}\/[A-ZĐ][A-ZĐ0-9-]*)/,           // 30/2026/TT-BXD
  /Số:\s*(\d{1,5}\/(?:QĐ|CT|VBHN|NQ|KH|TB)-[A-ZĐ][A-ZĐ0-9-]*)/i,  // 1425/QĐ-TTg
  /(\d{1,5}\/(?:19|20)\d{2}\/[A-ZĐ][A-ZĐ0-9-]*)/,
  /(\d{1,5}\/(?:QĐ|CT|VBHN|NQ)-[A-ZĐ][A-ZĐ0-9-]*)/i,
]

const DUNG = 'Căn cứ|Theo đề nghị|Chương|Điều\\s*1|THỦ TƯỚNG CHÍNH PHỦ|CHÍNH PHỦ|BỘ TRƯỞNG|ỦY BAN NHÂN DÂN|QUỐC HỘI'

/**
 * Rút SỐ HIỆU + NGÀY BAN HÀNH + TRÍCH YẾU từ phần đầu văn bản.
 *
 * BẪY ĐÃ GẶP THẬT: với "Quyet dinh 1425.pdf", bản đầu đọc ra 142/2026/NĐ-CP và ngày
 * 18/02/2025 — cả hai lấy nhầm từ phần CĂN CỨ (số hiệu thật 1425/QĐ-TTg, ngày
 * 29/7/2026). Đưa dữ liệu sai đó vào phiếu duyệt chính là tạo ra sai căn cứ.
 * Vì vậy: số hiệu phải KHỚP số trong tên file; ngày phải nằm TRƯỚC phần "Căn cứ".
 * Không thoả → để trống + ghi cảnh báo. Thà thiếu còn hơn sai.
 */
function rutThongTin(text, tenFile) {
  const s = chuanHoa(text).slice(0, 3000)
  const soTen = soTuTenFile(tenFile)
  const canhBao = []

  const ungVien = []
  for (const re of MAU_SO_HIEU) {
    const m = s.match(re)
    if (m && !ungVien.includes(m[1])) ungVien.push(m[1])
  }
  let soHieu = ''
  for (const uv of ungVien) {
    if (!soTen || String(Number(uv.split('/')[0])) === soTen) { soHieu = uv; break }
  }
  if (!soHieu && ungVien.length) {
    canhBao.push(`số hiệu máy đọc (${ungVien[0]}) KHÔNG khớp số trong tên file (${soTen}) — có thể lấy nhầm từ phần Căn cứ`)
  }
  if (!ungVien.length) canhBao.push('không đọc được số hiệu ở đầu văn bản')

  const viTriCanCu = s.search(/\bCăn cứ\b/i)
  const vungHeader = viTriCanCu > 0 ? s.slice(0, viTriCanCu) : s
  const mNgay =
    vungHeader.match(/,\s*ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+((?:19|20)\d{2})/i) ||
    vungHeader.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+((?:19|20)\d{2})/i)
  const ngay = mNgay ? [mNgay[1].padStart(2, '0'), mNgay[2].padStart(2, '0'), mNgay[3]].join('/') : ''
  if (!ngay) canhBao.push('không đọc được ngày ban hành trong phần đầu văn bản')

  let trichYeu = ''
  const m = s.match(
    new RegExp(`\\b(?:THÔNG TƯ|NGHỊ ĐỊNH|QUYẾT ĐỊNH|QUYẾT ĐỊỈNH|LUẬT|NGHỊ QUYẾT|CHỈ THỊ)\\b\\s*([\\s\\S]*?)(?=\\s+(?:${DUNG}))`),
  )
  if (m) trichYeu = m[1].trim()
  if (!trichYeu) {
    const m2 = s.match(new RegExp(`(?:Quy định|Hướng dẫn|Ban hành|Sửa đổi|Về việc|Phê duyệt)[\\s\\S]{15,300}?(?=\\s+(?:${DUNG})|$)`, 'i'))
    if (m2) trichYeu = m2[0].trim()
  }
  trichYeu = trichYeu.replace(/\s+/g, ' ').replace(/\s*(?:CỦA|VÀ|TẠI|THEO|VỀ|CHO)$/i, '').replace(/[\s;,.]+$/, '').trim()
  if (!trichYeu) canhBao.push('không đọc được trích yếu')

  return { soHieu, ngay, trichYeu, canhBao: canhBao.join(' · ') }
}

async function main() {
  const dangKy = JSON.parse(readFileSync(join(root, 'prisma', 'hieu-luc-vbpl.json'), 'utf8')).vanBan ?? {}

  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  await client.query("SET client_encoding TO 'UTF8'")

  const { rows } = await client.query(
    `SELECT t.id, t.nguon, t."soChunk", t."tinhTrangHieuLuc"
       FROM tai_lieu t WHERE t."deletedAt" IS NULL AND t.nguon IS NOT NULL
      ORDER BY t.nguon`,
  )
  const chuaKhai = rows.filter((r) => !dangKy[r.nguon])

  const ketQua = []
  for (const d of chuaKhai) {
    const { rows: c } = await client.query(
      `SELECT "noiDung" FROM tai_lieu_chunk WHERE "taiLieuId"=$1 ORDER BY "chunkIndex" LIMIT 2`,
      [d.id],
    )
    ketQua.push({ ...d, ...rutThongTin(c.map((x) => x.noiDung).join(' '), d.nguon) })
  }
  await client.end()

  console.log(`Kho: ${rows.length} văn bản · CHƯA KHAI hiệu lực: ${chuaKhai.length}`)
  console.log('⚠️ Toàn bộ số hiệu / ngày / trích yếu dưới đây là MÁY ĐỌC, CHƯA XÁC NHẬN.\n')
  for (const k of ketQua) {
    console.log(`▶ ${k.nguon}`)
    console.log(`   số hiệu: ${k.soHieu || '(chưa đọc được)'}   ban hành: ${k.ngay || '(chưa đọc được)'}   ${k.soChunk} đoạn`)
    console.log(`   trích yếu: ${k.trichYeu || '(chưa đọc được)'}`)
    if (k.canhBao) console.log(`   ⚠️ ${k.canhBao} → CẦN MỞ FILE ĐỐI CHIẾU`)
    console.log('')
  }
  console.log(`Tổng: ${ketQua.length} văn bản · ${ketQua.filter((k) => k.canhBao).length} cần mở file đối chiếu\n`)

  // Khối JSON: đặt sẵn can_kiem_chung (KHÔNG để rỗng) để không ai hiểu nhầm là đã xác nhận
  const khoi = {}
  for (const k of ketQua) {
    khoi[k.nguon] = {
      tinhTrang: 'can_kiem_chung',
      thayTheBoi: '',
      ghiChu:
        'MÁY ĐỌC, CHƯA XÁC NHẬN: ' +
        [k.soHieu, k.ngay, k.trichYeu].filter(Boolean).join(' — ').slice(0, 200) +
        (k.canhBao ? ` [CẦN MỞ FILE: ${k.canhBao}]` : ''),
    }
  }
  console.log('──────── Dán khối JSON dưới đây vào prisma/hieu-luc-vbpl.json, mục "vanBan" ────────')
  console.log('Người có thẩm quyền sửa tinhTrang thành con_hieu_luc / het_hieu_luc / du_thao,')
  console.log('rồi chạy: node scripts/sync-hieu-luc-tai-lieu.mjs')
  console.log('')
  console.log(JSON.stringify(khoi, null, 2))

  if (XUAT_EXCEL) {
    const XLSX = await import('xlsx')
    const sheet = XLSX.utils.json_to_sheet(
      ketQua.map((k) => ({
        'Tên file': k.nguon,
        'Số hiệu (MÁY ĐỌC)': k.soHieu,
        'Ngày ban hành (MÁY ĐỌC)': k.ngay,
        'Trích yếu (MÁY ĐỌC)': k.trichYeu,
        'Số đoạn': k.soChunk,
        'Cảnh báo — cần mở file': k.canhBao,
        'TÌNH TRẠNG (người duyệt điền)': '',
        'Thay thế bởi (nếu hết hiệu lực)': '',
        'Người rà soát': '',
      })),
    )
    sheet['!cols'] = [
      { wch: 46 }, { wch: 20 }, { wch: 22 }, { wch: 70 }, { wch: 8 },
      { wch: 60 }, { wch: 28 }, { wch: 26 }, { wch: 16 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Khai hieu luc')
    const out = join(root, 'PHIEU_KHAI_HIEU_LUC_VBPL.xlsx')
    writeFileSync(out, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
    console.log(`\n📄 Đã xuất: ${out}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
