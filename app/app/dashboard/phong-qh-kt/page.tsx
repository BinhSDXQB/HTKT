import { Map, Boxes, ClipboardCheck, PencilRuler, Landmark, Award } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'CSDL quy hoạch ĐT-NT', desc: 'Cơ sở dữ liệu quy hoạch đô thị - nông thôn', icon: Boxes, href: '/dashboard/phong-qh-kt/csdl-quy-hoach' },
  { label: 'Thẩm định, phê duyệt quy hoạch', desc: 'Thẩm định nhiệm vụ, đồ án quy hoạch xây dựng', icon: ClipboardCheck, href: '/dashboard/phong-qh-kt/tham-dinh-quy-hoach' },
  { label: 'Thiết kế đô thị', desc: 'Lập, quản lý thiết kế đô thị', icon: PencilRuler, href: '/dashboard/phong-qh-kt/thiet-ke-do-thi' },
  { label: 'Quy chế quản lý kiến trúc', desc: 'Lập, ban hành, quản lý quy chế kiến trúc', icon: Landmark, href: '/dashboard/phong-qh-kt/quy-che-kien-truc' },
  { label: 'Chứng chỉ hành nghề kiến trúc', desc: 'Cấp, quản lý chứng chỉ hành nghề kiến trúc', icon: Award, href: '/dashboard/phong-qh-kt/chung-chi-kien-truc' },
]

export default function PhongQhKtPage() {
  return (
    <DeptOverview
      title="Phòng Quy hoạch - Kiến trúc"
      subtitle="Quản lý nhà nước về quy hoạch xây dựng và kiến trúc · Sở Xây dựng Quảng Trị"
      icon={Map}
      color="indigo"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-qh-kt/phap-ly"
      note="Module Phòng Quy hoạch - Kiến trúc — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
