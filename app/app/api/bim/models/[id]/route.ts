import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { canAccessModel } from '@/lib/bim-storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()

  if (!(await canAccessModel(user, id, 'VIEW'))) {
    return NextResponse.json({ error: 'Không có quyền xem mô hình này' }, { status: 403 })
  }

  const model = await db.bimModel.findFirst({
    where: { id, deletedAt: null },
    include: {
      versions: {
        where: { deletedAt: null },
        orderBy: { versionNo: 'desc' },
        include: {
          files: {
            where: { deletedAt: null },
            include: { validationChecks: { orderBy: { checkedAt: 'desc' } } },
          },
          consistencyReviews: { orderBy: { createdAt: 'desc' } },
        },
      },
      viewPerms: true,
    },
  })

  if (!model) {
    return NextResponse.json({ error: 'Mô hình không tồn tại' }, { status: 404 })
  }

  // BigInt → string cho JSON
  const safe = JSON.parse(JSON.stringify(model, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)))
  return NextResponse.json({ model: safe })
}
