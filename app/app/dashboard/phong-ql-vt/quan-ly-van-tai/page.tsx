import { Route } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Quản lý vận tải, bến xe, taxi"
      icon={Route}
      color="emerald"
      baseHref="/dashboard/phong-ql-vt"
      baseLabel="Phòng Quản lý vận tải"
      moTa="Quản lý hoạt động kinh doanh vận tải bằng xe ô tô, taxi"
      nhiemVu={[
        'Quản lý hoạt động kinh doanh vận tải bằng xe ô tô, taxi.',
        'Cấp phù hiệu, biển hiệu, giấy phép kinh doanh vận tải theo thẩm quyền.',
        'Theo dõi hoạt động bến xe, tuyến vận tải.',
      ]}
    />
  )
}
