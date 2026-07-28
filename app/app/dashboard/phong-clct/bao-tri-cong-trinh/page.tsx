import { Wrench } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Bảo trì công trình giao thông"
      icon={Wrench}
      color="indigo"
      baseHref="/dashboard/phong-clct"
      baseLabel="Phòng Quản lý chất lượng công trình giao thông"
      moTa="Hướng dẫn, kiểm tra công tác bảo trì công trình giao thông"
      nhiemVu={[
        'Hướng dẫn, kiểm tra công tác bảo trì công trình giao thông.',
        'Theo dõi quy trình, kế hoạch bảo trì và đánh giá an toàn công trình.',
        'Tổng hợp tình hình chất lượng công trình trong quá trình khai thác.',
      ]}
    />
  )
}
