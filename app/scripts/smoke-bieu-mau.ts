// Nghiệm thu lưu biểu mẫu (Mẫu 2A/2B/2C, 03, 04, 01, 05/06/07) — CHỈ chạy trên bản sao thử (tên CSDL chứa "thu").
//   JITI_ALIAS='{"@/":"C:/Troly/HTKT/app/","server-only":"<tệp rỗng .js>"}' DATABASE_URL=<bản sao> node_modules/.bin/jiti scripts/smoke-bieu-mau.ts
// Tạo dữ liệu thử rồi dọn lại; người dùng giả.
import { db } from '@/lib/db'
import type { CurrentUser } from '@/lib/auth'
import { taoHoSo, chuyenBuoc, layHoSoTheoId, layCanBo } from '@/lib/danh-gia-nam/may-chu'
import { luuBieuMauCaNhan, taoHoSoTapThe, luuTapThe, chuyenBuocTapThe, layHoSoTapThe, duLieuTongHopSo, quyenTapThe } from '@/lib/danh-gia-nam/may-chu-bieu-mau'
import { lapMau05, lapMau06 } from '@/lib/danh-gia-nam/bieu-mau-du-lieu'
import { duLieuXuatCaNhan } from '@/lib/danh-gia-nam/may-chu'
import { buildMauCaNhan, buildMau03, buildMau04, buildMau01, buildMau0506, buildMau07 } from '@/lib/danh-gia-nam/xuat-mau'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'

