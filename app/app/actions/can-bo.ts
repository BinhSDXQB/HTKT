'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { convertQueQuan } from '@/lib/que-quan'
import { tinhNgayNghiHuu, TRUONG_HOP_LUI, hanLuiToiDa, type MaTruongHopLui } from '@/lib/nghi-huu'
import { chuanHoaPhanTramVuotKhung } from '@/lib/luong'
import type { OfficeFormState } from './office'

// Hồ sơ cán bộ đầy đủ theo biểu QLNS 53 cột — thêm/sửa/xoá (gate: canManageCanBo)

const opt = z.string().optional()
const ProfileSchema = z.object({
  canBoId:    opt,                       // rỗng = tạo mới
  hoTen:      z.string().min(2, { message: 'Nhập họ và tên' }),
  cccd:       opt,
  gioiTinh:   z.enum(['NAM', 'NU', '']).optional(),
  ngaySinh:   opt,
  toChucId:   z.string().min(1, { message: 'Chọn đơn vị' }),
  chucDanhId: opt,
  chucVu:     opt,
  soDienThoai: opt, email: opt,
  queQuanTruoc: opt, queQuanSau: opt, noiOTruoc: opt, noiOHienNay: opt, quangTriCuRa: opt,
  doiTuong: z.enum(['CONG_CHUC', 'VIEN_CHUC', 'NGUOI_LAO_DONG', '']).optional(),
  viTriViecLam: opt, loaiHopDong: opt, ngayKetThucHopDong: opt,
  loaiHinh: opt, ngayVaoBienChe: opt, boNhiemLanDau: opt, ngayBoNhiemGanNhat: opt,
  ngayNghiHuuLui: opt, truongHopLui: z.enum(['A', 'B', 'C', '']).optional(), vanBanLuiNghiHuu: opt,
  maNgach: opt, bacLuong: opt, heSoLuong: opt, phuCap: opt, vuotKhung: opt,
  ngayNangLuong: opt, ngachHienHuong: opt, ngayBoNhiemNgach: opt,
  trinhDoChuyenMon: opt, chuyenNganh: opt, namTotNghiep: opt, heDaoTao: opt,
  trinhDoQLNN: opt, namDaoTaoQLNN: opt, trinhDoLLCT: opt, namDaoTaoLLCT: opt,
  trinhDoNgoaiNgu: opt, namDaoTaoNgoaiNgu: opt, trinhDoTinHoc: opt, namDaoTaoTinHoc: opt,
  namDaoTaoCapPhong: opt, namDaoTaoCapSo: opt, qpAn: opt, namDaoTaoQPAN: opt,
  soTheDang: opt, ngayKetNapDang: opt, ngayVaoDangChinhThuc: opt, chiBo: opt,
  trangThai: opt, ghiChu: opt,
})

function s(v?: string): string | null {
  const t = v?.trim()
  return t ? t : null
}
function d(v?: string): Date | null {
  return v?.trim() ? new Date(v) : null
}
function n(v?: string): number | null {
  if (!v || v.trim() === '') return null
  const x = Number(v.replace(',', '.'))
  return Number.isFinite(x) ? x : null
}
function addYears(date: Date | null, years: number): Date | null {
  if (!date) return null
  const out = new Date(date)
  out.setUTCFullYear(out.getUTCFullYear() + years)
  return out
}

