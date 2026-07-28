import { Wrench, ShieldCheck, AlertTriangle, ClipboardCheck, Award, FlaskConical } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'Cấp phép xây dựng', desc: 'Cấp, điều chỉnh, gia hạn, thu hồi giấy phép XD', icon: ShieldCheck, href: '/dashboard/phong-qlhd-xd/cap-phep-xay-dung' },
  { label: 'Quản lý trật tự xây dựng', desc: 'Theo dõi, xử lý vi phạm trật tự xây dựng', icon: AlertTriangle, href: '/dashboard/phong-qlhd-xd/trat-tu-xay-dung' },
  { label: 'Thẩm định dự án, thiết kế', desc: 'Thẩm định dự án dân dụng, công nghiệp nhẹ, nhà ở', icon: ClipboardCheck, href: '/dashboard/phong-qlhd-xd/tham-dinh-du-an' },
  { label: 'Chứng chỉ & nhà thầu nước ngoài', desc: 'Chứng chỉ hành nghề, năng lực; nhà thầu nước ngoài', icon: Award, href: '/dashboard/phong-qlhd-xd/chung-chi-nha-thau' },
  { label: 'Thí nghiệm chuyên ngành', desc: 'Quản lý hoạt động thí nghiệm chuyên ngành XD', icon: FlaskConical, href: '/dashboard/phong-qlhd-xd/thi-nghiem-chuyen-nganh' },
]

export default function PhongQlhdXdPage() {
  return (
    <DeptOverview
      title="Phòng Quản lý hoạt động xây dựng"
      subtitle="Quản lý nhà nước về hoạt động đầu tư xây dựng · Sở Xây dựng Quảng Trị"
      icon={Wrench}
      color="indigo"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-qlhd-xd/phap-ly"
      note="Module Phòng Quản lý hoạt động xây dựng — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
