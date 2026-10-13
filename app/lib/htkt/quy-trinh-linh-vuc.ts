// QUY TRÌNH QUẢN LÝ NHÀ NƯỚC THEO TỪNG LĨNH VỰC HẠ TẦNG KỸ THUẬT.
//
// Khác với lib/htkt/tham-dinh.ts (quy trình THẨM ĐỊNH dự án, dùng chung mọi lĩnh vực),
// tệp này mô tả các quy trình QUẢN LÝ – VẬN HÀNH – CẤP PHÉP đặc thù của từng lĩnh vực.
//
// NGUYÊN TẮC BIÊN SOẠN: mỗi bước, mỗi mốc thời gian, mỗi loại giấy tờ đều phải chỉ ra
// được ĐIỀU – KHOẢN của văn bản gốc đã đối chiếu. Không có căn cứ thì không viết ra,
// mà ghi vào CHUA_DU_CAN_CU ở cuối tệp.
//
// Nguồn đã đối chiếu bản gốc ngày 24/8/2026 (thư mục văn bản của Sở):
//   • Nghị định 258/2025/NĐ-CP ngày 09/10/2025 về quản lý công viên, cây xanh, mặt nước.
//   • Thông tư 12/2024/TT-BXD ngày 18/12/2024 hướng dẫn phương pháp xác định và quản lý
//     chi phí dịch vụ sự nghiệp công chiếu sáng đô thị, cây xanh đô thị
//     (hiệu lực 15/02/2025; bãi bỏ Thông tư 14/2017/TT-BXD).
//   • Nghị định 269/2025/NĐ-CP ngày 14/10/2025 về phát triển đô thị thông minh.
//   • Nghị định 178/2026/NĐ-CP ngày 20/5/2026 quy định việc quản lý, sử dụng và khai thác
//     tài sản kết cấu hạ tầng do Nhà nước đầu tư, quản lý (Điều 1 khoản 1 có TÀI SẢN KẾT CẤU
//     HẠ TẦNG ĐÔ THỊ). ⚠️ Điều 1 khoản 2 điểm đ LOẠI TRỪ tài sản KCHT giao thông (đường bộ...),
//     cấp nước sạch, công viên, cây xanh — các loại này theo NĐ riêng (44/2024, 43/2022, 258/2025).
//     Vì vậy 2 quy trình khung NĐ 178 KHÔNG gắn vào lĩnh vực cấp nước, cây xanh, giao thông đô thị
//     (rà soát 13/10/2026; bản trước gắn cho cả 8 lĩnh vực là sai).

import type { LinhVucKey } from './phap-ly'
import { xepHang } from './tim-kiem'

export type BuocQuyTrinh = {
  buoc: number
  ten: string
  noiDung: string
  trachNhiem?: string
  thoiHan?: string
  canCu?: string        // điều, khoản cụ thể
}

export type QuyTrinhLinhVuc = {
  key: string
  linhVuc: LinhVucKey[]
  ten: string
  loai: 'Thủ tục hành chính' | 'Quản lý, vận hành' | 'Lập & phê duyệt' | 'Báo cáo, dữ liệu' | 'Chi phí, định mức'
  moTa: string
  apDung: string
  hoSo?: { ten: string; soLuong?: string }[]
  buoc: BuocQuyTrinh[]
  thoiHan?: string[]
  ketQua: string
  canCu: string[]
  luuY?: string[]
  /** true = quy trình KHUNG áp dụng cho mọi lĩnh vực, không phải quy trình chuyên ngành của riêng lĩnh vực nào. */
  apDungMoiLinhVuc?: boolean
}

// ═══════════════ CÔNG VIÊN – CÂY XANH ═══════════════

