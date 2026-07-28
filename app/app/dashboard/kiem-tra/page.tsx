import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ClipboardList, Search } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'

const STATUS_LABEL: Record<string, string> = {
  NHAP: 'Bản nháp', DANG_KIEM: 'Đang kiểm tra', HOAN_THANH: 'Hoàn thành', HUY: 'Huỷ',
}
const STATUS_COLOR: Record<string, string> = {
  NHAP: 'bg-slate-100 text-slate-600', DANG_KIEM: 'bg-yellow-100 text-yellow-700',
  HOAN_THANH: 'bg-green-100 text-green-700', HUY: 'bg-red-100 text-red-700',
}

type SP = { q?: string; status?: string; page?: string }

export default async function KiemTraPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (sp.status) where.status = sp.status
  if (sp.q) where.OR = [
    { inspectionCode: { contains: sp.q, mode: 'insensitive' } },
    { asset: { name: { contains: sp.q, mode: 'insensitive' } } },
  ]

  const [inspections, total] = await Promise.all([
    db.inspection.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy: { scheduledDate: 'desc' },
      include: { asset: { select: { name: true, assetCode: true, domain: true } }, inspector: { select: { name: true } }, template: { select: { name: true } } },
    }),
    db.inspection.count({ where }),
  ])
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            Kiểm tra hiện trạng
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Lịch sử kiểm tra tình trạng tài sản hạ tầng</p>
        </div>
        <Link href="/dashboard/kiem-tra/moi">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Lập phiếu kiểm tra
          </Button>
        </Link>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={sp.q} placeholder="Tìm mã phiếu, tên tài sản..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {(sp.q || sp.status) && <Link href="/dashboard/kiem-tra"><Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button></Link>}
        </form>
        <div className="flex gap-1.5 items-center flex-wrap">
          <span className="text-xs text-slate-500">Trạng thái:</span>
          {[undefined, ...Object.keys(STATUS_LABEL)].map((key) => (
            <Link key={key ?? 'all'} href={`/dashboard/kiem-tra${key ? `?status=${key}` : ''}`}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${(!key && !sp.status) || sp.status === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {key ? STATUS_LABEL[key] : 'Tất cả'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{total.toLocaleString('vi')} phiếu kiểm tra</div>
        {inspections.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chưa có phiếu kiểm tra nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Mã phiếu</th>
                <th className="px-4 py-3 font-medium">Tài sản</th>
                <th className="px-4 py-3 font-medium">Mẫu kiểm tra</th>
                <th className="px-4 py-3 font-medium">Ngày kiểm tra</th>
                <th className="px-4 py-3 font-medium">Người kiểm tra</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{ins.inspectionCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{ins.asset.name}</p>
                      <Badge className={`text-xs mt-0.5 ${DOMAIN_COLOR[ins.asset.domain]}`}>{DOMAIN_LABEL[ins.asset.domain]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ins.template.name}</td>
                    <td className="px-4 py-3 text-slate-600">{format(ins.scheduledDate, 'dd/MM/yyyy', { locale: vi })}</td>
                    <td className="px-4 py-3 text-slate-600">{ins.inspector.name}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_COLOR[ins.status]}`}>{STATUS_LABEL[ins.status]}</Badge></td>
                    <td className="px-4 py-3"><Link href={`/dashboard/kiem-tra/${ins.id}`}><Button variant="ghost" size="sm" className="text-xs text-blue-600">Chi tiết</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
            {page > 1 && <Link href={`/dashboard/kiem-tra?page=${page - 1}${sp.status ? `&status=${sp.status}` : ''}`}><Button variant="outline" size="sm">← Trước</Button></Link>}
            <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
            {page < totalPages && <Link href={`/dashboard/kiem-tra?page=${page + 1}${sp.status ? `&status=${sp.status}` : ''}`}><Button variant="outline" size="sm">Sau →</Button></Link>}
          </div>
        )}
      </div>
    </div>
  )
}
