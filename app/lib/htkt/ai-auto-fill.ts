// AI auto-fill logic: Smart-fill form soạn thảo VBPL dựa trên quy mô công trình + lĩnh vực
// Dùng OpenAI API để sinh nội dung tờ trình, công văn từ template + dữ liệu nhập

import type { LinhVucKey } from './phap-ly'
import { getHuongDan, smartFillTuQuyMo } from './huong-dan-soan-thao'
import { NHOM_CONG_TRINH, QUY_MO_LINH_VUC } from './ke-hoach-kiem-tra'

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
  capCongTrinh: 'I' | 'II' | 'III' | 'IV'
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
  const coBanFill = smartFillTuQuyMo(data.linhVuc, data.quyMo)

  // 2. Lấy hướng dẫn soạn thảo
  const hdKey = data.thamDinhType === 'bcnckt' ? 'to-trinh-bcnckt' : 'cong-van-lay-y-kien'
  const hd = getHuongDan(hdKey)

  // 3. Lấy thông tin quy mô công trình
  const nhomCT = NHOM_CONG_TRINH.find(
    (n) => n.linhVuc === data.linhVuc && n.cap === data.capCongTrinh
  )
  const quyMoLV = QUY_MO_LINH_VUC.find((q) => q.linhVuc === data.linhVuc)

  // 4. Sinh hoàn cảnh dự án chi tiết
  const hoanCanhDuAn = `Dự án: ${data.tenDuAn}
Chủ đầu tư: ${data.tenChuDauTu}
Địa điểm: ${data.diaDiem}
Loại công trình: ${data.loaiCongTrinh} (Cấp ${data.capCongTrinh} theo TT 34/2026)
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
  const { thamDinhType, linhVuc, capCongTrinh } = data

  const noiDungBase = {
    bcnckt: `1. Quy hoạch & tiêu chí thiết kế cơ sở
   - Tuân thủ quy hoạch đô thị, quy hoạch ${linhVuc} hiện tại
   - Thiết kế cơ sở phù hợp QCVN 07 chuyên ngành
   - Công nghệ phù hợp với điều kiện địa phương

2. Tổng mức đầu tư & Dự toán (NĐ 206/2026)
   - Định mức xây dựng (TT 36/38/2026)
   - Chi phí lắp đặt HTKT (TT 38/2026 Phụ lục 3)
   - Tiêu chuẩn xác định TMĐT

3. Năng lực nhà thầu (NĐ 212/2026)
   - Chứng chỉ hành nghề xây dựng
   - Kinh nghiệm thực hiện công trình tương tự
   - Năng lực tài chính`,

    bcktkt: `1. Thiết kế BVTC chi tiết
   - Thiết kế theo QCVN 07 chuyên ngành
   - Phương pháp thi công, tiến độ
   - Yêu cầu an toàn lao động

2. Dự toán chi tiết (NĐ 206/2026)
   - Định mức chi phí (TT 37/2026)
   - Đơn giá vật liệu, nhân công
   - Phí quản lý dự án, lợi nhuận`,

    'thiet-ke': `1. Tuân thủ quy chuẩn kỹ thuật
   - QCVN 07 về HTKT chuyên ngành
   - Tiêu chí thiết kế an toàn, bền vững
   - Phương án xử lý rủi ro

2. Dự toán thiết kế triển khai (NĐ 206/2026)
   - Định mức lắp đặt (TT 37/2026)
   - Đơn giá cập nhật thị trường`,

    'nghiem-thu': `1. Kiểm tra tuân thủ thiết kế
   - Khối lượng công việc, chất lượng thi công
   - Tuân thủ quy chuẩn QCVN 07
   - Kết quả kiểm nghiệm chất lượng vật liệu

2. Kiểm tra đấu nối (nếu liên quan)
   - Đấu nối với hạ tầng công cộng
   - Cấp phép từ cơ quan liên quan (nếu cần)

