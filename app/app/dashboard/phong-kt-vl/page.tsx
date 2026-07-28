import { Package, BarChart3, FileSpreadsheet, ClipboardCheck, Factory } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

// Menu con module Phòng Kinh tế và Vật liệu xây dựng — theo chức năng QĐ 331/QĐ-SXD.
const subMenus = [
  { label: 'Định mức, đơn giá, chỉ số giá XD', desc: 'Định mức, đơn giá, chỉ số giá xây dựng', icon: BarChart3, href: '/dashboard/phong-kt-vl/dinh-muc-don-gia' },
  { label: 'Công bố giá vật liệu xây dựng', desc: 'Công bố giá VLXD trên địa bàn tỉnh', icon: FileSpreadsheet, href: '/dashboard/phong-kt-vl/cong-bo-gia-vlxd' },
  { label: 'Thẩm định dự toán quy hoạch', desc: 'Thẩm định dự toán chi phí lập quy hoạch', icon: ClipboardCheck, href: '/dashboard/phong-kt-vl/tham-dinh-du-toan-qh' },
  { label: 'Quản lý VLXD & khoáng sản', desc: 'Quản lý VLXD và khoáng sản làm VLXD (nhóm II)', icon: Factory, href: '/dashboard/phong-kt-vl/quan-ly-vlxd-khoang-san' },
]

export default function PhongKtVlPage() {
  return (
    <DeptOverview
      title="Phòng Kinh tế và Vật liệu xây dựng"
      subtitle="Quản lý kinh tế xây dựng và vật liệu xây dựng · Sở Xây dựng Quảng Trị"
      icon={Package}
      color="emerald"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-kt-vl/phap-ly"
      note="Module Phòng Kinh tế và Vật liệu xây dựng — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
