// Kiểm thử nhanh lớp nội dung chuyên môn HTKT (không gọi OpenAI, không cần CSDL).
// Chạy: node scripts/smoke-noi-dung-htkt.mjs
//
// Mục đích: bắt lỗi dữ liệu tĩnh (thiếu căn cứ, trùng khoá, tra cứu trả rỗng) — loại lỗi
// mà build TypeScript không thấy được.
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, { interopDefault: true })
const load = (p) => jiti(new URL(`../${p}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

const quyTrinh = load('lib/htkt/quy-trinh-linh-vuc.ts')
const phanCap = load('lib/htkt/phan-cap-cong-trinh.ts')
const quyHoach = load('lib/htkt/quy-hoach.ts')
const thongMinh = load('lib/htkt/ha-tang-thong-minh.ts')
const traCuu = load('lib/htkt/tra-cuu-nghiep-vu.ts')
const phapLy = load('lib/htkt/phap-ly.ts')

let dat = 0
let khong = 0
const kiem = (ten, ok, chiTiet = '') => {
  if (ok) { dat++; console.log(`✅ ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`) }
  else { khong++; console.log(`❌ ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`) }
}

const KEYS = phapLy.LINH_VUC_HTKT.map((l) => l.key)

// ── 1. Quy trình ────────────────────────────────────────────────────────────
const qt = quyTrinh.QUY_TRINH_LINH_VUC
kiem('Có ít nhất 9 quy trình', qt.length >= 9, `${qt.length} quy trình`)
kiem('Có quy trình KHUNG áp dụng mọi lĩnh vực', qt.filter((q) => q.apDungMoiLinhVuc).length >= 2)
kiem('Mọi lĩnh vực đều có ít nhất 1 quy trình dùng được', KEYS.every((l) => quyTrinh.quyTrinhTheoLinhVuc(l).length > 0))
kiem('Khoá quy trình không trùng', new Set(qt.map((q) => q.key)).size === qt.length)
kiem('Mọi quy trình đều gắn lĩnh vực hợp lệ', qt.every((q) => q.linhVuc.length && q.linhVuc.every((l) => KEYS.includes(l))))
kiem('Mọi quy trình đều có căn cứ', qt.every((q) => q.canCu?.length))
kiem('Mọi bước đều có nội dung', qt.every((q) => q.buoc.length && q.buoc.every((b) => b.ten && b.noiDung)))
const buocThieuCanCu = qt.flatMap((q) => q.buoc.filter((b) => !b.canCu).map((b) => `${q.key}#${b.buoc}`))
kiem('Mọi bước đều dẫn điều – khoản', buocThieuCanCu.length === 0, buocThieuCanCu.join(', '))

// Mốc thời gian phải khớp bản gốc NĐ 258/2025
const capPhep = qt.find((q) => q.key === 'cap-phep-chat-ha-cay-xanh')
kiem('Quy trình cấp phép chặt hạ có mốc 20/10 ngày làm việc',
  !!capPhep && JSON.stringify(capPhep).includes('20 ngày làm việc') && JSON.stringify(capPhep).includes('10 ngày làm việc'))
kiem('Giấy phép chặt hạ có thời hạn 30 ngày', !!capPhep && JSON.stringify(capPhep).includes('30 ngày'))
kiem('Có nêu Mẫu số 01 và Mẫu số 02 Phụ lục I', !!capPhep && JSON.stringify(capPhep).includes('Mẫu số 01') && JSON.stringify(capPhep).includes('Mẫu số 02'))

const csdl = qt.find((q) => q.key === 'csdl-bao-cao-cay-xanh')
kiem('Chế độ báo cáo có mốc 01/12 và 15/12', !!csdl && JSON.stringify(csdl).includes('01/12') && JSON.stringify(csdl).includes('15/12'))

// Lĩnh vực chưa đủ căn cứ phải KHÔNG có quy trình (tránh nói hai đằng)
const thieu = quyTrinh.CHUA_DU_CAN_CU.map((c) => c.linhVuc)
const mauThuan = thieu.filter((l) => quyTrinh.quyTrinhChuyenNganh(l).length > 0)
kiem('Lĩnh vực khai "chưa đủ căn cứ" thì không có quy trình CHUYÊN NGÀNH', mauThuan.length === 0, mauThuan.join(', '))
kiem('Khai đủ 5 lĩnh vực còn thiếu quy trình', thieu.length >= 5, `${thieu.length} lĩnh vực`)

// ── 2. Phân cấp công trình ──────────────────────────────────────────────────
const dongs = phanCap.BANG_1_3.flatMap((n) => n.dong)
// Bảng 1.3 gốc có 10 mục STT (1.3.1 … 1.3.10); ở đây 1.3.5/1.3.6/1.3.7 (nghĩa trang,
// nhà tang lễ, cơ sở hoả táng) gom chung 1 nhóm nên còn 8 nhóm / 19 dòng.
kiem('Bảng 1.3 đủ 8 nhóm và 19 dòng', phanCap.BANG_1_3.length === 8 && dongs.length === 19,
  `${phanCap.BANG_1_3.length} nhóm / ${dongs.length} dòng`)
kiem('Có đủ mục 1.3.1 … 1.3.10 (kể cả mục gộp)',
  ['1.3.1.1','1.3.1.2','1.3.2.1','1.3.2.5','1.3.3.2','1.3.4','1.3.5','1.3.6','1.3.7','1.3.8.3','1.3.9','1.3.10']
    .every((m) => dongs.some((d) => d.ma === m)))
kiem('Mọi dòng phân cấp có đúng 5 ô', dongs.every((d) => d.o.length === 5))
kiem('Mọi dòng có ít nhất 1 ô có giá trị', dongs.every((d) => d.o.some((v) => v)))
kiem('Mọi nhóm gắn lĩnh vực hợp lệ', phanCap.BANG_1_3.every((n) => KEYS.includes(n.linhVuc)))
kiem('Cột đèn chiếu sáng: ≤45 m là cấp IV', phanCap.KET_CAU_COT_HTKT.o[4] === '≤45')
kiem('Tra "chiếu sáng" ra dòng kết cấu cột', phanCap.timPhanCap('chiếu sáng').some((x) => x.dong.ma === '2.2.2'))
kiem('Tra "nhà máy nước" ra dòng 1.3.1.1', phanCap.timPhanCap('nhà máy nước').some((x) => x.dong.ma === '1.3.1.1'))
kiem('Tra từ khoá vô nghĩa KHÔNG kéo nhầm dòng cột đèn', !phanCap.timPhanCap('xyzzy').length)

// ── 3. Quy hoạch ────────────────────────────────────────────────────────────
kiem('Trình tự quy hoạch đủ 8 bước', quyHoach.TRINH_TU.length === 8, `${quyHoach.TRINH_TU.length} bước`)
kiem('Có đủ 8 chuyên ngành HTKT trong đồ án', quyHoach.CHUYEN_NGANH_HTKT_TRONG_DO_AN.length === 8)
kiem('Chuyên ngành gắn lĩnh vực hợp lệ',
  quyHoach.CHUYEN_NGANH_HTKT_TRONG_DO_AN.every((c) => !c.linhVucHtkt || KEYS.includes(c.linhVucHtkt)))
kiem('Mọi mục quy hoạch đều có căn cứ',
  [...quyHoach.LOAI_QUY_HOACH, ...quyHoach.DINH_NGHIA, ...quyHoach.AP_DUNG_TAI_TINH, ...quyHoach.YEU_CAU_HTKT_DOI_VOI_DO_AN, ...quyHoach.YEU_CAU_BAN_VE]
    .every((m) => m.canCu && m.noiDung))
kiem('Không còn trích dẫn "Điều 8" đã sửa thành Điều 7',
  !JSON.stringify(quyHoach.AP_DUNG_TAI_TINH).includes('Điều 8'))

// ── 4. Đô thị thông minh ────────────────────────────────────────────────────
const cs = thongMinh.CHI_SO_TRUONG_THANH
kiem('Có đủ 5 lĩnh vực HTKT thông minh (NĐ 269/2025 Điều 24)', thongMinh.LINH_VUC_THONG_MINH.length === 5)
kiem('Ký hiệu chỉ số không trùng', new Set(cs.map((c) => c.kyHieu)).size === cs.length)
kiem('Mọi chỉ số có cấp độ nền tảng', cs.every((c) => c.nenTang))
kiem('Có chỉ số chiếu sáng III.NL.06.01', cs.some((c) => c.kyHieu === 'III.NL.06.01'))
const csChieuSang = cs.find((c) => c.kyHieu === 'III.NL.06.01')
kiem('Chiếu sáng đủ cả 3 cấp độ', !!csChieuSang?.nenTang && !!csChieuSang?.lienKet && !!csChieuSang?.doiMoi)
kiem('Chỉ số gắn lĩnh vực hợp lệ', cs.every((c) => c.linhVucHtkt.every((l) => KEYS.includes(l))))
kiem('Có khai khoảng trống (cây xanh, thông số đèn, đề án tỉnh)', thongMinh.KHOANG_TRONG.length >= 3)
kiem('Lọc chỉ số theo lĩnh vực chiếu sáng có kết quả', thongMinh.chiSoTheoLinhVuc('chieu-sang').length >= 2)

// ── 5. Cổng tra cứu cho chatbot ─────────────────────────────────────────────
const caTest = [
  ['chặt hạ cây xanh', 'quy_trinh', ['20 ngày làm việc', 'Mẫu số 01']],
  ['chiếu sáng thông minh', 'thong_minh', ['III.NL.06.01', 'Điều 24 khoản 3']],
  ['nhà máy nước cấp mấy', 'phan_cap', ['1.3.1.1']],
  ['hạ tầng kỹ thuật khung', 'quy_hoach', ['144/2025', 'trục giao thông']],
]
for (const [hoi, chuDe, phaiCo] of caTest) {
  const kq = traCuu.traCuuNghiepVuHtkt(chuDe, hoi)
  const thieuTu = phaiCo.filter((t) => !kq.includes(t))
  kiem(`Tra cứu "${hoi}" (${chuDe})`, thieuTu.length === 0, thieuTu.length ? `thiếu: ${thieuTu.join(', ')}` : `${kq.length} ký tự`)
}
kiem('Tự đoán chủ đề: "chiếu sáng thông minh" → thong_minh', traCuu.doanChuDe('chiếu sáng thông minh') === 'thong_minh')
kiem('Tự đoán chủ đề: "thủ tục chặt hạ cây" → quy_trinh', traCuu.doanChuDe('thủ tục chặt hạ cây') === 'quy_trinh')
kiem('Tự đoán chủ đề: "cấp công trình" → phan_cap', traCuu.doanChuDe('cấp công trình xử lý nước thải') === 'phan_cap')
kiem('Tự đoán chủ đề: "đồ án quy hoạch phân khu" → quy_hoach', traCuu.doanChuDe('đồ án quy hoạch phân khu') === 'quy_hoach')
kiem('Câu chứa "cải tạo" KHÔNG bị đoán nhầm sang thong_minh', traCuu.doanChuDe('quy trình cải tạo công viên') !== 'thong_minh')

// Mọi kết quả tra cứu đều phải cảnh báo khoảng trống
for (const cd of ['quy_trinh', 'phan_cap', 'quy_hoach', 'thong_minh']) {
  const kq = traCuu.traCuuNghiepVuHtkt(cd, '')
  kiem(`Chủ đề "${cd}" trả về nội dung không rỗng`, kq.length > 200, `${kq.length} ký tự`)
}
kiem('Chủ đề quy_trinh có cảnh báo lĩnh vực thiếu căn cứ', traCuu.traCuuNghiepVuHtkt('quy_trinh', '').includes('⚠️'))
kiem('Chủ đề thong_minh có cảnh báo khoảng trống', traCuu.traCuuNghiepVuHtkt('thong_minh', '').includes('⚠️'))
kiem('Chủ đề quy_hoach có cảnh báo chưa đủ căn cứ', traCuu.traCuuNghiepVuHtkt('quy_hoach', '').includes('⚠️'))

console.log(`\nTỔNG: ${dat} đạt / ${khong} không đạt`)
process.exit(khong ? 1 : 0)
