'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getQd72Auth } from '@/lib/qd72/auth'
import { coQuyen, coTheSua } from '@/lib/qd72/phan-quyen'
import { danhGiaSoBoCase, type DanhGiaItem } from '@/lib/qd72/danh-gia-db'

// CRUD + workflow hồ sơ khảo sát QĐ72 (bảng qd72_survey_cases). Enforcement ở backend.
// Trạng thái: DRAFT→SUBMITTED→RETURNED→TECHNICAL_VERIFICATION→VERIFIED→APPROVED→ARCHIVED.

const db_ = db as unknown as {
  qd72_survey_cases: {
    findMany: (a: unknown) => Promise<Record<string, unknown>[]>
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    create: (a: unknown) => Promise<{ id: string }>
    update: (a: unknown) => Promise<{ id: string }>
  }
  qd72_workflow_history: { create: (a: unknown) => Promise<unknown> }
}

export type Qd72CaseRow = {
  id: string; ma: string | null; ten: string; trangThai: string
  nhomDanhGia: string | null; donViHanhChinhId: string | null
  ngayKhaoSat: string | null; createdAt: string
}
export type Qd72Result = { ok: boolean; error?: string; id?: string }

export type Qd72CaseInput = {
  ten: string
  donViHanhChinhId?: string        // QUAN_TRI/SO nhập; XA_PHUONG lấy theo địa bàn
  ma?: string
  ngayKhaoSat?: string
  thanhPhanKhaoSat?: string
  moTa?: string
  chiTiet?: Record<string, unknown>
}

function parseDate(v?: string): Date | null {
  if (!v || !v.trim()) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Danh sách hồ sơ — XA_PHUONG chỉ thấy địa bàn mình; Sở/Quản trị/đơn vị xác minh thấy toàn tỉnh. */
export async function listSurveyCases(): Promise<Qd72CaseRow[]> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')

  const where: Record<string, unknown> = {}
  if (auth.vaiTro === 'XA_PHUONG') where.don_vi_hanh_chinh_id = auth.wardId ?? '__none__'

  const rows = await db_.qd72_survey_cases.findMany({
    where, orderBy: { created_at: 'desc' }, take: 500,
  })
  return rows.map((r) => ({
    id: r.id as string,
    ma: (r.ma as string) ?? null,
    ten: r.ten as string,
    trangThai: r.trang_thai as string,
    nhomDanhGia: (r.nhom_danh_gia as string) ?? null,
    donViHanhChinhId: (r.don_vi_hanh_chinh_id as string) ?? null,
    ngayKhaoSat: r.ngay_khao_sat ? (r.ngay_khao_sat as Date).toISOString() : null,
    createdAt: (r.created_at as Date).toISOString(),
  }))
}

async function loadCase(id: string) {
  return db_.qd72_survey_cases.findUnique({
    where: { id }, select: { id: true, trang_thai: true, don_vi_hanh_chinh_id: true },
  })
}

