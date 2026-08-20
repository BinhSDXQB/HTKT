import { Lightbulb } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chiếu sáng đô thị"
      icon={Lightbulb}
      color="indigo"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý, bảo trì hệ thống chiếu sáng đô thị trên các tuyến đường quốc lộ, tỉnh lộ và đường đô thị được giao"
      nhiemVu={[
        'Quản lý dữ liệu đèn chiếu sáng đường phố, đèn pha/chiếu sáng công cộng, đèn trang trí trên các tuyến đường.',
        'Theo dõi công suất, loại đèn, năm vận hành, tình trạng và kinh phí bảo trì.',
        'Cập nhật tình trạng hư hỏng và kế hoạch bảo trì, sửa chữa.',
      ]}
    />
  )
}
