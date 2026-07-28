import { requireOfficeAccess } from '@/lib/auth'
import { DeptSection } from '@/components/phong/dept-section'
import { Gavel } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PhapChePage() {
  await requireOfficeAccess()
  return (
    <DeptSection
      title="Pháp chế"
      icon={Gavel}
      moTa="Công tác pháp chế, theo dõi thi hành pháp luật trong lĩnh vực xây dựng"
      baseHref="/dashboard/van-phong-so"
      baseLabel="Văn phòng Sở"
      color="indigo"
      nhiemVu={[
        'Thẩm định, góp ý dự thảo văn bản quy phạm pháp luật, văn bản hành chính của Sở.',
        'Theo dõi thi hành pháp luật; rà soát, hệ thống hoá văn bản thuộc lĩnh vực xây dựng.',
        'Tuyên truyền, phổ biến, giáo dục pháp luật; tư vấn pháp lý cho lãnh đạo Sở.',
      ]}
    />
  )
}
