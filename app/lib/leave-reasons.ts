/**
 * Gợi ý LÝ DO nghỉ + tóm tắt chế độ theo pháp luật, giúp người làm đơn không bỡ ngỡ.
 *
 * Căn cứ:
 *  - Điều 115 Bộ luật Lao động 2019 (nghỉ việc riêng có/không hưởng lương).
 *  - Điều 53 Luật BHXH 2024 (số 41/2024/QH15, hiệu lực 01/7/2025) — chế độ thai sản
 *    của lao động nam khi vợ sinh con.
 *  - Điều 44 Luật BHXH 2024 — nghỉ chăm con ốm.
 *
 * Dùng được cả client lẫn server (không import db / server-only).
 */

/** Gợi ý điền nhanh vào ô "Lý do" (datalist) — giá trị sạch để lưu thẳng. */
export const LY_DO_SUGGESTIONS: string[] = [
  'Bản thân kết hôn',
  'Con kết hôn',
  'Cha/mẹ (hai bên), vợ/chồng, con từ trần',
  'Ông bà, anh/chị/em ruột từ trần',
  'Chồng nghỉ chăm vợ sinh con',
  'Chăm con ốm',
  'Khám, chữa bệnh',
  'Giải quyết việc riêng của gia đình',
]

/** Tóm tắt chế độ nghỉ theo luật để hiển thị hướng dẫn. */
export type CheDoNghi = { ten: string; soNgay: string; huongLuong: string; canCu: string }

export const CHE_DO_NGHI_PHEP: CheDoNghi[] = [
  { ten: 'Bản thân kết hôn', soNgay: '3 ngày', huongLuong: 'Hưởng lương', canCu: 'Điều 115 khoản 1 điểm a BLLĐ 2019' },
  { ten: 'Con đẻ/con nuôi kết hôn', soNgay: '1 ngày', huongLuong: 'Hưởng lương', canCu: 'Điều 115 khoản 1 điểm b BLLĐ 2019' },
  { ten: 'Cha/mẹ (mình & vợ-chồng), vợ/chồng, con từ trần', soNgay: '3 ngày', huongLuong: 'Hưởng lương', canCu: 'Điều 115 khoản 1 điểm c BLLĐ 2019' },
  { ten: 'Ông bà nội-ngoại, anh/chị/em ruột từ trần; cha/mẹ, anh/chị/em ruột kết hôn', soNgay: '1 ngày', huongLuong: 'KHÔNG lương', canCu: 'Điều 115 khoản 2 BLLĐ 2019' },
  {
    ten: 'Chồng nghỉ chăm vợ sinh con (chồng đang đóng BHXH)',
    soNgay: '5 ngày (thường) · 7 ngày (mổ/sinh non <32 tuần) · 10 ngày (sinh đôi, +3 ngày/con từ con thứ 3) · 14 ngày (sinh đôi trở lên + mổ)',
    huongLuong: 'BHXH chi trả — nghỉ trong 60 ngày đầu kể từ ngày vợ sinh',
    canCu: 'Điều 53 khoản 2 Luật BHXH 2024 (hiệu lực 01/7/2025)',
  },
  { ten: 'Chăm con ốm', soNgay: 'Con <3 tuổi: tối đa 20 ngày/năm · Con 3–<7 tuổi: tối đa 15 ngày/năm (mức hưởng 75%)', huongLuong: 'BHXH chi trả', canCu: 'Điều 44 khoản 1 & Điều 45 khoản 2 Luật BHXH 2024' },
  { ten: 'Nghỉ phép năm', soNgay: '12 ngày + 1 ngày/đủ 5 năm thâm niên (chỉ tính ngày làm việc)', huongLuong: 'Hưởng lương', canCu: 'Điều 113-114 BLLĐ 2019' },
]
