'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { canManageOvertimeFor, manageableToChucIds } from '@/lib/overtime/access'
import { logAction } from '@/lib/audit'
import {
  ngayKyHopLe, utcMonthStart, utcMonthEnd, ymdToUTC,
  LY_DO_MAC_DINH, DIA_DIEM_MAC_DINH, r2, monthDays, type GioNgay,
} from '@/lib/overtime/policy'

export type OvertimeFormState =
  | { ok?: boolean; error?: string; fieldErrors?: Record<string, string[]> }
  | null

const BASE_PATH = '/dashboard/cham-cong-lam-them'

/** Bỏ ngày =0, làm tròn, chỉ giữ key ngày hợp lệ (1..31). */
function cleanGioNgay(g: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(g)) {
    const day = Number(k)
    const val = Number(v)
    if (Number.isInteger(day) && day >= 1 && day <= 31 && val > 0) out[String(day)] = r2(val)
  }
  return out
}

/** Tải bảng + xác thực quyền theo phòng của bảng. */
async function loadAndAuthorize(timesheetId: string) {
  const ts = await db.overtimeTimesheet.findUnique({
    where: { id: timesheetId },
    select: { id: true, toChucId: true },
  })
  if (!ts) return null
  const user = await requireAuth()
  if (!(await canManageOvertimeFor(user, ts.toChucId))) redirect('/forbidden')
  return { ts, user }
}

// ─── Tạo bảng chấm công cho 1 phòng / tháng (tự nạp danh sách cán bộ) ───────────
const CreateSchema = z.object({
  toChucId: z.string().min(1, { message: 'Chọn phòng/đơn vị' }),
  thang: z.coerce.number().int().min(1).max(12),
  nam: z.coerce.number().int().min(2020).max(2100),
})

/** Lõi tạo/tìm bảng theo phòng+tháng+năm. Trả về id (đã có hoặc mới tạo). */
async function doCreateTimesheet(userId: string, toChucId: string, thang: number, nam: number): Promise<string> {
  const phong = await db.toChuc.findUnique({ where: { id: toChucId }, select: { ten: true } })
  if (!phong) throw new Error('Không tìm thấy đơn vị.')

  const existing = await db.overtimeTimesheet.findUnique({
    where: { toChucId_thang_nam: { toChucId, thang, nam } },
    select: { id: true },
  })
  if (existing) return existing.id

  // Kế thừa thông tin chung + DANH SÁCH NGƯỜI từ bảng gần nhất của phòng.
  const prev = await db.overtimeTimesheet.findFirst({
    where: { toChucId },
    orderBy: [{ nam: 'desc' }, { thang: 'desc' }],
    select: {
      lyDo: true, diaDiem: true, nguoiChamCong: true,
      truongPhong: true, lanhDaoSo: true, chucDanhLanhDao: true,
      entries: {
        orderBy: { thuTu: 'asc' },
        select: { canBoId: true, hoTen: true, chucVu: true, thuTu: true },
      },
    },
  })

  // Danh sách người: nếu phòng ĐÃ có bảng trước → BÊ NGUYÊN danh sách tháng trước
  // (giữ mọi thêm/bớt/sửa của người chấm công). Lần đầu mới nạp từ hồ sơ cán bộ.
  let entriesData: { canBoId: string | null; hoTen: string; chucVu: string | null; thuTu: number }[]
  let tpDefault: string | null = null
  if (prev && prev.entries.length > 0) {
    entriesData = prev.entries.map((e, i) => ({
      canBoId: e.canBoId ?? null,
      hoTen: e.hoTen,
      chucVu: e.chucVu ?? null,
      thuTu: e.thuTu || i + 1,
    }))
  } else {
    const canBos = await db.canBo.findMany({
      where: { toChucId, trangThai: { notIn: ['NGHI_VIEC', 'NGHI_HUU', 'CHUYEN_CONG_TAC'] } },
      select: {
        id: true, hoTen: true, chucVu: true, heSoLuong: true,
        chucDanh: { select: { ten: true, capQuanLy: true } },
      },
    })
    canBos.sort((a, b) =>
      (a.chucDanh?.capQuanLy ?? 99) - (b.chucDanh?.capQuanLy ?? 99) ||
      (b.heSoLuong ?? 0) - (a.heSoLuong ?? 0) ||
      a.hoTen.localeCompare(b.hoTen, 'vi'))
    tpDefault = canBos.find((c) => c.chucDanh?.capQuanLy === 3)?.hoTen ?? null
    entriesData = canBos.map((c, i) => ({
      canBoId: c.id,
      hoTen: c.hoTen,
      chucVu: c.chucDanh?.ten ?? c.chucVu ?? null,
      thuTu: i + 1,
    }))
  }

  // Lưu mốc tháng theo UTC-00:00 (khớp cách đọc getUTC* trên lưới chấm công).
  const tuNgay = utcMonthStart(nam, thang)
  const denNgay = utcMonthEnd(nam, thang)
  const created = await db.overtimeTimesheet.create({
    data: {
      toChucId,
      tenPhong: phong.ten,
      thang, nam,
      tuNgay,
      denNgay,
      ngayKy: ngayKyHopLe(denNgay),
      diaDiem: prev?.diaDiem ?? DIA_DIEM_MAC_DINH,
      lyDo: prev?.lyDo ?? LY_DO_MAC_DINH,
      nguoiChamCong: prev?.nguoiChamCong ?? null,
      truongPhong: prev?.truongPhong ?? tpDefault,
      lanhDaoSo: prev?.lanhDaoSo ?? null,
      chucDanhLanhDao: prev?.chucDanhLanhDao ?? 'Phó Giám đốc',
      createdById: userId,
      entries: { create: entriesData },
    },
    select: { id: true },
  })
  await logAction({
    userId, action: 'CREATE', module: MODULES.OFFICE,
    targetId: created.id, targetType: 'OvertimeTimesheet',
    detail: `Tạo bảng chấm công làm thêm giờ — ${phong.ten} tháng ${thang}/${nam}`,
  })
  return created.id
}

