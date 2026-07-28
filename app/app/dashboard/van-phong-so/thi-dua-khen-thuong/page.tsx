import Link from 'next/link'
import { requireOfficeAccess } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { Briefcase, ChevronRight, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

export default async function ThiDuaKhenThuongPage() {
  await requireOfficeAccess()
  const soIds = await getSoToChucIds()

  const records = await db.officeRewardRecord.findMany({
    where: { canBo: { toChucId: { in: soIds } } },
    include: { canBo: true, rewardTitle: true, movement: true },
    orderBy: [{ nam: 'desc' }, { createdAt: 'desc' }],
  })

  const collectiveRecords = await db.officeCollectiveRewardRecord.findMany({
    orderBy: [{ nam: 'desc' }, { tenTapThe: 'asc' }],
  })

  // Trạng thái "đơn vị còn tồn tại" suy ra ĐỘNG từ cây tổ chức:
  // bản ghi còn tồn tại ⇔ có toChucId trỏ tới một đơn vị đang có trong to_chuc.
  // Đổi/đặt lại cây tổ chức ở một nơi → mọi bản ghi tự cập nhật, không sửa cờ tay.
  const toChucRows = await db.toChuc.findMany({ select: { id: true, ten: true } })
  const toChucNameById = new Map(toChucRows.map((t) => [t.id, t.ten]))

  const movements = await db.officeEmulationMovement.findMany({
    where: { isActive: true },
    orderBy: [{ nam: 'desc' }, { ten: 'asc' }],
  })

  // Tổng hợp theo năm
  const byYear = records.reduce<Record<number, number>>((acc, r) => {
    acc[r.nam] = (acc[r.nam] ?? 0) + 1
    return acc
  }, {})
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Thi đua, khen thưởng</span>
      </nav>

      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Thi đua, khen thưởng</h1>
        <span className="ml-2 text-sm text-slate-500">({records.length} lượt khen thưởng)</span>
      </div>

      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <span key={y} className="text-xs font-medium px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
              {y}: {byYear[y]} lượt
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 bg-slate-50 border rounded-lg px-3 py-2">
        Thêm/sửa khen thưởng thực hiện trong từng hồ sơ cán bộ. Hệ thống chỉ tổng hợp, theo dõi — không tự quyết định danh hiệu.
        Văn phòng Sở rà soát thành tích, minh chứng, căn cứ pháp lý trước khi trình Hội đồng.
      </p>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Năm</th>
              <th className="px-4 py-2.5 font-semibold">Cán bộ</th>
              <th className="px-4 py-2.5 font-semibold">Danh hiệu / hình thức</th>
              <th className="px-4 py-2.5 font-semibold">Cấp khen</th>
              <th className="px-4 py-2.5 font-semibold">Đợt</th>
              <th className="px-4 py-2.5 font-semibold">Số QĐ</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{r.nam}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">{r.canBo.hoTen}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.rewardTitle?.ten ?? r.danhHieu ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.capKhen ?? r.rewardTitle?.capKhen ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.movement?.ten ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.soQuyetDinh ?? '—'} {r.ngayQuyetDinh ? `(${fmtDate(r.ngayQuyetDinh)})` : ''}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/dashboard/van-phong-so/ho-so/${r.canBoId}`} className="text-indigo-600 hover:underline text-sm font-medium inline-flex items-center gap-1">
                    Hồ sơ <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu khen thưởng. Thêm trong hồ sơ từng cán bộ.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Khen thưởng tập thể (đơn vị) */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-2">
          Khen thưởng tập thể <span className="font-normal text-slate-500">({collectiveRecords.length} lượt)</span>
        </h2>
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Năm</th>
                <th className="px-4 py-2.5 font-semibold">Tập thể</th>
                <th className="px-4 py-2.5 font-semibold">Danh hiệu / hình thức</th>
                <th className="px-4 py-2.5 font-semibold">Cấp khen</th>
                <th className="px-4 py-2.5 font-semibold">Số QĐ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {collectiveRecords.map((r) => {
                const tenHienTai = r.toChucId ? toChucNameById.get(r.toChucId) : undefined
                const conTonTai = !!tenHienTai
                const daDoiTen = !!tenHienTai && tenHienTai !== r.tenTapThe
                return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">{r.nam}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {r.tenTapThe}
                    {!conTonTai && (
                      <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        đơn vị không còn
                      </span>
                    )}
                    {daDoiTen && (
                      <span className="ml-2 text-[11px] text-slate-400" title="Tên hiện tại trong cơ cấu tổ chức">
                        (nay: {tenHienTai})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{r.danhHieu ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.capKhen ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.soQuyetDinh ?? '—'} {r.ngayQuyetDinh ? `(${fmtDate(r.ngayQuyetDinh)})` : ''}</td>
                </tr>
                )
              })}
              {collectiveRecords.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Chưa có khen thưởng tập thể.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Đợt / phong trào thi đua đang hoạt động */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-2">Đợt / phong trào thi đua</h2>
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Tên đợt</th>
                <th className="px-4 py-2.5 font-semibold">Năm</th>
                <th className="px-4 py-2.5 font-semibold">Cấp phát động</th>
                <th className="px-4 py-2.5 font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{m.ten}</td>
                  <td className="px-4 py-2.5 text-slate-700">{m.nam}</td>
                  <td className="px-4 py-2.5 text-slate-600">{m.capPhatDong ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{fmtDate(m.tuNgay)} – {fmtDate(m.denNgay)}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Chưa có đợt thi đua.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
