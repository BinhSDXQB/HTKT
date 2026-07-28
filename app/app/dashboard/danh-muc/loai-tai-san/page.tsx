import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, BookOpen, Building2 } from 'lucide-react'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'

export default async function LoaiTaiSanPage() {
  await requireAuth()
  const assetTypes = await db.assetType.findMany({ orderBy: [{ domain: 'asc' }, { name: 'asc' }] })

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/danh-muc" className="hover:text-blue-700 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Danh mục</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Loại tài sản</span>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-700" />Loại tài sản ({assetTypes.length})</h1>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
            <th className="px-4 py-3 font-medium">Mã</th>
            <th className="px-4 py-3 font-medium">Tên loại</th>
            <th className="px-4 py-3 font-medium">Lĩnh vực</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {assetTypes.map((at) => (
              <tr key={at.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{at.code}</td>
                <td className="px-4 py-3 text-slate-800">{at.name}</td>
                <td className="px-4 py-3"><Badge className={`text-xs ${DOMAIN_COLOR[at.domain]}`}>{DOMAIN_LABEL[at.domain]}</Badge></td>
                <td className="px-4 py-3"><Badge className={`text-xs ${at.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{at.isActive ? 'Đang dùng' : 'Ngưng'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
