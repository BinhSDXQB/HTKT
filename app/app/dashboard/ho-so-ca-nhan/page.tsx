import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  MUC_XEP_LOAI_LABEL,
  LOAI_NGHI_PHEP_LABEL,
  TRANG_THAI_NGHI_PHEP_LABEL,
  trangThaiNghiPhepBadgeClass,
} from '@/lib/office-labels'
import { huongLuongNgachBac, fmtVND, fmtSo } from '@/lib/luong'
import { UserCircle2, Wallet, Award, CalendarDays, TrendingUp, IdCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

export default async function HoSoCaNhanPage() {
  const user = await requireAuth()

  const canBo = await db.canBo.findUnique({
    where: { userId: user.id },
    include: {
      toChuc: { select: { ten: true } },
      chucDanh: { select: { ten: true } },
      rewardRecords: { include: { rewardTitle: true }, orderBy: [{ nam: 'desc' }, { ngayQuyetDinh: 'desc' }] },
      annualEvaluations: { orderBy: [{ nam: 'desc' }] },
      leaveRequests: { orderBy: [{ tuNgay: 'desc' }] },
    },
  })

  if (!canBo) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-5">
          <div className="flex items-center gap-2 text-amber-800 font-semibold">
            <UserCircle2 className="w-5 h-5" />Chưa có hồ sơ cán bộ
          </div>
          <p className="text-sm text-amber-700 mt-1">
            Tài khoản <span className="font-medium">{user.email}</span> chưa được gắn với hồ sơ cán bộ trong hệ thống.
            Vui lòng liên hệ Văn phòng Sở để được bổ sung.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header thông tin cá nhân */}
      <div className="flex items-start gap-2">
        <UserCircle2 className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hồ sơ của tôi</h1>
          <p className="text-sm text-slate-500">Thông tin lương, khen thưởng và nghỉ phép của bản thân.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <div>
            <p className="text-lg font-bold text-slate-900">{canBo.hoTen}</p>
            <p className="text-sm text-slate-500">
              {canBo.chucDanh?.ten ?? canBo.chucVu ?? '—'}
              {(canBo.toChuc?.ten || canBo.phongBan) ? ` · ${canBo.toChuc?.ten ?? canBo.phongBan}` : ''}
            </p>
          </div>
          <div className="text-sm text-slate-600 space-y-0.5 ml-auto">
            <p className="flex items-center gap-1.5"><IdCard className="w-3.5 h-3.5 text-slate-400" />CCCD: <span className="font-mono">{canBo.cccd}</span></p>
            <p>Ngày sinh: {fmtDate(canBo.ngaySinh)}</p>
          </div>
        </div>
      </div>

      {/* Lương & nâng lương */}
      <section className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-slate-50">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <h2 className="font-semibold text-slate-800">Lương & ngày nâng lương</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100">
          {huongLuongNgachBac(canBo) ? (
            <>
              <Stat label="Hệ số lương" value={fmtSo(canBo.heSoLuong)} />
              <Stat label="Phụ cấp (hệ số)" value={fmtSo(canBo.phuCap)} />
              <Stat label="Vượt khung" value={canBo.vuotKhung != null ? `${canBo.vuotKhung}%` : '—'} />
            </>
          ) : (
            <>
              <Stat label="Hình thức lương" value="Khoán theo hợp đồng" />
              <Stat label="Lương khoán (tháng)" value={canBo.heSoLuong != null ? fmtVND(canBo.heSoLuong) : '—'} />
              <Stat label="Phụ cấp (hệ số)" value={fmtSo(canBo.phuCap)} />
            </>
          )}
          <Stat label="Ngày hưởng bậc hiện tại" value={fmtDate(canBo.ngayNangLuong)} />
          <Stat
            label="Đến hạn nâng lương lần sau"
            value={fmtDate(canBo.ngayNangLuongKeTiep)}
            icon={<TrendingUp className="w-3.5 h-3.5 text-amber-500" />}
            highlight={!!canBo.ngayNangLuongKeTiep}
          />
        </div>
        {!canBo.ngayNangLuong && !canBo.ngayNangLuongKeTiep && (
          <p className="text-xs text-slate-500 px-5 py-2.5 border-t bg-slate-50">
            Thông tin nâng lương chưa được cập nhật. Văn phòng Sở sẽ bổ sung khi rà soát.
          </p>
        )}
      </section>

      {/* Khen thưởng & danh hiệu */}
      <section className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-slate-50">
          <Award className="w-4 h-4 text-amber-600" />
          <h2 className="font-semibold text-slate-800">Khen thưởng & danh hiệu</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white text-slate-500 text-left border-b">
            <tr>
              <th className="px-5 py-2 font-semibold w-16">Năm</th>
              <th className="px-3 py-2 font-semibold">Danh hiệu / hình thức</th>
              <th className="px-3 py-2 font-semibold">Cấp</th>
              <th className="px-3 py-2 font-semibold">Số quyết định</th>
              <th className="px-5 py-2 font-semibold">Ngày QĐ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {canBo.rewardRecords.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-2 font-medium text-slate-700">{r.nam}</td>
                <td className="px-3 py-2 text-slate-800">{r.rewardTitle?.ten ?? r.danhHieu ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{r.capKhen ?? r.rewardTitle?.capKhen ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{r.soQuyetDinh ?? '—'}</td>
                <td className="px-5 py-2 text-slate-600">{fmtDate(r.ngayQuyetDinh)}</td>
              </tr>
            ))}
            {canBo.rewardRecords.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">Chưa có khen thưởng nào được ghi nhận.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Xếp loại hằng năm */}
      <section className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-slate-50">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Xếp loại đánh giá hằng năm</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white text-slate-500 text-left border-b">
            <tr>
              <th className="px-5 py-2 font-semibold w-16">Năm</th>
              <th className="px-3 py-2 font-semibold">Mức xếp loại</th>
              <th className="px-3 py-2 font-semibold">CSTĐ</th>
              <th className="px-5 py-2 font-semibold">Số quyết định</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {canBo.annualEvaluations.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-5 py-2 font-medium text-slate-700">{e.nam}</td>
                <td className="px-3 py-2 text-slate-800">{MUC_XEP_LOAI_LABEL[e.mucXepLoai] ?? e.mucXepLoai}</td>
                <td className="px-3 py-2 text-slate-600">{e.laChienSiThiDua ? '✓' : '—'}</td>
                <td className="px-5 py-2 text-slate-600">{e.soQuyetDinh ?? '—'}</td>
              </tr>
            ))}
            {canBo.annualEvaluations.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">Chưa có dữ liệu xếp loại.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Nghỉ phép */}
      <section className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-slate-50">
          <CalendarDays className="w-4 h-4 text-sky-600" />
          <h2 className="font-semibold text-slate-800">Nghỉ phép của tôi</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white text-slate-500 text-left border-b">
            <tr>
              <th className="px-5 py-2 font-semibold">Loại nghỉ</th>
              <th className="px-3 py-2 font-semibold">Thời gian</th>
              <th className="px-3 py-2 font-semibold text-right">Số ngày</th>
              <th className="px-3 py-2 font-semibold">Lý do</th>
              <th className="px-5 py-2 font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {canBo.leaveRequests.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-5 py-2 text-slate-700">{LOAI_NGHI_PHEP_LABEL[l.loaiNghi] ?? l.loaiNghi}</td>
                <td className="px-3 py-2 text-slate-600 text-xs">{fmtDate(l.tuNgay)} → {fmtDate(l.denNgay)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{l.soNgay}</td>
                <td className="px-3 py-2 text-xs text-slate-500 max-w-[220px] truncate">{l.lyDo || '—'}</td>
                <td className="px-5 py-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trangThaiNghiPhepBadgeClass(l.trangThai)}`}>
                    {TRANG_THAI_NGHI_PHEP_LABEL[l.trangThai] ?? l.trangThai}
                  </span>
                </td>
              </tr>
            ))}
            {canBo.leaveRequests.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">Chưa có đơn nghỉ phép nào.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`px-5 py-3 ${highlight ? 'bg-amber-50' : 'bg-white'}`}>
      <p className="text-xs text-slate-500 flex items-center gap-1">{icon}{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  )
}
