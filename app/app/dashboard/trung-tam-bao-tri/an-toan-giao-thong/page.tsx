import { AlertTriangle } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="An toàn giao thông (biển báo, sơn kẻ)"
      icon={AlertTriangle}
      color="rose"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý, bảo trì hệ thống an toàn giao thông: biển báo, sơn kẻ đường, hộ lan, cọc tiêu, gương cầu lồi trên các tuyến đường được giao"
      nhiemVu={[
        'Quản lý dữ liệu biển báo, sơn kẻ đường, hộ lan tôn sóng, cọc tiêu, gương cầu lồi, gờ giảm tốc.',
        'Theo dõi số lượng, quy cách, năm lắp đặt và tình trạng của từng hạng mục.',
        'Lập kế hoạch thay thế, bổ sung và theo dõi kinh phí bảo trì bảo đảm an toàn giao thông.',
      ]}
    />
  )
}
