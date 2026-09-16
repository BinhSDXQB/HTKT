// CẤP CÔNG TRÌNH theo Thông tư 34/2026/TT-BXD — hướng dẫn về cấp công trình xây dựng
// phục vụ quản lý hoạt động xây dựng.
//
// ⚠️ NGUỒN: chép TRỰC TIẾP từ bản gốc "34_2026_TT-BXD_Hướng dẫn về cấp công trình xây dựng
// phục vụ quản lý hoạt động xây dựng.docx" trong kho VBPL của Sở (Phụ lục I và Phụ lục II).
// KHÔNG suy diễn, KHÔNG lấy theo trí nhớ. Sửa số liệu ở đây phải mở lại bản gốc đối chiếu.
//
// Hiệu lực: từ 01/7/2026 (Điều 4 khoản 1). Thay thế TT 06/2021/TT-BXD (đã được sửa đổi bởi
// TT 02/2025/TT-BXD) — hết hiệu lực cùng ngày; bãi bỏ Điều 10 TT 09/2025/TT-BXD (Điều 4 khoản 2, 3).
//
// GIỚI HẠN CỦA CÔNG CỤ — đọc kỹ trước khi dùng kết quả:
// - Điều 2 khoản 2: cấp của một công trình độc lập là cấp CAO NHẤT xác định theo CẢ Phụ lục I
//   và Phụ lục II. Công cụ này chỉ tra được tiêu chí đã khai bên dưới, KHÔNG tự xét quy mô kết cấu
//   còn lại ở Phụ lục II → kết quả chỉ là GỢI Ý, cán bộ phải tự đối chiếu nốt.
// - Điều 2 khoản 3: tổ hợp công trình / dây chuyền công nghệ có quy tắc riêng.
// - Điều 2 khoản 4, 5, 6: công trình sửa chữa, cải tạo, nâng cấp, mở rộng và dự án phân kỳ đầu tư
//   có quy tắc riêng.
// Vì vậy mọi chỗ hiển thị kết quả PHẢI ghi rõ đây là gợi ý cần cán bộ xác nhận.

import type { LinhVucKey } from './phap-ly'

export const TT34 = {
  so: '34/2026/TT-BXD',
  ten: 'Thông tư hướng dẫn về cấp công trình xây dựng phục vụ quản lý hoạt động xây dựng',
  hieuLucTu: '01/7/2026',
} as const

/** Thang cấp của TT 34/2026. Lưu ý: có bậc "Đặc biệt", KHÔNG phải chỉ I–IV. */
export type CapCongTrinhTT34 = 'Đặc biệt' | 'I' | 'II' | 'III' | 'IV'

/** Thứ tự từ CAO xuống THẤP — dùng khi Điều 2 yêu cầu lấy cấp cao nhất. */
export const THU_TU_CAP: CapCongTrinhTT34[] = ['Đặc biệt', 'I', 'II', 'III', 'IV']

export function capCaoHon(a: CapCongTrinhTT34, b: CapCongTrinhTT34): CapCongTrinhTT34 {
  return THU_TU_CAP.indexOf(a) <= THU_TU_CAP.indexOf(b) ? a : b
}

/** Một bậc trong bảng phân cấp. `moTa` giữ NGUYÊN văn ô trong bảng để đối chiếu bản gốc. */
export type BacPhanCap = {
  cap: CapCongTrinhTT34
  moTa: string
  khop: (v: number) => boolean
}

export type TieuChiPhanCap = {
  /** Tên tiêu chí, nguyên văn cột "Tiêu chí phân cấp". */
  ten: string
  bac: BacPhanCap[]
}

