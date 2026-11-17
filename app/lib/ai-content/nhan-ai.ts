/**
 * Thông báo AI + chuẩn hoá văn bản: THUẦN, không import node:crypto — giao diện (client) dùng chung đúng quy tắc của cổng.
 */

/** Chuẩn hoá trước khi băm: bỏ khác biệt xuống dòng/khoảng trắng cuối dòng để băm ổn định giữa các hệ. */
export function chuanHoa(s: string): string {
  return s.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/[ \t]+$/g, '')).join('\n').trim()
}


/**
 * THÔNG BÁO AI — căn cứ (đã đối chiếu nguyên văn 12/11/2026, kho Tailieu_VBPL):
 *  - Luật Trí tuệ nhân tạo số 134/2025/QH15, Điều 11 khoản 3: bên triển khai "có trách nhiệm thông báo rõ ràng khi cung cấp
 *    ra công cộng văn bản, âm thanh, hình ảnh, video được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo nếu nội dung
 *    đó có khả năng gây nhầm lẫn về tính xác thực của sự kiện, nhân vật".
 *  - Nghị định 142/2026/NĐ-CP, Điều 18 khoản 3: thông báo phải a) "rõ ràng, dễ hiểu và dễ nhận biết đối với người tiếp nhận";
 *    b) "được thực hiện trước hoặc tại thời điểm người tiếp nhận tiếp cận nội dung"; c) "không được thiết kế theo cách che
 *    giấu hoặc làm giảm khả năng nhận biết bản chất của nội dung".
 *  - Điều 18 khoản 5 điểm a, b: được chọn hình thức "hiển thị trực tiếp trên nội dung" hoặc "tại tiêu đề, phần mô tả hoặc
 *    chú thích kèm theo nội dung". Khoản 6 nêu "phần mở đầu, phần kết thúc, phần danh đề, phần mô tả hoặc tài liệu kèm theo"
 *    cho tác phẩm điện ảnh, chương trình nghệ thuật, nội dung sáng tạo.
 *  - Điều 18 khoản 7: Bộ KH&CN sẽ công bố hướng dẫn kỹ thuật tham chiếu → câu chữ và vị trí là CẤU HÌNH, đổi không cần sửa mã.
 *
 * PHÂN BIỆT: văn bản KHÔNG quy định "ngay sau tiêu đề", ngưỡng ký tự hay một câu cố định. Đó là QUY ĐỊNH XUẤT BẢN CỦA HỆ
 * THỐNG, chọn cách áp dụng chặt điểm b khoản 3 trong khi chờ Pháp chế trả lời thông báo cuối bài có đạt hay không. Thông báo
 * lỗi phải nói rõ điều này, không viết như thể luật bắt buộc đúng vị trí đó.
 *
 * Câu mặc định dùng đúng cụm từ của Luật ("được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo"), không dùng cách nói
 * giảm nhẹ kiểu "hỗ trợ biên soạn" (rủi ro với Đ18 k3 c).
 */
export const NHAN_AI_MAC_DINH = 'Nội dung này được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo.'

/** Ký tự vô hình/điều khiển hướng chữ: không được có trong câu cấu hình, và không được đứng trước thông báo trong bài. */
const KY_TU_AN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F­​-‏‪-‮⁠-⁩﻿]/

/** Chuẩn hoá để NHẬN DIỆN câu (không dùng cho băm phê duyệt): NFC + các loại dấu cách hiển thị như nhau về dấu cách thường. */
function chuanNhan(s: string): string {
  return s.normalize('NFC').replace(/[  -   　]/g, ' ')
}

/**
 * Ký tự là "chữ" hoặc dấu phụ theo Unicode nhưng hiển thị TRỐNG (Hangul filler, variation selector, tag…): chỉ cấm trong câu
 * CẤU HÌNH — không cấm trong bài, vì biểu tượng cảm xúc ở tiêu đề dùng variation selector hợp lệ. Viết bằng số mã điểm để
 * đọc và rà soát được (ký tự vô hình gõ thẳng vào mã nguồn thì không ai nhìn thấy).
 */
