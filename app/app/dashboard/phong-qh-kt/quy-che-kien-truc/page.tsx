import { Landmark } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Quy chế quản lý kiến trúc"
      icon={Landmark}
      color="indigo"
      baseHref="/dashboard/phong-qh-kt"
      baseLabel="Phòng Quy hoạch - Kiến trúc"
      moTa="Lập, ban hành và quản lý quy chế quản lý kiến trúc"
      nhiemVu={[
        'Tham mưu lập, ban hành và quản lý quy chế quản lý kiến trúc.',
        'Hướng dẫn, kiểm tra việc thực hiện quy chế quản lý kiến trúc.',
        'Theo dõi công tác quản lý không gian, cảnh quan kiến trúc đô thị.',
      ]}
    />
  )
}
