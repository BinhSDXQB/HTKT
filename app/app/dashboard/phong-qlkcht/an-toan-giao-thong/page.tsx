import { AlertTriangle } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="An toàn giao thông"
      icon={AlertTriangle}
      color="emerald"
      baseHref="/dashboard/phong-qlkcht"
      baseLabel="Phòng Quản lý kết cấu hạ tầng giao thông"
      moTa="Thường trực Ban An toàn giao thông tỉnh"
      nhiemVu={[
        'Thường trực Ban An toàn giao thông tỉnh; tham mưu các giải pháp bảo đảm trật tự ATGT.',
        'Theo dõi, tổng hợp tình hình tai nạn giao thông, điểm đen, điểm tiềm ẩn TNGT.',
        'Phối hợp xử lý các vấn đề về an toàn giao thông trên địa bàn.',
      ]}
    />
  )
}
