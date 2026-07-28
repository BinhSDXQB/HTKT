import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, FolderKanban, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'

const STATUS_LABEL: Record<string, string> = { CHUAN_BI: 'Chuẩn bị', DA_DUYET: 'Đã phê duyệt', DANG_THUC_HIEN: 'Đang thi công', NGHIEM_THU: 'Nghiệm thu', HAN_THANH: 'Hoàn thành', TAM_DUNG: 'Tạm dừng', HUY: 'Huỷ' }
const STATUS_COLOR: Record<string, string> = { CHUAN_BI: 'bg-slate-100 text-slate-600', DA_DUYET: 'bg-blue-100 text-blue-700', DANG_THUC_HIEN: 'bg-yellow-100 text-yellow-700', NGHIEM_THU: 'bg-indigo-100 text-indigo-700', HAN_THANH: 'bg-green-100 text-green-700', TAM_DUNG: 'bg-orange-100 text-orange-700', HUY: 'bg-red-100 text-red-700' }
const TYPE_LABEL: Record<string, string> = { XAY_MOI: 'Xây mới', CAI_TAO: 'Cải tạo', BAO_TRI_LON: 'Bảo trì lớn', KHAC: 'Khác' }

export default async function DuAnChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: { ward: { select: { name: true } }, executingUnit: { select: { name: true } }, milestones: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!project) notFound()

  const spent = project.spentAmount ?? 0
  const budget = project.totalBudget ?? 0
  const progress = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0

  return (
    <div className="max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/du-an" className="hover:text-purple-600 flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" />Dự án</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium truncate">{project.name}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{project.projectCode}</span>
            <Badge className={`text-xs ${DOMAIN_COLOR[project.domain]}`}>{DOMAIN_LABEL[project.domain]}</Badge>
            <Badge className={`text-xs ${STATUS_COLOR[project.status]}`}>{STATUS_LABEL[project.status]}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4">Thông tin dự án</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-400">Loại dự án</dt><dd className="mt-0.5 text-slate-700">{TYPE_LABEL[project.type]}</dd></div>
              <div><dt className="text-xs text-slate-400">Vị trí</dt><dd className="mt-0.5 text-slate-700">{project.location || project.ward?.name || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Chủ đầu tư</dt><dd className="mt-0.5 text-slate-700">{project.investor || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Nhà thầu</dt><dd className="mt-0.5 text-slate-700">{project.executingUnit?.name || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Số QĐ phê duyệt</dt><dd className="mt-0.5 text-slate-700">{project.decisionNumber || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Nguồn vốn</dt><dd className="mt-0.5 text-slate-700">{project.fundingSource || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Khởi công</dt><dd className="mt-0.5 text-slate-700">{project.startDate ? format(project.startDate, 'dd/MM/yyyy', { locale: vi }) : '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Hoàn thành KH</dt><dd className="mt-0.5 text-slate-700">{project.endDate ? format(project.endDate, 'dd/MM/yyyy', { locale: vi }) : '—'}</dd></div>
            </dl>
          </div>

          {project.milestones.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-4">Tiến độ các mốc</h3>
              <div className="space-y-3">
                {project.milestones.map((m) => (
                  <div key={m.id} className="flex items-start gap-3">
                    {m.isDone ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-sm ${m.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{m.name}</p>
                      <p className="text-xs text-slate-400">{format(m.plannedDate, 'dd/MM/yyyy', { locale: vi })}{m.actualDate ? ` → ${format(m.actualDate, 'dd/MM/yyyy', { locale: vi })}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Ngân sách</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Tổng mức đầu tư</span><span className="font-semibold">{budget.toLocaleString('vi')} đ</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Đã giải ngân</span><span className="font-semibold text-blue-700">{spent.toLocaleString('vi')} đ</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-400 text-right">{progress}% đã giải ngân</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