export async function createOvertimeTimesheetAction(prev: OvertimeFormState, formData: FormData): Promise<OvertimeFormState> {
  const user = await requireAuth()
  const parsed = CreateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const { toChucId, thang, nam } = parsed.data

  const allowed = await manageableToChucIds(user)
  if (!allowed.includes(toChucId)) return { error: 'Bạn chỉ được chấm công cho phòng của mình.' }

  const id = await doCreateTimesheet(user.id, toChucId, thang, nam)
  revalidatePath(BASE_PATH)
  redirect(`${BASE_PATH}/${id}`)
}

/**
 * Tự động chấm CẢ NĂM (12 tháng) cho 1 phòng: chỉ điền vào Thứ Bảy/Chủ nhật,
 * theo NGÂN SÁCH ĐỀU TỪNG THÁNG ≈ 200 ÷ 12 ≈ 16,5 giờ/tháng, chia đều cho các
 * ngày T7/CN trong tháng (bước 0,5 giờ, round-robin → mỗi ngày ~1,5–2 giờ). Nhờ
 * vậy tháng nào cũng có giờ, không dồn đầu năm; tổng cả năm ≤ 200 giờ/người.
 * Ngày thường để trống. Ghi đè các ô cuối tuần (giữ nguyên giá trị ngày thường).
 * Cộng dồn trần THEO TỪNG NGƯỜI qua cả 12 tháng (khớp canBoId).
 */
const CAP_NAM = 200
const BUOC = 0.5                                  // bước chấm 0,5 giờ
const CAP_UNITS = Math.round(CAP_NAM / BUOC)      // 400 đơn vị nửa-giờ/năm
const THANG_UNITS = Math.round(CAP_NAM / 12 / BUOC) // ≈ 33 đơn vị ≈ 16,5 giờ/tháng

