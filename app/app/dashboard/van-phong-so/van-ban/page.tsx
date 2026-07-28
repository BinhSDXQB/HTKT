import Link from 'next/link'
import { requireOfficeAccess, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { db } from '@/lib/db'
import { LOAI_VAN_BAN_VPS_LABEL } from '@/lib/office-labels'
import { Briefcase, ChevronRight, FileText, FileDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDateTime(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleString('vi-VN') : '—'
}

export default async function KhoVanBanPage() {
  const user = await requireOfficeAccess()
  const canManage = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_manage')

  if (!canManage) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Bạn không có quyền xem kho văn bản đã sinh.
        </p>
      </div>
    )
  }

  const docs = await db.officeGeneratedDocument.findMany({
    orderBy: { createdAt: 'desc' },
    include: { canBo: { select: { hoTen: true } }, createdBy: { select: { name: true } } },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Kho văn bản đã sinh</span>
      </nav>

      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" />
        <h1 className="text-lg font-bold text-slate-900">Kho văn bản đã sinh</h1>
        <span className="text-sm text-slate-500">({docs.length})</span>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 border rounded-lg px-3 py-6 text-center">
          Chưa có văn bản nào được lưu vết. Bản dự thảo được lưu khi sinh từ trợ lý/chatbot; bản chính thức được lưu khi ban hành QĐ từ hồ sơ nâng lương.
        </p>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Loại</th>
                <th className="text-left font-semibold px-4 py-2.5">Tiêu đề</th>
                <th className="text-left font-semibold px-4 py-2.5">Số VB</th>
                <th className="text-left font-semibold px-4 py-2.5">Người tạo</th>
                <th className="text-left font-semibold px-4 py-2.5">Thời điểm</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {LOAI_VAN_BAN_VPS_LABEL[d.loaiVanBan] ?? d.loaiVanBan}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-800">{d.tieuDe}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.soVanBan ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.createdBy?.name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmtDateTime(d.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={`/api/office/van-ban/${d.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      <FileDown className="w-3.5 h-3.5" />Tải
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
