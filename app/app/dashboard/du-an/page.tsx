import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FolderKanban } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'

const STATUS_LABEL: Record<string, string> = { CHUAN_BI: 'Chuẩn bị', DA_DUYET: 'Đã phê duyệt', DANG_THUC_HIEN: 'Đang thi công', NGHIEM_THU: 'Nghiệm thu', HAN_THANH: 'Hoàn thành', TAM_DUNG: 'Tạm dừng', HUY: 'Huỷ' }
const STATUS_COLOR: Record<string, string> = { CHUAN_BI: 'bg-slate-100 text-slate-600', DA_DUYET: 'bg-blue-100 text-blue-700', DANG_THUC_HIEN: 'bg-yellow-100 text-yellow-700', NGHIEM_THU: 'bg-indigo-100 text-indigo-700', HAN_THANH: 'bg-green-100 text-green-700', TAM_DUNG: 'bg-orange-100 text-orange-700', HUY: 'bg-red-100 text-red-700' }

type SP = { q?: string; status?: string; domain?: string; page?: string }

export default async function DuAnPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 20
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (sp.status) where.status = sp.status
  if (sp.domain) where.domain = sp.domain
  if (sp.q) where.OR = [{ projectCode: { contains: sp.q, mode: 'insensitive' } }, { name: { contains: sp.q, mode: 'insensitive' } }]

  const [projects, total] = await Promise.all([
    db.project.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' }, include: { ward: { select: { name: true } }, executingUnit: { select: { name: true } } } }),
    db.project.count({ where }),
  ])
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FolderKanban className="w-6 h-6 text-purple-600" />Dự án công trình</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý đầu tư xây dựng và cải tạo hạ tầng</p>
        </div>
        <Link href="/dashboard/du-an/moi"><Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2"><Plus className="w-4 h-4" />Thêm dự án</Button></Link>
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder="Tìm mã, tên dự án..." className="flex-1 h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {(sp.q || sp.status) && <Link href="/dashboard/du-an"><Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button></Link>}
        </form>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-slate-500">Trạng thái:</span>
          {[undefined, ...Object.keys(STATUS_LABEL)].map((k) => (
            <Link key={k ?? 'all'} href={`/dashboard/du-an${k ? `?status=${k}` : ''}`}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${(!k && !sp.status) || sp.status === k ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{k ? STATUS_LABEL[k] : 'Tất cả'}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{total.toLocaleString('vi')} dự án</div>
        {projects.length === 0 ? (
          <div className="py-20 text-center"><FolderKanban className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Chưa có dự án nào</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Dự án</th>
                <th className="px-4 py-3 font-medium">Lĩnh vực</th>
                <th className="px-4 py-3 font-medium">Nhà thầu</th>
                <th className="px-4 py-3 font-medium">Ngân sách</th>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/du-an/${p.id}`} className="hover:text-purple-600">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.projectCode}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${DOMAIN_COLOR[p.domain]}`}>{DOMAIN_LABEL[p.domain]}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.executingUnit?.name ?? p.investor ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{p.totalBudget ? p.totalBudget.toLocaleString('vi') + ' đ' : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.startDate ? format(p.startDate, 'dd/MM/yyyy', { locale: vi }) : '—'}
                      {p.endDate ? ` → ${format(p.endDate, 'dd/MM/yyyy', { locale: vi })}` : ''}
                    </td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</Badge></td>
                    <td className="px-4 py-3"><Link href={`/dashboard/du-an/${p.id}`}><Button variant="ghost" size="sm" className="text-xs text-blue-600">Chi tiết</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
            {page > 1 && <Link href={`/dashboard/du-an?page=${page - 1}${sp.status ? `&status=${sp.status}` : ''}`}><Button variant="outline" size="sm">← Trước</Button></Link>}
            <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
            {page < totalPages && <Link href={`/dashboard/du-an?page=${page + 1}${sp.status ? `&status=${sp.status}` : ''}`}><Button variant="outline" size="sm">Sau →</Button></Link>}
          </div>
        )}
      </div>
    </div>
  )
}
