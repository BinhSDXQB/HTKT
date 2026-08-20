// RÀ SOÁT HIỆU LỰC văn bản trong kho RAG — dựa trên CHÍNH điều khoản thi hành đã nạp.
//
//   node scripts/ra-soat-hieu-luc.mjs            # in bảng bằng chứng
//   node scripts/ra-soat-hieu-luc.mjs --excel    # kèm xuất Excel để trình duyệt ký
//
// MỤC ĐÍCH: chặn cán bộ dẫn chứng sai căn cứ và chatbot trả lời theo văn bản cũ.
//
// NGUYÊN TẮC QUAN TRỌNG — phân biệt 2 mức, KHÔNG được lẫn:
//   • BÃI BỎ TOÀN BỘ : "Nghị định số 175/2024/NĐ-CP hết hiệu lực kể từ ngày…"
//                       → văn bản chết hẳn, phải gỡ khỏi kho.
//   • SỬA ĐỔI MỘT PHẦN: "Bãi bỏ Điều 8 Nghị định số 140/2025/NĐ-CP"
//                       → văn bản VẪN CÒN HIỆU LỰC (bản hợp nhất). Gỡ là SAI.
//
// Bản rà bằng từ khoá thô ("hết hiệu lực"/"bãi bỏ" ở đâu đó gần số hiệu) cho ~30
// kết quả thì đa số là dương tính giả — kể cả câu "thay thế phương tiện" trong
// phụ lục vận tải. Vì vậy script này chỉ nhận các MẪU CÂU điều khoản thi hành.
//
// KHÔNG tự xoá bất cứ thứ gì. Chỉ đọc và báo cáo để người có thẩm quyền quyết định.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const XUAT_EXCEL = process.argv.includes('--excel')

const LOAI_RE = 'Nghị định|Thông tư|Quyết định|Luật|Nghị quyết|Pháp lệnh'