const CAP_PHEP_CHAT_HA: QuyTrinhLinhVuc = {
  key: 'cap-phep-chat-ha-cay-xanh',
  linhVuc: ['cay-xanh'],
  ten: 'Cấp giấy phép chặt hạ, dịch chuyển cây xanh',
  loai: 'Thủ tục hành chính',
  moTa:
    'Thủ tục cấp giấy phép chặt hạ, dịch chuyển cây xanh do cơ quan được UBND cấp tỉnh phân cấp thực hiện (cơ quan chuyên môn về công viên, cây xanh cấp tỉnh hoặc UBND cấp xã).',
  apDung:
    'Bắt buộc có giấy phép với: (a) cây xanh thuộc danh mục cây xanh cần bảo tồn không thuộc trường hợp miễn; (b) cây xanh sử dụng công cộng là cây bóng mát không thuộc trường hợp miễn. (Điều 27 khoản 3)',
  hoSo: [
    { ten: 'Đơn đề nghị cấp giấy phép chặt hạ, dịch chuyển cây xanh theo Mẫu số 01 Phụ lục I Nghị định 258/2025/NĐ-CP', soLuong: '01 bản chính' },
    { ten: 'Ảnh chụp hiện trạng cây xanh cần chặt hạ, dịch chuyển', soLuong: '01 bản sao' },
    { ten: 'Các tài liệu khác có liên quan đến cây xanh cần chặt hạ, dịch chuyển (nếu có)', soLuong: '01 bản sao' },
  ],
  buoc: [
    {
      buoc: 1,
      ten: 'Kiểm tra điều kiện chặt hạ, dịch chuyển',
      noiDung:
        'Đối chiếu 6 điều kiện: cây đã chết/đổ gãy; cây có nguy cơ gây nguy hiểm; cây ăn quả có khả năng rơi rụng và cây tạo mùi ảnh hưởng sức khoẻ, môi trường; cây trong khu vực thực hiện dự án đầu tư xây dựng; cây ảnh hưởng khả năng giao thông của cộng đồng; cây phải chặt hạ theo pháp luật về đường bộ, đường sắt, điện lực.',
      trachNhiem: 'Cơ quan được phân cấp',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 1',
    },
    {
      buoc: 2,
      ten: 'Xác định có thuộc trường hợp MIỄN giấy phép không',
      noiDung:
        'Miễn giấy phép khi: (a) cây có nguy cơ đổ gãy trong trường hợp khẩn cấp do thiên tai; (b) cây đã chết, đã bị đổ gãy; (c) cây nằm trong kế hoạch chặt hạ, dịch chuyển đã được cơ quan có thẩm quyền phê duyệt; (d) cây trong khu vực dự án đầu tư xây dựng ĐÃ thoả thuận phương án chặt hạ, dịch chuyển với cơ quan có thẩm quyền ở giai đoạn chuẩn bị dự án.',
      trachNhiem: 'Cơ quan được phân cấp',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 2',
    },
    {
      buoc: 3,
      ten: 'Tiếp nhận hồ sơ',
      noiDung: 'Tổ chức, cá nhân lập 01 bộ hồ sơ gửi cơ quan quản lý nhà nước có thẩm quyền theo phân cấp của UBND cấp tỉnh.',
      trachNhiem: 'Tổ chức, cá nhân đề nghị',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 5 điểm a',
    },
    {
      buoc: 4,
      ten: 'Xem xét, cấp giấy phép',
      noiDung:
        'Cấp giấy phép theo Mẫu số 02 Phụ lục I Nghị định 258/2025/NĐ-CP, hoặc thông báo kết quả giải quyết nếu cây không đủ điều kiện chặt hạ, dịch chuyển.',
      trachNhiem: 'Cơ quan được phân cấp',
      thoiHan: '20 ngày làm việc (có cây thuộc danh mục cần bảo tồn) · 10 ngày làm việc (các trường hợp khác), kể từ ngày nhận đủ hồ sơ',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 5 điểm b',
    },
    {
      buoc: 5,
      ten: 'Thông báo trước khi thực hiện',
      noiDung:
        'Trước khi triển khai, tổ chức/cá nhân phải thông báo cho đơn vị được giao quản lý tài sản kết cấu hạ tầng cây xanh và đại diện tổ chức tự quản của cộng đồng dân cư nơi có cây, để thông tin đến cộng đồng dân cư.',
      trachNhiem: 'Tổ chức, cá nhân thực hiện',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 7 điểm b',
    },
    {
      buoc: 6,
      ten: 'Trường hợp miễn giấy phép: lập biên bản và báo cáo sau',
      noiDung:
        'Với cây có nguy cơ đổ gãy do thiên tai hoặc cây đã chết/đổ gãy: phải lập biên bản có chứng kiến của đơn vị được giao quản lý tài sản KCHT cây xanh và đại diện tổ chức tự quản cộng đồng dân cư, kèm ảnh màu chụp hiện trạng trước khi chặt hạ; báo cáo lại cơ quan quản lý cây xanh trên địa bàn.',
      trachNhiem: 'Tổ chức, cá nhân thực hiện',
      thoiHan: 'Chậm nhất 10 ngày kể từ ngày hoàn thành chặt hạ, dịch chuyển',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 7 điểm c',
    },
    {
      buoc: 7,
      ten: 'Thu hồi gỗ, vật tư',
      noiDung: 'Đơn vị được giao quản lý tài sản kết cấu hạ tầng cây xanh tổ chức thu hồi gỗ và vật tư, vật liệu khác từ quá trình chặt hạ, dịch chuyển cây xanh sử dụng công cộng do mình quản lý.',
      trachNhiem: 'Đơn vị được giao quản lý tài sản KCHT cây xanh',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 27 khoản 7 điểm d',
    },
  ],
  thoiHan: [
    'Giải quyết hồ sơ: 20 ngày làm việc (cây thuộc danh mục cần bảo tồn) hoặc 10 ngày làm việc (trường hợp khác).',
    'Thời hạn hiệu lực của giấy phép: 30 ngày kể từ ngày cấp. Quá 30 ngày chưa thực hiện thì phải cấp giấy phép lại (Điều 27 khoản 7 điểm a).',
    'Báo cáo sau khi chặt hạ trong trường hợp miễn giấy phép: chậm nhất 10 ngày kể từ ngày hoàn thành.',
  ],
  ketQua: 'Giấy phép chặt hạ, dịch chuyển cây xanh (Mẫu số 02 Phụ lục I NĐ 258/2025/NĐ-CP) hoặc văn bản thông báo kết quả giải quyết.',
  canCu: ['Nghị định 258/2025/NĐ-CP ngày 09/10/2025, Điều 27'],
  luuY: [
    'Thẩm quyền cấp phép KHÔNG cố định ở Sở: UBND cấp tỉnh phân cấp cho cơ quan chuyên môn về công viên, cây xanh trực thuộc và/hoặc UBND cấp xã (Điều 27 khoản 4). Phải tra quyết định phân cấp của UBND tỉnh Quảng Trị trước khi trả lời công dân.',
    'Bồi thường, đền bù thiệt hại liên quan đến cây xanh áp dụng Điều 28 Nghị định 258/2025/NĐ-CP.',
  ],
}

