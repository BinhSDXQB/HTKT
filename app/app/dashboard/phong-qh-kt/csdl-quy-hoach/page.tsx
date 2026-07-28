import { Boxes } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="CSDL quy hoạch đô thị - nông thôn"
      icon={Boxes}
      color="indigo"
      baseHref="/dashboard/phong-qh-kt"
      baseLabel="Phòng Quy hoạch - Kiến trúc"
      moTa="Xây dựng, quản lý, công bố cơ sở dữ liệu quy hoạch"
      nhiemVu={[
        'Xây dựng, cập nhật, quản lý cơ sở dữ liệu quy hoạch đô thị - nông thôn.',
        'Công bố, công khai thông tin quy hoạch theo quy định.',
        'Cung cấp thông tin quy hoạch phục vụ quản lý và người dân.',
      ]}
    />
  )
}
