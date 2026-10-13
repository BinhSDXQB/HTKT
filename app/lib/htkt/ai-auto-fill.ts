// AI auto-fill logic: Smart-fill form soạn thảo VBPL dựa trên quy mô công trình + lĩnh vực
// Dùng OpenAI API để sinh nội dung tờ trình, công văn từ template + dữ liệu nhập

import type { LinhVucKey } from './phap-ly'
import { getHuongDan, smartFillTuQuyMo } from './huong-dan-soan-thao'

export type QuyMoCongTrinh = 'A' | 'B' | 'C'

export type FormSoanThaoData = {
  linhVuc: LinhVucKey
  quyMo: QuyMoCongTrinh
  thamDinhType: 'bcnckt' | 'bcktkt' | 'thiet-ke' | 'nghiem-thu'
  tenDuAn: string
  tenChuDauTu: string
  diaDiem: string
  quyMoCT: string // vd "Công suất 50.000 m³/ngày"
  loaiCongTrinh: string
  // Thang cấp của TT 34/2026 có 5 bậc — bậc "Đặc biệt" cao hơn cấp I, KHÔNG được bỏ.
  capCongTrinh: 'Đặc biệt' | 'I' | 'II' | 'III' | 'IV'
}

export type KetQuaAutoFill = {
  loaiVanBan: string
  thamQuyen: string
  thoiHan: string
  canCuChiay: string[]
  hoanCanhDuAn: string
  noiDungThanhDinh: string
  ghiChuThemDo: string
  templateSketon: string
}

/**
 * Smart-fill form data từ lĩnh vực + quy mô công trình
 * - Xác định loại VB (chấp thuận/yêu cầu bổ sung/không chấp thuận)
 * - Lấy hướng dẫn soạn thảo chi tiết
 * - Sinh hoàn cảnh dự án + nội dung thẩm định
 * - Trả về kết quả fill dữ liệu
 */
export function autoFillTuQuyMo(data: FormSoanThaoData): KetQuaAutoFill {
  // 1. Smart-fill cơ bản từ quy mô
  const coBanFill = smartFillTuQuyMo(data.linhVuc, data.quyMo, data.capCongTrinh, data.thamDinhType)

  // 2. Lấy hướng dẫn soạn thảo
  const hdKey = data.thamDinhType === 'bcnckt' ? 'to-trinh-bcnckt' : 'cong-van-lay-y-kien'
  const hd = getHuongDan(hdKey)

  // 3. CHƯA LÀM: trước đây có tra NHOM_CONG_TRINH (theo lĩnh vực + cấp) và QUY_MO_LINH_VUC
  // rồi BỎ KHÔNG DÙNG — kết quả auto-fill không hề phản ánh phân nhóm/quy mô công trình.
  // Đã gỡ phần tra cứu chết đó. Việc có đưa phân nhóm/quy mô vào thẩm quyền, nội dung thẩm định
  // hay ghi chú hay không là quyết định NGHIỆP VỤ, phải do cán bộ chuyên môn chốt căn cứ pháp lý,
  // không tự suy diễn ở đây.

  // 4. Sinh hoàn cảnh dự án chi tiết
  const hoanCanhDuAn = `Dự án: ${data.tenDuAn}
Chủ đầu tư: ${data.tenChuDauTu}
Địa điểm: ${data.diaDiem}
Loại công trình: ${data.loaiCongTrinh} (Cấp ${data.capCongTrinh} theo TT 34/2026)
Nhóm dự án: ${data.quyMo} (theo Luật Đầu tư công)
Quy mô: ${data.quyMoCT}
Thẩm quyền: ${coBanFill.thamQuyen}`

  // 5. Sinh nội dung thẩm định dựa trên loại thẩm định
  const noiDungThanhDinh = generateNoiDungThanhDinh(data)

  // 6. Ghi chú thêm độ dựa trên lĩnh vực
  const ghiChuThemDo = generateGhiChuThemDo(data)

  // 7. Template skeleton
  const templateSketon = hd?.templateChiDan || ''

  return {
    loaiVanBan: coBanFill.loaiVanBan,
    thamQuyen: coBanFill.thamQuyen,
    thoiHan: coBanFill.thoiHan,
    canCuChiay: hd?.canCuChiay || [],
    hoanCanhDuAn,
    noiDungThanhDinh,
    ghiChuThemDo,
    templateSketon,
  }
}

