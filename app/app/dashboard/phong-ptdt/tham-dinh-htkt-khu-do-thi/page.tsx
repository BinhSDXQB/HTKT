import { Network } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thẩm định hạ tầng kỹ thuật khu đô thị"
      icon={Network}
      color="indigo"
      baseHref="/dashboard/phong-ptdt"
      baseLabel="Phòng Phát triển đô thị"
      moTa="Thẩm định hạ tầng kỹ thuật các dự án khu đô thị theo phân công"
      nhiemVu={[
        'Thẩm định nội dung hạ tầng kỹ thuật của dự án đầu tư xây dựng khu đô thị theo phân công, phân cấp.',
        'Kiểm tra việc đầu tư đồng bộ hạ tầng kỹ thuật trong khu đô thị theo quy hoạch, chương trình phát triển đô thị.',
        'Tham mưu tiếp nhận, bàn giao công trình hạ tầng kỹ thuật khu đô thị.',
      ]}
    />
  )
}
