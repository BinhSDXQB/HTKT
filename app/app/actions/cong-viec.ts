'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, canViewAllCongViec, type CurrentUser } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'

// ===== Phân quyền nghiệp vụ Quản lý công việc phòng/ban =====
// Mô hình scope theo PHÒNG: cong_viec.toChucId = phòng sở hữu việc; user.toChucId
// = phòng của cán bộ. Admin & Lãnh đạo Sở xem toàn bộ; còn lại xem việc của phòng
// mình hoặc việc mình tạo/phụ trách/tham gia. canViewAllCongViec ở lib/auth.ts.

/** Trưởng/Phó phòng của phòng sở hữu việc → quản lý (giao/sửa/xoá) việc của phòng. */
function isDeptLeaderOf(user: CurrentUser, toChucId: string | null): boolean {
  return !!(user.isDepartmentLeader && user.toChucId && user.toChucId === toChucId)
}

type TaskLite = { toChucId: string; createdById: string; nguoiPhuTrachId: string | null }

/** Quyền QUẢN LÝ 1 công việc (sửa toàn bộ, giao người, xoá). */
function canManageCongViec(user: CurrentUser, task: TaskLite): boolean {
  if (canViewAllCongViec(user)) return true
  if (isDeptLeaderOf(user, task.toChucId)) return true
  if (task.createdById === user.id || task.nguoiPhuTrachId === user.id) return true
  return false
}

/** Điều kiện lọc danh sách công việc theo phạm vi của user. Dùng cho trang/list. */
export async function congViecScopeWhere(): Promise<Record<string, unknown>> {
  const user = await requireAuth()
  if (canViewAllCongViec(user)) return { deletedAt: null }
  const or: Record<string, unknown>[] = [
    { createdById: user.id },
    { nguoiPhuTrachId: user.id },
    { thanhViens: { some: { userId: user.id } } },
  ]
  if (user.toChucId) or.push({ toChucId: user.toChucId })
  return { deletedAt: null, OR: or }
}

export type CongViecFormState = { error?: string; fieldErrors?: Record<string, string[]>; ok?: boolean; id?: string } | null

async function genMaCongViec(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.congViec.count({ where: { maCongViec: { startsWith: `CV-${year}-` } } })
  return `CV-${year}-${String(count + 1).padStart(6, '0')}`
}

function parseDate(v?: string | null): Date | null {
  if (!v || !v.trim()) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

const CreateSchema = z.object({
  tieuDe:          z.string().min(1, { message: 'Nhập tiêu đề công việc' }),
  moTa:            z.string().optional(),
  toChucId:        z.string().optional(),   // mặc định = phòng của user; admin/lãnh đạo chọn phòng khác
  loaiId:          z.string().optional(),
  uuTien:          z.enum(['THAP', 'TRUNG_BINH', 'CAO', 'KHAN_CAP']).default('TRUNG_BINH'),
  nguoiPhuTrachId: z.string().optional(),
  ngayBatDau:      z.string().optional(),
  ngayHetHan:      z.string().optional(),
  congViecChaId:   z.string().optional(),
  ghiChu:          z.string().optional(),
})

/** Tạo công việc mới cho phòng. Mặc định gắn vào phòng của user; admin/Lãnh đạo Sở
 *  có thể chỉ định toChucId phòng khác. */
export async function createCongViecAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const parsed = CreateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data

  // Xác định phòng sở hữu việc
  let toChucId = d.toChucId?.trim() || user.toChucId || ''
  if (!toChucId) return { error: 'Tài khoản chưa gắn phòng ban — không xác định được phòng cho công việc.' }
  // Chỉ admin/Lãnh đạo Sở mới được tạo việc cho phòng KHÁC phòng mình
  if (toChucId !== user.toChucId && !canViewAllCongViec(user)) {
    return { error: 'Bạn chỉ được tạo công việc cho phòng của mình.' }
  }

  const customFields = formData.get('customFields')
  let customJson: unknown = undefined
  if (typeof customFields === 'string' && customFields.trim()) {
    try { customJson = JSON.parse(customFields) } catch { return { error: 'Trường động (customFields) không phải JSON hợp lệ.' } }
  }

  let maCongViec = await genMaCongViec()
  // Chống trùng mã do tạo đồng thời: thử lại tối đa 3 lần
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const cv = await db.congViec.create({
        data: {
          maCongViec, tieuDe: d.tieuDe, moTa: d.moTa || null,
          toChucId, loaiId: d.loaiId || null, uuTien: d.uuTien,
          nguoiGiaoId: user.id,
          nguoiPhuTrachId: d.nguoiPhuTrachId || null,
          ngayBatDau: parseDate(d.ngayBatDau), ngayHetHan: parseDate(d.ngayHetHan),
          congViecChaId: d.congViecChaId || null,
          customFields: customJson as never, ghiChu: d.ghiChu || null,
          createdById: user.id,
          nhatKys: { create: { userId: user.id, loai: 'TAO', noiDung: 'Tạo công việc' } },
        },
      })
      await logAction({ userId: user.id, action: 'CREATE', module: MODULES.OFFICE, targetId: cv.id, targetType: 'CongViec', detail: `Tạo công việc ${cv.maCongViec}: ${cv.tieuDe}` })
      revalidatePath('/dashboard/cong-viec')
      return { ok: true, id: cv.id }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
        maCongViec = await genMaCongViec(); continue
      }
      throw e
    }
  }
  return { error: 'Không tạo được mã công việc (trùng liên tục). Thử lại.' }
}

