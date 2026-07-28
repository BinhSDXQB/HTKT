import 'server-only'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function streamDocx(buf: Buffer, fileName: string): NextResponse {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': DOCX_MIME,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}

type LoaiVanBan = 'QD_NANG_LUONG' | 'QD_KHEN_THUONG' | 'QD_KY_LUAT' | 'THONG_BAO' | 'KHAC'

/**
 * Văn bản có số chính thức → lưu vết 1 bản bất biến (dedup theo canBoId+loại+số VB) và
 * trả đúng bản đã lưu ở lần sau. Văn bản chưa có số (dự thảo) → trả bản sinh mới, không lưu.
 */
export async function getOrCreateIssuedDoc(args: {
  loaiVanBan: LoaiVanBan
  canBoId: string
  soVanBan: string | null
  tieuDe: string
  fileName: string
  createdById: string
  generate: () => Promise<Buffer>
}): Promise<Buffer> {
  if (!args.soVanBan) return args.generate()

  const existing = await db.officeGeneratedDocument.findFirst({
    where: { canBoId: args.canBoId, loaiVanBan: args.loaiVanBan, soVanBan: args.soVanBan },
  })
  if (existing) return Buffer.from(existing.noiDung)

  const buf = await args.generate()
  await db.officeGeneratedDocument.create({
    data: {
      loaiVanBan: args.loaiVanBan,
      canBoId: args.canBoId,
      soVanBan: args.soVanBan,
      tieuDe: args.tieuDe,
      fileName: args.fileName,
      noiDung: new Uint8Array(buf),
      createdById: args.createdById,
    },
  })
  return buf
}
