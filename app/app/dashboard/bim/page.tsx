import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Boxes, Plus, FileBox } from 'lucide-react'

const DISCIPLINE_LABEL: Record<string, string> = {
  KIEN_TRUC: 'Kiến trúc',
  KET_CAU: 'Kết cấu',
  CO_DIEN: 'Cơ điện (MEP)',
  HA_TANG_GIAO_THONG: 'Hạ tầng giao thông',
  CAP_THOAT_NUOC: 'Cấp thoát nước',
  CHIEU_SANG: 'Chiếu sáng',
  TONG_HOP: 'Tổng hợp',
}

const CDE_BADGE: Record<string, { label: string; cls: string }> = {
  SHARED: { label: 'Đang thẩm định', cls: 'bg-amber-100 text-amber-800' },
  PUBLISHED: { label: 'Đã công bố', cls: 'bg-green-100 text-green-800' },
  ARCHIVED: { label: 'Lưu trữ', cls: 'bg-slate-100 text-slate-600' },
}

export const dynamic = 'force-dynamic'

export default async function BimListPage() {
  const user = await requireAuth()
  const isManager = user.role.name === 'admin' || user.role.name === 'manager'

  const models = await db.bimModel.findMany({
    where: {
      deletedAt: null,
      ...(isManager ? {} : {
        viewPerms: {
          some: {
            OR: [
              { userId: user.id },
              { roleId: user.role.id },
              ...(user.toChucId ? [{ toChucId: user.toChucId }] : []),
            ],
          },
        },
      }),
    },
    include: {
      versions: {
        where: { deletedAt: null },
        orderBy: { versionNo: 'desc' },
        take: 1,
        select: { versionNo: true, cdeStatus: true, stage: true, lodChinh: true, ngayTiepNhan: true },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-7 h-7 text-blue-600" />
            Mô hình BIM công trình
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tiếp nhận theo NĐ 175/2024/NĐ-CP — IFC 4.0, ≤500MB/tệp · Lộ trình QĐ 258/QĐ-TTg: từ 2026 bắt buộc với công trình cấp II trở lên
          </p>
        </div>
        {isManager && (
          <Link
            href="/dashboard/bim/tiep-nhan"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Tiếp nhận mô hình
          </Link>
        )}
      </div>

      {models.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-500">
          <FileBox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          Chưa có mô hình BIM nào được tiếp nhận
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Mã mô hình</th>
                <th className="text-left px-4 py-3 font-semibold">Tên công trình</th>
                <th className="text-left px-4 py-3 font-semibold">Bộ môn</th>
                <th className="text-left px-4 py-3 font-semibold">Cấp CT</th>
                <th className="text-left px-4 py-3 font-semibold">Phiên bản</th>
                <th className="text-left px-4 py-3 font-semibold">Trạng thái CDE</th>
                <th className="text-left px-4 py-3 font-semibold">BIM bắt buộc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((m) => {
                const v = m.versions[0]
                const badge = v ? CDE_BADGE[v.cdeStatus] : null
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/bim/${m.id}`} className="font-medium text-blue-700 hover:underline">
                        {m.maMoHinh}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{m.ten}</td>
                    <td className="px-4 py-3">{DISCIPLINE_LABEL[m.discipline] || m.discipline}</td>
                    <td className="px-4 py-3">{m.capCongTrinh?.replace('CAP_', 'Cấp ').replace('DAC_BIET', 'đặc biệt') || '—'}</td>
                    <td className="px-4 py-3">
                      {v ? `V${v.versionNo} (${v.lodChinh.replace('_', ' ')})` : 'Chưa nộp'}
                      {m._count.versions > 1 && <span className="text-xs text-slate-400 ml-1">/{m._count.versions} bản</span>}
                    </td>
                    <td className="px-4 py-3">
                      {badge ? <span className={`px-2 py-1 rounded text-xs font-medium ${badge.cls}`}>{badge.label}</span> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.batBuocBim
                        ? <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Bắt buộc</span>
                        : <span className="text-slate-400 text-xs">Khuyến khích</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