/**
 * Sinh nội dung thẩm định chi tiết dựa trên loại thẩm định + lĩnh vực
 */
function generateNoiDungThanhDinh(data: FormSoanThaoData): string {
  const { thamDinhType, linhVuc } = data

  const noiDungBase = {
    // 4 nhóm nội dung thẩm định của cơ quan chuyên môn — Đ27 k4 Luật 135/2025, Đ38 NĐ 217/2026.
    bcnckt: `1. Phù hợp với quy hoạch làm căn cứ lập dự án (Đ26, Đ38 k1 NĐ 217)
   - Xác định đúng loại quy hoạch căn cứ (1 trong 9 trường hợp Đ26 k1) — ${linhVuc}
2. Khả năng kết nối hạ tầng kỹ thuật khu vực (Đ38 k2)
   - Danh mục văn bản thỏa thuận, hướng dẫn kết nối HTKT bên ngoài dự án
3. Quy chuẩn, tiêu chuẩn, an toàn xây dựng, PCCC (Đ38 k3, k4)
   - QCVN 07:2023/BXD (+ Sửa đổi 1:2025), QCVN 01:2021/BXD; báo cáo kết quả thẩm tra nếu thuộc Đ26 k5 Luật 135
   - Thẩm định thiết kế PCCC tích hợp nếu thuộc Phụ lục III NĐ 105 (sửa bởi NĐ 347/2026)
4. Quản lý chi phí — chỉ dự án đầu tư công, PPP (Đ7 k5 NĐ 206/2026)
   - Hồ sơ, căn cứ pháp lý xác định TMĐT; đủ khoản mục và phương pháp xác định; yêu cầu hoàn thiện
(Năng lực: chỉ tra cứu mã số chứng chỉ hành nghề; không yêu cầu chứng chỉ năng lực tổ chức — Đ41 NĐ 212/2026)`,

    bcktkt: `Lưu ý: dự án chỉ lập BCKTKT KHÔNG thẩm định tại cơ quan chuyên môn (Đ27 k2 Luật 135); chỉ thẩm định khi được người quyết định đầu tư giao (Đ31 k3 NĐ 217).
1. Nội dung theo Đ26 k3 Luật 135 (đầu tư công) hoặc k4 (đầu tư kinh doanh)
2. Thiết kế bản vẽ thi công: an toàn công trình, công trình lân cận, giải pháp PCCC (Đ26 k3 điểm h)
3. Phù hợp quy hoạch làm cơ sở lập dự án (Đ31 k6 điểm đ NĐ 217)
4. Dự toán theo NĐ 206/2026, TT 36/2026, TT 37/2026`,

    'thiet-ke': `Lưu ý: từ 01/7/2026 CHỦ ĐẦU TƯ thẩm định thiết kế triển khai sau khi dự án được phê duyệt (Đ29 k1 Luật 135, Đ41 NĐ 217).
1. Nội dung chủ đầu tư thẩm định: Đ30 k1 Luật 135 (đầu tư công) / Đ41 k2 NĐ 217 (PPP, đầu tư kinh doanh)
2. Sở chỉ: góp ý khi được mời (Đ41 k3) hoặc thẩm định dự toán hạng mục vốn đầu tư công của dự án PPP (Đ41 k2 điểm b)
3. Báo cáo kết quả thẩm tra theo Mẫu số 11 nếu công trình thuộc Đ26 k5 Luật 135`,

    'nghiem-thu': `Kiểm tra công tác nghiệm thu (Đ27 NĐ 207/2026) — chỉ công trình thuộc Phụ lục IV NĐ 217:
1. Sự tuân thủ quy định quản lý chất lượng, an toàn của chủ đầu tư và nhà thầu từ khởi công đến nghiệm thu
   - Nghiệm thu lắp đặt, chạy thử thiết bị; không kiểm tra dây chuyền, thiết bị công nghệ
2. Điều kiện nghiệm thu hoàn thành công trình (báo cáo hoàn thành theo Phụ lục VI NĐ 207)
3. Kết quả: thông báo theo Phụ lục VIII NĐ 207 — chấp thuận/không chấp thuận kết quả nghiệm thu, tồn tại cần khắc phục
(Thủ tục kiểm tra nghiệm thu PCCC của Công an đã bị bãi bỏ — NĐ 347/2026)`,
  }

  return noiDungBase[thamDinhType] || ''
}

