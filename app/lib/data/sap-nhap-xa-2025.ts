// Bảng sắp xếp ĐVHC cấp xã tỉnh Quảng Trị (mới) theo Nghị quyết 1680/NQ-UBTVQH15
// ngày 16/6/2025 — hiệu lực 01/7/2025. Gồm 78 đơn vị: 69 xã, 8 phường, 1 đặc khu.
// Dùng để tự động chuyển đổi "Quê quán (trước hợp nhất)" → "Quê quán (sau hợp nhất)".

export type LoaiDonViMoi = 'XA' | 'PHUONG' | 'DAC_KHU'

export type DonViCu = string | { ten: string; huyen: string } // huyen: phân biệt khi trùng tên

export interface DonViSapNhap {
  ten: string            // Tên đơn vị mới (không kèm tiền tố)
  loai: LoaiDonViMoi
  cu: DonViCu[]          // Các xã/phường/thị trấn cũ hợp thành (tên theo NQ 1680)
}

export const SAP_NHAP_XA_2025: DonViSapNhap[] = [
  // ── Khu vực Quảng Bình cũ ──
  { ten: 'Nam Gianh', loai: 'XA', cu: ['Quảng Hòa', 'Quảng Lộc', 'Quảng Văn', 'Quảng Minh'] },
  { ten: 'Nam Ba Đồn', loai: 'XA', cu: ['Quảng Tân', 'Quảng Trung', 'Quảng Tiên', { ten: 'Quảng Sơn', huyen: 'ba đồn' }, 'Quảng Thủy'] },
  { ten: 'Dân Hóa', loai: 'XA', cu: ['Trọng Hóa', 'Dân Hóa'] },
  { ten: 'Kim Điền', loai: 'XA', cu: ['Hóa Sơn', 'Hóa Hợp'] },
  { ten: 'Kim Phú', loai: 'XA', cu: ['Thượng Hóa', 'Trung Hóa', { ten: 'Minh Hóa', huyen: 'minh hóa' }, 'Tân Hóa'] },
  { ten: 'Minh Hóa', loai: 'XA', cu: ['Quy Đạt', 'Xuân Hóa', 'Yên Hóa', 'Hồng Hóa'] },
  { ten: 'Tuyên Lâm', loai: 'XA', cu: ['Lâm Hóa', { ten: 'Thanh Hóa', huyen: 'tuyên hóa' }] },
  { ten: 'Tuyên Sơn', loai: 'XA', cu: ['Thanh Thạch', 'Hương Hóa'] },
  { ten: 'Đồng Lê', loai: 'XA', cu: ['Đồng Lê', 'Kim Hóa', 'Lê Hóa', 'Thuận Hóa', 'Sơn Hóa'] },
  { ten: 'Tuyên Phú', loai: 'XA', cu: ['Đồng Hóa', 'Thạch Hóa', 'Đức Hóa'] },
  { ten: 'Tuyên Bình', loai: 'XA', cu: ['Phong Hóa', 'Ngư Hóa', 'Mai Hóa'] },
  { ten: 'Tuyên Hóa', loai: 'XA', cu: ['Tiến Hóa', 'Châu Hóa', 'Cao Quảng', 'Văn Hóa'] },
  { ten: 'Tân Gianh', loai: 'XA', cu: ['Phù Cảnh', 'Liên Trường', 'Quảng Thanh'] },
  { ten: 'Trung Thuần', loai: 'XA', cu: ['Quảng Lưu', 'Quảng Thạch', 'Quảng Tiến'] },
  { ten: 'Quảng Trạch', loai: 'XA', cu: ['Quảng Phương', 'Quảng Xuân', 'Quảng Hưng'] },
  { ten: 'Hòa Trạch', loai: 'XA', cu: ['Quảng Châu', 'Quảng Tùng', 'Cảnh Dương'] },
  { ten: 'Phú Trạch', loai: 'XA', cu: ['Quảng Đông', 'Quảng Phú', 'Quảng Kim', 'Quảng Hợp'] },
  { ten: 'Thượng Trạch', loai: 'XA', cu: ['Tân Trạch', 'Thượng Trạch'] },
  { ten: 'Phong Nha', loai: 'XA', cu: ['Phong Nha', 'Lâm Trạch', 'Xuân Trạch', 'Phúc Trạch'] },
  { ten: 'Bắc Trạch', loai: 'XA', cu: ['Thanh Trạch', 'Hạ Mỹ', 'Liên Trạch', 'Bắc Trạch'] },
  { ten: 'Đông Trạch', loai: 'XA', cu: [{ ten: 'Hải Phú', huyen: 'bố trạch' }, 'Sơn Lộc', 'Đức Trạch', 'Đồng Trạch'] },
  { ten: 'Hoàn Lão', loai: 'XA', cu: ['Hoàn Lão', 'Trung Trạch', 'Đại Trạch', 'Tây Trạch', { ten: 'Hòa Trạch', huyen: 'bố trạch' }] },
  { ten: 'Bố Trạch', loai: 'XA', cu: ['Hưng Trạch', 'Cự Nẫm', 'Vạn Trạch', 'Phú Định'] },
  { ten: 'Nam Trạch', loai: 'XA', cu: ['Nông trường Việt Trung', 'Việt Trung', 'Nhân Trạch', 'Lý Nam'] },
  { ten: 'Quảng Ninh', loai: 'XA', cu: ['Quán Hàu', 'Vĩnh Ninh', 'Võ Ninh', 'Hàm Ninh'] },
  { ten: 'Ninh Châu', loai: 'XA', cu: ['Tân Ninh', 'Gia Ninh', 'Duy Ninh', 'Hải Ninh'] },
  { ten: 'Trường Ninh', loai: 'XA', cu: ['Vạn Ninh', 'An Ninh', 'Xuân Ninh', 'Hiền Ninh'] },
  { ten: 'Trường Sơn', loai: 'XA', cu: ['Trường Xuân', 'Trường Sơn'] },
  { ten: 'Lệ Thủy', loai: 'XA', cu: ['Kiến Giang', 'Liên Thủy', 'Xuân Thủy', 'An Thủy', 'Phong Thủy', 'Lộc Thủy'] },
  { ten: 'Cam Hồng', loai: 'XA', cu: [{ ten: 'Cam Thủy', huyen: 'lệ thủy' }, 'Thanh Thủy', 'Hồng Thủy', 'Ngư Thủy Bắc'] },
  { ten: 'Sen Ngư', loai: 'XA', cu: ['Hưng Thủy', 'Sen Thủy', 'Ngư Thủy'] },
  { ten: 'Tân Mỹ', loai: 'XA', cu: ['Tân Thủy', 'Dương Thủy', { ten: 'Mỹ Thủy', huyen: 'lệ thủy' }, 'Thái Thủy'] },
  { ten: 'Trường Phú', loai: 'XA', cu: ['Trường Thủy', 'Mai Thủy', 'Phú Thủy'] },
  { ten: 'Lệ Ninh', loai: 'XA', cu: ['Nông trường Lệ Ninh', 'Lệ Ninh', 'Sơn Thủy', 'Hoa Thủy'] },
  { ten: 'Kim Ngân', loai: 'XA', cu: ['Kim Thủy', 'Ngân Thủy', 'Lâm Thủy'] },
  { ten: 'Đồng Hới', loai: 'PHUONG', cu: ['Đức Ninh Đông', 'Đồng Hải', 'Đồng Phú', 'Phú Hải', 'Hải Thành', 'Nam Lý', 'Bảo Ninh', 'Đức Ninh'] },
  { ten: 'Đồng Thuận', loai: 'PHUONG', cu: ['Bắc Lý', 'Lộc Ninh', 'Quang Phú'] },
  { ten: 'Đồng Sơn', loai: 'PHUONG', cu: ['Bắc Nghĩa', 'Đồng Sơn', 'Nghĩa Ninh', 'Thuận Đức'] },
  { ten: 'Ba Đồn', loai: 'PHUONG', cu: ['Quảng Phong', 'Quảng Long', 'Ba Đồn', 'Quảng Hải'] },
  { ten: 'Bắc Gianh', loai: 'PHUONG', cu: ['Quảng Phúc', 'Quảng Thọ', 'Quảng Thuận'] },

  // ── Khu vực Quảng Trị cũ ──
  { ten: 'Vĩnh Linh', loai: 'XA', cu: ['Hồ Xá', 'Vĩnh Long', 'Vĩnh Chấp'] },
  { ten: 'Cửa Tùng', loai: 'XA', cu: ['Cửa Tùng', 'Vĩnh Giang', 'Hiền Thành', 'Kim Thạch'] },
  { ten: 'Vĩnh Hoàng', loai: 'XA', cu: ['Vĩnh Thái', 'Trung Nam', 'Vĩnh Hòa', 'Vĩnh Tú'] },
  { ten: 'Vĩnh Thủy', loai: 'XA', cu: ['Vĩnh Lâm', 'Vĩnh Sơn', 'Vĩnh Thủy'] },
  { ten: 'Bến Quan', loai: 'XA', cu: ['Bến Quan', 'Vĩnh Ô', 'Vĩnh Hà', 'Vĩnh Khê'] },
  { ten: 'Cồn Tiên', loai: 'XA', cu: ['Hải Thái', 'Linh Trường', 'Gio An', 'Gio Sơn'] },
  { ten: 'Cửa Việt', loai: 'XA', cu: ['Cửa Việt', 'Gio Mai', 'Gio Hải'] },
  { ten: 'Gio Linh', loai: 'XA', cu: ['Gio Linh', 'Gio Quang', 'Gio Mỹ', 'Phong Bình'] },
  { ten: 'Bến Hải', loai: 'XA', cu: ['Trung Hải', 'Trung Giang', 'Trung Sơn'] },
  { ten: 'Cam Lộ', loai: 'XA', cu: ['Cam Lộ', 'Cam Thành', 'Cam Chính', 'Cam Nghĩa'] },
  { ten: 'Hiếu Giang', loai: 'XA', cu: [{ ten: 'Cam Thủy', huyen: 'cam lộ' }, 'Cam Hiếu', 'Cam Tuyền', 'Thanh An'] },
  { ten: 'La Lay', loai: 'XA', cu: ['A Bung', 'A Ngo'] },
  { ten: 'Tà Rụt', loai: 'XA', cu: ['A Vao', 'Húc Nghì', 'Tà Rụt'] },
  { ten: 'Đakrông', loai: 'XA', cu: ['Ba Nang', 'Tà Long', 'Đakrông'] },
  { ten: 'Ba Lòng', loai: 'XA', cu: ['Triệu Nguyên', 'Ba Lòng'] },
  { ten: 'Hướng Hiệp', loai: 'XA', cu: ['Krông Klang', 'Mò Ó', 'Hướng Hiệp'] },
  { ten: 'Hướng Lập', loai: 'XA', cu: ['Hướng Việt', 'Hướng Lập'] },
  { ten: 'Hướng Phùng', loai: 'XA', cu: ['Hướng Sơn', 'Hướng Linh', 'Hướng Phùng'] },
  { ten: 'Khe Sanh', loai: 'XA', cu: ['Khe Sanh', 'Tân Hợp', 'Húc', 'Hướng Tân'] },
  { ten: 'Tân Lập', loai: 'XA', cu: ['Tân Liên', 'Hướng Lộc', 'Tân Lập'] },
  { ten: 'Lao Bảo', loai: 'XA', cu: [{ ten: 'Tân Thành', huyen: 'hướng hóa' }, 'Tân Long', 'Lao Bảo'] },
  { ten: 'Lìa', loai: 'XA', cu: ['Thanh', 'Thuận', 'Lìa'] },
  { ten: 'A Dơi', loai: 'XA', cu: ['Ba Tầng', 'Xy', 'A Dơi'] },
  { ten: 'Triệu Phong', loai: 'XA', cu: ['Ái Tử', 'Triệu Thành', 'Triệu Thượng'] },
  { ten: 'Ái Tử', loai: 'XA', cu: ['Triệu Ái', 'Triệu Giang', 'Triệu Long'] },
  { ten: 'Triệu Bình', loai: 'XA', cu: ['Triệu Độ', 'Triệu Thuận', 'Triệu Hòa', 'Triệu Đại'] },
  { ten: 'Triệu Cơ', loai: 'XA', cu: ['Triệu Trung', 'Triệu Tài', 'Triệu Cơ'] },
  { ten: 'Nam Cửa Việt', loai: 'XA', cu: ['Triệu Trạch', 'Triệu Phước', 'Triệu Tân'] },
  { ten: 'Diên Sanh', loai: 'XA', cu: ['Diên Sanh', 'Hải Trường', 'Hải Định'] },
  { ten: 'Mỹ Thủy', loai: 'XA', cu: ['Hải Dương', 'Hải An', 'Hải Khê'] },
  { ten: 'Hải Lăng', loai: 'XA', cu: [{ ten: 'Hải Phú', huyen: 'hải lăng' }, 'Hải Lâm', 'Hải Thượng'] },
  { ten: 'Nam Hải Lăng', loai: 'XA', cu: ['Hải Sơn', 'Hải Phong', 'Hải Chánh'] },
  { ten: 'Vĩnh Định', loai: 'XA', cu: ['Hải Quy', 'Hải Hưng', 'Hải Bình'] },
  { ten: 'Đông Hà', loai: 'PHUONG', cu: [{ ten: 'Phường 1', huyen: 'đông hà' }, { ten: 'Phường 3', huyen: 'đông hà' }, { ten: 'Phường 4', huyen: 'đông hà' }, 'Đông Giang', 'Đông Thanh'] },
  { ten: 'Nam Đông Hà', loai: 'PHUONG', cu: [{ ten: 'Phường 2', huyen: 'đông hà' }, { ten: 'Phường 5', huyen: 'đông hà' }, 'Đông Lễ', 'Đông Lương'] },
  { ten: 'Quảng Trị', loai: 'PHUONG', cu: [{ ten: 'Phường 1', huyen: 'quảng trị' }, { ten: 'Phường 2', huyen: 'quảng trị' }, { ten: 'Phường 3', huyen: 'quảng trị' }, 'An Đôn', 'Hải Lệ'] },
  { ten: 'Cồn Cỏ', loai: 'DAC_KHU', cu: ['Cồn Cỏ'] },
  { ten: 'Tân Thành', loai: 'XA', cu: [{ ten: 'Tân Thành', huyen: 'minh hóa' }] }, // Không sắp xếp
]

