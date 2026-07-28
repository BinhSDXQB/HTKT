import { Landmark, Building2, Users, Calculator, TrendingUp, Boxes } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'Chương trình phát triển nhà ở', desc: 'Chương trình, kế hoạch phát triển nhà ở của tỉnh', icon: Building2, href: '/dashboard/phong-ql-nha/phat-trien-nha-o' },
  { label: 'Nhà ở xã hội, nhà công vụ', desc: 'Nhà ở xã hội, công vụ, tái định cư', icon: Users, href: '/dashboard/phong-ql-nha/nha-o-xa-hoi' },
  { label: 'Định giá nhà', desc: 'Phương pháp, khung giá nhà ở', icon: Calculator, href: '/dashboard/phong-ql-nha/dinh-gia-nha' },
  { label: 'Thị trường BĐS & môi giới', desc: 'Kinh doanh BĐS, chứng chỉ môi giới', icon: TrendingUp, href: '/dashboard/phong-ql-nha/thi-truong-bds' },
  { label: 'Hệ thống thông tin nhà ở & BĐS', desc: 'Vận hành hệ thống thông tin nhà ở, BĐS', icon: Boxes, href: '/dashboard/phong-ql-nha/he-thong-thong-tin' },
]

export default function PhongQlNhaPage() {
  return (
    <DeptOverview
      title="Phòng Quản lý nhà và thị trường bất động sản"
      subtitle="Quản lý nhà nước về nhà ở và thị trường bất động sản · Sở Xây dựng Quảng Trị"
      icon={Landmark}
      color="emerald"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-ql-nha/phap-ly"
      note="Module Phòng Quản lý nhà và thị trường bất động sản — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
