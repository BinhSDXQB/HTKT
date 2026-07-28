import { ShieldCheck, Map, Waypoints, Leaf } from 'lucide-react'

type AuthShellProps = {
  heading: string
  sub?: string
  children: React.ReactNode
}

const FEATURES = [
  { icon: Map, text: 'Bản đồ GIS & dữ liệu kỹ thuật tập trung' },
  { icon: Waypoints, text: 'Cấp – thoát nước, chiếu sáng, giao thông đô thị' },
  { icon: Leaf, text: 'Cây xanh, hạ tầng ngầm & dùng chung' },
  { icon: ShieldCheck, text: 'Phân quyền chặt chẽ, an toàn dữ liệu' },
]

/**
 * Khung xác thực 2 cột: panel thương hiệu (trái, ẩn ở mobile) + vùng biểu mẫu (phải).
 * Dùng chung cho /login, /quen-mat-khau, /dat-lai-mat-khau để đồng bộ nhận diện.
 * Màu theo logo cơ quan: xanh dương chủ đạo + điểm nhấn xanh lá.
 */
export function AuthShell({ heading, sub, children }: AuthShellProps) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ===== Panel thương hiệu ===== */}
      <aside className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between
        bg-[linear-gradient(155deg,#08285a_0%,#0f3f86_52%,#1659ad_100%)]">
        {/* đốm sáng trang trí */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-sky-300/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-emerald-400 via-sky-300 to-emerald-400" />

        {/* logo + tên cơ quan */}
        <div className="relative flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-lg shadow-blue-950/30">
            <img src="/logo-htkt.png" alt="" className="h-11 w-11 object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide text-sky-50">SỞ XÂY DỰNG QUẢNG TRỊ</p>
            <p className="text-xs text-sky-200/80">Hệ thống Quản lý Hạ tầng Kỹ thuật Đô thị</p>
          </div>
        </div>

        {/* tiêu đề lớn + tính năng */}
        <div className="relative max-w-md">
          <h2 className="text-[2rem] font-extrabold leading-tight">
            Quản lý hạ tầng kỹ thuật đô thị{' '}
            <span className="text-emerald-300">thông minh &amp; bền vững</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sky-100/80">
            Nền tảng số thống nhất cho cấp – thoát nước, cây xanh, chiếu sáng,
            giao thông đô thị và hạ tầng ngầm trên địa bàn tỉnh Quảng Trị.
          </p>
          <ul className="mt-7 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-sky-50/90">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-emerald-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sky-200/60">© {year} Sở Xây dựng Quảng Trị · Bản quyền thuộc cơ quan</p>
      </aside>

      {/* ===== Vùng biểu mẫu ===== */}
      <main className="flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/60 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <img src="/logo-htkt.png" alt="Logo Hệ thống QLHTKT" className="mx-auto mb-4 h-16 w-16 object-contain drop-shadow-md lg:hidden" />
            <h1 className="text-xl font-extrabold uppercase leading-tight tracking-tight text-slate-800">{heading}</h1>
            {sub && <p className="mt-1.5 text-sm text-slate-500">{sub}</p>}
          </div>
          {children}
          <p className="mt-6 text-center text-xs text-slate-400">
            © {year} Hệ thống Quản lý Hạ tầng Kỹ thuật · Sở Xây dựng Quảng Trị
          </p>
        </div>
      </main>
    </div>
  )
}
