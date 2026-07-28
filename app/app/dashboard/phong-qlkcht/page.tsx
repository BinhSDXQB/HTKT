import { Settings2, Route, AlertTriangle, ShieldCheck, Building2, Ship } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'Kết cấu hạ tầng giao thông', desc: 'Đầu tư, bảo trì, vận hành KCHT giao thông', icon: Route, href: '/dashboard/phong-qlkcht/ket-cau-ha-tang' },
  { label: 'An toàn giao thông', desc: 'Thường trực Ban ATGT tỉnh', icon: AlertTriangle, href: '/dashboard/phong-qlkcht/an-toan-giao-thong' },
  { label: 'Cấp phép thi công đường bộ', desc: 'Cấp phép thi công, đấu nối đường bộ', icon: ShieldCheck, href: '/dashboard/phong-qlkcht/cap-phep-thi-cong' },
  { label: 'Bến xe, bãi đỗ, cảng bến', desc: 'Quản lý bến xe, bãi đỗ, cảng, bến thủy', icon: Building2, href: '/dashboard/phong-qlkcht/ben-xe-cang-ben' },
  { label: 'Phá dỡ tàu biển & NTM', desc: 'Phá dỡ tàu biển; tiêu chí giao thông NTM', icon: Ship, href: '/dashboard/phong-qlkcht/pha-do-nong-thon-moi' },
]

export default function PhongQlkchtPage() {
  return (
    <DeptOverview
      title="Phòng Quản lý kết cấu hạ tầng giao thông"
      subtitle="Quản lý đầu tư, khai thác, bảo trì kết cấu hạ tầng giao thông · Sở Xây dựng Quảng Trị"
      icon={Settings2}
      color="emerald"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-qlkcht/phap-ly"
      note="Module Phòng Quản lý kết cấu hạ tầng giao thông — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
