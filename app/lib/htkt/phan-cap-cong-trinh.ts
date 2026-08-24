// PHÂN CẤP CÔNG TRÌNH HẠ TẦNG KỸ THUẬT — tiêu chí kỹ thuật để xác định thẩm quyền.
//
// NGUỒN: Thông tư 34/2026/TT-BXD ngày 25/6/2026 của Bộ Xây dựng quy định chi tiết về cấp
// công trình xây dựng (hiệu lực 01/7/2026, thay Thông tư 06/2021/TT-BXD).
//   • Phụ lục I — Bảng 1.3 "Phân cấp công trình cung cấp cơ sở, tiện ích hạ tầng kỹ thuật".
//   • Phụ lục II — Bảng 2 mục 2.2.2 "Kết cấu dạng cột, trụ, tháp trong công trình hạ tầng
//     kỹ thuật" (cột đèn, cột điện trong hệ thống chiếu sáng).
//
// Số liệu bóc trực tiếp từ BẢNG trong bản .docx gốc (giữ nguyên cột), không gõ lại từ trí nhớ.
// Đối chiếu ngày 24/8/2026.
//
// LƯU Ý ÁP DỤNG (Thông tư 34/2026/TT-BXD, Điều 2):
//   - Khoản 2: cấp của một công trình độc lập là CẤP CAO NHẤT xác định theo cả Phụ lục I và
//     Phụ lục II. Không có trong Phụ lục I thì xác định theo Phụ lục II và ngược lại.
//   - Khoản 7 / Điều 3 khoản 6: ví dụ áp dụng nằm ở Phụ lục III của Thông tư.
//   - Điều 3 khoản 1: cấp công trình là cơ sở xác định THẨM QUYỀN thẩm định báo cáo nghiên
//     cứu khả thi, cho ý kiến, cấp phép, kiểm tra nghiệm thu…

export type CapCongTrinh = 'Đặc biệt' | 'I' | 'II' | 'III' | 'IV'

/** Một dòng phân cấp: 5 ô tương ứng cột Đặc biệt · I · II · III · IV. `null` = bảng để trống. */
export type DongPhanCap = {
  ma: string                 // số hiệu mục trong bảng, ví dụ '1.3.1.1'
  ten: string
  tieuChi: string            // đơn vị đo dùng để phân cấp
  o: [string | null, string | null, string | null, string | null, string | null]
  ghiChu?: string
}

export type NhomPhanCap = {
  ma: string
  ten: string
  linhVuc: string            // lĩnh vực HTKT tương ứng (để lọc trên giao diện)
  dong: DongPhanCap[]
}

import { xepHang } from './tim-kiem'

export const CAP_LABELS: CapCongTrinh[] = ['Đặc biệt', 'I', 'II', 'III', 'IV']

