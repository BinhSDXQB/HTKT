import { Route } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      title="Hạ tầng giao thông đô thị"
      icon={Route}
      moTa="Quản lý kết cấu hạ tầng giao thông đô thị, đường bộ trong đô thị (trừ quốc lộ qua đô thị)"
      nhiemVu={[
        'Xây dựng kế hoạch, chương trình, cơ chế chính sách phát triển hạ tầng giao thông đô thị; hướng dẫn, kiểm tra thực hiện.',
        'Chủ trì thẩm định, kiểm tra nghiệm thu các dự án hạ tầng kỹ thuật khu chức năng, khu dân cư nông thôn và đường bộ trong đô thị theo phân công, phân cấp.',
        'Tham mưu quản lý, bảo trì, vận hành hạ tầng giao thông đô thị do tỉnh giao quản lý.',
        'Xây dựng, quản lý cơ sở dữ liệu hạ tầng giao thông đô thị; báo cáo định kỳ.',
      ]}
    />
  )
}
