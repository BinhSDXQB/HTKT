import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bamNoiDung, gioDiaPhuongSangUtc, kiemTraCongXuatBan, chuyenTheTheoQuyTac, kiemTraBienThe, chiaDoan,
  thoiGianCho, phanLoaiLoi, trangThaiSauLoi, aiContentBat, lyDoKhongDuocDuyet, duocSoan, coNhanAi,
  NGAN_CACH_CHUOI, SO_LAN_THU_TOI_DA, NHAN_AI, type DauVaoCong,
} from './nghiep-vu'
import { duocChuyenNoiDung, duocChuyenLich, tongHopXuatBan } from './trang-thai'

const BAM = bamNoiDung('Tiêu đề', 'Nội dung')
const hopLe = (): DauVaoCong => ({
  phanLoai: 'PUBLIC', bamPhienBan: BAM, phienBanId: 'v1',
  pheDuyet: { quyetDinh: 'APPROVED', bam: BAM, phienBanId: 'v1' },
  nguon: [{ tieuDe: 'NĐ A', phamVi: 'CONG_KHAI', tinhTrangHieuLuc: 'con_hieu_luc' }],
  doAiTao: false, coTheGayNhamLan: false, noiDungSeDang: 'abc',
})

test('băm: ổn định với khác biệt xuống dòng, đổi khi nội dung đổi', () => {
  assert.equal(bamNoiDung('A', 'x\r\ny  '), bamNoiDung('A', 'x\ny'))
  assert.notEqual(bamNoiDung('A', 'x'), bamNoiDung('A', 'x.'))
  assert.notEqual(bamNoiDung('A', 'bc'), bamNoiDung('Ab', 'c'))
})

test('lịch: 08:30 giờ Việt Nam = 01:30 UTC (AT-07)', () => {
  assert.equal(gioDiaPhuongSangUtc('2026-11-12', '08:30').toISOString(), '2026-11-12T01:30:00.000Z')
  assert.equal(gioDiaPhuongSangUtc('2026-01-01', '00:15').toISOString(), '2025-12-31T17:15:00.000Z')
  assert.equal(gioDiaPhuongSangUtc('2026-07-01', '08:30', 'Europe/Paris').toISOString(), '2026-07-01T06:30:00.000Z')
  assert.throws(() => gioDiaPhuongSangUtc('2026-02-30', '08:30'))
  assert.throws(() => gioDiaPhuongSangUtc('12/11/2026', '08:30'))
  assert.throws(() => gioDiaPhuongSangUtc('2026-11-12', '25:00'))
})

test('cổng xuất bản: hợp lệ thì không có lý do chặn', () => {
  assert.deepEqual(kiemTraCongXuatBan(hopLe()), [])
})

test('cổng xuất bản: chặn khi chưa duyệt / từ chối / thu hồi (AT-06, AT-12)', () => {
  assert.ok(kiemTraCongXuatBan({ ...hopLe(), pheDuyet: null }).length > 0)
  for (const q of ['REJECTED', 'REVOKED', '']) {
    assert.ok(kiemTraCongXuatBan({ ...hopLe(), pheDuyet: { quyetDinh: q, bam: BAM, phienBanId: 'v1' } }).length > 0, q)
  }
})

test('cổng xuất bản: chặn khi nội dung đổi sau duyệt hoặc duyệt của phiên bản khác', () => {
  assert.ok(kiemTraCongXuatBan({ ...hopLe(), bamPhienBan: bamNoiDung('Tiêu đề', 'Nội dung!') }).length > 0)
  assert.ok(kiemTraCongXuatBan({ ...hopLe(), phienBanId: 'v2' }).length > 0)
})

test('cổng xuất bản: chặn dữ liệu nội bộ, nguồn hết hiệu lực, nguồn đã gỡ (AT-14)', () => {
  for (const pl of ['INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', '', 'public']) {
    assert.ok(kiemTraCongXuatBan({ ...hopLe(), phanLoai: pl }).length > 0, pl)
  }
  const n = (o: object) => ({ ...hopLe(), nguon: [{ tieuDe: 'X', phamVi: 'CONG_KHAI', tinhTrangHieuLuc: 'con_hieu_luc', ...o }] })
  assert.ok(kiemTraCongXuatBan(n({ phamVi: 'NOI_BO_SO' })).length > 0)
  for (const t of ['het_hieu_luc', 'du_thao', 'can_kiem_chung']) assert.ok(kiemTraCongXuatBan(n({ tinhTrangHieuLuc: t })).length > 0, t)
  assert.ok(kiemTraCongXuatBan(n({ daXoa: true })).length > 0)
})

