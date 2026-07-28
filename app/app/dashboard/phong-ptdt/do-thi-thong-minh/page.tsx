import { Zap } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Đô thị thông minh & tăng trưởng xanh"
      icon={Zap}
      color="indigo"
      baseHref="/dashboard/phong-ptdt"
      baseLabel="Phòng Phát triển đô thị"
      moTa="Phát triển đô thị thông minh, tăng trưởng xanh, ứng phó biến đổi khí hậu"
      nhiemVu={[
        'Tham mưu triển khai phát triển đô thị thông minh, đô thị tăng trưởng xanh trên địa bàn tỉnh.',
        'Hướng dẫn, theo dõi việc lồng ghép tiêu chí thông minh, xanh, thích ứng biến đổi khí hậu vào phát triển đô thị.',
        'Tổng hợp, đánh giá kết quả thực hiện các chương trình, đề án liên quan.',
      ]}
    />
  )
}
