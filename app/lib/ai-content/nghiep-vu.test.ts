import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bamNoiDung, gioDiaPhuongSangUtc, kiemTraCongXuatBan, chuyenTheTheoQuyTac, kiemTraBienThe, chiaDoan,
  thoiGianCho, phanLoaiLoi, trangThaiSauLoi, aiContentBat, lyDoKhongDuocDuyet, duocSoan, coNhanAi, loiNhanAi, NHAN_AI_MAC_DINH, nhanAiTuCauHinh, chuyenTheTheoQuyTac as chuyenThe2,
  NGAN_CACH_CHUOI, kiemTraUrlBaiDang, SO_LAN_THU_TOI_DA, NHAN_AI, nguonGocHopLe, type DauVaoCong,
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
  assert.deepEqual(kiemTraCongXuatBan({ ...d, noiDungSeDang: `TIÊU ĐỀ\n\n(${NHAN_AI})\n\nNội dung.` }), [])
  // Vị trí (NĐ 142/2026 Đ18 k3 b): thông báo ở cuối bài một khối KHÔNG đạt theo cách đọc mặc định
  const cuoi = kiemTraCongXuatBan({ ...d, noiDungSeDang: `TIÊU ĐỀ\n\nĐoạn một.\n\nĐoạn hai.\n\n(${NHAN_AI})` })
  assert.equal(cuoi.length, 1); assert.match(cuoi[0], /Điều 18 khoản 3 điểm b/)
  assert.match(kiemTraCongXuatBan({ ...d, noiDungSeDang: 'Bài không có thông báo.' })[0], /Điều 11 khoản 3/)
  assert.equal(loiNhanAi(`${NHAN_AI}\n\nNội dung`), null, 'thông báo đứng đầu, không tiêu đề')
  assert.equal(loiNhanAi(`# Tiêu đề\n\n(Nội dung này được tạo ra hoặc chỉnh sửa\nbằng hệ thống trí tuệ nhân tạo.)\n\nThân`, NHAN_AI_MAC_DINH), null, 'câu bị ngắt dòng vẫn nhận ra')
  assert.equal(loiNhanAi(`${'x'.repeat(301)} ${NHAN_AI}`), 'sai_vi_tri', 'cùng đoạn nhưng quá xa đầu bài')
  assert.equal(loiNhanAi(`A\n\nB\n\n${NHAN_AI}`, NHAN_AI, 'bat_ky'), null, 'chế độ bat_ky (khi Pháp chế cho phép)')
  assert.equal(loiNhanAi('Nội dung có sử dụng AI hỗ trợ.'), 'thieu', 'câu gần giống không được tính')
  assert.equal(NHAN_AI_MAC_DINH, 'Nội dung này được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo.')
  // Codex vòng 5
  assert.equal(loiNhanAi('('.repeat(5000) + NHAN_AI), 'sai_vi_tri', '#1: dấu ngoặc đệm không được bỏ vô hạn')
  assert.equal(loiNhanAi(`# Tiêu đề\n\n<!--${NHAN_AI}-->\n\nThân`), 'bi_che', '#1: thông báo trong chú thích HTML không hiển thị')
  assert.equal(loiNhanAi(`<!-- ghi chú -->\n\n${NHAN_AI}\n\nThân`), null, 'chú thích đã đóng trước thông báo: hợp lệ')
  assert.equal(loiNhanAi(`Tiêu đề‮\n\n${NHAN_AI}`), 'bi_che', '#1: ký tự đổi hướng chữ đứng trước')
  assert.equal(loiNhanAi(`A\n\nB\n\n<!--${NHAN_AI}-->`, NHAN_AI, 'bat_ky'), 'bi_che', 'chế độ bat_ky vẫn không nhận thông báo bị che')
  // Codex vòng 6: phần tử ẩn, định nghĩa tham chiếu Markdown; chú thích chứa câu không làm hỏng thông báo thật phía sau.
  for (const vt of ['dau', 'bat_ky'] as const) {
    assert.equal(loiNhanAi(`<span style="display:none">${NHAN_AI}</span>\n\nThân`, NHAN_AI, vt), 'bi_che', `span ẩn (${vt})`)
    assert.equal(loiNhanAi(`<details><summary>Ghi chú</summary>${NHAN_AI}</details>\n\nThân`, NHAN_AI, vt), 'bi_che', `details (${vt})`)
    assert.equal(loiNhanAi(`[//]: # (${NHAN_AI})\n\nThân`, NHAN_AI, vt), 'bi_che', `tham chiếu Markdown (${vt})`)
    assert.equal(loiNhanAi(`Tiêu đề\n\n<!-- chưa đóng\n\n${NHAN_AI}`, NHAN_AI, vt), 'bi_che', `chú thích chưa đóng (${vt})`)
    assert.equal(loiNhanAi(`<!-- ${NHAN_AI} -->\n\n${NHAN_AI}\n\nThân`, NHAN_AI, vt), null, `chú thích chứa câu + câu hiển thị thật (${vt})`)
  }
  assert.equal(loiNhanAi(`\u{1F4E2}\u{FE0F} Thông báo lịch cắt nước\n\n${NHAN_AI}\n\nThân`), null, 'biểu tượng cảm xúc ở tiêu đề không bị coi là ký tự ẩn')
  assert.equal(loiNhanAi(`Chi phí < 5 triệu\n\n${NHAN_AI}\n\nThân`), null, 'dấu < thường trong tiêu đề không phải thẻ')
  for (const x of ['\u{3164}'.repeat(20), 'aa' + '\u{FE0F}'.repeat(20), 'Nội dung do AI tạo ra\u{E0041}\u{E0042} thật']) {
    assert.ok(nhanAiTuCauHinh(x).loi, 'câu cấu hình có ký tự hiển thị trống bị từ chối')
    assert.equal(nhanAiTuCauHinh(x).nhan, NHAN_AI_MAC_DINH)
  }
  assert.match(kiemTraCongXuatBan({ ...d, noiDungSeDang: `T\n\n<!--${NHAN_AI}-->` })[0], /Điều 18 khoản 3 điểm c/)
  assert.match(cuoi[0], /Theo quy định xuất bản của hệ thống/, '#9: không viết như thể luật bắt buộc đúng vị trí')
  for (const n of [298, 299, 300]) {
    assert.equal(loiNhanAi(chuyenThe2('website', 'x'.repeat(n), 'Thân bài.', true).split(NGAN_CACH_CHUOI)[0]), null, `#2: tiêu đề ${n} ký tự trên Website`)
    assert.equal(loiNhanAi(chuyenThe2('facebook', 'x'.repeat(n), 'Thân bài.', true)), null, `#2: tiêu đề ${n} ký tự trên Facebook`)
  }
  assert.equal(loiNhanAi(`T\n\n${NHAN_AI.normalize('NFD')}`), null, '#3: câu ở dạng NFD (chép từ trình soạn thảo)')
  assert.equal(loiNhanAi(`T\n\n${NHAN_AI.replace(/ /g, ' ')}`), null, '#3: dấu cách không ngắt')
  assert.equal(loiNhanAi(`T\n\n${NHAN_AI.replace('trí tuệ', 'trí​ tuệ')}`), 'thieu', 'ký tự zero-width chèn giữa câu: không nhận')
  assert.equal(nhanAiTuCauHinh(undefined).nhan, NHAN_AI_MAC_DINH)
  assert.equal(nhanAiTuCauHinh('   ').loi, null)
  for (const x of ['​', 'Ngắn quá', 'x'.repeat(201), '1234567890 1234567890 12', 'Nội dung do AI tạo​ ra, xin lưu ý khi đọc.'])
    assert.ok(nhanAiTuCauHinh(x).loi && nhanAiTuCauHinh(x).nhan === NHAN_AI_MAC_DINH, `#5: cấu hình không hợp lệ phải về mặc định: ${JSON.stringify(x).slice(0, 30)}`)
  assert.deepEqual(nhanAiTuCauHinh('  Nội dung này   do hệ thống trí tuệ nhân tạo tạo ra. '), { nhan: 'Nội dung này do hệ thống trí tuệ nhân tạo tạo ra.', loi: null })
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