const NAM = 2026
let loi = 0
const ok = (c: boolean, ten: string, them = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${ten}${them ? ' — ' + them : ''}`); if (!c) loi++ }
const dbName = (await db.$queryRaw<{ d: string }[]>`select current_database() d`)[0].d
if (!/thu/i.test(dbName)) { console.error('Từ chối: không phải bản sao thử:', dbName); process.exit(2) }
console.log('CSDL:', dbName)

function nguoi(id: string, o: { toChucId?: string | null; lanhDaoSo?: boolean; quyen?: string[] } = {}): CurrentUser {
  return { id, email: `smoke-${id}@test`, name: 'Smoke', phone: null, isActive: true, lastLoginAt: null, createdAt: new Date(), wardId: null,
    toChucId: o.toChucId ?? null, departmentCode: o.lanhDaoSo ? 'LANH_DAO_SO' : 'X', isDepartmentLeader: false,
    role: { id: 'r', name: 'staff', permissions: [] }, permissions: o.quyen ?? ['office:menu_access'] } as unknown as CurrentUser
}
const tuDo = await db.user.findMany({ where: { canBo: { is: null } }, select: { id: true }, take: 2 }).catch(async () => {
  const dung = new Set((await db.canBo.findMany({ where: { userId: { not: null } }, select: { userId: true } })).map((c) => c.userId))
  return (await db.user.findMany({ select: { id: true }, take: 300 })).filter((u) => !dung.has(u.id)).slice(0, 2)
})
const thuKy = nguoi(tuDo[0].id, { quyen: ['office:menu_access', 'office:annual_evaluation_manage'] })
const giamDoc = nguoi(tuDo[1].id, { lanhDaoSo: true })
const ph = Object.fromEntries((await db.toChuc.findMany({ where: { ma: { in: ['PHONG_HTKT', 'PHONG_QL_VT'] } }, select: { id: true, ma: true } })).map((p) => [p.ma, p.id]))
const lay = async (phong: string, cd: string) => (await layCanBo((await db.canBo.findFirst({ where: { toChucId: ph[phong], trangThai: 'DANG_CONG_TAC', userId: { not: null }, chucDanh: { ma: cd } }, select: { id: true } }))!.id))!
const cv = await lay('PHONG_HTKT', 'CHUYEN_VIEN'), tp = await lay('PHONG_HTKT', 'TRUONG_PHONG'), tpQ = await lay('PHONG_QL_VT', 'TRUONG_PHONG')
const chinhChu = (c: typeof cv) => nguoi(c.userId!, { toChucId: c.toChucId })
const truongPhong = nguoi(tp.userId!, { toChucId: tp.toChucId })
const hsIds: string[] = []
const tapThe: string[] = []

try {
  const r0 = await taoHoSo(thuKy, cv.id, NAM, 'CBCCVC'); if (!r0.ok) throw new Error(r0.loi)
  let h = r0.hoSo; hsIds.push(h.id)
  ok(!(await luuBieuMauCaNhan(chinhChu(cv), h.id, 'phanA', { A_I_1: 'x' })).ok, 'Dự thảo: chính chủ chưa viết được phần A (chưa mở bước Tự đánh giá)')
  await chuyenBuoc(chinhChu(cv), h.id)
  const a = await luuBieuMauCaNhan(chinhChu(cv), h.id, 'phanA', { A_I_1: 'Chấp hành tốt kỷ luật.', A_I_2: 'Hoàn thành 3 hồ sơ thẩm định.', A_I_5: 'không thuộc 2C', la: 'x' })
  ok(a.ok && a.hoSo.bieuMau.phanA?.A_I_2 === 'Hoàn thành 3 hồ sơ thẩm định.' && a.hoSo.bieuMau.phanA?.A_I_5 === undefined, 'Mẫu 2C phần A: lưu đúng ô của mẫu, bỏ ô không thuộc mẫu')
  const a2 = await luuBieuMauCaNhan(chinhChu(cv), h.id, 'phanA', { A_VI: 'Nâng cao chất lượng.' })
  ok(a2.ok && a2.hoSo.bieuMau.phanA?.A_I_1 === 'Chấp hành tốt kỷ luật.' && !!a2.hoSo.bieuMau.phanA?.A_VI, 'lưu từng phần không xoá phần đã nhập trước')
  ok((await luuBieuMauCaNhan(chinhChu(cv), h.id, 'tuNhanMuc', { tuNhanMuc: 'HOAN_THANH_TOT_NHIEM_VU' })).ok, 'chính chủ tự nhận mức (khác mức đề xuất/phê duyệt)')
  ok(!(await luuBieuMauCaNhan(thuKy, h.id, 'phanA', { A_I_1: 'sửa hộ' })).ok, 'thư ký không viết hộ phần tự kiểm điểm')
  const m4 = await luuBieuMauCaNhan(chinhChu(cv), h.id, 'm04', { dong: {
    A: [{ nhiemVu: 'Dự thảo quy chế', diemDanhMuc: '400', soLuong: '1', hoanThanhThucTe: '1', soLanChinhSua: '1', soNgayCham: '0' }],
    B: [{ nhiemVu: 'Thẩm định hồ sơ', diemDanhMuc: '200', soLuong: '3', hoanThanhThucTe: '3', soLanChinhSua: '0', soNgayCham: '2' }, { nhiemVu: '' }],
  } })
  ok(m4.ok && m4.hoSo.bieuMau.m04?.B.length === 1 && m4.hoSo.diemKpiTong !== null, 'Mẫu 04: lưu dòng KPI, điểm KPI tổng TỰ TÍNH từ các dòng', m4.ok ? `KPI ${m4.hoSo.diemKpiTong}` : '')
  ok(!(await luuBieuMauCaNhan(chinhChu(cv), h.id, 'm04', { dong: { A: [{ nhiemVu: 'x', soLuong: '1', hoanThanhThucTe: '5' }], B: [] } })).ok, 'Mẫu 04: chặn số hoàn thành lớn hơn số giao')
  ok((await luuBieuMauCaNhan(chinhChu(cv), h.id, 'bangIII', { A_tong: '1', A_vuot: '0', B_tong: '3', B_vuot: '1', B_khongHoanThanh: '0' })).ok, 'bảng III (số nhiệm vụ vượt / không đạt) lưu được')
  ok(!(await luuBieuMauCaNhan(chinhChu(cv), h.id, 'm03', { mucQuy_I: 'HOAN_THANH_TOT_NHIEM_VU' })).ok, 'Mẫu 03 mức quý: chính chủ không được tự ghi')
  await chuyenBuoc(chinhChu(cv), h.id) // gửi nhận xét
  h = (await layHoSoTheoId(h.id))!
  ok(h.trangThai === 'GUI_NHAN_XET', 'tự kiểm điểm theo mẫu đủ điều kiện gửi nhận xét')
  ok(!(await luuBieuMauCaNhan(chinhChu(cv), h.id, 'phanA', { A_I_1: 'sửa sau khi gửi' })).ok, 'gửi rồi chính chủ không sửa phần A')
  ok((await luuBieuMauCaNhan(truongPhong, h.id, 'yKienDonViCauThanh', { noiDung: 'Ý kiến Trưởng phòng.' })).ok, 'Trưởng phòng ghi ý kiến (C.I)')
  const m3 = await luuBieuMauCaNhan(thuKy, h.id, 'm03', { mucQuy_I: 'HOAN_THANH_TOT_NHIEM_VU', mucQuy_II: 'HOAN_THANH_XUAT_SAC_NHIEM_VU', deXuatXuLy: 'Không' })
  ok(m3.ok && m3.hoSo.bieuMau.m03?.mucQuy?.II === 'HOAN_THANH_XUAT_SAC_NHIEM_VU', 'Mẫu 03: thư ký ghi mức từng quý và đề xuất xử lý')
  ok(!(await luuBieuMauCaNhan(nguoi('la'), h.id, 'm03', { mucQuy_I: 'x' })).ok, 'người ngoài thẩm quyền không ghi được biểu mẫu')
  ok(!(await luuBieuMauCaNhan(thuKy, h.id, 'yKienDonViCauThanh', { noiDung: 'thư ký ghi hộ' })).ok, 'Codex #3: thư ký không ghi được ý kiến dành cho người nhận xét (C.I)')
  const { luuNoiDung } = await import('@/lib/danh-gia-nam/may-chu')
  ok(!(await luuNoiDung(thuKy, h.id, { diemKpiTong: 100 })).ok, 'Codex #5: không nhập tay KPI lệch bảng Mẫu 04')
  ok((await luuBieuMauCaNhan(chinhChu(cv), h.id, 'phanA', { A_I_1: 'x'.repeat(9000) })).ok === false, 'Codex #16: ô quá dài bị báo lỗi, không cắt âm thầm')

  // Trưởng phòng QLVT (Mẫu 2B) để kiểm phần A 6 mục
  const rq = await taoHoSo(thuKy, tpQ.id, NAM, 'CBCCVC'); if (!rq.ok) throw new Error(rq.loi)
  hsIds.push(rq.hoSo.id)
  await chuyenBuoc(chinhChu(tpQ), rq.hoSo.id)
  const aq = await luuBieuMauCaNhan(chinhChu(tpQ), rq.hoSo.id, 'phanA', { A_I_5: 'Đổi mới cách điều hành.' })
  ok(rq.hoSo.mauApDung === '2B' && aq.ok && aq.hoSo.bieuMau.phanA?.A_I_5 === 'Đổi mới cách điều hành.', 'Trưởng phòng QLVT dùng Mẫu 2B, ghi được mục I.5 (lãnh đạo, quản lý)')

  // ── Mẫu 01 tập thể HTKT ──
  ok(!(await taoHoSoTapThe(chinhChu(cv), ph.PHONG_HTKT, NAM)).ok, 'chuyên viên không lập được báo cáo tập thể')
  const t0 = await taoHoSoTapThe(truongPhong, ph.PHONG_HTKT, NAM)
  ok(t0.ok, 'Trưởng phòng HTKT lập báo cáo tập thể (Mẫu 01)')
  if (t0.ok) {
    tapThe.push(t0.hoSo.id)
    ok(!(await quyenTapThe(truongPhong, ph.PHONG_QL_VT)).soan, 'Trưởng phòng HTKT không soạn được báo cáo tập thể của phòng QLVT')
    ok((await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'phanA', { A_I_2: 'Hoàn thành kế hoạch năm.' })).ok, 'Mẫu 01 phần A lưu được')
    ok(!(await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'diem', { tc_1: '6' })).ok, 'Mẫu 01: điểm tiêu chí > 5 bị chặn')
    ok((await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'diem', { tc_1: '5', tc_2: '5', tc_3: '4', tc_4: '5', tc_5: '5', tc_6: '4', kpiA: '9', kpiB: '85' })).ok, 'Mẫu 01: điểm 6 tiêu chí + KPI lưu được')
    ok(!(await chuyenBuocTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'trinh')).ok, 'chưa tự đề xuất mức thì chưa trình được')
    await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'mucTuDeXuat', { muc: 'HOAN_THANH_TOT_NHIEM_VU' })
    await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'diem', { tc_1: '5', kpiA: '10', kpiB: '90' })
    ok(!(await chuyenBuocTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'trinh')).ok, 'Codex #10: thiếu 5/6 tiêu chí chung thì không trình được')
    await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'diem', { tc_1: '5', tc_2: '5', tc_3: '4', tc_4: '5', tc_5: '5', tc_6: '4', kpiA: '9', kpiB: '85' })
    await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'mucTuDeXuat', { muc: 'HOAN_THANH_TOT_NHIEM_VU' })
    ok((await chuyenBuocTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'trinh')).ok, 'trình báo cáo tập thể')
    ok(!(await chuyenBuocTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'traVe', undefined, 'tự rút')).ok, 'Codex #2: người soạn không tự trả về (mở khoá) báo cáo đã trình')
    const caHai = nguoi(truongPhong.id, { toChucId: tp.toChucId, quyen: ['office:menu_access', 'office:annual_evaluation_approve'] })
    ok(!(await chuyenBuocTapThe(caHai, ph.PHONG_HTKT, NAM, 'duyet', 'HOAN_THANH_TOT_NHIEM_VU')).ok, 'Codex #1: người trình có thêm quyền phê duyệt vẫn không tự phê duyệt')
    ok(!(await luuTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'phanA', { A_I_1: 'sửa sau trình' })).ok, 'đã trình thì khoá nội dung')
    ok(!(await chuyenBuocTapThe(truongPhong, ph.PHONG_HTKT, NAM, 'duyet', 'HOAN_THANH_TOT_NHIEM_VU')).ok, 'Trưởng phòng không tự phê duyệt mức tập thể')
    ok(!(await chuyenBuocTapThe(giamDoc, ph.PHONG_HTKT, NAM, 'duyet')).ok, 'phê duyệt phải chọn mức')
    const dd = await chuyenBuocTapThe(giamDoc, ph.PHONG_HTKT, NAM, 'duyet', 'HOAN_THANH_NHIEM_VU')
    ok(dd.ok && dd.hoSo.mucPheDuyet === 'HOAN_THANH_NHIEM_VU' && dd.hoSo.mucTuDeXuat === 'HOAN_THANH_TOT_NHIEM_VU', 'lãnh đạo Sở phê duyệt; mức phê duyệt tách khỏi mức tự đề xuất')
  }

  // ── Xuất Word/Excel từ dữ liệu đã nhập ──
  const chu = async (b: Buffer) => (await (await JSZip.loadAsync(b)).file('word/document.xml')!.async('string')).replace(/<[^>]+>/g, ' ')
  const x = await duLieuXuatCaNhan(thuKy, h.id)
  if (x.ok) {
    const t2c = await chu(await buildMauCaNhan('2C', x.du))
    ok(t2c.includes('Hoàn thành 3 hồ sơ thẩm định.') && t2c.includes('Nâng cao chất lượng.'), 'Word Mẫu 2C có nội dung phần A đã nhập')
    ok(/☒\s+Hoàn thành tốt nhiệm vụ/.test(t2c), 'Word Mẫu 2C đánh dấu mức cá nhân tự nhận')
    ok(t2c.includes('Ý kiến Trưởng phòng.'), 'Word Mẫu 2C có ý kiến đơn vị cấu thành (C.I)')
    ok(/3\s+1 \(33,3%\)/.test(t2c), 'Word Mẫu 2C có bảng III (3 sản phẩm, 1 vượt = 33,3%)')
    const t03 = await chu(await buildMau03(x.du))
    ok(/II\s+.*Hoàn thành xuất sắc nhiệm vụ/.test(t03) && t03.includes('Không'), 'Word Mẫu 03 có mức từng quý và đề xuất xử lý')
    const m04 = x.hs.bieuMau.m04!
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load((await buildMau04(NAM, cv.hoTen, m04.A, m04.B)) as unknown as ArrayBuffer)
    const giaTri: unknown[] = []; wb.worksheets[0].eachRow((r) => r.eachCell((c) => giaTri.push(c.value)))
    ok(giaTri.includes('Dự thảo quy chế') && giaTri.includes('Thẩm định hồ sơ') && giaTri.includes(400) && giaTri.includes(200), 'Excel Mẫu 04 có đúng các dòng và số đã nhập')
    const wbB = new ExcelJS.Workbook(); await wbB.xlsx.load((await buildMau04(NAM, cv.hoTen, [], m04.B)) as unknown as ArrayBuffer)
    let tuThamChieu = false
    wbB.worksheets[0].eachRow((r, so) => r.eachCell((c, cot) => { const f = (c.value as { formula?: string } | null)?.formula; const o = `${String.fromCharCode(64 + cot)}${so}`; if (f && new RegExp(`\\b${o}\\b`).test(f)) tuThamChieu = true }))
    ok(!tuThamChieu, 'Codex #7: Excel Mẫu 04 khi nhóm A rỗng không có công thức tự tham chiếu')
  } else ok(false, 'lấy dữ liệu xuất', x.loi)
  const tt0 = await layHoSoTapThe(ph.PHONG_HTKT, NAM)
  if (tt0) {
    const t01 = await chu(await buildMau01({ tenCoQuan: 'Sở Xây dựng Quảng Trị', tenDonVi: 'Phòng HTKT', nam: NAM, tenTapThe: 'Phòng HTKT', duThaoNhanXet: [], bieuMau: tt0.bieuMau, mucTuDeXuat: tt0.mucTuDeXuat }))
    ok(t01.includes('Hoàn thành kế hoạch năm.') && /Tổng điểm\s+30 điểm\s+28/.test(t01) && /☒\s+Hoàn thành tốt nhiệm vụ/.test(t01), 'Word Mẫu 01 có phần A, điểm 6 tiêu chí (28) và mức tự đề xuất')
  }
  const b05 = await buildMau0506('05', NAM, 'Sở Xây dựng Quảng Trị', lapMau05([]))
  const b06 = await buildMau0506('06', NAM, 'Sở Xây dựng Quảng Trị', lapMau06([]))
  const b07 = await buildMau07(NAM, 'Sở Xây dựng Quảng Trị', [])
  ok((await chu(b05)).includes('CÁN BỘ, CÔNG CHỨC NĂM') && (await chu(b06)).includes('VIÊN CHỨC NĂM') && (await chu(b07)).includes('CBCCVC'), 'Word Mẫu 05, 06, 07 sinh được')

  // ── Mẫu 05/07: chỉ người đã phê duyệt ──
  const dsTruoc = await duLieuTongHopSo(NAM)
  ok(!dsTruoc.some((d) => d.hoTen === cv.hoTen), 'Mẫu 05/07: hồ sơ chưa phê duyệt không vào tổng hợp')
  const tt = await layHoSoTapThe(ph.PHONG_HTKT, NAM)
  ok(tt?.trangThai === 'DA_PHE_DUYET', 'trạng thái tập thể đã lưu trong CSDL')
  ok(lapMau05(dsTruoc).length === 2, 'Mẫu 05 có 2 dòng (CC lãnh đạo / không lãnh đạo) cho cấp Sở')
} finally {
  if (hsIds.length) await db.$executeRaw`delete from office_year_reviews where id = any(${hsIds})`
  if (tapThe.length) await db.$executeRaw`delete from office_year_dept_reviews where id = any(${tapThe})`
  console.log(`Đã dọn: ${hsIds.length} hồ sơ cá nhân, ${tapThe.length} hồ sơ tập thể`)
}
console.log(loi === 0 ? 'TẤT CẢ ĐẠT' : `${loi} KIỂM TRA KHÔNG ĐẠT`)
process.exit(loi === 0 ? 0 : 1)
