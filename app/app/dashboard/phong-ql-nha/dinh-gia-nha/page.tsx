import { Calculator } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Định giá nhà"
      icon={Calculator}
      color="emerald"
      baseHref="/dashboard/phong-ql-nha"
      baseLabel="Phòng Quản lý nhà và thị trường bất động sản"
      moTa="Phương pháp, khung giá phục vụ quản lý nhà ở"
      nhiemVu={[
        'Tham mưu phương pháp, khung giá phục vụ quản lý nhà ở.',
        'Hướng dẫn xác định giá nhà ở thuộc sở hữu nhà nước.',
        'Theo dõi biến động giá nhà ở trên địa bàn.',
      ]}
    />
  )
}
