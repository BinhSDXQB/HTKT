'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  AlertTriangle,
  Wrench,
  FolderKanban,
  Package,
  BarChart3,
  BookOpen,
  Settings,
  ChevronRight,
  Map,
  FileSpreadsheet,
  TrendingUp,
  Link2,
  Zap,
  Route,
  Settings2,
  Factory,
  Upload,
  MessageSquare,
  Wallet,
  Briefcase,
  ShieldCheck,
  UserCircle2,
  CalendarDays,
  Clock,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SALARY_IMPORT_EMAILS } from '@/lib/salary-perms'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean       // admin hoặc manager
  superAdminOnly?: boolean  // chỉ tài khoản admin (admin@htkt.com.vn)
  salaryOnly?: boolean      // tài khoản được phép import lương
  officeOnly?: boolean      // truy cập module Văn phòng Sở (admin / VPS / office:menu_access)
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Hồ sơ của tôi', href: '/dashboard/ho-so-ca-nhan', icon: UserCircle2 },
  { label: 'Nghỉ phép', href: '/dashboard/nghi-phep', icon: CalendarDays },
  { label: 'Chấm công làm thêm giờ', href: '/dashboard/cham-cong-lam-them', icon: Clock },
  { label: 'Bản đồ GIS', href: '/dashboard/ban-do', icon: Map },
  { label: 'Tài sản hạ tầng', href: '/dashboard/tai-san', icon: Building2 },
  { label: 'Bình đồ tuyến đường', href: '/dashboard/tai-san/binh-do', icon: Map },
  { label: 'Tuyến mạng lưới', href: '/dashboard/ha-tang/tuyen-mang-luoi', icon: Route },
  { label: 'Trạm bơm', href: '/dashboard/ha-tang/tram-bom', icon: Settings2 },
  { label: 'Nhà máy XLNT', href: '/dashboard/ha-tang/nha-may-xu-ly', icon: Factory },
  { label: 'Import GIS / DXF / KML', href: '/dashboard/ha-tang/import', icon: Upload },
  { label: 'Kiểm tra hiện trạng', href: '/dashboard/kiem-tra', icon: ClipboardList },
  { label: 'Sự cố & Phản ánh', href: '/dashboard/su-co', icon: AlertTriangle },
  { label: 'Phiếu công việc', href: '/dashboard/phieu-cong-viec', icon: Wrench },
  { label: 'Dự án công trình', href: '/dashboard/du-an', icon: FolderKanban },
  { label: 'Cấp phép đường bộ', href: '/dashboard/cap-phep', icon: ShieldCheck },
  { label: 'Vật tư & Kho', href: '/dashboard/vat-tu', icon: Package },
  { label: 'Báo cáo & Thống kê', href: '/dashboard/bao-cao', icon: BarChart3 },
  { label: 'Dashboard tổng hợp', href: '/dashboard/bao-cao/tong-hop', icon: TrendingUp },
  { label: 'Dữ liệu phường/xã', href: '/dashboard/bao-cao/du-lieu-phuong-xa', icon: FileSpreadsheet },
  { label: 'Điện chiếu sáng thông minh', href: '/dashboard/bao-cao/den-chieu-sang', icon: Zap },
  { label: 'Danh mục', href: '/dashboard/danh-muc', icon: BookOpen },
  { label: 'Văn phòng Sở', href: '/dashboard/van-phong-so', icon: Briefcase, officeOnly: true },
  { label: 'Import dữ liệu lương', href: '/dashboard/cai-dat/luong', icon: Wallet, salaryOnly: true },
  { label: 'Quản trị', href: '/dashboard/cai-dat', icon: Settings, superAdminOnly: true },
  { label: 'Tích hợp Cổng Công dân', href: '/dashboard/cai-dat/tich-hop', icon: Link2, adminOnly: true },
  { label: 'Thống kê Chatbot AI', href: '/dashboard/cai-dat/chatbot-log', icon: MessageSquare, superAdminOnly: true },
]

type SidebarProps = {
  roleName: string
  email: string
  canOffice?: boolean
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ roleName, email, canOffice = false, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = roleName === 'admin'                       // admin@htkt.com.vn
  const isAdminOrManager = isAdmin || roleName === 'manager'
  const canSalary = isAdmin || SALARY_IMPORT_EMAILS.has(email)

  const visibleItems = navItems.filter((item) => {
    if (item.superAdminOnly) return isAdmin
    if (item.salaryOnly) return canSalary
    if (item.officeOnly) return canOffice
    if (item.adminOnly) return isAdminOrManager
    return true
  })

  return (
    <>
      {/* Overlay mờ phía sau menu (chỉ mobile khi mở) */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-slate-900 border-r border-slate-800',
          'transform transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <img
            src="/logo-htkt.png"
            alt="Logo HTKT"
            className="w-10 h-10 rounded-lg object-contain bg-white shrink-0"
          />
          <div className="min-w-0">
            <p className="font-black text-white uppercase leading-tight" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>HỆ THỐNG QLHT</p>
            <p className="font-black text-white uppercase leading-tight" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>KỸ THUẬT ĐÔ THỊ</p>
            <p className="text-[10px] text-amber-300 font-semibold uppercase mt-0.5">TỈNH QUẢNG TRỊ</p>
          </div>
          {/* Nút đóng menu (chỉ mobile) */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-slate-400 hover:text-white p-1 -mr-1"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
                  )}
                />
                <span className="truncate flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center">v1.0.0 — QL HTKT</p>
        </div>
      </aside>
    </>
  )
}
