import { ShieldCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chất lượng & an toàn thi công"
      icon={ShieldCheck}
      color="indigo"
      baseHref="/dashboard/phong-clct"
      baseLabel="Phòng Quản lý chất lượng công trình giao thông"
      moTa="Quản lý chất lượng và an toàn thi công công trình giao thông"
      nhiemVu={[
        'Quản lý chất lượng và an toàn trong thi công xây dựng công trình giao thông.',
        'Kiểm tra việc thực hiện quy định về quản lý chất lượng, an toàn lao động.',
        'Tham mưu xử lý sự cố công trình giao thông.',
      ]}
    />
  )
}