test('nguồn gốc yêu cầu ghi: đúng host hoặc tên miền công khai sau reverse proxy; Origin lạ/"null" bị từ chối', () => {
  const host = ['localhost:3001', null, 'qlhtkt.htkt.com.vn']
  assert.equal(nguonGocHopLe(null, host), true)
  assert.equal(nguonGocHopLe('https://qlhtkt.htkt.com.vn', host), true)
  assert.equal(nguonGocHopLe('https://QLHTKT.htkt.com.vn', host), true)
  assert.equal(nguonGocHopLe('http://localhost:3001', host), true)
  assert.equal(nguonGocHopLe('https://evil.example', host), false)
  assert.equal(nguonGocHopLe('https://qlhtkt.htkt.com.vn.evil.example', host), false)
  assert.equal(nguonGocHopLe('null', host), false)
  assert.equal(nguonGocHopLe('https://a.vn', []), false)
})

test('kiemTraUrlBaiDang: đúng miền kênh, chặn miền lạ / lừa @ / http / kênh sai', () => {
  assert.equal(kiemTraUrlBaiDang('facebook', 'https://www.facebook.com/p/1'), 'https://www.facebook.com/p/1')
  assert.equal(kiemTraUrlBaiDang('facebook', ' https://m.facebook.com/x '), 'https://m.facebook.com/x')
  assert.equal(kiemTraUrlBaiDang('threads', 'https://www.threads.net/@a/post/1'), 'https://www.threads.net/@a/post/1')
  assert.equal(kiemTraUrlBaiDang('website', 'https://sxd.example.vn/tin/1'), 'https://sxd.example.vn/tin/1')
  for (const x of [
    'https://evil.example.com/x', 'https://facebook.com.evil.com/x', 'https://evilfacebook.com/x',
    'https://facebook.com@evil.com/x', 'https://user:pw@facebook.com/x', 'http://www.facebook.com/x', 'khong-phai-url', '',
  ]) assert.throws(() => kiemTraUrlBaiDang('facebook', x), Error, x)
  assert.equal(kiemTraUrlBaiDang('facebook', 'HTTPS://WWW.FACEBOOK.COM/permalink.php?story_fbid=1&id=2'), 'https://www.facebook.com/permalink.php?story_fbid=1&id=2')
  for (const x of ['https://www.facebook.com/p/1?access_token=abc', 'https://www.facebook.com/p/1?sig=xyz', 'https://www.facebook.com/p/1?api_key=1']) {
    assert.throws(() => kiemTraUrlBaiDang('facebook', x), /xác thực/, x)
  }
  assert.throws(() => kiemTraUrlBaiDang('facebook', 'https://www.facebook.com/p/1#access_token=abc'), /xác thực/)
  assert.throws(() => kiemTraUrlBaiDang('facebook', 'https://www.facebook.com/p/1?id=2&token=abc'), /xác thực/)
  assert.equal(kiemTraUrlBaiDang('website', 'https://sxd.vn/tin?postcode=1&design=2&utm_source=fb'), 'https://sxd.vn/tin?postcode=1&design=2&utm_source=fb')
  assert.throws(() => kiemTraUrlBaiDang('zalo', 'https://zalo.me/x'), /Kênh không hợp lệ/)
})

