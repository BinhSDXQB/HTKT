'use client'

import { useEffect, useRef, useState } from 'react'
import { LogOut, ChevronDown, KeyRound, Menu, UserCircle2, ShieldCheck, BellRing, Settings } from 'lucide-react'

type HeaderProps = {
  userName: string
  userEmail: string
  roleDisplayName: string
  roleName: string
  mustChangePassword?: boolean
  canOffice?: boolean
  onMenuClick?: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Màu chip vai trò theo nhóm quyền
function roleChipClass(roleName: string): string {
  switch (roleName) {
    case 'admin': return 'bg-red-100 text-red-700'
    case 'manager': return 'bg-blue-100 text-blue-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export function Header({ userName, userEmail, roleDisplayName, roleName, canOffice = false, onMenuClick }: HeaderProps) {
  const isAdmin = roleName === 'admin'

  // <details> thuần làm dropdown ⇒ mở/đóng KHÔNG cần React hydrate (miễn nhiễm lỗi
  // "ChunkLoadError" khi bản build đổi). useEffect chỉ THÊM tiện ích đóng khi bấm
  // ra ngoài / nhấn Esc; nếu JS lỗi thì menu vẫn bật/tắt được bằng cơ chế gốc trình duyệt.
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.removeAttribute('open')
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && ref.current) ref.current.removeAttribute('open')
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  // Số "việc cần làm" thật cho chuông (chỉ người có quyền VP Sở) — fetch async, không chặn render.
  const [alertCount, setAlertCount] = useState<number | null>(null)
  useEffect(() => {
    if (!canOffice) return
    let alive = true
    fetch('/api/office/canh-bao-count')
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => { if (alive) setAlertCount(typeof d.count === 'number' ? d.count : 0) })
      .catch(() => {})
    return () => { alive = false }
  }, [canOffice])

  const initials = getInitials(userName)

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-30 h-14 flex items-center justify-between px-3 sm:px-6 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 sm:mr-4">
        {/* Nút mở menu (chỉ mobile) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-black uppercase text-slate-700 tracking-wide truncate text-sm sm:text-base lg:text-lg">
          <span className="hidden sm:inline">HỆ THỐNG QUẢN LÝ HẠ TẦNG KỸ THUẬT ĐÔ THỊ TỈNH QUẢNG TRỊ</span>
          <span className="sm:hidden">QL HẠ TẦNG KỸ THUẬT</span>
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Chuông cảnh báo — chỉ hiện cho người có quyền Văn phòng Sở */}
        {canOffice && (
          <a
            href="/dashboard/van-phong-so/canh-bao"
            title="Cảnh báo & việc cần làm"
            aria-label="Cảnh báo & việc cần làm"
            className="relative shrink-0 grid place-items-center w-9 h-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            <BellRing className="w-5 h-5" />
            {/* Badge số việc cần làm thật (từ /api/office/canh-bao-count) */}
            {alertCount !== null && alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </a>
        )}

        {/* ── Nút Quản trị: bảng thông minh, dùng <details> + liên kết cứng <a> ───── */}
        <details ref={ref} className="group relative shrink-0">
          <summary
            className="list-none marker:hidden [&::-webkit-details-marker]:hidden
                       flex items-center gap-2 h-10 pl-1.5 pr-2 sm:pr-3 rounded-full cursor-pointer select-none
                       border border-transparent hover:bg-slate-100 hover:border-slate-200 transition-colors
                       group-open:bg-slate-100 group-open:border-slate-200"
            aria-label="Tài khoản quản trị"
          >
            <span className="relative grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm shrink-0">
              {initials}
              {/* Chấm đang hoạt động */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight min-w-0">
              <span className="text-sm font-semibold text-slate-800 max-w-36 truncate">{userName}</span>
              <span className="text-[11px] text-slate-500 max-w-36 truncate">{roleDisplayName}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          {/* Bảng menu */}
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50">
            {/* Thông tin tài khoản */}
            <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-bold shadow shrink-0">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
                {/* Trạng thái đang hoạt động */}
                <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
              <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleChipClass(roleName)}`}>
                <ShieldCheck className="w-3 h-3" />
                {roleDisplayName}
              </span>
            </div>

            {/* Lựa chọn — đều là liên kết cứng (tải lại trang đầy đủ ⇒ không bao giờ lỗi) */}
            <nav className="p-1.5">
              <a
                href="/dashboard/ho-so-ca-nhan"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <UserCircle2 className="w-4 h-4 text-slate-500" />
                Hồ sơ của tôi
              </a>
              <a
                href="/dashboard/profile"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                Đổi mật khẩu
              </a>
              {isAdmin && (
                <a
                  href="/dashboard/cai-dat"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  Quản trị hệ thống
                </a>
              )}
              <div className="my-1 h-px bg-slate-100" />
              <a
                href="/api/logout"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </a>
            </nav>
          </div>
        </details>
      </div>
    </header>
  )
}
