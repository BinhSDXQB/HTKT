import { redirect } from 'next/navigation'
import { requireHtktAccess } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Đã gộp Kiểm kê hồ sơ vào trang Soạn thảo (wizard 2 bước). Giữ URL cũ để không gãy bookmark.
export default async function KiemKeHoSoRedirect() {
  await requireHtktAccess()
  redirect('/dashboard/phong-htkt/soan-thao')
}
