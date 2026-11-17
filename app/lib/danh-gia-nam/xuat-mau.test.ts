import { test } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'
import { buildMauCaNhan, buildMau03, buildMau01, buildMau04, type DuLieuCaNhan } from './xuat-mau.ts'

const chung = { 'I.1': 5, 'I.2': 5, 'II.1': 2.5, 'II.2': 2.5, 'II.3': 2.5, 'II.4': 2.5, 'III.1': 2, 'III.2': 2, 'III.3': 2.5, 'III.4': 2 }
const du: DuLieuCaNhan = {
  tenCoQuan: 'Sở Xây dựng', tenDonVi: 'Phòng Hạ tầng kỹ thuật', nam: 2026, hoTen: 'Cán bộ Thử', ngaySinh: '01/01/1990',
  chucVuChinhQuyen: 'Chuyên viên', viTriViecLam: 'Chuyên viên quản lý hạ tầng', donViCongTac: 'Phòng Hạ tầng kỹ thuật',
  tuDanhGia: 'Tôi hoàn thành nhiệm vụ.', nhanXet: { ket_qua_nhiem_vu: 'Được giao 5 nhiệm vụ; 3 đã hoàn thành.' },
  diemChung: chung, diemKpiTong: 80, nhanXetLanhDao: 'Chấp hành tốt.', mucPheDuyet: 'HOAN_THANH_TOT_NHIEM_VU', diemQuy: { I: 80, II: 82 },
}
async function chu(buf: Buffer): Promise<string> {
  const z = await JSZip.loadAsync(buf)
  return (await z.file('word/document.xml')!.async('string')).replace(/<[^>]+>/g, ' ')
}

test('xuất Mẫu 2B/2C/2A: giữ nguyên văn bản gốc, điền đúng điểm, không tự điền chỗ không có dữ liệu', async () => {
  for (const ma of ['2A', '2B', '2C'] as const) {
    const buf = await buildMauCaNhan(ma, du)
    assert.equal(buf.subarray(0, 2).toString(), 'PK')
    const t = await chu(buf)
    assert.match(t, new RegExp(`Mẫu số ${ma}`))
    assert.match(t, /BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN/)
    assert.match(t, /Cán bộ Thử/)
    assert.match(t, /Tổng cộng\s+30\s+28,5/)   // 28,5 = tổng điểm chung nhập
    assert.match(t, /56/)                       // 80 × 70/100
    assert.match(t, /Tổng điểm = Điểm tiêu chí chung \+ Điểm tiêu chí về kết quả thực hiện nhiệm vụ = 84,5/)
    assert.match(t, /☒\s+Hoàn thành tốt nhiệm vụ/)  // chỉ đánh dấu mức đã được phê duyệt
    assert.equal((t.match(/☒/g) ?? []).length, 1)   // mục "tự nhận" KHÔNG bị đánh dấu thay cá nhân
  }
  const t2c = await chu(await buildMauCaNhan('2C', du))
  assert.match(t2c, /Vị trí việc làm: Chuyên viên quản lý hạ tầng/)
  assert.doesNotMatch(t2c, /Chức vụ Đảng/)
  const t2a = await chu(await buildMauCaNhan('2A', du))
  assert.match(t2a, /Chức vụ Đảng/)
})

test('xuất Mẫu 03, 01 và 04', async () => {
  const t3 = await chu(await buildMau03(du))
  assert.match(t3, /PHIẾU XẾP LOẠI CHẤT LƯỢNG CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC/)
  assert.match(t3, /Cả năm\s+80\s+Hoàn thành tốt nhiệm vụ/)
  const t1 = await chu(await buildMau01({ tenCoQuan: 'Sở Xây dựng', tenDonVi: 'Sở', nam: 2026, tenTapThe: 'Phòng Hạ tầng kỹ thuật', duThaoNhanXet: ['Năm 2026, có 49 công việc.'] }))
  assert.match(t1, /BÁO CÁO KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG/)
  assert.match(t1, /49 công việc/)
  assert.equal((t1.match(/☒/g) ?? []).length, 0) // mức xếp loại tập thể do tập thể tự đề xuất, không điền sẵn
  const x = await buildMau04(2026, 'Cán bộ Thử', [{ nhiemVu: 'Thẩm định A' }, { nhiemVu: 'Dự thảo B' }])
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(x as unknown as ArrayBuffer)
  const ws = wb.worksheets[0]
  const cong = new Set<string>()
  ws.eachRow((row) => row.eachCell((c) => { { const f = (c.value as { formula?: string } | null)?.formula; if (f) cong.add(f.replace(/([A-Z])\d+/g, '$1N')) } }))
  assert.ok(cong.has('GN*FN') && cong.has('MAX(0,1-KN*0.25)') && cong.has('MIN(1,MAX(0,1-ON*0.05))'))
})