test('gộp lịch theo kênh: lần đăng lại đang chờ không biến bài một kênh thành "đăng một phần" (Codex vòng 5 #6)', async () => {
  const { gopTheoKenh, tongHopXuatBan } = await import('./trang-thai')
  const k = (channel: string, status: string) => ({ channel, status }) as { channel: string; status: 'PUBLISHED' }
  assert.equal(tongHopXuatBan(gopTheoKenh([k('facebook', 'PUBLISHED'), k('facebook', 'SCHEDULED')])), 'DA_DANG')
  assert.equal(tongHopXuatBan(gopTheoKenh([k('facebook', 'PUBLISHED'), k('facebook', 'PUBLISHED')])), 'DA_DANG')
  assert.equal(tongHopXuatBan(gopTheoKenh([k('facebook', 'PUBLISHED'), k('facebook', 'UNKNOWN_OUTCOME')])), 'CAN_DOI_SOAT')
  assert.equal(tongHopXuatBan(gopTheoKenh([k('facebook', 'PUBLISHED'), k('facebook', 'FAILED')])), 'DA_DANG')
  assert.equal(tongHopXuatBan(gopTheoKenh([k('facebook', 'PUBLISHED'), k('linkedin', 'SCHEDULED')])), 'DANG_MOT_PHAN')
  assert.deepEqual(gopTheoKenh([]), [])
})
