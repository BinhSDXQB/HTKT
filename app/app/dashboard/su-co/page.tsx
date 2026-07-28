import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, AlertTriangle, Search } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'
import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_COLOR, INCIDENT_PRIORITY_LABEL, INCIDENT_PRIORITY_COLOR } from '@/lib/constants/su-co'

type SP = { q?: string; status?: string; priority?: string; domain?: string; page?: string }

export default async function SuCoPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (sp.status) where.status = sp.status
  if (sp.priority) where.priority = sp.priority
  if (sp.domain) where.domain = sp.domain
  if (sp.q) where.OR = [
    { incidentCode: { contains: sp.q, mode: 'insensitive' } },
    { title: { contains: sp.q, mode: 'insensitive' } },
    { address: { contains: sp.q, mode: 'insensitive' } },
  ]

  const [incidents, total] = await Promise.all([
    db.incident.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy: [{ priority: 'desc' }, { reportedAt: 'desc' }],
      include: {
        asset: { select: { name: true, assetCode: true } },
        ward: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
    }),
    db.incident.count({ where }),
  ])
  const totalPages = Math.ceil(total / pageSize)

  const buildUrl = (key: string, val: string | undefined) => {
    const p = new URLSearchParams()
    const cur = { ...sp, [key]: val, page: undefined }
    for (const [k, v] of Object.entries(cur)) { if (v) p.set(k, v) }
    return `/dashboard/su-co${p.toString() ? '?' + p.toString() : ''}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Sự cố & Phản ánh
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Tiếp nhận và theo dõi xử lý sự cố hạ tầng</p>
        </div>
        <Link href="/dashboard/su-co/moi">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Plus className="w-4 h-4" /> Ghi nhận sự cố
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <form method="GET" className="flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.priority && <input type="hidden" name="priority" value={sp.priority} />}
          {sp.domain && <input type="hidden" name="domain" value={sp.domain} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={sp.q} placeholder="Tìm mã, tiêu đề, địa chỉ..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {(sp.q || sp.status || sp.priority || sp.domain) && <Link href="/dashboard/su-co"><Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button></Link>}
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Trạng thái:</span>
          {[undefined, ...Object.keys(INCIDENT_STATUS_LABEL)].map((k) => (
            <Link key={k ?? 'all'} href={buildUrl('status', k)}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${(!k && !sp.status) || sp.status === k ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {k ? INCIDENT_STATUS_LABEL[k] : 'Tất cả'}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Ưu tiên:</span>
          {[undefined, ...Object.keys(INCIDENT_PRIORITY_LABEL)].map((k) => (
            <Link key={k ?? 'all'} href={buildUrl('priority', k)}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${(!k && !sp.priority) || sp.priority === k ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {k ? INCIDENT_PRIORITY_LABEL[k] : 'Tất cả'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{total.toLocaleString('vi')} sự cố</div>
        {incidents.length === 0 ? (
          <div className="py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Không có sự cố nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Sự cố</th>
                <th className="px-4 py-3 font-medium">Lĩnh vực</th>
                <th className="px-4 py-3 font-medium">Tài sản</th>
                <th className="px-4 py-3 font-medium">Vị trí</th>
                <th className="px-4 py-3 font-medium">Ưu tiên</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày báo</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/su-co/${inc.id}`} className="hover:text-orange-600">
                        <p className="font-medium text-slate-800">{inc.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{inc.incidentCode}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${DOMAIN_COLOR[inc.domain]}`}>{DOMAIN_LABEL[inc.domain]}</Badge></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{inc.asset?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{inc.address || inc.ward?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${INCIDENT_PRIORITY_COLOR[inc.priority]}`}>{INCIDENT_PRIORITY_LABEL[inc.priority]}</Badge></td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${INCIDENT_STATUS_COLOR[inc.status]}`}>{INCIDENT_STATUS_LABEL[inc.status]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{format(inc.reportedAt, 'dd/MM/yyyy', { locale: vi })}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/su-co/${inc.id}`}><Button variant="ghost" size="sm" className="text-xs text-blue-600">Chi tiết</Button></Link></td>
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
