import { Users } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Hợp tác xã GTVT"
      icon={Users}
      color="emerald"
      baseHref="/dashboard/phong-ql-vt"
      baseLabel="Phòng Quản lý vận tải"
      moTa="Theo dõi, hướng dẫn hoạt động của HTX giao thông vận tải"
      nhiemVu={[
        'Theo dõi, hướng dẫn hoạt động của các HTX trong lĩnh vực giao thông vận tải.',
        'Tổng hợp tình hình hoạt động của HTX vận tải.',
        'Phối hợp xử lý vướng mắc cho HTX GTVT.',
      ]}
    />
  )
}
