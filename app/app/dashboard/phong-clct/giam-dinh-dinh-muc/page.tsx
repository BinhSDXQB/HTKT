import { Gavel } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Giám định tư pháp & định mức KT-KT"
      icon={Gavel}
      color="indigo"
      baseHref="/dashboard/phong-clct"
      baseLabel="Phòng Quản lý chất lượng công trình giao thông"
      moTa="Giám định tư pháp xây dựng giao thông và định mức kinh tế - kỹ thuật"
      nhiemVu={[
        'Thực hiện giám định tư pháp xây dựng trong lĩnh vực giao thông theo trưng cầu.',
        'Tham mưu xây dựng, công bố định mức kinh tế - kỹ thuật chuyên ngành giao thông.',
        'Quản lý hệ thống định mức phục vụ quản lý chi phí công trình giao thông.',
      ]}
    />
  )
}
