import { Droplets } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Thoát nước & Xử lý nước thải"
      icon={Droplets}
      color="emerald"
      baseHref="/dashboard/trung-tam-bao-tri"
      baseLabel="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      moTa="Quản lý hệ thống thoát nước thải và nước mưa trên địa bàn"
      nhiemVu={[
        'Quản lý dữ liệu các tuyến thoát nước thải, thoát nước mưa, tuyến chung, giếng tách nước, trạm bơm.',
        'Theo dõi chiều dài, kích thước, số hố ga, công suất xử lý và tình trạng các hạng mục.',
        'Cập nhật kế hoạch nạo vét, sửa chữa và kinh phí bảo trì định kỳ.',
      ]}
    />
  )
}
