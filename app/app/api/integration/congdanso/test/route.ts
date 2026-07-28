import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getIntegrationConfig, testConnection } from '@/lib/congdanso-client'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try { await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const body = await req.json().catch(() => ({}))

  // Nếu có body → lưu config trước rồi test
  if (body.clientId !== undefined) {
    const cfg = await getIntegrationConfig()
    const merged = { ...cfg, ...body }
    const result = await testConnection(merged)

    await db.integrationLog.create({
      data: {
        source: 'congdanso', action: 'test',
        status: result.ok ? 'success' : 'error',
        message: result.message,
      },
    })

    return NextResponse.json(result)
  }

  const cfg = await getIntegrationConfig()
  const result = await testConnection(cfg)

  await db.integrationLog.create({
    data: {
      source: 'congdanso', action: 'test',
      status: result.ok ? 'success' : 'error',
      message: result.message,
    },
  })

  return NextResponse.json(result)
}
