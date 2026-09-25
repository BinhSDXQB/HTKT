'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { doanCapDo, doanMon, doanXepGiai, namHocHienTai } from '@/lib/con-can-bo'

// Con của cán bộ & thành tích (migration 046). Gate ghi: canManageCanBo (như hồ sơ cán bộ).
// Mỗi năm học CHỈ thêm thành tích mới — danh sách con không phải rà soát lại (tuổi/lớp tự tăng).

export type ConFormState = { ok?: boolean; error?: string } | undefined

async function nguoiQuanLy() {
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) throw new Error('Bạn không có quyền cập nhật thông tin con của cán bộ')
  return user
}

function lamMoi(canBoId?: string) {
  revalidatePath('/dashboard/van-phong-so/cac-chau')
  if (canBoId) revalidatePath(`/dashboard/van-phong-so/ho-so/${canBoId}`)
}

const CAP_HOP_LE = new Set(['TRUONG', 'XA', 'TINH', 'KHU_VUC', 'QUOC_GIA', 'QUOC_TE'])

/** Thêm thành tích (giấy khen, thi đạt giải cấp gì, môn gì) cho một cháu ở một năm học. */
export async function themThanhTich(_prev: ConFormState, fd: FormData): Promise<ConFormState> {
  try {
    const user = await nguoiQuanLy()
    const conId = String(fd.get('conId') ?? '')
    const noiDung = String(fd.get('noiDung') ?? '').replace(/\s+/g, ' ').trim()
    const loai = String(fd.get('loai') ?? 'GIAI')
    const namHoc = Number(fd.get('namHoc') || namHocHienTai())
    if (!conId || noiDung.length < 3) return { error: 'Nhập nội dung thành tích (vd: Giải Nhì Tiếng Anh IOE cấp tỉnh)' }
    if (!['DANH_HIEU', 'GIAI', 'KHAC'].includes(loai)) return { error: 'Loại thành tích không hợp lệ' }
    if (!Number.isInteger(namHoc) || namHoc < 2000 || namHoc > 2100) return { error: 'Năm học không hợp lệ' }
    const con = await db.conCanBo.findUnique({ where: { id: conId }, select: { id: true, canBoId: true, hoTen: true } })
    if (!con) return { error: 'Không tìm thấy cháu' }

    const capNhap = String(fd.get('capDo') ?? '')
    const capDo = loai === 'DANH_HIEU' ? null : (CAP_HOP_LE.has(capNhap) ? capNhap : doanCapDo(noiDung, null))
    const mon = loai === 'DANH_HIEU' ? null : (String(fd.get('mon') ?? '').trim() || doanMon(noiDung))
    const xepGiai = loai === 'DANH_HIEU' ? null : (String(fd.get('xepGiai') ?? '').trim() || doanXepGiai(noiDung))
    const gk = String(fd.get('coGiayKhen') ?? '')
    await db.thanhTichCon.create({
      data: { conId, namHoc, loai, noiDung, capDo, mon, xepGiai, coGiayKhen: gk === 'co' ? true : gk === 'khong' ? false : null, createdById: user.id },
    })
    await logAction({ userId: user.id, action: 'CREATE', module: 'office', targetId: conId, targetType: 'ThanhTichCon', detail: `Thêm thành tích năm học ${namHoc}-${namHoc + 1} cho cháu ${con.hoTen}: ${noiDung.slice(0, 150)}` }).catch(() => {})
    lamMoi(con.canBoId)
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi không xác định' }
  }
}

export async function xoaThanhTich(id: string): Promise<ConFormState> {
  try {
    const user = await nguoiQuanLy()
    const tt = await db.thanhTichCon.findUnique({ where: { id }, include: { con: { select: { canBoId: true, hoTen: true } } } })
    if (!tt) return { error: 'Không tìm thấy thành tích' }
    await db.thanhTichCon.delete({ where: { id } })
    await logAction({ userId: user.id, action: 'DELETE', module: 'office', targetId: tt.conId, targetType: 'ThanhTichCon', detail: `Xoá thành tích của cháu ${tt.con.hoTen}: ${tt.noiDung.slice(0, 150)}` }).catch(() => {})
    lamMoi(tt.con.canBoId)
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi không xác định' }
  }
}

/**
 * Cập nhật thông tin xét giảm trừ: xác nhận đúng phụ huynh (có thể chuyển sang cán bộ khác khi ghép
 * nhầm người trùng tên), bật/tắt đăng ký người phụ thuộc, điền ngày sinh thật khi có giấy khai sinh.
 */