const KHOANG_KY_TU_TRONG: Array<[number, number]> = [
  [0x034f, 0x034f], [0x115f, 0x1160], [0x17b4, 0x17b5], [0x180b, 0x180f], [0x3164, 0x3164],
  [0xfe00, 0xfe0f], [0xffa0, 0xffa0], [0xe0000, 0xe0fff],
]
function coKyTuTrong(s: string): boolean {
  for (const c of s) {
    const m = c.codePointAt(0)!
    if (KHOANG_KY_TU_TRONG.some(([a, b]) => m >= a && m <= b)) return true
  }
  return false
}

/**
 * Câu cấu hình hợp lệ: 20–180 ký tự (tiêu đề tối đa 300 + câu 180 vẫn nằm trọn trong bài ĐẦU của chuỗi Threads 500 ký tự), có chữ, không ký tự ẩn, không chứa dấu ngăn
 * chuỗi. Không hợp lệ → dùng câu mặc định (chặt hơn), không âm thầm chấp nhận một "thông báo" vô hình.
 */
export const NHAN_AI_DAI_TOI_DA = 180
export function nhanAiTuCauHinh(tho: string | undefined): { nhan: string; loi: string | null } {
  const s = chuanNhan(tho ?? '').replace(/\s+/g, ' ').trim()
  if (!s) return { nhan: NHAN_AI_MAC_DINH, loi: null }
  const loi = KY_TU_AN.test(tho ?? '') || coKyTuTrong(tho ?? '') ? 'chứa ký tự ẩn/điều khiển'
    : s.length < 20 || s.length > NHAN_AI_DAI_TOI_DA ? `phải dài 20–${NHAN_AI_DAI_TOI_DA} ký tự`
      : !/\p{L}{2,}/u.test(s) ? 'không có chữ'
        : s.includes('———') ? 'chứa dấu ngăn chuỗi bài' : null
  return loi ? { nhan: NHAN_AI_MAC_DINH, loi } : { nhan: s, loi: null }
}
const cauHinhNhan = nhanAiTuCauHinh(process.env.AI_CONTENT_NHAN_AI)
if (cauHinhNhan.loi) console.error(`[ai-content] AI_CONTENT_NHAN_AI không hợp lệ (${cauHinhNhan.loi}) — dùng câu mặc định`)
export const NHAN_AI = cauHinhNhan.nhan
export const NGAN_CACH_CHUOI = '\n\n———\n\n'

/**
 * Vị trí thông báo trong bài ĐẦU của chuỗi (quy định xuất bản của hệ thống, xem chú thích trên):
 *  - 'dau' (mặc định): trước thông báo chỉ được có tiêu đề — tối đa MỘT đoạn, không quá GIOI_HAN_TRUOC_NHAN ký tự
 *    (bằng giới hạn tiêu đề bài; không tính dấu "#" của tiêu đề Markdown).
 *  - 'bat_ky': thông báo nằm đâu trong bài đầu cũng được (chú thích cuối bài, Đ18 k5 b). CHỈ bật khi Pháp chế xác nhận bằng văn bản.
 * Ở cả hai chế độ: thông báo không được nằm trong chú thích HTML (không hiển thị) hay sau ký tự ẩn (Đ18 k3 c).
 */
export type ViTriNhanAi = 'dau' | 'bat_ky'
export const VI_TRI_NHAN_AI: ViTriNhanAi = process.env.AI_CONTENT_VI_TRI_NHAN === 'bat_ky' ? 'bat_ky' : 'dau'
export const GIOI_HAN_TRUOC_NHAN = 300

export type LoiNhanAi = 'thieu' | 'sai_vi_tri' | 'bi_che'