const QUY_TRINH_DUY_TRI_CAY_XANH: QuyTrinhLinhVuc = {
  key: 'lap-quy-trinh-duy-tri-cay-xanh',
  linhVuc: ['cay-xanh'],
  ten: 'Lập và phê duyệt Quy trình quản lý, duy trì cây xanh sử dụng công cộng',
  loai: 'Lập & phê duyệt',
  moTa:
    'Quy trình này là văn bản BẮT BUỘC phải có làm cơ sở cho công tác quản lý, duy trì cây xanh sử dụng công cộng tại đô thị, bảo đảm cây phát triển tốt, an toàn và đáp ứng yêu cầu cảnh quan.',
  apDung: 'Cây xanh sử dụng công cộng tại đô thị do Nhà nước đầu tư, quản lý; tổ chức, cá nhân tự lập đối với cây xanh do mình đầu tư, quản lý.',
  buoc: [
    {
      buoc: 1,
      ten: 'Tổ chức lập quy trình',
      noiDung:
        'Nội dung bắt buộc gồm 7 phần: (a) cơ sở pháp lý; (b) nguyên tắc quản lý, duy trì; (c) thông tin đặc điểm cây xanh sử dụng công cộng cần quản lý, duy trì; (d) trình tự trồng cây; (đ) trình tự, chế độ bảo vệ, chăm sóc; (e) trình tự cắt tỉa, chặt hạ, dịch chuyển; (g) trách nhiệm và quyền hạn của đơn vị thực hiện dịch vụ.',
      trachNhiem: 'Đơn vị được giao quản lý tài sản kết cấu hạ tầng cây xanh',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 30 khoản 2 và khoản 3 điểm a',
    },
    {
      buoc: 2,
      ten: 'Trình phê duyệt',
      noiDung: 'Trình Uỷ ban nhân dân cấp có thẩm quyền xem xét, phê duyệt.',
      trachNhiem: 'Đơn vị được giao quản lý tài sản KCHT cây xanh',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 30 khoản 3 điểm a',
    },
    {
      buoc: 3,
      ten: 'Gửi và công bố',
      noiDung:
        'Gửi quy trình đến các cơ quan có liên quan NGAY SAU KHI ký quyết định ban hành; công bố trên cổng/trang thông tin điện tử của cơ quan phê duyệt, đơn vị được giao quản lý tài sản và đơn vị thực hiện dịch vụ.',
      trachNhiem: 'Cơ quan phê duyệt và đơn vị quản lý',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 30 khoản 5',
    },
    {
      buoc: 4,
      ten: 'Điều chỉnh khi cần',
      noiDung: 'Điều chỉnh cho phù hợp thực tế theo đề xuất của đơn vị thực hiện dịch vụ quản lý cây xanh; trình tự điều chỉnh như lập mới.',
      trachNhiem: 'Đơn vị thực hiện dịch vụ đề xuất — đơn vị quản lý tài sản trình',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 30 khoản 3 điểm b',
    },
  ],
  ketQua: 'Quyết định phê duyệt Quy trình quản lý, duy trì cây xanh sử dụng công cộng, đã công bố công khai.',
  canCu: ['Nghị định 258/2025/NĐ-CP, Điều 29, Điều 30'],
  luuY: [
    'Kinh phí lập, điều chỉnh quy trình lấy từ ngân sách nhà nước hoặc nguồn vốn hợp pháp khác (Điều 30 khoản 6).',
    'Mọi hoạt động trồng, chăm sóc, cắt tỉa, bảo vệ, chặt hạ, dịch chuyển cây xanh phải thực hiện đúng kỹ thuật và đúng quy trình đã phê duyệt (Điều 29).',
  ],
}

const QUY_TRINH_VAN_HANH_CONG_VIEN: QuyTrinhLinhVuc = {
  key: 'lap-quy-trinh-van-hanh-cong-vien',
  linhVuc: ['cay-xanh'],
  ten: 'Lập và phê duyệt Quy trình quản lý, vận hành công viên',
  loai: 'Lập & phê duyệt',
  moTa: 'Cơ sở cho công tác quản lý, vận hành công viên tại đô thị; bảo đảm công viên duy trì được cảnh quan, thiết kế và đáp ứng yêu cầu khai thác, sử dụng.',
  apDung: 'Công viên tại đô thị do Nhà nước đầu tư, quản lý (trừ công viên Nhà nước đầu tư và giao tổ chức, cá nhân quyền khai thác — trường hợp này bên có quyền khai thác tự lập, phê duyệt, giám sát).',
  buoc: [
    {
      buoc: 1,
      ten: 'Lập quy trình',
      noiDung:
        'Nội dung bắt buộc gồm 6 phần: (a) cơ sở pháp lý; (b) nguyên tắc quản lý, vận hành; (c) thông tin đặc điểm cây xanh sử dụng công cộng trong công viên, thông số kỹ thuật chủ yếu và nhiệm vụ công trình chức năng, thiết bị; (d) quy trình quản lý, duy trì cây xanh trong công viên theo Điều 30 khoản 2; (đ) trình tự, chế độ bảo trì công trình chức năng, thiết bị; (e) trách nhiệm, quyền hạn của đơn vị thực hiện dịch vụ.',
      trachNhiem: 'Đơn vị được giao quản lý tài sản kết cấu hạ tầng công viên',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 16 khoản 2',
    },
    {
      buoc: 2,
      ten: 'Trình UBND cấp tỉnh phê duyệt',
      noiDung: 'Với công viên do Nhà nước đầu tư, quản lý: trình Uỷ ban nhân dân CẤP TỈNH phê duyệt.',
      trachNhiem: 'Đơn vị được giao quản lý tài sản KCHT công viên',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 16 khoản 4 điểm a',
    },
    {
      buoc: 3,
      ten: 'Lập riêng quy trình vận hành hồ điều hoà (nếu có)',
      noiDung: 'Trường hợp hồ trong công viên là hồ điều hoà thì quy trình quản lý, vận hành hồ được lập RIÊNG theo pháp luật về thoát nước.',
      trachNhiem: 'Đơn vị được giao quản lý tài sản',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 16 khoản 3',
    },
    {
      buoc: 4,
      ten: 'Gửi và công bố',
      noiDung: 'Gửi các cơ quan liên quan ngay sau khi ký quyết định ban hành; công bố trên cổng/trang thông tin điện tử của cơ quan phê duyệt, đơn vị quản lý tài sản và đơn vị thực hiện dịch vụ.',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 16 khoản 6',
    },
  ],
  ketQua: 'Quyết định của UBND cấp tỉnh phê duyệt Quy trình quản lý, vận hành công viên, đã công bố công khai.',
  canCu: ['Nghị định 258/2025/NĐ-CP, Điều 16'],
  luuY: [
    'Yêu cầu bắt buộc khi vận hành công viên: bố trí hệ thống chiếu sáng ở lối đi, khu vực nghỉ ngơi, công trình trang trí và các điểm quan trọng (Điều 11 khoản 2 điểm d) — đây là điểm giao giữa lĩnh vực cây xanh và lĩnh vực chiếu sáng.',
    'Không thu tiền vào cửa của người sử dụng công viên và phải có phương án loại bỏ hoặc dỡ bỏ hàng rào cứng (Điều 11 khoản 3 điểm a).',
  ],
}