// ── Phụ lục I — Bảng 1.3: công trình hạ tầng kỹ thuật ────────────────────────
export const BANG_1_3: NhomPhanCap[] = [
  {
    ma: '1.3.1',
    ten: 'Công trình cấp nước',
    linhVuc: 'cap-nuoc',
    dong: [
      {
        ma: '1.3.1.1',
        ten: 'Nhà máy nước, công trình xử lý nước sạch (bao gồm cả công trình xử lý bùn cặn)',
        tieuChi: 'Tổng công suất (nghìn m³/ngày đêm)',
        o: ['≥150', '30 ÷ <150', '10 ÷ <30', '<10', null],
      },
      {
        ma: '1.3.1.2',
        ten: 'Trạm bơm nước thô, nước sạch hoặc tăng áp (bao gồm cả bể chứa nước nếu có)',
        tieuChi: 'Tổng công suất (nghìn m³/ngày đêm)',
        o: ['≥180', '40 ÷ <180', '12 ÷ <40', '<12', null],
      },
    ],
  },
  {
    ma: '1.3.2',
    ten: 'Công trình thoát nước',
    linhVuc: 'thoat-nuoc',
    dong: [
      { ma: '1.3.2.1', ten: 'Hồ điều hoà', tieuChi: 'Diện tích (ha)', o: [null, '≥20', '15 ÷ <20', '1 ÷ <15', '<1'] },
      {
        ma: '1.3.2.2',
        ten: 'Trạm bơm nước mưa (bao gồm cả bể chứa nước nếu có)',
        tieuChi: 'Tổng công suất (m³/s)',
        o: [null, '≥25', '10 ÷ <25', '<10', null],
      },
      {
        ma: '1.3.2.3',
        ten: 'Công trình, nhà máy xử lý nước thải (gồm các công trình trong cùng hệ thống xử lý nước thải)',
        tieuChi: 'Tổng công suất (nghìn m³/ngày đêm)',
        o: ['≥100', '20 ÷ <100', '10 ÷ <20', '<10', null],
      },
      {
        ma: '1.3.2.4',
        ten: 'Trạm bơm nước thải (bao gồm cả bể chứa nước nếu có)',
        tieuChi: 'Tổng công suất (m³/h)',
        o: ['≥4.000', '1.200 ÷ <4.000', '700 ÷ <1.200', '<700', null],
      },
      { ma: '1.3.2.5', ten: 'Công trình xử lý bùn', tieuChi: 'Tổng công suất (m³/ngày đêm)', o: [null, '≥1.000', '200 ÷ <1.000', '<200', null] },
    ],
  },
  {
    ma: '1.3.3',
    ten: 'Công trình xử lý chất thải rắn (CTR)',
    linhVuc: 'thoat-nuoc',
    dong: [
      { ma: '1.3.3.1.a', ten: 'Cơ sở xử lý CTR thông thường — Trạm trung chuyển', tieuChi: 'Tổng công suất (tấn/ngày đêm)', o: [null, '≥500', '200 ÷ <500', '100 ÷ <200', '<100'] },
      {
        ma: '1.3.3.1.b', ten: 'Cơ sở xử lý CTR thông thường — Cơ sở xử lý CTR', tieuChi: 'Tổng công suất (tấn/ngày đêm)',
        o: ['≥500', '200 ÷ <500', '50 ÷ <200', '<50', null],
        ghiChu: 'Trong bảng gốc, dòng này BẮT ĐẦU ở cột “Đặc biệt” còn dòng trạm trung chuyển (1.3.3.1.a) bắt đầu ở cột I — khác nhau thật, không phải lỗi bóc dữ liệu. Trường hợp sát ngưỡng nên mở lại Phụ lục I Thông tư 34/2026/TT-BXD để đối chiếu.',
      },
      { ma: '1.3.3.2', ten: 'Cơ sở xử lý CTR nguy hại', tieuChi: 'Tổng công suất (tấn/ngày đêm)', o: [null, '>100', '20 ÷ 100', '<20', null] },
    ],
  },
  {
    ma: '1.3.4',
    ten: 'Công viên',
    linhVuc: 'cay-xanh',
    dong: [{ ma: '1.3.4', ten: 'Công viên', tieuChi: 'Diện tích (ha)', o: [null, '>20', '10 ÷ 20', '5 ÷ <10', '<5'] }],
  },
  {
    ma: '1.3.5',
    ten: 'Nghĩa trang, nhà tang lễ, cơ sở hoả táng',
    linhVuc: 'nghia-trang',
    dong: [
      {
        ma: '1.3.5',
        ten: 'Nghĩa trang',
        tieuChi: 'Diện tích (ha)',
        o: [null, '>60', '30 ÷ 60', '10 ÷ <30', '<10'],
        ghiChu: 'Nghĩa trang Quốc gia: cấp I với mọi quy mô.',
      },
      {
        ma: '1.3.6', ten: 'Nhà tang lễ', tieuChi: 'Mức độ quan trọng',
        o: [null, 'Nhà tang lễ Quốc gia', 'Các trường hợp khác', null, null],
        ghiChu: 'Nguyên văn ô gộp trong bảng: “Nhà tang lễ Quốc gia: Cấp I; các trường hợp khác: Cấp II”.',
      },
      {
        ma: '1.3.7', ten: 'Cơ sở hoả táng', tieuChi: 'Mức độ quan trọng',
        o: [null, null, 'Mọi quy mô', null, null],
        ghiChu: 'Nguyên văn ô gộp trong bảng: “Cấp II với mọi quy mô”.',
      },
    ],
  },
  {
    ma: '1.3.8',
    ten: 'Nhà để xe ô tô; sân bãi để xe, máy móc, thiết bị',
    linhVuc: 'giao-thong-do-thi',
    dong: [
      { ma: '1.3.8.1', ten: 'Nhà để xe ô tô ngầm', tieuChi: 'Số chỗ để xe ô tô', o: [null, '≥500', '300 ÷ <500', '<300', null] },
      { ma: '1.3.8.2', ten: 'Nhà để xe ô tô nổi', tieuChi: 'Số chỗ để xe ô tô', o: [null, '≥1.000', '500 ÷ <1.000', '100 ÷ <500', '<100'] },
      { ma: '1.3.8.3', ten: 'Sân bãi để xe, máy móc, thiết bị (không có mái che)', tieuChi: 'Tổng diện tích (ha)', o: [null, null, null, '>2,5', '≤2,5'] },
    ],
  },
  {
    ma: '1.3.9',
    ten: 'Đường cáp truyền tín hiệu viễn thông',
    linhVuc: 'su-dung-chung',
    dong: [{ ma: '1.3.9', ten: 'Đường cáp truyền tín hiệu viễn thông', tieuChi: 'Mức độ quan trọng', o: ['Liên quốc gia', 'Liên tỉnh', 'Nội tỉnh', null, null] }],
  },
  {
    ma: '1.3.10',
    ten: 'Công trình lấn biển',
    linhVuc: 'giao-thong-do-thi',
    dong: [{ ma: '1.3.10', ten: 'Công trình lấn biển', tieuChi: 'Diện tích (ha)', o: [null, null, '≥300', '<300', null] }],
  },
]

