import { Route } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Tuyến đường mặt cắt ≥ 20m (giao bảo trì)"
      icon={Route}
      color="emerald"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Kho dữ liệu tuyến đường được giao bảo trì — phường Đồng Hới, Đồng Thuận, Đồng Sơn"
      nhiemVu={[
        'Quản lý dữ liệu các tuyến đường có mặt cắt (bề rộng) từ 20m trở lên được giao bảo trì.',
        'Theo dõi điểm đầu/điểm cuối, chiều dài, mặt cắt, kết cấu và tình trạng mặt đường từng tuyến.',
        'Cập nhật năm bảo trì gần nhất phục vụ lập kế hoạch duy tu, bảo dưỡng định kỳ.',
      ]}
    />
  )
}
