import { requireOfficeAccess } from '@/lib/auth'
import { DeptSection } from '@/components/phong/dept-section'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VanThuLuuTruPage() {
  await requireOfficeAccess()
  return (
    <DeptSection
      title="Văn thư – Lưu trữ"
      icon={ScrollText}
      moTa="Công tác văn thư, quản lý con dấu và lưu trữ tài liệu cơ quan"
      baseHref="/dashboard/van-phong-so"
      baseLabel="Văn phòng Sở"
      color="indigo"
      nhiemVu={[
        'Tiếp nhận, đăng ký, chuyển giao, phát hành văn bản đi/đến.',
        'Quản lý con dấu; lập hồ sơ và nộp lưu hồ sơ, tài liệu vào lưu trữ cơ quan.',
        'Số hoá, bảo quản và phục vụ khai thác tài liệu lưu trữ.',
      ]}
    />
  )
}
