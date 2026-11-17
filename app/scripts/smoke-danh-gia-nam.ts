// Kịch bản nghiệm thu PATCH V7.1.1 — CHỈ chạy trên bản sao thử (tên CSDL phải chứa "thu").
// Chạy (jiti, alias @/ và server-only):
//   JITI_ALIAS='{"@/":"C:/Troly/HTKT/app/","server-only":"<tệp rỗng .js>"}' DATABASE_URL=<bản sao> node_modules/.bin/jiti scripts/smoke-danh-gia-nam.ts
// Tạo dữ liệu thử có tiền tố SMOKE và dọn lại khi xong. Dùng người dùng giả (không đăng nhập thật).
import { db } from '@/lib/db'
import type { CurrentUser } from '@/lib/auth'
import { buildMauCaNhan, buildMau03, buildMau04 } from '@/lib/danh-gia-nam/xuat-mau'
import {
  taoHoSo, chuyenBuoc, luuNoiDung, soanTuDong, chayKiemTra, moHoSo, layCanBo, tongHopTheoPhong, traVeBuocTruoc, layHoSoTheoId, layDuKien, duLieuXuatCaNhan,
  type HoSoDanhGia,
} from '@/lib/danh-gia-nam/may-chu'

const NAM = 2026
let loi = 0
const ok = (c: boolean, ten: string, them = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${ten}${them ? ' — ' + them : ''}`); if (!c) loi++ }

const dbName = (await db.$queryRaw<{ d: string }[]>`select current_database() d`)[0].d
if (!/thu/i.test(dbName)) { console.error('Từ chối: không phải bản sao thử:', dbName); process.exit(2) }
console.log('CSDL:', dbName)

function nguoi(id: string, o: { toChucId?: string | null; truongPhong?: boolean; lanhDaoSo?: boolean; quyen?: string[] } = {}): CurrentUser {
  return {
    id, email: `smoke-${id}@test`, name: 'Smoke', phone: null, isActive: true, lastLoginAt: null, createdAt: new Date(), wardId: null,
    toChucId: o.toChucId ?? null, departmentCode: o.lanhDaoSo ? 'LANH_DAO_SO' : 'X', isDepartmentLeader: !!o.truongPhong,
    role: { id: 'r', name: 'staff', permissions: [] }, permissions: o.quyen ?? ['office:menu_access'],
  } as unknown as CurrentUser
}

const nguoiThat = await db.user.findMany({ select: { id: true }, take: 400 })
const dungChoCanBo = new Set((await db.canBo.findMany({ where: { userId: { not: null } }, select: { userId: true } })).map((c) => c.userId))
const roi = nguoiThat.filter((u) => !dungChoCanBo.has(u.id)).map((u) => u.id)
if (roi.length < 2) { console.error('Cần ít nhất 2 user không gắn cán bộ'); process.exit(2) }
const thuKy = nguoi(roi[0], { quyen: ['office:menu_access', 'office:annual_evaluation_manage'] })
const giamDoc = nguoi(roi[1], { lanhDaoSo: true })

const phongs = await db.toChuc.findMany({ where: { ma: { in: ['PHONG_HTKT', 'PHONG_QL_VT'] } }, select: { id: true, ma: true } })
const dauVet = { cv: [] as string[], nv: [] as string[], hs: [] as string[] }
const truocEval = new Set((await db.officeAnnualEvaluation.findMany({ where: { nam: NAM }, select: { id: true } })).map((e) => e.id))

type Ca = { cb: NonNullable<Awaited<ReturnType<typeof layCanBo>>>; loai: string }
const ca: Record<string, Ca> = {}
for (const p of phongs) {
  const ds = await db.canBo.findMany({ where: { toChucId: p.id, trangThai: 'DANG_CONG_TAC', userId: { not: null } }, select: { id: true, chucDanh: { select: { ma: true } } } })
  for (const ma of ['TRUONG_PHONG', 'PHO_TRUONG_PHONG', 'CHUYEN_VIEN']) {
    const x = ds.find((d) => d.chucDanh?.ma === ma)
    if (x) ca[`${p.ma}/${ma}`] = { cb: (await layCanBo(x.id))!, loai: ma }
  }
}
ok(Object.keys(ca).length === 6, 'đủ 6 ca: Trưởng phòng, Phó phòng, chuyên viên của 2 phòng', Object.keys(ca).join(', '))

const chinhChu = (c: Ca) => nguoi(c.cb.userId!, { toChucId: c.cb.toChucId, truongPhong: c.cb.laLanhDao })
const nguoiNhanXet = (c: Ca, p: string) => {
  // nhận xét: Trưởng phòng cùng phòng (với chính Trưởng phòng thì lãnh đạo Sở)
  const tp = ca[`${p}/TRUONG_PHONG`]
  return c.loai === 'TRUONG_PHONG' ? giamDoc : nguoi(tp.cb.userId!, { toChucId: tp.cb.toChucId, truongPhong: true })
}

const DIEM_CHUNG = { 'I.1': 5, 'I.2': 5, 'II.1': 2.5, 'II.2': 2.5, 'II.3': 2.5, 'II.4': 2.5, 'III.1': 2, 'III.2': 2, 'III.3': 2.5, 'III.4': 2 }

try {
  // ── Dữ liệu thử: việc có minh chứng, việc dở, khoá học đang học, khoá hoàn thành ──
  const cv = ca['PHONG_HTKT/CHUYEN_VIEN']
  const pt = phongs.find((p) => p.ma === 'PHONG_HTKT')!
  const mk = async (tt: 'HOAN_THANH' | 'DANG_LAM', tieuDe: string, dinhKem: string[], ma: string) => {
    const r = await db.congViec.create({ data: { maCongViec: ma, tieuDe, toChucId: pt.id, trangThai: tt, tienDo: tt === 'HOAN_THANH' ? 100 : 40, nguoiPhuTrachId: cv.cb.userId, ngayHetHan: new Date(Date.UTC(NAM, 8, 30)), dinhKem, createdById: thuKy.id } })
    dauVet.cv.push(r.id)
  }
  await mk('HOAN_THANH', 'SMOKE Thẩm định hồ sơ A', ['/tep/a.pdf'], 'CV-SMOKE-1')
  await mk('HOAN_THANH', 'SMOKE Báo cáo B (thiếu minh chứng)', [], 'CV-SMOKE-2')
  await mk('DANG_LAM', 'SMOKE Dự thảo quy chế C', [], 'CV-SMOKE-3')
  const dt = async (ma: string, tieuDe: string, ketQua: string, co: string) => {
    const r = await db.nghiepVuBanGhi.create({ data: { linhVuc: 'van-phong-so/dao-tao-boi-duong', maBanGhi: ma, tieuDe, trangThai: 'MOI', ngayGhiNhan: new Date(Date.UTC(NAM, 5, 1)), customFields: { hocVien: cv.cb.hoTen, ketQua, thoiLuongGio: 40, coChungChi: co, daUngDung: 'Có' } } })
    dauVet.nv.push(r.id)
  }
  await dt('NV-SMOKE-1', 'SMOKE Bồi dưỡng QLNN', 'Hoàn thành', 'Có')
  await dt('NV-SMOKE-2', 'SMOKE Tin học nâng cao (đang học)', 'Đang học', 'Chưa có')

  // ── Lập hồ sơ cho 6 ca; người không có quyền không lập được ──
  const nguoiLa = nguoi('khong-quyen')
  const thuLap = await taoHoSo(nguoiLa, cv.cb.id, NAM, 'CBCCVC')
  ok(!thuLap.ok, 'người không có quyền không lập được hồ sơ')
  const hs: Record<string, HoSoDanhGia> = {}
  for (const [k, c] of Object.entries(ca)) {
    const r = await taoHoSo(thuKy, c.cb.id, NAM, 'CBCCVC')
    if (r.ok) { hs[k] = r.hoSo; dauVet.hs.push(r.hoSo.id) }
  }
  ok(Object.keys(hs).length === 6, 'lập đủ 6 hồ sơ ở trạng thái Dự thảo', Object.values(hs).map((h) => h.mauApDung).join(','))
  ok(hs['PHONG_HTKT/TRUONG_PHONG'].mauApDung === '2B' && hs['PHONG_HTKT/CHUYEN_VIEN'].mauApDung === '2C', 'chọn đúng Mẫu 2B cho Trưởng phòng, 2C cho chuyên viên')

  // ── Chuyên viên: đi hết quy trình ──
  const key = 'PHONG_HTKT/CHUYEN_VIEN'
  let h = hs[key]
  const buoc = async (u: CurrentUser, muc?: string) => { const r = await chuyenBuoc(u, h.id, muc); if (r.ok) h = r.hoSo; return r }
  ok(!(await buoc(chinhChu(cv))).ok, 'chính chủ không được tự đẩy từ Dự thảo')
  ok((await buoc(thuKy)).ok && h.trangThai === 'TU_DANH_GIA', 'thư ký mở bước Tự đánh giá')
  ok(!(await buoc(chinhChu(cv))).ok, 'chưa tự đánh giá thì chưa gửi được')
  const sua0 = await luuNoiDung(thuKy, h.id, { tuDanhGia: 'giả mạo' })
  ok(!sua0.ok, 'thư ký không sửa hộ tự đánh giá')
  ok((await luuNoiDung(chinhChu(cv), h.id, { tuDanhGia: 'Tôi hoàn thành các nhiệm vụ được giao trong năm.' })).ok, 'chính chủ nhập tự đánh giá')
  ok(!(await luuNoiDung(chinhChu(cv), h.id, { diemKpiTong: 100 })).ok, 'chính chủ không sửa điểm')
  ok((await buoc(chinhChu(cv))).ok && h.trangThai === 'GUI_NHAN_XET', 'chính chủ gửi nhận xét')
  ok(!(await luuNoiDung(chinhChu(cv), h.id, { tuDanhGia: 'sửa sau khi gửi' })).ok, 'gửi rồi chính chủ không sửa tự đánh giá nữa')
  const nx = nguoiNhanXet(cv, 'PHONG_HTKT')
  ok((await luuNoiDung(nx, h.id, { nhanXetLanhDao: 'Cán bộ chấp hành tốt kỷ luật công vụ.' })).ok, 'Trưởng phòng nhập nhận xét')
  ok((await buoc(nx)).ok && h.trangThai === 'TONG_HOP', 'Trưởng phòng chuyển sang Tổng hợp')
  const soan = await soanTuDong(thuKy, h.id, 'CHI_TIET')
  ok(soan.ok, 'soạn nhận xét tự động (chi tiết)')
  if (soan.ok) {
    h = soan.hoSo
    const kq = h.nhanXet.find((d) => d.muc === 'ket_qua_nhiem_vu')!
    const dtd = h.nhanXet.find((d) => d.muc === 'dao_tao')!
    const duKien = await layDuKien(cv.cb, NAM)
    const nXong = duKien.congViec.filter((c) => c.trangThai === 'HOAN_THANH').length
    ok(kq.noiDung.includes(`${duKien.congViec.length} nhiệm vụ`) && kq.noiDung.includes(`${nXong} đã hoàn thành`) && duKien.congViec.length >= 3, 'nhận xét có số liệu nhiệm vụ thật khớp CSDL', kq.noiDung.slice(0, 100))
    ok(/1 đang học \(chưa tính hoàn thành\)/.test(dtd.noiDung) && /1 khoá đã cấp chứng chỉ/.test(dtd.noiDung), 'khoá đang học không tính hoàn thành', dtd.noiDung.slice(0, 80))
    ok(kq.nguon.length === duKien.congViec.length && dtd.nguon.length === 2, 'mỗi đoạn kèm nguồn (mọi việc, 2 khoá)')
    ok(h.nhanXet.every((d) => d.muc !== 'trach_nhiem_lanh_dao'), 'chuyên viên không có đoạn lãnh đạo, quản lý')
    ok(h.nhanXet.filter((d) => d.noiDung.includes('Chưa có dữ liệu')).length >= 3, 'phần không có dữ liệu ghi rõ chưa có, không bịa (thành tích, hạn chế…)')
  }
  const kt1 = await chayKiemTra(h, ca[key].cb)
  ok(kt1.some((v) => v.ma === 'THIEU_MINH_CHUNG' && /Báo cáo B/.test(v.viTri)), 'người thiếu minh chứng: kiểm tra nêu đúng nhiệm vụ', kt1.filter((v) => v.ma === 'THIEU_MINH_CHUNG').length + ' cảnh báo')
  // sửa tay MỘT đoạn rồi soạn lại: đoạn đã sửa giữ nguyên
  const { suaDoanNhanXet } = await import('@/lib/danh-gia-nam/may-chu')
  await suaDoanNhanXet(thuKy, h.id, 'phuong_huong', 'Phương hướng do thư ký viết tay.', ['tay'])
  const lai = await soanTuDong(thuKy, h.id, 'NGAN_GON')
  if (lai.ok) { h = lai.hoSo; ok(h.nhanXet.find((d) => d.muc === 'phuong_huong')!.noiDung === 'Phương hướng do thư ký viết tay.', 'soạn lại không ghi đè đoạn đã sửa tay') }
  ok((await luuNoiDung(thuKy, h.id, { diemChung: { ...DIEM_CHUNG, 'I.1': 9 } })).ok === false, 'điểm tiêu chí vượt tối đa bị từ chối')
  ok((await luuNoiDung(thuKy, h.id, { diemChung: DIEM_CHUNG, diemKpiTong: 88, mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU' })).ok, 'nhập điểm chung, KPI và mức đề xuất xuất sắc')
  h = (await layHoSoTheoId(h.id))!
  ok(Math.abs((h.tongDiem ?? 0) - (28.5 + 88 * 0.7)) < 0.01, 'tổng điểm = chung + KPI×70/100', String(h.tongDiem))
  ok((await buoc(thuKy)).ok && h.trangThai === 'HOP_DANH_GIA', 'sang Họp đánh giá')
  const chanTrinh = await buoc(thuKy)
  ok(!chanTrinh.ok, 'đề xuất xuất sắc không đủ điều kiện → chặn trình phê duyệt', !chanTrinh.ok ? chanTrinh.loi.slice(0, 110) : '')
  await luuNoiDung(thuKy, h.id, { mucDeXuat: 'HOAN_THANH_TOT_NHIEM_VU' })
  ok((await buoc(thuKy)).ok && h.trangThai === 'TRINH_PHE_DUYET', 'đề xuất hợp lệ → trình phê duyệt')
  ok(!(await luuNoiDung(thuKy, h.id, { diemKpiTong: 100 })).ok, 'đã trình thì khoá nội dung')
  ok(!(await buoc(thuKy, 'HOAN_THANH_TOT_NHIEM_VU')).ok, 'thư ký không có quyền phê duyệt')
  ok(!(await buoc(nx, 'HOAN_THANH_TOT_NHIEM_VU')).ok, 'Trưởng phòng không tự có quyền phê duyệt')
  ok(!(await buoc(giamDoc)).ok, 'phê duyệt mà không chọn mức bị từ chối')
  const eval0 = await db.officeAnnualEvaluation.count({ where: { canBoId: cv.cb.id, nam: NAM } })
  ok(eval0 === 0, 'trước phê duyệt chưa có xếp loại chính thức trong office_annual_evaluations')
  ok((await buoc(giamDoc, 'HOAN_THANH_TOT_NHIEM_VU')).ok && h.trangThai === 'DA_PHE_DUYET', 'Giám đốc phê duyệt với mức do chính người duyệt chọn')
  const eval1 = await db.officeAnnualEvaluation.findUnique({ where: { canBoId_nam: { canBoId: cv.cb.id, nam: NAM } } })
  ok(eval1?.mucXepLoai === 'HOAN_THANH_TOT_NHIEM_VU', 'chỉ sau phê duyệt mới ghi xếp loại chính thức')
  ok(!(await traVeBuocTruoc(giamDoc, h.id, 'thử')).ok, 'hồ sơ đã phê duyệt không trả về được')
  ok((await buoc(thuKy)).ok && h.trangThai === 'LUU_HO_SO', 'thư ký lưu hồ sơ')

  // ── Xuất biểu mẫu từ hồ sơ thật (đã phê duyệt) ──
  const xu = await duLieuXuatCaNhan(giamDoc, h.id)
  ok(xu.ok, 'lãnh đạo Sở lấy được dữ liệu xuất của hồ sơ')
  if (xu.ok) {
    const w = await buildMauCaNhan(xu.hs.mauApDung as '2C', xu.du)
    const x3 = await buildMau03(xu.du); const x4 = await buildMau04(NAM, xu.cb.hoTen, xu.tenNhiemVu.map((t) => ({ nhiemVu: t })))
    ok(xu.hs.mauApDung === '2C' && w.length > 5000 && x3.length > 3000 && x4.length > 3000, 'sinh được Mẫu 2C, 03, 04 từ hồ sơ thật', `${w.length}/${x3.length}/${x4.length} byte`)
    ok(xu.du.mucPheDuyet === 'HOAN_THANH_TOT_NHIEM_VU' && xu.du.nhanXet?.ket_qua_nhiem_vu !== undefined, 'dữ liệu xuất mang mức đã phê duyệt và nhận xét thật')
  }
  ok(!(await duLieuXuatCaNhan(nguoi('la'), h.id)).ok, 'người ngoài thẩm quyền không xuất được')

  // ── Phê duyệt kép đồng thời: chỉ MỘT người thắng, mức chính thức không bị người thua ghi đè ──
  const pq = ca['PHONG_QL_VT/PHO_TRUONG_PHONG']; let p2 = hs['PHONG_QL_VT/PHO_TRUONG_PHONG']
  const nxQ = nguoiNhanXet(pq, 'PHONG_QL_VT')
  const dem = async (u: CurrentUser) => { const r = await chuyenBuoc(u, p2.id); if (r.ok) p2 = r.hoSo; return r.ok }
  await dem(thuKy); await luuNoiDung(chinhChu(pq), p2.id, { tuDanhGia: 'Tự đánh giá Phó phòng.' }); await dem(chinhChu(pq))
  await luuNoiDung(nxQ, p2.id, { nhanXetLanhDao: 'Nhận xét.' }); await dem(nxQ)
  await luuNoiDung(thuKy, p2.id, { diemChung: DIEM_CHUNG, diemKpiTong: 80, mucDeXuat: 'HOAN_THANH_TOT_NHIEM_VU' })
  await dem(thuKy); await dem(thuKy)
  ok(p2.trangThai === 'TRINH_PHE_DUYET', 'Phó phòng QLVT đã tới bước Trình phê duyệt')
  const gd2 = nguoi(roi[1] , { lanhDaoSo: true })
  const kqs = await Promise.all([chuyenBuoc(giamDoc, p2.id, 'HOAN_THANH_TOT_NHIEM_VU'), chuyenBuoc(gd2, p2.id, 'HOAN_THANH_NHIEM_VU')])
  const thang = kqs.filter((r) => r.ok).length
  const ev = await db.officeAnnualEvaluation.findUnique({ where: { canBoId_nam: { canBoId: pq.cb.id, nam: NAM } } })
  const hsSau = await layHoSoTheoId(p2.id)
  ok(thang === 1, 'phê duyệt đồng thời: đúng 1 người thành công', `${thang} thành công`)
  ok(ev?.mucXepLoai === hsSau?.mucPheDuyet, 'mức chính thức khớp mức của người duyệt thắng, không bị người thua ghi đè', `${ev?.mucXepLoai} / ${hsSau?.mucPheDuyet}`)
  const nhatKy = await db.$queryRaw<{ n: number }[]>`select count(*)::int n from office_year_review_logs where "reviewId"=${p2.id} and loai='CHUYEN_BUOC' and "denTrangThai"='DA_PHE_DUYET'`
  ok(nhatKy[0].n === 1, 'nhật ký chỉ ghi 1 lần phê duyệt')

  // ── Trưởng phòng QLVT: đi tới Gửi nhận xét, rồi bị trả về có lý do ──
  let t = hs['PHONG_QL_VT/TRUONG_PHONG']; const kQ = ca['PHONG_QL_VT/TRUONG_PHONG']
  const b2 = async (u: CurrentUser) => { const r = await chuyenBuoc(u, t.id); if (r.ok) t = r.hoSo; return r }
  await b2(thuKy); await luuNoiDung(chinhChu(kQ), t.id, { tuDanhGia: 'Tự đánh giá Trưởng phòng.' }); await b2(chinhChu(kQ))
  ok(t.trangThai === 'GUI_NHAN_XET', 'Trưởng phòng QLVT: tự đánh giá → gửi nhận xét')
  ok(!(await traVeBuocTruoc(chinhChu(kQ), t.id, 'x')).ok, 'chính chủ không tự trả hồ sơ')
  ok(!(await traVeBuocTruoc(giamDoc, t.id, '  ')).ok, 'trả về phải có lý do')
  const tv = await traVeBuocTruoc(giamDoc, t.id, 'Bổ sung tự đánh giá')
  ok(tv.ok && tv.hoSo.trangThai === 'TU_DANH_GIA', 'trả về bước trước kèm lý do')

  // ── Hồ sơ kiểm điểm Đảng: tách quyền ──
  const tpHt = ca['PHONG_HTKT/TRUONG_PHONG']
  const dv = await taoHoSo(chinhChu(tpHt), tpHt.cb.id, NAM, 'DANG_VIEN')
  ok(dv.ok, 'chính chủ tự lập hồ sơ kiểm điểm Đảng của mình')
  if (dv.ok) {
    dauVet.hs.push(dv.hoSo.id)
    const nguoiCungPhong = nguoi(ca['PHONG_HTKT/PHO_TRUONG_PHONG'].cb.userId!, { toChucId: pt.id, truongPhong: true })
    ok(!(await taoHoSo(thuKy, tpHt.cb.id, NAM, 'DANG_VIEN')).ok, 'thư ký đánh giá CBCCVC không lập được hồ sơ Đảng')
    const m1 = await moHoSo(nguoiCungPhong, dv.hoSo.id)
    ok(m1?.tuChoi === true, 'Phó phòng (lãnh đạo cùng phòng) không xem được hồ sơ Đảng')
    const m2 = await moHoSo(giamDoc, dv.hoSo.id)
    ok(m2?.tuChoi === true, 'lãnh đạo Sở không có party_review_view cũng không xem được hồ sơ Đảng')
    const m3 = await moHoSo(chinhChu(tpHt), dv.hoSo.id)
    ok(m3?.tuChoi === false, 'chính chủ xem được hồ sơ Đảng của mình')
    const m4 = await moHoSo(nguoi(roi[0], { quyen: ['office:menu_access', 'office:party_review_view'] }), dv.hoSo.id)
    ok(m4?.tuChoi === false, 'người có party_review_view xem được')
    const kt = await chayKiemTra((await layHoSoTheoId(dv.hoSo.id))!, tpHt.cb)
    ok(kt.filter((v) => v.ma === 'TRUY_CAP_NGOAI_THAM_QUYEN').length === 2, 'kiểm tra ghi nhận 2 lần truy cập ngoài thẩm quyền', String(kt.filter((v) => v.ma === 'TRUY_CAP_NGOAI_THAM_QUYEN').length))
    const log = await db.$queryRaw<{ n: number }[]>`select count(*)::int n from office_year_review_logs where "reviewId"=${dv.hoSo.id} and loai='XEM_HO_SO'`
    ok(log[0].n === 2, 'nhật ký ghi 2 lần xem hợp lệ')
  }

  // ── Dashboard phòng ──
  for (const p of phongs) {
    const d = await tongHopTheoPhong(p.id, NAM)
    console.log(`\n[${p.ma}] ${d?.tenPhong}: nhân sự ${d?.tong.tongNhanSu}, chưa lập ${d?.tong.chuaLapHoSo}, đã phê duyệt ${d?.tong.hoSoHoanThanh}, chờ nhận xét ${d?.tong.choNhanXet}, chờ phê duyệt ${d?.tong.choPheDuyet}; việc ${d?.tong.nhiemVu.tong} (xong ${d?.tong.nhiemVu.hoanThanh}); khoá ${d?.tong.daoTao.soKhoa} (hoàn thành ${d?.tong.daoTao.hoanThanh}, đang học ${d?.tong.daoTao.dangHoc})`)
    d?.duThao.forEach((l) => console.log('   · ' + l))
    ok(!!d && d.tong.tongNhanSu > 0, `báo cáo tổng hợp ${p.ma}`)
    if (p.ma === 'PHONG_HTKT') ok(d!.tong.mucDaPheDuyet.HOAN_THANH_TOT_NHIEM_VU === 1 && d!.tong.daoTao.dangHoc === 1 && d!.tong.daoTao.hoanThanh === 1, 'HTKT: 1 hồ sơ đã duyệt, khoá đang học tách khỏi hoàn thành')
    ok(!d!.duThao.join(' ').match(/xuất sắc|Hoàn thành tốt/i), `${p.ma}: dự thảo tập thể không nêu mức xếp loại`)
  }
} finally {
  // dọn dấu vết
  if (dauVet.hs.length) await db.$executeRaw`delete from office_year_reviews where id = any(${dauVet.hs})`
  if (dauVet.cv.length) await db.congViec.deleteMany({ where: { id: { in: dauVet.cv } } })
  if (dauVet.nv.length) await db.nghiepVuBanGhi.deleteMany({ where: { id: { in: dauVet.nv } } })
  const sau = await db.officeAnnualEvaluation.findMany({ where: { nam: NAM }, select: { id: true } })
  const moi = sau.map((e) => e.id).filter((id) => !truocEval.has(id))
  if (moi.length) await db.officeAnnualEvaluation.deleteMany({ where: { id: { in: moi } } })
  console.log(`\nĐã dọn: ${dauVet.hs.length} hồ sơ, ${dauVet.cv.length} việc, ${dauVet.nv.length} khoá học, ${moi.length} xếp loại thử`)
}
console.log(loi === 0 ? '\nTẤT CẢ ĐẠT' : `\n${loi} KIỂM TRA KHÔNG ĐẠT`)
process.exit(loi === 0 ? 0 : 1)
