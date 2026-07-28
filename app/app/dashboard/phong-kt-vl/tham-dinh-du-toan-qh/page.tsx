import { ClipboardCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thẩm định dự toán quy hoạch"
      icon={ClipboardCheck}
      color="emerald"
      baseHref="/dashboard/phong-kt-vl"
      baseLabel="Phòng Kinh tế và Vật liệu xây dựng"
      moTa="Thẩm định dự toán chi phí lập quy hoạch xây dựng theo phân công"
      nhiemVu={[
        'Thẩm định dự toán chi phí lập, thẩm định, phê duyệt quy hoạch xây dựng theo phân công, phân cấp.',
        'Hướng dẫn áp dụng định mức chi phí cho công tác lập quy hoạch.',
        'Tham mưu xử lý vướng mắc về chi phí trong quá trình lập, quản lý quy hoạch.',
      ]}
    />
  )
}
