import { FlaskConical } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thí nghiệm chuyên ngành"
      icon={FlaskConical}
      color="indigo"
      baseHref="/dashboard/phong-qlhd-xd"
      baseLabel="Phòng Quản lý hoạt động xây dựng"
      moTa="Quản lý hoạt động thí nghiệm chuyên ngành xây dựng (LAS-XD)"
      nhiemVu={[
        'Quản lý hoạt động thí nghiệm chuyên ngành xây dựng (LAS-XD) trên địa bàn.',
        'Kiểm tra điều kiện năng lực phòng thí nghiệm.',
        'Tổng hợp, báo cáo công tác thí nghiệm chuyên ngành.',
      ]}
    />
  )
}