export async function autoFillWeekendsAction(toChucId: string, nam: number): Promise<OvertimeFormState & { summary?: string }> {
  const user = await requireAuth()
  if (!(await canManageOvertimeFor(user, toChucId))) redirect('/forbidden')
  if (nam < 2020 || nam > 2100) return { error: 'Năm không hợp lệ.' }

  // Đảm bảo đủ 12 bảng tháng
  for (let thang = 1; thang <= 12; thang++) {
    await doCreateTimesheet(user.id, toChucId, thang, nam)
  }

  const sheets = await db.overtimeTimesheet.findMany({
    where: { toChucId, nam },
    orderBy: { thang: 'asc' },
    include: { entries: { orderBy: { thuTu: 'asc' } } },
  })

  const usedUnits = new Map<string, number>() // key người → đơn vị nửa-giờ đã dùng trong năm
  const updates: ReturnType<typeof db.overtimeEntry.update>[] = []
  const seen = new Set<string>()

  for (const ts of sheets) {
    const weekends = monthDays(nam, ts.thang).filter((d) => d.weekend).map((d) => d.day)
    for (const e of ts.entries) {
      const key = e.canBoId ?? `m:${e.id}`
      seen.add(key)
      const g: GioNgay = { ...((e.gioNgay ?? {}) as GioNgay) }
      // Ghi đè: xoá hết các ô cuối tuần (giữ ngày thường)
      for (const d of weekends) delete g[String(d)]

      const acc = usedUnits.get(key) ?? 0
      // Ngân sách tháng (đơn vị nửa-giờ), không vượt phần còn lại của trần năm.
      const budget = Math.max(0, Math.min(THANG_UNITS, CAP_UNITS - acc))
      if (weekends.length > 0 && budget > 0) {
        // Chia đều round-robin: chênh lệch giữa các ngày tối đa 0,5 giờ.
        const perDay = new Array(weekends.length).fill(0)
        for (let i = 0; i < budget; i++) perDay[i % weekends.length] += 1
        weekends.forEach((d, idx) => {
          if (perDay[idx] > 0) g[String(d)] = r2(perDay[idx] * BUOC)
        })
      }
      usedUnits.set(key, acc + budget)
      updates.push(db.overtimeEntry.update({ where: { id: e.id }, data: { gioNgay: g } }))
    }
  }
  const soNguoi = seen.size

  // Chạy theo lô để tránh transaction quá lớn
  for (let i = 0; i < updates.length; i += 50) {
    await db.$transaction(updates.slice(i, i + 50))
  }

  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE,
    targetId: toChucId, targetType: 'OvertimeTimesheet',
    detail: `Tự động chấm T7/CN cả năm ${nam} (đều ~${r2(CAP_NAM / 12)}h/tháng, ≤${CAP_NAM}h) — ${updates.length} dòng/${soNguoi} người`,
  })
  revalidatePath(BASE_PATH)
  return { ok: true, summary: `Đã chấm ${soNguoi} người trên 12 tháng năm ${nam}, chia đều ~${r2(CAP_NAM / 12)} giờ/tháng vào T7/CN (tối đa ${CAP_NAM} giờ/người/năm).` }
}

/**
 * Đồng bộ DANH SÁCH NGƯỜI: lấy danh sách của tháng ĐẦU TIÊN (số tháng nhỏ nhất)
 * đã có trong năm của phòng, áp sang TẤT CẢ các tháng còn lại. Giữ nguyên giờ đã
 * chấm của người trùng (khớp theo canBoId, hoặc theo họ tên nếu không có canBoId).
 */
export async function syncMembersFromFirstMonthAction(toChucId: string, nam: number): Promise<OvertimeFormState & { summary?: string }> {
  const user = await requireAuth()
  if (!(await canManageOvertimeFor(user, toChucId))) redirect('/forbidden')

  const sheets = await db.overtimeTimesheet.findMany({
    where: { toChucId, nam },
    orderBy: { thang: 'asc' },
    include: { entries: { orderBy: { thuTu: 'asc' } } },
  })
  if (sheets.length < 2) return { error: 'Cần ít nhất 2 tháng (1 tháng mẫu + tháng đích) để đồng bộ.' }

  const master = sheets[0]
  const masterList = master.entries.map((e, i) => ({
    canBoId: e.canBoId ?? null,
    hoTen: e.hoTen,
    chucVu: e.chucVu ?? null,
    thuTu: e.thuTu || i + 1,
  }))
  const keyOf = (canBoId: string | null, hoTen: string) =>
    canBoId ? `id:${canBoId}` : `n:${hoTen.trim().toLowerCase()}`

  let soThang = 0
  for (const ts of sheets) {
    if (ts.id === master.id) continue
    // Map giờ hiện có của tháng đích để giữ lại cho người trùng
    const hoursByKey = new Map<string, unknown>()
    for (const e of ts.entries) hoursByKey.set(keyOf(e.canBoId ?? null, e.hoTen), e.gioNgay ?? {})

    await db.$transaction([
      db.overtimeEntry.deleteMany({ where: { timesheetId: ts.id } }),
      ...masterList.map((m) =>
        db.overtimeEntry.create({
          data: {
            timesheetId: ts.id,
            canBoId: m.canBoId,
            hoTen: m.hoTen,
            chucVu: m.chucVu,
            thuTu: m.thuTu,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            gioNgay: (hoursByKey.get(keyOf(m.canBoId, m.hoTen)) ?? {}) as any,
          },
        })
      ),
    ])
    soThang++
  }

  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE,
    targetId: toChucId, targetType: 'OvertimeTimesheet',
    detail: `Đồng bộ danh sách người theo tháng ${master.thang}/${nam} sang ${soThang} tháng`,
  })
  revalidatePath(BASE_PATH)
  return { ok: true, summary: `Đã đồng bộ danh sách ${masterList.length} người (theo tháng ${master.thang}) sang ${soThang} tháng còn lại.` }
}

