import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getQd72Auth } from '@/lib/qd72/auth'
import { coTheSua } from '@/lib/qd72/phan-quyen'
import { listChildRecords } from '@/app/actions/qd72-child'
import { QD72_ENTRY } from '@/lib/qd72/phieu-entry'
import { Qd72ChildEntry } from '@/components/qd72/qd72-child-entry'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'

const dbAny = db as unknown as { qd72_survey_cases: { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> } }
const TT: Record<string, string> = { DRAFT: 'Nháp', SUBMITTED: 'Đã gửi', RETURNED: 'Bị trả lại', TECHNICAL_VERIFICATION: 'Đang xác minh', VERIFIED: 'Đã xác minh', APPROVED: 'Đã phê duyệt', ARCHIVED: 'Lưu trữ' }

export default async function Qd72CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')

  const c = await dbAny.qd72_survey_cases.findUnique({
    where: { id }, select: { id: true, ma: true, ten: true, trang_thai: true, don_vi_hanh_chinh_id: true },
  })
  if (!c) notFound()
  if (auth.vaiTro === 'XA_PHUONG' && c.don_vi_hanh_chinh_id !== auth.wardId) redirect('/dashboard/qd72')

  const canEdit = coTheSua(auth.vaiTro, c.trang_thai as string)
  const phieuMas = Object.keys(QD72_ENTRY)
  const data = await Promise.all(phieuMas.map(async (ma) => ({ ma, ten: QD72_ENTRY[ma].ten, rows: await listChildRecords(id, ma) })))

  return (
    <div className="p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/qd72" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-1"><ArrowLeft className="w-4 h-4" /> Danh sách hồ sơ</Link>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{c.ten as string}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{(c.ma as string) ?? ''} · Trạng thái: <b>{TT[c.trang_thai as string] ?? c.trang_thai}</b>{!canEdit && ' · (chỉ xem)'}</p>
        </div>
        <Link href={`/dashboard/qd72/ban-do?caseId=${id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <MapIcon className="w-4 h-4" /> Xem trên bản đồ
        </Link>
      </div>

      <Qd72ChildEntry caseId={id} canEdit={canEdit} initial={data} />
    </div>
  )
}
