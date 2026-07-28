import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR, CONDITION_LABEL, CONDITION_COLOR } from '@/lib/constants/tai-san'

const STATUS_LABEL: Record<string, string> = { NHAP: 'Bản nháp', DANG_KIEM: 'Đang kiểm tra', HOAN_THANH: 'Hoàn thành', HUY: 'Huỷ' }
const STATUS_COLOR: Record<string, string> = { NHAP: 'bg-slate-100 text-slate-600', DANG_KIEM: 'bg-yellow-100 text-yellow-700', HOAN_THANH: 'bg-green-100 text-green-700', HUY: 'bg-red-100 text-red-700' }
const INPUT_LABEL: Record<string, string> = { RATING: 'Điểm', YES_NO: 'Đạt/Không đạt', TEXT: 'Văn bản', NUMBER: 'Số', PHOTO: 'Hình ảnh' }

export default async function KiemTraChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const ins = await db.inspection.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, name: true, assetCode: true, domain: true } },
      inspector: { select: { name: true } },
      template: { select: { name: true } },
      results: { include: { item: true }, orderBy: { item: { sortOrder: 'asc' } } },
    },
  })
  if (!ins) notFound()

  return (
    <div className="max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/kiem-tra" className="hover:text-indigo-600 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />Kiểm tra</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">{ins.inspectionCode}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{ins.inspectionCode}</h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge className={`text-xs ${STATUS_COLOR[ins.status]}`}>{STATUS_LABEL[ins.status]}</Badge>
            {ins.conditionAfter && <Badge className={`text-xs ${CONDITION_COLOR[ins.conditionAfter]}`}>Sau KT: {CONDITION_LABEL[ins.conditionAfter]}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Thông tin */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4">Thông tin phiếu</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-400">Tài sản</dt><dd className="mt-0.5"><Link href={`/dashboard/tai-san/${ins.asset.id}`} className="text-blue-600 hover:underline">{ins.asset.name}</Link></dd></div>
              <div><dt className="text-xs text-slate-400">Lĩnh vực</dt><dd className="mt-0.5"><Badge className={`text-xs ${DOMAIN_COLOR[ins.asset.domain]}`}>{DOMAIN_LABEL[ins.asset.domain]}</Badge></dd></div>
              <div><dt className="text-xs text-slate-400">Mẫu kiểm tra</dt><dd className="mt-0.5 text-slate-700">{ins.template.name}</dd></div>
              <div><dt className="text-xs text-slate-400">Người kiểm tra</dt><dd className="mt-0.5 text-slate-700">{ins.inspector.name}</dd></div>
              <div><dt className="text-xs text-slate-400">Ngày kế hoạch</dt><dd className="mt-0.5 text-slate-700">{format(ins.scheduledDate, 'dd/MM/yyyy', { locale: vi })}</dd></div>
              <div><dt className="text-xs text-slate-400">Ngày thực hiện</dt><dd className="mt-0.5 text-slate-700">{ins.inspectedAt ? format(ins.inspectedAt, 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}</dd></div>
              {ins.overallRating != null && <div><dt className="text-xs text-slate-400">Điểm tổng</dt><dd className="mt-0.5 font-semibold text-slate-800">{ins.overallRating}/5</dd></div>}
            </dl>
            {ins.summary && <div className="mt-4 pt-4 border-t"><p className="text-xs text-slate-400 mb-1">Tóm tắt</p><p className="text-sm text-slate-700">{ins.summary}</p></div>}
            {ins.notes && <div className="mt-3"><p className="text-xs text-slate-400 mb-1">Ghi chú</p><p className="text-sm text-slate-700">{ins.notes}</p></div>}
          </div>

          {/* Kết quả kiểm tra */}
          {ins.results.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-4">Kết quả các hạng mục</h3>
              <div className="space-y-3">
                {ins.results.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{r.item.name}</p>
                      <p className="text-xs text-slate-400">{INPUT_LABEL[r.item.inputType]}</p>
                    </div>
                    <div className="text-right">
                      {r.item.inputType === 'RATING' && r.rating != null && <span className="font-semibold text-slate-800">{r.rating}/5</span>}
                      {r.item.inputType === 'YES_NO' && <Badge className={r.yesNo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{r.yesNo ? 'Đạt' : 'Không đạt'}</Badge>}
                      {r.item.inputType === 'TEXT' && <span className="text-sm text-slate-600">{r.textValue || '—'}</span>}
                      {r.item.inputType === 'NUMBER' && <span className="text-sm text-slate-600">{r.numberValue ?? '—'}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Tình trạng trước / sau</h3>
            <div className="space-y-2">
              {ins.conditionBefore && <div className="flex justify-between text-sm"><span className="text-slate-500">Trước:</span><Badge className={`text-xs ${CONDITION_COLOR[ins.conditionBefore]}`}>{CONDITION_LABEL[ins.conditionBefore]}</Badge></div>}
              {ins.conditionAfter && <div className="flex justify-between text-sm"><span className="text-slate-500">Sau:</span><Badge className={`text-xs ${CONDITION_COLOR[ins.conditionAfter]}`}>{CONDITION_LABEL[ins.conditionAfter]}</Badge></div>}
              {!ins.conditionBefore && !ins.conditionAfter && <p className="text-xs text-slate-400">Chưa đánh giá</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
