// Unit test engine đánh giá sơ bộ QĐ72. Chạy: node --experimental-strip-types lib/qd72/danh-gia.test.ts
// Không cần test runner (Node 24 strip-types). Bao Mục 13 test 1–5.
import { danhGiaTieuChi, canhBaoChieuCaoThongThuy, trangThaiChuSoHuu, type TieuChi } from './danh-gia.ts'

let pass = 0, fail = 0
function eq(ten: string, thuc: unknown, mong: unknown) {
  if (thuc === mong) { pass++ }
  else { fail++; console.error(`✗ ${ten}: nhận '${String(thuc)}' ≠ mong '${String(mong)}'`) }
}
function ok(ten: string, dieuKien: boolean) {
  if (dieuKien) { pass++ } else { fail++; console.error(`✗ ${ten}`) }
}

const rong: TieuChi   = { maTieuChi: 'ROAD_MIN_WIDTH', ten: 'Chiều rộng', giaTri: 3.5, toanTu: '>=', donVi: 'm', trangThai: 'ACTIVE' }
const cao: TieuChi    = { maTieuChi: 'CLEARANCE_MIN_HEIGHT', ten: 'Chiều cao thông thủy', giaTri: 4.5, toanTu: '>=', donVi: 'm', trangThai: 'ACTIVE' }
const banKinh: TieuChi= { maTieuChi: 'WATER_SERVICE_RADIUS', ten: 'Bán kính phục vụ', giaTri: 400, toanTu: '<=', donVi: 'm', trangThai: 'ACTIVE' }
const truCach: TieuChi= { maTieuChi: 'HYDRANT_MAX_SPACING', ten: 'Khoảng cách trụ', giaTri: 150, toanTu: '<=', donVi: 'm', trangThai: 'ACTIVE' }
const doc: TieuChi    = { maTieuChi: 'APPROACH_MAX_SLOPE', ten: 'Độ dốc', giaTri: null, toanTu: '<=', donVi: 'tỉ lệ', trangThai: 'ACTIVE' }

// 1. Tiêu chí giao thông — chiều rộng
eq('rộng 3.0 < 3.5 → KHONG_DAT', danhGiaTieuChi(rong, 3.0).ketQua, 'KHONG_DAT')
eq('rộng 4.0 ≥ 3.5 → DAT',       danhGiaTieuChi(rong, 4.0).ketQua, 'DAT')

// 2. Chiều cao thông thủy 4,5 m + cảnh báo đúng câu chữ
eq('cao 3.8 < 4.5 → KHONG_DAT',  danhGiaTieuChi(cao, 3.8).ketQua, 'KHONG_DAT')
eq('cao 4.6 ≥ 4.5 → DAT',        danhGiaTieuChi(cao, 4.6).ketQua, 'DAT')
ok('cảnh báo 3.8 có nội dung 6.2.1.3', (canhBaoChieuCaoThongThuy(3.8, 4.5) ?? '').includes('6.2.1.3'))
eq('cao 4.6 → không cảnh báo',   canhBaoChieuCaoThongThuy(4.6, 4.5), null)

// 3. Thiếu dữ liệu → CHUA_DU_DU_LIEU, KHÔNG bao giờ KHONG_DAT
eq('rộng null → CHUA_DU_DU_LIEU', danhGiaTieuChi(rong, null).ketQua, 'CHUA_DU_DU_LIEU')
eq('cao undefined → CHUA_DU_DU_LIEU', danhGiaTieuChi(cao, undefined).ketQua, 'CHUA_DU_DU_LIEU')
eq('cao NaN → CHUA_DU_DU_LIEU',  danhGiaTieuChi(cao, NaN).ketQua, 'CHUA_DU_DU_LIEU')

// 4. Bán kính nguồn nước 400 m (<=)
eq('bán kính 350 ≤ 400 → DAT',   danhGiaTieuChi(banKinh, 350).ketQua, 'DAT')
eq('bán kính 450 > 400 → KHONG_DAT', danhGiaTieuChi(banKinh, 450).ketQua, 'KHONG_DAT')

// 5. Khoảng cách trụ 150 m (<=)
eq('trụ 120 ≤ 150 → DAT',        danhGiaTieuChi(truCach, 120).ketQua, 'DAT')
eq('trụ 180 > 150 → KHONG_DAT',  danhGiaTieuChi(truCach, 180).ketQua, 'KHONG_DAT')

// Bổ sung: ngưỡng phi số / ngừng áp dụng / chủ sở hữu / luôn "sơ bộ"
eq('độ dốc (ngưỡng phi số) → CHUA_DU_DU_LIEU', danhGiaTieuChi(doc, 5).ketQua, 'CHUA_DU_DU_LIEU')
eq('INACTIVE → KHONG_AP_DUNG',   danhGiaTieuChi({ ...rong, trangThai: 'INACTIVE' }, 4).ketQua, 'KHONG_AP_DUNG')
ok('kết quả luôn đánh dấu soBo', danhGiaTieuChi(rong, 4).soBo === true)
ok('chủ sở hữu chưa xác định',   trangThaiChuSoHuu(false).includes('Chưa xác định'))

console.log(`\nqd72/danh-gia: ${pass} PASS, ${fail} FAIL`)
if (fail > 0) process.exit(1)
