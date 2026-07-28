import { Award } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chứng chỉ & nhà thầu nước ngoài"
      icon={Award}
      color="indigo"
      baseHref="/dashboard/phong-qlhd-xd"
      baseLabel="Phòng Quản lý hoạt động xây dựng"
      moTa="Chứng chỉ hành nghề, năng lực hoạt động XD; quản lý nhà thầu nước ngoài"
      nhiemVu={[
        'Cấp chứng chỉ hành nghề, chứng chỉ năng lực hoạt động xây dựng theo thẩm quyền.',
        'Quản lý hoạt động của nhà thầu nước ngoài trên địa bàn.',
        'Theo dõi, công khai thông tin năng lực hoạt động xây dựng.',
      ]}
    />
  )
}