export async function saveCanBoProfileAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) return { error: 'Bạn không có quyền thêm/sửa hồ sơ cán bộ.' }

  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const f = parsed.data

  const cccd = s(f.cccd)?.replace(/\D/g, '') ?? null
  if (cccd && cccd.length !== 12) return { fieldErrors: { cccd: ['CCCD phải đủ 12 chữ số'] } }

  const gioiTinh = f.gioiTinh === 'NAM' || f.gioiTinh === 'NU' ? f.gioiTinh : null
  const ngaySinh = d(f.ngaySinh)
  const queQuanTruoc = s(f.queQuanTruoc)
  // Quê quán sau hợp nhất: ưu tiên giá trị nhập tay; trống thì tự chuyển đổi theo NQ 1680
  const queQuanSau = s(f.queQuanSau) ?? convertQueQuan(queQuanTruoc)
  const ngayBoNhiemGanNhat = d(f.ngayBoNhiemGanNhat)
  const ngayNangLuong = d(f.ngayNangLuong)

  // ── Lùi thời điểm nghỉ hưu (NĐ 170/2025 Điều 61 khoản 3–5) ──
  // Ngày nghỉ hưu DỰ KIẾN vẫn do máy tính; ba trường dưới ghi QUYẾT ĐỊNH lùi và
  // phải nằm trong trần của từng trường hợp. CSDL cũng có CHECK tương ứng
  // (migration 045) — kiểm ở đây để báo lỗi tử tế thay vì ném lỗi Postgres.
  const ngayVeHuuDuKien = tinhNgayNghiHuu(ngaySinh, gioiTinh)
  const truongHopLui = f.truongHopLui === '' ? null : (f.truongHopLui ?? null)
  const ngayNghiHuuLui = d(f.ngayNghiHuuLui)
  const vanBanLuiNghiHuu = s(f.vanBanLuiNghiHuu)

  // Đây là QUYẾT ĐỊNH của người có thẩm quyền, không phải trường khai báo thường.
  // Nếu biểu mẫu gọi tới KHÔNG mang nhóm trường này (form rút gọn, form cũ, gọi từ
  // nơi khác) thì GIỮ NGUYÊN giá trị đang có, tuyệt đối không ghi đè bằng null.
  const coNhomLui = formData.has('truongHopLui') || formData.has('ngayNghiHuuLui')

  if (coNhomLui && (ngayNghiHuuLui || truongHopLui)) {
    if (!ngayNghiHuuLui) {
      return { fieldErrors: { ngayNghiHuuLui: ['Đã chọn trường hợp lùi thì phải nhập thời điểm nghỉ hưu sau khi lùi'] } }
    }
    if (!truongHopLui) {
      return { fieldErrors: { ngayNghiHuuLui: ['Chọn trường hợp lùi theo NĐ 170/2025 Điều 61 khoản 3'] } }
    }
    if (!vanBanLuiNghiHuu) {
      return { fieldErrors: { vanBanLuiNghiHuu: ['Việc lùi phải do người có thẩm quyền quyết định — nhập số, ngày văn bản'] } }
    }
    if (!ngayVeHuuDuKien) {
      return { fieldErrors: { ngayNghiHuuLui: ['Chưa đủ ngày sinh và giới tính để tính ngày nghỉ hưu dự kiến, không xét lùi được'] } }
    }
    if (ngayNghiHuuLui <= ngayVeHuuDuKien) {
      return { fieldErrors: { ngayNghiHuuLui: ['Thời điểm lùi phải SAU ngày nghỉ hưu dự kiến'] } }
    }
    const han = hanLuiToiDa(ngayVeHuuDuKien, truongHopLui)
    if (han && ngayNghiHuuLui > han) {
      const th = TRUONG_HOP_LUI[truongHopLui as MaTruongHopLui]
      return {
        fieldErrors: {
          ngayNghiHuuLui: [`Trường hợp ${truongHopLui} chỉ được lùi tối đa ${th.tranThang} tháng — muộn nhất là ${han.toLocaleDateString('vi-VN')}`],
        },
      }
    }
  }

  const data = {
    hoTen: f.hoTen.trim(),
    gioiTinh, ngaySinh,
    toChucId: f.toChucId,
    chucDanhId: s(f.chucDanhId),
    chucVu: s(f.chucVu),
    soDienThoai: s(f.soDienThoai),
    email: s(f.email),
    queQuanTruoc, queQuanSau,
    noiOTruoc: s(f.noiOTruoc),
    noiOHienNay: s(f.noiOHienNay),
    quangTriCuRa: s(f.quangTriCuRa),
    doiTuong: f.doiTuong || null,
    viTriViecLam: s(f.viTriViecLam),
    loaiHopDong: s(f.loaiHopDong),
    ngayKetThucHopDong: d(f.ngayKetThucHopDong),
    loaiHinh: s(f.loaiHinh),
    ngayVaoBienChe: d(f.ngayVaoBienChe),
    boNhiemLanDau: s(f.boNhiemLanDau),
    ngayBoNhiemGanNhat,
    ngayBoNhiemTiepTheo: addYears(ngayBoNhiemGanNhat, 5),          // = Q + 5 năm
    ngayVeHuu: ngayVeHuuDuKien,                                     // DỰ KIẾN — NĐ 135/2020
    // Chỉ ghi khi biểu mẫu thật sự mang nhóm trường này (xem coNhomLui ở trên).
    ...(coNhomLui ? { ngayNghiHuuLui, truongHopLui, vanBanLuiNghiHuu } : {}), // NĐ 170/2025 Điều 61
    maNgach: s(f.maNgach),
    bacLuong: n(f.bacLuong) != null ? Math.round(n(f.bacLuong) as number) : null,
    heSoLuong: n(f.heSoLuong),
    phuCap: n(f.phuCap),
    vuotKhung: chuanHoaPhanTramVuotKhung(n(f.vuotKhung)),
    ngayNangLuong,
    ngayNangLuongKeTiep: addYears(ngayNangLuong, 3),                // = Y + 3 năm
    ngachHienHuong: s(f.ngachHienHuong),
    ngayBoNhiemNgach: d(f.ngayBoNhiemNgach),
    trinhDoChuyenMon: s(f.trinhDoChuyenMon),
    chuyenNganh: s(f.chuyenNganh),
    namTotNghiep: s(f.namTotNghiep),
    heDaoTao: s(f.heDaoTao),
    trinhDoQLNN: s(f.trinhDoQLNN),
    namDaoTaoQLNN: s(f.namDaoTaoQLNN),
    trinhDoLLCT: s(f.trinhDoLLCT),
    namDaoTaoLLCT: s(f.namDaoTaoLLCT),
    trinhDoNgoaiNgu: s(f.trinhDoNgoaiNgu),
    namDaoTaoNgoaiNgu: s(f.namDaoTaoNgoaiNgu),
    trinhDoTinHoc: s(f.trinhDoTinHoc),
    namDaoTaoTinHoc: s(f.namDaoTaoTinHoc),
    namDaoTaoCapPhong: s(f.namDaoTaoCapPhong),
    namDaoTaoCapSo: s(f.namDaoTaoCapSo),
    qpAn: s(f.qpAn),
    namDaoTaoQPAN: s(f.namDaoTaoQPAN),
    soTheDang: s(f.soTheDang),
    ngayKetNapDang: d(f.ngayKetNapDang),
    ngayVaoDangChinhThuc: d(f.ngayVaoDangChinhThuc),
    chiBo: s(f.chiBo),
    trangThai: s(f.trangThai) ?? 'DANG_CONG_TAC',
    ghiChu: s(f.ghiChu),
    // Đồng bộ text cũ để các nơi khác còn dùng phongBan
    phongBan: undefined as string | undefined,
  }
  const toChuc = await db.toChuc.findUnique({ where: { id: f.toChucId }, select: { ten: true } })
  if (!toChuc) return { fieldErrors: { toChucId: ['Đơn vị không tồn tại'] } }
  data.phongBan = toChuc.ten

  let id = s(f.canBoId)
  if (id) {
    const old = await db.canBo.findUnique({
      where: { id },
      select: { cccd: true, userId: true, hoTen: true, ngayNghiHuuLui: true, truongHopLui: true, vanBanLuiNghiHuu: true },
    })
    if (!old) return { error: 'Không tìm thấy hồ sơ cán bộ.' }
    const newCccd = cccd ?? old.cccd
    if (newCccd !== old.cccd) {
      const trung = await db.canBo.findUnique({ where: { cccd: newCccd } })
      if (trung) return { fieldErrors: { cccd: [`CCCD đã thuộc về ${trung.hoTen}`] } }
    }
    await db.canBo.update({ where: { id }, data: { ...data, cccd: newCccd } })
    // Tài khoản đăng nhập dùng CCCD làm email → đồng bộ khi đổi
    if (newCccd !== old.cccd && old.userId) {
      const u = await db.user.findUnique({ where: { id: old.userId }, select: { email: true } })
      if (u?.email === old.cccd) await db.user.update({ where: { id: old.userId }, data: { email: newCccd } })
    }
    await logAction({
      userId: user.id, action: 'UPDATE', module: MODULES.OFFICE,
      targetId: id, targetType: 'CanBo', detail: `Cập nhật hồ sơ cán bộ ${data.hoTen}`,
    })
    // Lùi thời điểm nghỉ hưu là QUYẾT ĐỊNH của người có thẩm quyền (NĐ 170/2025
    // Điều 61 khoản 5) và làm đổi mốc ghi trong Thông báo/Quyết định nghỉ hưu →
    // ghi vết riêng, nêu rõ trước/sau, không lẫn vào log sửa hồ sơ chung.
    const doiMoc = coNhomLui && (
      old.ngayNghiHuuLui?.getTime() !== ngayNghiHuuLui?.getTime() ||
      old.truongHopLui !== truongHopLui ||
      old.vanBanLuiNghiHuu !== vanBanLuiNghiHuu
    )
    if (doiMoc) {
      const moTa = (ngay: Date | null, th: string | null, vb: string | null) =>
        ngay ? `${ngay.toLocaleDateString('vi-VN')} (TH ${th}, VB ${vb})` : 'không lùi'
      await logAction({
        userId: user.id, action: 'UPDATE', module: MODULES.OFFICE,
        targetId: id, targetType: 'CanBo',
        detail: `Lùi thời điểm nghỉ hưu ${data.hoTen}: `
          + `${moTa(old.ngayNghiHuuLui, old.truongHopLui, old.vanBanLuiNghiHuu)} → `
          + `${moTa(ngayNghiHuuLui, truongHopLui, vanBanLuiNghiHuu)}`,
      })
    }
  } else {
    if (!cccd) return { fieldErrors: { cccd: ['Nhập số CCCD (12 số) khi tạo hồ sơ mới'] } }
    const trung = await db.canBo.findUnique({ where: { cccd } })
    if (trung) return { fieldErrors: { cccd: [`CCCD đã thuộc về ${trung.hoTen}`] } }
    const moi = await db.canBo.create({ data: { ...data, cccd } })
    id = moi.id
    await logAction({
      userId: user.id, action: 'CREATE', module: MODULES.OFFICE,
      targetId: id, targetType: 'CanBo', detail: `Thêm hồ sơ cán bộ ${data.hoTen}`,
    })
  }

  revalidatePath('/dashboard/van-phong-so/ho-so')
  revalidatePath(`/dashboard/van-phong-so/ho-so/${id}`)
  redirect(`/dashboard/van-phong-so/ho-so/${id}`)
}

export async function deleteCanBoAction(prev: OfficeFormState, formData: FormData): Promise<OfficeFormState> {
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) return { error: 'Bạn không có quyền xoá hồ sơ cán bộ.' }
  const id = String(formData.get('canBoId') ?? '')
  if (!id) return { error: 'Thiếu mã hồ sơ.' }
  const cb = await db.canBo.findUnique({ where: { id }, select: { hoTen: true } })
  if (!cb) return { error: 'Không tìm thấy hồ sơ.' }
  try {
    await db.canBo.delete({ where: { id } })
  } catch {
    return { error: 'Không thể xoá: hồ sơ đang có dữ liệu liên quan (lương, khen thưởng, nghỉ phép...). Hãy chuyển trạng thái thay vì xoá.' }
  }
  await logAction({
    userId: user.id, action: 'DELETE', module: MODULES.OFFICE,
    targetId: id, targetType: 'CanBo', detail: `Xoá hồ sơ cán bộ ${cb.hoTen}`,
  })
  revalidatePath('/dashboard/van-phong-so/ho-so')
  redirect('/dashboard/van-phong-so/ho-so')
}
