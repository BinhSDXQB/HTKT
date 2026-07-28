import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, BookOpen, MapPin } from 'lucide-react'

export default async function DonViHanhChinhPage() {
  await requireAuth()
  const units = await db.administrativeUnit.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: { parent: { select: { name: true } } },
  })

  const typeLabel: Record<string, string> = { TINH: 'Tỉnh/TP', QUAN_HUYEN: 'Quận/Huyện', PHUONG_XA: 'Phường/Xã' }

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/danh-muc" className="hover:text-blue-700 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Danh mục</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Đơn vị hành chính</span>
      </nav>
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-green-700" />Đơn vị hành chính ({units.length})</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        Dữ liệu mẫu — cần cập nhật lại đúng theo đơn vị hành chính thực tế của địa phương trong cơ sở dữ liệu.
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
            <th className="px-4 py-3 font-medium">Mã</th><th className="px-4 py-3 font-medium">Tên</th>
            <th className="px-4 py-3 font-medium">Loại</th><th className="px-4 py-3 font-medium">Thuộc</th>
            <th className="px-4 py-3 font-medium">Phân loại</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((u) => {
              const isCore = u.type === 'PHUONG_XA' && (
                u.name.startsWith('Phường') ||
                !!(u.trungTamHc && (u.trungTamHc.toLowerCase().includes('thị trấn') || u.trungTamHc.toLowerCase().includes('thị xã'))) ||
                !!(u.truocSapNhap && (u.truocSapNhap.toLowerCase().includes('thị trấn') || u.truocSapNhap.toLowerCase().includes('thị xã')))
              )
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.code}</td>
                  <td className="px-4 py-3 text-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{u.fullName || u.name}</span>
                      {isCore && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-amber-300">
                          Vùng lõi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{typeLabel[u.type]}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.parent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {u.type === 'PHUONG_XA' ? (
                      isCore ? (
                        <span className="text-amber-700 font-medium">Vùng lõi</span>
                      ) : (
                        <span className="text-slate-500">Vùng khác</span>
                      )
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
