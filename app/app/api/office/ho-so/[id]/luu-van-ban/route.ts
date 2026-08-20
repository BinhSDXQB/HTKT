import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageSalary } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import {
  buildSalaryDecisionDocx, buildVuotKhungDecisionDocx,
  buildRetirementNoticeDocx, buildRetirementDecisionDocx,
} from '@/lib/office-docx'
import { streamDocx } from '@/lib/office-doc-store'
import { tinhNgayNghiHuu } from '@/lib/nghi-huu'

// Sinh văn bản (dự thảo) cho 1 cán bộ, LƯU VẾT vào Kho văn bản đã sinh rồi trả file tải về.
// Mỗi (cán bộ × loại) chỉ giữ 1 bản dự thảo mới nhất (soVanBan = null) để kho không bị trùng.
// ?loai=qd_nang_luong | tb_nghi_huu | qd_nghi_huu
// /api/office/* đã được middleware chặn theo quyền Văn phòng Sở.

type Loai = 'qd_nang_luong' | 'tb_nghi_huu' | 'qd_nghi_huu'
const LOAI_ENUM: Record<Loai, 'QD_NANG_LUONG' | 'TB_NGHI_HUU' | 'QD_NGHI_HUU'> = {
  qd_nang_luong: 'QD_NANG_LUONG',
  tb_nghi_huu: 'TB_NGHI_HUU',
  qd_nghi_huu: 'QD_NGHI_HUU',
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user
  try {
    user = await requireOfficeAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const canManage = canManageSalary(user)
  if (!canManage) {
    return NextResponse.json({ error: 'Không có quyền sinh văn bản' }, { status: 403 })
  }

  const { id } = await params
  const loai = (req.nextUrl.searchParams.get('loai') || 'qd_nang_luong') as Loai
  if (!LOAI_ENUM[loai]) return NextResponse.json({ error: 'Loại văn bản không hợp lệ' }, { status: 400 })

  const cb = await db.canBo.findUnique({ where: { id }, include: { chucDanh: true, toChuc: true } })
  if (!cb) return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 })

  // Người lao động (hợp đồng): không nghỉ hưu theo chế độ và không nâng lương ngạch
  // bậc → chặn sinh các văn bản này (dùng quy trình gia hạn/chấm dứt hợp đồng).
  if (cb.doiTuong === 'NGUOI_LAO_DONG') {
    if (loai === 'tb_nghi_huu' || loai === 'qd_nghi_huu') {
      return NextResponse.json({ error: 'Người lao động (hợp đồng) không nghỉ hưu theo chế độ — dùng quy trình gia hạn/chấm dứt hợp đồng.' }, { status: 400 })
    }
    if (loai === 'qd_nang_luong') {
      return NextResponse.json({ error: 'Người lao động (hợp đồng) hưởng lương khoán — không nâng lương ngạch bậc.' }, { status: 400 })
    }
  }

  const config = await db.facilityConfig.findFirst()
  const coQuanCapTren = config?.coQuanCapTren || 'UBND TỈNH QUẢNG TRỊ'
  const tenCoQuan = config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ'
  const chucDanh = cb.chucDanh?.ten ?? cb.chucVu ?? 'công chức'
  const donVi = cb.toChuc?.ten ?? cb.phongBan ?? ''
  const safeName = cb.hoTen.replace(/[^\p{L}\p{N}]+/gu, '_')

  let buf: Buffer
  let fileName: string
  let tieuDe: string

  if (loai === 'qd_nang_luong') {
    const isVuotKhung = cb.vuotKhung != null && cb.vuotKhung > 0
    if (isVuotKhung) {
      fileName = `DuThao_QD_Vuot_khung_${safeName}.docx`
      tieuDe = `Dự thảo QĐ nâng phụ cấp thâm niên vượt khung — ${cb.hoTen}`
      buf = await buildVuotKhungDecisionDocx({
        soQuyetDinh: '...../QĐ-SXD', hoTen: cb.hoTen, chucDanh, donVi,
        ngach: cb.ngachHienHuong, maNgach: cb.maNgach, bac: cb.bacLuong, heSo: cb.heSoLuong,
        phuCapMoi: cb.vuotKhung, ngayHuong: cb.ngayNangLuong, coQuanCapTren, tenCoQuan,
      })
    } else {
      fileName = `DuThao_QD_Nang_luong_${safeName}.docx`
      tieuDe = `Dự thảo QĐ nâng bậc lương thường xuyên — ${cb.hoTen}`
      buf = await buildSalaryDecisionDocx({
        soQuyetDinh: '...../QĐ-SXD', ngayQuyetDinh: null, loaiLabel: 'thường xuyên',
        hoTen: cb.hoTen, chucDanh, donVi, ngach: cb.ngachHienHuong, maNgach: cb.maNgach,
        bacMoi: cb.bacLuong, heSoMoi: cb.heSoLuong, ngayHuong: cb.ngayNangLuong, coQuanCapTren, tenCoQuan,
      })
    }
  } else {
    const ngayNghiHuu = cb.ngayVeHuu ?? tinhNgayNghiHuu(cb.ngaySinh, cb.gioiTinh as 'NAM' | 'NU' | null)
    const common = {
      soVanBan: '...../...-SXD', hoTen: cb.hoTen, ngaySinh: cb.ngaySinh, chucDanh, donVi,
      ngach: cb.ngachHienHuong, maNgach: cb.maNgach, bac: cb.bacLuong, heSo: cb.heSoLuong,
      ngayNghiHuu, coQuanCapTren, tenCoQuan,
      // MẪU SỐ 3 (NĐ 170/2025) yêu cầu Số sổ BHXH tại Điều 1. Mã số BHXH 10 chữ số
      // chính là số sổ BHXH theo quy định của BHXH Việt Nam nên dùng trực tiếp.
      soSoBHXH: cb.maSoBHXH,
      // "Nơi sinh" và "Nơi cư trú sau khi nghỉ hưu" KHÔNG có trong CSDL và KHÔNG suy ra
      // được từ quê quán / nơi ở hiện nay (khác nhau về pháp lý) → để trống có chủ đích,
      // biểu mẫu sẽ in "…………" để Văn phòng Sở điền trước khi trình ký.
      noiSinh: null,
      noiCuTruSauNghiHuu: null,
    }
    if (loai === 'tb_nghi_huu') {
      fileName = `DuThao_Thong_bao_nghi_huu_${safeName}.docx`
      tieuDe = `Dự thảo Thông báo nghỉ hưu — ${cb.hoTen}`
      buf = await buildRetirementNoticeDocx({ ...common, soVanBan: '...../TB-SXD' })
    } else {
      fileName = `DuThao_QD_nghi_huu_${safeName}.docx`
      tieuDe = `Dự thảo Quyết định nghỉ hưu — ${cb.hoTen}`
      buf = await buildRetirementDecisionDocx({ ...common, soVanBan: '...../QĐ-SXD' })
    }
  }

  const loaiVanBan = LOAI_ENUM[loai]
  // Giữ 1 bản dự thảo mới nhất / (cán bộ × loại): cập nhật nếu đã có, ngược lại tạo mới.
  const existing = await db.officeGeneratedDocument.findFirst({
    where: { canBoId: cb.id, loaiVanBan, soVanBan: null, reviewCaseId: null },
    select: { id: true },
  })
  if (existing) {
    await db.officeGeneratedDocument.update({
      where: { id: existing.id },
      data: { tieuDe, fileName, noiDung: new Uint8Array(buf), createdById: user.id, createdAt: new Date() },
    })
  } else {
    await db.officeGeneratedDocument.create({
      data: { loaiVanBan, canBoId: cb.id, soVanBan: null, tieuDe, fileName, noiDung: new Uint8Array(buf), createdById: user.id },
    })
  }

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: cb.id, targetType: 'CanBo',
    detail: `Lưu vào kho & tải: ${tieuDe}`,
  })

  return streamDocx(buf, fileName)
}
