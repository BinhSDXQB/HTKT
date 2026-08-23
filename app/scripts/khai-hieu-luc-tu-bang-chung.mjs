// KHAI TÌNH TRẠNG HIỆU LỰC vào prisma/hieu-luc-vbpl.json DỰA TRÊN BẰNG CHỨNG trong kho.
//
//   node scripts/khai-hieu-luc-tu-bang-chung.mjs --dry   # xem trước
//   node scripts/khai-hieu-luc-tu-bang-chung.mjs         # ghi vào hieu-luc-vbpl.json
//   (sau đó: node scripts/sync-hieu-luc-tai-lieu.mjs)
//
// Vì sao cần: tài liệu KHÔNG khai trong bảng đăng ký nằm ở 'can_kiem_chung', nên tool
// tra_cuu_tai_lieu gắn nhãn "⚠️ CHƯA XÁC MINH HIỆU LỰC" — chatbot trả lời nước đôi
// dù văn bản mới ban hành và đang có hiệu lực. Ngày 23/8/2026 có 23/106 tài liệu như vậy.
//
// NGUYÊN TẮC: chỉ khai 'con_hieu_luc' khi CÓ ĐỦ BA bằng chứng, đều lấy từ dữ liệu, không đoán:
//   1. Chính văn bản nêu điều khoản thi hành với ngày hiệu lực ĐÃ ĐẾN ("… có hiệu lực
//      thi hành từ ngày …"), trích nguyên văn vào ghiChu.
//      Trường hợp "có hiệu lực kể từ ngày ký" thì văn bản không tự nêu ngày → suy từ NĂM
//      trong tên tệp; năm đó phải ĐÃ QUA hoặc là năm nay thì mới coi là đã có hiệu lực.
//   2. Không văn bản NÀO trong kho tuyên bố bãi bỏ toàn bộ nó — script TỰ quét, không
//      chỉ dẫn lại kết quả scripts/ra-soat-hieu-luc.mjs (Codex phản biện 23/8/2026: dẫn
//      lại kết quả một lần chạy là khẳng định quá tay, kho thay đổi sau mỗi lần nạp).
//   3. Bản thân câu điều khoản thi hành không nói văn bản này hết hiệu lực.
// Thiếu bất kỳ bằng chứng nào thì GIỮ NGUYÊN 'can_kiem_chung' — thà để chatbot nhắc người
// dùng đối chiếu còn hơn khẳng định sai hiệu lực rồi cán bộ trích vào tờ trình.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const DRY = process.argv.includes('--dry')
const NGAY_RA = '23/8/2026'
const RE_HIEU_LUC = /(Nghị định|Thông tư|Quyết định|Luật) này có hiệu lực[^.]{0,200}?\./gi

/**
 * Câu điều khoản thi hành "sạch" nhất: mốc ngày phải ĐỨNG NGAY SAU "có hiệu lực … từ ngày".
 *
 * Không được vơ mọi câu có chứa ngày tháng: NĐ 254/2025 có câu chuyển tiếp "Nghị định này
 * có hiệu lực: thực hiện theo quy định tại Nghị định số 99/2021/NĐ-CP ngày 11 tháng 11 năm
 * 2021…" — bắt theo "ngày bất kỳ" sẽ ghi nhầm mốc 2021 làm ngày hiệu lực.
 */
const RE_MOC = /có hiệu lực(?:\s+thi hành)?\s+(?:kể\s+)?từ\s+ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i

// Bản PDF Công báo bóc chữ ra rời rạc ("Ngh ị đị nh này có hi ệ u l ự c"), khoảng trắng đặt
// tuỳ font nên không gộp lại thành câu chuẩn được. Cách chắc ăn: BỎ HẾT khoảng trắng rồi dò.
const RE_MOC_LIEN = /cóhiệulực(?:thihành)?(?:kểtừ|từ)?ngày(\d{1,2})tháng(\d{1,2})năm((?:19|20)\d{2})/i
const RE_KY_LIEN = /cóhiệulực(?:thihành)?kểtừngàyký/i