const DE_AN_CONG_VIEN_CAY_XANH: QuyTrinhLinhVuc = {
  key: 'de-an-cong-vien-cay-xanh',
  linhVuc: ['cay-xanh'],
  ten: 'Xây dựng, phê duyệt Đề án phát triển công viên, cây xanh, mặt nước đô thị',
  loai: 'Lập & phê duyệt',
  moTa: 'Đề án nhằm triển khai thực hiện nội dung quy hoạch công viên, cây xanh, mặt nước trong quy hoạch chung đô thị.',
  apDung:
    'Bắt buộc xây dựng cho thành phố trực thuộc trung ương. Với các đô thị khác: UBND cấp tỉnh QUYẾT ĐỊNH việc xây dựng đề án căn cứ yêu cầu quản lý phát triển (Điều 6 khoản 1, khoản 2).',
  buoc: [
    {
      buoc: 1,
      ten: 'Giao đơn vị tổ chức xây dựng đề án',
      noiDung: 'UBND cấp tỉnh giao cơ quan chuyên môn về công viên, cây xanh thuộc UBND cấp tỉnh hoặc giao UBND cấp xã tổ chức xây dựng đề án.',
      trachNhiem: 'UBND cấp tỉnh',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 6 khoản 3 điểm a',
    },
    {
      buoc: 2,
      ten: 'Lấy ý kiến và tham vấn cộng đồng',
      noiDung:
        'Lấy ý kiến cơ quan, tổ chức liên quan và chuyên gia bằng cách gửi hồ sơ hoặc tổ chức hội nghị, hội thảo; ĐĂNG TẢI dự thảo đề án trên cổng thông tin điện tử của UBND cấp tỉnh và của cơ quan tổ chức xây dựng đề án.',
      trachNhiem: 'Cơ quan được giao xây dựng đề án',
      thoiHan: 'Đăng tải ít nhất 30 ngày để tham vấn ý kiến cộng đồng',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 6 khoản 4',
    },
    {
      buoc: 3,
      ten: 'Trình phê duyệt',
      noiDung: 'Trình UBND cấp tỉnh xem xét, phê duyệt đề án trên địa bàn do mình quản lý.',
      trachNhiem: 'Cơ quan được giao xây dựng đề án',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 6 khoản 3',
    },
  ],
  ketQua: 'Quyết định của UBND cấp tỉnh phê duyệt Đề án phát triển công viên, cây xanh, mặt nước đô thị.',
  canCu: ['Nghị định 258/2025/NĐ-CP, Điều 6'],
  luuY: [
    'Kinh phí xây dựng đề án từ ngân sách địa phương hoặc nguồn vốn hợp pháp khác (Điều 6 khoản 5).',
    'Bộ Xây dựng hướng dẫn xây dựng đề án (Điều 6 khoản 6) — cần tra văn bản hướng dẫn của Bộ trước khi lập.',
  ],
}

const CSDL_CAY_XANH: QuyTrinhLinhVuc = {
  key: 'csdl-bao-cao-cay-xanh',
  linhVuc: ['cay-xanh'],
  ten: 'Xây dựng cơ sở dữ liệu và chế độ báo cáo về công viên, cây xanh, mặt nước',
  loai: 'Báo cáo, dữ liệu',
  moTa: 'Nghĩa vụ định kỳ hằng năm — có mốc thời gian cứng, dễ trễ hạn nếu không theo dõi.',
  apDung: 'Cơ quan chuyên môn về công viên, cây xanh cấp tỉnh; UBND cấp xã; đơn vị được giao quản lý công viên, cây xanh; tổ chức, cá nhân quản lý cây xanh.',
  buoc: [
    {
      buoc: 1,
      ten: 'Cấp xã và đơn vị quản lý báo cáo lên cấp tỉnh',
      noiDung: 'UBND cấp xã và các đơn vị được giao quản lý công viên, cây xanh xây dựng, cập nhật cơ sở dữ liệu trên địa bàn được giao và báo cáo cơ quan chuyên môn cấp tỉnh; lưu trữ hồ sơ theo quy định.',
      trachNhiem: 'UBND cấp xã, đơn vị được giao quản lý',
      thoiHan: 'TRƯỚC NGÀY 01/12 HÀNG NĂM',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 43 khoản 2 điểm d',
    },
    {
      buoc: 2,
      ten: 'Cơ quan chuyên môn cấp tỉnh tổng hợp và báo cáo',
      noiDung: 'Làm đầu mối xây dựng, cập nhật, tổng hợp cơ sở dữ liệu; báo cáo UBND cấp tỉnh và Bộ Xây dựng về công tác quản lý, phát triển công viên, cây xanh, mặt nước.',
      trachNhiem: 'Cơ quan chuyên môn về công viên, cây xanh thuộc UBND cấp tỉnh',
      thoiHan: 'TRƯỚC NGÀY 15/12 HÀNG NĂM',
      canCu: 'NĐ 258/2025/NĐ-CP, Điều 43 khoản 2 điểm c',
    },
  ],
  ketQua: 'Cơ sở dữ liệu công viên, cây xanh, mặt nước được cập nhật; báo cáo năm gửi UBND tỉnh và Bộ Xây dựng.',
  canCu: ['Nghị định 258/2025/NĐ-CP, Điều 43'],
  luuY: [
    'Thành phần dữ liệu (Điều 43 khoản 1): chỉ tiêu thống kê; dữ liệu cây xanh sử dụng công cộng; hiện trạng hệ thống công viên, cây xanh sử dụng công cộng, cây xanh cần bảo tồn và mặt nước; quy hoạch chi tiết công viên và thiết kế cây xanh, mặt nước; dữ liệu cần thiết khác.',
    'Tổ chức, cá nhân có trách nhiệm cung cấp dữ liệu về công viên, cây xanh, mặt nước do mình quản lý cho cơ quan quản lý nhà nước tại địa phương (Điều 43 khoản 2 điểm đ).',
  ],
}

// ═══════════════ CHIẾU SÁNG ĐÔ THỊ ═══════════════

