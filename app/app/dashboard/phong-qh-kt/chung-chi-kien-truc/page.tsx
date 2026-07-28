import { Award } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chứng chỉ hành nghề kiến trúc"
      icon={Award}
      color="indigo"
      baseHref="/dashboard/phong-qh-kt"
      baseLabel="Phòng Quy hoạch - Kiến trúc"
      moTa="Cấp, gia hạn, thu hồi chứng chỉ hành nghề kiến trúc"
      nhiemVu={[
        'Tổ chức cấp, gia hạn, thu hồi chứng chỉ hành nghề kiến trúc theo thẩm quyền.',
        'Quản lý dữ liệu hành nghề kiến trúc trên địa bàn.',
        'Theo dõi hoạt động hành nghề kiến trúc sư.',
      ]}
    />
  )
}
