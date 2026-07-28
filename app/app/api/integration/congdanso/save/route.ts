import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { saveIntegrationConfig } from '@/lib/congdanso-client'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try { await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const body = await req.json()
  await saveIntegrationConfig({
    enabled:       body.enabled,
    apiUrl:        body.apiUrl,
    clientId:      body.clientId,
    clientSecret:  body.clientSecret,
    tokenEndpoint: body.tokenEndpoint,
    syncEndpoint:  body.syncEndpoint,
    domainFilter:  Array.isArray(body.domainFilter) ? body.domainFilter : [],
    syncIntervalH: body.syncIntervalH,
  })

  revalidatePath('/dashboard/cai-dat/tich-hop')
  return NextResponse.json({ ok: true })
}
