// Cổng tra cứu NỘI DUNG CHUYÊN MÔN hạ tầng kỹ thuật cho chatbot và giao diện.
//
// Gom 4 lớp nội dung đã biên soạn có dẫn nguồn:
//   1. quy-trinh-linh-vuc.ts     — quy trình quản lý nhà nước theo lĩnh vực
//   2. phan-cap-cong-trinh.ts    — tiêu chí kỹ thuật phân cấp công trình HTKT
//   3. quy-hoach.ts              — hạ tầng kỹ thuật trong quy hoạch đô thị, nông thôn
//   4. ha-tang-thong-minh.ts     — hạ tầng kỹ thuật & chiếu sáng đô thị thông minh
//
// Mọi kết quả trả về đều kèm ĐIỀU – KHOẢN của văn bản gốc, để chatbot không phải
// (và không được) tự nghĩ ra số hiệu văn bản.

import { QUY_TRINH_LINH_VUC, CHUA_DU_CAN_CU, timQuyTrinh, type QuyTrinhLinhVuc } from './quy-trinh-linh-vuc'
import { BANG_1_3, KET_CAU_COT_HTKT, LUU_Y_AP_DUNG, moTaDongPhanCap, timPhanCap } from './phan-cap-cong-trinh'
import * as QH from './quy-hoach'
import {
  CHI_SO_TRUONG_THANH,
  LINH_VUC_THONG_MINH,
  NGUYEN_TAC_PHAT_TRIEN,
  YEU_CAU_LIEN_THONG,
  CACH_DANH_GIA,
  KHOANG_TRONG,
  timChiSo,
} from './ha-tang-thong-minh'

export type ChuDe = 'quy_trinh' | 'phan_cap' | 'quy_hoach' | 'thong_minh'

export const CHU_DE_LABEL: Record<ChuDe, string> = {
  quy_trinh: 'Quy trình quản lý nhà nước theo lĩnh vực',
  phan_cap: 'Phân cấp công trình hạ tầng kỹ thuật (tiêu chí kỹ thuật)',
  quy_hoach: 'Hạ tầng kỹ thuật trong quy hoạch đô thị và nông thôn',
  thong_minh: 'Hạ tầng kỹ thuật và chiếu sáng đô thị thông minh',
}

// ── Định dạng cho chatbot ───────────────────────────────────────────────────

function formatQuyTrinh(q: QuyTrinhLinhVuc): string {
  const dong: string[] = []
  dong.push(`■ ${q.ten} (${q.loai})${q.apDungMoiLinhVuc ? ' — QUY ĐỊNH KHUNG áp dụng mọi lĩnh vực, KHÔNG thay thế quy trình quản lý chuyên ngành' : ''}`)
  dong.push(`   Phạm vi: ${q.apDung}`)
  if (q.hoSo?.length) {
    dong.push('   Hồ sơ:')
    q.hoSo.forEach((h) => dong.push(`     - ${h.ten}${h.soLuong ? ` (${h.soLuong})` : ''}`))
  }
  dong.push('   Các bước:')
  q.buoc.forEach((b) =>
    dong.push(
      `     ${b.buoc}. ${b.ten}: ${b.noiDung}` +
        (b.trachNhiem ? ` [Trách nhiệm: ${b.trachNhiem}]` : '') +
        (b.thoiHan ? ` [Thời hạn: ${b.thoiHan}]` : '') +
        (b.canCu ? ` [Căn cứ: ${b.canCu}]` : '')
    )
  )
  if (q.thoiHan?.length) {
    dong.push('   Mốc thời gian:')
    q.thoiHan.forEach((t) => dong.push(`     - ${t}`))
  }
  dong.push(`   Kết quả: ${q.ketQua}`)
  dong.push(`   Căn cứ: ${q.canCu.join('; ')}`)
  if (q.luuY?.length) {
    dong.push('   Lưu ý:')
    q.luuY.forEach((l) => dong.push(`     - ${l}`))
  }
  return dong.join('\n')
}

