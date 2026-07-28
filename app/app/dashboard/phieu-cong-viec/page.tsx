import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Wrench, Search } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'
import { WO_STATUS_LABEL, WO_STATUS_COLOR, WO_TYPE_LABEL, WO_PRIORITY_COLOR, WO_PRIORITY_LABEL } from '@/lib/constants/phieu-cv'

type SP = { q?: string; status?: string; type?: string; page?: string }

export default async function PhieuCVPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (sp.status) where.status = sp.status
  if (sp.type) where.type = sp.type
  if (sp.q) where.OR = [
    { workOrderCode: { contains: sp.q, mode: 'insensitive' } },
    { title: { contains: sp.q, mode: 'insensitive' } },
  ]

  const [workOrders, total] = await Promise.all([
    db.workOrder.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        asset: { select: { name: true } },
        executingUnit: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    db.workOrder.count({ where }),
  ])
  const totalPages = Math.ceil(total / pageSize)

  const buildUrl = (key: string, val: string | undefined) => {
    const p = new URLSearchParams()
    const cur = { ...sp, [key]: val, page: undefined }
    for (const [k, v] of Object.entries(cur)) { if (v) p.set(k, v) }
    return `/dashboard/phieu-cong-viec${p.toString() ? '?' + p.toString() : ''}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-yellow-600" />
            Phiếu công việc
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý bảo trì, sửa chữa và kiểm tra định kỳ</p>
        </div>
        <Link href="/dashboard/phieu-cong-viec/moi">
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Tạo phiếu công việc
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <form method="GET" className="flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.type && <input type="hidden" name="type" value={sp.type} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={sp.q} placeholder="Tìm mã, tiêu đề..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {(sp.q || sp.status || sp.type) && <Link href="/dashboard/phieu-cong-viec"><Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button></Link>}
        </form>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Trạng thái:</span>
          {[undefined, ...Object.keys(WO_STATUS_LABEL)].map((k) => (
            <Link key={k ?? 'all'} href={buildUrl('status', k)}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${(!k && !sp.status) || sp.status === k ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {k ? WO_STATUS_LABEL[k] : 'Tất cả'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{total.toLocaleString('vi')} phiếu công việc</div>
        {workOrders.length === 0 ? (
          <div className="py-20 text-center"><Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Chưa có phiếu công việc nào</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Phiếu công việc</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Lĩnh vực</th>
                <th className="px-4 py-3 font-medium">Tài sản</th>
                <th className="px-4 py-3 font-medium">Đơn vị TH</th>
                <th className="px-4 py-3 font-medium">Ưu tiên</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày KH</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/phieu-cong-viec/${wo.id}`} className="hover:text-yellow-700">
                        <p className="font-medium text-slate-800">{wo.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{wo.workOrderCode}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{WO_TYPE_LABEL[wo.type]}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${DOMAIN_COLOR[wo.domain]}`}>{DOMAIN_LABEL[wo.domain]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{wo.asset?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{wo.executingUnit?.name ?? wo.assignedTo?.name ?? '—'}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${WO_PRIORITY_COLOR[wo.priority]}`}>{WO_PRIORITY_LABEL[wo.priority]}</Badge></td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${WO_STATUS_COLOR[wo.status]}`}>{WO_STATUS_LABEL[wo.status]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{wo.plannedStart ? format(wo.plannedStart, 'dd/MM/yyyy', { locale: vi }) : '—'}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/phieu-cong-viec/${wo.id}`}><Button variant="ghost" size="sm" className="text-xs text-blue-600">Chi tiết</Button></Link></td>
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
