import { ClipboardCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thẩm định, phê duyệt quy hoạch"
      icon={ClipboardCheck}
      color="indigo"
      baseHref="/dashboard/phong-qh-kt"
      baseLabel="Phòng Quy hoạch - Kiến trúc"
      moTa="Thẩm định nhiệm vụ và đồ án quy hoạch xây dựng theo phân cấp"
      nhiemVu={[
        'Thẩm định nhiệm vụ và đồ án quy hoạch xây dựng, quy hoạch đô thị - nông thôn theo phân cấp.',
        'Tham mưu phê duyệt, điều chỉnh quy hoạch.',
        'Hướng dẫn, kiểm tra việc thực hiện quy hoạch được duyệt.',
      ]}
    />
  )
}
