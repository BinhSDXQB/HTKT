import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, ChevronRight, Settings, Edit, Trash2 } from 'lucide-react'
import { DeleteUserButton } from '@/components/cai-dat/delete-user-button'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function UsersPage() {
  const currentUser = await requireAuth()
  const isAdmin = currentUser.role?.name === 'admin'
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' }, include: { role: { select: { displayName: true, name: true } } } })

  return (
    <div className="max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cai-dat" className="hover:text-blue-700 flex items-center gap-1"><Settings className="w-3.5 h-3.5" />Quản trị</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Người dùng</span>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-700" />Người dùng ({users.length})</h1>
        {isAdmin ? (
          <Link href="/dashboard/cai-dat/users/moi"><Button className="bg-blue-700 hover:bg-blue-800 text-white gap-2"><Plus className="w-4 h-4" />Thêm người dùng</Button></Link>
        ) : (
          <Button disabled className="gap-2 opacity-50 cursor-not-allowed" title="Chỉ admin mới có quyền">
            <Plus className="w-4 h-4" />Thêm người dùng
          </Button>
        )}
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
            <th className="px-4 py-3 font-medium">Tên</th><th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Vai trò</th><th className="px-4 py-3 font-medium">Đăng nhập lần cuối</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium text-right">Thao tác</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${u.role.name === 'admin' ? 'bg-red-100 text-red-700' : u.role.name === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role.displayName}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.lastLoginAt ? format(u.lastLoginAt, 'dd/MM/yyyy HH:mm', { locale: vi }) : 'Chưa đăng nhập'}</td>
                <td className="px-4 py-3"><Badge className={`text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{u.isActive ? 'Đang hoạt động' : 'Đã khoá'}</Badge></td>
                <td className="px-4 py-3 text-right">
                  {isAdmin ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/dashboard/cai-dat/users/${u.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline transition">
                        Sửa
                      </Link>
                      <DeleteUserButton userId={u.id} userName={u.name} isAdmin={isAdmin} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
