import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, canAccessOffice } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** DELETE: xoá hẳn tài liệu khỏi kho (kèm chunk qua cascade). */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canAccessOffice(user)) {
    return NextResponse.json({ error: 'Không có quyền xoá tài liệu.' }, { status: 403 })
  }
  const { id } = await ctx.params
  const doc = await db.taiLieu.findUnique({ where: { id }, select: { id: true } })
  if (!doc) return NextResponse.json({ error: 'Không tìm thấy tài liệu.' }, { status: 404 })

  // Xoá cứng: chunk có ON DELETE CASCADE nên đi theo.
  await db.taiLieu.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
