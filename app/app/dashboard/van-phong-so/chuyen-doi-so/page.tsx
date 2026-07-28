import { requireOfficeAccess } from '@/lib/auth'
import { DeptSection } from '@/components/phong/dept-section'
import { Network } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ChuyenDoiSoPage() {
  await requireOfficeAccess()
  return (
    <DeptSection
      title="Chuyển đổi số & Đề án 06"
      icon={Network}
      moTa="Chuyển đổi số, ứng dụng CNTT và triển khai Đề án 06 tại Sở"
      baseHref="/dashboard/van-phong-so"
      baseLabel="Văn phòng Sở"
      color="indigo"
      nhiemVu={[
        'Triển khai chuyển đổi số, ứng dụng công nghệ thông tin trong hoạt động của Sở.',
        'Thực hiện Đề án 06 (phát triển ứng dụng dữ liệu dân cư, định danh và xác thực điện tử).',
        'Bảo đảm an toàn thông tin, vận hành hệ thống thông tin, chữ ký số.',
      ]}
    />
  )
}