function bangChung(raw) {
  const cau = [...new Set(raw.match(RE_HIEU_LUC) ?? [])].map((s) => s.replace(/\s+/g, ' ').trim())
  const coMoc = cau.filter((s) => RE_MOC.test(s))
  if (coMoc.length) {
    const moc = (s) => { const m = s.match(RE_MOC); return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) }
    const sapXep = [...coMoc].sort((a, b) => +moc(a) - +moc(b))
    return { cau: sapXep[0], ngay: moc(sapXep[0]) }
  }
  const kyBanHanh = cau.find((s) => /có hiệu lực(\s+thi hành)?\s+kể từ ngày ký/i.test(s))
  if (kyBanHanh) return { cau: kyBanHanh, ngay: null }

  // Không dò được trên văn bản có khoảng trắng chuẩn → thử bản BỎ HẾT khoảng trắng (PDF Công báo).
  const lien = raw.replace(/\s+/g, '')
  const m = lien.match(RE_MOC_LIEN)
  if (m) {
    const [, d, mm, y] = m
    return {
      cau: `Nghị định/Luật này có hiệu lực thi hành từ ngày ${d} tháng ${mm} năm ${y}`
        + ' (trích bản Công báo — PDF tách rời từng ký tự nên câu đã được chuẩn hoá lại)',
      ngay: new Date(Date.UTC(+y, +mm - 1, +d)),
    }
  }
  if (RE_KY_LIEN.test(lien)) {
    return { cau: 'Văn bản này có hiệu lực thi hành kể từ ngày ký (trích bản Công báo, đã chuẩn hoá)', ngay: null }
  }
  return null
}

/** Năm ban hành suy từ tên tệp ("170_2025_ND-CP…", "TT 30 2026…"). */
function namTuTenTep(nguon) {
  const nam = [...nguon.matchAll(/(19|20)\d{2}/g)].map((m) => Number(m[0]))
  return nam.length ? Math.min(...nam) : null
}

/**
 * Có văn bản nào trong kho tuyên bố BÃI BỎ TOÀN BỘ văn bản này không.
 * Chỉ nhận mẫu câu điều khoản thi hành ("… hết hiệu lực kể từ ngày…", "bãi bỏ Nghị định số…"),
 * KHÔNG nhận việc bãi bỏ một điều/khoản (văn bản vẫn còn hiệu lực ở dạng hợp nhất).
 */
async function biBaiBo(client, so, nam, loai) {
  const soN = Number(so)
  // Phải khớp CẢ LOẠI văn bản: "19/2026/NĐ-CP" khác hẳn "19/2026/TT-BXD".
  const mauSoHieu = `0*${soN}/${nam}/${loai}`
  const { rows } = await client.query(
    `SELECT d."tieuDe", c."noiDung"
       FROM tai_lieu_chunk c JOIN tai_lieu d ON d.id = c."taiLieuId"
      WHERE d."deletedAt" IS NULL AND c."noiDung" ~ $1
      LIMIT 20`, [mauSoHieu])

  for (const r of rows) {
    const t = r.noiDung.replace(/\s+/g, ' ')
    for (const m of t.matchAll(new RegExp(mauSoHieu, 'g'))) {
      // Xét cụm câu quanh chỗ nhắc số hiệu, không xét cả đoạn: một đoạn dài có thể vừa
      // nhắc "hết hiệu lực" của văn bản KHÁC vừa nhắc văn bản này ở ý khác.
      const cum = t.slice(Math.max(0, m.index - 200), m.index + 200)
      if (!/hết hiệu lực|bãi bỏ/i.test(cum)) continue
      // SỬA ĐỔI MỘT PHẦN thì văn bản VẪN CÒN hiệu lực (dạng hợp nhất):
      //   "Sửa đổi, bổ sung, bãi bỏ MỘT SỐ ĐIỀU của Nghị định số 19/2026/NĐ-CP" (NĐ 96/2026 Điều 99)
      //   "bãi bỏ Điều 8 Nghị định số 140/2025/NĐ-CP"
      //   "Bãi bỏ MỘT SỐ NỘI DUNG quy định tại Nghị định số 254/2025/NĐ-CP" (NĐ 193/2026)
      if (/một số điều|một số nội dung|một số quy định|sửa đổi,? bổ sung|thay thế cụm từ|bãi bỏ\s+(Điều|khoản|điểm)/i.test(cum)) continue
      return r.tieuDe
    }
  }
  return null
}

