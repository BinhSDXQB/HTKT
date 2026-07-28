import { ClipboardCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Đấu thầu"
      icon={ClipboardCheck}
      color="emerald"
      baseHref="/dashboard/phong-kh-tc"
      baseLabel="Phòng Kế hoạch - Tài chính"
      moTa="Thẩm định, hướng dẫn, theo dõi công tác đấu thầu"
      nhiemVu={[
        'Thẩm định kế hoạch lựa chọn nhà thầu theo phân công, phân cấp.',
        'Hướng dẫn, kiểm tra công tác đấu thầu của các dự án thuộc thẩm quyền.',
        'Theo dõi, tổng hợp tình hình thực hiện công tác đấu thầu.',
      ]}
    />
  )
}
