import { Bus, Ship, GraduationCap, Route, Users } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'Đăng ký, đăng kiểm đường thủy', desc: 'Đăng ký, đăng kiểm phương tiện thủy nội địa', icon: Ship, href: '/dashboard/phong-ql-vt/dang-kiem-duong-thuy' },
  { label: 'Đào tạo, sát hạch GPLX', desc: 'Đào tạo, sát hạch, cấp GPLX, chứng chỉ', icon: GraduationCap, href: '/dashboard/phong-ql-vt/dao-tao-sat-hach' },
  { label: 'Quản lý vận tải, bến xe, taxi', desc: 'Kinh doanh vận tải ô tô, taxi, bến xe', icon: Route, href: '/dashboard/phong-ql-vt/quan-ly-van-tai' },
  { label: 'Vận tải hành khách công cộng', desc: 'Phát triển xe buýt, mạng lưới tuyến', icon: Bus, href: '/dashboard/phong-ql-vt/van-tai-cong-cong' },
  { label: 'Hợp tác xã GTVT', desc: 'Theo dõi, hướng dẫn HTX giao thông vận tải', icon: Users, href: '/dashboard/phong-ql-vt/htx-gtvt' },
]

export default function PhongQlVtPage() {
  return (
    <DeptOverview
      title="Phòng Quản lý vận tải"
      subtitle="Quản lý nhà nước về vận tải và phương tiện · Sở Xây dựng Quảng Trị"
      icon={Bus}
      color="emerald"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-ql-vt/phap-ly"
      note="Module Phòng Quản lý vận tải — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
