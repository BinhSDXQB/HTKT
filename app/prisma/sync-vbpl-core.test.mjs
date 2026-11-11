// Test cho phần quyết định của prisma/sync-vbpl.mjs (không chạm CSDL, không gọi OpenAI).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  docThamSo, lietKeTep, quyetDinhTheoTen, keHoachXoa, thuocKho, chonBanGhiCuaKho, maThoat, layKhoaChayDon,
  chuanHoaThuMuc, cungDanhSachDoan,
  THU_MUC_MAC_DINH,
} from './sync-vbpl-core.mjs'

const KHO = 'G:\\My Drive\\Tailieu_VBPL'

// ── BLOCKER 1: sửa nội dung, giữ tên ─────────────────────────────────
test('tệp sửa nội dung nhưng giữ tên → phải nạp lại nội dung (không giữ véc-tơ cũ)', () => {
  const row = { metadata: { fileHash: 'h-cu', noiDungHash: 'nd-cu', thuMuc: KHO } }
  assert.equal(quyetDinhTheoTen(row, { fileHash: 'h-moi', noiDungHash: 'nd-moi' }), 'nap_lai_noi_dung')
})
test('tệp lưu lại khác byte nhưng chữ y hệt → chỉ cập nhật mã băm, không nhúng lại', () => {
  const row = { metadata: { fileHash: 'h-cu', noiDungHash: 'nd', thuMuc: KHO } }
  assert.equal(quyetDinhTheoTen(row, { fileHash: 'h-moi', noiDungHash: 'nd' }), 'cap_nhat_meta')
})
test('bản ghi import cũ chưa có mã băm → nạp lại một lần (không "chứng nhận" đoạn cũ bằng mã băm mới)', () => {
  assert.equal(quyetDinhTheoTen({ metadata: null }, { fileHash: 'h', noiDungHash: 'nd' }), 'nap_lai_noi_dung')
})
test('mã băm trùng → đã có', () => {
  assert.equal(quyetDinhTheoTen({ metadata: { fileHash: 'h' } }, { fileHash: 'h', noiDungHash: 'x' }), 'da_co')
})

// ── BLOCKER 2: thư mục rỗng/thiếu → xoá mềm hàng loạt ────────────────
const managed = (n) => Array.from({ length: n }, (_, i) => ({ id: `id${i}`, nguon: `vb${i}.pdf` }))
test('thư mục rỗng mà kho đang có bản ghi → CHẶN xoá', () => {
  const k = keHoachXoa(managed(156), new Set(), { soTepQuetDuoc: 0 })
  assert.equal(k.xoa.length, 0)
  assert.ok(k.chan)
  assert.equal(k.duKien.length, 156)
})
test('liệt kê thiếu phần lớn (vượt ngưỡng) → CHẶN xoá', () => {
  const coMat = new Set(managed(156).slice(0, 100).map((m) => m.nguon))
  const k = keHoachXoa(managed(156), coMat, { soTepQuetDuoc: 100 })
  assert.equal(k.xoa.length, 0)
  assert.ok(k.chan)
})
test('gỡ vài tệp (dưới ngưỡng) → xoá bình thường', () => {
  const coMat = new Set(managed(156).slice(2).map((m) => m.nguon))
  const k = keHoachXoa(managed(156), coMat, { soTepQuetDuoc: 154 })
  assert.equal(k.chan, null)
  assert.deepEqual(k.xoa.map((m) => m.nguon), ['vb0.pdf', 'vb1.pdf'])
})
test('--allow-mass-delete cho phép vượt ngưỡng có chủ đích', () => {
  const k = keHoachXoa(managed(50), new Set(), { soTepQuetDuoc: 0, choPhepXoaNhieu: true })
  assert.equal(k.chan, null)
  assert.equal(k.xoa.length, 50)
})

