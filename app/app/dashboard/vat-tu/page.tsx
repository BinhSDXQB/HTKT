import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, AlertCircle } from 'lucide-react'

export default async function VatTuPage() {
  await requireAuth()

  const [categories, materials] = await Promise.all([
    db.materialCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.material.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } } },
    }),
  ])

  const lowStock = materials.filter((m) => m.currentStock <= m.minStock)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            Vật tư & Kho
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý vật tư, thiết bị và tồn kho</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/danh-muc"><Button variant="outline" size="sm">Quản lý danh mục</Button></Link>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Cảnh báo tồn kho thấp</p>
            <p className="text-xs text-amber-600 mt-0.5">{lowStock.length} vật tư dưới mức tối thiểu: {lowStock.map((m) => m.name).slice(0, 3).join(', ')}{lowStock.length > 3 ? '...' : ''}</p>
          </div>
        </div>
      )}

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng danh mục VT', value: materials.length, color: 'text-teal-700' },
          { label: 'Nhóm vật tư', value: categories.length, color: 'text-blue-700' },
          { label: 'VT tồn kho thấp', value: lowStock.length, color: 'text-amber-700' },
          { label: 'Tổng giao dịch', value: '—', color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Danh sách vật tư */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Danh sách vật tư</span>
          <Link href="/dashboard/danh-muc"><Button variant="outline" size="sm" className="text-xs">+ Thêm vật tư</Button></Link>
        </div>
        {materials.length === 0 ? (
          <div className="py-20 text-center"><Package className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Chưa có vật tư nào. <Link href="/dashboard/danh-muc" className="text-blue-600 hover:underline">Thêm từ Danh mục</Link></p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Mã VT</th>
                <th className="px-4 py-3 font-medium">Tên vật tư</th>
                <th className="px-4 py-3 font-medium">Nhóm</th>
                <th className="px-4 py-3 font-medium text-right">Tồn kho</th>
                <th className="px-4 py-3 font-medium text-right">Tối thiểu</th>
                <th className="px-4 py-3 font-medium">Đơn vị</th>
                <th className="px-4 py-3 font-medium text-right">Đơn giá</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{m.category.name}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${m.currentStock <= m.minStock ? 'text-amber-600' : 'text-slate-800'}`}>{m.currentStock.toLocaleString('vi')}</td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">{m.minStock.toLocaleString('vi')}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{m.unit}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">{m.unitPrice?.toLocaleString('vi') ?? '—'} đ</td>
                    <td className="px-4 py-3">
                      {m.currentStock <= m.minStock
                        ? <Badge className="text-xs bg-amber-100 text-amber-700">Tồn thấp</Badge>
                        : <Badge className="text-xs bg-green-100 text-green-700">Đủ hàng</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
