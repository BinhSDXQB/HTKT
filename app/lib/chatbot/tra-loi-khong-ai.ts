/**
 * CHẾ ĐỘ TRẢ LỜI KHÔNG DÙNG AI — dùng khi dịch vụ AI ngừng (hết hạn mức, mất kết nối,
 * chưa cấu hình khoá…). Nhận diện ý định câu hỏi bằng QUY TẮC từ khoá rồi gọi thẳng các
 * hàm tra cứu CSDL sẵn có của chatbot (executeTool), không cần mô hình ngôn ngữ.
 *
 * Chỉ bao các câu hỏi phổ biến, dạng tra cứu (đọc) — KHÔNG bao giờ gọi tool ghi dữ liệu
 * (luu_lanh_dao_xa, cap_nhat_luong_can_bo, them_can_bo) hay tool sinh văn bản.
 * Quyền truy cập vẫn do route kiểm (lọc SO_ONLY_TOOLS với tài khoản phường/xã).
 *
 * Module THUẦN (không truy cập CSDL) để kiểm thử độc lập.
 */

export type YDinh = { tool: string; args: Record<string, string> }

/** Các tool chế độ không-AI được phép gọi — tuyệt đối không có tool ghi. */
export const TOOL_KHONG_AI = new Set([
  'tra_cuu_dvhc', 'tra_cuu_lanh_dao_xa', 'tim_can_bo', 'so_do_to_chuc',
  'sinh_nhat_hom_nay', 'sinh_nhat_thang_nay', 'len_luong_thang_nay', 'luong_cua_toi',
  'tra_cuu_phap_ly_nhan_su', 'tra_cuu_phap_ly_chuyen_nganh', 'tra_cuu_hieu_luc_van_ban',
  'tra_cuu_nghiep_vu_htkt',
])

/**
 * Bỏ dấu tiếng Việt GIỮ NGUYÊN ĐỘ DÀI (mỗi ký tự → đúng 1 ký tự) để vị trí khớp trên chuỗi
 * không dấu dùng lại được để cắt tên riêng từ câu gốc có dấu.
 */
export function boDauGiuViTri(s: string): string {
  let out = ''
  for (const ch of s) {
    if (ch === 'đ') { out += 'd'; continue }
    if (ch === 'Đ') { out += 'D'; continue }
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
    out += base.length === 1 ? base : ch
  }
  return out
}

const DUOI_THUA = /\s*(?:là\s+gì|là\s+bao\s+nhiêu|là\s+ai|là\s+những\s+ai|gồm\s+những\s+ai|thế\s+nào|như\s+thế\s+nào|ra\s+sao|được\s+không|vậy|nhé|ạ|à|nhỉ)\s*$/i

