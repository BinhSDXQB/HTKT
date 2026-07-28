import { Building2 } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chương trình phát triển đô thị"
      icon={Building2}
      color="indigo"
      baseHref="/dashboard/phong-ptdt"
      baseLabel="Phòng Phát triển đô thị"
      moTa="Xây dựng, theo dõi chương trình, kế hoạch phát triển đô thị"
      nhiemVu={[
        'Tham mưu xây dựng chương trình, kế hoạch phát triển đô thị toàn tỉnh và từng đô thị; trình cấp có thẩm quyền phê duyệt.',
        'Hướng dẫn, kiểm tra, đôn đốc việc thực hiện chương trình phát triển đô thị.',
        'Theo dõi khu vực phát triển đô thị và tiến độ đầu tư theo chương trình được duyệt.',
      ]}
    />
  )
}
