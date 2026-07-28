import { requireAuth, canAccessOffice, canAccessHtkt, canAccessCongViec } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardChrome } from '@/components/dashboard/dashboard-chrome'
import { ChatWidget } from '@/components/chatbot/chat-widget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Kiểm tra bắt buộc đổi mật khẩu — cho phép vào /profile để đổi
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      mustChangePassword: true,
      toChuc: { select: { ma: true } },
      canBo: { select: { hoTen: true, ngaySinh: true, gioiTinh: true } },
    },
  })
  if (dbUser?.mustChangePassword) {
    // Chỉ cho phép truy cập trang profile (đổi mật khẩu)
    // Việc redirect sẽ do page check — layout không biết pathname
    // Nên truyền flag xuống qua props thay thế
  }

  // Kiểm tra sinh nhật hôm nay
  let birthdayInfo: { hoTen: string; tuoi: number; gioiTinh: string | null } | null = null
  if (dbUser?.canBo?.ngaySinh) {
    const ns = new Date(dbUser.canBo.ngaySinh)
    const now = new Date()
    if (ns.getMonth() === now.getMonth() && ns.getDate() === now.getDate()) {
      birthdayInfo = {
        hoTen: dbUser.canBo.hoTen,
        tuoi: now.getFullYear() - ns.getFullYear(),
        gioiTinh: dbUser.canBo.gioiTinh as string | null,
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardChrome
        roleName={user.role.name}
        email={user.email}
        userName={user.name}
        userEmail={user.email}
        roleDisplayName={user.role.displayName}
        mustChangePassword={dbUser?.mustChangePassword ?? false}
        canOffice={canAccessOffice(user)}
        canHtkt={canAccessHtkt(user)}
        canCongViec={canAccessCongViec(user)}
        toChucMa={dbUser?.toChuc?.ma ?? null}
      />
      <main className="lg:ml-64 pt-14 min-h-screen">
        {dbUser?.mustChangePassword && (
          <div className="bg-red-600 text-white px-6 py-3 flex items-center gap-3 text-sm font-medium">
            <span className="text-xl">🔐</span>
            <span>
              Vì an toàn bảo mật, bạn <strong>bắt buộc phải đổi mật khẩu</strong> trước khi sử dụng hệ thống.
              Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.
            </span>
            <a href="/dashboard/profile"
              className="ml-auto shrink-0 bg-white text-red-700 font-bold px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm">
              Đổi mật khẩu ngay →
            </a>
          </div>
        )}
        <div className="p-3 sm:p-6">{children}</div>
      </main>
      <ChatWidget isWardUser={!!user.wardId} birthday={birthdayInfo} />
    </div>
  )
}
