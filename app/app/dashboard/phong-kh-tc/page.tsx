import { Wallet, TrendingUp, ClipboardCheck, Banknote, Calculator, BarChart3 } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'Kế hoạch phát triển ngành', desc: 'Kế hoạch phát triển ngành xây dựng, giao thông', icon: TrendingUp, href: '/dashboard/phong-kh-tc/ke-hoach-phat-trien' },
  { label: 'Đấu thầu', desc: 'Thẩm định, theo dõi công tác đấu thầu', icon: ClipboardCheck, href: '/dashboard/phong-kh-tc/dau-thau' },
  { label: 'Kế hoạch vốn & dự toán', desc: 'Kế hoạch vốn đầu tư công, dự toán thu - chi', icon: Banknote, href: '/dashboard/phong-kh-tc/ke-hoach-von' },
  { label: 'Tài chính - kế toán', desc: 'Tài chính, kế toán, lương, BHXH, thuế TNCN', icon: Calculator, href: '/dashboard/phong-kh-tc/tai-chinh-ke-toan' },
  { label: 'Thống kê ngành', desc: 'Thống kê ngành xây dựng, giao thông', icon: BarChart3, href: '/dashboard/phong-kh-tc/thong-ke' },
]

export default function PhongKhTcPage() {
  return (
    <DeptOverview
      title="Phòng Kế hoạch - Tài chính"
      subtitle="Kế hoạch phát triển ngành & quản lý tài chính - kế toán · Sở Xây dựng Quảng Trị"
      icon={Wallet}
      color="emerald"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-kh-tc/phap-ly"
      note="Module Phòng Kế hoạch - Tài chính — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
