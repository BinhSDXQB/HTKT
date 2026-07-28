import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { nextMaMoHinh, isBimMandatory, BIM_DISCIPLINES } from '@/lib/bim-storage'

export async function GET() {
  const user = await requireAuth()

  const isManager = user.role.name === 'admin' || user.role.name === 'manager'
  const models = await db.bimModel.findMany({
    where: {
      deletedAt: null,
      // Người thường chỉ thấy mô hình được cấp quyền
      ...(isManager ? {} : {
        viewPerms: {
          some: {
            OR: [
              { userId: user.id },
              { roleId: user.role.id },
              ...(user.toChucId ? [{ toChucId: user.toChucId }] : []),
            ],
          },
        },
      }),
    },
    include: {
      versions: {
        where: { deletedAt: null },
        orderBy: { versionNo: 'desc' },
        take: 1,
        select: { id: true, versionNo: true, cdeStatus: true, stage: true, lodChinh: true, ngayTiepNhan: true },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ models })
}

const CreateModelSchema = z.object({
  ten: z.string().min(1, 'Vui lòng nhập tên mô hình'),
  moTa: z.string().optional(),
  discipline: z.enum(BIM_DISCIPLINES).default('TONG_HOP'),
  projectId: z.string().optional(),
  soGiayPhep: z.string().optional(),
  soQuyetDinhThamDinh: z.string().optional(),
  capCongTrinh: z.string().optional(),
  nguonVon: z.string().optional(),
  wardId: z.string().optional(),
  diaChi: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (user.role.name !== 'admin' && user.role.name !== 'manager') {
    return NextResponse.json({ error: 'Không có quyền tiếp nhận mô hình BIM' }, { status: 403 })
  }

  const parsed = CreateModelSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  const d = parsed.data

  const model = await db.bimModel.create({
    data: {
      maMoHinh: await nextMaMoHinh(),
      ten: d.ten,
      moTa: d.moTa || null,
      discipline: d.discipline,
      projectId: d.projectId || null,
      soGiayPhep: d.soGiayPhep || null,
      soQuyetDinhThamDinh: d.soQuyetDinhThamDinh || null,
      capCongTrinh: d.capCongTrinh || null,
      nguonVon: d.nguonVon || null,
      batBuocBim: isBimMandatory(d.capCongTrinh || null, d.nguonVon || null),
      wardId: d.wardId || null,
      diaChi: d.diaChi || null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      createdById: user.id,
      updatedById: user.id,
    },
  })

  await logAction({
    userId: user.id,
    action: 'CREATE',
    module: 'bim',
    targetId: model.id,
    targetType: 'BimModel',
    detail: `Tạo mô hình BIM: ${model.maMoHinh} — ${model.ten}`,
  })

  return NextResponse.json({ model })
}
