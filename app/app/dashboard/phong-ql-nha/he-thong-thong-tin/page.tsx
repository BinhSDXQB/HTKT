import { Boxes } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Hệ thống thông tin nhà ở & BĐS"
      icon={Boxes}
      color="emerald"
      baseHref="/dashboard/phong-ql-nha"
      baseLabel="Phòng Quản lý nhà và thị trường bất động sản"
      moTa="Xây dựng, vận hành hệ thống thông tin nhà ở và thị trường BĐS"
      nhiemVu={[
        'Xây dựng, vận hành hệ thống thông tin về nhà ở và thị trường bất động sản.',
        'Cập nhật, công khai dữ liệu nhà ở, bất động sản.',
        'Kết nối, chia sẻ dữ liệu với hệ thống thông tin chung.',
      ]}
    />
  )
}