async function main() {
  const duongDan = join(root, 'prisma', 'hieu-luc-vbpl.json')
  const dangKy = JSON.parse(readFileSync(duongDan, 'utf8'))
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()

  const { rows } = await client.query(
    `SELECT id, nguon FROM tai_lieu
      WHERE "deletedAt" IS NULL AND "tinhTrangHieuLuc" = 'can_kiem_chung' ORDER BY nguon`)

  let khai = 0, giuNguyen = 0
  for (const d of rows) {
    const { rows: ch } = await client.query(
      'SELECT "noiDung" FROM tai_lieu_chunk WHERE "taiLieuId"=$1 ORDER BY "chunkIndex"', [d.id])
    const bc = bangChung(ch.map((x) => x.noiDung).join(' '))
    const namBanHanh = namTuTenTep(d.nguon)
    let vuong = null
    if (!bc) vuong = 'không tìm thấy điều khoản thi hành'
    else if (bc.ngay && bc.ngay > new Date()) vuong = 'ngày hiệu lực còn ở tương lai'
    else if (!bc.ngay && (!namBanHanh || namBanHanh > new Date().getFullYear())) {
      vuong = '"kể từ ngày ký" nhưng không xác định được năm ban hành'
    }

    // Số hiệu + LOẠI văn bản lấy từ tên tệp ("104_2026_ND-CP…", "37_2026_TT-BXD…").
    const mSo = d.nguon.match(/(\d{1,3})[_\s-]+((?:19|20)\d{2})[_\s-]+(ND-CP|TT-BXD|TT-BCA|QH15|QH14|QD-UBND|QD-TTg)/i)
    if (!vuong && mSo) {
      const loai = mSo[3].toUpperCase().replace('ND-CP', 'NĐ-CP').replace('QD-', 'QĐ-')
      const boi = await biBaiBo(client, mSo[1], mSo[2], loai)
      if (boi) vuong = `bị tuyên bố bãi bỏ trong "${boi}"`
    }

    if (vuong) {
      giuNguyen++
      console.log(`⚠ GIỮ can_kiem_chung: ${d.nguon} — ${vuong}`)
      continue
    }
    khai++
    dangKy.vanBan[d.nguon] = {
      tinhTrang: 'con_hieu_luc',
      thayTheBoi: '',
      ghiChu: `Rà ${NGAY_RA} từ chính văn bản trong kho: "${bc.cau}"` +
        (bc.ngay ? '' : ` (ngày ký — văn bản ban hành năm ${namBanHanh})`) +
        ' · đã quét kho: không văn bản nào tuyên bố bãi bỏ toàn bộ văn bản này.',
    }
    console.log(`✔ khai con_hieu_luc: ${d.nguon}`)
  }

  console.log(`\n${DRY ? '[CHẠY THỬ] Sẽ khai' : 'Đã khai'}: ${khai} · giữ can_kiem_chung: ${giuNguyen}`)
  if (!DRY) {
    writeFileSync(duongDan, JSON.stringify(dangKy, null, 2) + '\n', 'utf8')
    console.log('→ Đã ghi prisma/hieu-luc-vbpl.json. Chạy tiếp: node scripts/sync-hieu-luc-tai-lieu.mjs')
  }
  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
