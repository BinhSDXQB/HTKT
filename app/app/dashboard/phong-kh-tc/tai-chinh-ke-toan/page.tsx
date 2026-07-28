import { Calculator } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Tài chính - kế toán"
      icon={Calculator}
      color="emerald"
      baseHref="/dashboard/phong-kh-tc"
      baseLabel="Phòng Kế hoạch - Tài chính"
      moTa="Công tác tài chính, kế toán, lương, BHXH, thuế TNCN của Sở"
      nhiemVu={[
        'Tổ chức công tác tài chính, kế toán của cơ quan Sở theo quy định.',
        'Thanh toán lương, BHXH; thực hiện nghĩa vụ thuế TNCN.',
        'Công khai tài chính, quản lý tài sản công.',
      ]}
    />
  )
}
