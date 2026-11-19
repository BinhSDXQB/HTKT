// Biên bản cuộc họp nhận xét, đánh giá, xếp loại chất lượng cuối năm — theo từng phòng / đơn vị.
// Căn cứ (VERIFIED 18/11/2026, toàn văn trong kho Tailieu_VBPL):
//  - NĐ 335/2025/NĐ-CP Điều 21 (công chức):
//      k1 điểm b (người đứng đầu) và k2 điểm b (cấp phó của người đứng đầu, khi cơ quan có đơn vị cấu thành):
//        "tập thể lãnh đạo cơ quan, tổ chức, đơn vị, đại diện cấp ủy đảng và người đứng đầu các đơn vị cấu thành;
//         đối với cơ quan ... có quy mô lớn thì người đứng đầu các đơn vị cấu thành có thể tham gia ý kiến bằng văn bản".
//      k2 điểm b (công chức thuộc quyền quản lý của người đứng đầu): "toàn thể công chức ... của đơn vị cấu thành nơi công chức công tác".
//      "các ý kiến phải được ghi vào biên bản và thông qua tại cuộc họp".
//  - NĐ 233/2026/NĐ-CP Điều 15 (viên chức):
//      k2 điểm b (người đứng đầu, cấp phó): "toàn thể viên chức của đơn vị. Trường hợp đơn vị có đơn vị cấu thành thì thành phần
//        bao gồm tập thể lãnh đạo đơn vị, đại diện cấp ủy đảng, các tổ chức chính trị - xã hội cùng cấp và người đứng đầu các đơn vị cấu thành ...".
//      k3 điểm b (không giữ chức vụ quản lý): "toàn thể viên chức của đơn vị hoặc toàn thể viên chức của đơn vị cấu thành nơi viên chức công tác".
//  - Điều 24 k2 điểm a NĐ 335: biên bản cuộc họp xếp loại chất lượng cuối năm là tài liệu phải lưu.
// KHÔNG có văn bản nào trong kho quy định SỐ/TỶ LỆ TỐI THIỂU người dự họp, cũng không quy định tỷ lệ "thông qua"
// (đã tra NĐ 335/2025, NĐ 233/2026, QĐ UBND tỉnh, CV Sở Xây dựng). Quy ước của hệ thống (PROPOSED, ghi rõ trên giao diện):
//  - có mặt dưới 2/3: chỉ CẢNH BÁO;
//  - "thông qua": phải quá nửa số người có mặt tán thành, nếu không thì biên bản CHƯA được thông qua (chặn trình).
// Mẫu biên bản: không có mẫu gốc ban hành kèm các văn bản trên — bố cục do hệ thống đề xuất theo thể thức biên bản hành chính.

/**
 * PHONG: phòng/văn phòng thuộc Sở, hoặc đơn vị sự nghiệp KHÔNG có đơn vị cấu thành (toàn thể).
 * LANH_DAO_SO: họp đánh giá Giám đốc, Phó Giám đốc Sở (NĐ 335 Đ21 k1, k2).
 * LANH_DAO_DON_VI: họp đánh giá lãnh đạo đơn vị sự nghiệp CÓ đơn vị cấu thành (NĐ 233 Đ15 k2).
 */
export type LoaiCuocHop = 'PHONG' | 'LANH_DAO_SO' | 'LANH_DAO_DON_VI'

export const THANH_PHAN: Record<LoaiCuocHop, { nhan: string; thanhPhan: string; canCu: string }> = {
  PHONG: {
    nhan: 'Toàn thể phòng / đơn vị',
    thanhPhan: 'Toàn thể công chức, viên chức (kể cả viên chức biệt phái, người lao động) đang công tác tại phòng/đơn vị.',
    canCu: 'Điểm b khoản 2 Điều 21 Nghị định số 335/2025/NĐ-CP (công chức); điểm b khoản 2, khoản 3 Điều 15 Nghị định số 233/2026/NĐ-CP (viên chức)',
  },
  LANH_DAO_SO: {
    nhan: 'Lãnh đạo Sở (Giám đốc, Phó Giám đốc)',
    thanhPhan: 'Tập thể lãnh đạo Sở, đại diện cấp ủy đảng và người đứng đầu các phòng, đơn vị thuộc Sở (đơn vị quy mô lớn: người đứng đầu đơn vị cấu thành có thể tham gia ý kiến bằng văn bản).',
    canCu: 'Điểm b khoản 1 và điểm b khoản 2 Điều 21 Nghị định số 335/2025/NĐ-CP',
  },
  LANH_DAO_DON_VI: {
    nhan: 'Lãnh đạo đơn vị sự nghiệp có đơn vị cấu thành',
    thanhPhan: 'Tập thể lãnh đạo đơn vị, đại diện cấp ủy đảng, các tổ chức chính trị - xã hội cùng cấp và người đứng đầu các đơn vị cấu thành.',
    canCu: 'Điểm b khoản 2 Điều 15 Nghị định số 233/2026/NĐ-CP',
  },
}