/**
 * Sinh ghi chú thêm độ dựa trên lĩnh vực
 */
function generateGhiChuThemDo(data: FormSoanThaoData): string {
  const { linhVuc } = data

  const ghiChuMap: Record<LinhVucKey, string> = {
    'cap-nuoc': `⚠️ Cấp nước:
- QCVN 07:2023/BXD phần cấp nước (+ Sửa đổi 1:2025 về dung tích bể chứa nước sạch)
- QCVN 01-1:2024/BYT (chất lượng nước sạch sinh hoạt) — đối chiếu hiệu lực
- Nhóm dự án: cấp thoát nước thuộc nhóm A từ 3.000 tỷ (Đ9 k3 Luật Đầu tư công)`,

    'thoat-nuoc': `⚠️ Thoát nước & XLNT:
- QCVN 07:2023/BXD phần thoát nước
- QCVN 14:2025/BTNMT (nước thải sinh hoạt, đô thị — thay QCVN 14:2008, hiệu lực 01/9/2025)
- Phương án xử lý bùn thải, điểm xả, tái sử dụng nước`,

    'cay-xanh': `⚠️ Công viên, cây xanh (NĐ 258/2025 — đã bãi bỏ NĐ 64/2010):
- Chỉ tiêu cây xanh theo QCVN 01:2021/BXD (QCVN 07:2023 không có phần cây xanh)
- Không yêu cầu chứng chỉ hành nghề đối với công viên cây xanh (Đ27 k3 NĐ 212/2026)
- Danh mục cây trồng phù hợp khí hậu địa phương`,

    'chieu-sang': `⚠️ Chiếu sáng công cộng (dự án HTKT do Sở Xây dựng thẩm định — Phụ lục III, Đ73 k5 NĐ 217):
- QCVN 07:2023/BXD phần chiếu sáng
- Không có quy định bắt buộc lấy ý kiến Sở Công Thương; chỉ hỏi khi có hạng mục công trình năng lượng (đường dây, trạm biến áp)
- Không yêu cầu chứng chỉ hành nghề đối với chiếu sáng công cộng (Đ27 k3 NĐ 212/2026)`,

    'nghia-trang': `⚠️ Nghĩa trang, cơ sở hỏa táng (NĐ 23/2016):
- QCVN 07:2023/BXD phần nghĩa trang, cơ sở hỏa táng, nhà tang lễ
- Cơ sở hỏa táng: cấp II với mọi quy mô (TT 34/2026) → thuộc Phụ lục IV NĐ 217, phải thẩm tra thiết kế
- Phương án xử lý chất thải, khoảng cách an toàn môi trường`,

    'giao-thong-do-thi': `⚠️ Giao thông đô thị (Luật Đường bộ 35/2024):
- QCVN 07:2023/BXD phần giao thông; QCVN 01:2021/BXD
- BẮT BUỘC thẩm tra, thẩm định an toàn giao thông ngay giai đoạn lập dự án (Đ29 Luật Đường bộ; NĐ 165/2024 Đ32–34 sửa bởi NĐ 241/2026)
- Cầu trong đô thị từ cấp II: thi tuyển phương án kiến trúc (Đ17 Luật Kiến trúc); cầu nhịp ≥ 350 m thuộc Phụ lục IX NĐ 207`,

    'khong-gian-ngam': `⚠️ Không gian ngầm (NĐ 39/2010, đã được sửa đổi — đối chiếu văn bản hợp nhất):
- QCVN 08:2018/BXD (công trình tàu điện ngầm); QCVN 07:2023/BXD phần hào và tuy nen kỹ thuật
- Hầm đường ô tô, đường sắt dài từ 1.000 m thuộc diện thẩm định thiết kế PCCC (mục 14 Phụ lục III NĐ 105)
- NĐ 175/2024 hết hiệu lực từ 01/7/2026; chuyển tiếp theo Đ76 NĐ 217/2026`,

    'su-dung-chung': `⚠️ Sử dụng chung (NĐ 72/2012):
- QCVN 07:2023/BXD phần hào và tuy nen kỹ thuật
- Lập thỏa thuận sử dụng chung (TT 03/2013/TT-BXD — đối chiếu hiệu lực)
- Xác định phí thuê, trách nhiệm bảo trì`,
  }

  return ghiChuMap[linhVuc] || ''
}

