// Ma trận quyền tool chatbot (B0 — S2, S11, Q4). Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  quyetDinhTool, locToolChoMoHinh, SO_ONLY_TOOLS, TOOL_GHI_TAM_TAT, TOOL_CHI_QUYEN_NHAY_CAM, TIEU_CHI_XEP_HANG_NHAY_CAM,
  type QuyenNguoiHoi,
} from './quyen-tool.ts'

// 21 tool đang khai báo trong app/api/chatbot/route.ts
const TAT_CA_TOOL = [
  'tim_can_bo', 'ho_so_can_bo', 'xem_luong_can_bo', 'so_do_to_chuc', 'sinh_nhat_hom_nay', 'tra_cuu_dvhc',
  'tra_cuu_lanh_dao_xa', 'luu_lanh_dao_xa', 'cap_nhat_luong_can_bo', 'them_can_bo', 'sinh_nhat_thang_nay',
  'len_luong_thang_nay', 'thong_ke_nang_luong', 'du_thao_qd_nang_luong', 'xep_hang_nhan_su', 'luong_cua_toi',
  'tra_cuu_phap_ly_nhan_su', 'tra_cuu_tai_lieu', 'tra_cuu_phap_ly_chuyen_nganh', 'tra_cuu_hieu_luc_van_ban',
  'tra_cuu_nghiep_vu_htkt',
]

const VAI_TRO: Record<string, QuyenNguoiHoi> = {
  'tài khoản xã': { laTaiKhoanXa: true, xemNhanSuNhayCam: false },
  'chuyên viên Sở': { laTaiKhoanXa: false, xemNhanSuNhayCam: false },
  'người có quyền nhạy cảm': { laTaiKhoanXa: false, xemNhanSuNhayCam: true },
}

test('tool GHI bị tắt với MỌI vai trò, ở cả hai lớp', () => {
  for (const [vt, q] of Object.entries(VAI_TRO)) {
    for (const ten of TOOL_GHI_TAM_TAT) {
      assert.equal(quyetDinhTool(ten, {}, q).choPhep, false, `${vt} / ${ten}`)
    }
    const loc = locToolChoMoHinh(TAT_CA_TOOL, (t) => t, q)
    for (const ten of TOOL_GHI_TAM_TAT) assert.ok(!loc.includes(ten), `${vt} vẫn thấy ${ten}`)
  }
})

test('tài khoản xã không dùng được tool nội bộ Sở', () => {
  const q = VAI_TRO['tài khoản xã']
  for (const ten of SO_ONLY_TOOLS) assert.equal(quyetDinhTool(ten, {}, q).choPhep, false, ten)
  assert.equal(quyetDinhTool('tra_cuu_dvhc', {}, q).choPhep, true)
  assert.equal(quyetDinhTool('tra_cuu_lanh_dao_xa', {}, q).choPhep, true)
})

test('chuyên viên Sở không có quyền nhạy cảm: chặn tool lương, ẩn trường nhạy cảm ở hồ sơ', () => {
  const q = VAI_TRO['chuyên viên Sở']
  for (const ten of TOOL_CHI_QUYEN_NHAY_CAM) assert.equal(quyetDinhTool(ten, {}, q).choPhep, false, ten)
  for (const tc of TIEU_CHI_XEP_HANG_NHAY_CAM) {
    assert.equal(quyetDinhTool('xep_hang_nhan_su', { tieu_chi: tc }, q).choPhep, false, tc)
  }
  assert.deepEqual(quyetDinhTool('xep_hang_nhan_su', { tieu_chi: 'don_vi_dong_nhat' }, q), { choPhep: true, anTruongNhayCam: true })
  assert.deepEqual(quyetDinhTool('ho_so_can_bo', { ho_ten: 'A' }, q), { choPhep: true, anTruongNhayCam: true })
  // Quyết định chủ hệ thống 21/10/2026: sinh nhật (ngày/tháng) mọi cán bộ Sở xem được;
  // lương CỦA CHÍNH MÌNH cũng cần quyền nhạy cảm; dự thảo QĐ chỉ cần quyền nghiệp vụ lương (kiểm trong handler)
  assert.equal(quyetDinhTool('sinh_nhat_hom_nay', {}, q).choPhep, true)
  assert.equal(quyetDinhTool('sinh_nhat_thang_nay', { thang: '7' }, q).choPhep, true)
  assert.equal(quyetDinhTool('luong_cua_toi', {}, q).choPhep, false)
  assert.equal(quyetDinhTool('du_thao_qd_nang_luong', {}, q).choPhep, true)
})

test('người có quyền nhạy cảm: xem đủ, nhưng vẫn không ghi được', () => {
  const q = VAI_TRO['người có quyền nhạy cảm']
  for (const ten of TOOL_CHI_QUYEN_NHAY_CAM) assert.equal(quyetDinhTool(ten, {}, q).choPhep, true, ten)
  assert.deepEqual(quyetDinhTool('ho_so_can_bo', { ho_ten: 'A' }, q), { choPhep: true, anTruongNhayCam: false })
  assert.equal(quyetDinhTool('cap_nhat_luong_can_bo', {}, q).choPhep, false)
})

