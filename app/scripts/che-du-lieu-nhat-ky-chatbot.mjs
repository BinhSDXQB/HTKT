// CHE DỮ LIỆU CÁ NHÂN trong các bản ghi chatbot_logs ĐÃ LƯU TRƯỚC ĐÂY.
//
//   node scripts/che-du-lieu-nhat-ky-chatbot.mjs --dry   # xem trước, không sửa
//   node scripts/che-du-lieu-nhat-ky-chatbot.mjs         # thực hiện che
//
// Từ 20/8/2026 hệ thống đã che ngay khi ghi (app/api/chatbot/route.ts). Script này
// xử lý các bản ghi cũ: kiểm tra ngày 20/8/2026 thấy 1 lượt lưu CCCD thật của cán bộ
// và 8 lượt lưu số điện thoại. Bảng chatbot_logs sinh ra để phân tích chất lượng trả
// lời, không phải nơi lưu dữ liệu định danh.
//
// Việc AI đã truy cập dữ liệu nhạy cảm vẫn được lưu ở audit_logs (VIEW_SENSITIVE),
// nên che ở đây KHÔNG làm mất dấu vết truy cập.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const DRY = process.argv.includes('--dry')

/**
 * Che CCCD và số điện thoại trong văn bản trước khi ghi nhật ký.
 * Giữ vài ký tự đầu/cuối để người phân tích vẫn đối chiếu được khi thật sự cần.
 *
 * PHẢI xử lý cả DẤU PHÂN CÁCH: hồ sơ thật lưu SĐT dạng "0913.018.002",
 * "0983 995 715" — bản che đầu chỉ bắt chữ số liền nên đã bỏ sót 8 bản ghi
 * (phát hiện khi kiểm chứng 20/8/2026).
 */
function cheDuLieuNhayCam(text) {
  // Số điện thoại: 0 + 9 chữ số, cho phép . - hoặc khoảng trắng xen giữa
  let ra = text.replace(/(?<![\d])0[\d][\d](?:[\s.\-]?\d){7}(?![\d])/g, (m) => {
    const so = m.replace(/\D/g, '')
    if (so.length !== 10) return m
    return `${so.slice(0, 3)}*****${so.slice(-2)}`
  })
  // CCCD/CMND 12 chữ số, cũng cho phép dấu phân cách
  ra = ra.replace(/(?<![\d])\d{4}(?:[\s.\-]?\d){8}(?![\d])/g, (m) => {
    const so = m.replace(/\D/g, '')
    if (so.length !== 12) return m
    return `${so.slice(0, 4)}******${so.slice(-2)}`
  })
  return ra
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  await client.query("SET client_encoding TO 'UTF8'")

  // Lấy cả bản ghi có chữ số LIỀN lẫn bản ghi khớp SĐT/CCCD thật của cán bộ
  // (hồ sơ lưu SĐT có dấu phân cách "0913.018.002" nên lọc theo chữ số liền là sót).
  const { rows } = await client.query(
    `SELECT DISTINCT l.id, l.question, l.answer FROM chatbot_logs l
      WHERE l.answer ~ '[0-9]{10}' OR l.question ~ '[0-9]{10}'
         OR EXISTS (SELECT 1 FROM can_bo cb WHERE
              (cb."soDienThoai" IS NOT NULL AND length(cb."soDienThoai") >= 9
                 AND l.answer LIKE '%' || cb."soDienThoai" || '%')
           OR (cb.cccd IS NOT NULL AND l.answer LIKE '%' || cb.cccd || '%'))`,
  )
  console.log(`Bản ghi có chuỗi 10–12 chữ số: ${rows.length}`)

  let sua = 0
  for (const r of rows) {
    const q = cheDuLieuNhayCam(r.question)
    const a = cheDuLieuNhayCam(r.answer)
    if (q === r.question && a === r.answer) continue
    sua++
    if (DRY) {
      const mau = (r.answer.match(/(?<!\d)\d{10,12}(?!\d)/) || [])[0]
      console.log(`  ${r.id.slice(0, 10)}… che: ${mau} → ${cheDuLieuNhayCam(mau || '')}`)
    } else {
      await client.query('UPDATE chatbot_logs SET question=$2, answer=$3 WHERE id=$1', [r.id, q, a])
    }
  }

  // Kiểm lại: còn bản ghi nào chứa đúng CCCD/SĐT của cán bộ trong CSDL không
  const con = await client.query(`SELECT count(*)::int n FROM chatbot_logs l
    WHERE EXISTS (SELECT 1 FROM can_bo cb WHERE
      (cb.cccd IS NOT NULL AND l.answer LIKE '%'||cb.cccd||'%') OR
      (cb."soDienThoai" IS NOT NULL AND length(cb."soDienThoai")>=9 AND l.answer LIKE '%'||cb."soDienThoai"||'%'))`)

  console.log(`${DRY ? '[CHẠY THỬ] Sẽ che' : 'Đã che'}: ${sua} bản ghi`)
  console.log(`Còn bản ghi chứa CCCD/SĐT thật của cán bộ: ${con.rows[0].n}`)
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
