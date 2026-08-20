-- ROLLBACK cho 037_qd72_legal_criteria.sql
-- Chỉ gỡ các bảng cấu hình của phân hệ QĐ 72 (namespace qd72_*). Additive nên rollback
-- an toàn: không đụng bảng nào khác. Thứ tự DROP tôn trọng khóa ngoại.
DROP TABLE IF EXISTS qd72_technical_rules;
DROP TABLE IF EXISTS qd72_legal_documents;