function traQuyTrinh(tuKhoa: string): string | null {
  const kq = tuKhoa ? timQuyTrinh(tuKhoa) : QUY_TRINH_LINH_VUC
  if (!kq.length) return null
  const phan = kq.slice(0, 3).map(formatQuyTrinh)
  const thieu = CHUA_DU_CAN_CU.map((c) => `${c.ten}: ${c.canVanBan}`).join(' · ')
  return (
    `QUY TRÌNH NGHIỆP VỤ HẠ TẦNG KỸ THUẬT (${kq.length} quy trình khớp, hiển thị ${Math.min(3, kq.length)}):\n\n` +
    phan.join('\n\n') +
    `\n\n⚠️ Lĩnh vực CHƯA có quy trình chi tiết trong hệ thống (thiếu văn bản gốc trong kho — KHÔNG được tự mô tả quy trình cho các lĩnh vực này): ${thieu}`
  )
}

function traPhanCap(tuKhoa: string): string {
  const kq = timPhanCap(tuKhoa)
  const dong: string[] = []
  if (kq.length) {
    dong.push(`PHÂN CẤP CÔNG TRÌNH HẠ TẦNG KỸ THUẬT — ${kq.length} mục khớp "${tuKhoa}":`)
    kq.slice(0, 8).forEach((x) => dong.push(`  • [${x.nhom.ten}] ${moTaDongPhanCap(x.dong)}`))
  } else {
    dong.push('PHÂN CẤP CÔNG TRÌNH HẠ TẦNG KỸ THUẬT — Bảng 1.3 Phụ lục I Thông tư 34/2026/TT-BXD, các nhóm hiện có:')
    BANG_1_3.forEach((n) => dong.push(`  • ${n.ma} ${n.ten}`))
    dong.push(`  • 2.2.2 (Phụ lục II) ${KET_CAU_COT_HTKT.ten}`)
  }
  dong.push('')
  dong.push('Lưu ý áp dụng:')
  LUU_Y_AP_DUNG.forEach((l) => dong.push(`  - ${l.noiDung} [${l.canCu}]`))
  dong.push('Nguồn: Thông tư 34/2026/TT-BXD ngày 25/6/2026 (hiệu lực 01/7/2026, thay TT 06/2021/TT-BXD).')
  return dong.join('\n')
}

function traQuyHoach(tuKhoa: string): string {
  const dong: string[] = []
  dong.push('HẠ TẦNG KỸ THUẬT TRONG QUY HOẠCH ĐÔ THỊ VÀ NÔNG THÔN')
  dong.push('')
  dong.push('Định nghĩa:')
  QH.DINH_NGHIA.forEach((d) => dong.push(`  - ${d.noiDung} [${d.canCu}]`))
  dong.push('')
  dong.push('Áp dụng tại tỉnh Quảng Trị:')
  QH.AP_DUNG_TAI_TINH.forEach((d) => dong.push(`  - ${d.noiDung} [${d.canCu}]`))
  dong.push('')
  dong.push('Yêu cầu về hạ tầng kỹ thuật đối với đồ án:')
  QH.YEU_CAU_HTKT_DOI_VOI_DO_AN.forEach((d) => dong.push(`  - ${d.noiDung} [${d.canCu}]`))
  dong.push('')
  dong.push(`Trình tự lập – thẩm định – phê duyệt [${QH.TRINH_TU_CAN_CU}]: ${QH.TRINH_TU.join(' → ')}`)
  dong.push('')
  dong.push(`Tám chuyên ngành hạ tầng kỹ thuật phải thể hiện trong đồ án [${QH.CHUYEN_NGANH_CAN_CU}]:`)
  QH.CHUYEN_NGANH_HTKT_TRONG_DO_AN.forEach((c) => dong.push(`  - ${c.ten}${c.ghiChu ? ` (${c.ghiChu})` : ''}`))
  dong.push('')
  dong.push('Danh mục kiểm khi Phòng HTKT góp ý đồ án:')
  QH.CHECKLIST_GOP_Y.forEach((c) => dong.push(`  - ${c.muc} [${c.bamVao}]`))
  dong.push('')
  dong.push('⚠️ Điểm CHƯA đủ căn cứ, không được tự trả lời:')
  QH.CAN_DOI_CHIEU.forEach((c) => dong.push(`  - ${c}`))
  if (tuKhoa) {
    const banVe = QH.YEU_CAU_BAN_VE.filter((b) => b.noiDung.toLowerCase().includes(tuKhoa.toLowerCase()))
    if (banVe.length) {
      dong.push('')
      dong.push('Yêu cầu bản vẽ liên quan từ khoá:')
      banVe.forEach((b) => dong.push(`  - ${b.noiDung} [${b.canCu}]`))
    }
  }
  return dong.join('\n')
}

