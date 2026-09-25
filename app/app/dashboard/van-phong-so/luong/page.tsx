import Link from 'next/link'
import { requireOfficeAccess, canViewOfficeSensitive } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { classifySalaryAlert, salaryAlertBadgeClass, type SalaryAlert, type SalaryAlertBucket } from '@/lib/salary-alert'
import { huongLuongNgachBac, tinhBangLuongThang, fmtVND, fmtSo } from '@/lib/luong'
import { demNguoiPhuThuoc } from '@/lib/con-can-bo'
import { Briefcase, ChevronRight, Wallet, ChevronRight as Chev } from 'lucide-react'

const NO_ALERT: SalaryAlert = { bucket: null, daysLeft: null, label: '' }

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

// Thứ tự ưu tiên hiển thị: quá hạn → 30 → 60 → 90 → còn lại
const BUCKET_ORDER: Record<string, number> = { OVERDUE: 0, D30: 1, D60: 2, D90: 3 }

export default async function QuanLyLuongPage() {
  const user = await requireOfficeAccess()
  const canSee = canViewOfficeSensitive(user)

  const soIds = await getSoToChucIds()
  const list = await db.canBo.findMany({
    where: { toChucId: { in: soIds } },
    include: { chucDanh: true, toChuc: { select: { loai: true } }, conCai: true },
  })

  // NLĐ (hợp đồng) hưởng lương khoán cố định → không tính cảnh báo nâng lương; cột
  // "Hệ số" của họ thực chất là LƯƠNG HĐ CỐ ĐỊNH (xem cột riêng bên dưới).
  const rows = list
    .map((cb) => ({
      cb, apDung: huongLuongNgachBac(cb), alert: huongLuongNgachBac(cb) ? classifySalaryAlert(cb.ngayNangLuongKeTiep) : NO_ALERT,
      // Bảng lương tháng tạm tính đầy đủ (PC công vụ, BH theo đối tượng, thuế TNCN có giảm trừ con) — lib/luong.ts
      bl: tinhBangLuongThang({ ...cb, loaiToChuc: cb.toChuc?.loai, soNguoiPhuThuoc: demNguoiPhuThuoc(cb.conCai) }),
    }))
    .sort((a, b) => {
      const oa = a.alert.bucket ? BUCKET_ORDER[a.alert.bucket] : 99
      const ob = b.alert.bucket ? BUCKET_ORDER[b.alert.bucket] : 99
      if (oa !== ob) return oa - ob
      return (a.alert.daysLeft ?? 1e9) - (b.alert.daysLeft ?? 1e9)
    })

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    if (r.alert.bucket) acc[r.alert.bucket] = (acc[r.alert.bucket] ?? 0) + 1
    return acc
  }, {})

  const summary: { key: SalaryAlertBucket; label: string }[] = [
    { key: 'OVERDUE', label: 'Quá hạn' },
    { key: 'D30', label: 'Trong 30 ngày' },
    { key: 'D60', label: 'Trong 60 ngày' },
    { key: 'D90', label: 'Trong 90 ngày' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Quản lý lương</span>
      </nav>

      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Quản lý lương & cảnh báo nâng lương</h1>
      </div>

      {/* Tổng hợp cảnh báo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summary.map((s) => (
          <div key={s.key} className={`rounded-xl border p-3 ${salaryAlertBadgeClass(s.key)}`}>
            <p className="text-xs font-medium">{s.label}</p>
            <p className="text-2xl font-bold">{counts[s.key as string] ?? 0}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 bg-slate-50 border rounded-lg px-3 py-2">
        Cảnh báo dựa trên <b>ngày đến hạn nâng lương lần sau</b> (không phải ngày lên lương). Cần nhập/đồng bộ
        ngày đến hạn (cột W file lương) để có cảnh báo. Hệ thống chỉ nhắc việc — Văn phòng Sở rà soát
        ngạch/bậc/thời gian giữ bậc/đánh giá/kỷ luật và căn cứ pháp lý trước khi trình. Hệ thống không tự quyết định nâng lương.
      </p>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Họ tên</th>
              <th className="px-4 py-2.5 font-semibold">Chức danh</th>
              <th className="px-4 py-2.5 font-semibold text-right">Hệ số</th>
              <th className="px-4 py-2.5 font-semibold text-right">Lương HĐ cố định</th>
              <th className="px-4 py-2.5 font-semibold text-right">Vượt khung</th>
              <th className="px-4 py-2.5 font-semibold text-right" title="Tổng thu nhập tạm tính (gồm PC công vụ 25% với công chức)">Thu nhập</th>
              <th className="px-4 py-2.5 font-semibold text-right" title="BHXH 8% + BHYT 1,5% (+ BHTN 1% trừ công chức) + thuế TNCN">Khấu trừ</th>
              <th className="px-4 py-2.5 font-semibold text-right" title="Số con được tính người phụ thuộc">NPT</th>
              <th className="px-4 py-2.5 font-semibold text-right">Thực lĩnh</th>
              <th className="px-4 py-2.5 font-semibold">Ngày lên lương</th>
              <th className="px-4 py-2.5 font-semibold">Ngày đến hạn KT</th>
              <th className="px-4 py-2.5 font-semibold">Cảnh báo</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ cb, apDung, alert, bl }) => (
              <tr key={cb.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{cb.hoTen}</td>
                <td className="px-4 py-2.5 text-slate-600">{cb.chucDanh?.ten ?? cb.chucVu ?? '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{!canSee ? '•••' : apDung ? fmtSo(cb.heSoLuong) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{!canSee ? '•••' : !apDung && cb.heSoLuong != null ? fmtVND(cb.heSoLuong) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{!canSee ? '•••' : apDung ? (cb.vuotKhung != null && cb.vuotKhung > 0 ? `${cb.vuotKhung.toFixed(0)}%` : '—') : '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-700 tabular-nums">{!canSee ? '•••' : bl.apDung ? fmtVND(bl.tongThuNhap) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-rose-700 tabular-nums">{!canSee ? '•••' : bl.apDung ? fmtVND(bl.tongKhauTru) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{!canSee ? '•••' : bl.apDung ? bl.soNguoiPhuThuoc : '—'}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 tabular-nums">{!canSee ? '•••' : bl.apDung ? fmtVND(bl.thucLinh) : '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{!canSee ? '•••' : apDung ? fmtDate(cb.ngayNangLuong) : '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{!canSee ? '•••' : apDung ? fmtDate(cb.ngayNangLuongKeTiep) : '—'}</td>
                <td className="px-4 py-2.5">
                  {!apDung ? (
                    <span className="text-xs text-slate-400">Lương khoán (HĐ) — không nâng lương</span>
                  ) : alert.bucket ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${salaryAlertBadgeClass(alert.bucket)}`}>
                      {alert.label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{alert.daysLeft === null ? '— chưa có mốc' : 'Chưa đến hạn'}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="text-indigo-600 hover:underline text-sm font-medium inline-flex items-center gap-1">
                    Hồ sơ <Chev className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu cán bộ.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
