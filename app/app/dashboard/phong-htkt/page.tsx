import Link from 'next/link'
import {
  Building2, Droplets, Waves, TreePine, Lightbulb, Landmark, Route, Network, Share2, ChevronRight,
  Gavel, ClipboardCheck, FileText, Users, BarChart3, Map, CalendarCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Nghiệp vụ chuyên môn dùng chung của phòng (pháp lý, thẩm định, tham mưu, mẫu biểu).
const nghiepVu = [
  { label: 'Phân công nhiệm vụ', desc: 'Phân công động theo lĩnh vực, sinh việc định kỳ (TB 01/TB-HTKT)', icon: Users, href: '/dashboard/phong-htkt/phan-cong' },
  { label: 'Báo cáo định kỳ', desc: 'Thống kê công việc tháng/quý/năm theo người & lĩnh vực', icon: BarChart3, href: '/dashboard/phong-htkt/bao-cao' },
  { label: 'Đơn vị hành chính', desc: 'Diện tích – dân số 78 phường/xã/đặc khu (NQ 1680)', icon: Map, href: '/dashboard/phong-htkt/don-vi-hanh-chinh' },
  { label: 'Kế hoạch kiểm tra QLNN', desc: 'Ma trận phân loại công trình, nội dung & tần suất kiểm tra theo lĩnh vực, quy mô', icon: CalendarCheck, href: '/dashboard/phong-htkt/ke-hoach-kiem-tra' },
  { label: 'Cơ sở pháp lý', desc: 'Danh mục Luật, Nghị định, Thông tư, QCVN theo lĩnh vực', icon: Gavel, href: '/dashboard/phong-htkt/phap-ly' },
  { label: 'Quy trình thẩm định', desc: 'Thẩm định BCNCKT/BCKTKT/thiết kế, kiểm tra nghiệm thu — từng bước', icon: ClipboardCheck, href: '/dashboard/phong-htkt/tham-dinh' },
  { label: 'Công tác tham mưu', desc: 'Nội dung tham mưu & sản phẩm theo lĩnh vực; công việc thường xuyên', icon: Lightbulb, href: '/dashboard/phong-htkt/tham-muu' },
  { label: 'Mẫu biểu & văn bản', desc: 'Tờ trình, công văn, quyết định, giấy mời... thể thức NĐ 30/2020', icon: FileText, href: '/dashboard/phong-htkt/mau-bieu' },
]

// Menu con module Phòng Hạ tầng kỹ thuật — theo chức năng QĐ 331/QĐ-SXD mục 7.
const subMenus = [
  { label: 'Cấp nước sạch đô thị', desc: 'Cấp nước sạch đô thị (trừ nước sạch nông thôn)', icon: Droplets, href: '/dashboard/phong-htkt/cap-nuoc' },
  { label: 'Thoát nước & xử lý nước thải', desc: 'Thoát nước, xử lý nước thải đô thị (trừ XLNT tại chỗ, nông nghiệp, muối)', icon: Waves, href: '/dashboard/phong-htkt/thoat-nuoc' },
  { label: 'Công viên, cây xanh đô thị', desc: 'Quản lý công viên, cây xanh, mảng xanh đô thị', icon: TreePine, href: '/dashboard/phong-htkt/cay-xanh' },
  { label: 'Chiếu sáng đô thị', desc: 'Hệ thống chiếu sáng đô thị', icon: Lightbulb, href: '/dashboard/phong-htkt/chieu-sang' },
  { label: 'Nghĩa trang & cơ sở hỏa táng', desc: 'Nghĩa trang (trừ nghĩa trang liệt sĩ) và cơ sở hỏa táng', icon: Landmark, href: '/dashboard/phong-htkt/nghia-trang' },
  { label: 'Hạ tầng giao thông đô thị', desc: 'Kết cấu hạ tầng giao thông đô thị, đường bộ trong đô thị', icon: Route, href: '/dashboard/phong-htkt/giao-thong-do-thi' },
  { label: 'Không gian xây dựng ngầm', desc: 'Quản lý không gian xây dựng ngầm đô thị', icon: Network, href: '/dashboard/phong-htkt/khong-gian-ngam' },
  { label: 'Sử dụng chung công trình HTKT', desc: 'Quản lý sử dụng chung công trình HTKT đô thị & khu dân cư nông thôn', icon: Share2, href: '/dashboard/phong-htkt/su-dung-chung' },
]

export default function PhongHtktPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Phòng Hạ tầng kỹ thuật</h1>
          <p className="text-sm text-slate-500">
            Quản lý nhà nước về hạ tầng kỹ thuật đô thị · Sở Xây dựng Quảng Trị
          </p>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-700 mb-3">Nghiệp vụ chuyên môn</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {nghiepVu.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-xl border bg-cyan-50/40 p-4 flex items-start gap-3 hover:border-cyan-300 hover:shadow-sm transition"
          >
            <m.icon className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{m.label}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-sm font-semibold text-slate-700 mb-3">Lĩnh vực quản lý (nhập liệu hồ sơ)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subMenus.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-xl border bg-white p-4 flex items-start gap-3 hover:border-cyan-300 hover:shadow-sm transition"
          >
            <m.icon className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{m.label}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Nhập liệu
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-8">
        Module Phòng Hạ tầng kỹ thuật — chức năng theo QĐ 331/QĐ-SXD ngày 05/9/2025. Mỗi lĩnh vực đã có
        biểu nhập liệu hồ sơ nghiệp vụ; dữ liệu cô lập theo phòng (admin / cán bộ phòng HTKT).
      </p>
    </div>
  )
}