// Bí danh: tên xã đã giải thể ở các đợt sáp nhập TRƯỚC (2019-2020, 2024) → tên đơn vị mới 2025.
// Dùng khi hồ sơ ghi quê quán theo tên rất cũ.
export const BI_DANH_XA_CU: { ten: string; huyen?: string; moi: string }[] = [
  // Quảng Bình 2024 (NQ 1242/NQ-UBTVQH15): Hạ Trạch+Mỹ Trạch→Hạ Mỹ; Lý Trạch+Nam Trạch→Lý Nam; Phù Hóa+Cảnh Hóa→Phù Cảnh; Lương Ninh→TT Quán Hàu
  { ten: 'Hạ Trạch', moi: 'Bắc Trạch' },
  { ten: 'Mỹ Trạch', moi: 'Bắc Trạch' },
  { ten: 'Lý Trạch', moi: 'Nam Trạch' },
  { ten: 'Nam Trạch', huyen: 'bố trạch', moi: 'Nam Trạch' },
  { ten: 'Phù Hóa', moi: 'Tân Gianh' },
  { ten: 'Cảnh Hóa', moi: 'Tân Gianh' },
  { ten: 'Lương Ninh', moi: 'Quảng Ninh' },
  // Quảng Bình 2020: Hải Trạch+Phú Trạch→Hải Phú (Bố Trạch); Hoàn Trạch→TT Hoàn Lão; Hải Đình+Đồng Mỹ→Đồng Hải
  { ten: 'Hải Trạch', moi: 'Đông Trạch' },
  { ten: 'Phú Trạch', huyen: 'bố trạch', moi: 'Đông Trạch' },
  { ten: 'Hoàn Trạch', moi: 'Hoàn Lão' },
  { ten: 'Hải Đình', moi: 'Đồng Hới' },
  { ten: 'Đồng Mỹ', moi: 'Đồng Hới' },
  { ten: 'Văn Thủy', moi: 'Trường Phú' },
  // Quảng Trị 2019-2020: Vĩnh Trung+Vĩnh Nam→Trung Nam; Vĩnh Thạch+Vĩnh Kim→Kim Thạch; Vĩnh Tân→TT Cửa Tùng
  { ten: 'Vĩnh Trung', moi: 'Vĩnh Hoàng' },
  { ten: 'Vĩnh Nam', moi: 'Vĩnh Hoàng' },
  { ten: 'Vĩnh Thạch', moi: 'Cửa Tùng' },
  { ten: 'Vĩnh Kim', huyen: 'vĩnh linh', moi: 'Cửa Tùng' },
  { ten: 'Vĩnh Tân', moi: 'Cửa Tùng' },
  // Gio Linh 2019-2024: Gio Việt→TT Cửa Việt; Gio Phong+Gio Bình→Phong Bình; Gio Hòa+Linh Hải→Gio Sơn/Linh Trường
  { ten: 'Gio Việt', moi: 'Cửa Việt' },
  { ten: 'Gio Phong', moi: 'Gio Linh' },
  { ten: 'Gio Bình', moi: 'Gio Linh' },
  { ten: 'Gio Thành', moi: 'Gio Linh' },
  { ten: 'Gio Hòa', moi: 'Cồn Tiên' },
  { ten: 'Linh Hải', moi: 'Cồn Tiên' },
  { ten: 'Vĩnh Trường', moi: 'Cồn Tiên' },
  // Cam Lộ 2020: Cam An+Cam Thanh→Thanh An
  { ten: 'Cam An', moi: 'Hiếu Giang' },
  { ten: 'Cam Thanh', moi: 'Hiếu Giang' },
  // Triệu Phong 2024: Triệu Vân+Triệu An+Triệu Lăng→Triệu Tân; Triệu Sơn→Triệu Cơ (sáp nhập vào Triệu Cơ cũ)
  { ten: 'Triệu Vân', moi: 'Nam Cửa Việt' },
  { ten: 'Triệu An', moi: 'Nam Cửa Việt' },
  { ten: 'Triệu Lăng', moi: 'Nam Cửa Việt' },
  { ten: 'Triệu Sơn', moi: 'Triệu Cơ' },
  // Hải Lăng 2019-2020: Hải Ba+Hải Xuân→Hải Bình; Hải Vĩnh+Hải Thiện(→Hải Hưng/Hải Định); TT Hải Lăng→TT Diên Sanh; Hải Quế+Hải Thiện→Hải Định
  { ten: 'Hải Ba', moi: 'Vĩnh Định' },
  { ten: 'Hải Xuân', moi: 'Vĩnh Định' },
  { ten: 'Hải Vĩnh', moi: 'Vĩnh Định' },
  { ten: 'Hải Quế', moi: 'Diên Sanh' },
  { ten: 'Hải Thiện', moi: 'Diên Sanh' },
  { ten: 'Hải Lăng', huyen: 'hải lăng', moi: 'Diên Sanh' }, // Thị trấn Hải Lăng cũ
  { ten: 'Hải Hòa', moi: 'Nam Hải Lăng' },
  { ten: 'Hải Tân', moi: 'Nam Hải Lăng' },
  // Đakrông 2020: Hải Phúc→Ba Lòng
  { ten: 'Hải Phúc', moi: 'Ba Lòng' },
  // Hướng Hóa 2020: A Xing+A Túc→Lìa
  { ten: 'A Xing', moi: 'Lìa' },
  { ten: 'A Túc', moi: 'Lìa' },
]
