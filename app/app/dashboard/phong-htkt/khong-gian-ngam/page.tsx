import { Network } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      title="Không gian xây dựng ngầm"
      icon={Network}
      moTa="Quản lý nhà nước về không gian xây dựng ngầm đô thị"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, cơ chế chính sách quản lý không gian xây dựng ngầm đô thị; hướng dẫn, kiểm tra thực hiện.',
        'Phối hợp tổ chức lập, thẩm định quy hoạch không gian ngầm theo phân cấp và quy định pháp luật.',
        'Thẩm định, kiểm tra nghiệm thu các công trình xây dựng ngầm theo phân công, phân cấp.',
        'Xây dựng, quản lý cơ sở dữ liệu công trình ngầm đô thị; báo cáo định kỳ.',
      ]}
    />
  )
}
