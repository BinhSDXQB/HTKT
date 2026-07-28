import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { BookMarked, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function CanCuPhapLyPage() {
  await requireAuth()
  const rows = await db.roadLegalReference.findMany({ orderBy: [{ isActive: 'desc' }, { issuedDate: 'desc' }] })
  const today = new Date()

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Căn cứ pháp lý</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BookMarked className="w-6 h-6 text-amber-600" />Căn cứ pháp lý</h1>
        <p className="text-sm text-slate-500 mt-0.5">Văn bản pháp lý áp dụng cho cấp phép đường bộ và kiểm tra hiệu lực</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{rows.length.toLocaleString('vi')} văn bản</div>
        {rows.length === 0 ? (
          <div className="py-20 text-center"><BookMarked className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Chưa có văn bản pháp lý nào</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Số hiệu</th>
                <th className="px-4 py-3 font-medium">Trích yếu</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Hiệu lực</th>
                <th className="px-4 py-3 font-medium">Tình trạng</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const expired = r.expiryDate ? r.expiryDate < today : false
                  const active = r.isActive && !expired
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.code}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[320px]">
                        {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-amber-600">{r.title}</a> : r.title}
                        {r.scope && <p className="text-xs text-slate-400">{r.scope}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.documentType ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.effectiveDate ? format(r.effectiveDate, 'dd/MM/yyyy', { locale: vi }) : '—'}{r.expiryDate ? ` → ${format(r.expiryDate, 'dd/MM/yyyy', { locale: vi })}` : ''}</td>
                      <td className="px-4 py-3"><Badge className={`text-xs ${active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Còn hiệu lực' : 'Hết hiệu lực'}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
