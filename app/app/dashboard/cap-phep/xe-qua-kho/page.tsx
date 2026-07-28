import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Truck, Search, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ROAD_PERMIT_STATUS_LABEL, ROAD_PERMIT_STATUS_COLOR, OVERSIZED_PERMIT_TYPE_LABEL } from '@/lib/constants/cap-phep'

type SP = { q?: string; status?: string; type?: string; page?: string }

export default async function XeQuaKhoPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (sp.status) where.status = sp.status
  if (sp.type) where.permitType = sp.type
  if (sp.q) where.OR = [
    { fileCode: { contains: sp.q, mode: 'insensitive' } },
    { applicantName: { contains: sp.q, mode: 'insensitive' } },
    { permitNumber: { contains: sp.q, mode: 'insensitive' } },
  ]

  const [rows, total] = await Promise.all([
    db.oversizedVehiclePermit.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { plateNumber: true } } },
    }),
    db.oversizedVehiclePermit.count({ where }),
  ])
  const totalPages = Math.ceil(total / pageSize)

  const buildUrl = (key: string, val: string | undefined) => {
    const p = new URLSearchParams()
    const cur = { ...sp, [key]: val, page: undefined }
    for (const [k, v] of Object.entries(cur)) { if (v) p.set(k, v) }
    return `/dashboard/cap-phep/xe-qua-kho${p.toString() ? '?' + p.toString() : ''}`
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Xe quá khổ, quá tải</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Truck className="w-6 h-6 text-teal-600" />Xe quá khổ, quá tải</h1>
          <p className="text-sm text-slate-500 mt-0.5">Hồ sơ cấp giấy phép lưu hành xe quá khổ giới hạn, quá tải trọng</p>
        </div>
        <Link href="/dashboard/cap-phep/xe-qua-kho/moi">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2"><Plus className="w-4 h-4" />Tạo hồ sơ</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <form method="GET" className="flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.type && <input type="hidden" name="type" value={sp.type} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={sp.q} placeholder="Tìm mã hồ sơ, đơn vị, số giấy phép..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {(sp.q || sp.status || sp.type) && <Link href="/dashboard/cap-phep/xe-qua-kho"><Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button></Link>}
        </form>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Trạng thái:</span>
          {[undefined, ...Object.keys(ROAD_PERMIT_STATUS_LABEL)].map((k) => (
            <Link key={k ?? 'all'} href={buildUrl('status', k)}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${(!k && !sp.status) || sp.status === k ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {k ? ROAD_PERMIT_STATUS_LABEL[k] : 'Tất cả'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{total.toLocaleString('vi')} hồ sơ</div>
        {rows.length === 0 ? (
          <div className="py-20 text-center"><Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Chưa có hồ sơ nào</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Hồ sơ</th>
                <th className="px-4 py-3 font-medium">Loại phép</th>
                <th className="px-4 py-3 font-medium">Đơn vị đề nghị</th>
                <th className="px-4 py-3 font-medium">Biển số</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/cap-phep/xe-qua-kho/${r.id}`} className="hover:text-teal-600">
                        <p className="font-mono text-xs font-medium text-slate-800">{r.fileCode}</p>
                        {r.permitNumber && <p className="text-xs text-slate-400">GP: {r.permitNumber}</p>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{OVERSIZED_PERMIT_TYPE_LABEL[r.permitType]}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{r.applicantName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.vehicle?.plateNumber ?? '—'}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${ROAD_PERMIT_STATUS_COLOR[r.status]}`}>{ROAD_PERMIT_STATUS_LABEL[r.status]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{format(r.createdAt, 'dd/MM/yyyy', { locale: vi })}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/cap-phep/xe-qua-kho/${r.id}`}><Button variant="ghost" size="sm" className="text-xs text-blue-600">Chi tiết</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
            {page > 1 && <Link href={buildUrl('page', String(page - 1))}><Button variant="outline" size="sm">← Trước</Button></Link>}
            <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
            {page < totalPages && <Link href={buildUrl('page', String(page + 1))}><Button variant="outline" size="sm">Sau →</Button></Link>}
          </div>
        )}
      </div>
    </div>
  )
}
