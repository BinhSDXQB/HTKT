import { requireHtktAccess } from '@/lib/auth'
import { SoanThaoWizard } from '@/components/phong-htkt/soan-thao-wizard'

export const dynamic = 'force-dynamic'

export default async function SoanThaoPage() {
  // Trang gộp Kiểm kê hồ sơ + Soạn thảo — chỉ cán bộ Phòng HTKT / lãnh đạo Sở / người được phân quyền.
  await requireHtktAccess()

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white py-8">
      <SoanThaoWizard />
    </div>
  )
}
