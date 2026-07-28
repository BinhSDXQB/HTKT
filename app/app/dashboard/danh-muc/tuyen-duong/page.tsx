import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, BookOpen } from 'lucide-react'

// Road component using text since 'Road' may not exist in lucide-react version
const RoadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-700">
    <path d="M3 17l3-10 3 5 3-5 3 10H3z"/><path d="M12 17v4"/><path d="M12 2v3"/>
  </svg>
)

export default async function TuyenDuongPage() {
  await requireAuth()
  const streets = await db.street.findMany({ orderBy: { name: 'asc' }, include: { ward: { select: { name: true } } } })

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/danh-muc" className="hover:text-blue-700 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Danh mục</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Tuyến đường</span>
      </nav>
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><RoadIcon />Tuyến đường ({streets.length})</h1>
      {streets.length === 0 ? (
        <div className="bg-white rounded-xl border py-20 text-center">
          <p className="text-slate-400 text-sm">Chưa có tuyến đường nào. Thêm trực tiếp vào database hoặc qua import.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
              <th className="px-4 py-3 font-medium">Mã</th><th className="px-4 py-3 font-medium">Tên tuyến đường</th>
              <th className="px-4 py-3 font-medium">Phường/Xã</th><th className="px-4 py-3 font-medium">Chiều dài (m)</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {streets.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.code}</td>
                  <td className="px-4 py-3 text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{s.ward?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{s.length?.toLocaleString('vi') ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
