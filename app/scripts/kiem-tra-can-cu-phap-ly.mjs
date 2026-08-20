// KIỂM TRA CĂN CỨ PHÁP LÝ đang hiển thị cho cán bộ — chặn "dẫn chứng sai căn cứ".
//
//   node scripts/kiem-tra-can-cu-phap-ly.mjs
//   node scripts/kiem-tra-can-cu-phap-ly.mjs --excel
//
// Đối chiếu 2 nguồn:
//   A. DANH MỤC HARD-CODE trong lib/**.ts — các mục `soHieu: '...'` hiển thị trên
//      trang "Cơ sở pháp lý" của từng phòng, và đưa vào phần "Căn cứ" của văn bản
//      .docx do hệ thống sinh ra (cán bộ ký).
//   B. DANH SÁCH BỊ BÃI BỎ rút từ chính điều khoản thi hành của các văn bản trong
//      kho RAG (xem scripts/ra-soat-hieu-luc.mjs).
//
// Mục nào ở (A) trùng với (B) = đang nêu văn bản đã hết hiệu lực làm CĂN CỨ HIỆN
// HÀNH → phải sửa. Ghi chú lịch sử kiểu "Thay NĐ 06/2021" KHÔNG bị tính (chỉ soi
// trường soHieu, không soi ghiChu).
//
// Script chỉ ĐỌC và báo cáo, không tự sửa file.

import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const XUAT_EXCEL = process.argv.includes('--excel')
const LOAI_RE = 'Nghị định|Thông tư|Quyết định|Luật|Nghị quyết|Pháp lệnh'

const chuanHoa = (t) => t.replace(/\[Trang \d+\]/g, ' ').replace(/\s+/g, ' ').trim()

function nhomLoai(kyHieu) {
  const k = (kyHieu || '').toUpperCase()
  if (k.startsWith('TT')) return 'TT'
  if (k.startsWith('ND') || k.includes('NĐ')) return 'ND'
  if (k.startsWith('QH')) return 'QH'
  if (k.startsWith('QD')) return 'QD'
  if (k.startsWith('NQ') || k.includes('UBTVQH')) return 'NQ'
  if (k.startsWith('PL')) return 'PL'
  return k || ''
}

/** Rút tuyên bố BÃI BỎ TOÀN BỘ (xem giải thích chi tiết ở ra-soat-hieu-luc.mjs). */
function rutTuyenBoBaiBo(text) {
  const s = chuanHoa(text)
  const ra = []
  const push = (so, nam, loai, cau) => ra.push({ so: String(Number(so)), nam, loai: nhomLoai(loai), cau })

  const reHet = /hết hiệu lực/gi
  let m
  while ((m = reHet.exec(s)) !== null) {
    const batDau = Math.max(s.lastIndexOf('. ', m.index), s.lastIndexOf('; ', m.index), m.index - 420, 0)
    let menhDe = s.slice(batDau, m.index)
    if (/(Điều|khoản|điểm|Chương|Mục)\s*\d+[^.]{0,60}$/i.test(menhDe)) continue
    menhDe = menhDe.split(/đã được sửa đổi|được sửa đổi|sửa đổi, bổ sung một số điều theo/i)[0]
    const mv = menhDe.match(new RegExp(`(?:${LOAI_RE})[^.;]{0,60}?số\\s*(\\d{1,4})\\/(20\\d{2}|19\\d{2})\\/([A-ZĐ0-9-]+)`, 'i'))
    if (mv) push(mv[1], mv[2], mv[3], chuanHoa(s.slice(batDau, m.index + 160)))
  }

  const reBai = new RegExp(
    `Bãi bỏ\\s+(?:toàn bộ\\s+)?(?:${LOAI_RE})[^.;]{0,40}?số\\s*(\\d{1,4})\\/(20\\d{2}|19\\d{2})\\/([A-ZĐ0-9-]+)`,
    'gi',
  )
  while ((m = reBai.exec(s)) !== null) {
    push(m[1], m[2], m[3], chuanHoa(s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 180)))
  }
  return ra
}

/** Chuẩn hoá một số hiệu trong danh mục thành khoá so khớp "so/nam/LOAI". */
function khoaCua(soHieu) {
  const m = String(soHieu).match(/(\d{1,4})\/(19\d{2}|20\d{2})(?:\/([A-Za-zĐđ0-9-]+))?/)
  if (!m) return null
  return `${String(Number(m[1]))}/${m[2]}/${nhomLoai(m[3] || '')}`
}

/**
 * Duyệt mã nguồn lấy mọi CĂN CỨ PHÁP LÝ, kèm file:dòng.
 * Hai nguồn, đều phải soi — bản đầu chỉ soi (a) nên đã BỎ SÓT khối "Căn cứ" của
 * Thông báo/Quyết định nghỉ hưu trong lib/office-docx.ts (căn cứ đi thẳng vào văn
 * bản lãnh đạo KÝ, nhưng không nằm trong trường soHieu):
 *   (a) trường `soHieu: '...'` của các danh mục pháp lý;
 *   (b) MỌI chuỗi dạng "<Loại> số A/YYYY/KH" — khối Căn cứ, nhãn giao diện, thông
 *       báo lỗi… tức mọi chỗ cán bộ đọc được.
 * Dòng chú thích thuần (// hoặc *) bị bỏ qua: đó là ghi chú lịch sử ("thay NĐ
 * 175/2024"), không phải căn cứ đang viện dẫn.
 */
