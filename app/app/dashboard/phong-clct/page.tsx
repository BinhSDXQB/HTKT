import { ShieldCheck, ClipboardCheck, ClipboardList, Wrench, Gavel } from 'lucide-react'
import { DeptOverview } from '@/components/phong/dept-section'

export const dynamic = 'force-dynamic'

const subMenus = [
  { label: 'Thẩm định BCNCKT, thiết kế', desc: 'Thẩm định BCNCKT, thiết kế công trình giao thông', icon: ClipboardCheck, href: '/dashboard/phong-clct/tham-dinh-thiet-ke' },
  { label: 'Kiểm tra công tác nghiệm thu', desc: 'Kiểm tra nghiệm thu thi công, hoàn thành công trình', icon: ClipboardList, href: '/dashboard/phong-clct/kiem-tra-nghiem-thu' },
  { label: 'Chất lượng & an toàn thi công', desc: 'Quản lý chất lượng, an toàn thi công giao thông', icon: ShieldCheck, href: '/dashboard/phong-clct/chat-luong-an-toan' },
  { label: 'Bảo trì công trình giao thông', desc: 'Hướng dẫn, kiểm tra bảo trì công trình', icon: Wrench, href: '/dashboard/phong-clct/bao-tri-cong-trinh' },
  { label: 'Giám định tư pháp & định mức', desc: 'Giám định tư pháp, định mức KT-KT giao thông', icon: Gavel, href: '/dashboard/phong-clct/giam-dinh-dinh-muc' },
]

export default function PhongClctPage() {
  return (
    <DeptOverview
      title="Phòng Quản lý chất lượng công trình giao thông"
      subtitle="Quản lý nhà nước về chất lượng công trình giao thông · Sở Xây dựng Quảng Trị"
      icon={ShieldCheck}
      color="indigo"
      subMenus={subMenus}
      phapLyHref="/dashboard/phong-clct/phap-ly"
      note="Module Phòng Quản lý chất lượng công trình giao thông — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Cấu trúc menu & phân quyền (admin / cán bộ phòng) đã sẵn sàng; nghiệp vụ chi tiết từng lĩnh vực sẽ bổ sung dần."
    />
  )
}