export type LoaiCongTrinhTT34 = {
  /** Mã mục trong phụ lục, vd "1.3.1.1" — để cán bộ tra ngược bản gốc. */
  ma: string
  ten: string
  linhVuc: LinhVucKey
  phuLuc: 'I' | 'II'
  /** Nhiều tiêu chí ⇒ Điều 2/ghi chú mục yêu cầu lấy cấp CAO NHẤT trong các tiêu chí. */
  tieuChi: TieuChiPhanCap[]
  /** Cấp cố định không phụ thuộc quy mô (vd cơ sở hỏa táng: Cấp II với mọi quy mô). */
  capCoDinh?: CapCongTrinhTT34
  /**
   * Trường hợp phân theo "Mức độ quan trọng" — KHÔNG suy ra được từ con số, người dùng phải CHỌN.
   * Vd nhà tang lễ: Quốc gia → Cấp I, các trường hợp khác → Cấp II.
   * Nếu mục có luaChon mà chưa chọn thì traCapCongTrinh() trả cap = null kèm cảnh báo,
   * TUYỆT ĐỐI không tự mặc định vào trường hợp phổ biến (sẽ nuốt mất cấp cao hơn).
   */
  luaChon?: { nhan: string; cap: CapCongTrinhTT34 }[]
  /** Ghi chú nguyên văn kèm mục — thường là quy tắc hạ cấp / trường hợp đặc biệt. */
  ghiChu?: string[]
}

// Helper dựng bậc cho gọn. Mọi mốc phải khớp NGUYÊN VĂN ô trong bảng.
const tu = (cap: CapCongTrinhTT34, moTa: string, min: number, maxLoaiTru?: number): BacPhanCap => ({
  cap, moTa, khop: (v) => v >= min && (maxLoaiTru === undefined || v < maxLoaiTru),
})
const duoi = (cap: CapCongTrinhTT34, moTa: string, max: number): BacPhanCap => ({
  cap, moTa, khop: (v) => v < max,
})
const lonHon = (cap: CapCongTrinhTT34, moTa: string, min: number, maxBaoGom?: number): BacPhanCap => ({
  cap, moTa, khop: (v) => v > min && (maxBaoGom === undefined || v <= maxBaoGom),
})
const khongQua = (cap: CapCongTrinhTT34, moTa: string, max: number): BacPhanCap => ({
  cap, moTa, khop: (v) => v <= max,
})
const trongTapHop = (cap: CapCongTrinhTT34, moTa: string, gt: number[]): BacPhanCap => ({
  cap, moTa, khop: (v) => gt.includes(v),
})
// Ô ghi dạng "a ÷ b" KHÔNG kèm dấu < hay > là khoảng ĐÓNG cả hai đầu (vd công viên "10 ÷ 20"
// gồm cả 10 và 20). Bậc kề dưới được ghi kèm dấu "<" (vd "5 ÷ <10") nên không chồng lấn.
// Dùng nhầm helper mở đầu dưới sẽ tạo LỖ THỦNG đúng tại mốc — đã bị chính bài kiểm thử bắt.
const khoang = (cap: CapCongTrinhTT34, moTa: string, min: number, max: number): BacPhanCap => ({
  cap, moTa, khop: (v) => v >= min && v <= max,
})

