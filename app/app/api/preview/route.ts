import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePreview, isPreviewExpired } from '@/lib/codex-preview'

/**
 * GET /api/preview?id=...&type=...
 *
 * Auto-generate dynamic preview cho bất kỳ content:
 * - ĐVHC (Đơn vị hành chính)
 * - ToChuc (Tổ chức)
 * - User
 * - v.v.
 *
 * Cache 1 giờ
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }

    // Tìm data theo ID từ database
    let data = null

    if (type === 'dvhc' || !type) {
      data = await db.administrativeUnit.findUnique({ where: { id } })
      if (data) type = 'dvhc'
    }

    if (!data && (type === 'to-chuc' || !type)) {
      data = await db.toChuc.findUnique({
        where: { id },
        include: { children: false },
      })
      if (data) type = 'to-chuc'
    }

    if (!data && (type === 'user' || !type)) {
      data = await db.user.findUnique({
        where: { id },
        include: { role: true, toChuc: { select: { id: true, ten: true, ma: true } } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          role: true,
          toChuc: true,
        },
      })
      if (data) type = 'user'
    }

    if (!data) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Generate preview
    const preview = await generatePreview(id, data, { cacheSeconds: 3600 })

    // Set cache headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': isPreviewExpired(preview) ? 'no-cache' : 'public, max-age=3600',
    })

    return NextResponse.json(preview, { headers })
  } catch (error) {
    console.error('[API Preview Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