test('chạy KHÔNG --recursive thì không gỡ bản ghi thư mục con do lần chạy --recursive nạp', () => {
  const rows = [...managed(156), ...Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, nguon: `sub/x${i}.pdf` }))]
  const coMat = new Set(managed(156).map((m) => m.nguon))
  const k = keHoachXoa(rows, coMat, { soTepQuetDuoc: 156 })
  assert.equal(k.duKien.length, 0)
  const k2 = keHoachXoa(rows, coMat, { soTepQuetDuoc: 156, deQuy: true })
  assert.equal(k2.duKien.length, 10)   // quét đệ quy mà thư mục con mất thật → mới xét gỡ
})
test('cùng thư mục viết khác (/ , dấu cuối, hoa/thường) vẫn là một kho', () => {
  assert.equal(docThamSo(['G:/My Drive/Tailieu_VBPL/']).folder, KHO)
  assert.equal(thuocKho({ metadata: { thuMuc: 'g:\\my drive\\tailieu_vbpl' } }, KHO), true)
})
test('gốc ổ đĩa giữ dấu "\\" (G: là thư mục hiện hành của ổ, không phải gốc)', () => {
  assert.equal(chuanHoaThuMuc('G:/'), 'G:\\')
  assert.equal(chuanHoaThuMuc('G:\\'), 'G:\\')
  assert.equal(chuanHoaThuMuc('\\\\may\\chia-se\\'), '\\\\may\\chia-se')
})
test('bản import cũ: đoạn đang lưu giống hệt đoạn tách mới → không cần nhúng lại', () => {
  assert.equal(cungDanhSachDoan(['a', 'b'], ['a', 'b']), true)
  assert.equal(cungDanhSachDoan(['a', 'b'], ['a', 'c']), false)
  assert.equal(cungDanhSachDoan([], []), false)   // không có đoạn nào → không coi là giống
})

// ── Quét đệ quy (tuỳ chọn) ───────────────────────────────────────────
test('mặc định chỉ quét cấp gốc; --recursive quét thư mục con, bỏ thư mục _ và .', () => {
  const goc = mkdtempSync(join(tmpdir(), 'vbpl-'))
  try {
    writeFileSync(join(goc, 'a.pdf'), 'x')
    mkdirSync(join(goc, '05_QLHDXD'))
    writeFileSync(join(goc, '05_QLHDXD', 'b.docx'), 'x')
    mkdirSync(join(goc, '05_QLHDXD', 'sau'))
    writeFileSync(join(goc, '05_QLHDXD', 'sau', 'c.pdf'), 'x')
    mkdirSync(join(goc, '_BanGoc'))
    writeFileSync(join(goc, '_BanGoc', 'd.pdf'), 'x')
    mkdirSync(join(goc, '.tmp'))
    writeFileSync(join(goc, '.tmp', 'e.pdf'), 'x')
    assert.deepEqual(lietKeTep(goc, { deQuy: false }).sort(), ['a.pdf'])
    assert.deepEqual(lietKeTep(goc, { deQuy: true }).sort(), ['05_QLHDXD/b.docx', '05_QLHDXD/sau/c.pdf', 'a.pdf'])
  } finally { rmSync(goc, { recursive: true, force: true }) }
})
test('thư mục không tồn tại → ném lỗi (dừng trước bước xoá)', () => {
  assert.throws(() => lietKeTep(join(tmpdir(), 'khong-co-thu-muc-nay-' + Date.now()), { deQuy: false }))
})

