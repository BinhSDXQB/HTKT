import { Lightbulb } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      linhVuc="chieu-sang"
      title="Chiếu sáng đô thị"
      icon={Lightbulb}
      moTa="Quản lý nhà nước về chiếu sáng đô thị"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, cơ chế chính sách phát triển chiếu sáng đô thị; hướng dẫn, kiểm tra thực hiện.',
        'Thẩm định, kiểm tra nghiệm thu các dự án chiếu sáng đô thị theo phân công, phân cấp.',
        'Tham mưu quản lý, bảo trì, vận hành hệ thống chiếu sáng đô thị do tỉnh giao quản lý; theo dõi tiêu thụ điện.',
        'Xây dựng, quản lý cơ sở dữ liệu hệ thống chiếu sáng; báo cáo định kỳ và đột xuất.',
      ]}
    />
  )
}
