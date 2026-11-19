// Nghiệm thu luân chuyển cán bộ (lib/luan-chuyen-db.ts) — CHỈ chạy trên bản sao thử (tên CSDL phải chứa "thu").
// Mọi thao tác nằm trong MỘT giao dịch và bị huỷ (rollback) ở cuối: không để lại dữ liệu.
//   JITI_ALIAS='{"@/":"C:/Troly/HTKT/app/","server-only":"<tệp rỗng .js>"}' DATABASE_URL=<bản sao> node_modules/.bin/jiti scripts/smoke-luan-chuyen.ts
import { db } from '@/lib/db'
import { apDungLuanChuyen, LoiLuanChuyen } from '@/lib/luan-chuyen-db'

let loi = 0
const ok = (c: boolean, ten: string, them = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${ten}${them ? ' — ' + them : ''}`); if (!c) loi++ }
const dbName = (await db.$queryRaw<{ d: string }[]>`select current_database() d`)[0].d
if (!/thu/i.test(dbName)) { console.error('Từ chối: không phải bản sao thử:', dbName); process.exit(2) }
console.log('CSDL:', dbName)

const HUY = new Error('HUY_GIAO_DICH_THU')
try {
  await db.$transaction(async (tx) => {
    const ph = Object.fromEntries((await tx.toChuc.findMany({ where: { ma: { in: ['PHONG_HTKT', 'PHONG_QL_VT'] } }, select: { id: true, ma: true } })).map((p) => [p.ma, p.id]))
    const nguoiThao = (await tx.user.findFirst({ select: { id: true } }))!.id
    const cv = (await tx.canBo.findFirst({ where: { toChucId: ph.PHONG_HTKT, trangThai: 'DANG_CONG_TAC', userId: { not: null }, chucDanh: { ma: 'CHUYEN_VIEN' } }, select: { id: true, userId: true, toChucId: true, chucDanhId: true, hoTen: true } }))!
    await tx.user.update({ where: { id: cv.userId! }, data: { isDepartmentLeader: true } }) // giả lập cờ đang bật ở phòng cũ
    const ngay = new Date(Date.UTC(2026, 11, 1))

    // 1. Luân chuyển thật: HTKT → QLVT
    await tx.canBo.update({ where: { id: cv.id }, data: { toChucId: ph.PHONG_QL_VT } })
    const r1 = await apDungLuanChuyen(tx, { canBoId: cv.id, userId: cv.userId, toChucIdCu: cv.toChucId, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: cv.chucDanhId, chucDanhIdMoi: cv.chucDanhId, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: '999/QĐ-THU', nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    const u1 = await tx.user.findUnique({ where: { id: cv.userId! }, select: { toChucId: true, isDepartmentLeader: true } })
    ok(u1?.toChucId === ph.PHONG_QL_VT, 'tài khoản tự chuyển sang Phòng Quản lý vận tải (menu theo phòng mới)', r1.moTa)
    ok(u1?.isDepartmentLeader === false, 'cờ lãnh đạo phòng cũ đã tắt')
    const pc = await tx.phanCong.findMany({ where: { canBoId: cv.id, laChinh: true }, select: { toChucId: true, tuNgay: true, denNgay: true, quyetDinhSo: true } })
    const mo = pc.filter((p) => p.denNgay === null)
    ok(mo.length === 1 && mo[0].toChucId === ph.PHONG_QL_VT && mo[0].quyetDinhSo === '999/QĐ-THU', 'đúng 1 phân công chính đang mở, ở phòng mới, kèm số QĐ')
    ok(pc.some((p) => p.toChucId === ph.PHONG_HTKT && p.denNgay?.toISOString().slice(0, 10) === '2026-11-30'), 'phân công cũ đóng ngày 30/11/2026 (trước ngày hiệu lực)')
    const qt = await tx.officeWorkHistory.findMany({ where: { canBoId: cv.id }, select: { tuNgay: true, noiDung: true, soQuyetDinh: true } })
    ok(qt.length === 1 && /chuyển từ .* sang /.test(qt[0].noiDung ?? ''), 'ghi 1 dòng quá trình công tác', qt[0]?.noiDung ?? '')

    // 2. Lưu lại y nguyên: không nhân đôi phân công / quá trình
    await apDungLuanChuyen(tx, { canBoId: cv.id, userId: cv.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: cv.chucDanhId, chucDanhIdMoi: cv.chucDanhId, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    ok((await tx.phanCong.count({ where: { canBoId: cv.id, laChinh: true, denNgay: null } })) === 1 && (await tx.officeWorkHistory.count({ where: { canBoId: cv.id } })) === 1, 'lưu lại hồ sơ không đổi: không nhân đôi phân công, quá trình')

    // 3. Ca Trần Văn Bình: hồ sơ QLVT nhưng tài khoản HTKT, cờ bật → lưu lại hồ sơ (không đổi) sửa tài khoản
    const b = (await tx.canBo.findFirst({ where: { toChucId: ph.PHONG_QL_VT, trangThai: 'DANG_CONG_TAC', userId: { not: null }, chucDanh: { ma: 'PHO_TRUONG_PHONG' } }, select: { id: true, userId: true, chucDanhId: true } }))!
    await tx.user.update({ where: { id: b.userId! }, data: { toChucId: ph.PHONG_HTKT, isDepartmentLeader: true } })
    const truocQt = await tx.officeWorkHistory.count({ where: { canBoId: b.id } })
    const r3 = await apDungLuanChuyen(tx, { canBoId: b.id, userId: b.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: b.chucDanhId, chucDanhIdMoi: b.chucDanhId, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    const u3 = await tx.user.findUnique({ where: { id: b.userId! }, select: { toChucId: true, isDepartmentLeader: true } })
    ok(u3?.toChucId === ph.PHONG_QL_VT && u3.isDepartmentLeader === false, 'tài khoản lệch được đưa về đúng phòng theo hồ sơ khi lưu lại', r3.ghiChu.join(' '))
    ok((await tx.officeWorkHistory.count({ where: { canBoId: b.id } })) === truocQt, 'sửa lệch dữ liệu KHÔNG ghi thành một lần luân chuyển')

    // 4. Ca Trần Trung Thông: phân công chính lệch hồ sơ → lưu lại sửa phân công
    const pcB = await tx.phanCong.findFirst({ where: { canBoId: b.id, laChinh: true, denNgay: null } })
    if (pcB) await tx.phanCong.update({ where: { id: pcB.id }, data: { toChucId: ph.PHONG_HTKT } })
    await apDungLuanChuyen(tx, { canBoId: b.id, userId: b.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: b.chucDanhId, chucDanhIdMoi: b.chucDanhId, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    const moB = await tx.phanCong.findMany({ where: { canBoId: b.id, laChinh: true, denNgay: null } })
    ok(moB.length === 1 && moB[0].toChucId === ph.PHONG_QL_VT, 'phân công chính lệch được đưa về đúng phòng theo hồ sơ')

    // 5. BLOCKER Codex: người không phải lãnh đạo Sở chuyển hồ sơ vào "Lãnh đạo Sở" → tài khoản KHÔNG được chuyển theo
    const lds = (await tx.toChuc.findFirst({ where: { ma: 'LANH_DAO_SO' }, select: { id: true } }))!.id
    const c2 = (await tx.canBo.findFirst({ where: { toChucId: ph.PHONG_QL_VT, trangThai: 'DANG_CONG_TAC', userId: { not: null }, chucDanh: { ma: 'CHUYEN_VIEN' } }, select: { id: true, userId: true, chucDanhId: true } }))!
    const r5 = await apDungLuanChuyen(tx, { canBoId: c2.id, userId: c2.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: lds, chucDanhIdCu: c2.chucDanhId, chucDanhIdMoi: c2.chucDanhId, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    ok((await tx.user.findUnique({ where: { id: c2.userId! }, select: { toChucId: true } }))?.toChucId === ph.PHONG_QL_VT && r5.canhBao.length > 0, 'không tự leo thang: chuyển hồ sơ vào Lãnh đạo Sở thì tài khoản KHÔNG theo nếu người làm không phải lãnh đạo Sở', r5.canhBao[0]?.slice(0, 60))
    const r5b = await apDungLuanChuyen(tx, { canBoId: c2.id, userId: c2.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: lds, chucDanhIdCu: c2.chucDanhId, chucDanhIdMoi: c2.chucDanhId, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: true, nguoiThaoTacLaLanhDaoVP: false })
    ok((await tx.user.findUnique({ where: { id: c2.userId! }, select: { toChucId: true } }))?.toChucId === lds && r5b.canhBao.length === 0, 'lãnh đạo Sở thì được chuyển tài khoản vào Lãnh đạo Sở')

    // 6. Ngày hiệu lực tương lai bị từ chối
    let tuChoi = false
    try { await apDungLuanChuyen(tx, { canBoId: c2.id, userId: c2.userId, toChucIdCu: lds, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: c2.chucDanhId, chucDanhIdMoi: c2.chucDanhId, ngayHieuLuc: new Date(Date.UTC(2026, 11, 10)), homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: true, nguoiThaoTacLaLanhDaoVP: false }) } catch (e) { tuChoi = e instanceof LoiLuanChuyen }
    ok(tuChoi, 'ngày hiệu lực trong tương lai bị từ chối (chưa hỗ trợ lịch chuyển)')

    // 7. Hạ chức danh cùng phòng: tắt cờ lãnh đạo
    const cdCV = (await tx.chucDanh.findFirst({ where: { ma: 'CHUYEN_VIEN' }, select: { id: true } }))!.id
    await tx.user.update({ where: { id: b.userId! }, data: { isDepartmentLeader: true } })
    await apDungLuanChuyen(tx, { canBoId: b.id, userId: b.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: b.chucDanhId, chucDanhIdMoi: cdCV, ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    ok((await tx.user.findUnique({ where: { id: b.userId! }, select: { isDepartmentLeader: true } }))?.isDepartmentLeader === false, 'hạ chức danh (Phó phòng → chuyên viên) cùng phòng: tắt cờ lãnh đạo')

    // 8. Thôi công tác (nghỉ hưu): tắt cờ, đóng phân công chính, không chuyển tài khoản
    await tx.user.update({ where: { id: b.userId! }, data: { isDepartmentLeader: true } })
    await apDungLuanChuyen(tx, { canBoId: b.id, userId: b.userId, toChucIdCu: ph.PHONG_QL_VT, toChucIdMoi: ph.PHONG_QL_VT, chucDanhIdCu: cdCV, chucDanhIdMoi: cdCV, trangThaiMoi: 'NGHI_HUU', ngayHieuLuc: ngay, homNay: ngay, soQuyetDinh: null, nguoiThaoTacId: nguoiThao, nguoiThaoTacLaLanhDaoSo: false, nguoiThaoTacLaLanhDaoVP: true })
    ok((await tx.user.findUnique({ where: { id: b.userId! }, select: { isDepartmentLeader: true } }))?.isDepartmentLeader === false && (await tx.phanCong.count({ where: { canBoId: b.id, laChinh: true, denNgay: null } })) === 0, 'nghỉ hưu: tắt cờ lãnh đạo và đóng phân công chính')

    throw HUY
  }, { timeout: 60000 })
} catch (e) {
  if (e !== HUY) throw e
}
console.log('Đã huỷ giao dịch thử (không để lại dữ liệu).')
console.log(loi === 0 ? 'TẤT CẢ ĐẠT' : `${loi} KIỂM TRA KHÔNG ĐẠT`)
process.exit(loi === 0 ? 0 : 1)
