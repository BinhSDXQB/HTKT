-- 035: Lớp VIEW tổng hợp báo cáo hạ tầng phường/xã (rà soát CSDL 03/07/2026).
-- Một nguồn sự thật cho: dashboard, trang báo cáo, chatbot tool, xuất Excel.
-- Chỉ tính dữ liệu CHÍNH THỨC (status = 'DA_DUYET'). Idempotent (CREATE OR REPLACE).
-- Quy ước tên: v_htkt_<lĩnh vực>_xa = gộp theo xã/năm; v_htkt_tong_hop_xa = bảng tổng.

-- ── Đường giao thông ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_duong_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)                    AS so_tuyen,
       round(sum(r."chieuDaiKm")::numeric, 2) AS tong_km,
       round(avg(r."matM")::numeric, 1)       AS mat_duong_tb_m
FROM report_duong r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Điện chiếu sáng ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_dien_cs_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)                      AS so_tuyen,
       round(sum(r."chieuDaiCSKm")::numeric, 2) AS tong_km_chieu_sang,
       sum(r."soColDen")             AS tong_cot_den,
       count(*) FILTER (WHERE r."loaiDenChuan" ILIKE '%LED%') AS so_tuyen_led
FROM report_dien_cs r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Thoát nước ───────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_thoat_nuoc_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)                          AS so_tuyen,
       round((sum(r."chieuDaiM") / 1000)::numeric, 2) AS tong_km
FROM report_thoat_nuoc r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Cây xanh ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_cay_xanh_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)             AS so_tuyen,
       sum(r."soLuongCay")  AS tong_cay
FROM report_cay_xanh r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Công viên ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_cong_vien_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)                                AS so_cong_vien,
       round(sum(r."dienTichM2")::numeric, 0)  AS tong_dien_tich_m2,
       sum(r."soLuongCay")                     AS tong_cay
FROM report_cong_vien r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Cấp nước ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_cap_nuoc_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)              AS so_diem,
       sum(r."soHoGiaDinh")  AS tong_ho_dan
FROM report_cap_nuoc r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Bãi đỗ xe ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_bai_do_xe_xa AS
SELECT r."wardId", w.name AS ten_xa, r.year,
       count(*)                               AS so_bai,
       round(sum(r."dienTichM2")::numeric, 0) AS tong_dien_tich_m2,
       sum(r."soViTriDo")                     AS tong_vi_tri_do
FROM report_bai_do_xe r JOIN administrative_units w ON w.id = r."wardId"
WHERE r.status = 'DA_DUYET'
GROUP BY r."wardId", w.name, r.year;

-- ── Bảng tổng hợp toàn tỉnh theo xã/năm (FULL JOIN qua ward+year) ────────────
CREATE OR REPLACE VIEW v_htkt_tong_hop_xa AS
SELECT
  w.id   AS "wardId",
  w.name AS ten_xa,
  y.year,
  d.so_tuyen            AS duong_so_tuyen,
  d.tong_km             AS duong_km,
  cs.tong_km_chieu_sang AS chieu_sang_km,
  cs.tong_cot_den       AS cot_den,
  tn.tong_km            AS thoat_nuoc_km,
  cx.tong_cay           AS cay_xanh_cay,
  cv.so_cong_vien       AS cong_vien_so,
  cv.tong_dien_tich_m2  AS cong_vien_m2,
  cn.tong_ho_dan        AS cap_nuoc_ho_dan,
  bx.so_bai             AS bai_do_xe_so
FROM administrative_units w
CROSS JOIN (SELECT DISTINCT year FROM report_duong WHERE status = 'DA_DUYET'
            UNION SELECT DISTINCT year FROM report_dien_cs WHERE status = 'DA_DUYET') y
LEFT JOIN v_htkt_duong_xa      d  ON d."wardId" = w.id AND d.year = y.year
LEFT JOIN v_htkt_dien_cs_xa    cs ON cs."wardId" = w.id AND cs.year = y.year
LEFT JOIN v_htkt_thoat_nuoc_xa tn ON tn."wardId" = w.id AND tn.year = y.year
LEFT JOIN v_htkt_cay_xanh_xa   cx ON cx."wardId" = w.id AND cx.year = y.year
LEFT JOIN v_htkt_cong_vien_xa  cv ON cv."wardId" = w.id AND cv.year = y.year
LEFT JOIN v_htkt_cap_nuoc_xa   cn ON cn."wardId" = w.id AND cn.year = y.year
LEFT JOIN v_htkt_bai_do_xe_xa  bx ON bx."wardId" = w.id AND bx.year = y.year
WHERE w.type = 'PHUONG_XA'
  AND (d."wardId" IS NOT NULL OR cs."wardId" IS NOT NULL OR tn."wardId" IS NOT NULL
       OR cx."wardId" IS NOT NULL OR cv."wardId" IS NOT NULL OR cn."wardId" IS NOT NULL
       OR bx."wardId" IS NOT NULL);