// ───────────────────────────────────────────────────────────────────────────
// PHỤ LỤC I — mục 1.3 Công trình hạ tầng kỹ thuật
// Cột bảng gốc: Đặc biệt | I | II | III | IV
// ───────────────────────────────────────────────────────────────────────────
export const LOAI_CONG_TRINH_TT34: LoaiCongTrinhTT34[] = [
  {
    ma: '1.3.1.1', phuLuc: 'I', linhVuc: 'cap-nuoc',
    ten: 'Nhà máy nước, công trình xử lý nước sạch (bao gồm cả công trình xử lý bùn cặn)',
    tieuChi: [{
      ten: 'TCS (nghìn m³/ngày đêm)',
      bac: [
        tu('Đặc biệt', '≥150', 150),
        tu('I', '30 ÷ <150', 30, 150),
        tu('II', '10 ÷ <30', 10, 30),
        duoi('III', '<10', 10),
      ],
    }],
  },
  {
    ma: '1.3.1.2', phuLuc: 'I', linhVuc: 'cap-nuoc',
    ten: 'Trạm bơm nước thô, nước sạch hoặc tăng áp (bao gồm cả bể chứa nước nếu có)',
    tieuChi: [{
      ten: 'TCS (nghìn m³/ngày đêm)',
      bac: [
        tu('Đặc biệt', '≥180', 180),
        tu('I', '40 ÷ <180', 40, 180),
        tu('II', '12 ÷ <40', 12, 40),
        duoi('III', '<12', 12),
      ],
    }],
  },
  {
    ma: '1.3.2.1', phuLuc: 'I', linhVuc: 'thoat-nuoc',
    ten: 'Hồ điều hòa',
    tieuChi: [{
      ten: 'Diện tích (ha)',
      bac: [
        tu('I', '≥20', 20),
        tu('II', '15 ÷ <20', 15, 20),
        tu('III', '1 ÷ <15', 1, 15),
        duoi('IV', '<1', 1),
      ],
    }],
  },
  {
    ma: '1.3.2.2', phuLuc: 'I', linhVuc: 'thoat-nuoc',
    ten: 'Trạm bơm nước mưa (bao gồm cả bể chứa nước nếu có)',
    tieuChi: [{
      ten: 'TCS (m³/s)',
      bac: [
        tu('I', '≥25', 25),
        tu('II', '10 ÷ <25', 10, 25),
        duoi('III', '<10', 10),
      ],
    }],
  },
  {
    ma: '1.3.2.3', phuLuc: 'I', linhVuc: 'thoat-nuoc',
    ten: 'Công trình, nhà máy xử lý nước thải (bao gồm các công trình trong cùng hệ thống xử lý nước thải)',
    tieuChi: [{
      ten: 'TCS (nghìn m³/ngày đêm)',
      bac: [
        tu('Đặc biệt', '≥100', 100),
        tu('I', '20 ÷ <100', 20, 100),
        tu('II', '10 ÷ <20', 10, 20),
        duoi('III', '<10', 10),
      ],
    }],
  },
  {
    ma: '1.3.2.4', phuLuc: 'I', linhVuc: 'thoat-nuoc',
    ten: 'Trạm bơm nước thải (bao gồm cả bể chứa nước nếu có)',
    tieuChi: [{
      ten: 'TCS (m³/h)',
      bac: [
        tu('Đặc biệt', '≥4.000', 4000),
        tu('I', '1.200 ÷ <4.000', 1200, 4000),
        tu('II', '700 ÷ <1.200', 700, 1200),
        duoi('III', '<700', 700),
      ],
    }],
  },
  {
    ma: '1.3.2.5', phuLuc: 'I', linhVuc: 'thoat-nuoc',
    ten: 'Công trình xử lý bùn',
    tieuChi: [{
      ten: 'TCS (m³/ngày đêm)',
      bac: [
        tu('I', '≥1.000', 1000),
        tu('II', '200 ÷ <1.000', 200, 1000),
        duoi('III', '<200', 200),
      ],
    }],
  },
  {
    ma: '1.3.4', phuLuc: 'I', linhVuc: 'cay-xanh',
    ten: 'Công viên',
    tieuChi: [{
      ten: 'Diện tích (ha)',
      bac: [
        lonHon('I', '>20', 20),
        khoang('II', '10 ÷ 20', 10, 20),
        tu('III', '5 ÷ <10', 5, 10),
        duoi('IV', '<5', 5),
      ],
    }],
  },
  {
    ma: '1.3.5', phuLuc: 'I', linhVuc: 'nghia-trang',
    ten: 'Nghĩa trang',
    ghiChu: ['Nghĩa trang Quốc gia: Cấp I với mọi quy mô.'],
    luaChon: [{ nhan: 'Nghĩa trang Quốc gia (mọi quy mô)', cap: 'I' }],
    tieuChi: [{
      ten: 'Diện tích (ha)',
      bac: [
        lonHon('I', '>60', 60),
        khoang('II', '30 ÷ 60', 30, 60),
        tu('III', '10 ÷ <30', 10, 30),
        duoi('IV', '<10', 10),
      ],
    }],
  },
  {
    ma: '1.3.6', phuLuc: 'I', linhVuc: 'nghia-trang',
    ten: 'Nhà tang lễ',
    ghiChu: ['Tiêu chí: Mức độ quan trọng. Nhà tang lễ Quốc gia: Cấp I; các trường hợp khác: Cấp II.'],
    // KHÔNG dùng capCoDinh: 'II' — đặt cố định II sẽ NUỐT MẤT trường hợp Quốc gia là Cấp I.
    luaChon: [
      { nhan: 'Nhà tang lễ Quốc gia', cap: 'I' },
      { nhan: 'Các trường hợp khác', cap: 'II' },
    ],
    tieuChi: [],
  },
  {
    ma: '1.3.7', phuLuc: 'I', linhVuc: 'nghia-trang',
    ten: 'Cơ sở hỏa táng',
    ghiChu: ['Tiêu chí: Mức độ quan trọng. Cấp II với mọi quy mô.'],
    capCoDinh: 'II',
    tieuChi: [],
  },
  {
    ma: '1.3.8.1', phuLuc: 'I', linhVuc: 'khong-gian-ngam',
    ten: 'Nhà để xe ô tô ngầm',
    tieuChi: [{
      ten: 'Số chỗ để xe ô tô',
      bac: [
        tu('I', '≥500', 500),
        tu('II', '300 ÷ <500', 300, 500),
        duoi('III', '<300', 300),
      ],
    }],
  },
  {
    ma: '1.3.8.2', phuLuc: 'I', linhVuc: 'khong-gian-ngam',
    ten: 'Nhà để xe ô tô nổi',
    tieuChi: [{
      ten: 'Số chỗ để xe ô tô',
      bac: [
        tu('I', '≥1.000', 1000),
        tu('II', '500 ÷ <1.000', 500, 1000),
        tu('III', '100 ÷ <500', 100, 500),
        duoi('IV', '<100', 100),
      ],
    }],
  },
  {
    ma: '1.3.8.3', phuLuc: 'I', linhVuc: 'khong-gian-ngam',
    ten: 'Sân bãi để xe, máy móc, thiết bị (không có mái che)',
    tieuChi: [{
      ten: 'Tổng diện tích (ha)',
      bac: [
        lonHon('III', '>2,5', 2.5),
        khongQua('IV', '≤2,5', 2.5),
      ],
    }],
  },
  {
    ma: '1.3.9', phuLuc: 'I', linhVuc: 'su-dung-chung',
    ten: 'Đường cáp truyền tín hiệu viễn thông',
    ghiChu: ['Tiêu chí: Mức độ quan trọng — không suy ra từ con số, phải chọn phạm vi tuyến.'],
    luaChon: [
      { nhan: 'Liên quốc gia', cap: 'Đặc biệt' },
      { nhan: 'Liên tỉnh', cap: 'I' },
      { nhan: 'Nội tỉnh', cap: 'II' },
    ],
    tieuChi: [],
  },
  {
    ma: '1.4.1.2', phuLuc: 'I', linhVuc: 'giao-thong-do-thi',
    ten: 'Đường đô thị',
    ghiChu: [
      'Xác định cấp công trình theo TẤT CẢ các tiêu chí phân cấp, lấy cấp cao nhất xác định được làm cấp công trình.',
      'Đường đô thị có tổng chiều dài ≤1.000 m: sau khi xác định cấp theo mục này thì HẠ XUỐNG MỘT CẤP nhưng không thấp hơn cấp IV.',
      'Đường đô thị trên cao còn xét quy mô kết cấu tại mục 2.5.1 Bảng 2 Phụ lục II.',
    ],
    tieuChi: [
      {
        ten: 'Số làn xe',
        bac: [
          tu('I', '≥8', 8),
          trongTapHop('II', '6', [6]),
          trongTapHop('III', '2; 4', [2, 4]),
          trongTapHop('IV', '1', [1]),
        ],
      },
      {
        ten: 'Tốc độ thiết kế (km/h)',
        bac: [
          lonHon('Đặc biệt', '>80', 80),
          trongTapHop('I', '80', [80]),
          trongTapHop('II', '60; 50', [60, 50]),
          trongTapHop('III', '40', [40]),
          { cap: 'IV', moTa: '20 ÷ 30', khop: (v) => v >= 20 && v <= 30 },
        ],
      },
    ],
  },
  {
    ma: '1.4.1.3', phuLuc: 'I', linhVuc: 'giao-thong-do-thi',
    ten: 'Nút giao thông (đồng mức, khác mức)',
    tieuChi: [{
      ten: 'Lưu lượng xe thiết kế quy đổi (nghìn xe/ngày đêm)',
      bac: [
        tu('Đặc biệt', '≥30', 30),
        tu('I', '10 ÷ <30', 10, 30),
        tu('II', '3 ÷ <10', 3, 10),
        duoi('III', '<3', 3),
      ],
    }],
  },

  // ─────── PHỤ LỤC II — quy mô kết cấu (dùng cho lĩnh vực KHÔNG có ở Phụ lục I) ───────
  {
    ma: '2.2.2', phuLuc: 'II', linhVuc: 'chieu-sang',
    ten: 'Kết cấu dạng cột, trụ, tháp trong công trình hạ tầng kỹ thuật',
    ghiChu: [
      'Ví dụ nêu trong Thông tư: cột ăng ten, tháp thu phát sóng truyền thanh/truyền hình; cột BTS; CỘT ĐÈN, cột điện trong hệ thống chiếu sáng…',
      'Chiếu sáng đô thị KHÔNG có mục riêng ở Phụ lục I — cấp công trình xác định theo quy mô kết cấu tại mục này.',
    ],
    tieuChi: [{
      ten: 'Chiều cao của kết cấu (m)',
      bac: [
        tu('Đặc biệt', '≥300', 300),
        tu('I', '150 ÷ <300', 150, 300),
        tu('II', '75 ÷ <150', 75, 150),
        { cap: 'III', moTa: '>45 ÷ <75', khop: (v) => v > 45 && v < 75 },
        khongQua('IV', '≤45', 45),
      ],
    }],
  },
  {
    ma: '2.10.1', phuLuc: 'II', linhVuc: 'cap-nuoc',
    ten: 'Đường ống cấp nước (nước thô hoặc nước sạch)',
    ghiChu: [
      'Không áp dụng đối với công trình thủy lợi.',
      'Đường ống/cống có tổng chiều dài ≤1.000 m: sau khi xác định cấp theo mục này thì HẠ XUỐNG MỘT CẤP nhưng không thấp hơn cấp IV (ghi chú chung mục 2.10).',
      'Hai thước đo là HAI CÁCH ĐO CÙNG MỘT TIÊU CHÍ (đường kính trong HOẶC diện tích mặt cắt) — khai một trong hai là đủ.',
    ],
    tieuChi: [
      {
        ten: 'Đường kính trong của ống (mm)',
        bac: [
          tu('I', '≥800', 800),
          tu('II', '400 ÷ <800', 400, 800),
          tu('III', '150 ÷ <400', 150, 400),
          duoi('IV', '<150', 150),
        ],
      },
      {
        ten: 'Diện tích mặt cắt ngang bên trong ống (m²)',
        bac: [
          tu('I', '≥0,51', 0.51),
          tu('II', '0,13 ÷ <0,51', 0.13, 0.51),
          tu('III', '0,02 ÷ <0,13', 0.02, 0.13),
          duoi('IV', '<0,02', 0.02),
        ],
      },
    ],
  },
  {
    ma: '2.10.2', phuLuc: 'II', linhVuc: 'thoat-nuoc',
    ten: 'Đường ống/cống thoát nước mưa, cống chung',
    ghiChu: [
      'Đường ống/cống có tổng chiều dài ≤1.000 m: sau khi xác định cấp theo mục này thì HẠ XUỐNG MỘT CẤP nhưng không thấp hơn cấp IV (ghi chú chung mục 2.10).',
      'Hai thước đo là HAI CÁCH ĐO CÙNG MỘT TIÊU CHÍ — khai một trong hai là đủ.',
    ],
    tieuChi: [
      {
        ten: 'Đường kính trong của ống (mm)',
        bac: [
          tu('I', '≥2.000', 2000),
          tu('II', '1.500 ÷ <2.000', 1500, 2000),
          tu('III', '600 ÷ <1.500', 600, 1500),
          duoi('IV', '<600', 600),
        ],
      },
      {
        ten: 'Diện tích mặt cắt ngang bên trong ống (m²)',
        bac: [
          tu('I', '≥3,14', 3.14),
          tu('II', '1,77 ÷ <3,14', 1.77, 3.14),
          tu('III', '0,28 ÷ <1,77', 0.28, 1.77),
          duoi('IV', '<0,28', 0.28),
        ],
      },
    ],
  },
  {
    ma: '2.10.3', phuLuc: 'II', linhVuc: 'thoat-nuoc',
    ten: 'Đường ống/cống thoát nước thải',
    ghiChu: [
      'Đường ống/cống có tổng chiều dài ≤1.000 m: sau khi xác định cấp theo mục này thì HẠ XUỐNG MỘT CẤP nhưng không thấp hơn cấp IV (ghi chú chung mục 2.10).',
      'Hai thước đo là HAI CÁCH ĐO CÙNG MỘT TIÊU CHÍ — khai một trong hai là đủ.',
    ],
    tieuChi: [
      {
        ten: 'Đường kính trong của ống (mm)',
        bac: [
          tu('I', '≥1.000', 1000),
          tu('II', '600 ÷ <1.000', 600, 1000),
          tu('III', '200 ÷ <600', 200, 600),
          duoi('IV', '<200', 200),
        ],
      },
      {
        ten: 'Diện tích mặt cắt ngang bên trong ống (m²)',
        bac: [
          tu('I', '≥0,79', 0.79),
          tu('II', '0,28 ÷ <0,79', 0.28, 0.79),
          tu('III', '0,03 ÷ <0,28', 0.03, 0.28),
          duoi('IV', '<0,03', 0.03),
        ],
      },
    ],
  },
  {
    ma: '2.10.4.a', phuLuc: 'II', linhVuc: 'su-dung-chung',
    ten: 'Hào kỹ thuật, cống cáp',
    ghiChu: ['Cống cáp, hào, tuy nen tổng chiều dài ≤1.000 m: sau khi xác định cấp theo mục này thì HẠ XUỐNG MỘT CẤP nhưng không thấp hơn cấp IV.'],
    tieuChi: [{
      ten: 'Bề rộng thông thủy (m)',
      bac: [
        lonHon('III', '>0,7', 0.7),
        khongQua('IV', '≤0,7', 0.7),
      ],
    }],
  },
  {
    ma: '2.10.4.b', phuLuc: 'II', linhVuc: 'su-dung-chung',
    ten: 'Tuy nen kỹ thuật',
    ghiChu: [
      'Cống cáp, hào, tuy nen tổng chiều dài ≤1.000 m: sau khi xác định cấp theo mục này thì HẠ XUỐNG MỘT CẤP nhưng không thấp hơn cấp IV.',
      'Hầm dạng tuy nen kỹ thuật trong các nhà máy không lớn hơn cấp I.',
    ],
    tieuChi: [{
      ten: 'Bề rộng thông thủy (m)',
      bac: [
        lonHon('Đặc biệt', '>7', 7),
        lonHon('I', '>3 ÷ 7', 3, 7),
        khongQua('II', '≤3', 3),
      ],
    }],
  },
]

