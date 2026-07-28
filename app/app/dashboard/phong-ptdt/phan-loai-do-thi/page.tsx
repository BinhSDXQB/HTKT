import { Landmark } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Phân loại đô thị"
      icon={Landmark}
      color="indigo"
      baseHref="/dashboard/phong-ptdt"
      baseLabel="Phòng Phát triển đô thị"
      moTa="Đánh giá, phân loại và nâng loại đô thị theo quy định"
      nhiemVu={[
        'Tổ chức lập, thẩm định đề án phân loại đô thị, nâng loại đô thị theo phân công, phân cấp.',
        'Đánh giá chất lượng đô thị, theo dõi các tiêu chí, tiêu chuẩn phân loại đô thị.',
        'Tham mưu hồ sơ trình cấp có thẩm quyền công nhận loại đô thị.',
      ]}
    />
  )
}