const UpdateSchema = CreateSchema.extend({ id: z.string().min(1) })

/** Sửa thông tin công việc (chỉ người có quyền quản lý việc đó). */
export async function updateCongViecAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const d = parsed.data
  const task = await db.congViec.findUnique({ where: { id: d.id }, select: { toChucId: true, createdById: true, nguoiPhuTrachId: true } })
  if (!task || !canManageCongViec(user, task)) return { error: 'Không có quyền sửa công việc này.' }

  await db.congViec.update({
    where: { id: d.id },
    data: {
      tieuDe: d.tieuDe, moTa: d.moTa || null, loaiId: d.loaiId || null, uuTien: d.uuTien,
      nguoiPhuTrachId: d.nguoiPhuTrachId || null,
      ngayBatDau: parseDate(d.ngayBatDau), ngayHetHan: parseDate(d.ngayHetHan),
      ghiChu: d.ghiChu || null,
    },
  })
  revalidatePath('/dashboard/cong-viec')
  revalidatePath(`/dashboard/cong-viec/${d.id}`)
  return { ok: true, id: d.id }
}

const TRANG_THAI = ['MOI', 'DANG_LAM', 'TAM_DUNG', 'CHO_DUYET', 'HOAN_THANH', 'HUY'] as const

/** Cập nhật trạng thái + tiến độ; tự ghi nhật ký. Người phụ trách/thành viên cũng được cập nhật. */
export async function updateTrangThaiAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  let trangThai = String(formData.get('trangThai') ?? '')
  const tienDoRaw = formData.get('tienDo')
  if (!TRANG_THAI.includes(trangThai as never)) return { error: 'Trạng thái không hợp lệ.' }

  const task = await db.congViec.findUnique({
    where: { id },
    select: { toChucId: true, createdById: true, nguoiPhuTrachId: true, trangThai: true, thanhViens: { select: { userId: true } } },
  })
  if (!task) return { error: 'Không tìm thấy công việc.' }
  const isMember = task.thanhViens.some(t => t.userId === user.id)
  if (!canManageCongViec(user, task) && !isMember) return { error: 'Không có quyền cập nhật công việc này.' }

  let tienDo: number | undefined
  if (tienDoRaw != null && String(tienDoRaw).trim() !== '') {
    tienDo = Math.max(0, Math.min(100, parseInt(String(tienDoRaw), 10) || 0))
  }
  // ── Đồng bộ trạng thái ⇄ tiến độ để các khung Danh sách/Bảng/Lịch + thẻ thống kê
  //    luôn khớp nhau (tất cả đều đếm theo trạng thái) ──
  // Chọn "Hoàn thành" → tiến độ phải là 100%.
  if (trangThai === 'HOAN_THANH') tienDo = 100
  // Kéo tiến độ tới 100% mà vẫn đang ở Mới/Đang làm → tự chuyển sang Hoàn thành.
  else if (tienDo === 100 && (trangThai === 'MOI' || trangThai === 'DANG_LAM')) trangThai = 'HOAN_THANH'
  // Hạ tiến độ xuống dưới 100% nhưng vẫn để "Hoàn thành" → đưa về Đang làm cho nhất quán.
  else if (tienDo != null && tienDo < 100 && trangThai === 'HOAN_THANH') trangThai = 'DANG_LAM'

  const isDone = trangThai === 'HOAN_THANH'

  await db.$transaction([
    db.congViec.update({
      where: { id },
      data: {
        trangThai: trangThai as never,
        ...(tienDo != null ? { tienDo } : {}),
        // Đặt ngày hoàn thành khi chuyển sang Hoàn thành; gỡ khi rời trạng thái này.
        ...(isDone ? { ngayHoanThanh: new Date() } : { ngayHoanThanh: null }),
      },
    }),
    db.congViecNhatKy.create({
      data: { congViecId: id, userId: user.id, loai: 'DOI_TRANG_THAI', giaTriCu: task.trangThai, giaTriMoi: trangThai, noiDung: tienDo != null ? `Tiến độ ${tienDo}%` : null },
    }),
  ])
  revalidatePath('/dashboard/cong-viec')
  revalidatePath(`/dashboard/cong-viec/${id}`)
  return { ok: true, id }
}