const CHI_PHI_DICH_VU_CONG: QuyTrinhLinhVuc = {
  key: 'chi-phi-dich-vu-chieu-sang-cay-xanh',
  linhVuc: ['chieu-sang', 'cay-xanh'],
  ten: 'Xác định định mức kinh tế – kỹ thuật và dự toán chi phí dịch vụ sự nghiệp công chiếu sáng đô thị, cây xanh đô thị',
  loai: 'Chi phí, định mức',
  moTa:
    'Đây là quy trình quyết định con số tiền chi thường xuyên hằng năm cho chiếu sáng và cây xanh đô thị. Dự toán chi phí là cơ sở để ĐẤU THẦU hoặc ĐẶT HÀNG cung cấp dịch vụ sự nghiệp công.',
  apDung:
    'Dịch vụ sự nghiệp công chiếu sáng đô thị, cây xanh đô thị sử dụng ngân sách nhà nước từ nguồn kinh phí CHI THƯỜNG XUYÊN (Thông tư 12/2024/TT-BXD, Điều 1).',
  buoc: [
    {
      buoc: 1,
      ten: 'Xác định định mức kinh tế – kỹ thuật',
      noiDung:
        'UBND cấp tỉnh tổ chức xác định, ban hành, sửa đổi, bổ sung định mức kinh tế – kỹ thuật áp dụng cho dịch vụ thuộc phạm vi quản lý, theo phương pháp tại Phụ lục số 3 Thông tư 12/2024/TT-BXD. Định mức do Bộ Xây dựng và cơ quan có thẩm quyền ban hành chỉ để VẬN DỤNG, THAM KHẢO.',
      trachNhiem: 'UBND cấp tỉnh (Sở Xây dựng tham mưu)',
      canCu: 'TT 12/2024/TT-BXD, Điều 6 khoản 2 và khoản 3',
    },
    {
      buoc: 2,
      ten: 'Lập dự toán chi phí dịch vụ',
      noiDung:
        'Dự toán gồm 4 khoản mục: (a) chi phí trực tiếp — vật liệu, nhân công, sử dụng xe máy và thiết bị thi công; (b) chi phí quản lý chung; (c) thu nhập chịu thuế tính trước; (d) thuế giá trị gia tăng (nếu có). Tổng hợp theo Phụ lục số 1; phương pháp xác định theo Phụ lục số 2.',
      trachNhiem: 'Cơ quan, đơn vị được giao',
      canCu: 'TT 12/2024/TT-BXD, Điều 5 khoản 1, khoản 2, khoản 3',
    },
    {
      buoc: 3,
      ten: 'Xác định định mức tỷ lệ chi phí quản lý chung',
      noiDung:
        'Chi phí quản lý chung = định mức tỷ lệ (%) × chi phí nhân công trực tiếp HOẶC chi phí ca xe, máy và thiết bị thi công. Định mức tỷ lệ này DO UBND CẤP TỈNH QUY ĐỊNH, phải phù hợp điều kiện thực tế của địa phương (tham khảo tỷ lệ tại khoản 2 Mục I Phụ lục số 2).',
      trachNhiem: 'UBND cấp tỉnh',
      canCu: 'TT 12/2024/TT-BXD, Điều 5 khoản 3 điểm b',
    },
    {
      buoc: 4,
      ten: 'Thuê tư vấn (nếu cần)',
      noiDung:
        'Cơ quan, đơn vị được giao xây dựng định mức KT-KT, đơn giá, dự toán được thuê tổ chức, cá nhân tư vấn có năng lực để xây dựng, thẩm tra định mức; lập đơn giá và dự toán. Chi phí thuê tư vấn xác định bằng dự toán phù hợp nội dung, yêu cầu công việc.',
      trachNhiem: 'Cơ quan, đơn vị được giao',
      canCu: 'TT 12/2024/TT-BXD, Điều 7 khoản 2',
    },
    {
      buoc: 5,
      ten: 'Đấu thầu hoặc đặt hàng',
      noiDung: 'Dùng dự toán đã lập làm cơ sở thực hiện đấu thầu, đặt hàng cung cấp dịch vụ sự nghiệp công theo pháp luật về đấu thầu, đặt hàng.',
      trachNhiem: 'Cơ quan, đơn vị được giao',
      canCu: 'TT 12/2024/TT-BXD, Điều 4 khoản 2 và khoản 3',
    },
    {
      buoc: 6,
      ten: 'Gửi kết quả ban hành định mức về Bộ Xây dựng',
      noiDung: 'Kết quả ban hành định mức được gửi về Bộ Xây dựng để theo dõi, đồng thời cập nhật vào hệ thống cơ sở dữ liệu về định mức và giá xây dựng.',
      trachNhiem: 'UBND cấp tỉnh',
      canCu: 'TT 12/2024/TT-BXD, Điều 6 khoản 4',
    },
  ],
  ketQua: 'Quyết định của UBND cấp tỉnh ban hành định mức KT-KT; dự toán chi phí dịch vụ được duyệt làm cơ sở đấu thầu/đặt hàng.',
  canCu: ['Thông tư 12/2024/TT-BXD ngày 18/12/2024 (hiệu lực 15/02/2025, bãi bỏ Thông tư 14/2017/TT-BXD)'],
  luuY: [
    'Nguyên tắc: chi phí phải được TÍNH ĐÚNG, TÍNH ĐỦ phù hợp quy trình kỹ thuật, định mức KT-KT, tiêu chí chất lượng dịch vụ và điều kiện thực tế địa phương (Điều 4 khoản 1). Không có quy trình kỹ thuật thì không tính đúng được — nên quy trình quản lý vận hành phải phê duyệt trước.',
    'Định mức KT-KT do UBND cấp tỉnh ban hành TRƯỚC ngày Thông tư có hiệu lực vẫn tiếp tục áp dụng; việc rà soát, sửa đổi thực hiện theo Thông tư 12/2024 (Điều 8 khoản 2).',
    'Chi phí giám sát, chi phí quản lý dịch vụ tham khảo hướng dẫn tại Phụ lục số 4; chỉ thực hiện khi được ngân sách bảo đảm (Điều 7 khoản 3).',
  ],
}