/** Làm gọn phần tên trích ra: bỏ dấu câu, từ thừa cuối câu. */
function gon(s: string): string {
  // Giữ dấu chấm/phẩy nằm giữa hai chữ số ("20.000", "3,5") — là số liệu, không phải dấu câu.
  let r = s.replace(/[?!;:"“”]+|[.,](?!\d)/g, ' ').replace(/\s+/g, ' ').trim()
  for (let i = 0; i < 3; i++) r = r.replace(DUOI_THUA, '').trim()
  return r
}

/** Số tháng từ câu: "tháng 7", "tháng này", "tháng sau/tới", "tháng trước". */
function docThang(k: string, now: Date): { thang: number; nam: number } | null {
  const m = k.match(/\bthang\s+(\d{1,2})\b/)
  if (m) {
    const t = Number(m[1])
    if (t >= 1 && t <= 12) return { thang: t, nam: docNam(k) ?? now.getFullYear() }
  }
  const t0 = now.getMonth() + 1
  const n0 = now.getFullYear()
  if (/\bthang\s+(sau|toi|tiep theo)\b/.test(k)) return t0 === 12 ? { thang: 1, nam: n0 + 1 } : { thang: t0 + 1, nam: n0 }
  if (/\bthang\s+truoc\b/.test(k)) return t0 === 1 ? { thang: 12, nam: n0 - 1 } : { thang: t0 - 1, nam: n0 }
  if (/\bthang\s+nay\b/.test(k)) return { thang: t0, nam: n0 }
  return null
}

function docNam(k: string): number | null {
  const m = k.match(/\bnam\s+(20\d\d)\b/)
  return m ? Number(m[1]) : null
}

/**
 * Tên xã/phường nêu trong câu: "xã Cam Lộ", "phường Ba Đồn", "đặc khu Cồn Cỏ".
 * Trả phần TÊN (cắt từ câu gốc có dấu), dừng ở từ nối/dấu câu.
 */
function docXaPhuong(q: string, k: string): string | null {
  const re = /\b(xa|phuong|dac khu|thi tran)\s+(?!(?:nao|nay|an|phap|thuc|tien|huong|cham|hoi)\b)([a-z0-9][a-z0-9 ]*?)(?=\s+(?:la|co|ma|cua|so|sdt|dien thoai|hien nay|hien tai|gom|ten)\b|[?.!,;:]|$)/
  const m = re.exec(k)
  if (!m) return null
  const batDau = m.index + m[0].length - m[2].length
  const ten = gon(q.slice(batDau, batDau + m[2].length))
  return ten.length >= 2 ? ten : null
}

/** Cắt phần câu gốc NGAY SAU vị trí khớp trên chuỗi không dấu. */
function phanSau(q: string, k: string, re: RegExp): string | null {
  const m = re.exec(k)
  if (!m) return null
  const r = gon(q.slice(m.index + m[0].length))
  return r.length ? r : null
}

// Chủ đề pháp lý nhân sự: [mẫu không dấu, chủ đề truyền cho tool, luôn-là-câu-pháp-lý?]
const CHU_DE_NHAN_SU: Array<[RegExp, string, boolean]> = [
  [/nghi phep|phep nam/, 'nghỉ phép năm', true],
  [/nghi le|nghi tet/, 'nghỉ lễ', true],
  [/viec rieng|ket hon|dam cuoi|nghi cuoi|cuoi vo|cuoi chong|nghi tang|dam tang|chiu tang|tu tran|nghi khong luong/, 'nghỉ việc riêng', true],
  [/sinh con|vo de|vo sinh|thai san/, 'vợ sinh con', true],
  [/con om|cham con/, 'chăm con ốm', true],
  [/vi tri viec lam/, 'vị trí việc làm', false],
  [/luong co so/, 'lương cơ sở', true],
  [/vuot khung/, 'vượt khung', false],
  [/nang luong|nang bac|len luong/, 'nâng lương', false],
  [/nghi huu|ve huu|tuoi huu/, 'nghỉ hưu', false],
  [/hop dong lao dong|hop dong lam viec|nghi dinh 111|nd 111/, 'hợp đồng', false],
  [/ky luat/, 'kỷ luật', false],
  [/danh gia (?:va )?xep loai|xep loai (?:can bo|cong chuc|vien chuc|chat luong)|danh gia (?:can bo|cong chuc|vien chuc)/, 'đánh giá', false],
  [/ke khai tai san|ke khai/, 'kê khai tài sản', false],
]

const HOI_PHAP_LY = /can cu|phap ly|quy dinh|nghi dinh|thong tu|\bluat\b|van ban nao|dieu kien|duoc nghi|may ngay|bao nhieu ngay|bao nhieu nam|bao lau|thu tuc/

/**
 * Nhận diện ý định → danh sách lời gọi tool (thường 1; tra ngược SĐT gọi 2).
 * Trả mảng rỗng nếu không nhận ra — route sẽ trả hướng dẫn cách hỏi.
 */
export function nhanDienYDinh(cauHoi: string, now: Date = new Date()): YDinh[] {
  const q = cauHoi.normalize('NFC').trim()
  const k = boDauGiuViTri(q).toLowerCase()
  const xa = docXaPhuong(q, k)

  // 1. Hiệu lực văn bản có số hiệu: "NĐ 175/2024 còn hiệu lực không"
  const soHieu = q.match(/\b\d{1,4}\/(?:19|20)\d{2}(?:\/[A-Za-zĐđ0-9-]+)?/)
  if (soHieu && /hieu luc|thay the|con ap dung|con dung|bi thay/.test(k)) {
    return [{ tool: 'tra_cuu_hieu_luc_van_ban', args: { so_hieu: soHieu[0] } }]
  }

  // 2. Mã đơn vị hành chính
  if (/\bma\s+(dvhc|don vi hanh chinh|hanh chinh)\b/.test(k) || (xa && /\bma\b/.test(k) && !/\bma so thue\b/.test(k))) {
    const ten = xa ?? phanSau(q, k, /\bma\s+(?:dvhc|don vi hanh chinh|hanh chinh)(?:\s+cua)?\s*/)
    if (ten) return [{ tool: 'tra_cuu_dvhc', args: { ten_don_vi: ten } }]
  }

  // 3. Tra ngược số điện thoại: "số 0913xxxxxx là của ai"
  const soDT = q.replace(/[\s.\-]/g, '').match(/(?:\+?84|0)\d{9}/)
  if (soDT && /cua ai|la ai|ai dung|nguoi nao|so nay/.test(k)) {
    return [
      { tool: 'tim_can_bo', args: { tu_khoa: soDT[0].replace(/^\+?84/, '0') } },
      { tool: 'tra_cuu_lanh_dao_xa', args: { tu_khoa: soDT[0].replace(/^\+?84/, '0') } },
    ]
  }

  // 4. Lãnh đạo xã/phường
  const CHUC_VU: Array<[RegExp, string]> = [
    [/pho truong phong|pho phong/, 'Phó Trưởng phòng'],
    [/truong phong kinh te|truong phong/, 'Trưởng phòng'],
    [/pho chu tich/, 'Phó Chủ tịch'],
    [/chu tich/, 'Chủ tịch'],
    [/pho bi thu/, 'Phó Bí thư'],
    [/bi thu/, 'Bí thư'],
  ]
  if (xa && /lanh dao|chu tich|bi thu|truong phong|pho phong|hdnd|ubnd|dang uy|so dien thoai|sdt|lien he/.test(k)) {
    const cv = CHUC_VU.find(([re]) => re.test(k))?.[1] ?? ''
    return [{ tool: 'tra_cuu_lanh_dao_xa', args: { xa_phuong: xa, tu_khoa: cv } }]
  }

  // 5. Pháp lý nhân sự (đặt TRƯỚC các câu tra dữ liệu lương để "căn cứ nâng lương" không bị hiểu là danh sách)
  const chuDe = CHU_DE_NHAN_SU.find(([re]) => re.test(k))
  if (chuDe && (chuDe[2] || HOI_PHAP_LY.test(k))) {
    return [{ tool: 'tra_cuu_phap_ly_nhan_su', args: { chu_de: chuDe[1] } }]
  }

  // 6. Sinh nhật
  if (/sinh nhat/.test(k)) {
    if (/hom nay/.test(k)) return [{ tool: 'sinh_nhat_hom_nay', args: {} }]
    const t = docThang(k, now)
    return [{ tool: 'sinh_nhat_thang_nay', args: t ? { thang: String(t.thang) } : {} }]
  }

  // 7. Lương/nâng lương
  // "tôi" và "tới" cùng bỏ dấu thành "toi" → phải dò đại từ trên câu GỐC có dấu.
  if (/nang luong|len luong|luong/.test(k) && /(?:^|[\s,])(?:tôi|mình|em)(?=$|[\s?.,!])/i.test(q)) {
    return [{ tool: 'luong_cua_toi', args: {} }]
  }
  if (/nang luong|len luong|den han nang/.test(k)) {
    const quy = k.match(/\bquy\s+([1-4])\b/)?.[1] ?? (/\bquy\s+nay\b/.test(k) ? String(Math.ceil((now.getMonth() + 1) / 3)) : null)
    const nam = docNam(k)
    if (quy) return [{ tool: 'len_luong_thang_nay', args: { quy, ...(nam ? { nam: String(nam) } : {}) } }]
    const t = docThang(k, now)
    return [{ tool: 'len_luong_thang_nay', args: t ? { thang: String(t.thang), nam: String(t.nam) } : {} }]
  }

  // 8. Sơ đồ tổ chức
  if (/so do to chuc|co cau to chuc|cac phong ban|danh sach phong|to chuc bo may/.test(k)) {
    const phong = phanSau(q, k, /\b(?:cua\s+)?phong\s+(?=\S)/)
    return [{ tool: 'so_do_to_chuc', args: phong ? { phong } : {} }]
  }

  // 9. Liên hệ cán bộ Sở: "số điện thoại của Nguyễn Văn A", "email anh B"
  if (/so dien thoai|\bsdt\b|\bemail\b|lien he|lien lac/.test(k)) {
    const ten = phanSau(q, k, /(?:so dien thoai|\bsdt\b|\bemail\b|lien he|lien lac)(?:\s+(?:cua|voi))?(?:\s+(?:anh|chi|ong|ba|dong chi|d\/c))?\s+/)
    if (ten) return [{ tool: 'tim_can_bo', args: { tu_khoa: ten } }]
  }

  // 10. Nghiệp vụ hạ tầng kỹ thuật (quy trình, phân cấp công trình, chiếu sáng thông minh…)
  //    Từ khoá "mạnh" (hỏi quy trình/phân cấp) → luôn là nghiệp vụ; từ khoá lĩnh vực chung
  //    (cây xanh, thoát nước…) kèm "căn cứ/quy định/văn bản nào" thì để mục 11 (danh mục pháp lý).
  const NGHIEP_VU_MANH = /quy trinh|thu tuc|trinh tu|cap may|phan cap|cap cong trinh|thong minh|ha tang ky thuat khung/
  const LINH_VUC_HTKT = /chieu sang|cay xanh|cong vien|nghia trang|thoat nuoc|cap nuoc|ha tang ky thuat/
  if (NGHIEP_VU_MANH.test(k) || (LINH_VUC_HTKT.test(k) && !HOI_PHAP_LY.test(k))) {
    return [{ tool: 'tra_cuu_nghiep_vu_htkt', args: { tu_khoa: gon(q) } }]
  }

  // 11. Căn cứ pháp lý chuyên ngành: "căn cứ pháp lý về thoát nước", "văn bản nào quy định về cây xanh"
  //     Tool so khớp CHUỖI CON → phải rút gọn về đúng cụm lĩnh vực, không truyền cả câu.
  if (HOI_PHAP_LY.test(k)) {
    const tuKhoa = gon(
      (phanSau(q, k, /\b(?:ve|linh vuc)\s+/) ?? q)
        .replace(/căn cứ(?: pháp lý)?|pháp lý|văn bản (?:nào|gì)|theo (?:nghị định|thông tư|luật|văn bản) (?:nào|gì)|(?:nghị định|thông tư|luật) (?:nào|gì)|quy định (?:ở|tại) đâu|được quy định|quy định|hiện hành|mới nhất/gi, ' '),
    )
    if (tuKhoa.length >= 3) return [{ tool: 'tra_cuu_phap_ly_chuyen_nganh', args: { tu_khoa: tuKhoa } }]
  }

  return []
}

/**
 * Kết quả tool viết cho MÔ HÌNH đọc (có câu kiểu "BẮT BUỘC…", "gọi thêm tool…").
 * Khi đưa thẳng cho người dùng thì lược các câu chỉ dẫn đó, giữ nguyên dữ liệu.
 */
export function lamSachChoNguoiDoc(text: string): string {
  const CHI_DAN_MO_HINH = /\btool\b|BẮT BUỘC|TUYỆT ĐỐI|PHẢI nói|PHẢI nêu|PHẢI mở đầu|Nói rõ điều này|nói rõ với người dùng|Trả lời (đúng|ĐÚNG) theo|CHỈ nêu|CHỈ trả lời|KHÔNG được tự|KHÔNG tự|Hãy nói rõ/
  return text
    .split('\n')
    .map((dong) => {
      if (!CHI_DAN_MO_HINH.test(dong)) return dong
      const giu = dong.split(/(?<=[.!?])\s+/).filter((cau) => !CHI_DAN_MO_HINH.test(cau))
      return giu.length ? giu.join(' ') : null
    })
    .filter((d): d is string => d !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Gợi ý cách hỏi khi không nhận ra câu hỏi (theo loại tài khoản). */
export function goiYCauHoi(isWardUser: boolean): string {
  const chung = [
    '• "Mã ĐVHC của phường Ba Đồn"',
    '• "Chủ tịch UBND xã Cam Lộ là ai" · "Lãnh đạo phường Đồng Hới"',
    '• "Quy trình cấp phép chặt hạ cây xanh" · "Nhà máy nước công suất 20.000 m³/ngày cấp mấy"',
    '• "Căn cứ pháp lý về thoát nước" · "Nghị định 175/2024 còn hiệu lực không"',
  ]
  const so = [
    '• "Số điện thoại của Nguyễn Văn A" · "Số 0913xxxxxx là của ai"',
    '• "Sinh nhật tháng này" · "Tháng sau ai lên lương" · "Khi nào tôi nâng lương"',
    '• "Sơ đồ tổ chức" · "Nghỉ phép năm mấy ngày" · "Căn cứ nâng lương thường xuyên"',
  ]
  return (isWardUser ? chung : [...chung, ...so]).join('\n')
}