/** Tạo nhanh theo tab tháng (T1..T12) rồi mở luôn bảng. */
export async function quickCreateOvertimeAction(toChucId: string, thang: number, nam: number): Promise<void> {
  const user = await requireAuth()
  const allowed = await manageableToChucIds(user)
  if (!allowed.includes(toChucId)) redirect('/forbidden')
  if (thang < 1 || thang > 12) redirect(BASE_PATH)
  const id = await doCreateTimesheet(user.id, toChucId, thang, nam)
  revalidatePath(BASE_PATH)
  redirect(`${BASE_PATH}/${id}`)
}

// ─── Cập nhật thông tin chung của bảng ─────────────────────────────────────────
const MetaSchema = z.object({
  id: z.string().min(1),
  tuNgay: z.string().min(1, { message: 'Chọn ngày bắt đầu' }),
  denNgay: z.string().min(1, { message: 'Chọn ngày kết thúc' }),
  ngayKy: z.string().optional(),
  diaDiem: z.string().optional(),
  lyDo: z.string().optional(),
  nguoiChamCong: z.string().optional(),
  truongPhong: z.string().optional(),
  lanhDaoSo: z.string().optional(),
  chucDanhLanhDao: z.string().optional(),
  ghiChu: z.string().optional(),
})

export async function updateOvertimeMetaAction(prev: OvertimeFormState, formData: FormData): Promise<OvertimeFormState> {
  const parsed = MetaSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const auth = await loadAndAuthorize(d.id)
  if (!auth) return { error: 'Không tìm thấy bảng chấm công.' }
  const user = auth.user

  // Lưu UTC-00:00 để không lệch ngày khi đọc lại (getUTC*).
  const tu = ymdToUTC(d.tuNgay)
  const den = ymdToUTC(d.denNgay)
  if (!tu || !den) return { fieldErrors: { tuNgay: ['Ngày không hợp lệ'] } }
  if (den < tu) return { fieldErrors: { denNgay: ['Ngày kết thúc phải sau ngày bắt đầu'] } }

  // Ngày ký: tự né Thứ Bảy/Chủ nhật
  let ngayKy: Date | null = (d.ngayKy ? ymdToUTC(d.ngayKy) : den) ?? den
  ngayKy = ngayKyHopLe(ngayKy)

  await db.overtimeTimesheet.update({
    where: { id: d.id },
    data: {
      tuNgay: tu, denNgay: den, ngayKy,
      diaDiem: d.diaDiem || null,
      lyDo: d.lyDo || null,
      nguoiChamCong: d.nguoiChamCong || null,
      truongPhong: d.truongPhong || null,
      lanhDaoSo: d.lanhDaoSo || null,
      chucDanhLanhDao: d.chucDanhLanhDao || null,
      ghiChu: d.ghiChu || null,
    },
  })

  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE,
    targetId: d.id, targetType: 'OvertimeTimesheet',
    detail: 'Cập nhật thông tin bảng chấm công làm thêm giờ',
  })
  revalidatePath(`${BASE_PATH}/${d.id}`)
  return { ok: true }
}

// ─── Lưu giờ làm thêm của các dòng (bulk) ──────────────────────────────────────
const RowSchema = z.object({
  id: z.string().min(1),
  hoTen: z.string().min(1),
  chucVu: z.string().nullable().optional(),
  // Giờ theo ngày: { "1": 4, "2": 0, ... } — key 1..31, value 0..24
  gioNgay: z.record(z.string(), z.coerce.number().min(0).max(24)).default({}),
  ghiChu: z.string().nullable().optional(),
})

