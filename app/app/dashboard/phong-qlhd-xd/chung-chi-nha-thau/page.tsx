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
        'Cấp chứng chỉ hành nghề cá nhân, giấy phép nhà thầu nước ngoài theo thẩm quyền (NĐ 212/2026); tổ chức chỉ công khai năng lực trên CSDL quốc gia.',
        'Quản lý hoạt động của nhà thầu nước ngoài trên địa bàn.',
        'Theo dõi, công khai thông tin năng lực hoạt động xây dựng.',
      ]}
    />
  )
}
