import { Share2 } from 'lucide-react'
import { HtktSection } from '@/components/phong-htkt/htkt-section'

export default function Page() {
  return (
    <HtktSection
      linhVuc="su-dung-chung"
      title="Sử dụng chung công trình HTKT"
      icon={Share2}
      moTa="Quản lý sử dụng chung công trình hạ tầng kỹ thuật đô thị và khu dân cư nông thôn"
      nhiemVu={[
        'Xây dựng kế hoạch, cơ chế chính sách quản lý sử dụng chung công trình hạ tầng kỹ thuật (cống, bể, hào, tuy-nen kỹ thuật); hướng dẫn, kiểm tra thực hiện.',
        'Phối hợp hướng dẫn lập và quản lý chi phí, định mức, đơn giá dịch vụ sử dụng chung công trình HTKT; tham mưu UBND tỉnh công bố/ban hành.',
        'Theo dõi, kiểm tra việc đấu nối, sử dụng chung công trình HTKT đô thị và khu dân cư nông thôn.',
        'Xây dựng, quản lý cơ sở dữ liệu công trình HTKT dùng chung; báo cáo định kỳ.',
      ]}
    />
  )
}