/**
 * Generate prompt cho OpenAI để sinh tờ trình/công văn chi tiết
 * (Dùng khi có OpenAI API key)
 */
export function generateOpenAIPrompt(data: FormSoanThaoData, kq: KetQuaAutoFill): string {
  return `Bạn là chuyên gia soạn thảo VBPL Xây dựng tại Sở Xây dựng Quảng Trị.

Hãy soạn thảo một "${data.thamDinhType === 'bcnckt' ? 'TỜ TRÌNH' : 'CÔNG VĂN'}" chi tiết dựa trên thông tin sau:

【THÔNG TIN DỰ ÁN】
${kq.hoanCanhDuAn}

【LOẠI THẨM ĐỊNH】
${kq.loaiVanBan} (Thẩm quyền: ${kq.thamQuyen}; Thời hạn: ${kq.thoiHan})

【NỘI DUNG THẨM ĐỊNH】
${kq.noiDungThanhDinh}

【CĂN CỨ PHÁP LÝ】
${kq.canCuChiay.join('\n')}

【GHI CHÚ THÊM】
${kq.ghiChuThemDo}

【HƯỚNG DẪN】
- Soạn thảo chi tiết, không nêu chung chung
- Ghi rõ quy mô công trình (cấp I/II/III/IV, công suất/diện tích cụ thể)
- Tham chiếu đầy đủ các VBPL trên (số/năm/NĐ/TT); KHÔNG tự thêm số điều, khoản không có ở trên; không viện dẫn NĐ 15/2021, NĐ 175/2024, QCVN 07:2016, QCVN 10:2014
- Kết luận thẩm định chỉ được nêu khi đã có kết quả thẩm định; nếu chưa có thì để trống "…"
- Phong cách: Chính thức, chuẩn mực hành chính Việt Nam
- Dùng template sau làm khung:

${kq.templateSketon}

Hãy soạn thảo văn bản hoàn chỉnh, thay thế "..." bằng nội dung cụ thể dựa trên thông tin trên.`
}

/**
 * Smart predict: Dự đoán loại công trình từ tên + mô tả
 * (Dùng khi user nhập tên dự án không rõ loại)
 */