/** Người thuộc thành phần triệu tập (lấy từ hồ sơ cán bộ lúc lập biên bản). */
export type NguoiTrieuTap = { canBoId: string; hoTen: string; chucVu: string | null; vaiTro?: 'LANH_DAO' | 'TRUONG_DON_VI' | 'THANH_VIEN' }

export type ThamDu = 'CO_MAT' | 'VANG_CO_LY_DO' | 'VANG_KHONG_LY_DO' | 'Y_KIEN_VAN_BAN'
export const THAM_DU_LABEL: Record<ThamDu, string> = {
  CO_MAT: 'Có mặt', VANG_CO_LY_DO: 'Vắng có lý do', VANG_KHONG_LY_DO: 'Vắng không lý do', Y_KIEN_VAN_BAN: 'Tham gia ý kiến bằng văn bản',
}

export type ThanhVienBienBan = NguoiTrieuTap & { thamDu: ThamDu; lyDo?: string | null }

/** Ý kiến của tập thể đối với từng người, chụp lại lúc CHỐT biên bản (bản được thông qua). */
export type YKienChot = { canBoId: string; hoTen: string; chucVu: string | null; tongDiem: number | null; tuNhanMuc: string | null
  yKien: string | null; bieuQuyet: Partial<Record<string, number | null>> | null; mucTapTheDeXuat: string | null }

export type BienBanHop = {
  loai: LoaiCuocHop
  ngayHop?: string | null; gioBatDau?: string | null; gioKetThuc?: string | null; diaDiem?: string | null
  chuTriId?: string | null; thuKyId?: string | null
  /** họp lãnh đạo Sở / lãnh đạo đơn vị: đại diện cấp ủy đảng (họ tên, chức vụ đảng) */
  daiDienCapUy?: string | null
  /** họp lãnh đạo đơn vị sự nghiệp: đại diện các tổ chức chính trị - xã hội cùng cấp */
  daiDienDoanThe?: string | null
  khachMoi?: string | null
  thanhVien: ThanhVienBienBan[]
  noiDung?: string | null
  /** biểu quyết thông qua biên bản tại cuộc họp */
  thongQua?: { tanThanh: number | null; khongTanThanh: number | null } | null
  ketThuc?: string | null
  /** dấu phiên bản để chặn ghi đè đồng thời (ISO thời điểm lưu) */
  phienBan?: string | null
  /** đã chốt (thông qua): khoá sửa, kèm ảnh chụp ý kiến từng người */
  chot?: { luc: string; boi: string; yKien: YKienChot[] } | null
}

const NGAY = /^\d{4}-\d{2}-\d{2}$/
const GIO = /^([01]\d|2[0-3]):[0-5]\d$/
const THAM_DU: ThamDu[] = ['CO_MAT', 'VANG_CO_LY_DO', 'VANG_KHONG_LY_DO', 'Y_KIEN_VAN_BAN']
const chu = (v: unknown, max = 8000) => { const t = String(v ?? '').trim(); return t ? t.slice(0, max) : null }
const soNguyen = (v: unknown): number | null | 'sai' => {
  const t = String(v ?? '').trim(); if (!t) return null
  return /^\d{1,4}$/.test(t) ? Number(t) : 'sai'
}
const coLanhDao = (l: LoaiCuocHop) => l === 'LANH_DAO_SO' || l === 'LANH_DAO_DON_VI'