test('cổng xuất bản: nội dung AI có thể gây nhầm lẫn phải có nhãn', () => {
  const d = { ...hopLe(), doAiTao: true, coTheGayNhamLan: true }
  assert.ok(kiemTraCongXuatBan({ ...d, noiDungSeDang: 'Ai cũng biết điều này' }).length > 0)
  assert.deepEqual(kiemTraCongXuatBan({ ...d, noiDungSeDang: `Bài viết. (${NHAN_AI})` }), [])
  assert.deepEqual(kiemTraCongXuatBan({ ...d, coTheGayNhamLan: false, noiDungSeDang: 'x' }), [])
  // Chỉ nhắc tới AI / trí tuệ nhân tạo không phải là thông báo chuẩn
  assert.ok(kiemTraCongXuatBan({ ...d, noiDungSeDang: 'Hội thảo về AI và trí tuệ nhân tạo trong xây dựng' }).length > 0)
  // Chuỗi nhiều bài: thông báo chỉ ở bài cuối thì vẫn chặn
  assert.ok(kiemTraCongXuatBan({ ...d, noiDungSeDang: `Bài 1${NGAN_CACH_CHUOI}Bài 2 (${NHAN_AI})` }).length > 0)
  assert.deepEqual(kiemTraCongXuatBan({ ...d, noiDungSeDang: `Bài 1 (${NHAN_AI})${NGAN_CACH_CHUOI}Bài 2` }), [])
  assert.equal(coNhanAi('ai đó đã nói'), false)
})

test('chuyển thể: Threads chia chuỗi trong giới hạn, có nhãn AI khi yêu cầu', () => {
  const dai = Array.from({ length: 60 }, (_, i) => `Câu số ${i} của bài viết khá dài.`).join(' ')
  const t = chuyenTheTheoQuyTac('threads', 'Thông báo', dai, true)
  const doan = t.split(NGAN_CACH_CHUOI)
  assert.ok(doan.length > 1)
  for (const d of doan) assert.ok(d.length <= 500, String(d.length))
  assert.deepEqual(kiemTraBienThe('threads', t), [])
  assert.ok(coNhanAi(doan[0]), 'thông báo AI phải ở bài đầu của chuỗi')
  assert.ok(kiemTraBienThe('threads', 'x'.repeat(501)).length > 0)
  assert.ok(kiemTraBienThe('facebook', '   ').length > 0)
})

test('chuyển thể: Facebook bỏ markdown, Website giữ markdown', () => {
  const fb = chuyenTheTheoQuyTac('facebook', 'Tin', '## Mục\n**đậm** và [liên kết](https://a.vn)', false)
  assert.ok(!fb.includes('**') && !fb.includes('##') && fb.includes('https://a.vn'))
  assert.ok(chuyenTheTheoQuyTac('website', 'Tin', '**đậm**', false).startsWith('# Tin'))
})

test('chia đoạn: không mất ký tự chữ, không đoạn nào vượt giới hạn', () => {
  const s = 'Một hai ba bốn năm sáu bảy tám chín mười. '.repeat(40)
  const d = chiaDoan(s, 120)
  assert.ok(d.every((x) => x.length <= 120))
  assert.equal(d.join(' ').replace(/\s+/g, ' ').trim(), s.replace(/\s+/g, ' ').trim())
})

test('thử lại: backoff tăng, có trần, jitter trong khoảng', () => {
  assert.equal(thoiGianCho(1, () => 0), 60_000)
  assert.equal(thoiGianCho(3, () => 0), 240_000)
  assert.equal(thoiGianCho(20, () => 0), 3_600_000)
  assert.equal(thoiGianCho(1, () => 1), 72_000)
})

