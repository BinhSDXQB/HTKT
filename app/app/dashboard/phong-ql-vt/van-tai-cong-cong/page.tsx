import { Bus } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Vận tải hành khách công cộng"
      icon={Bus}
      color="emerald"
      baseHref="/dashboard/phong-ql-vt"
      baseLabel="Phòng Quản lý vận tải"
      moTa="Phát triển vận tải hành khách công cộng (xe buýt) trên địa bàn"
      nhiemVu={[
        'Tham mưu phát triển vận tải hành khách công cộng (xe buýt) trên địa bàn.',
        'Quản lý mạng lưới tuyến, điểm dừng, nhà chờ.',
        'Theo dõi chất lượng dịch vụ vận tải công cộng.',
      ]}
    />
  )
}
