import { AlertTriangle } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Quản lý trật tự xây dựng"
      icon={AlertTriangle}
      color="indigo"
      baseHref="/dashboard/phong-qlhd-xd"
      baseLabel="Phòng Quản lý hoạt động xây dựng"
      moTa="Theo dõi, xử lý vi phạm trật tự xây dựng trên địa bàn"
      nhiemVu={[
        'Tham mưu quản lý trật tự xây dựng; theo dõi, xử lý vi phạm trật tự xây dựng.',
        'Phối hợp kiểm tra, thanh tra hoạt động xây dựng.',
        'Tổng hợp, báo cáo tình hình trật tự xây dựng.',
      ]}
    />
  )
}
