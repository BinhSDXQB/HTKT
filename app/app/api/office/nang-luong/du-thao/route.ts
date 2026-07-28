import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageSalary } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { buildSalaryDecisionDocx, buildVuotKhungDecisionDocx } from '@/lib/office-docx'
import { streamDocx } from '@/lib/office-doc-store'

// Sinh DỰ THẢO Quyết định nâng lương (.docx) cho 1 cán bộ dựa trên dữ liệu can_bo
// (hệ số hiện tại = hệ số mới dự kiến, ngày lên lương = ngày hưởng). Số QĐ / căn cứ
// pháp lý / bậc để trống cho Văn phòng Sở điền. Bản dự thảo ĐƯỢC lưu vào Kho
// văn bản đã sinh (mỗi cán bộ 1 bản mới nhất, tiêu đề có tiền tố "[Dự thảo]").
// /api/office/* đã được middleware chặn theo quyền Văn phòng Sở.
export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireOfficeAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const canManage = canManageSalary(user)
  if (!canManage) {
    return NextResponse.json({ error: 'Không có quyền sinh văn bản nâng lương' }, { status: 403 })
  }

  const canBoId = req.nextUrl.searchParams.get('canBoId')
  if (!canBoId) return NextResponse.json({ error: 'Thiếu canBoId' }, { status: 400 })

  const cb = await db.canBo.findUnique({
    where: { id: canBoId },
    include: { chucDanh: true, toChuc: true },
  })
  if (!cb) return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 })

  const config = await db.facilityConfig.findFirst()
  const safeName = cb.hoTen.replace(/[^\p{L}\p{N}]+/gu, '_')

  const coQuanCapTren = config?.coQuanCapTren || 'UBND TỈNH QUẢNG TRỊ'
  const tenCoQuan = config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ'
  const chucDanh = cb.chucDanh?.ten ?? cb.chucVu ?? 'công chức'
  const donVi = cb.toChuc?.ten ?? cb.phongBan ?? ''

  // Tự nhận diện loại: có % vượt khung → QĐ nâng phụ cấp thâm niên vượt khung;
  // ngược lại → QĐ nâng bậc lương thường xuyên. ?loai=vk|tx để ép kiểu.
  const loaiParam = req.nextUrl.searchParams.get('loai')
  const isVuotKhung = loaiParam === 'vk' || (loaiParam !== 'tx' && cb.vuotKhung != null && cb.vuotKhung > 0)

  let buf: Buffer
  let fileName: string
  if (isVuotKhung) {
    fileName = `DuThao_QD_Vuot_khung_${safeName}.docx`
    buf = await buildVuotKhungDecisionDocx({
      soQuyetDinh:   '...../QĐ-SXD',
      hoTen:         cb.hoTen,
      chucDanh, donVi,
      phuCapMoi:     cb.vuotKhung,      // % vượt khung hiện tại — VP Sở xác nhận
      ngayHuong:     cb.ngayNangLuong,
      coQuanCapTren, tenCoQuan,
    })
  } else {
    fileName = `DuThao_QD_Nang_luong_${safeName}.docx`
    buf = await buildSalaryDecisionDocx({
      soQuyetDinh:   '...../QĐ-SXD',
      ngayQuyetDinh: null,
      loaiLabel:     'thường xuyên',
      hoTen:         cb.hoTen,
      chucDanh, donVi,
      heSoMoi:       cb.heSoLuong,      // hệ số mới (hiện hưởng) — VP Sở xác nhận/điều chỉnh
      ngayHuong:     cb.ngayNangLuong,  // ngày lên lương
      coQuanCapTren, tenCoQuan,
    })
  }

  // Lưu vết bản dự thảo vào Kho văn bản đã sinh. Dự thảo = reviewCaseId NULL;
  // mỗi cán bộ chỉ giữ 1 bản mới nhất → tải lại ghi đè, không sinh thêm dòng.
  // Bọc try/catch để lỗi lưu vết không làm hỏng việc tải file (mục đích chính).
  const loaiNhan = isVuotKhung ? 'QĐ vượt khung' : 'QĐ nâng lương'
  try {
    await db.officeGeneratedDocument.deleteMany({
      where: { canBoId: cb.id, reviewCaseId: null, loaiVanBan: 'QD_NANG_LUONG' },
    })
    await db.officeGeneratedDocument.create({
      data: {
        loaiVanBan:  'QD_NANG_LUONG',
        canBoId:     cb.id,
        reviewCaseId: null,
        soVanBan:    null,
        tieuDe:      `[Dự thảo] ${loaiNhan} — ${cb.hoTen}`,
        fileName,
        noiDung:     new Uint8Array(buf),
        createdById: user.id,
      },
    })
  } catch (e) {
    console.error('Lưu dự thảo vào Kho văn bản thất bại:', e)
  }

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: cb.id, targetType: 'CanBo',
    detail: `Sinh dự thảo ${loaiNhan} ${cb.hoTen}`,
  })

  return streamDocx(buf, fileName)
}
