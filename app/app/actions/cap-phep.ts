'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const num = z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().optional())

function genCode(prefix: string) {
  const d = new Date()
  return `${prefix}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getTime()).slice(-4)}`
}

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

// ─── 9.1 Phương tiện ───────────────────────────────────────────────────────────

const VehicleSchema = z.object({
  plateNumber:       z.string().min(1, { message: 'Nhập biển số' }),
  ownerName:         z.string().min(1, { message: 'Nhập chủ xe' }),
  brand:             z.string().optional(),
  vehicleType:       z.string().optional(),
  axleCount:         z.preprocess((v) => (v === '' || v == null ? undefined : parseInt(String(v), 10)), z.number().int().optional()),
  designLoadTon:     num,
  registeredLoadTon: num,
  lengthM:           num,
  widthM:            num,
  heightM:           num,
  techSpecs:         z.string().optional(),
  note:              z.string().optional(),
})

export async function createVehicleAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAuth()
  const parsed = VehicleSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const exists = await db.permitVehicle.findUnique({ where: { plateNumber: d.plateNumber } })
  if (exists) return { error: 'Biển số đã tồn tại trong hệ thống' }

  const v = await db.permitVehicle.create({
    data: {
      plateNumber: d.plateNumber,
      ownerName: d.ownerName,
      brand: d.brand || null,
      vehicleType: d.vehicleType || null,
      axleCount: d.axleCount ?? null,
      designLoadTon: d.designLoadTon ?? null,
      registeredLoadTon: d.registeredLoadTon ?? null,
      lengthM: d.lengthM ?? null,
      widthM: d.widthM ?? null,
      heightM: d.heightM ?? null,
      techSpecs: d.techSpecs || null,
      note: d.note || null,
      createdById: user.id,
    },
  })
  await logAction({ userId: user.id, action: 'CREATE', module: 'cap_phep', targetId: v.id, targetType: 'PermitVehicle', detail: `Thêm phương tiện ${v.plateNumber}` })
  revalidatePath('/dashboard/cap-phep/phuong-tien')
  redirect('/dashboard/cap-phep/phuong-tien')
}

// ─── 9.1 Hồ sơ xe quá khổ / quá tải ────────────────────────────────────────────

const OversizedSchema = z.object({
  permitType:       z.enum(['QUA_KHO', 'QUA_TAI', 'BANH_XICH', 'SIEU_TRUONG', 'SIEU_TRONG']),
  applicantType:    z.enum(['TO_CHUC', 'CA_NHAN']).default('TO_CHUC'),
  applicantName:    z.string().min(1, { message: 'Nhập tên tổ chức/cá nhân' }),
  applicantPhone:   z.string().optional(),
  applicantAddress: z.string().optional(),
  vehicleId:        z.string().optional(),
  cargoType:        z.string().optional(),
  totalWeightTon:   num,
  axleLoadTon:      num,
  overallLengthM:   num,
  overallWidthM:    num,
  overallHeightM:   num,
  travelFrom:       z.string().optional(),
  travelTo:         z.string().optional(),
  validFrom:        z.string().optional(),
  validTo:          z.string().optional(),
  needEscort:       z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).default(false),
  appraisalNote:    z.string().optional(),
})

export async function createOversizedPermitAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAuth()
  const parsed = OversizedSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const p = await db.oversizedVehiclePermit.create({
    data: {
      fileCode: genCode('XQK'),
      permitType: d.permitType,
      status: 'TAO_MOI',
      applicantType: d.applicantType,
      applicantName: d.applicantName,
      applicantPhone: d.applicantPhone || null,
      applicantAddress: d.applicantAddress || null,
      vehicleId: d.vehicleId || null,
      cargoType: d.cargoType || null,
      totalWeightTon: d.totalWeightTon ?? null,
      axleLoadTon: d.axleLoadTon ?? null,
      overallLengthM: d.overallLengthM ?? null,
      overallWidthM: d.overallWidthM ?? null,
      overallHeightM: d.overallHeightM ?? null,
      travelFrom: d.travelFrom || null,
      travelTo: d.travelTo || null,
      validFrom: d.validFrom ? new Date(d.validFrom) : null,
      validTo: d.validTo ? new Date(d.validTo) : null,
      needEscort: d.needEscort,
      appraisalNote: d.appraisalNote || null,
      createdById: user.id,
    },
  })
  await logAction({ userId: user.id, action: 'CREATE', module: 'cap_phep', targetId: p.id, targetType: 'OversizedVehiclePermit', detail: `Tạo hồ sơ xe quá khổ ${p.fileCode}` })
  revalidatePath('/dashboard/cap-phep/xe-qua-kho')
  redirect(`/dashboard/cap-phep/xe-qua-kho/${p.id}`)
}

// ─── 9.2 Hồ sơ đấu nối ──────────────────────────────────────────────────────────

