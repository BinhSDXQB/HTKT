import { PencilRuler } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thiết kế đô thị"
      icon={PencilRuler}
      color="indigo"
      baseHref="/dashboard/phong-qh-kt"
      baseLabel="Phòng Quy hoạch - Kiến trúc"
      moTa="Lập, quản lý thiết kế đô thị; hướng dẫn áp dụng"
      nhiemVu={[
        'Tham mưu lập, quản lý thiết kế đô thị; hướng dẫn áp dụng.',
        'Theo dõi việc tuân thủ thiết kế đô thị trong đầu tư xây dựng.',
        'Tham mưu xử lý vướng mắc về thiết kế đô thị.',
      ]}
    />
  )
}