export async function saveOvertimeEntriesAction(timesheetId: string, rowsJson: string): Promise<OvertimeFormState> {
  const auth = await loadAndAuthorize(timesheetId)
  if (!auth) return { error: 'Không tìm thấy bảng chấm công.' }
  const user = auth.user

  let raw: unknown
  try { raw = JSON.parse(rowsJson) } catch { return { error: 'Dữ liệu không hợp lệ.' } }
  const parsed = z.array(RowSchema).safeParse(raw)
  if (!parsed.success) return { error: 'Dữ liệu giờ làm thêm không hợp lệ.' }

  // Chỉ cho cập nhật các dòng thuộc đúng bảng này
  const own = await db.overtimeEntry.findMany({ where: { timesheetId }, select: { id: true } })
  const ownIds = new Set(own.map((e) => e.id))
  if (parsed.data.some((row) => !ownIds.has(row.id))) {
    return { error: 'Dữ liệu giờ làm thêm không hợp lệ.' }
  }

  await db.$transaction(
    parsed.data.map((row) =>
      db.overtimeEntry.update({
        where: { id: row.id },
        data: {
          hoTen: row.hoTen.trim(),
          chucVu: row.chucVu?.trim() || null,
          gioNgay: cleanGioNgay(row.gioNgay),
          ghiChu: row.ghiChu?.trim() || null,
        },
      })
    )
  )

  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.OFFICE,
    targetId: timesheetId, targetType: 'OvertimeTimesheet',
    detail: `Lưu giờ làm thêm (${parsed.data.length} người)`,
  })
  revalidatePath(`${BASE_PATH}/${timesheetId}`)
  return { ok: true }
}

// ─── Sắp xếp lại thứ tự (kéo-thả) ──────────────────────────────────────────────
export async function reorderOvertimeEntriesAction(timesheetId: string, orderedIds: string[]): Promise<OvertimeFormState> {
  const auth = await loadAndAuthorize(timesheetId)
  if (!auth) return { error: 'Không tìm thấy bảng chấm công.' }

  const own = await db.overtimeEntry.findMany({ where: { timesheetId }, select: { id: true } })
  const ownIds = new Set(own.map((e) => e.id))
  if (orderedIds.length !== ownIds.size || orderedIds.some((id) => !ownIds.has(id))) {
    return { error: 'Thứ tự không hợp lệ.' }
  }

  await db.$transaction(
    orderedIds.map((id, i) => db.overtimeEntry.update({ where: { id }, data: { thuTu: i + 1 } }))
  )
  revalidatePath(`${BASE_PATH}/${timesheetId}`)
  return { ok: true }
}

// ─── Thêm / xoá 1 dòng ─────────────────────────────────────────────────────────
export async function addOvertimeEntryAction(timesheetId: string, hoTen: string, chucVu: string): Promise<OvertimeFormState> {
  const auth = await loadAndAuthorize(timesheetId)
  if (!auth) return { error: 'Không tìm thấy bảng chấm công.' }
  if (!hoTen.trim()) return { error: 'Nhập họ tên.' }
  const count = await db.overtimeEntry.count({ where: { timesheetId } })
  await db.overtimeEntry.create({
    data: { timesheetId, hoTen: hoTen.trim(), chucVu: chucVu.trim() || null, thuTu: count + 1 },
  })
  revalidatePath(`${BASE_PATH}/${timesheetId}`)
  return { ok: true }
}

export async function removeOvertimeEntryAction(entryId: string): Promise<OvertimeFormState> {
  const e = await db.overtimeEntry.findUnique({ where: { id: entryId }, select: { timesheetId: true } })
  if (!e) return { error: 'Không tìm thấy dòng.' }
  const auth = await loadAndAuthorize(e.timesheetId)
  if (!auth) return { error: 'Không tìm thấy bảng chấm công.' }
  await db.overtimeEntry.delete({ where: { id: entryId } })
  revalidatePath(`${BASE_PATH}/${e.timesheetId}`)
  return { ok: true }
}

// ─── Xoá bảng ──────────────────────────────────────────────────────────────────
export async function deleteOvertimeTimesheetAction(id: string): Promise<void> {
  const auth = await loadAndAuthorize(id)
  if (!auth) redirect(BASE_PATH)
  const user = auth.user
  await db.overtimeTimesheet.delete({ where: { id } })
  await logAction({
    userId: user.id, action: 'DELETE', module: MODULES.OFFICE,
    targetId: id, targetType: 'OvertimeTimesheet',
    detail: 'Xoá bảng chấm công làm thêm giờ',
  })
  revalidatePath(BASE_PATH)
  redirect(BASE_PATH)
}
