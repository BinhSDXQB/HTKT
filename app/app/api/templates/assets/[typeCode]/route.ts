import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { generateAssetTemplate } from '@/lib/excel/asset-template'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ typeCode: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { typeCode } = await params

  const assetType = await db.assetType.findUnique({ where: { code: typeCode } })
  if (!assetType) return NextResponse.json({ error: 'Không tìm thấy loại tài sản' }, { status: 404 })

  const buffer = generateAssetTemplate(typeCode, assetType.name)
  const fileName = `mau_nhap_${typeCode.toLowerCase()}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