/** Chuẩn hoá: bỏ đánh dấu trang, gộp khoảng trắng, gộp chữ bị PDF tách rời. */
function chuanHoa(t) {
  return t.replace(/\[Trang \d+\]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Chuẩn hoá ký hiệu loại: TT-BGTVT/TT-BXD → TT ; ND-CP → ND ; QH14/QH15 → QH */
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

/**
 * Rút các tuyên bố BÃI BỎ TOÀN BỘ một văn bản.
 * Trả [{ so, nam, loai, cau }].
 *
 * Hai cạm bẫy đã gặp thực tế, phải loại bỏ:
 *  (a) DANH SÁCH VĂN BẢN ĐI SỬA — "Luật Đường sắt số 06/2017/QH14 đã được sửa đổi,
 *      bổ sung một số điều theo Luật số 35/2018/QH14, Luật số 31/2024/QH15 … hết
 *      hiệu lực". Chủ ngữ bị bãi bỏ là 06/2017; 35/2018 và 31/2024 chỉ là văn bản
 *      đi sửa, VẪN CÒN HIỆU LỰC.
 *  (b) TRÙNG SỐ KHÁC LOẠI — "bãi bỏ Thông tư số 35/2024/TT-BGTVT" không liên quan
 *      gì tới "Luật Đường bộ số 35/2024/QH15".
 */
function rutTuyenBoBaiBo(text) {
  const s = chuanHoa(text)
  const ra = []
  const push = (so, nam, loai, cau) =>
    ra.push({ so: String(Number(so)), nam, loai: nhomLoai(loai), cau })

  // ── (1) "<Loại> số A/YYYY/KH … hết hiệu lực" ───────────────────────────────
  // Chỉ lấy văn bản ĐẦU TIÊN của mệnh đề (chủ ngữ); cắt bỏ phần "đã được sửa đổi…theo…".
  const reHet = /hết hiệu lực/gi
  let m
  while ((m = reHet.exec(s)) !== null) {
    // Lấy mệnh đề: lùi về dấu chấm/chấm phẩy/số thứ tự khoản gần nhất
    const batDau = Math.max(
      s.lastIndexOf('. ', m.index),
      s.lastIndexOf('; ', m.index),
      m.index - 420,
      0,
    )
    let menhDe = s.slice(batDau, m.index)
    // Nếu bị giới hạn phạm vi (Điều/khoản/điểm/Chương/Mục) → là sửa một phần, bỏ
    if (/(Điều|khoản|điểm|Chương|Mục)\s*\d+[^.]{0,60}$/i.test(menhDe)) continue
    // CẮT danh sách văn bản đi sửa
    menhDe = menhDe.split(/đã được sửa đổi|được sửa đổi|sửa đổi, bổ sung một số điều theo/i)[0]

    const mv = menhDe.match(new RegExp(`(?:${LOAI_RE})[^.;]{0,60}?số\\s*(\\d{1,4})\\/(20\\d{2}|19\\d{2})\\/([A-ZĐ0-9-]+)`, 'i'))
    if (mv) push(mv[1], mv[2], mv[3], chuanHoa(s.slice(batDau, m.index + 160)))
  }

  // ── (2) "Bãi bỏ [toàn bộ] <Loại> số A/YYYY/KH" ────────────────────────────
  const reBai = new RegExp(
    `Bãi bỏ\\s+(?:toàn bộ\\s+)?(?:${LOAI_RE})[^.;]{0,40}?số\\s*(\\d{1,4})\\/(20\\d{2}|19\\d{2})\\/([A-ZĐ0-9-]+)`,
    'gi',
  )
  while ((m = reBai.exec(s)) !== null) {
    push(m[1], m[2], m[3], chuanHoa(s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 180)))
  }

  return ra
}

/** Suy số hiệu + loại từ tên file trong kho. */
function suySoHieu(nguon) {
  if (!nguon) return null
  const ten = nguon.replace(/\.(pdf|docx?)$/i, '')
  let m = ten.match(/(\d{1,4})[_\-.](20\d{2})[_\-.]?\s*(ND-CP|TT-BXD|TT-BTC|TT-BCA|TT-BGTVT|QH1[45]|QD-UBND|QD-BXD|UBTVQH15|CT-BXD|VBHN-BXD)/i)
  if (m) return { so: String(Number(m[1])), nam: m[2], loai: nhomLoai(m[3]) }
  // Dạng "Thông-tư-17-2026-TT-BXD"
  m = ten.match(/(\d{1,4})[_\-.](20\d{2})/)
  if (!m) return null
  let loai = ''
  if (/thong[\s_-]*tu|TT[-_]/i.test(ten)) loai = 'TT'
  else if (/nghi[\s_-]*dinh|ND[-_]/i.test(ten)) loai = 'ND'
  else if (/luat/i.test(ten)) loai = 'QH'
  else if (/quyet[\s_-]*dinh|QD[-_]/i.test(ten)) loai = 'QD'
  return { so: String(Number(m[1])), nam: m[2], loai }
}


async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  await client.query("SET client_encoding TO 'UTF8'")

  const { rows: docs } = await client.query(
    `SELECT id, nguon, "tinhTrangHieuLuc", "soChunk"
       FROM tai_lieu WHERE "deletedAt" IS NULL ORDER BY nguon`,
  )

  // ── Quét toàn bộ đoạn có dấu hiệu điều khoản thi hành ─────────────────────
  const { rows: doan } = await client.query(
    `SELECT t.nguon, c."noiDung"
       FROM tai_lieu_chunk c JOIN tai_lieu t ON t.id = c."taiLieuId"
      WHERE t."deletedAt" IS NULL
        AND (c."noiDung" ILIKE '%hết hiệu lực%' OR c."noiDung" ILIKE '%Bãi bỏ%')`,
  )

  /** soHieu bị tuyên bố bãi bỏ toàn bộ → [{ boi, cau }] */
  const baiBo = new Map()
  for (const d of doan) {
    for (const tb of rutTuyenBoBaiBo(d.noiDung)) {
      const khoa = `${tb.so}/${tb.nam}/${tb.loai}`
      if (!baiBo.has(khoa)) baiBo.set(khoa, [])
      const ds = baiBo.get(khoa)
      if (ds.length < 3 && !ds.some((x) => x.boi === d.nguon)) ds.push({ boi: d.nguon, cau: tb.cau })
    }
  }

  console.log(`Kho tài liệu: ${docs.length} văn bản · quét ${doan.length} đoạn có điều khoản thi hành`)
  console.log(`Tổng số hiệu bị tuyên bố bãi bỏ TOÀN BỘ (ở bất kỳ đâu trong kho): ${baiBo.size}\n`)

  // ── Đối chiếu: số hiệu bị bãi bỏ có nằm TRONG kho không ───────────────────
  const trongKho = []
  for (const d of docs) {
    const sh = suySoHieu(d.nguon)
    if (!sh) continue
    const khoa = `${sh.so}/${sh.nam}/${sh.loai}`
    if (baiBo.has(khoa)) trongKho.push({ ...d, soHieu: khoa, bangChung: baiBo.get(khoa) })
  }

  console.log('════════════════════════════════════════════════════════════════')
  console.log(`  VĂN BẢN TRONG KHO BỊ BÃI BỎ TOÀN BỘ: ${trongKho.length}`)
  console.log('════════════════════════════════════════════════════════════════\n')
  for (const k of trongKho) {
    console.log(`▶ ${k.nguon}`)
    console.log(`  số hiệu ${k.soHieu} · đang ghi: ${k.tinhTrangHieuLuc} · ${k.soChunk} đoạn`)
    for (const b of k.bangChung) {
      console.log(`  ├ căn cứ bãi bỏ nêu tại: ${b.boi}`)
      console.log(`  │  "…${b.cau}…"`)
    }
    console.log('')
  }

  // ── Các số hiệu bị bãi bỏ nhưng KHÔNG có trong kho (chỉ để tham khảo) ─────
  const shTrongKho = new Set(
    docs.map((d) => { const x = suySoHieu(d.nguon); return x ? `${x.so}/${x.nam}/${x.loai}` : null }).filter(Boolean),
  )
  const ngoaiKho = [...baiBo.keys()].filter((sh) => !shTrongKho.has(sh)).sort()
  console.log(`── ${ngoaiKho.length} số hiệu bị bãi bỏ nhưng KHÔNG có trong kho (không cần xử lý) ──`)
  console.log(ngoaiKho.join(', ') || '(không có)')

  if (XUAT_EXCEL) {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        trongKho.map((k) => ({
          'Tên file trong kho': k.nguon,
          'Số hiệu': k.soHieu,
          'Tình trạng đang ghi': k.tinhTrangHieuLuc,
          'Số đoạn': k.soChunk,
          'Căn cứ bãi bỏ nêu tại': k.bangChung.map((b) => b.boi).join(' | '),
          'Trích nguyên văn': k.bangChung.map((b) => b.cau).join('\n───\n'),
        })),
      ),
      'Bi bai bo toan bo',
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(ngoaiKho.map((sh) => ({ 'Số hiệu bị bãi bỏ (không có trong kho)': sh }))),
      'Ngoai kho',
    )
    const out = join(root, 'RA_SOAT_HIEU_LUC_VBPL.xlsx')
    writeFileSync(out, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
    console.log(`\n📄 Đã xuất: ${out}`)
  }

  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
