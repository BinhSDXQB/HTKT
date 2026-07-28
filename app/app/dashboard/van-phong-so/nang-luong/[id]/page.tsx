import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOfficeAccess, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { db } from '@/lib/db'
import { SalaryCaseWorkflow } from '@/components/van-phong-so/salary-case-workflow'
import {
  TRANG_THAI_RA_SOAT_LABEL, trangThaiRaSoatBadgeClass, KET_LUAN_RA_SOAT_LABEL, LOAI_NANG_LUONG_LABEL,
} from '@/lib/office-labels'
import { Briefcase, ChevronRight, ScrollText, FileDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}
function toInput(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : ''
}

export default async function NangLuongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireOfficeAccess()
  const canReview = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_review')
  const canApprove = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_approve_department')
  const canManage = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_manage')

  const c = await db.officeSalaryReviewCase.findUnique({
    where: { id },
    include: {
      canBo: { include: { chucDanh: true } },
      nguoiRaSoat: { select: { name: true } },
      nguoiDuyet: { select: { name: true } },
    },
  })
  if (!c) notFound()

  const rows: { label: string; value: string }[] = [
    { label: 'Cán bộ', value: c.canBo.hoTen },
    { label: 'Chức danh', value: c.canBo.chucDanh?.ten ?? c.canBo.chucVu ?? '—' },
    { label: 'Loại nâng lương', value: LOAI_NANG_LUONG_LABEL[c.loai] ?? c.loai },
    { label: 'Năm rà soát', value: String(c.namRaSoat) },
    { label: 'Đợt', value: c.dotRaSoat ?? '—' },
    { label: 'Mốc đến hạn', value: fmtDate(c.ngayDenHan) },
    { label: 'Hệ số hiện tại', value: c.heSoHienTai?.toString() ?? '—' },
    { label: 'Hệ số đề xuất', value: c.heSoDeXuat?.toString() ?? '—' },
    { label: 'Kết luận rà soát', value: c.ketLuanRaSoat ? KET_LUAN_RA_SOAT_LABEL[c.ketLuanRaSoat] : '—' },
    { label: 'Căn cứ pháp lý', value: c.canCuPhapLy ?? '—' },
    { label: 'Người rà soát', value: c.nguoiRaSoat?.name ?? '—' },
    { label: 'Người duyệt', value: c.nguoiDuyet?.name ?? '—' },
    { label: 'Số QĐ', value: c.soQuyetDinh ?? '—' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/van-phong-so/nang-luong" className="hover:text-indigo-700">Nâng lương</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{c.canBo.hoTen}</span>
      </nav>

      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">Hồ sơ nâng lương — {c.canBo.hoTen}</h1>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (c.trangThai === 'DA_DUYET' || c.trangThai === 'DA_BAN_HANH') && (
              <a
                href={`/api/office/nang-luong/${c.id}/quyet-dinh`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                <FileDown className="w-3.5 h-3.5" />Tải QĐ (.docx)
              </a>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${trangThaiRaSoatBadgeClass(c.trangThai)}`}>
              {TRANG_THAI_RA_SOAT_LABEL[c.trangThai] ?? c.trangThai}
            </span>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
              <dt className="text-sm text-slate-500">{r.label}</dt>
              <dd className="text-sm font-medium text-slate-800 text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
        {c.noiDungRaSoat && (
          <div className="mt-3 text-sm text-slate-700 bg-slate-50 border rounded-lg px-3 py-2 whitespace-pre-wrap">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Nội dung rà soát</span>
            {c.noiDungRaSoat}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Xử lý quy trình</h2>
        <SalaryCaseWorkflow
          c={{
            id: c.id,
            trangThai: c.trangThai,
            ketLuanRaSoat: c.ketLuanRaSoat,
            noiDungRaSoat: c.noiDungRaSoat,
            canCuPhapLy: c.canCuPhapLy,
            heSoDeXuat: c.heSoDeXuat?.toString() ?? c.heSoHienTai?.toString() ?? '',
            bacDeXuat: c.bacDeXuat?.toString() ?? '',
            ngayHuongMoi: toInput(c.ngayHuongMoi),
            soQuyetDinh: c.soQuyetDinh,
          }}
          canReview={canReview}
          canApprove={canApprove}
          canManage={canManage}
        />
        {c.trangThai === 'DA_BAN_HANH' && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Hồ sơ đã ban hành QĐ {c.soQuyetDinh}. Mốc lương mới đã ghi vào{' '}
            <Link href={`/dashboard/van-phong-so/ho-so/${c.canBoId}`} className="underline font-medium">hồ sơ cán bộ</Link>.
          </p>
        )}
        {c.trangThai === 'TU_CHOI' && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Hồ sơ không được duyệt / đã dừng.</p>
        )}
      </section>
    </div>
  )
}