// ── HIGH: chống trùng phải giới hạn theo kho ─────────────────────────
test('bản ghi nhập tay (có người tạo) cùng tên KHÔNG thuộc kho', () => {
  assert.equal(thuocKho({ metadata: null, createdById: 'u1', loai: 'VB_PHAP_LUAT' }, KHO), false)
  assert.equal(thuocKho({ metadata: { thuMuc: 'D:\\khac' }, createdById: null, loai: 'VB_PHAP_LUAT' }, KHO), false)
  assert.equal(thuocKho({ metadata: { thuMuc: KHO }, createdById: null, loai: 'VB_PHAP_LUAT' }, KHO), true)
  // bản ghi script import cũ: không người tạo, không metadata, loại VB_PHAP_LUAT
  assert.equal(thuocKho({ metadata: null, createdById: null, loai: 'VB_PHAP_LUAT' }, KHO), true)
  assert.equal(thuocKho({ metadata: null, createdById: null, loai: 'KHAC' }, KHO), false)
})
test('bản import cũ KHÔNG thuộc kho thư mục khác (chạy sync với thư mục khác không gỡ/thay bản kho chính)', () => {
  assert.equal(thuocKho({ metadata: null, createdById: null, loai: 'VB_PHAP_LUAT' }, 'D:\\kho-khac'), false)
  assert.equal(thuocKho({ metadata: null, createdById: null, loai: 'VB_PHAP_LUAT' }, 'g:/my drive/tailieu_vbpl/'), true)
})
test('Drive lỗi chỉ trả tệp Excel báo cáo → đếm 0 tệp văn bản → CHẶN xoá', () => {
  const k = keHoachXoa(managed(3), new Set(['_BaoCao_KhoTaiLieu.xlsx']), { soTepQuetDuoc: 0 })
  assert.ok(k.chan)
  assert.equal(k.xoa.length, 0)
})
test('chonBanGhiCuaKho bỏ qua bản ghi ngoài kho', () => {
  const rows = [
    { id: 'tay', metadata: null, createdById: 'u1', loai: 'VB_PHAP_LUAT' },
    { id: 'kho', metadata: { thuMuc: KHO }, createdById: null, loai: 'VB_PHAP_LUAT' },
  ]
  assert.equal(chonBanGhiCuaKho(rows, KHO)?.id, 'kho')
  assert.equal(chonBanGhiCuaKho(rows.slice(0, 1), KHO), null)
})

// ── HIGH: khoá chạy đơn ──────────────────────────────────────────────
test('layKhoaChayDon dùng pg_try_advisory_lock và trả đúng kết quả', async () => {
  const goi = []
  const fake = (ok) => ({ query: async (sql, p) => { goi.push([sql, p]); return { rows: [{ ok }] } } })
  assert.equal(await layKhoaChayDon(fake(true)), true)
  assert.equal(await layKhoaChayDon(fake(false)), false)
  assert.match(goi[0][0], /pg_try_advisory_lock/)
})

// ── MEDIUM: mã thoát + cờ ────────────────────────────────────────────
test('có lỗi / hết hạn mức / bị chặn xoá → mã thoát 1; sạch → 0', () => {
  assert.equal(maThoat({ loi: 0, hetHanMuc: false, xoaBiChan: false }), 0)
  assert.equal(maThoat({ loi: 2, hetHanMuc: false, xoaBiChan: false }), 1)
  assert.equal(maThoat({ loi: 0, hetHanMuc: true, xoaBiChan: false }), 1)
  assert.equal(maThoat({ loi: 0, hetHanMuc: false, xoaBiChan: true }), 1)
})
test('cờ lạ (--plan, --dry) bị TỪ CHỐI, không chạy đồng bộ thật', () => {
  assert.ok(docThamSo(['--plan']).loi.length > 0)
  assert.ok(docThamSo(['--dry']).loi.length > 0)
  assert.ok(docThamSo(['a', 'b']).loi.length > 0)
})
test('cờ hợp lệ được đọc đúng', () => {
  const t = docThamSo(['--report'])
  assert.deepEqual(t.loi, [])
  assert.equal(t.reportOnly, true)
  assert.equal(t.folder, THU_MUC_MAC_DINH)
  const t2 = docThamSo(['--recursive', '--allow-mass-delete', 'D:\\kho'])
  assert.deepEqual([t2.deQuy, t2.choPhepXoaNhieu, t2.folder, t2.reportOnly], [true, true, 'D:\\kho', false])
})
