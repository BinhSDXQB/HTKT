-- Kiểm tra migration 051. Chỉ đọc. Chạy TRƯỚC và SAU migration 051 để đối chiếu.
-- Giá trị mong đợi theo số liệu ngày 13/11/2026; nếu dữ liệu đã đổi thì tính lại.
-- Mục 6–9 cần bảng nhật ký: tệp tự bỏ qua các mục này nếu migration chưa áp.
-- Chạy bằng psql (dùng lệnh \if, \gset).

\set ON_ERROR_STOP on

-- 1. Tổng số dòng phan_cong.                              Trước: 103   Sau: 146
SELECT count(*) AS tong FROM phan_cong;

-- 2. Trong phạm vi (hồ sơ đủ đơn vị + chức danh): số cán bộ KHÔNG có đúng một
--    phân công chính đang hiệu lực khớp hồ sơ.            Trước: 57    Sau: 0
SELECT count(*) AS trong_pham_vi_chua_khop FROM can_bo c
 WHERE c."toChucId" IS NOT NULL AND c."chucDanhId" IS NOT NULL
   AND (SELECT count(*) FROM phan_cong p
         WHERE p."canBoId" = c.id AND p."laChinh" AND p."denNgay" IS NULL
           AND p."toChucId" = c."toChucId" AND p."chucDanhId" = c."chucDanhId") <> 1;

-- 3. Ngoài phạm vi (hồ sơ thiếu đơn vị hoặc chức danh): số cán bộ, và trong đó
--    số người đang có phân công chính.                    Trước: 18 / 0   Sau: 18 / 0
SELECT count(*) AS ngoai_pham_vi,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM phan_cong p WHERE p."canBoId" = c.id AND p."laChinh")) AS co_chinh
  FROM can_bo c WHERE c."toChucId" IS NULL OR c."chucDanhId" IS NULL;

-- 4. Cán bộ có hơn một phân công chính đang hiệu lực.     Trước: 0     Sau: 0
SELECT count(*) AS nhieu_chinh
  FROM (SELECT "canBoId" FROM phan_cong WHERE "laChinh" AND "denNgay" IS NULL GROUP BY 1 HAVING count(*) > 1) x;

-- 5. SỐ DÒNG các bảng khác (chỉ so số dòng, không so nội dung).
--                                                          Trước = Sau: 164 / 220 / 25 / 25
SELECT (SELECT count(*) FROM can_bo) AS can_bo, (SELECT count(*) FROM users) AS users,
       (SELECT count(*) FROM to_chuc) AS to_chuc, (SELECT count(*) FROM chuc_danh) AS chuc_danh;

SELECT to_regclass('public.phan_cong_mig051_log') IS NOT NULL AS da_ap \gset
\if :da_ap

-- 6. Nhật ký theo thao tác.                                Sau: SUA 14, TAO 43
SELECT thao_tac, count(*) AS n FROM public.phan_cong_mig051_log GROUP BY 1 ORDER BY 1;

-- 7. Dòng hiện tại khác trạng thái "sau" trong nhật ký (đã bị sửa/xoá sau migration).
--                                                          Ngay sau khi áp: 0
SELECT count(*) AS khac_nhat_ky
  FROM public.phan_cong_mig051_log l LEFT JOIN phan_cong p ON p.id = l.id
 WHERE p.id IS NULL OR to_jsonb(p) IS DISTINCT FROM l.sau;

-- 8. Dòng SUA: ngoài "toChucId", "chucDanhId", "updatedAt" không cột nào được đổi.
--                                                          Sau: 0
SELECT count(*) AS sua_ngoai_du_kien FROM public.phan_cong_mig051_log
 WHERE thao_tac = 'SUA'
   AND (truoc - 'toChucId' - 'chucDanhId' - 'updatedAt') IS DISTINCT FROM (sau - 'toChucId' - 'chucDanhId' - 'updatedAt');

-- 9. Dòng không nằm trong nhật ký: số lượng phải bằng số dòng trước khi áp trừ 14.
--                                                          Sau: 89
SELECT count(*) AS khong_bi_cham FROM phan_cong p
 WHERE NOT EXISTS (SELECT 1 FROM public.phan_cong_mig051_log l WHERE l.id = p.id);

\else
\echo 'Migration 051 chua ap: bo qua muc 6-9.'
\endif