/**
 * Chuẩn hoá dữ liệu form biên bản. Danh sách thành viên LẤY TỪ MÁY CHỦ (danhSach), form chỉ gửi trạng thái tham dự
 * theo canBoId (td_<id>, ly_<id>) — không nhận người lạ từ form. Mỗi người PHẢI được chọn trạng thái tham dự (không mặc định "có mặt").
 */
export function chuanHoaBienBan(raw: Record<string, unknown>, loai: LoaiCuocHop, danhSach: NguoiTrieuTap[]): { ok: true; giaTri: BienBanHop } | { ok: false; loi: string } {
  const ngayHop = chu(raw.ngayHop, 10)
  if (ngayHop && !NGAY.test(ngayHop)) return { ok: false, loi: 'Ngày họp không hợp lệ.' }
  for (const k of ['gioBatDau', 'gioKetThuc'] as const) {
    const g = chu(raw[k], 5); if (g && !GIO.test(g)) return { ok: false, loi: 'Giờ họp phải dạng HH:MM.' }
  }
  const ids = new Set(danhSach.map((d) => d.canBoId))
  const thanhVien: ThanhVienBienBan[] = []
  for (const d of danhSach) {
    const td = String(raw[`td_${d.canBoId}`] ?? '') as ThamDu
    if (!td) return { ok: false, loi: `Chưa chọn trạng thái tham dự của ${d.hoTen}.` }
    if (!THAM_DU.includes(td)) return { ok: false, loi: `Trạng thái tham dự của ${d.hoTen} không hợp lệ.` }
    const lyDo = chu(raw[`ly_${d.canBoId}`], 500)
    if (td === 'Y_KIEN_VAN_BAN') {
      if (!(coLanhDao(loai) && d.vaiTro === 'TRUONG_DON_VI'))
        return { ok: false, loi: `${d.hoTen}: chỉ người đứng đầu đơn vị cấu thành (họp đánh giá lãnh đạo) mới được tham gia ý kiến bằng văn bản.` }
      if (!lyDo) return { ok: false, loi: `${d.hoTen} tham gia ý kiến bằng văn bản: ghi số, ngày văn bản góp ý ở cột ghi chú.` }
    }
    thanhVien.push({ ...d, thamDu: td, lyDo })
  }
  const chuTriId = chu(raw.chuTriId, 64), thuKyId = chu(raw.thuKyId, 64)
  for (const [id, ten] of [[chuTriId, 'Chủ trì'], [thuKyId, 'Thư ký']] as const) if (id && !ids.has(id)) return { ok: false, loi: `${ten} phải là người trong thành phần triệu tập.` }
  const tt = soNguyen(raw.tanThanh), ktt = soNguyen(raw.khongTanThanh)
  if (tt === 'sai' || ktt === 'sai') return { ok: false, loi: 'Số biểu quyết phải là số nguyên không âm.' }
  return {
    ok: true,
    giaTri: {
      loai, ngayHop, gioBatDau: chu(raw.gioBatDau, 5), gioKetThuc: chu(raw.gioKetThuc, 5), diaDiem: chu(raw.diaDiem, 300),
      chuTriId, thuKyId, daiDienCapUy: coLanhDao(loai) ? chu(raw.daiDienCapUy, 300) : null,
      daiDienDoanThe: loai === 'LANH_DAO_DON_VI' ? chu(raw.daiDienDoanThe, 500) : null, khachMoi: chu(raw.khachMoi, 2000),
      thanhVien, noiDung: chu(raw.noiDung), thongQua: tt === null && ktt === null ? null : { tanThanh: tt, khongTanThanh: ktt }, ketThuc: chu(raw.ketThuc, 500),
      chot: null,
    },
  }
}

export type ThongKeThamDu = { trieuTap: number; coMat: number; vanBan: number; vangCoLyDo: number; vangKhongLyDo: number; tyLeCoMat: number }

export function thongKeThamDu(bb: Pick<BienBanHop, 'thanhVien'>): ThongKeThamDu {
  const dem = (t: ThamDu) => bb.thanhVien.filter((x) => x.thamDu === t).length
  const trieuTap = bb.thanhVien.length, coMat = dem('CO_MAT')
  return { trieuTap, coMat, vanBan: dem('Y_KIEN_VAN_BAN'), vangCoLyDo: dem('VANG_CO_LY_DO'), vangKhongLyDo: dem('VANG_KHONG_LY_DO'), tyLeCoMat: trieuTap ? coMat / trieuTap : 0 }
}