function traThongMinh(tuKhoa: string): string {
  const dong: string[] = []
  dong.push('HẠ TẦNG KỸ THUẬT ĐÔ THỊ THÔNG MINH (gồm CHIẾU SÁNG CÔNG CỘNG THÔNG MINH)')
  dong.push('')
  dong.push('Năm lĩnh vực HTKT thông minh — Nghị định 269/2025/NĐ-CP Điều 24:')
  LINH_VUC_THONG_MINH.forEach((l) => {
    dong.push(`  ▸ ${l.ten} [${l.khoan}]`)
    l.thanhPhan.forEach((t) => dong.push(`      - ${t}`))
  })
  dong.push('')
  dong.push('Nguyên tắc phát triển (NĐ 269/2025/NĐ-CP Điều 23):')
  NGUYEN_TAC_PHAT_TRIEN.forEach((n) => dong.push(`  - ${n.noiDung} [${n.khoan}]`))
  dong.push('')
  dong.push('Yêu cầu tích hợp, liên thông (NĐ 269/2025/NĐ-CP Điều 25):')
  YEU_CAU_LIEN_THONG.forEach((n) => dong.push(`  - ${n.noiDung} [${n.khoan}]`))
  dong.push('')

  const chiSo = tuKhoa ? timChiSo(tuKhoa) : []
  const danhSach = chiSo.length ? chiSo : CHI_SO_TRUONG_THANH
  dong.push(
    `Bộ chỉ số trưởng thành — Thông tư 03/2026/TT-BXD Phụ lục I (${chiSo.length ? `${chiSo.length} chỉ số khớp "${tuKhoa}"` : `toàn bộ ${CHI_SO_TRUONG_THANH.length} chỉ số liên quan HTKT`}):`
  )
  danhSach.slice(0, 8).forEach((c) => {
    dong.push(`  ▸ ${c.kyHieu} — ${c.ten} (trụ cột ${c.truCot} / ${c.nhom}${c.coBan ? `, chỉ số cơ bản ${c.coBan}` : ''})`)
    dong.push(`      · Cấp độ nền tảng: ${c.nenTang}`)
    if (c.lienKet) dong.push(`      · Cấp độ liên kết hệ thống: ${c.lienKet}`)
    if (c.doiMoi) dong.push(`      · Cấp độ đổi mới quản trị: ${c.doiMoi}`)
    if (c.giaiThich) dong.push(`      · Giải thích nội dung chỉ số: ${c.giaiThich}`)
  })
  dong.push('')
  dong.push('Cách đánh giá, công nhận (Thông tư 03/2026/TT-BXD Điều 2):')
  CACH_DANH_GIA.forEach((c) => dong.push(`  - ${c.noiDung} [${c.khoan}]`))
  dong.push('')
  dong.push('⚠️ Khoảng trống đã đối chiếu — nói thẳng với người dùng, KHÔNG bù bằng kiến thức chung:')
  KHOANG_TRONG.forEach((k) => dong.push(`  - ${k}`))
  return dong.join('\n')
}

