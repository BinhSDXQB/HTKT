import { Building2 } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Bến xe, bãi đỗ, cảng bến"
      icon={Building2}
      color="emerald"
      baseHref="/dashboard/phong-qlkcht"
      baseLabel="Phòng Quản lý kết cấu hạ tầng giao thông"
      moTa="Quản lý bến xe, bãi đỗ xe, cảng, bến thủy nội địa"
      nhiemVu={[
        'Quản lý bến xe, bãi đỗ xe, cảng, bến thủy nội địa theo phân công.',
        'Theo dõi công bố, đóng/mở bến và điều kiện hoạt động.',
        'Tổng hợp tình hình hoạt động hệ thống bến bãi.',
      ]}
    />
  )
}