const CHIEU_SANG_THONG_MINH: QuyTrinhLinhVuc = {
  key: 'phat-trien-chieu-sang-thong-minh',
  linhVuc: ['chieu-sang'],
  ten: 'Phát triển hệ thống chiếu sáng công cộng thông minh',
  loai: 'Quản lý, vận hành',
  moTa:
    'Trình tự đưa hệ thống chiếu sáng đô thị hiện hữu lên chiếu sáng công cộng thông minh, bám 4 hợp phần bắt buộc mà Nghị định 269/2025/NĐ-CP đã định nghĩa và 3 cấp độ trưởng thành của Thông tư 03/2026/TT-BXD.',
  apDung: 'Hệ thống chiếu sáng công cộng đô thị do tỉnh giao quản lý; áp dụng cả khi đầu tư mới và khi nâng cấp.',
  buoc: [
    {
      buoc: 1,
      ten: 'Lập kế hoạch, lộ trình',
      noiDung: 'Tổ chức được giao quản lý khai thác, sử dụng công trình HTKT xây dựng kế hoạch, lộ trình phát triển HTKT thông minh và cam kết cung cấp, chia sẻ dữ liệu theo thời gian thực.',
      trachNhiem: 'Đơn vị được giao quản lý hệ thống chiếu sáng',
      canCu: 'NĐ 269/2025/NĐ-CP, Điều 23 khoản 4',
    },
    {
      buoc: 2,
      ten: 'Đạt cấp độ NỀN TẢNG',
      noiDung: 'Đèn chiếu sáng đường phố sử dụng thiết bị tiết kiệm năng lượng, hiệu suất cao.',
      canCu: 'TT 03/2026/TT-BXD, Phụ lục I, chỉ số III.NL.06.01 — cấp độ xây dựng nền tảng',
    },
    {
      buoc: 3,
      ten: 'Đạt cấp độ LIÊN KẾT HỆ THỐNG',
      noiDung:
        'Đèn được tối ưu hoá, điều chỉnh tự động dựa trên cảm biến; được quản lý, vận hành TẬP TRUNG; chia sẻ thông tin với Trung tâm điều hành cấp tỉnh. Kết nối chia sẻ dữ liệu thời gian thực với LGSP; tuân thủ mô hình dữ liệu chung; cung cấp API mở.',
      canCu: 'TT 03/2026/TT-BXD, chỉ số III.NL.06.01 — cấp độ liên kết hệ thống; NĐ 269/2025/NĐ-CP, Điều 25 khoản 1',
    },
    {
      buoc: 4,
      ten: 'Đạt cấp độ ĐỔI MỚI QUẢN TRỊ',
      noiDung: 'Tích hợp AI và công nghệ mới vào hệ thống chiếu sáng đô thị.',
      canCu: 'TT 03/2026/TT-BXD, chỉ số III.NL.06.01 — cấp độ đổi mới quản trị',
    },
    {
      buoc: 5,
      ten: 'Kiểm soát điều kiện kỹ thuật khi thẩm định',
      noiDung:
        'Yêu cầu kỹ thuật của dự án phải bảo đảm: ưu tiên tiêu chuẩn mở, có khả năng mở rộng, KHÔNG phụ thuộc một công nghệ hay nhà cung cấp duy nhất; ưu tiên vật liệu xanh, công nghệ xanh, giảm phát thải.',
      trachNhiem: 'Phòng Hạ tầng kỹ thuật (khi thẩm định, góp ý)',
      canCu: 'NĐ 269/2025/NĐ-CP, Điều 23 khoản 2 và khoản 3',
    },
    {
      buoc: 6,
      ten: 'Chuẩn bị minh chứng khi đánh giá',
      noiDung:
        'Minh chứng phải là dữ liệu, hồ sơ, kết quả thực hiện THỰC TẾ đến thời điểm đánh giá. Đề án, kế hoạch chưa triển khai có kết quả cụ thể KHÔNG được tính. Chỉ số không có minh chứng phù hợp bị đánh giá KHÔNG ĐẠT.',
      trachNhiem: 'Đơn vị quản lý và cơ quan chuyên môn',
      canCu: 'TT 03/2026/TT-BXD, Điều 2 khoản 1 điểm c và khoản 2 điểm b',
    },
  ],
  ketQua: 'Hệ thống chiếu sáng công cộng đạt cấp độ trưởng thành tương ứng, có minh chứng phục vụ đánh giá, công nhận.',
  canCu: [
    'Nghị định 269/2025/NĐ-CP, Điều 23, Điều 24 khoản 3, Điều 25',
    'Thông tư 03/2026/TT-BXD, Điều 2 và Phụ lục I (chỉ số III.NL.06.01, III.NL.06.02)',
  ],
  luuY: [
    'Bốn hợp phần bắt buộc của “chiếu sáng công cộng thông minh” theo NĐ 269/2025 Điều 24 khoản 3: thiết bị tiết kiệm năng lượng hiệu suất cao; cảm biến và kết nối mạng; tự động điều chỉnh độ sáng theo điều kiện môi trường và lưu lượng giao thông; quản lý tập trung để giám sát và cảnh báo sự cố.',
    'Thông số kỹ thuật cụ thể của đèn (độ rọi, độ chói, nhiệt độ màu, hiệu suất) KHÔNG nằm trong NĐ 269/2025 hay TT 03/2026 — thuộc quy chuẩn, tiêu chuẩn chuyên ngành, hiện chưa có bản gốc trong kho văn bản của Sở.',
  ],
}

// ═══════════════ ÁP DỤNG CHO MỌI LĨNH VỰC — TÀI SẢN KẾT CẤU HẠ TẦNG ═══════════════

// Chỉ các lĩnh vực mà NĐ 178/2026 điều chỉnh. Cấp nước sạch, công viên – cây xanh và giao thông
// (đường bộ, gồm đường đô thị) bị loại trừ tại Điều 1 khoản 2 điểm đ → theo NĐ 43/2022, NĐ 258/2025,
// NĐ 44/2024 (sửa bởi NĐ 99/2026).
const MOI_LINH_VUC: LinhVucKey[] = [
  'thoat-nuoc', 'chieu-sang', 'nghia-trang', 'khong-gian-ngam', 'su-dung-chung',
]

const LOAI_TRU_ND178 =
  'KHÔNG áp dụng cho các tài sản loại trừ tại Điều 1 khoản 2 điểm đ NĐ 178/2026/NĐ-CP: giao thông (đường bộ — gồm đường đô thị, '
  + 'đường thủy nội địa, đường sắt, hàng hải, hàng không), thủy lợi, cấp nước sạch, chợ, công viên, cây xanh. '
  + 'Với lĩnh vực HTKT: đường bộ theo NĐ 44/2024/NĐ-CP (sửa bởi NĐ 99/2026/NĐ-CP), cấp nước sạch theo NĐ 43/2022/NĐ-CP, '
  + 'công viên – cây xanh theo NĐ 258/2025/NĐ-CP.'

