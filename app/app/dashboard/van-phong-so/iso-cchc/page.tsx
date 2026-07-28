import { requireOfficeAccess } from '@/lib/auth'
import { DeptSection } from '@/components/phong/dept-section'
import { ClipboardCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function IsoCchcPage() {
  await requireOfficeAccess()
  return (
    <DeptSection
      title="ISO & Cải cách hành chính"
      icon={ClipboardCheck}
      moTa="Hệ thống quản lý chất lượng ISO và công tác cải cách hành chính của Sở"
      baseHref="/dashboard/van-phong-so"
      baseLabel="Văn phòng Sở"
      color="indigo"
      nhiemVu={[
        'Duy trì, cải tiến Hệ thống quản lý chất lượng theo TCVN ISO 9001.',
        'Theo dõi, đánh giá việc thực hiện kế hoạch cải cách hành chính của Sở.',
        'Kiểm soát thủ tục hành chính; công bố, niêm yết TTHC thuộc thẩm quyền.',
      ]}
    />
  )
}
