import { Waves } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      linhVuc="thoat-nuoc"
      title="Thoát nước & xử lý nước thải"
      icon={Waves}
      moTa="Quản lý thoát nước và xử lý nước thải đô thị (trừ XLNT tại chỗ, thoát nước phục vụ sản xuất nông nghiệp, sản xuất muối)"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, cơ chế chính sách phát triển thoát nước và xử lý nước thải đô thị; hướng dẫn, kiểm tra thực hiện sau khi được phê duyệt.',
        'Thẩm định Báo cáo nghiên cứu khả thi, thiết kế và kiểm tra nghiệm thu các dự án thoát nước, trạm bơm, nhà máy xử lý nước thải theo phân công, phân cấp.',
        'Tham mưu quản lý, bảo trì, vận hành hệ thống thoát nước - xử lý nước thải đô thị do tỉnh giao quản lý.',
        'Xây dựng, quản lý cơ sở dữ liệu mạng lưới thoát nước; theo dõi tình trạng ngập úng; báo cáo định kỳ.',
      ]}
    />
  )
}
