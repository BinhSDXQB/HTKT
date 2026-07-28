import { BarChart3 } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thống kê ngành"
      icon={BarChart3}
      color="emerald"
      baseHref="/dashboard/phong-kh-tc"
      baseLabel="Phòng Kế hoạch - Tài chính"
      moTa="Công tác thống kê ngành xây dựng, giao thông trên địa bàn tỉnh"
      nhiemVu={[
        'Tổ chức công tác thống kê ngành xây dựng, giao thông trên địa bàn tỉnh.',
        'Tổng hợp số liệu, lập báo cáo thống kê định kỳ và đột xuất.',
        'Xây dựng, quản lý cơ sở dữ liệu thống kê ngành.',
      ]}
    />
  )
}
