import { Trees } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Cây xanh & mảng xanh (bảo trì)"
      icon={Trees}
      color="emerald"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý, bảo trì cây xanh đường phố, công viên, vườn hoa và các mảng xanh trên địa bàn được giao"
      nhiemVu={[
        'Quản lý dữ liệu cây xanh đường phố, công viên, vườn hoa, dải phân cách, đài phun nước.',
        'Theo dõi số lượng cây, diện tích mảng xanh, chủng loại và tình trạng sinh trưởng.',
        'Lập kế hoạch cắt tỉa, trồng thay thế, chăm sóc, phòng trừ sâu bệnh và kinh phí bảo trì.',
      ]}
    />
  )
}