/** Sinh mã hồ sơ QĐ72-YYYY-NNNNNN (đơn giản, chống trùng bằng thời gian). */
function genMa(): string {
  return `QĐ72-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
}

export async function createSurveyCase(input: Qd72CaseInput): Promise<Qd72Result> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  if (!coQuyen(auth.vaiTro, 'TAO')) return { ok: false, error: 'Không có quyền tạo hồ sơ.' }

  const ten = (input.ten ?? '').trim()
  if (!ten) return { ok: false, error: 'Vui lòng nhập tên khu vực đô thị.' }

  // XA_PHUONG: khoá địa bàn theo tài khoản; QUAN_TRI: theo lựa chọn.
  const wardId = auth.vaiTro === 'XA_PHUONG' ? auth.wardId : (input.donViHanhChinhId ?? null)
  if (auth.vaiTro === 'XA_PHUONG' && !wardId) {
    return { ok: false, error: 'Tài khoản chưa gắn xã/phường.' }
  }

  try {
    const created = await db_.qd72_survey_cases.create({
      data: {
        ma: input.ma?.trim() || genMa(),
        ten,
        don_vi_hanh_chinh_id: wardId,
        to_chuc_id: auth.toChucId,
        trang_thai: 'DRAFT',
        ngay_khao_sat: parseDate(input.ngayKhaoSat),
        thanh_phan_khao_sat: input.thanhPhanKhaoSat?.trim() || null,
        mo_ta: input.moTa?.trim() || null,
        chi_tiet: input.chiTiet ?? {},
        created_by_id: auth.userId,
      },
    })
    revalidatePath('/dashboard/qd72')
    return { ok: true, id: created.id }
  } catch (e) {
    console.error('[createSurveyCase]', e)
    return { ok: false, error: 'Lỗi tạo hồ sơ, vui lòng thử lại.' }
  }
}

export async function updateSurveyCase(id: string, input: Qd72CaseInput): Promise<Qd72Result> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')

  const cur = await loadCase(id)
  if (!cur) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  // Xã chỉ sửa hồ sơ địa bàn mình + chỉ khi DRAFT/RETURNED (không sửa hồ sơ đã xác minh).
  if (auth.vaiTro === 'XA_PHUONG' && cur.don_vi_hanh_chinh_id !== auth.wardId) {
    return { ok: false, error: 'Không có quyền sửa hồ sơ địa bàn khác.' }
  }
  if (!coTheSua(auth.vaiTro, cur.trang_thai as string)) {
    return { ok: false, error: 'Hồ sơ không ở trạng thái được phép sửa.' }
  }

  const ten = (input.ten ?? '').trim()
  if (!ten) return { ok: false, error: 'Vui lòng nhập tên khu vực đô thị.' }

  try {
    await db_.qd72_survey_cases.update({
      where: { id },
      data: {
        ten,
        ngay_khao_sat: parseDate(input.ngayKhaoSat),
        thanh_phan_khao_sat: input.thanhPhanKhaoSat?.trim() || null,
        mo_ta: input.moTa?.trim() || null,
        ...(input.chiTiet ? { chi_tiet: input.chiTiet } : {}),
        updated_by_id: auth.userId,
      },
    })
    revalidatePath('/dashboard/qd72')
    return { ok: true, id }
  } catch (e) {
    console.error('[updateSurveyCase]', e)
    return { ok: false, error: 'Lỗi cập nhật hồ sơ, vui lòng thử lại.' }
  }
}

/** Chuyển trạng thái + ghi lịch sử (workflow). */
async function chuyenTrangThai(id: string, moi: string, yKien: string | undefined, userId: string, cu: string) {
  await db_.qd72_survey_cases.update({ where: { id }, data: { trang_thai: moi } })
  await db_.qd72_workflow_history.create({
    data: { survey_case_id: id, trang_thai_cu: cu, trang_thai_moi: moi, y_kien: yKien?.trim() || null, nguoi_thuc_hien_id: userId },
  })
  revalidatePath('/dashboard/qd72')
}

/** Xã gửi hồ sơ: DRAFT/RETURNED → SUBMITTED. */
export async function submitSurveyCase(id: string): Promise<Qd72Result> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  if (!coQuyen(auth.vaiTro, 'GUI')) return { ok: false, error: 'Không có quyền gửi hồ sơ.' }

  const cur = await loadCase(id)
  if (!cur) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  if (auth.vaiTro === 'XA_PHUONG' && cur.don_vi_hanh_chinh_id !== auth.wardId) {
    return { ok: false, error: 'Không có quyền gửi hồ sơ địa bàn khác.' }
  }
  const tt = cur.trang_thai as string
  if (tt !== 'DRAFT' && tt !== 'RETURNED') return { ok: false, error: 'Chỉ gửi được hồ sơ Nháp/Bị trả lại.' }

  try { await chuyenTrangThai(id, 'SUBMITTED', undefined, auth.userId, tt); return { ok: true, id } }
  catch (e) { console.error('[submitSurveyCase]', e); return { ok: false, error: 'Lỗi gửi hồ sơ.' } }
}

/** Sở trả lại hồ sơ: SUBMITTED → RETURNED (kèm ý kiến). */
export async function returnSurveyCase(id: string, yKien: string): Promise<Qd72Result> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  if (!coQuyen(auth.vaiTro, 'TRA_LAI')) return { ok: false, error: 'Không có quyền trả lại hồ sơ.' }

  const cur = await loadCase(id)
  if (!cur) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  const tt = cur.trang_thai as string
  if (tt !== 'SUBMITTED' && tt !== 'TECHNICAL_VERIFICATION') return { ok: false, error: 'Chỉ trả lại hồ sơ đã gửi/đang xác minh.' }
  if (!yKien?.trim()) return { ok: false, error: 'Vui lòng nhập lý do trả lại.' }

  try { await chuyenTrangThai(id, 'RETURNED', yKien, auth.userId, tt); return { ok: true, id } }
  catch (e) { console.error('[returnSurveyCase]', e); return { ok: false, error: 'Lỗi trả lại hồ sơ.' } }
}

export type Qd72DanhGiaResult = {
  ok: boolean; error?: string
  nhomDeXuat?: string; tomTat?: Record<string, number>; items?: DanhGiaItem[]
}

/** Chạy ĐÁNH GIÁ SƠ BỘ (đọc tiêu chí từ bảng cấu hình) + lưu nhóm đánh giá ĐỀ XUẤT vào hồ sơ.
 *  Đây chỉ là gợi ý sơ bộ — kết luận chính thức do người có thẩm quyền xác minh (Phiếu 05). */
export async function evaluateCase(id: string): Promise<Qd72DanhGiaResult> {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  const cur = await loadCase(id)
  if (!cur) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
  if (auth.vaiTro === 'XA_PHUONG' && cur.don_vi_hanh_chinh_id !== auth.wardId) {
    return { ok: false, error: 'Không có quyền đánh giá hồ sơ địa bàn khác.' }
  }
  try {
    const kq = await danhGiaSoBoCase(id)
    await db_.qd72_survey_cases.update({ where: { id }, data: { nhom_danh_gia: kq.nhomDeXuat } })
    revalidatePath('/dashboard/qd72')
    return { ok: true, nhomDeXuat: kq.nhomDeXuat, tomTat: kq.tomTat, items: kq.items }
  } catch (e) {
    console.error('[evaluateCase]', e)
    return { ok: false, error: 'Lỗi đánh giá sơ bộ.' }
  }
}