// ── Điểm vào duy nhất cho chatbot ───────────────────────────────────────────

const TU_KHOA_CHU_DE: { chuDe: ChuDe; tu: string[] }[] = [
  { chuDe: 'thong_minh', tu: ['thông minh', 'smart', 'iot', 'cảm biến', 'trí tuệ nhân tạo', 'trưởng thành', 'ioc', 'lgsp', 'đô thị thông minh', 'chiếu sáng thông minh'] },
  { chuDe: 'phan_cap', tu: ['phân cấp', 'cấp công trình', 'cấp i', 'cấp ii', 'cấp iii', 'cấp iv', 'đặc biệt', 'quy mô công suất', 'thẩm quyền thẩm định'] },
  { chuDe: 'quy_hoach', tu: ['quy hoạch', 'đồ án', 'phân khu', 'chi tiết', 'nhiệm vụ quy hoạch', 'bản vẽ', 'hạ tầng kỹ thuật khung', 'cao độ nền'] },
  { chuDe: 'quy_trinh', tu: ['quy trình', 'thủ tục', 'trình tự', 'giấy phép', 'chặt hạ', 'dịch chuyển', 'định mức', 'dự toán', 'báo cáo', 'vận hành', 'duy trì', 'đề án'] },
]

/** Đoán chủ đề từ câu hỏi khi người dùng không nêu rõ. */
export function doanChuDe(tuKhoa: string): ChuDe {
  const k = (tuKhoa || '').toLowerCase()
  for (const m of TU_KHOA_CHU_DE) if (m.tu.some((t) => k.includes(t))) return m.chuDe
  return 'quy_trinh'
}

export function traCuuNghiepVuHtkt(chuDe: ChuDe | undefined, tuKhoa: string): string {
  const cd = chuDe || doanChuDe(tuKhoa)
  const k = (tuKhoa || '').trim()
  if (cd === 'phan_cap') return traPhanCap(k)
  if (cd === 'quy_hoach') return traQuyHoach(k)
  if (cd === 'thong_minh') return traThongMinh(k)

  const kq = traQuyTrinh(k)
  if (kq) return kq
  return (
    `Hệ thống KHÔNG có quy trình nào khớp "${k}" trong bộ nội dung nghiệp vụ hạ tầng kỹ thuật. ` +
    `Nói thẳng điều này, KHÔNG tự mô tả quy trình từ kiến thức chung. ` +
    `Các quy trình đang có: ${QUY_TRINH_LINH_VUC.map((q) => q.ten).join(' · ')}. ` +
    `Có thể thử chủ đề khác (phan_cap, quy_hoach, thong_minh) hoặc tool tra_cuu_tai_lieu để tìm nguyên văn trong kho.`
  )
}

/** Danh sách ngắn để nhắc người dùng phạm vi đang có. */
export function phamViNoiDung(): string {
  return [
    `Quy trình (${QUY_TRINH_LINH_VUC.length}): ${QUY_TRINH_LINH_VUC.map((q) => q.ten).join(' · ')}`,
    `Phân cấp công trình: ${BANG_1_3.length} nhóm theo Bảng 1.3 TT 34/2026/TT-BXD + kết cấu cột đèn (Phụ lục II mục 2.2.2)`,
    `Quy hoạch: ${QH.CHUYEN_NGANH_HTKT_TRONG_DO_AN.length} chuyên ngành HTKT trong đồ án + danh mục kiểm khi góp ý`,
    `Đô thị thông minh: ${LINH_VUC_THONG_MINH.length} lĩnh vực (NĐ 269/2025 Điều 24) + ${CHI_SO_TRUONG_THANH.length} chỉ số trưởng thành (TT 03/2026 Phụ lục I)`,
  ].join('\n')
}