const ConnectionSchema = z.object({
  connectionType: z.enum(['CHINH_THUC', 'TAM_THOI']).default('CHINH_THUC'),
  stage:          z.enum(['CHAP_THUAN_VI_TRI', 'CHAP_THUAN_THIET_KE', 'CAP_PHEP_THI_CONG']).default('CHAP_THUAN_VI_TRI'),
  applicantType:  z.enum(['TO_CHUC', 'CA_NHAN']).default('TO_CHUC'),
  applicantName:  z.string().min(1, { message: 'Nhập chủ đầu tư/cá nhân' }),
  applicantPhone: z.string().optional(),
  projectName:    z.string().optional(),
  roadName:       z.string().optional(),
  roadClass:      z.enum(['QUOC_LO', 'DUONG_TINH', 'DUONG_HUYEN', 'DUONG_DO_THI', 'DUONG_XA', 'DUONG_CHUYEN_DUNG']).optional(),
  km:             num,
  latitude:       num,
  longitude:      num,
  purpose:        z.string().optional(),
  designNote:     z.string().optional(),
  trafficPlan:    z.string().optional(),
})

export async function createConnectionAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAuth()
  const parsed = ConnectionSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const a = await db.roadConnectionApplication.create({
    data: {
      fileCode: genCode('DN'),
      connectionType: d.connectionType,
      stage: d.stage,
      status: 'TAO_MOI',
      applicantType: d.applicantType,
      applicantName: d.applicantName,
      applicantPhone: d.applicantPhone || null,
      projectName: d.projectName || null,
      roadName: d.roadName || null,
      roadClass: d.roadClass || null,
      km: d.km ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      purpose: d.purpose || null,
      designNote: d.designNote || null,
      trafficPlan: d.trafficPlan || null,
      createdById: user.id,
    },
  })
  await logAction({ userId: user.id, action: 'CREATE', module: 'cap_phep', targetId: a.id, targetType: 'RoadConnectionApplication', detail: `Tạo hồ sơ đấu nối ${a.fileCode}` })
  revalidatePath('/dashboard/cap-phep/dau-noi')
  redirect(`/dashboard/cap-phep/dau-noi/${a.id}`)
}

// ─── Chuyển trạng thái (dùng chung 2 loại hồ sơ) ────────────────────────────────

const STATUS_VALUES = ['TAO_MOI', 'DA_TIEP_NHAN', 'CHO_BO_SUNG', 'KIEM_TRA_HO_SO', 'KIEM_TRA_GIS', 'DANG_THAM_DINH', 'DE_NGHI_CAP', 'DA_CAP_PHEP', 'TU_CHOI', 'DANG_THI_CONG', 'HOAN_THANH', 'HET_HAN', 'THU_HOI'] as const

const StatusSchema = z.object({
  kind:     z.enum(['oversized', 'connection']),
  id:       z.string().min(1),
  toStatus: z.enum(STATUS_VALUES),
  note:     z.string().optional(),
})

export async function updateRoadPermitStatusAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAuth()
  const parsed = StatusSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ' }
  const { kind, id, toStatus, note } = parsed.data

  if (kind === 'oversized') {
    const cur = await db.oversizedVehiclePermit.findUnique({ where: { id }, select: { status: true, fileCode: true } })
    if (!cur) return { error: 'Không tìm thấy hồ sơ' }
    await db.oversizedVehiclePermit.update({ where: { id }, data: { status: toStatus } })
    await db.roadPermitStatusLog.create({
      data: { oversizedPermitId: id, fromStatus: cur.status, toStatus, note: note || null, changedById: user.id },
    })
    await logAction({ userId: user.id, action: 'UPDATE', module: 'cap_phep', targetId: id, targetType: 'OversizedVehiclePermit', detail: `Chuyển trạng thái ${cur.fileCode}: ${cur.status} → ${toStatus}` })
    revalidatePath(`/dashboard/cap-phep/xe-qua-kho/${id}`)
  } else {
    const cur = await db.roadConnectionApplication.findUnique({ where: { id }, select: { status: true, fileCode: true } })
    if (!cur) return { error: 'Không tìm thấy hồ sơ' }
    await db.roadConnectionApplication.update({ where: { id }, data: { status: toStatus } })
    await db.roadPermitStatusLog.create({
      data: { connectionApplicationId: id, fromStatus: cur.status, toStatus, note: note || null, changedById: user.id },
    })
    await logAction({ userId: user.id, action: 'UPDATE', module: 'cap_phep', targetId: id, targetType: 'RoadConnectionApplication', detail: `Chuyển trạng thái ${cur.fileCode}: ${cur.status} → ${toStatus}` })
    revalidatePath(`/dashboard/cap-phep/dau-noi/${id}`)
  }
  return null
}
