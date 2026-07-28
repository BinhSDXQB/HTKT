/**
 * Webhook nhận dữ liệu real-time từ phần mềm quản lý nhà máy / SCADA
 *
 * Giao thức: POST JSON với header Authorization: Bearer <token>
 *
 * Định dạng payload:
 * {
 *   "source": "SCADA_STATION_01",     // Nguồn dữ liệu
 *   "type": "TRAM_BOM" | "NHA_MAY_XU_LY" | "CAM_BIEN",
 *   "timestamp": "2025-06-03T10:00:00Z",
 *   "data": {
 *     "maCS": "TB-001",
 *     "luuLuong": 450.5,              // m³/h hiện tại
 *     "apSuat": 3.2,                  // bar
 *     "trangThaiMay": "HOAT_DONG",
 *     "nhietDo": 25.3,
 *     "mucNuoc": 2.1                  // m
 *   }
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const WEBHOOK_TOKEN = process.env.WEBHOOK_SECRET ?? 'htkt-webhook-2025'

export async function POST(req: NextRequest) {
  // Xác thực token
  const auth = req.headers.get('Authorization') ?? req.headers.get('X-API-Key') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (token !== WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized — sai API token' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body không phải JSON hợp lệ' }, { status: 400 })
  }

  const { source, type, timestamp, data } = body as {
    source: string
    type: string
    timestamp: string
    data: Record<string, number | string | boolean | null>
  }

  if (!source || !type || !data) {
    return NextResponse.json({ error: 'Thiếu trường: source, type, data' }, { status: 400 })
  }

  const ts = timestamp ? new Date(timestamp) : new Date()

  try {
    switch (type) {
      case 'TRAM_BOM': {
        // Cập nhật dữ liệu trạm bơm
        const maCS = String(data.maCS ?? source)
        const tramBom = await db.tramBom.findFirst({ where: { maCS } })
        if (tramBom) {
          // Lưu vào audit log (không update model chính để giữ lịch sử)
          await db.auditLog.create({
            data: {
              userId: 'system',
              action: 'WEBHOOK_UPDATE',
              module: 'tram_bom',
              targetId: tramBom.id,
              targetType: 'TramBom',
              detail: JSON.stringify({ source, timestamp: ts, ...data }),
            }
          })

          // Cập nhật tình trạng nếu có
          if (data.trangThaiMay === 'DUNG' || data.trangThaiMay === 'LOI') {
            await db.tramBom.update({
              where: { id: tramBom.id },
              data: { tinhTrang: data.trangThaiMay === 'LOI' ? 'XAU' : 'KHA' }
            })
          }
        }
        break
      }

      case 'NHA_MAY_XU_LY': {
        const maCS = String(data.maCS ?? source)
        const nhaMay = await db.nhaMayXuLyNuocThai.findFirst({ where: { maCS } })
        if (nhaMay) {
          await db.auditLog.create({
            data: {
              userId: 'system',
              action: 'WEBHOOK_UPDATE',
              module: 'nha_may_xu_ly',
              targetId: nhaMay.id,
              targetType: 'NhaMayXuLyNuocThai',
              detail: JSON.stringify({ source, timestamp: ts, ...data }),
            }
          })
          // Cập nhật công suất hiện tại nếu có
          if (data.congSuatHienTai) {
            await db.nhaMayXuLyNuocThai.update({
              where: { id: nhaMay.id },
              data: { congSuatHienTaiM3Ngay: Number(data.congSuatHienTai) }
            })
          }
        }
        break
      }

      default:
        return NextResponse.json({
          received: true,
          warning: `Loại dữ liệu "${type}" chưa được xử lý. Supported: TRAM_BOM, NHA_MAY_XU_LY`,
          timestamp: ts,
        })
    }

    return NextResponse.json({
      received: true,
      source,
      type,
      processed: true,
      timestamp: ts,
    })
  } catch (e) {
    return NextResponse.json({ error: `Lỗi xử lý webhook: ${String(e)}` }, { status: 500 })
  }
}

/** GET /api/webhook/infrastructure — Thông tin cấu hình webhook */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook/infrastructure',
    method: 'POST',
    auth: 'Bearer <WEBHOOK_SECRET> header',
    env_var: 'WEBHOOK_SECRET (mặc định: htkt-webhook-2025)',
    supportedTypes: ['TRAM_BOM', 'NHA_MAY_XU_LY'],
    example: {
      url: 'https://qlhtkt.htkt.com.vn/api/webhook/infrastructure',
      headers: { 'Authorization': 'Bearer htkt-webhook-2025', 'Content-Type': 'application/json' },
      body: {
        source: 'SCADA_STATION_01',
        type: 'TRAM_BOM',
        timestamp: new Date().toISOString(),
        data: { maCS: 'TB-001', luuLuong: 450.5, apSuat: 3.2, trangThaiMay: 'HOAT_DONG' }
      }
    }
  })
}