export const GHI_CHU_BANG_1_3: string[] = [
  'Công trình HTKT khác có mục đích sử dụng phù hợp với loại công trình nêu trong Bảng 1.3 thì dùng chính Bảng 1.3 để xác định cấp theo mức độ quan trọng hoặc quy mô công suất.',
  'TCS là Tổng công suất tính cho toàn bộ các dây chuyền công nghệ thuộc dự án.',
  'Với nhà để xe ô tô: chỗ để xe được xét cho ô tô chở người đến 9 chỗ hoặc ô tô tải dưới 3.500 kg. Nhà để xe hỗn hợp thì quy đổi 6 chỗ xe mô tô (xe gắn máy) tương đương 1 chỗ ô tô.',
  'Ví dụ xác định cấp công trình HTKT xem Phụ lục III Thông tư 34/2026/TT-BXD.',
]

// ── Phụ lục II — Bảng 2 mục 2.2.2: cột đèn, cột điện chiếu sáng ──────────────
export const KET_CAU_COT_HTKT: DongPhanCap = {
  ma: '2.2.2',
  ten: 'Kết cấu dạng cột, trụ, tháp trong công trình hạ tầng kỹ thuật (cột ăng ten; tháp thu phát sóng truyền thanh/truyền hình; cột BTS; CỘT ĐÈN, CỘT ĐIỆN trong hệ thống chiếu sáng…)',
  tieuChi: 'Chiều cao của kết cấu (m)',
  o: ['≥300', '150 ÷ <300', '75 ÷ <150', '>45 ÷ <75', '≤45'],
  ghiChu:
    'Đây là đường duy nhất trong Thông tư 34/2026/TT-BXD phân cấp cho hạng mục chiếu sáng: Bảng 1.3 (Phụ lục I) KHÔNG có dòng riêng cho hệ thống chiếu sáng đô thị. Với cột đèn chiếu sáng thông thường (chiều cao ≤45 m) thì cấp công trình là cấp IV theo tiêu chí kết cấu.',
}

