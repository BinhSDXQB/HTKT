import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { maContainer, canAccessModel, BIM_STAGES, BIM_LODS } from '@/lib/bim-storage'

const CreateVersionSchema = z.object({
  stage: z.enum(BIM_STAGES),
  lodChinh: z.enum(BIM_LODS),
  ghiChuNop: z.string().optional(),
  nguoiNopTen: z.string().optional(),
  nguoiNopDonVi: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()

  if (!(await canAccessModel(user, id, 'MANAGE'))) {
    return NextResponse.json({ error: 'Không có quyền tiếp nhận phiên bản mới' }, { status: 403 })
  }

  const model = await db.bimModel.findFirst({ where: { id, deletedAt: null } })
  if (!model) return NextResponse.json({ error: 'Mô hình không tồn tại' }, { status: 404 })

  const parsed = CreateVersionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  const d = parsed.data

  const last = await db.bimModelVersion.findFirst({
    where: { modelId: id },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  })
  const versionNo = (last?.versionNo ?? 0) + 1

  const version = await db.bimModelVersion.create({
    data: {
      modelId: id,
      versionNo,
      maContainer: maContainer(model.maMoHinh, versionNo),
      stage: d.stage,
      lodChinh: d.lodChinh,
      ghiChuNop: d.ghiChuNop || null,
      nguoiNopTen: d.nguoiNopTen || null,
      nguoiNopDonVi: d.nguoiNopDonVi || null,
      createdById: user.id,
    },
  })

  await logAction({
    userId: user.id,
    action: 'CREATE',
    module: 'bim',
    targetId: version.id,
    targetType: 'BimModelVersion',
    detail: `Tiếp nhận phiên bản ${version.maContainer} (${d.stage}, ${d.lodChinh})`,
  })

  return NextResponse.json({ version })
}
