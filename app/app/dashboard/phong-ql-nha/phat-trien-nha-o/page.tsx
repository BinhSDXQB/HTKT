import { Building2 } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chương trình phát triển nhà ở"
      icon={Building2}
      color="emerald"
      baseHref="/dashboard/phong-ql-nha"
      baseLabel="Phòng Quản lý nhà và thị trường bất động sản"
      moTa="Xây dựng, theo dõi chương trình, kế hoạch phát triển nhà ở của tỉnh"
      nhiemVu={[
        'Tham mưu xây dựng chương trình, kế hoạch phát triển nhà ở của tỉnh.',
        'Theo dõi, đôn đốc, tổng hợp tình hình thực hiện.',
        'Tham mưu các cơ chế, chính sách phát triển nhà ở.',
      ]}
    />
  )
}
