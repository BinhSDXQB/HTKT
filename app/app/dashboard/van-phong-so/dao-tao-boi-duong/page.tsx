import { requireOfficeAccess } from '@/lib/auth'
import { DeptSection } from '@/components/phong/dept-section'
import { GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DaoTaoBoiDuongPage() {
  await requireOfficeAccess()
  return (
    <DeptSection
      title="Đào tạo, bồi dưỡng"
      icon={GraduationCap}
      moTa="Đào tạo, bồi dưỡng cán bộ, công chức, viên chức và người lao động của Sở"
      baseHref="/dashboard/van-phong-so"
      baseLabel="Văn phòng Sở"
      color="indigo"
      nhiemVu={[
        'Xây dựng và tổ chức thực hiện kế hoạch đào tạo, bồi dưỡng hằng năm.',
        'Tổng hợp nhu cầu, đề xuất cử cán bộ đi học, tập huấn chuyên môn, lý luận chính trị, QLNN.',
        'Quản lý hồ sơ, theo dõi kết quả đào tạo, bồi dưỡng của cán bộ.',
      ]}
    />
  )
}
