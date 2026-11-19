import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { hoSoCuaToi } from '@/lib/danh-gia-nam/may-chu'

export const dynamic = 'force-dynamic'

// Lối vào cho MỌI cán bộ: mở thẳng hồ sơ đánh giá cuối năm của chính mình (tự đánh giá, xem nhận xét, xuất mẫu).
// Không cần quyền Văn phòng Sở; quyền trong trang do lib/danh-gia-nam/quyen.ts quyết định (chính chủ).
export default async function DanhGiaCuaToiPage() {
  const user = await requireAuth()
  const hs = await hoSoCuaToi(user)
  if (hs) redirect(`/dashboard/van-phong-so/ho-so/${hs.canBoId}/danh-gia-nam?nam=2026`)
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-xl font-bold text-slate-900">Đánh giá cuối năm của tôi</h1>
      <p className="text-sm text-slate-600">Tài khoản này chưa được gắn với hồ sơ cán bộ nên chưa có hồ sơ đánh giá. Liên hệ Văn phòng Sở để gắn tài khoản với hồ sơ.</p>
      <Link href="/dashboard" className="text-sm text-indigo-700 hover:underline">← Về trang tổng quan</Link>
    </div>
  )
}