export function getLoaiTheoLinhVuc(linhVuc: LinhVucKey): LoaiCongTrinhTT34[] {
  return LOAI_CONG_TRINH_TT34.filter((l) => l.linhVuc === linhVuc)
}

export function getLoaiTheoMa(ma: string): LoaiCongTrinhTT34 | undefined {
  return LOAI_CONG_TRINH_TT34.find((l) => l.ma === ma)
}

export type KetQuaTraCap = {
  cap: CapCongTrinhTT34 | null
  /** Từng tiêu chí khớp bậc nào — để cán bộ thấy đường đi của kết luận. */
  chiTiet: { tieuChi: string; cap: CapCongTrinhTT34 | null; moTa: string | null; giaTri: number | null }[]
  canCu: string
  canhBao: string[]
}

/**
 * Tra cấp công trình theo một mục của TT 34/2026.
 *
 * `giaTri` khai theo TỪNG tiêu chí (khoá = tên tiêu chí). Tiêu chí nào không có số thì bỏ qua.
 * Nhiều tiêu chí ⇒ lấy cấp CAO NHẤT (Điều 2 khoản 2 và ghi chú của mục).
 *
 * LUÔN trả kèm cảnh báo: đây là gợi ý theo đúng một mục đã khai, KHÔNG phải kết luận cuối cùng.
 */