// ── Điểm cần nhớ khi áp dụng ────────────────────────────────────────────────
export const LUU_Y_AP_DUNG: { noiDung: string; canCu: string }[] = [
  {
    noiDung: 'Cấp của một công trình độc lập là CẤP CAO NHẤT xác định theo cả Phụ lục I và Phụ lục II. Không có trong Phụ lục I thì xác định theo Phụ lục II và ngược lại.',
    canCu: 'TT 34/2026/TT-BXD, Điều 2 khoản 2',
  },
  {
    noiDung: 'Tổ hợp công trình / dây chuyền công nghệ nhiều hạng mục: nếu có trong Phụ lục I thì xác định theo Phụ lục I; nếu không thì lấy theo cấp của công trình chính.',
    canCu: 'TT 34/2026/TT-BXD, Điều 2 khoản 3',
  },
  {
    noiDung: 'Cấp công trình là cơ sở xác định thẩm quyền thẩm định báo cáo nghiên cứu khả thi, cho ý kiến, cấp phép xây dựng, kiểm tra công tác nghiệm thu.',
    canCu: 'TT 34/2026/TT-BXD, Điều 3 khoản 1',
  },
  {
    noiDung: 'Sửa chữa, bảo trì công trình mà KHÔNG làm thay đổi kết cấu chịu lực thì không áp dụng cấp công trình xác định theo Thông tư này.',
    canCu: 'TT 34/2026/TT-BXD, Điều 3 khoản 5',
  },
  {
    noiDung: 'Thông tư 34/2026/TT-BXD có hiệu lực từ 01/7/2026 và thay thế Thông tư 06/2021/TT-BXD. Hồ sơ nộp từ 01/7/2026 phải dùng bảng phân cấp mới.',
    canCu: 'TT 34/2026/TT-BXD, Điều 4',
  },
]

export const CAN_CU_MODULE = [
  'Thông tư 34/2026/TT-BXD ngày 25/6/2026 của Bộ trưởng Bộ Xây dựng quy định chi tiết về cấp công trình xây dựng (hiệu lực 01/7/2026, thay Thông tư 06/2021/TT-BXD)',
]

// ── Truy vấn ────────────────────────────────────────────────────────────────
export function nhomTheoLinhVuc(linhVuc: string): NhomPhanCap[] {
  return BANG_1_3.filter((n) => n.linhVuc === linhVuc)
}

export function timPhanCap(tuKhoa: string): { nhom: NhomPhanCap; dong: DongPhanCap }[] {
  const k = tuKhoa.trim()
  if (!k) return []
  const tatCa = BANG_1_3.flatMap((nhom) => nhom.dong.map((dong) => ({ nhom, dong })))
  const kq = xepHang(tatCa, k, (x) => `${x.nhom.ten} ${x.dong.ten} ${x.dong.ma} ${x.dong.tieuChi}`, 1)
  // Chiếu sáng không có dòng riêng ở Bảng 1.3 — chỉ có ở Phụ lục II mục 2.2.2 (kết cấu cột).
  if (['chiếu sáng', 'cột đèn', 'cột điện', 'chieu sang', 'cot den'].some((t) => k.toLowerCase().includes(t))) {
    kq.push({ nhom: { ma: '2.2', ten: 'Phụ lục II — Quy mô kết cấu', linhVuc: 'chieu-sang', dong: [KET_CAU_COT_HTKT] }, dong: KET_CAU_COT_HTKT })
  }
  return kq
}

/** Diễn giải một dòng thành text đọc được (dùng cho chatbot và xuất văn bản). */
export function moTaDongPhanCap(dong: DongPhanCap): string {
  const phan = CAP_LABELS.map((cap, i) => (dong.o[i] ? `cấp ${cap}: ${dong.o[i]}` : null)).filter(Boolean)
  return `${dong.ma} ${dong.ten} — tiêu chí ${dong.tieuChi}; ${phan.join(' · ')}${dong.ghiChu ? `. Ghi chú: ${dong.ghiChu}` : ''}`
}