test('lỗi đăng: timeout sau khi đã gửi = không rõ kết quả, không tự đăng lại (AT-10)', () => {
  assert.equal(phanLoaiLoi({ ma: 'TIMEOUT', daGui: true }), 'KHONG_RO')
  assert.equal(phanLoaiLoi({ httpStatus: 502, daGui: true }), 'KHONG_RO')
  assert.equal(phanLoaiLoi({ ma: 'ECONNREFUSED', daGui: false }), 'TAM_THOI')
  assert.equal(phanLoaiLoi({ httpStatus: 429 }), 'TAM_THOI')
  assert.equal(phanLoaiLoi({ httpStatus: 403 }), 'VINH_VIEN')
  assert.equal(trangThaiSauLoi('KHONG_RO', 0), 'UNKNOWN_OUTCOME')
  assert.equal(trangThaiSauLoi('TAM_THOI', 1), 'RETRY_PENDING')
  assert.equal(trangThaiSauLoi('TAM_THOI', SO_LAN_THU_TOI_DA), 'FAILED')
  assert.equal(trangThaiSauLoi('VINH_VIEN', 0), 'FAILED')
})

test('cờ tính năng: mặc định tắt (AT-15)', () => {
  assert.equal(aiContentBat({}), false)
  assert.equal(aiContentBat({ AI_CONTENT_ENABLED: '0' }), false)
  assert.equal(aiContentBat({ AI_CONTENT_ENABLED: 'yes' }), false)
  assert.equal(aiContentBat({ AI_CONTENT_ENABLED: '1' }), true)
  assert.equal(aiContentBat({ AI_CONTENT_ENABLED: ' 1 ' }), true)
  assert.equal(aiContentBat({ AI_CONTENT_ENABLED: 'true' }), false)
})

test('quyền: bốn mắt và vai trò duyệt', () => {
  const ld = { id: 'u1', laAdmin: false, laVanPhong: false, laLanhDao: true }
  const vp = { id: 'u2', laAdmin: false, laVanPhong: true, laLanhDao: false }
  const thuong = { id: 'u3', laAdmin: false, laVanPhong: false, laLanhDao: false }
  assert.equal(lyDoKhongDuocDuyet(ld, 'u2'), null)
  assert.ok(lyDoKhongDuocDuyet(ld, 'u1'))
  assert.ok(lyDoKhongDuocDuyet(vp, 'u1'))
  assert.equal(duocSoan(vp), true)
  assert.equal(duocSoan(thuong), false)
})

test('máy trạng thái nội dung', () => {
  assert.ok(duocChuyenNoiDung('DRAFT', 'PENDING_REVIEW'))
  assert.ok(duocChuyenNoiDung('PENDING_REVIEW', 'APPROVED'))
  assert.ok(duocChuyenNoiDung('APPROVED', 'DRAFT'))
  assert.ok(!duocChuyenNoiDung('DRAFT', 'APPROVED'))
  assert.ok(!duocChuyenNoiDung('REJECTED', 'APPROVED'))
  assert.ok(!duocChuyenNoiDung('CANCELLED', 'DRAFT'))
})

test('máy trạng thái lịch: không tự đăng lại từ UNKNOWN_OUTCOME, PUBLISHED là cuối', () => {
  assert.ok(duocChuyenLich('SCHEDULED', 'PUBLISHING'))
  assert.ok(duocChuyenLich('RETRY_PENDING', 'PUBLISHING'))
  assert.ok(!duocChuyenLich('UNKNOWN_OUTCOME', 'PUBLISHING'))
  assert.ok(!duocChuyenLich('UNKNOWN_OUTCOME', 'RETRY_PENDING'))
  assert.ok(!duocChuyenLich('PUBLISHED', 'PUBLISHING'))
  assert.ok(!duocChuyenLich('SCHEDULED', 'PUBLISHED'))
  assert.ok(!duocChuyenLich('CANCELLED', 'SCHEDULED'))
})

test('tổng hợp nhiều kênh suy ra động (AT-11)', () => {
  assert.equal(tongHopXuatBan([]), 'CHUA_DAT_LICH')
  assert.equal(tongHopXuatBan(['PUBLISHED', 'PUBLISHED']), 'DA_DANG')
  assert.equal(tongHopXuatBan(['PUBLISHED', 'FAILED']), 'DANG_MOT_PHAN')
  assert.equal(tongHopXuatBan(['PUBLISHED', 'UNKNOWN_OUTCOME']), 'CAN_DOI_SOAT')
  assert.equal(tongHopXuatBan(['SCHEDULED', 'CANCELLED']), 'DA_DAT_LICH')
  assert.equal(tongHopXuatBan(['FAILED', 'SCHEDULED']), 'LOI')
  assert.equal(tongHopXuatBan(['CANCELLED', 'EXPIRED']), 'DA_HUY')
})
