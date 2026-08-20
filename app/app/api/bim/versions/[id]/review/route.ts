import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

const ReviewSchema = z.object({
  noiDung: z.string().min(1, 'Vui lòng nhập nội dung đánh giá'),
  ketLuan: z.enum(['NHAT_QUAN', 'KHONG_NHAT_QUAN', 'NHAT_QUAN_CO_DIEU_KIEN']),
  yeuCauBoSung: z.string().optional(),
  vanBanSo: z.string().optional(),
})

// Đánh giá tính nhất quán mô hình BIM ↔ kết quả tính toán/thiết kế.
// NĐ 217/2026/NĐ-CP (thay NĐ 175/2024 từ 01/7/2026): bắt buộc trong kết quả thẩm định
// công trình cấp I, cấp đặc biệt.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (user.role.name !== 'admin' && user.role.name !== 'manager') {
    return NextResponse.json({ error: 'Không có quyền đánh giá thẩm định' }, { status: 403 })
  }

  const version = await db.bimModelVersion.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, maContainer: true },
  })
  if (!version) return NextResponse.json({ error: 'Phiên bản không tồn tại' }, { status: 404 })

  const parsed = ReviewSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  const d = parsed.data

  const review = await db.bimConsistencyReview.create({
    data: {
      versionId: id,
      nguoiDanhGiaId: user.id,
      noiDung: d.noiDung,
      ketLuan: d.ketLuan,
      yeuCauBoSung: d.yeuCauBoSung || null,
      vanBanSo: d.vanBanSo || null,
    },
  })

  await logAction({
    userId: user.id,
    action: 'CREATE',
    module: 'bim',
    targetId: review.id,
    targetType: 'BimConsistencyReview',
    detail: `Đánh giá nhất quán ${version.maContainer}: ${d.ketLuan}${d.vanBanSo ? ` (VB ${d.vanBanSo})` : ''}`,
  })

  return NextResponse.json({ review })
}
