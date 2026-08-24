import { TreePine } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      linhVuc="cay-xanh"
      title="Công viên, cây xanh đô thị"
      icon={TreePine}
      moTa="Quản lý nhà nước về công viên, cây xanh đô thị"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, cơ chế chính sách phát triển công viên, cây xanh đô thị; hướng dẫn, kiểm tra thực hiện.',
        'Thẩm định, kiểm tra nghiệm thu các dự án công viên, cây xanh, mảng xanh đô thị theo phân công, phân cấp.',
        'Tham mưu quản lý, duy trì, chăm sóc hệ thống công viên - cây xanh đô thị do tỉnh giao quản lý.',
        'Xây dựng, quản lý cơ sở dữ liệu cây xanh - công viên; báo cáo định kỳ và đột xuất.',
      ]}
    />
  )
}