/** Thêm bình luận / ghi chú vào nhật ký công việc (mọi người trong phạm vi đều được). */
export async function addBinhLuanAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const noiDung = String(formData.get('noiDung') ?? '').trim()
  if (!noiDung) return { error: 'Nhập nội dung bình luận.' }
  const task = await db.congViec.findUnique({ where: { id }, select: { toChucId: true, createdById: true, nguoiPhuTrachId: true, thanhViens: { select: { userId: true } } } })
  if (!task) return { error: 'Không tìm thấy công việc.' }
  const inScope = canManageCongViec(user, task) || task.thanhViens.some(t => t.userId === user.id) || user.toChucId === task.toChucId
  if (!inScope) return { error: 'Không có quyền bình luận công việc này.' }
  await db.congViecNhatKy.create({ data: { congViecId: id, userId: user.id, loai: 'BINH_LUAN', noiDung } })
  revalidatePath(`/dashboard/cong-viec/${id}`)
  return { ok: true, id }
}

/** Gán thành viên tham gia (chủ trì/phối hợp/theo dõi) — chỉ người quản lý việc. */
export async function setThanhVienAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const userId = String(formData.get('userId') ?? '')
  const vaiTro = String(formData.get('vaiTro') ?? 'PHOI_HOP')
  const task = await db.congViec.findUnique({ where: { id }, select: { toChucId: true, createdById: true, nguoiPhuTrachId: true } })
  if (!task || !canManageCongViec(user, task)) return { error: 'Không có quyền giao việc.' }
  await db.congViecThanhVien.upsert({
    where: { congViecId_userId: { congViecId: id, userId } },
    create: { congViecId: id, userId, vaiTro: vaiTro as never },
    update: { vaiTro: vaiTro as never },
  })
  await db.congViecNhatKy.create({ data: { congViecId: id, userId: user.id, loai: 'GIAO_VIEC', noiDung: `Gán thành viên (${vaiTro})` } })
  revalidatePath(`/dashboard/cong-viec/${id}`)
  return { ok: true, id }
}

