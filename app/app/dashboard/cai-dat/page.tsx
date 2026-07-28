import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Settings, Users, Building2, FileText, Wallet } from 'lucide-react'
import { canImportSalary } from '@/lib/salary-perms'

export default async function CaiDatPage() {
  const user = await requireAuth()
  if (user.role.name !== 'admin') redirect('/forbidden')

  const userCount = await db.user.count({ where: { isActive: true } })

  const cards = [
    { title: 'Người dùng', desc: 'Quản lý tài khoản và phân quyền', count: `${userCount} tài khoản`, icon: Users, href: '/dashboard/cai-dat/users', color: 'text-blue-700', bg: 'bg-blue-50' },
    { title: 'Thông tin cơ quan', desc: 'Tên đơn vị, địa chỉ, logo', count: 'Cấu hình', icon: Building2, href: '/dashboard/cai-dat/co-quan', color: 'text-green-700', bg: 'bg-green-50' },
    { title: 'Nhật ký hệ thống', desc: 'Lịch sử thao tác người dùng', count: 'Audit log', icon: FileText, href: '/dashboard/cai-dat/audit', color: 'text-slate-600', bg: 'bg-slate-100' },
  ]

  if (canImportSalary(user)) {
    cards.push({ title: 'Import dữ liệu lương', desc: 'Cập nhật từ file Theo dõi lên lương', count: 'Excel → CanBo', icon: Wallet, href: '/dashboard/cai-dat/luong', color: 'text-emerald-700', bg: 'bg-emerald-50' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings className="w-6 h-6 text-slate-600" />Quản trị hệ thống</h1>
        <p className="text-sm text-slate-500 mt-0.5">Đăng nhập với tư cách: <span className="font-medium">{user.role.displayName}</span></p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow hover:border-blue-200 group">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{c.title}</p>
            <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
            <p className={`text-sm font-medium mt-3 ${c.color}`}>{c.count}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
