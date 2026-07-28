import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Settings, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function AuditPage() {
  await requireAuth()
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' }, take: 100,
    include: { user: { select: { name: true, email: true } } },
  })

  return (
    <div className="max-w-5xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cai-dat" className="hover:text-blue-700 flex items-center gap-1"><Settings className="w-3.5 h-3.5" />Quản trị</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Nhật ký hệ thống</span>
      </nav>
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-600" />Nhật ký hệ thống (100 bản ghi gần nhất)</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
              <th className="px-4 py-3 font-medium">Thời gian</th><th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">Thao tác</th><th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">Chi tiết</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{format(log.createdAt, 'dd/MM/yyyy HH:mm:ss', { locale: vi })}</td>
                  <td className="px-4 py-2.5 text-xs"><p className="font-medium text-slate-700">{log.user.name}</p><p className="text-slate-400">{log.user.email}</p></td>
                  <td className="px-4 py-2.5"><span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{log.action}</span></td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{log.module}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[300px] truncate">{log.detail ?? '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Chưa có nhật ký</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