3. An toàn công trình & vận hành
   - Đánh giá an toàn theo TT 33/2026
   - Tài liệu bàn giao vận hành (hướng dẫn, bảo trì)`,
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
- Kiểm tra QCVN 07-1:2016/BXD (công trình cấp nước)
- Kiểm tra QCVN 01-1:2024/BYT (chất lượng nước sinh hoạt)
- Yêu cầu chứng chỉ năng lực xử lý nước`,

    'thoat-nuoc': `⚠️ Thoát nước & XLNT:
- Kiểm tra QCVN 07-2:2016/BXD (công trình thoát nước)
- Kiểm tra QCVN 14:2008/BTNMT (nước thải sinh hoạt)
- Phương án xử lý bùn thải, tái sử dụng nước`,

    'cay-xanh': `⚠️ Cây xanh (NĐ 258/2025 mới):
- Kiểm tra QCVN 07-4:2016/BXD (công trình cây xanh)
- Ghi chú: Tuân thủ NĐ 258/2025, không NĐ 64/2010
- Danh mục cây trồng phù hợp khí hậu địa phương`,

    'chieu-sang': `⚠️ Chiếu sáng (BẮT BUỘC lấy ý Sở Công Thương):
- Kiểm tra QCVN 07-3:2016/BXD (công trình chiếu sáng)
- BẮT BUỘC: Gửi công văn lấy ý kiến Sở Công Thương
- Yêu cầu phê duyệt phương án đấu nối điện`,

    'nghia-trang': `⚠️ Nghĩa trang (NĐ 23/2016):
- Kiểm tra QCVN 07-5:2016/BXD (công trình nghĩa trang)
- Yêu cầu ủy quyền Sở LĐ-TBXH (ngoài Sở XD)
- Phương án hỏa táng, xử lý chất thải`,

    'giao-thong-do-thi': `⚠️ Giao thông đô thị (Luật 35/2024 mới):
- Kiểm tra QCVN 01:2021/BXD (yêu cầu quy hoạch)
- Tuân thủ Luật Đường bộ 35/2024/QH15 (từ 01/01/2025)
- Phương án thoát nước đường phố, chiếu sáng`,

    'khong-gian-ngam': `⚠️ Không gian ngầm (NĐ 39/2010 + NĐ 217/2026):
- Kiểm tra QCVN 08:2009/BXD (công trình ngầm)
- Lưu ý: NĐ 175/2024 đã bị thay bởi NĐ 217/2026
- Dùng NĐ 217/2026 làm căn cứ chuyển tiếp (Điều 10)`,

    'su-dung-chung': `⚠️ Sử dụng chung (NĐ 72/2012):
- Kiểm tra QCVN 07-9:2016/BXD (cọng trình hào/tuy-nen)
- Lập thỏa thuận sử dụng chung (TT 03/2013/TT-BXD)
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
${kq.loaiVanBan} (Thẩm quyền: ${kq.thamQuyen}, Thời hạn: ${kq.thoiHan} ngày)

【NỘI DUNG THẨM ĐỊNH】
${kq.noiDungThanhDinh}

【CĂN CỨ PHÁP LÝ】
${kq.canCuChiay.join('\n')}

【GHI CHÚ THÊM】
${kq.ghiChuThemDo}

【HƯỚNG DẪN】
- Soạn thảo chi tiết, không nêu chung chung
- Ghi rõ quy mô công trình (cấp I/II/III/IV, công suất/diện tích cụ thể)
- Tham chiếu đầy đủ các VBPL trên (số/năm/NĐ/TT)
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

  // Predict cấp dựa trên từ khóa quy mô
  let capDuKien: 'I' | 'II' | 'III' | 'IV' | null = null
  if (/lớn|quốc gia|chính|I|cấp I|trọng điểm/gi.test(text)) capDuKien = 'I'
  else if (/trung bình|II|cấp II|tỉnh|huyện lớn/gi.test(text)) capDuKien = 'II'
  else if (/nhỏ|III|cấp III|phường|tiểu quy mô/gi.test(text)) capDuKien = 'III'
  else if (/IV|cấp IV|rất nhỏ|hộ dân/gi.test(text)) capDuKien = 'IV'

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
