import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { bimStorageDir, canAccessModel } from '@/lib/bim-storage'

// Tải tệp BIM — kiểm quyền DOWNLOAD + ghi audit (dữ liệu thiết kế nhạy cảm).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()

  const file = await db.bimFile.findFirst({
    where: { id, deletedAt: null },
    include: { version: { select: { maContainer: true, model: { select: { id: true } } } } },
  })
  if (!file) return NextResponse.json({ error: 'Tệp không tồn tại' }, { status: 404 })

  if (!(await canAccessModel(user, file.version.model.id, 'DOWNLOAD'))) {
    return NextResponse.json({ error: 'Không có quyền tải tệp này' }, { status: 403 })
  }

  const absPath = path.join(bimStorageDir(), file.storagePath)
  // Chống path traversal — storagePath phải nằm trong storage dir
  if (!path.resolve(absPath).startsWith(path.resolve(bimStorageDir()))) {
    return NextResponse.json({ error: 'Đường dẫn không hợp lệ' }, { status: 400 })
  }

  let size: number
  try {
    size = (await stat(absPath)).size
  } catch {
    return NextResponse.json({ error: 'Tệp vật lý không còn trên đĩa — liên hệ quản trị' }, { status: 410 })
  }

  await logAction({
    userId: user.id,
    action: 'EXPORT',
    module: 'bim',
    targetId: file.id,
    targetType: 'BimFile',
    detail: `Tải tệp BIM ${file.tenFile} (${file.version.maContainer})`,
  })

  const nodeStream = createReadStream(absPath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(size),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.tenFile)}`,
      'X-Content-SHA256': file.sha256,
    },
  })
}
