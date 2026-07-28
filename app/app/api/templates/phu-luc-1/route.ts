import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'templates', 'phu-luc-1-mau-bao-cao-htkt.xlsx')

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = (req.nextUrl.searchParams.get('code') || '').trim()

  // Tra tên đơn vị theo mã ĐVHC → đặt tên file đúng chuẩn
  let suffix = 'Mẫu báo cáo hạ tầng phường xã'
  if (code) {
    const ward = await db.administrativeUnit.findFirst({
      where: { code, type: 'PHUONG_XA' },
      select: { name: true },
    })
    if (ward) suffix = ward.name
  }

  const filename = `PHỤ LỤC 1_${suffix}.xlsx`

  let buf: Buffer
  try {
    buf = await readFile(TEMPLATE_PATH)
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy file mẫu' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
