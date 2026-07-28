import { TrendingUp } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thị trường BĐS & môi giới"
      icon={TrendingUp}
      color="emerald"
      baseHref="/dashboard/phong-ql-nha"
      baseLabel="Phòng Quản lý nhà và thị trường bất động sản"
      moTa="Quản lý hoạt động kinh doanh bất động sản và môi giới"
      nhiemVu={[
        'Quản lý hoạt động kinh doanh bất động sản trên địa bàn.',
        'Cấp, quản lý chứng chỉ hành nghề môi giới bất động sản.',
        'Theo dõi, tổng hợp tình hình thị trường bất động sản.',
      ]}
    />
  )
}
