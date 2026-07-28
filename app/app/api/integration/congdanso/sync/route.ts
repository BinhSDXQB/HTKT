import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getIntegrationConfig, syncToHTKT } from '@/lib/congdanso-client'

export async function POST() {
  let user
  try { user = await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const cfg = await getIntegrationConfig()
  if (!cfg.enabled) return NextResponse.json({ error: 'Tích hợp chưa được bật' }, { status: 400 })
  if (!cfg.clientId || !cfg.clientSecret) {
    return NextResponse.json({ error: 'Chưa cấu hình Client ID / Secret' }, { status: 400 })
  }

  try {
    const result = await syncToHTKT(cfg, user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
