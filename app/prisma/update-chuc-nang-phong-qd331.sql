-- Cập nhật chức năng, nhiệm vụ các phòng thuộc Sở Xây dựng Quảng Trị vào to_chuc.moTa
-- Căn cứ Quyết định 331/QĐ-SXD ngày 05/9/2025 (GĐ Trương Chí Trung ký).
-- Idempotent: chạy lại chỉ ghi đè moTa theo mã phòng (ma), không tạo bản ghi mới.

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Tham mưu tổng hợp, điều phối hoạt động cơ quan; công tác tổ chức - cán bộ, hành chính - quản trị. '
|| 'NHIỆM VỤ: Tổ chức bộ máy, quản lý CBCCVC-NLĐ; chế độ chính sách (tiền lương, BHXH, nâng lương, nghỉ hưu); thi đua - khen thưởng, kỷ luật; đào tạo - bồi dưỡng; pháp chế; ISO, cải cách hành chính; chuyển đổi số & Đề án 06; văn thư - lưu trữ; hành chính - quản trị - tài sản công vụ.'
WHERE ma = 'VAN_PHONG_SO';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Tham mưu kế hoạch phát triển ngành và quản lý tài chính - kế toán của Sở. '
|| 'NHIỆM VỤ: Xây dựng kế hoạch phát triển ngành; công tác đấu thầu; kế hoạch vốn, dự toán; tài chính - kế toán; quản lý tài sản; thống kê ngành; thuế TNCN; thanh toán lương - BHXH; công khai tài chính.'
WHERE ma = 'PHONG_KH_TC';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về chất lượng công trình giao thông. '
|| 'NHIỆM VỤ: Thẩm định Báo cáo NCKT/thiết kế; kiểm tra công tác nghiệm thu; quản lý chất lượng và an toàn thi công; bảo trì công trình giao thông; giám định tư pháp xây dựng giao thông; định mức kinh tế - kỹ thuật giao thông.'
WHERE ma = 'PHONG_CLCT';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý đầu tư, khai thác, bảo trì kết cấu hạ tầng giao thông. '
|| 'NHIỆM VỤ: Đầu tư - bảo trì - vận hành kết cấu hạ tầng giao thông (đường bộ, đường sắt, đường thủy nội địa); an toàn giao thông (Thường trực Ban ATGT tỉnh); cấp phép thi công trên đường bộ; quản lý bến xe - bãi đỗ - cảng bến; phá dỡ tàu biển; nông thôn mới.'
WHERE ma = 'PHONG_QLKCHT';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về hoạt động đầu tư xây dựng. '
|| 'NHIỆM VỤ: Cấp phép xây dựng; quản lý trật tự xây dựng; thẩm định dự án dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở; chứng chỉ hành nghề xây dựng; quản lý nhà thầu nước ngoài; thí nghiệm chuyên ngành xây dựng.'
WHERE ma = 'PHONG_QLHD_XD';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý kinh tế xây dựng và vật liệu xây dựng. '
|| 'NHIỆM VỤ: Định mức - đơn giá - chỉ số giá xây dựng; công bố giá VLXD; thẩm định dự toán quy hoạch; quản lý VLXD và khoáng sản làm VLXD (nhóm II).'
WHERE ma = 'PHONG_KT_VL';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về hạ tầng kỹ thuật đô thị và khu dân cư nông thôn. '
|| 'NHIỆM VỤ - 8 lĩnh vực: (1) Cấp nước sạch đô thị (trừ nước sạch nông thôn); (2) Thoát nước & xử lý nước thải; (3) Công viên, cây xanh đô thị; (4) Chiếu sáng đô thị; (5) Nghĩa trang & cơ sở hỏa táng (trừ nghĩa trang liệt sĩ); (6) Kết cấu hạ tầng giao thông đô thị; (7) Không gian xây dựng ngầm; (8) Sử dụng chung công trình HTKT đô thị & khu dân cư NT. '
|| 'Kèm: kế hoạch/chương trình/cơ chế chính sách HTKT; xúc tiến đầu tư; thẩm định BCNCKT + kiểm tra nghiệm thu dự án HTKT; quản lý chi phí/định mức dịch vụ HTKT; quản lý - bảo trì - vận hành hệ thống HTKT tỉnh giao; xây dựng CSDL hạ tầng kỹ thuật; báo cáo định kỳ. (Chất thải rắn không thuộc phòng này.)'
WHERE ma = 'PHONG_HTKT';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về phát triển đô thị. '
|| 'NHIỆM VỤ: Chương trình phát triển đô thị; phân loại đô thị; đô thị thông minh & tăng trưởng xanh; thẩm định hạ tầng kỹ thuật khu đô thị; xây dựng CSDL phát triển đô thị.'
WHERE ma = 'PHONG_PTDT';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về vận tải và phương tiện. '
|| 'NHIỆM VỤ: Đăng ký - đăng kiểm phương tiện đường thủy nội địa; đào tạo - sát hạch GPLX, chứng chỉ; quản lý vận tải, bến xe, taxi; vận tải hành khách công cộng; HTX giao thông vận tải.'
WHERE ma = 'PHONG_QL_VT';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về quy hoạch xây dựng và kiến trúc. '
|| 'NHIỆM VỤ: Xây dựng CSDL quy hoạch đô thị - nông thôn; thẩm định/phê duyệt quy hoạch; thiết kế đô thị; quy chế quản lý kiến trúc; chứng chỉ hành nghề kiến trúc.'
WHERE ma = 'PHONG_QH_KT';

UPDATE to_chuc SET "moTa" =
'CHỨC NĂNG: Quản lý nhà nước về nhà ở và thị trường bất động sản. '
|| 'NHIỆM VỤ: Chương trình phát triển nhà ở; nhà ở xã hội, nhà công vụ; định giá nhà; quản lý thị trường BĐS; chứng chỉ môi giới BĐS; hệ thống thông tin về nhà ở và thị trường BĐS.'
WHERE ma = 'PHONG_QL_NHA';

-- Kiểm tra kết quả
SELECT ma, ten, left("moTa", 60) AS mota_preview FROM to_chuc
WHERE ma IN ('VAN_PHONG_SO','PHONG_KH_TC','PHONG_CLCT','PHONG_QLKCHT','PHONG_QLHD_XD',
             'PHONG_KT_VL','PHONG_HTKT','PHONG_PTDT','PHONG_QL_VT','PHONG_QH_KT','PHONG_QL_NHA')
ORDER BY "thuTu";
