import { ClipboardCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thẩm định dự án, thiết kế"
      icon={ClipboardCheck}
      color="indigo"
      baseHref="/dashboard/phong-qlhd-xd"
      baseLabel="Phòng Quản lý hoạt động xây dựng"
      moTa="Thẩm định dự án dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở"
      nhiemVu={[
        'Thẩm định Báo cáo NCKT, thiết kế xây dựng công trình dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở theo phân cấp.',
        'Hướng dẫn áp dụng quy chuẩn, tiêu chuẩn trong hoạt động xây dựng.',
        'Tham mưu xử lý vướng mắc trong thẩm định.',
      ]}
    />
  )
}
