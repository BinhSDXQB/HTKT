import { Truck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Tài sản, thiết bị, xe máy chuyên dùng"
      icon={Truck}
      color="indigo"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý tài sản, thiết bị, xe máy chuyên dùng và vật tư kho của Trung tâm phục vụ công tác bảo trì"
      nhiemVu={[
        'Quản lý danh mục xe máy chuyên dùng, thiết bị thi công, phương tiện, máy móc, vật tư kho.',
        'Theo dõi mã tài sản, nguyên giá, giá trị còn lại, năm sử dụng và tình trạng.',
        'Cập nhật kế hoạch bảo trì, kiểm định và đề xuất sửa chữa, thanh lý.',
      ]}
    />
  )
}