export function smartPredictLoaiCongTrinh(tenDuAn: string, moTa: string): {
  linhVuc: LinhVucKey | null
  loaiCongTrinh: string
  capDuKien: 'I' | 'II' | 'III' | 'IV' | null
} {
  const text = (tenDuAn + ' ' + moTa).toLowerCase()

  // Pattern matching để detect lĩnh vực
  const patterns: Record<LinhVucKey, RegExp[]> = {
    'cap-nuoc': [/nước sạch|cấp nước|nhà máy nước|mạng phân phối nước/gi],
    'thoat-nuoc': [/thoát nước|xử lý nước thải|bãi thải|hệ thống thoát|XLNT/gi],
    'cay-xanh': [/cây xanh|công viên|trồng cây|tổ hợp xanh/gi],
    'chieu-sang': [/chiếu sáng|đèn đường|hệ thống chiếu sáng|ánh sáng công cộng/gi],
    'nghia-trang': [/nghĩa trang|hỏa táng|cơ sở hỏa|tang lễ/gi],
    'giao-thong-do-thi': [/đường phố|đường đô thị|cầu đô thị|vỉa hè|lề đường/gi],
    'khong-gian-ngam': [/bãi đỗ ngầm|không gian ngầm|tuy-nen kỹ thuật|hầm bộ hành/gi],
    'su-dung-chung': [/cột dùng chung|cột đa năng|hạ tầng dùng chung|cống bể cáp/gi],
  }

  let detectedLinhVuc: LinhVucKey | null = null
  for (const [linhVuc, patterns_array] of Object.entries(patterns)) {
    for (const pattern of patterns_array) {
      if (pattern.test(text)) {
        detectedLinhVuc = linhVuc as LinhVucKey
        break
      }
    }
    if (detectedLinhVuc) break
  }

  // Predict cấp dựa trên từ khóa quy mô.
  // LƯU Ý: KHÔNG match chữ La Mã trần (I/II/III/IV) vì với cờ /i chúng dính mọi chữ "i"
  // thường trong tên dự án ("cải tạo", "tái định cư"...) → luôn ra Cấp I sai.
  // Chỉ nhận "cấp <số La Mã>" có ngữ cảnh; xét từ cụ thể (IV/III/II) trước rồi mới tới I.
  // c[ấâa]p để chấp cả tên không dấu ("cap iii"); vẫn bắt buộc có số La Mã theo sau.
  // Chốt đuôi bằng (?![\p{L}\d]) + cờ u, KHÔNG dùng \b: \b chỉ hiểu chữ ASCII nên "cấp IVđường"
  // vẫn lọt (đ không phải \w). Lookahead này chặn cả chữ có dấu lẫn "IIIA", "IVB".
  let capDuKien: 'I' | 'II' | 'III' | 'IV' | null = null
  if (/c[ấâa]p\s*iv(?![\p{L}\d])|rất nhỏ|hộ dân/iu.test(text)) capDuKien = 'IV'
  else if (/c[ấâa]p\s*iii(?![\p{L}\d])|tiểu quy mô/iu.test(text)) capDuKien = 'III'
  else if (/c[ấâa]p\s*ii(?![\p{L}\d])|trung bình|huyện lớn/iu.test(text)) capDuKien = 'II'
  else if (/c[ấâa]p\s*i(?![\p{L}\d])|quốc gia|trọng điểm|quy mô lớn/iu.test(text)) capDuKien = 'I'

  return {
    linhVuc: detectedLinhVuc,
    loaiCongTrinh: detectLoaiCongTrinh(tenDuAn, detectedLinhVuc),
    capDuKien,
  }
}

/**
 * Helper: Detect loại công trình cụ thể (vd "Nhà máy nước", "Mạng phân phối")
 */
function detectLoaiCongTrinh(tenDuAn: string, linhVuc: LinhVucKey | null): string {
  if (!linhVuc) return ''

  const patterns: Record<LinhVucKey, Record<string, RegExp>> = {
    'cap-nuoc': {
      'Nhà máy nước': /nhà máy nước|NM nước/gi,
      'Mạng phân phối': /mạng phân phối|phân phối nước/gi,
      'Trạm bơm': /trạm bơm|bơm nước/gi,
    },
    'thoat-nuoc': {
      'Hệ thống thoát nước': /hệ thống thoát|mạng thoát/gi,
      'Nhà máy XLNT': /nhà máy|XLNT|xử lý nước thải/gi,
    },
    'cay-xanh': {
      'Công viên': /công viên/gi,
      'Trồng cây đường phố': /trồng cây|cây đường/gi,
    },
    'chieu-sang': {
      'Hệ thống chiếu sáng': /chiếu sáng|đèn/gi,
    },
    'nghia-trang': {
      'Nghĩa trang': /nghĩa trang/gi,
      'Cơ sở hỏa táng': /hỏa táng|hỏa thiêu/gi,
    },
    'giao-thong-do-thi': {
      'Đường phố': /đường phố|đường đô thị/gi,
      'Cầu': /cầu|dầm/gi,
    },
    'khong-gian-ngam': {
      'Bãi đỗ ngầm': /bãi đỗ|ngầm/gi,
    },
    'su-dung-chung': {
      'Cột dùng chung': /cột dùng|cột đa năng/gi,
    },
  }

  const typePatterns = patterns[linhVuc]
  if (!typePatterns) return ''

  for (const [loai, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(tenDuAn)) return loai
  }

  return ''
}