/** Ngưỡng CẢNH BÁO tham khảo (PROPOSED) — không có căn cứ pháp lý về số tối thiểu; KHÔNG dùng để chặn. */
export const NGUONG_CANH_BAO_CO_MAT = 2 / 3

export type ViPhamBienBan = { mucDo: 'LOI' | 'CANH_BAO'; thongDiep: string }

/**
 * Kiểm tra thành phần và nội dung biên bản (dùng cả trước khi CHỐT và khi trình).
 * danhSachHienTai: thành phần triệu tập tính lại từ hồ sơ cán bộ NGAY LÚC KIỂM TRA.
 *   - chưa chốt: thiếu người là LỖI (phải cập nhật danh sách trước khi chốt);
 *   - đã chốt: người đến sau cuộc họp chỉ là CẢNH BÁO (cần họp bổ sung), không làm hỏng biên bản đã thông qua.
 * duocDanhGia: canBoId những người được nhận xét tại cuộc họp này (phải có mặt để trình bày báo cáo tự đánh giá).
 */
export function kiemTraBienBan(bb: BienBanHop | null | undefined, danhSachHienTai: NguoiTrieuTap[], duocDanhGia: string[] = []): ViPhamBienBan[] {
  const v: ViPhamBienBan[] = []
  if (!bb) return [{ mucDo: 'LOI', thongDiep: 'Chưa lập biên bản cuộc họp nhận xét, đánh giá của phòng/đơn vị.' }]
  if (!bb.ngayHop) v.push({ mucDo: 'LOI', thongDiep: 'Biên bản chưa ghi ngày họp.' })
  if (!bb.thanhVien.length) v.push({ mucDo: 'LOI', thongDiep: 'Biên bản chưa có thành phần dự họp.' })
  const trongBb = new Map(bb.thanhVien.map((x) => [x.canBoId, x]))
  const thieu = danhSachHienTai.filter((d) => !trongBb.has(d.canBoId))
  if (thieu.length) {
    v.push(bb.chot
      ? { mucDo: 'CANH_BAO', thongDiep: `Có người về đơn vị sau cuộc họp, chưa có trong biên bản đã chốt: ${thieu.map((d) => d.hoTen).join(', ')} (cần họp bổ sung nếu người đó được đánh giá tại đơn vị này).` }
      : { mucDo: 'LOI', thongDiep: `Thành phần triệu tập chưa đủ theo quy định: thiếu ${thieu.map((d) => d.hoTen).join(', ')} (lưu lại biên bản để cập nhật danh sách từ hồ sơ cán bộ).` })
  }
  const coMat = (id?: string | null) => !!id && trongBb.get(id)?.thamDu === 'CO_MAT'
  const tk = thongKeThamDu(bb)
  if (!bb.chuTriId) v.push({ mucDo: 'LOI', thongDiep: 'Biên bản chưa ghi người chủ trì.' })
  else if (!coMat(bb.chuTriId)) v.push({ mucDo: 'LOI', thongDiep: 'Người chủ trì phải có mặt tại cuộc họp.' })
  if (!bb.thuKyId) v.push({ mucDo: 'LOI', thongDiep: 'Biên bản chưa ghi thư ký cuộc họp.' })
  else if (!coMat(bb.thuKyId)) v.push({ mucDo: 'LOI', thongDiep: 'Thư ký phải có mặt tại cuộc họp.' })
  if (bb.chuTriId && bb.chuTriId === bb.thuKyId) {
    // Đơn vị chỉ có 1 người có mặt thì không thể có hai người: cảnh báo để cấp có thẩm quyền xử lý, không bịa người dự
    v.push(tk.coMat < 2
      ? { mucDo: 'CANH_BAO', thongDiep: 'Chỉ có 1 người có mặt nên chủ trì kiêm thư ký; cần cấp có thẩm quyền xác nhận cách tổ chức cuộc họp.' }
      : { mucDo: 'LOI', thongDiep: 'Chủ trì và thư ký phải là hai người khác nhau.' })
  }
  if (coLanhDao(bb.loai) && !bb.daiDienCapUy) v.push({ mucDo: 'LOI', thongDiep: 'Cuộc họp đánh giá lãnh đạo phải có đại diện cấp ủy đảng (Điều 21 NĐ 335/2025; Điều 15 NĐ 233/2026).' })
  if (bb.loai === 'LANH_DAO_DON_VI' && !bb.daiDienDoanThe) v.push({ mucDo: 'LOI', thongDiep: 'Cuộc họp đánh giá lãnh đạo đơn vị sự nghiệp phải có đại diện các tổ chức chính trị - xã hội cùng cấp (Điều 15 khoản 2 NĐ 233/2026).' })
  const tq = bb.thongQua
  if (!tq || tq.tanThanh === null) v.push({ mucDo: 'LOI', thongDiep: 'Chưa ghi kết quả biểu quyết thông qua biên bản tại cuộc họp.' })
  else {
    const tong = (tq.tanThanh ?? 0) + (tq.khongTanThanh ?? 0)
    if (tong > tk.coMat) v.push({ mucDo: 'LOI', thongDiep: `Số biểu quyết (${tong}) vượt số người có mặt (${tk.coMat}).` })
    else if ((tq.tanThanh ?? 0) * 2 <= tk.coMat) v.push({ mucDo: 'LOI', thongDiep: `Biên bản CHƯA được thông qua: ${tq.tanThanh}/${tk.coMat} người có mặt tán thành (hệ thống yêu cầu quá nửa; văn bản không quy định tỷ lệ cụ thể).` })
  }
  for (const x of bb.thanhVien) if (x.thamDu === 'VANG_CO_LY_DO' && !x.lyDo) v.push({ mucDo: 'CANH_BAO', thongDiep: `${x.hoTen} vắng có lý do nhưng chưa ghi lý do.` })
  if (tk.vangKhongLyDo) v.push({ mucDo: 'CANH_BAO', thongDiep: `${tk.vangKhongLyDo} người vắng không lý do.` })
  if (tk.trieuTap && tk.tyLeCoMat < NGUONG_CANH_BAO_CO_MAT)
    v.push({ mucDo: 'CANH_BAO', thongDiep: `Có mặt ${tk.coMat}/${tk.trieuTap} người (dưới 2/3). Văn bản hiện hành không quy định số tối thiểu; ngưỡng 2/3 chỉ để lưu ý — cân nhắc họp bổ sung.` })
  for (const id of duocDanhGia) {
    const x = trongBb.get(id)
    if (x && x.thamDu !== 'CO_MAT') v.push({ mucDo: 'CANH_BAO', thongDiep: `${x.hoTen} được đánh giá nhưng không có mặt để trình bày báo cáo tự đánh giá tại cuộc họp.` })
  }
  return v
}

