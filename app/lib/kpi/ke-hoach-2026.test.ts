// Toàn vẹn dữ liệu Phụ lục KPI đã trích từ PDF (lib/kpi/ke-hoach-2026.json). Chạy: npm test
// Số liệu đối chiếu: đếm số dòng nhiệm vụ của từng phòng trong bản PDF (QĐ 954/QĐ-SXD, phần A và B).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

type Nv = { id: string; phan: 'A' | 'B'; phong: string; ten: string; nguoi: { ten: string; vaiTro: string }[]; canhBao: string[] }
const nhiemVu: Nv[] = JSON.parse(readFileSync(fileURLToPath(new URL('./ke-hoach-2026.json', import.meta.url)), 'utf8')).nhiemVu

const A = { QLHDXD: 2, QHKT: 13, KTVLXD: 3, HTKT: 6, PTDT: 8, QLKCHTGT: 15, QLCLCTGT: 2, QLNTTBDS: 2, QLVT: 4, KHTC: 5, VP: 2 }
const B = { QLHDXD: 16, QHKT: 23, KTVLXD: 18, HTKT: 21, PTDT: 15, QLKCHTGT: 29, QLCLCTGT: 18, QLNTTBDS: 46, QLVT: 19, KHTC: 42, VP: 41 }

test('số nhiệm vụ mỗi phòng khớp bản PDF (A: 62, B: 288, tổng 350)', () => {
  for (const [phan, mau] of [['A', A], ['B', B]] as const) {
    for (const [phong, n] of Object.entries(mau)) {
      assert.equal(nhiemVu.filter((x) => x.phan === phan && x.phong === phong).length, n, `${phan}-${phong}`)
    }
  }
  assert.equal(nhiemVu.length, 350)
  assert.equal(new Set(nhiemVu.map((x) => x.id)).size, 350, 'id duy nhất')
})

test('83 cán bộ, mỗi phòng đúng số người; không còn tên viết sai chính tả của bản gốc', () => {
  const dem: Record<string, Set<string>> = {}
  for (const n of nhiemVu) for (const p of n.nguoi) (dem[n.phong] ??= new Set()).add(p.ten)
  const ky = Object.fromEntries(Object.entries(dem).map(([k, v]) => [k, v.size]))
  assert.deepEqual(ky, { QLHDXD: 8, QHKT: 8, KTVLXD: 7, HTKT: 6, PTDT: 7, QLKCHTGT: 9, QLCLCTGT: 7, QLNTTBDS: 6, QLVT: 9, KHTC: 10, VP: 6 })
  const tatCa = new Set(Object.values(dem).flatMap((v) => [...v]))
  for (const sai of ['Phạm Hũu Chung', 'Đăng Văn Xuân', 'Trần Hửu Sữu', 'Lê Văn Thuỷ']) assert.ok(!tatCa.has(sai), sai)
})

test('mọi nhiệm vụ có người thực hiện, trừ các ô đã biết ("Khi có yêu cầu")', () => {
  const khong = nhiemVu.filter((n) => n.nguoi.length === 0).map((n) => n.id)
  assert.deepEqual(khong, ['B-QLKCHTGT-025'])
})

test('cảnh báo trích xuất còn lại chỉ là hai trường hợp đã biết', () => {
  const cb = nhiemVu.filter((n) => n.canhBao.length).map((n) => n.id).sort()
  assert.deepEqual(cb, ['B-HTKT-004', 'B-QLKCHTGT-025'])
})

test('vai trò chủ trì chỉ có ở phòng Quản lý hoạt động xây dựng', () => {
  const ct = new Set(nhiemVu.filter((n) => n.nguoi.some((p) => p.vaiTro === 'CHU_TRI')).map((n) => n.phong))
  assert.deepEqual([...ct], ['QLHDXD'])
})
