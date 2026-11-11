import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tachSoHieu, locTheoSoHieu, soHieuKhongMauThuan } from './so-hieu-van-ban'

const dong = (tieuDe: string, nguon = tieuDe + '.docx') => ({ tieuDe, nguon })

test('tách số hiệu kèm loại + cơ quan', () => {
  assert.deepEqual(tachSoHieu('73/2026/TT-BXD'), { so: '73', nam: '2026', kyHieu: ['TT', 'BXD'] })
  assert.deepEqual(tachSoHieu('Nghị định 217/2026/NĐ-CP'), { so: '217', nam: '2026', kyHieu: ['ND', 'CP'] })
  assert.deepEqual(tachSoHieu('Luật 22/2023/QH15'), { so: '22', nam: '2023', kyHieu: ['QH15'] })
  assert.deepEqual(tachSoHieu('NĐ 217/2026'), { so: '217', nam: '2026', kyHieu: [] })
  assert.equal(tachSoHieu('không có số'), null)
})

test('hỏi 73/2026/TT-BXD KHÔNG được trả 73/2026/TT-BTC', () => {
  const rows = [dong('73 2026 TT-BTC 712590'), dong('73 2026 TT-BXD 727826')]
  const r = locTheoSoHieu(rows, tachSoHieu('73/2026/TT-BXD')!)
  assert.deepEqual(r.phuHop.map((x) => x.tieuDe), ['73 2026 TT-BXD 727826'])
  assert.deepEqual(r.khacKyHieu.map((x) => x.tieuDe), ['73 2026 TT-BTC 712590'])
})

test('chỉ có văn bản khác cơ quan → phuHop rỗng', () => {
  const r = locTheoSoHieu([dong('73 2026 TT-BTC 712590')], tachSoHieu('73/2026/TT-BXD')!)
  assert.equal(r.phuHop.length, 0)
  assert.equal(r.khacKyHieu.length, 1)
})

test('dòng không rõ ký hiệu vẫn giữ nhưng tách riêng (chuaRo), xếp sau dòng khớp đủ', () => {
  const rows = [dong('Huong dan 73 2026', '73_2026_huong dan.pdf'), dong('73 2026 TT-BXD 727826')]
  const r = locTheoSoHieu(rows, tachSoHieu('73/2026/TT-BXD')!)
  assert.deepEqual(r.phuHop.map((x) => x.tieuDe), ['73 2026 TT-BXD 727826', 'Huong dan 73 2026'])
  assert.deepEqual(r.chuaRo.map((x) => x.tieuDe), ['Huong dan 73 2026'])
})

test('loại đứng TRƯỚC số (tên thật "TT_30_2026 BXD_…") — hỏi QĐ-UBND không được nhận, hỏi TT-BXD thì khớp', () => {
  const tt = dong('TT 30 2026 BXD quy dinh kiem dinh xe co gioi', 'TT_30_2026 BXD_ quy định trình tự, thủ tục kiểm định.pdf')
  const qd = locTheoSoHieu([tt], tachSoHieu('30/2026/QĐ-UBND')!)
  assert.equal(qd.phuHop.length, 0)
  assert.equal(qd.khacKyHieu.length, 1)
  assert.equal(locTheoSoHieu([tt], tachSoHieu('30/2026/TT-BXD')!).khop.length, 1)
})

test('soHieuKhongMauThuan cho nhánh danh mục/nhân sự', () => {
  const q = tachSoHieu('62/2020/TT-BXD')!
  assert.equal(soHieuKhongMauThuan('62/2020/TT-BXD', q), true)
  assert.equal(soHieuKhongMauThuan('62/2020/NĐ-CP', q), false)
  assert.equal(soHieuKhongMauThuan('115/2020/NĐ-CP', q), false)   // không có đúng số/năm trong số hiệu
  assert.equal(soHieuKhongMauThuan('62/2020/NĐ-CP', tachSoHieu('62/2020')!), true)
})

test('không nêu ký hiệu vẫn đòi đúng số/năm trong CHÍNH số hiệu (không nhận văn bản chỉ nhắc trong ghi chú)', () => {
  assert.equal(soHieuKhongMauThuan('Nghị định 217/2026/NĐ-CP', tachSoHieu('105/2025')!), false)
})

test('thiếu thành phần ≠ mâu thuẫn; tên loại đầy đủ cũng được nhận', () => {
  const q = tachSoHieu('30/2026/TT-BXD')!
  assert.equal(soHieuKhongMauThuan('TT_30_2026 BTC', q), false)          // cơ quan khác rõ ràng
  assert.equal(soHieuKhongMauThuan('Nghị định 30/2026', q), false)       // loại khác (viết đầy đủ)
  assert.equal(soHieuKhongMauThuan('Thông tư 30/2026/TT-BXD', q), true)
  assert.equal(soHieuKhongMauThuan('35/2026/NĐ', tachSoHieu('35/2026/NĐ-CP')!), true)   // chỉ thiếu cơ quan
  assert.equal(soHieuKhongMauThuan('Nghị định 35/2026 bổ sung', tachSoHieu('35/2026/NĐ-CP')!), true) // "BO SUNG" không phải cơ quan
  assert.equal(soHieuKhongMauThuan('Luật 22/2023/QH15', tachSoHieu('22/2023/QH15')!), true)
})

test('không nêu ký hiệu → giữ hành vi cũ (mọi dòng cùng số/năm)', () => {
  const rows = [dong('73 2026 TT-BTC 712590'), dong('73 2026 TT-BXD 727826')]
  const r = locTheoSoHieu(rows, tachSoHieu('73/2026')!)
  assert.equal(r.phuHop.length, 2)
  assert.equal(r.khacKyHieu.length, 0)
})

test('số đệm 0 và NĐ có dấu vẫn khớp', () => {
  const r = locTheoSoHieu([dong('Nghị định 035/2026/NĐ-CP')], tachSoHieu('35/2026/NĐ-CP')!)
  assert.equal(r.phuHop.length, 1)
})
