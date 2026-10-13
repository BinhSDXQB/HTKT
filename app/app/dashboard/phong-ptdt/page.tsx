import { TrendingUp, Building2, Landmark, Zap, Network, Boxes } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

// Menu con module Phòng Phát triển đô thị — theo chức năng QĐ 331/QĐ-SXD.
const subMenus = [
  { label: 'Chương trình phát triển đô thị', desc: 'Chương trình, kế hoạch phát triển đô thị toàn tỉnh', icon: Building2, href: '/dashboard/phong-ptdt/chuong-trinh-ptdt' },
  { label: 'Phân loại đô thị', desc: 'Đánh giá, phân loại và nâng loại đô thị', icon: Landmark, href: '/dashboard/phong-ptdt/phan-loai-do-thi' },
  { label: 'Đô thị thông minh & tăng trưởng xanh', desc: 'Phát triển đô thị thông minh, tăng trưởng xanh', icon: Zap, href: '/dashboard/phong-ptdt/do-thi-thong-minh' },
  { label: 'Góp ý dự án khu đô thị', desc: 'Ý kiến thẩm định chấp thuận chủ trương dự án khu đô thị (Đ29 NĐ 11/2013)', icon: Network, href: '/dashboard/phong-ptdt/tham-dinh-htkt-khu-do-thi' },
  { label: 'CSDL phát triển đô thị', desc: 'Xây dựng, quản lý cơ sở dữ liệu phát triển đô thị', icon: Boxes, href: '/dashboard/phong-ptdt/csdl-ptdt' },
]

export default function PhongPtdtPage() {
  return (
    <DeptOverview
      title="Phòng Phát triển đô thị"
      subtitle="Quản lý nhà nước về phát triển đô thị · Sở Xây dựng Quảng Trị"
      icon={TrendingUp}
      color="indigo"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-ptdt/phap-ly"
      note="Module Phòng Phát triển đô thị — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
