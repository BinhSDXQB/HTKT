import { requireOfficeAccess } from '@/lib/auth'
import { DeptSection } from '@/components/phong/dept-section'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HanhChinhQuanTriPage() {
  await requireOfficeAccess()
  return (
    <DeptSection
      title="Hành chính – Quản trị"
      icon={Package}
      moTa="Quản lý tài sản công, hậu cần và bảo đảm điều kiện làm việc của Sở"
      baseHref="/dashboard/van-phong-so"
      baseLabel="Văn phòng Sở"
      color="indigo"
      nhiemVu={[
        'Quản lý tài sản công, trang thiết bị, phương tiện làm việc của Sở.',
        'Bảo đảm hậu cần, lễ tân, khánh tiết, điều kiện làm việc; quản lý xe công.',
        'Bảo trì trụ sở; công tác an ninh, trật tự, phòng cháy chữa cháy cơ quan.',
      ]}
    />
  )
}
