import { Droplets } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      linhVuc="cap-nuoc"
      title="Cấp nước sạch đô thị"
      icon={Droplets}
      moTa="Quản lý nhà nước về cấp nước sạch đô thị (trừ nước sạch nông thôn)"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, chỉ tiêu và cơ chế chính sách phát triển cấp nước đô thị; trình cấp có thẩm quyền phê duyệt và hướng dẫn, kiểm tra thực hiện.',
        'Thẩm định Báo cáo nghiên cứu khả thi, Báo cáo kinh tế - kỹ thuật và kiểm tra công tác nghiệm thu các dự án cấp nước theo phân công, phân cấp.',
        'Tham mưu quản lý, bảo trì, vận hành hệ thống cấp nước đô thị do tỉnh giao quản lý.',
        'Xây dựng và quản lý cơ sở dữ liệu mạng lưới cấp nước; báo cáo định kỳ và đột xuất.',
      ]}
    />
  )
}