export async function capNhatCon(_prev: ConFormState, fd: FormData): Promise<ConFormState> {
  try {
    const user = await nguoiQuanLy()
    const conId = String(fd.get('conId') ?? '')
    const con = await db.conCanBo.findUnique({ where: { id: conId } })
    if (!con) return { error: 'Không tìm thấy cháu' }

    const canBoMoi = String(fd.get('canBoId') ?? '') || con.canBoId
    if (canBoMoi !== con.canBoId && !(await db.canBo.findUnique({ where: { id: canBoMoi }, select: { id: true } }))) {
      return { error: 'Cán bộ phụ huynh không tồn tại' }
    }
    const ngaySinhRaw = String(fd.get('ngaySinh') ?? '').trim()
    let ngaySinh: Date | null = con.ngaySinh
    let namSinh = con.namSinh
    let namSinhUocTinh = con.namSinhUocTinh
    if (ngaySinhRaw) {
      const d = new Date(ngaySinhRaw)
      if (Number.isNaN(d.getTime()) || d.getFullYear() < 1990 || d > new Date()) return { error: 'Ngày sinh không hợp lệ' }
      ngaySinh = d; namSinh = d.getFullYear(); namSinhUocTinh = false
    }
    const hoTen = String(fd.get('hoTen') ?? '').replace(/\s+/g, ' ').trim() || con.hoTen
    const gt = String(fd.get('gioiTinh') ?? '')

    // Mỗi người phụ thuộc chỉ được giảm trừ cho MỘT người nộp thuế: chặn đăng ký trùng khi cả bố và mẹ
    // cùng công tác tại Sở và cùng khai một cháu (cùng họ tên + năm sinh) có đăng ký NPT.
    const dangKyNPT = fd.get('dangKyNPT') === 'on'
    if (dangKyNPT) {
      const trung = await db.conCanBo.findFirst({
        where: { id: { not: con.id }, hoTen, namSinh, dangKyNPT: true, canBoId: { not: canBoMoi } },
        include: { canBo: { select: { hoTen: true } } },
      })
      if (trung) return { error: `Cháu ${hoTen} (sinh ${namSinh}) đang được đăng ký người phụ thuộc cho ${trung.canBo.hoTen} — mỗi người phụ thuộc chỉ tính giảm trừ cho một người.` }
    }

    await db.conCanBo.update({
      where: { id: con.id },
      data: {
        canBoId: canBoMoi, hoTen, ngaySinh, namSinh, namSinhUocTinh,
        gioiTinh: gt === 'NAM' || gt === 'NU' ? gt : con.gioiTinh,
        dangKyNPT, phuHuynhDaXacNhan: fd.get('phuHuynhDaXacNhan') === 'on',
        ghiChu: String(fd.get('ghiChu') ?? '').trim() || null,
      },
    })
    await logAction({ userId: user.id, action: 'UPDATE', module: 'office', targetId: con.id, targetType: 'ConCanBo', detail: `Cập nhật cháu ${hoTen}${canBoMoi !== con.canBoId ? ' (chuyển phụ huynh)' : ''} · NPT ${dangKyNPT ? 'có' : 'không'} · xác nhận ${fd.get('phuHuynhDaXacNhan') === 'on' ? 'có' : 'chưa'}` }).catch(() => {})
    lamMoi(con.canBoId); if (canBoMoi !== con.canBoId) lamMoi(canBoMoi)
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi không xác định' }
  }
}

/** Thêm cháu mới (sinh thêm / bổ sung) — các năm sau chỉ cần dùng khi gia đình có thêm con. */
export async function themCon(_prev: ConFormState, fd: FormData): Promise<ConFormState> {
  try {
    const user = await nguoiQuanLy()
    const canBoId = String(fd.get('canBoId') ?? '')
    const hoTen = String(fd.get('hoTen') ?? '').replace(/\s+/g, ' ').trim()
    const ngaySinhRaw = String(fd.get('ngaySinh') ?? '').trim()
    const namSinhRaw = Number(fd.get('namSinh') || 0)
    if (!canBoId || hoTen.length < 3) return { error: 'Chọn cán bộ và nhập họ tên cháu' }
    const d = ngaySinhRaw ? new Date(ngaySinhRaw) : null
    const namSinh = d && !Number.isNaN(d.getTime()) ? d.getFullYear() : namSinhRaw
    if (!namSinh || namSinh < 1990 || namSinh > new Date().getFullYear()) return { error: 'Nhập ngày sinh hoặc năm sinh hợp lệ' }
    const cb = await db.canBo.findUnique({ where: { id: canBoId }, select: { id: true } })
    if (!cb) return { error: 'Không tìm thấy cán bộ' }
    const lop = Number(fd.get('lop') || 0)
    await db.conCanBo.create({
      data: {
        canBoId, hoTen, namSinh, ngaySinh: d && !Number.isNaN(d.getTime()) ? d : null, namSinhUocTinh: !d,
        lopGoc: lop >= 1 && lop <= 12 ? lop : null, namHocGoc: namHocHienTai(), dangKyNPT: fd.get('dangKyNPT') === 'on',
        phuHuynhDaXacNhan: true, nguon: 'Nhập tay',
      },
    })
    await logAction({ userId: user.id, action: 'CREATE', module: 'office', targetId: canBoId, targetType: 'ConCanBo', detail: `Thêm cháu ${hoTen} (sinh ${namSinh})` }).catch(() => {})
    lamMoi(canBoId)
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi không xác định' }
  }
}
