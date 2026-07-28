import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, BarChart3, FileSpreadsheet, CheckCircle2, Edit3, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { WardReportEditor } from '@/components/bao-cao/ward-report-editor'
import { updateWardReportStatusAction } from '@/app/actions/ward-reports'
import { DeleteWardReportButton } from '@/components/bao-cao/delete-ward-report-button'
import { getWardReportPerms, canEditReport } from '@/lib/ward-report-perms'

const CATEGORY_LABEL: Record<string, string> = {
  DUONG: 'Đường giao thông',
  DIEN_CHIEU_SANG: 'Điện chiếu sáng',
  CAY_XANH: 'Cây xanh',
  CONG_VIEN: 'Công viên',
  DIEN_TONG_HOP: 'Điện tổng hợp',
  THOAT_NUOC_BC: 'Thoát nước',
  CAP_NUOC_BC: 'Cấp nước',
  KHAC: 'Bãi đỗ xe',
}

export default async function WardReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await params

  const report = await db.wardReport.findUnique({
    where: { id },
    include: {
      ward: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  })
  if (!report) notFound()

  const perms    = await getWardReportPerms(user.id, user.role.name, user.wardId)
  const canEdit  = canEditReport(perms, report.wardId)

  const columns = report.columns as string[]
  const rows    = report.rows    as (string | number | null)[][]

  const toggleStatus = updateWardReportStatusAction.bind(
    null, id,
    report.status === 'CHINH_THUC' ? 'NHAP' : 'CHINH_THUC'
  )

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/bao-cao" className="hover:text-blue-700 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />Báo cáo
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/bao-cao/du-lieu-phuong-xa" className="hover:text-blue-700">
          Dữ liệu phường/xã
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium truncate max-w-xs">
          {report.ward?.name ?? 'Chưa xác định'} — {CATEGORY_LABEL[report.category]}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-700" />
            {CATEGORY_LABEL[report.category]}
            <Badge className={report.status === 'CHINH_THUC' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
              {report.status === 'CHINH_THUC' ? 'Chính thức' : 'Bản nháp'}
            </Badge>
          </h1>
          <p className="text-sm text-slate-500">
            {report.ward?.name ?? 'Chưa xác định phường/xã'}
            {' · '}Năm {report.year}{report.month ? ` · Tháng ${report.month}` : ''}
            {report.sheetName ? ` · Sheet: ${report.sheetName}` : ''}
            {report.sourceFile ? ` · File: ${report.sourceFile}` : ''}
          </p>
          <p className="text-xs text-slate-400">
            {rows.length} hàng · {columns.length} cột · Tạo bởi {report.createdBy.name}
            {' · '}{new Date(report.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <a href={`/api/export/ward-report/${report.id}`}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-green-600 text-green-700 hover:bg-green-50 transition-colors"
            title="Tải dữ liệu về file Excel">
            <Download className="w-3.5 h-3.5" />
            Tải về Excel
          </a>
          {canEdit && (
            <form action={toggleStatus}>
              <button type="submit"
                className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-colors
                  ${report.status === 'CHINH_THUC'
                    ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    : 'border-green-500 text-green-700 hover:bg-green-50'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {report.status === 'CHINH_THUC' ? 'Chuyển về Nháp' : 'Xác nhận Chính thức'}
              </button>
            </form>
          )}
          {canEdit && <DeleteWardReportButton id={report.id} />}
          {!canEdit && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 border rounded-lg px-3 py-1.5">
              Chỉ xem
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-700 text-sm">
            {!canEdit || report.status === 'CHINH_THUC' ? 'Xem dữ liệu' : 'Chỉnh sửa dữ liệu'}
          </h2>
          {canEdit && report.status !== 'CHINH_THUC' && (
            <span className="text-xs text-slate-400">— Click vào ô để sửa, click tên cột để đổi tên</span>
          )}
        </div>

        <WardReportEditor
          id={report.id}
          initialColumns={columns}
          initialRows={rows}
          initialNotes={report.notes}
          status={canEdit ? report.status : 'CHINH_THUC'}
        />
      </div>

      {report.notes && report.status === 'CHINH_THUC' && (
        <div className="bg-slate-50 rounded-xl border p-4 text-sm text-slate-600">
          <span className="font-medium">Ghi chú:</span> {report.notes}
        </div>
      )}
    </div>
  )
}
