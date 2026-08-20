import { TrafficCone } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Đèn tín hiệu giao thông"
      icon={TrafficCone}
      color="amber"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý, vận hành và bảo trì hệ thống đèn tín hiệu giao thông tại các nút giao trên địa bàn phường Đồng Hới, Đồng Thuận, Đồng Sơn"
      nhiemVu={[
        'Quản lý dữ liệu đèn tín hiệu tại các nút giao: số pha, chu kỳ đèn, loại điều khiển, tủ điều khiển.',
        'Theo dõi kết nối trung tâm điều khiển, công nghệ đèn, năm vận hành và tình trạng hoạt động.',
        'Cập nhật tình trạng hư hỏng, kế hoạch và kinh phí bảo trì, sửa chữa.',
      ]}
    />
  )
}
