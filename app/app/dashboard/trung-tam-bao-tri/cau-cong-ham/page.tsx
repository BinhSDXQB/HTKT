import { Construction } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Cầu, cống, hầm chui (bảo trì)"
      icon={Construction}
      color="slate"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý, kiểm tra và bảo trì cầu, cống hộp/tròn, hầm chui, kè trên các tuyến đường được giao"
      nhiemVu={[
        'Quản lý dữ liệu cầu, cống, hầm chui, kè: khẩu độ, tải trọng, kết cấu, năm xây dựng.',
        'Theo dõi lần kiểm định gần nhất và tình trạng an toàn kết cấu công trình.',
        'Lập kế hoạch và theo dõi kinh phí bảo trì, sửa chữa định kỳ.',
      ]}
    />
  )
}
