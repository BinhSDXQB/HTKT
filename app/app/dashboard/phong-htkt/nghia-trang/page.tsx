import { Landmark } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      title="Nghĩa trang & cơ sở hỏa táng"
      icon={Landmark}
      moTa="Quản lý nhà nước về nghĩa trang (trừ nghĩa trang liệt sĩ) và cơ sở hỏa táng"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, cơ chế chính sách về nghĩa trang và cơ sở hỏa táng; hướng dẫn, kiểm tra thực hiện.',
        'Thẩm định, kiểm tra nghiệm thu các dự án nghĩa trang, cơ sở hỏa táng theo phân công, phân cấp.',
        'Tham mưu quản lý, vận hành nghĩa trang và cơ sở hỏa táng do tỉnh giao quản lý.',
        'Xây dựng, quản lý cơ sở dữ liệu nghĩa trang - cơ sở hỏa táng; báo cáo định kỳ.',
      ]}
    />
  )
}
