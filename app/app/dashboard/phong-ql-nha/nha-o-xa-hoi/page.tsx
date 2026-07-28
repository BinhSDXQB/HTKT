import { Users } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Nhà ở xã hội, nhà công vụ"
      icon={Users}
      color="emerald"
      baseHref="/dashboard/phong-ql-nha"
      baseLabel="Phòng Quản lý nhà và thị trường bất động sản"
      moTa="Quản lý nhà ở xã hội, nhà ở công vụ, nhà ở tái định cư"
      nhiemVu={[
        'Quản lý phát triển nhà ở xã hội, nhà ở công vụ, nhà ở tái định cư.',
        'Theo dõi đối tượng, điều kiện thụ hưởng chính sách nhà ở.',
        'Tổng hợp tình hình quản lý, sử dụng quỹ nhà.',
      ]}
    />
  )
}
