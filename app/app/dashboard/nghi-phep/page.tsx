import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { getLeaveBalance } from '@/lib/office-leave-policy'
import { canActOnStage, STAGE } from '@/lib/office-leave-roles'
import {
  LOAI_NGHI_PHEP_LABEL, TRANG_THAI_NGHI_PHEP_LABEL,
  trangThaiNghiPhepBadgeClass, CAP_DUYET_NGHI_PHEP_LABEL,
} from '@/lib/office-labels'
import { NewLeaveForm } from '@/components/nghi-phep/new-leave-form'
import { LeaveStageActions } from '@/components/nghi-phep/leave-stage-actions'
import { CancelLeaveButton } from '@/components/nghi-phep/cancel-leave-button'
import { EditLeaveDialog } from '@/components/nghi-phep/edit-leave-dialog'
import { DeleteLeaveButton } from '@/components/nghi-phep/delete-leave-button'
import { CalendarDays, Inbox, FileSignature, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

export default async function NghiPhepPage() {
  const user = await requireAuth()
  const soIds = await getSoToChucIds()

  const canBo = await db.canBo.findFirst({
    where: { userId: user.id, toChucId: { in: soIds } },
    select: {
      id: true, hoTen: true, toChucId: true, soDienThoai: true,
      noiOHienNay: true, queQuanSau: true,
      chucDanh: { select: { ten: true } }, toChuc: { select: { ten: true } },
    },
  })

  const nam = new Date().getFullYear()
  const balance = canBo ? await getLeaveBalance(canBo.id, nam) : null

  // Đồng nghiệp cùng phòng (để gợi ý người nhận bàn giao)
  const dongNghiep = canBo?.toChucId
    ? await db.canBo.findMany({
        where: {
          toChucId: canBo.toChucId,
          id: { not: canBo.id },
          trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] },
        },
        orderBy: { hoTen: 'asc' },
        select: { hoTen: true, chucDanh: { select: { ten: true } } },
      })
    : []
  const dongNghiepList = dongNghiep.map((c) => ({ hoTen: c.hoTen, chucVu: c.chucDanh?.ten ?? '' }))

  // Gợi ý "Nơi nghỉ": nơi ở hiện nay + quê quán (bỏ trùng/rỗng)
  const noiNghiGoiY = Array.from(new Set([canBo?.noiOHienNay, canBo?.queQuanSau].filter(Boolean) as string[]))

  // Đơn của tôi
  const myRequests = canBo
    ? await db.officeLeaveRequest.findMany({
        where: { canBoId: canBo.id },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { signatures: true } } },
      })
    : []

  // Đơn đang chờ xử lý — lọc theo quyền ở cấp hiện tại
  const pendingAll = await db.officeLeaveRequest.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { trangThai: { in: Object.keys(STAGE) as any }, canBo: { toChucId: { in: soIds } } },
    orderBy: { createdAt: 'asc' },
    include: {
      canBo: { select: { hoTen: true, toChucId: true, toChuc: { select: { ten: true } } } },
      _count: { select: { signatures: true } },
    },
  })
  const pendingForMe = pendingAll.filter((r) => canActOnStage(user, r.trangThai, r.canBo.toChucId))

  return (
    <div className="p-2 sm:p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-6 h-6 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Nghỉ phép</h1>
      </div>

      {!canBo ? (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-5 text-sm text-amber-800">
          Tài khoản <b>{user.email}</b> chưa được gắn hồ sơ cán bộ thuộc Sở. Liên hệ Văn phòng Sở để bổ sung
          thì mới tạo được đơn nghỉ phép.
        </div>
      ) : (
        <>
          {/* Định mức phép năm */}
          {balance && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-white p-4 text-center">
                <p className="text-xs text-slate-500">Định mức phép năm {nam}</p>
                <p className="text-2xl font-bold text-slate-900">{balance.dinhMuc}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 text-center">
                <p className="text-xs text-slate-500">Đã nghỉ</p>
                <p className="text-2xl font-bold text-amber-600">{balance.daNghi}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 text-center">
                <p className="text-xs text-slate-500">Còn lại</p>
                <p className="text-2xl font-bold text-emerald-600">{balance.conLai}</p>
              </div>
            </div>
          )}

          <NewLeaveForm
            canBo={{ hoTen: canBo.hoTen, chucVu: canBo.chucDanh?.ten ?? '', donVi: canBo.toChuc?.ten ?? '' }}
            conLai={balance?.conLai ?? 0}
            dinhMuc={balance?.dinhMuc ?? 0}
            soThang={balance?.soThang ?? 0}
            daNghi={balance?.daNghi ?? 0}
            dongNghiep={dongNghiepList}
            soDienThoai={canBo.soDienThoai ?? ''}
            noiNghiGoiY={noiNghiGoiY}
          />
        </>
      )}

      {/* Cần tôi xử lý */}
      {pendingForMe.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <Inbox className="w-4.5 h-4.5 text-orange-600" /> Cần tôi xử lý ({pendingForMe.length})
          </h2>
          <div className="space-y-3">
            {pendingForMe.map((r) => (
              <div key={r.id} className="rounded-xl border bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{r.canBo.hoTen}
                      <span className="text-xs text-slate-500 font-normal"> — {r.canBo.toChuc?.ten ?? '—'}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {LOAI_NGHI_PHEP_LABEL[r.loaiNghi]} · {fmtDate(r.tuNgay)} → {fmtDate(r.denNgay)} · {r.soNgay} ngày
                      {r.deNghiUngLuong && <span className="ml-2 text-violet-700 font-medium">· đề nghị ứng lương</span>}
                    </p>
                    {r.lyDo && <p className="text-xs text-slate-500 mt-0.5">Lý do: {r.lyDo}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trangThaiNghiPhepBadgeClass(r.trangThai)}`}>
                    {TRANG_THAI_NGHI_PHEP_LABEL[r.trangThai]}
                  </span>
                </div>
                <LeaveStageActions
                  id={r.id}
                  capCode={STAGE[r.trangThai].capCode}
                  soChuKyHienCo={r._count.signatures}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Đơn của tôi */}
      {canBo && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <FileSignature className="w-4.5 h-4.5 text-indigo-600" /> Đơn của tôi ({myRequests.length})
          </h2>
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Loại</th>
                  <th className="px-3 py-2 font-semibold">Thời gian</th>
                  <th className="px-3 py-2 font-semibold text-right">Ngày</th>
                  <th className="px-3 py-2 font-semibold">Trạng thái</th>
                  <th className="px-3 py-2 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{LOAI_NGHI_PHEP_LABEL[r.loaiNghi]}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(r.tuNgay)} → {fmtDate(r.denNgay)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{r.soNgay}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trangThaiNghiPhepBadgeClass(r.trangThai)}`}>
                        {TRANG_THAI_NGHI_PHEP_LABEL[r.trangThai]}
                      </span>
                      {r.trangThai === 'TU_CHOI' && r.tuChoiCap && (
                        <span className="ml-1 text-[11px] text-red-600">({CAP_DUYET_NGHI_PHEP_LABEL[r.tuChoiCap]})</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-end">
                        <a href={`/api/nghi-phep/${r.id}/tai-lieu`} target="_blank" rel="noopener"
                          className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline">
                          <Download className="w-3.5 h-3.5" />PDF
                        </a>
                        {r._count.signatures > 0 && (
                          <a href={`/api/nghi-phep/${r.id}/ket-qua`}
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                            <FileSignature className="w-3.5 h-3.5" />Bản ký
                          </a>
                        )}
                        <EditLeaveDialog
                          leave={{
                            id: r.id, loaiNghi: r.loaiNghi,
                            tuNgay: r.tuNgay, denNgay: r.denNgay, soNgay: r.soNgay,
                            lyDo: r.lyDo, nguoiBanGiao: r.nguoiBanGiao, noiNghi: r.noiNghi,
                            dienThoaiLienHe: r.dienThoaiLienHe, deNghiUngLuong: r.deNghiUngLuong,
                            daKy: r._count.signatures > 0,
                          }}
                          conLai={balance?.conLai ?? 0}
                          dongNghiep={dongNghiepList}
                          noiNghiGoiY={noiNghiGoiY}
                        />
                        {(r.trangThai in STAGE) && r._count.signatures === 0 && <CancelLeaveButton id={r.id} />}
                        {r._count.signatures === 0 && <DeleteLeaveButton id={r.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
                {myRequests.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Chưa có đơn nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