/** Lý do thông báo AI chưa đạt trong MỘT bài (null = đạt). Hàm thuần: giao diện dùng lại được, không đọc biến môi trường. */
export function loiNhanAi(baiDau: string, nhan: string = NHAN_AI, viTri: ViTriNhanAi = VI_TRI_NHAN_AI): LoiNhanAi | null {
  // Chỉ nhắc tới "AI" trong bài không được tính là thông báo: phải có đúng câu chuẩn.
  // Gộp khoảng trắng và xuống dòng đơn (câu bị ngắt dòng vẫn nhận ra), GIỮ ngắt đoạn để đếm đoạn đứng trước.
  const phangHoa = (s: string) => s.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/(?<!\n)\n(?!\n)/g, ' ')
  const tho = chuanNhan(chuanHoa(baiDau))
  const cau = chuanNhan(nhan)
  // Chú thích HTML đã đóng không hiển thị: bỏ khỏi văn bản đem xét, để câu nằm trong chú thích không được tính và
  // một chú thích đứng trước không làm hỏng thông báo hiển thị thật ở phía sau.
  const phang = phangHoa(tho.replace(/<!--[\s\S]*?-->/g, ''))
  const vt = phang.indexOf(cau)
  // Câu chỉ có trong phần bị bỏ (chú thích) → báo "bị che" thay vì "thiếu" để người soạn hiểu vì sao.
  if (vt < 0) return phangHoa(tho).includes(cau) ? 'bi_che' : 'thieu'
  const truoc = phang.slice(0, vt)
  // Đứng trước thông báo KHÔNG được có: thẻ HTML hay chú thích chưa đóng (thông báo có thể nằm trong phần tử ẩn như
  // <span style="display:none">, <details>), định nghĩa tham chiếu Markdown kiểu "[//]: # (" (không hiển thị), ký tự ẩn/đổi
  // hướng chữ. Đây là chặn theo dấu hiệu, KHÔNG phải dựng trang: khi có adapter Website thật phải kiểm trên văn bản đã dựng.
  if (/<[A-Za-z/!?]/.test(truoc) || /\[[^\]\n]*\]:\s*\S+\s*[("'“]{0,2}$/.test(truoc) || KY_TU_AN.test(truoc)) return 'bi_che'
  if (viTri === 'bat_ky') return null
  // Phần đứng trước = tiêu đề. Bỏ dấu "#" của tiêu đề Markdown và tối đa 2 ký tự bao câu ( " “ [ — KHÔNG bỏ vô hạn.
  const tieuDe = truoc.replace(/[(\[“"]{0,2}$/, '').trim().replace(/^#{1,6} +/, '')
  if (tieuDe.length > GIOI_HAN_TRUOC_NHAN || tieuDe.split(/\n{2,}/).filter((x) => x.trim()).length > 1) return 'sai_vi_tri'
  return null
}

/** Câu báo lỗi cho người dùng — dùng chung cho cổng và giao diện. Tách rõ căn cứ pháp lý với quy định của hệ thống. */
export function thongBaoLoiNhanAi(l: LoiNhanAi, nhan: string = NHAN_AI): string {
  if (l === 'thieu') return `Thiếu thông báo AI (Luật 134/2025/QH15 Điều 11 khoản 3: phải thông báo rõ ràng). Thêm đúng câu: "${nhan}"`
  if (l === 'bi_che') return `Thông báo AI đang bị che (nằm trong chú thích/thẻ HTML, định nghĩa tham chiếu Markdown, hoặc sau ký tự ẩn) — NĐ 142/2026/NĐ-CP Điều 18 khoản 3 điểm c: không được che giấu hoặc làm giảm khả năng nhận biết. Đặt câu "${nhan}" thành văn bản hiển thị bình thường.`
  return `Theo quy định xuất bản của hệ thống, thông báo AI đứng ngay sau tiêu đề, trước nội dung — để bảo đảm NĐ 142/2026/NĐ-CP Điều 18 khoản 3 điểm b ("trước hoặc tại thời điểm người tiếp nhận tiếp cận nội dung"). Chuyển câu "${nhan}" lên đầu bài.`
}

/** Có THÔNG BÁO CHUẨN hay chưa (không xét vị trí). */
export function coNhanAi(noiDung: string): boolean {
  return loiNhanAi(noiDung, NHAN_AI, 'bat_ky') === null
}
