import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import {
  saveBimStream, runBasicChecks, validateExtension, detectIfcSchema,
  canAccessModel, BIM_FILE_KINDS,
} from '@/lib/bim-storage'

// Upload raw stream (PUT body = nội dung file) — không buffer 500MB vào RAM.
// Query: ?kind=GOC|IFC|PHU_TRO&fileName=ten-file.ifc
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()

  const version = await db.bimModelVersion.findFirst({
    where: { id, deletedAt: null },
    include: { model: { select: { id: true, maMoHinh: true } } },
  })
  if (!version) return NextResponse.json({ error: 'Phiên bản không tồn tại' }, { status: 404 })

  if (!(await canAccessModel(user, version.model.id, 'MANAGE'))) {
    return NextResponse.json({ error: 'Không có quyền tải tệp lên mô hình này' }, { status: 403 })
  }
  if (version.cdeStatus !== 'SHARED') {
    return NextResponse.json({ error: `Phiên bản đã ${version.cdeStatus} — không thể thêm tệp (CDE khóa)` }, { status: 409 })
  }

  const kind = req.nextUrl.searchParams.get('kind') || ''
  const fileName = req.nextUrl.searchParams.get('fileName') || ''
  if (!(BIM_FILE_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: 'kind phải là GOC | IFC | PHU_TRO' }, { status: 400 })
  }
  if (!fileName) return NextResponse.json({ error: 'Thiếu fileName' }, { status: 400 })

  const { ok, ext } = validateExtension(kind, fileName)
  if (!ok) {
    return NextResponse.json({ error: `Định dạng .${ext} không được phép cho loại ${kind}` }, { status: 400 })
  }
  if (!req.body) return NextResponse.json({ error: 'Thiếu nội dung tệp' }, { status: 400 })

  let saved: Awaited<ReturnType<typeof saveBimStream>>
  try {
    saved = await saveBimStream({
      webStream: req.body,
      modelId: version.model.id,
      versionId: version.id,
      fileName,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'FILE_TOO_LARGE') {
      return NextResponse.json({ error: 'Tệp vượt quá 500MB (NĐ 175/2024/NĐ-CP)' }, { status: 413 })
    }
    throw err
  }

  // Trùng nội dung trong cùng phiên bản → từ chối (tránh nộp 2 lần)
  const dup = await db.bimFile.findFirst({
    where: { versionId: version.id, sha256: saved.sha256, deletedAt: null },
  })
  if (dup) {
    await unlink(saved.absPath).catch(() => {})
    return NextResponse.json({ error: `Tệp trùng nội dung với "${dup.tenFile}" đã nộp` }, { status: 409 })
  }

  const schemaVersion = kind === 'IFC' ? await detectIfcSchema(saved.absPath) : null

  const file = await db.bimFile.create({
    data: {
      versionId: version.id,
      kind,
      tenFile: fileName,
      dinhDang: ext,
      schemaVersion,
      dungLuongByte: BigInt(saved.size),
      sha256: saved.sha256,
      storagePath: saved.relPath,
      uploadedById: user.id,
    },
  })

  const checks = await runBasicChecks({
    fileId: file.id,
    kind,
    absPath: saved.absPath,
    size: saved.size,
  })

  await logAction({
    userId: user.id,
    action: 'CREATE',
    module: 'bim',
    targetId: file.id,
    targetType: 'BimFile',
    detail: `Upload tệp BIM ${fileName} (${kind}, ${(saved.size / 1024 / 1024).toFixed(1)}MB, sha256=${saved.sha256.slice(0, 12)}...) vào ${version.maContainer}`,
  })

  return NextResponse.json({
    file: { id: file.id, tenFile: file.tenFile, kind, schemaVersion, sizeByte: saved.size, sha256: saved.sha256 },
    checks,
  })
}