const BAO_TRI_TAI_SAN_KCHT: QuyTrinhLinhVuc = {
  key: 'bao-tri-tai-san-kcht',
  linhVuc: MOI_LINH_VUC,
  ten: 'Bảo trì công trình thuộc tài sản kết cấu hạ tầng',
  loai: 'Quản lý, vận hành',
  apDungMoiLinhVuc: true,
  moTa:
    'Nghĩa vụ bảo trì đối với công trình HTKT do Nhà nước đầu tư, quản lý, thuộc phạm vi NĐ 178/2026: thoát nước, chiếu sáng, nghĩa trang, công trình ngầm, công trình HTKT sử dụng chung. ' + LOAI_TRU_ND178,
  apDung:
    'Tài sản kết cấu hạ tầng ĐÔ THỊ do Nhà nước đầu tư, quản lý (Điều 1 khoản 1 Nghị định 178/2026/NĐ-CP nêu đích danh “tài sản kết cấu hạ tầng đô thị”). Không áp dụng với tài sản đã giao doanh nghiệp theo hình thức đầu tư vốn nhà nước vào doanh nghiệp (Điều 1 khoản 2 điểm a). ' + LOAI_TRU_ND178,
  buoc: [
    {
      buoc: 1,
      ten: 'Xác định nghĩa vụ bảo trì',
      noiDung: 'Công trình thuộc tài sản kết cấu hạ tầng PHẢI được bảo trì nhằm bảo đảm hoạt động bình thường và an toàn khi sử dụng, khai thác tài sản.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 14 khoản 1',
    },
    {
      buoc: 2,
      ten: 'Bố trí kinh phí',
      noiDung: 'Kinh phí bảo trì bố trí từ ngân sách nhà nước theo pháp luật về ngân sách nhà nước và nguồn kinh phí khác theo quy định của pháp luật.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 14 khoản 2',
    },
    {
      buoc: 3,
      ten: 'Lập, phê duyệt kế hoạch và dự toán kinh phí bảo trì',
      noiDung: 'Trường hợp dùng ngân sách nhà nước: trình tự, thủ tục lập và phê duyệt kế hoạch, dự toán thực hiện theo pháp luật về ngân sách nhà nước và pháp luật liên quan.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 14 khoản 3',
    },
    {
      buoc: 4,
      ten: 'Tổ chức thực hiện bảo trì',
      noiDung: 'Thực hiện theo pháp luật CHUYÊN NGÀNH về hạ tầng, pháp luật về quản lý chất lượng và bảo trì công trình xây dựng và pháp luật liên quan. Trường hợp pháp luật chuyên ngành có quy định khác về bảo trì thì theo pháp luật chuyên ngành đó.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 14 khoản 4 và khoản 7',
    },
    {
      buoc: 5,
      ten: 'Xử lý vật liệu, vật tư thu hồi',
      noiDung: 'Vật liệu, vật tư thu hồi trong quá trình bảo trì được xử lý theo quy định về xử lý vật liệu, vật tư thu hồi từ THANH LÝ tài sản tại chính Nghị định này.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 14 khoản 5',
    },
    {
      buoc: 6,
      ten: 'Trường hợp đã chuyển nhượng / cho thuê quyền khai thác',
      noiDung:
        'Nếu hợp đồng quy định bên nhận chuyển nhượng quyền thu phí, bên thuê quyền khai thác, bên nhận chuyển nhượng có thời hạn quyền khai thác hoặc bên nhận chuyển giao tài sản phải bảo trì, thì các bên đó bảo trì BẰNG KINH PHÍ CỦA MÌNH theo pháp luật và hợp đồng đã ký.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 14 khoản 6',
    },
  ],
  ketQua: 'Công trình HTKT được bảo trì theo kế hoạch và dự toán được duyệt; vật tư thu hồi được xử lý đúng quy định.',
  canCu: ['Nghị định 178/2026/NĐ-CP ngày 20/5/2026, Điều 14'],
  luuY: [
    'Đây là quy định KHUNG về tài sản công. Nội dung kỹ thuật bảo trì từng lĩnh vực vẫn theo pháp luật chuyên ngành và pháp luật về quản lý chất lượng, bảo trì công trình xây dựng — phải tra riêng, không suy từ Nghị định này.',
    'Chi phí bảo trì công trình xây dựng xác định theo Thông tư 40/2026/TT-BXD (đã có trong kho tài liệu của Sở).',
  ],
}

const KE_KHAI_TAI_SAN_KCHT: QuyTrinhLinhVuc = {
  key: 'ke-khai-bao-cao-tai-san-kcht',
  linhVuc: MOI_LINH_VUC,
  ten: 'Báo cáo kê khai và cập nhật cơ sở dữ liệu tài sản kết cấu hạ tầng',
  loai: 'Báo cáo, dữ liệu',
  apDungMoiLinhVuc: true,
  moTa: 'Nghĩa vụ kê khai tài sản HTKT vào Cơ sở dữ liệu về tài sản kết cấu hạ tầng — có thời hạn cứng 30 ngày, rất dễ trễ.',
  apDung: 'Cơ quan, đơn vị quản lý tài sản kết cấu hạ tầng (kể cả tổ chức, đơn vị được phân cấp, uỷ quyền hoặc giao theo Điều 8 khoản 2). ' + LOAI_TRU_ND178,
  buoc: [
    {
      buoc: 1,
      ten: 'Báo cáo kê khai LẦN ĐẦU',
      noiDung: 'Áp dụng cho tài sản HTKT hiện có tại thời điểm Nghị định có hiệu lực và tài sản phát sinh tăng kể từ ngày Nghị định có hiệu lực.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 33 khoản 2 điểm a',
    },
    {
      buoc: 2,
      ten: 'Báo cáo kê khai BỔ SUNG',
      noiDung: 'Áp dụng khi có thay đổi thông tin về cơ quan, đơn vị quản lý tài sản hoặc thông tin về tài sản sau khi đã kê khai lần đầu.',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 33 khoản 2 điểm b',
    },
    {
      buoc: 3,
      ten: 'Gửi báo cáo kê khai đúng hạn',
      noiDung:
        'Lập báo cáo kê khai để nhập dữ liệu vào Cơ sở dữ liệu về tài sản kết cấu hạ tầng. Mốc tính thời hạn: ngày đưa tài sản vào sử dụng (tài sản mua sắm, đầu tư xây dựng mới) · ngày tiếp nhận tài sản theo quyết định (tài sản được giao, nhận điều chuyển) · ngày xử lý tài sản theo quyết định · ngày có thay đổi thông tin đã kê khai.',
      thoiHan: '30 NGÀY kể từ mốc tương ứng',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 33 khoản 3',
    },
    {
      buoc: 4,
      ten: 'Báo cáo tình hình quản lý, sử dụng, khai thác hằng năm',
      noiDung: 'Báo cáo hằng năm và báo cáo đột xuất theo yêu cầu của cơ quan, người có thẩm quyền. Thời điểm chốt số liệu báo cáo hằng năm là thời điểm KẾT THÚC NĂM TÀI CHÍNH.',
      thoiHan: 'Hằng năm, chốt số liệu tại thời điểm kết thúc năm tài chính',
      canCu: 'NĐ 178/2026/NĐ-CP, Điều 33 khoản 4',
    },
  ],
  ketQua: 'Tài sản HTKT được kê khai và cập nhật đầy đủ trong Cơ sở dữ liệu về tài sản kết cấu hạ tầng; có báo cáo năm.',
  canCu: ['Nghị định 178/2026/NĐ-CP ngày 20/5/2026, Điều 33, Điều 34'],
  luuY: [
    'Công viên, cây xanh KHÔNG kê khai theo Nghị định này (Điều 1 khoản 2 điểm đ) — báo cáo theo Điều 43 Nghị định 258/2025/NĐ-CP (mốc 01/12 và 15/12).',
  ],
}