function quetDanhMuc(cacThuMuc) {
  const ra = []
  const reCanCu = /(?:Nghị định|Thông tư|Quyết định|Luật|Nghị quyết|NĐ|TT)\s*(?:số\s*)?(\d{1,4}\/(?:19|20)\d{2}(?:\/[A-Za-zĐđ0-9-]+)?)/g
  const duyet = (d) => {
    for (const ten of readdirSync(d)) {
      const p = join(d, ten)
      if (statSync(p).isDirectory()) {
        if (ten === 'node_modules' || ten === 'generated' || ten.startsWith('.')) continue
        duyet(p)
        continue
      }
      if (!/\.tsx?$/.test(ten)) continue
      const tepTuongDoi = relative(root, p)
      readFileSync(p, 'utf8').split('\n').forEach((l, i) => {
        const m = l.match(/soHieu:\s*'([^']+)'/)
        if (m) { ra.push({ tep: tepTuongDoi, dong: i + 1, soHieu: m[1], nguon: 'soHieu' }); return }
        // Bỏ qua: dòng chú thích thuần, VÀ trường ghiChu/moTa (ghi chú lịch sử kiểu
        // "Thay NĐ 06/2021" — đó là thông tin đúng, không phải căn cứ đang viện dẫn),
        // kể cả dòng nối chuỗi của ghi chú (bắt đầu bằng + '...').
        if (/^\s*(\/\/|\*|\/\*)/.test(l)) return
        if (/(ghiChu|moTa|ghi_chu)\s*:/.test(l)) return
        if (/^\s*\+\s*['"`]/.test(l)) return
        let mm
        reCanCu.lastIndex = 0
        while ((mm = reCanCu.exec(l)) !== null) {
          ra.push({ tep: tepTuongDoi, dong: i + 1, soHieu: mm[1], nguon: 'chuỗi' })
        }
      })
    }
  }
  for (const d of cacThuMuc) duyet(d)
  return ra
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  await client.query("SET client_encoding TO 'UTF8'")

  const { rows: doan } = await client.query(
    `SELECT t.nguon, c."noiDung"
       FROM tai_lieu_chunk c JOIN tai_lieu t ON t.id = c."taiLieuId"
      WHERE t."deletedAt" IS NULL
        AND (c."noiDung" ILIKE '%hết hiệu lực%' OR c."noiDung" ILIKE '%Bãi bỏ%')`,
  )
  await client.end()

  const baiBo = new Map()
  for (const d of doan) {
    for (const tb of rutTuyenBoBaiBo(d.noiDung)) {
      const k = `${tb.so}/${tb.nam}/${tb.loai}`
      if (!baiBo.has(k)) baiBo.set(k, [])
      const ds = baiBo.get(k)
      if (ds.length < 2 && !ds.some((x) => x.boi === d.nguon)) ds.push({ boi: d.nguon, cau: tb.cau })
    }
  }

  const mucs = quetDanhMuc([join(root, 'lib'), join(root, 'app'), join(root, 'components')])
  console.log(`Danh mục pháp lý hard-code: ${mucs.length} mục · căn cứ bãi bỏ rút từ kho: ${baiBo.size} số hiệu\n`)

  const sai = []
  for (const m of mucs) {
    const k = khoaCua(m.soHieu)
    if (k && baiBo.has(k)) sai.push({ ...m, khoa: k, bangChung: baiBo.get(k) })
  }

  console.log('════════════════════════════════════════════════════════════════')
  console.log(`  MỤC ĐANG NÊU VĂN BẢN ĐÃ BỊ BÃI BỎ LÀM CĂN CỨ: ${sai.length}`)
  console.log('════════════════════════════════════════════════════════════════\n')
  for (const s of sai) {
    console.log(`▶ ${s.tep}:${s.dong}  →  ${s.soHieu}   [${s.nguon}]`)
    for (const b of s.bangChung) {
      console.log(`  ├ bị bãi bỏ theo: ${b.boi}`)
      console.log(`  │  "…${b.cau.slice(0, 300)}…"`)
    }
    console.log('')
  }
  if (sai.length === 0) console.log('✅ Không mục nào trong danh mục nêu văn bản đã bị bãi bỏ làm căn cứ hiện hành.\n')

  // Cảnh báo mềm: văn bản rất cũ (trước 2020) vẫn nằm trong danh mục — cần rà tay
  const cu = mucs.filter((m) => {
    const y = String(m.soHieu).match(/\/(19\d{2}|20[01]\d)\//)
    return y && !sai.some((s) => s.tep === m.tep && s.dong === m.dong)
  })
  console.log(`── ${cu.length} mục ban hành trước 2020 — kho không chứng minh được là đã bãi bỏ, cần rà tay ──`)
  for (const m of cu) console.log(`   ${m.soHieu.padEnd(24)} ${m.tep}:${m.dong}`)

  if (XUAT_EXCEL) {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      sai.map((s) => ({ 'Tệp': s.tep, 'Dòng': s.dong, 'Số hiệu': s.soHieu,
        'Bị bãi bỏ theo': s.bangChung.map((b) => b.boi).join(' | '),
        'Trích nguyên văn': s.bangChung.map((b) => b.cau).join('\n───\n') })),
    ), 'Sai can cu')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      cu.map((m) => ({ 'Số hiệu': m.soHieu, 'Tệp': m.tep, 'Dòng': m.dong })),
    ), 'Can ra tay')
    const out = join(root, 'KIEM_TRA_CAN_CU_PHAP_LY.xlsx')
    writeFileSync(out, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
    console.log(`\n📄 Đã xuất: ${out}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
