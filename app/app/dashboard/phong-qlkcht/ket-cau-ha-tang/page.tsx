import { Route } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Kết cấu hạ tầng giao thông"
      icon={Route}
      color="emerald"
      baseHref="/dashboard/phong-qlkcht"
      baseLabel="Phòng Quản lý kết cấu hạ tầng giao thông"
      moTa="Đầu tư, bảo trì, khai thác, vận hành kết cấu hạ tầng giao thông"
      nhiemVu={[
        'Tham mưu đầu tư, bảo trì, khai thác, vận hành kết cấu hạ tầng giao thông đường bộ, đường sắt, đường thủy nội địa.',
        'Quản lý hành lang an toàn đường bộ, đường thủy.',
        'Tổng hợp, báo cáo tình trạng kết cấu hạ tầng giao thông trên địa bàn.',
      ]}
    />
  )
}
