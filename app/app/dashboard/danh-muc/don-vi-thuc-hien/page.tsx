import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, BookOpen, Users } from 'lucide-react'

export default async function DonViThucHienPage() {
  await requireAuth()
  const units = await db.executingUnit.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/danh-muc" className="hover:text-blue-700 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Danh mục</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Đơn vị thực hiện</span>
      </nav>
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-purple-700" />Đơn vị thực hiện ({units.length})</h1>
      {units.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Chưa có đơn vị thực hiện nào</p>
          <p className="text-xs text-slate-400 mt-1">Thêm nhà thầu, đội sửa chữa... để phân công phiếu công việc</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
              <th className="px-4 py-3 font-medium">Mã</th><th className="px-4 py-3 font-medium">Tên đơn vị</th>
              <th className="px-4 py-3 font-medium">SĐT</th><th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.code}</td>
                  <td className="px-4 py-3 text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{u.email ?? '—'}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{u.isActive ? 'Đang hoạt động' : 'Ngưng'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