/** Gỡ thành viên khỏi công việc — chỉ người quản lý việc. */
export async function removeThanhVienAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const userId = String(formData.get('userId') ?? '')
  const task = await db.congViec.findUnique({ where: { id }, select: { toChucId: true, createdById: true, nguoiPhuTrachId: true } })
  if (!task || !canManageCongViec(user, task)) return { error: 'Không có quyền gỡ thành viên.' }
  const tv = await db.congViecThanhVien.findUnique({
    where: { congViecId_userId: { congViecId: id, userId } },
    include: { user: { select: { name: true } } },
  })
  if (!tv) return { error: 'Thành viên không có trong công việc.' }
  await db.$transaction([
    db.congViecThanhVien.delete({ where: { id: tv.id } }),
    db.congViecNhatKy.create({ data: { congViecId: id, userId: user.id, loai: 'GIAO_VIEC', noiDung: `Gỡ thành viên ${tv.user.name}` } }),
  ])
  revalidatePath(`/dashboard/cong-viec/${id}`)
  return { ok: true, id }
}

// ===== Checklist đầu việc con =====
// Thêm/tick: người quản lý việc + người phụ trách + thành viên (cùng người làm việc).
// Xoá mục: chỉ người quản lý việc.

type TaskWithMembers = TaskLite & { thanhViens: { userId: string }[] }

function canWorkOnCongViec(user: CurrentUser, task: TaskWithMembers): boolean {
  return canManageCongViec(user, task) || task.thanhViens.some(t => t.userId === user.id)
}

const taskSelect = { toChucId: true, createdById: true, nguoiPhuTrachId: true, thanhViens: { select: { userId: true } } } as const

/** Thêm mục checklist. */
export async function addCheckListAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const noiDung = String(formData.get('noiDung') ?? '').trim()
  if (!noiDung) return { error: 'Nhập nội dung đầu việc.' }
  const task = await db.congViec.findUnique({ where: { id }, select: taskSelect })
  if (!task || !canWorkOnCongViec(user, task)) return { error: 'Không có quyền thêm đầu việc.' }
  const max = await db.congViecCheckList.aggregate({ where: { congViecId: id }, _max: { thuTu: true } })
  await db.congViecCheckList.create({ data: { congViecId: id, noiDung, thuTu: (max._max.thuTu ?? 0) + 1 } })
  revalidatePath(`/dashboard/cong-viec/${id}`)
  return { ok: true, id }
}

/** Tick / bỏ tick 1 mục checklist. */
export async function toggleCheckListAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const itemId = String(formData.get('itemId') ?? '')
  const item = await db.congViecCheckList.findUnique({
    where: { id: itemId },
    include: { congViec: { select: taskSelect } },
  })
  if (!item) return { error: 'Không tìm thấy đầu việc.' }
  if (!canWorkOnCongViec(user, item.congViec)) return { error: 'Không có quyền cập nhật đầu việc.' }
  await db.congViecCheckList.update({ where: { id: itemId }, data: { hoanThanh: !item.hoanThanh } })
  revalidatePath(`/dashboard/cong-viec/${item.congViecId}`)
  return { ok: true, id: item.congViecId }
}

/** Xoá 1 mục checklist — chỉ người quản lý việc. */
export async function deleteCheckListAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const itemId = String(formData.get('itemId') ?? '')
  const item = await db.congViecCheckList.findUnique({
    where: { id: itemId },
    include: { congViec: { select: taskSelect } },
  })
  if (!item) return { error: 'Không tìm thấy đầu việc.' }
  if (!canManageCongViec(user, item.congViec)) return { error: 'Không có quyền xoá đầu việc.' }
  await db.congViecCheckList.delete({ where: { id: itemId } })
  revalidatePath(`/dashboard/cong-viec/${item.congViecId}`)
  return { ok: true, id: item.congViecId }
}

/** Xoá mềm công việc — chỉ người quản lý việc. */
export async function deleteCongViecAction(prev: CongViecFormState, formData: FormData): Promise<CongViecFormState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const task = await db.congViec.findUnique({ where: { id }, select: { toChucId: true, createdById: true, nguoiPhuTrachId: true } })
  if (!task || !canManageCongViec(user, task)) return { error: 'Không có quyền xoá công việc này.' }
  await db.congViec.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAction({ userId: user.id, action: 'DELETE', module: MODULES.OFFICE, targetId: id, targetType: 'CongViec', detail: 'Xoá (mềm) công việc' })
  revalidatePath('/dashboard/cong-viec')
  return { ok: true }
}