test('ma trận đầy đủ 21 tool × 3 vai trò (kết quả mong đợi viết tay, không suy từ cùng bộ quy tắc)', () => {
  // C = cho phép, A = cho phép nhưng ẩn trường nhạy cảm, X = chặn
  const MONG: Record<string, [string, string, string]> = {
    //                              xã   chuyên viên   nhạy cảm
    tim_can_bo:                    ['X', 'A', 'C'],
    ho_so_can_bo:                  ['X', 'A', 'C'],
    xem_luong_can_bo:              ['X', 'X', 'C'],
    so_do_to_chuc:                 ['X', 'A', 'C'],
    sinh_nhat_hom_nay:             ['X', 'A', 'C'],
    sinh_nhat_thang_nay:           ['X', 'A', 'C'],
    tra_cuu_dvhc:                  ['A', 'A', 'C'],
    tra_cuu_lanh_dao_xa:           ['A', 'A', 'C'],
    luu_lanh_dao_xa:               ['X', 'X', 'X'],
    cap_nhat_luong_can_bo:         ['X', 'X', 'X'],
    them_can_bo:                   ['X', 'X', 'X'],
    len_luong_thang_nay:           ['X', 'X', 'C'],
    thong_ke_nang_luong:           ['X', 'X', 'C'],
    du_thao_qd_nang_luong:         ['X', 'A', 'C'], // còn kiểm canManageSalary bên trong handler
    xep_hang_nhan_su:              ['X', 'A', 'C'], // không tiêu chí = chỉ tổng hợp; tiêu chí nhạy cảm test riêng
    luong_cua_toi:                 ['X', 'X', 'C'],
    tra_cuu_phap_ly_nhan_su:       ['A', 'A', 'C'],
    tra_cuu_tai_lieu:              ['A', 'A', 'C'],
    tra_cuu_phap_ly_chuyen_nganh:  ['A', 'A', 'C'],
    tra_cuu_hieu_luc_van_ban:      ['A', 'A', 'C'],
    tra_cuu_nghiep_vu_htkt:        ['A', 'A', 'C'],
  }
  assert.deepEqual(Object.keys(MONG).sort(), [...TAT_CA_TOOL].sort())
  const vaiTro = Object.values(VAI_TRO)
  for (const [ten, mong] of Object.entries(MONG)) {
    mong.forEach((m, i) => {
      const kq = quyetDinhTool(ten, {}, vaiTro[i])
      const thuc = !kq.choPhep ? 'X' : kq.anTruongNhayCam ? 'A' : 'C'
      assert.equal(thuc, m, `${ten} / ${Object.keys(VAI_TRO)[i]}`)
    })
  }
})

test('lớp 1 và lớp 2 nhất quán: tool đã lọc khỏi danh sách thì lớp 2 cũng chặn', () => {
  for (const [vt, q] of Object.entries(VAI_TRO)) {
    const loc = new Set(locToolChoMoHinh(TAT_CA_TOOL, (t) => t, q))
    for (const ten of TAT_CA_TOOL) {
      if (!loc.has(ten)) assert.equal(quyetDinhTool(ten, {}, q).choPhep, false, `${vt} / ${ten}`)
    }
  }
})

test('tool không thuộc danh sách nhạy cảm/ghi vẫn hoạt động cho chuyên viên Sở', () => {
  const q = VAI_TRO['chuyên viên Sở']
  for (const ten of ['tim_can_bo', 'so_do_to_chuc', 'tra_cuu_tai_lieu', 'tra_cuu_hieu_luc_van_ban', 'tra_cuu_dvhc']) {
    assert.equal(quyetDinhTool(ten, {}, q).choPhep, true, ten)
  }
})

test('lịch sử: lượt kế thừa dữ liệu nhạy cảm cũng bị coi là nhạy cảm (kịch bản Codex B0 vòng 2)', async () => {
  const { chonLichSu, laLuotNhayCam, DAU_KE_THUA_NHAY_CAM } = await import('./quyen-tool.ts')
  const A = { id: 'A', toolsUsed: ['xem_luong_can_bo'] }          // lượt A: gọi tool lương
  const B = { id: 'B', toolsUsed: [DAU_KE_THUA_NHAY_CAM] }        // lượt B: "nhắc lại" — không gọi tool, mang dấu kế thừa
  const C = { id: 'C', toolsUsed: [] as string[] }                // lượt thường
  // Còn quyền: giữ đủ, lượt mới phải mang dấu kế thừa
  const conQuyen = chonLichSu([A, B, C], false)
  assert.deepEqual(conQuyen.giu.map((l) => l.id), ['A', 'B', 'C'])
  assert.equal(conQuyen.keThuaNhayCam, true)
  // Bị thu hồi quyền: bỏ CẢ A lẫn B, chỉ giữ C; lượt mới không mang dấu
  const thuHoi = chonLichSu([A, B, C], true)
  assert.deepEqual(thuHoi.giu.map((l) => l.id), ['C'])
  assert.equal(thuHoi.keThuaNhayCam, false)
  // Lượt mang dấu không còn toolsUsed rỗng → tự loại khỏi "học từ LIKE" (chỉ lấy toolsUsed rỗng)
  assert.equal(laLuotNhayCam(B.toolsUsed), true)
  assert.equal(B.toolsUsed.length > 0, true)
  assert.equal(laLuotNhayCam(C.toolsUsed), false)
})
