import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { parseAssetImportFile } from '@/lib/excel/asset-template'
import { logAction } from '@/lib/audit'

// Chuyển chuỗi ngày dd/mm/yyyy hoặc Date → Date | null
function parseDate(val: string | Date | undefined): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  const s = String(val).trim()
  if (!s) return null
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s)
  return null
}

function safeFloat(v: string | undefined): number | null {
  if (!v) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function safeBoolean(v: string | undefined): boolean | null {
  if (!v) return null
  return ['true','1','yes','co','có'].includes(v.toLowerCase())
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ typeCode: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { typeCode } = await params
  const assetType = await db.assetType.findUnique({ where: { code: typeCode } })
  if (!assetType) return NextResponse.json({ error: 'Loại tài sản không tồn tại' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Chưa chọn file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { data, errors: parseErrors } = parseAssetImportFile(buffer, typeCode)

  const batchCode = `IMP-${typeCode}-${Date.now()}`
  const batch = await db.assetImportBatch.create({
    data: {
      batchCode,
      assetTypeId: assetType.id,
      fileName: file.name,
      importedById: session.userId,
      status: 'DANG_XU_LY',
      totalRows: data.length,
    },
  })

  if (parseErrors.length > 0 && data.length === 0) {
    await db.assetImportBatch.update({ where: { id: batch.id }, data: { status: 'THAT_BAI', errors: parseErrors } })
    return NextResponse.json({ success: false, errors: parseErrors })
  }

  // Xử lý từng dòng
  const importErrors: { row: number; field: string; message: string }[] = [...parseErrors]
  let successCount = 0

  for (const row of data) {
    try {
      // Tách techSpecs ra khỏi các field cơ bản
      const baseKeys = new Set(['assetCode','name','address','latitude','longitude','elevation','installDate','warrantyExpiry','manufacturer','model','serialNumber','condition','status','notes','wardId','streetId'])
      const techSpecs: Record<string, unknown> = {}

      for (const [k, v] of Object.entries(row)) {
        if (!baseKeys.has(k) && v !== '' && v != null) {
          // Cố gắng parse số và boolean
          if (['true','false'].includes(v.toLowerCase())) techSpecs[k] = safeBoolean(v)
          else if (!isNaN(Number(v)) && v !== '') techSpecs[k] = Number(v)
          else techSpecs[k] = v
        }
      }

      // Kiểm tra mã đã tồn tại
      const existing = await db.asset.findUnique({ where: { assetCode: row.assetCode } })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assetData: any = {
        assetCode:     row.assetCode,
        name:          row.name,
        assetTypeId:   assetType.id,
        domain:        assetType.domain,
        address:       row.address || null,
        latitude:      safeFloat(row.latitude),
        longitude:     safeFloat(row.longitude),
        elevation:     safeFloat(row.elevation),
        installDate:   parseDate(row.installDate),
        warrantyExpiry:parseDate(row.warrantyExpiry),
        manufacturer:  row.manufacturer || null,
        model:         row.model || null,
        serialNumber:  row.serialNumber || null,
        condition:     (row.condition as never) || 'TOT',
        status:        (row.status as never) || 'DANG_SU_DUNG',
        notes:         row.notes || null,
        techSpecs:     Object.keys(techSpecs).length > 0 ? techSpecs : undefined,
        geometryType:  'POINT',
      }

      if (existing) {
        await db.asset.update({ where: { id: existing.id }, data: assetData })
      } else {
        await db.asset.create({ data: assetData })
      }

      successCount++
    } catch (err) {
      importErrors.push({
        row: data.indexOf(row) + 4,
        field: 'general',
        message: `Lỗi dòng ${data.indexOf(row) + 4}: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  const finalStatus = importErrors.length === 0 ? 'THANH_CONG' : successCount > 0 ? 'CO_LOI' : 'THAT_BAI'
  await db.assetImportBatch.update({
    where: { id: batch.id },
    data: {
      status: finalStatus,
      successRows: successCount,
      errorRows: importErrors.length,
      errors: importErrors.length > 0 ? importErrors : undefined,
    },
  })

  await logAction({
    userId: session.userId,
    action: 'IMPORT',
    module: 'tai_san',
    targetId: batch.id,
    targetType: 'AssetImportBatch',
    detail: `Import ${assetType.name}: ${successCount} thành công, ${importErrors.length} lỗi`,
  })

  return NextResponse.json({
    success: true,
    batchCode,
    totalRows: data.length,
    successRows: successCount,
    errorRows: importErrors.length,
    errors: importErrors.slice(0, 20), // Trả về tối đa 20 lỗi đầu
  })
}
