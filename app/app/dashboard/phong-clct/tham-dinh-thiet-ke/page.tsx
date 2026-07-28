import { ClipboardCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thẩm định BCNCKT, thiết kế"
      icon={ClipboardCheck}
      color="indigo"
      baseHref="/dashboard/phong-clct"
      baseLabel="Phòng Quản lý chất lượng công trình giao thông"
      moTa="Thẩm định Báo cáo NCKT, BCKTKT, thiết kế công trình giao thông"
      nhiemVu={[
        'Thẩm định Báo cáo nghiên cứu khả thi, Báo cáo kinh tế - kỹ thuật, thiết kế xây dựng công trình giao thông theo phân công, phân cấp.',
        'Hướng dẫn áp dụng quy chuẩn, tiêu chuẩn kỹ thuật trong thiết kế công trình giao thông.',
        'Tham mưu xử lý vướng mắc kỹ thuật trong quá trình thẩm định.',
      ]}
    />
  )
}