// ═══════════════ TỔNG HỢP ═══════════════

export const QUY_TRINH_LINH_VUC: QuyTrinhLinhVuc[] = [
  CAP_PHEP_CHAT_HA,
  QUY_TRINH_DUY_TRI_CAY_XANH,
  QUY_TRINH_VAN_HANH_CONG_VIEN,
  DE_AN_CONG_VIEN_CAY_XANH,
  CSDL_CAY_XANH,
  CHI_PHI_DICH_VU_CONG,
  CHIEU_SANG_THONG_MINH,
  BAO_TRI_TAI_SAN_KCHT,
  KE_KHAI_TAI_SAN_KCHT,
]

/**
 * Lĩnh vực CHƯA có quy trình CHUYÊN NGÀNH riêng vì văn bản gốc chưa có trong kho của Sở.
 * (Thoát nước, nghĩa trang, công trình ngầm, sử dụng chung vẫn dùng được 2 quy trình KHUNG về tài
 * sản kết cấu hạ tầng theo Nghị định 178/2026/NĐ-CP — nhưng đó là quy định chung về tài sản công,
 * KHÔNG thay thế quy trình quản lý chuyên ngành. Cấp nước sạch và giao thông bị NĐ 178 loại trừ.)
 * Cố tình liệt kê ra để không ai hiểu nhầm là hệ thống đã bao phủ đủ 8 lĩnh vực.
 */
export const CHUA_DU_CAN_CU: { linhVuc: LinhVucKey; ten: string; canVanBan: string }[] = [
  { linhVuc: 'cap-nuoc', ten: 'Cấp nước sạch đô thị', canVanBan: 'Nghị định về sản xuất, cung cấp và tiêu thụ nước sạch và NĐ 43/2022/NĐ-CP về tài sản KCHT cấp nước sạch — chưa có bản gốc trong kho.' },
  { linhVuc: 'thoat-nuoc', ten: 'Thoát nước & xử lý nước thải', canVanBan: 'Nghị định về thoát nước và xử lý nước thải đang có hiệu lực — chưa có bản gốc trong kho.' },
  { linhVuc: 'nghia-trang', ten: 'Nghĩa trang & cơ sở hoả táng', canVanBan: 'Nghị định về xây dựng, quản lý và sử dụng nghĩa trang, cơ sở hoả táng đang có hiệu lực — chưa có bản gốc trong kho.' },
  { linhVuc: 'khong-gian-ngam', ten: 'Không gian xây dựng ngầm', canVanBan: 'Nghị định về quản lý không gian xây dựng ngầm đô thị đang có hiệu lực — chưa có bản gốc trong kho.' },
  { linhVuc: 'su-dung-chung', ten: 'Sử dụng chung công trình HTKT', canVanBan: 'NĐ 72/2012/NĐ-CP và TT 03/2013/TT-BXD (mẫu hợp đồng) vẫn còn hiệu lực theo tra cứu 13/10/2026 — chưa có bản gốc trong kho.' },
  { linhVuc: 'giao-thong-do-thi', ten: 'Hạ tầng giao thông đô thị', canVanBan: 'Đã có Luật Đường bộ 35/2024/QH15 trong kho; còn thiếu văn bản hướng dẫn phần hạ tầng giao thông ĐÔ THỊ để dựng quy trình cấp phép đào đường, hoàn trả mặt đường; tài sản KCHT đường bộ theo NĐ 44/2024/NĐ-CP (sửa bởi NĐ 99/2026/NĐ-CP), chưa có bản gốc trong kho.' },
]

// ── Truy vấn ────────────────────────────────────────────────────────────────
export function quyTrinhTheoLinhVuc(linhVuc: LinhVucKey): QuyTrinhLinhVuc[] {
  return QUY_TRINH_LINH_VUC.filter((q) => q.linhVuc.includes(linhVuc))
}

/** Chỉ quy trình CHUYÊN NGÀNH của lĩnh vực (bỏ các quy trình khung áp dụng cho mọi lĩnh vực). */
export function quyTrinhChuyenNganh(linhVuc: LinhVucKey): QuyTrinhLinhVuc[] {
  return quyTrinhTheoLinhVuc(linhVuc).filter((q) => !q.apDungMoiLinhVuc)
}

export function timQuyTrinh(tuKhoa: string): QuyTrinhLinhVuc[] {
  if (!tuKhoa.trim()) return []
  return xepHang(
    QUY_TRINH_LINH_VUC,
    tuKhoa,
    (q) =>
      [q.ten, q.moTa, q.apDung, q.loai, q.ketQua, ...q.buoc.map((b) => `${b.ten} ${b.noiDung}`)].join(' '),
    2 // đòi khớp ít nhất 2 từ để không trả về mọi quy trình khi câu hỏi chỉ có 1 từ chung
  )
}