/**
 * Điều kiện để TRÌNH hồ sơ của một người: biên bản đã chốt, không còn lỗi, người đó có trong biên bản
 * và ý kiến của tập thể về người đó đã được ghi trong bản chốt.
 */
export function kiemTraTrinhTheoBienBan(bb: BienBanHop | null | undefined, danhSachHienTai: NguoiTrieuTap[], canBoId: string): ViPhamBienBan[] {
  const v = kiemTraBienBan(bb, danhSachHienTai).filter((x) => x.mucDo === 'LOI')
  if (!bb) return v
  if (!bb.chot) v.push({ mucDo: 'LOI', thongDiep: 'Biên bản họp của đơn vị chưa được chốt (thông qua).' })
  if (!bb.thanhVien.some((x) => x.canBoId === canBoId)) v.push({ mucDo: 'LOI', thongDiep: 'Người được đánh giá không có trong biên bản họp của đơn vị này (người chuyển đến sau cuộc họp: cần họp bổ sung).' })
  else if (bb.chot && !bb.chot.yKien.find((y) => y.canBoId === canBoId)?.yKien?.trim()) v.push({ mucDo: 'LOI', thongDiep: 'Bản biên bản đã chốt chưa có ý kiến của tập thể về người này; mở lại biên bản, ghi ý kiến rồi chốt lại.' })
  return v
}

export const bienBanHopLe = (bb: BienBanHop | null | undefined, ds: NguoiTrieuTap[], dg: string[] = []) => !kiemTraBienBan(bb, ds, dg).some((x) => x.mucDo === 'LOI')
