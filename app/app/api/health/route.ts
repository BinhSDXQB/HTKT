import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Endpoint giám sát sức khỏe (công khai, nhẹ) cho watchdog + IIS.
// Trả 200 khi app + DB OK; 503 khi DB lỗi để watchdog tự phục hồi.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const startedAt = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json(
      {
        status: 'ok',
        db: 'up',
        pid: process.pid,
        uptimeSec: Math.round(process.uptime()),
        rssMB: Math.round(process.memoryUsage().rss / 1048576),
        latencyMs: Date.now() - startedAt,
        ts: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'down',
        pid: process.pid,
        error: err instanceof Error ? err.message : String(err),
        ts: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
