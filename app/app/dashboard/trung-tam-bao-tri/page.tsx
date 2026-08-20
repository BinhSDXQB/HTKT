import { Route, Wrench, Lightbulb, Droplets, Trees, TrafficCone, Construction, AlertTriangle, Truck } from 'lucide-react'
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
          label: 'Tuyến đường được giao bảo trì',
          desc: 'Tuyến quốc lộ (uỷ thác), tỉnh lộ và đường đô thị các phường Đồng Hới, Đồng Thuận, Đồng Sơn',
          icon: Route,
          href: '/dashboard/trung-tam-bao-tri/tuyen-duong-mat-cat-lon',
        },
        {
          label: 'Chiếu sáng đô thị',
          desc: 'Bảo trì chiếu sáng trên quốc lộ, tỉnh lộ và đường đô thị',
          icon: Lightbulb,
          href: '/dashboard/trung-tam-bao-tri/chieu-sang',
        },
        {
          label: 'Đèn tín hiệu giao thông',
          desc: 'Đèn tín hiệu tại các nút giao trên địa bàn Đồng Hới, Đồng Thuận, Đồng Sơn',
          icon: TrafficCone,
          href: '/dashboard/trung-tam-bao-tri/den-tin-hieu',
        },
        {
          label: 'Thoát nước & XLNT',
          desc: 'Thoát nước mưa, nước thải và nhà máy xử lý nước thải',
          icon: Droplets,
          href: '/dashboard/trung-tam-bao-tri/thoat-nuoc',
        },
        {
          label: 'Cây xanh & mảng xanh',
          desc: 'Cây xanh đường phố, công viên, vườn hoa, dải phân cách',
          icon: Trees,
          href: '/dashboard/trung-tam-bao-tri/cay-xanh',
        },
        {
          label: 'Cầu, cống, hầm chui',
          desc: 'Cầu, cống hộp/tròn, hầm chui, kè — kiểm định và bảo trì kết cấu',
          icon: Construction,
          href: '/dashboard/trung-tam-bao-tri/cau-cong-ham',
        },
        {
          label: 'An toàn giao thông',
          desc: 'Biển báo, sơn kẻ đường, hộ lan, cọc tiêu, gương cầu lồi',
          icon: AlertTriangle,
          href: '/dashboard/trung-tam-bao-tri/an-toan-giao-thong',
        },
        {
          label: 'Tài sản, thiết bị, xe máy',
          desc: 'Xe máy chuyên dùng, thiết bị, phương tiện và vật tư kho của Trung tâm',
          icon: Truck,
          href: '/dashboard/trung-tam-bao-tri/tai-san-thiet-bi',
        },
      ]}
      note="Phạm vi được giao: quản lý, bảo trì kết cấu hạ tầng giao thông trên tuyến quốc lộ (uỷ thác), tỉnh lộ và đường đô thị các phường Đồng Hới, Đồng Thuận, Đồng Sơn."
    />
  )
}
