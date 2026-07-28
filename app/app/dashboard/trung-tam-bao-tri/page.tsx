import { Route, Wrench } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptOverview
      title="Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật"
      subtitle="Đơn vị sự nghiệp trực thuộc Sở Xây dựng — quản lý, bảo trì kết cấu hạ tầng giao thông đô thị"
      icon={Wrench}
      color="emerald"
      subMenus={[
        {
          label: 'Tuyến đường mặt cắt ≥ 20m',
          desc: 'Kho dữ liệu các tuyến đường được giao bảo trì trên địa bàn phường Đồng Hới, Đồng Thuận, Đồng Sơn',
          icon: Route,
          href: '/dashboard/trung-tam-bao-tri/tuyen-duong-mat-cat-lon',
        },
      ]}
      note="Phạm vi giao bảo trì: các tuyến đường có mặt cắt (bề rộng) từ 20m trở lên (theo Phụ lục 1 - Tổng hợp đường giao thông giao Ban Bảo trì)."
    />
  )
}