export function traCapCongTrinh(
  ma: string,
  giaTri: Record<string, number | null | undefined>,
  /** Nhãn trường hợp đã chọn, khi mục phân theo "Mức độ quan trọng" (xem `luaChon`). */
  luaChonNhan?: string,
): KetQuaTraCap | null {
  const loai = getLoaiTheoMa(ma)
  if (!loai) return null

  const canCu = `TT ${TT34.so} — Phụ lục ${loai.phuLuc}, mục ${loai.ma} (${loai.ten})`
  const canhBao: string[] = [
    'Kết quả chỉ là GỢI Ý theo đúng mục đã tra, cán bộ phải tự đối chiếu bản gốc trước khi dùng.',
    'Điều 2 khoản 2: cấp công trình là cấp CAO NHẤT xác định theo CẢ Phụ lục I và Phụ lục II — công cụ chưa xét hết quy mô kết cấu ở Phụ lục II.',
  ]
  if (loai.ghiChu?.length) canhBao.push(...loai.ghiChu)

  if (loai.capCoDinh) {
    return { cap: loai.capCoDinh, chiTiet: [], canCu, canhBao }
  }

  // Trường hợp phân theo "Mức độ quan trọng": phải do người dùng CHỌN, không suy từ số.
  let capTuLuaChon: CapCongTrinhTT34 | null = null
  if (loai.luaChon?.length) {
    const chon = luaChonNhan ? loai.luaChon.find((x) => x.nhan === luaChonNhan) : undefined
    if (chon) {
      capTuLuaChon = chon.cap
    } else {
      canhBao.push(
        `Mục này phân theo trường hợp, PHẢI chọn một trong: ${loai.luaChon.map((x) => `${x.nhan} → cấp ${x.cap}`).join('; ')}.`,
      )
    }
  }

  const chiTiet = loai.tieuChi.map((tc) => {
    const v = giaTri[tc.ten]
    if (v === null || v === undefined || Number.isNaN(v)) {
      return { tieuChi: tc.ten, cap: null, moTa: null, giaTri: null }
    }
    const bac = tc.bac.find((b) => b.khop(v))
    return { tieuChi: tc.ten, cap: bac?.cap ?? null, moTa: bac?.moTa ?? null, giaTri: v }
  })

  const capDaXacDinh = chiTiet.map((c) => c.cap).filter((c): c is CapCongTrinhTT34 => c !== null)
  if (capTuLuaChon) capDaXacDinh.push(capTuLuaChon)
  // Điều 2 khoản 2 + ghi chú mục: lấy cấp CAO NHẤT trong các căn cứ xác định được.
  const cap = capDaXacDinh.length ? capDaXacDinh.reduce(capCaoHon) : null

  if (chiTiet.some((c) => c.cap === null && c.giaTri !== null)) {
    canhBao.push('Có tiêu chí nhập số nhưng KHÔNG rơi vào bậc nào của bảng — kiểm tra lại đơn vị tính và bản gốc.')
  }
  if (loai.tieuChi.length > 1 && capDaXacDinh.length < loai.tieuChi.length) {
    canhBao.push('Mục này yêu cầu xét TẤT CẢ tiêu chí rồi lấy cấp cao nhất; hiện còn tiêu chí chưa khai số.')
  }

  return { cap, chiTiet, canCu, canhBao }
}
