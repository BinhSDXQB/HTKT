import { TrendingUp } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Kế hoạch phát triển ngành"
      icon={TrendingUp}
      color="emerald"
      baseHref="/dashboard/phong-kh-tc"
      baseLabel="Phòng Kế hoạch - Tài chính"
      moTa="Xây dựng, theo dõi kế hoạch phát triển ngành xây dựng, giao thông"
      nhiemVu={[
        'Tham mưu xây dựng kế hoạch phát triển ngành ngắn hạn, trung hạn, dài hạn; theo dõi, đánh giá thực hiện.',
        'Tổng hợp, phân bổ và điều chỉnh kế hoạch của các đơn vị thuộc Sở.',
        'Tham mưu các đề án, chương trình, chỉ tiêu phát triển ngành.',
      ]}
    />
  )
}
