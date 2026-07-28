import { Ship } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Phá dỡ tàu biển & Nông thôn mới"
      icon={Ship}
      color="emerald"
      baseHref="/dashboard/phong-qlkcht"
      baseLabel="Phòng Quản lý kết cấu hạ tầng giao thông"
      moTa="Quản lý phá dỡ tàu biển; tiêu chí giao thông nông thôn mới"
      nhiemVu={[
        'Tham mưu quản lý hoạt động phá dỡ tàu biển theo quy định.',
        'Theo dõi tiêu chí giao thông trong xây dựng nông thôn mới.',
        'Tổng hợp, báo cáo kết quả thực hiện.',
      ]}
    />
  )
}
