import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOfficeAccess, canViewOfficeSensitive, isOfficeLeader, canManageCanBo, isLeadership } from '@/lib/auth'
import { DeptLeaderToggle } from '@/components/van-phong-so/dept-leader-toggle'
import { tuoiNghiHuuLabel } from '@/lib/nghi-huu'
import { hasPermission, MODULES } from '@/lib/permissions'
import { logSensitiveView } from '@/app/actions/office'
import { db } from '@/lib/db'
import { classifySalaryAlert, salaryAlertBadgeClass } from '@/lib/salary-alert'
import { classifyContractAlert } from '@/lib/hop-dong-alert'
import { tinhLuongThucLinh, fmtVND, LUONG_CO_SO_CAN_CU } from '@/lib/luong'
import { DOI_TUONG_NHAN_SU_LABEL } from '@/lib/office-labels'
import { SalaryHistoryForm } from '@/components/van-phong-so/salary-history-form'
import { WorkHistoryForm } from '@/components/van-phong-so/work-history-form'
import { RewardRecordForm } from '@/components/van-phong-so/reward-record-form'
import { EvaluationForm } from '@/components/van-phong-so/evaluation-form'
import { DisciplineForm } from '@/components/van-phong-so/discipline-form'
import {
  LOAI_NANG_LUONG_LABEL as LOAI_LABEL,
  MUC_XEP_LOAI_LABEL, mucXepLoaiBadgeClass, HINH_THUC_KY_LUAT_LABEL,
  LOAI_NGHI_PHEP_LABEL, TRANG_THAI_NGHI_PHEP_LABEL, trangThaiNghiPhepBadgeClass,
} from '@/lib/office-labels'
import { Briefcase, ChevronRight, Users, Wallet, History, Award, ClipboardCheck, ShieldAlert, FileDown, CalendarDays, PencilLine, GraduationCap, Flag, IdCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CURRENT_YEAR = new Date().getFullYear()

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

function maskCccd(cccd: string, canSee: boolean): string {
  if (cccd.startsWith('TAM-')) return 'Chưa có (cần bổ sung)'
  if (canSee) return cccd
  if (cccd.length < 4) return '••••'
  return '•'.repeat(cccd.length - 4) + cccd.slice(-4)
}

/** "x năm y tháng" tính từ mốc đến hôm nay (như DATEDIF của biểu QLNS). */
function khoangThoiGian(tu: Date | null | undefined, kemNgay = false): string | null {
  if (!tu) return null
  const from = new Date(tu)
  const now = new Date()
  let years = now.getFullYear() - from.getFullYear()
  let months = now.getMonth() - from.getMonth()
  let days = now.getDate() - from.getDate()
  if (days < 0) { months--; days += 30 }
  if (months < 0) { years--; months += 12 }
  if (years < 0) return null
  return kemNgay ? `${years} năm ${months} tháng ${days} ngày` : `${years} năm ${months} tháng`
}

const TRANG_THAI_LABEL: Record<string, string> = {
  DANG_CONG_TAC: 'Đang công tác', HOP_DONG: 'Hợp đồng', NGHI_HUU: 'Nghỉ hưu',
  CHUYEN_CONG_TAC: 'Chuyển công tác', NGHI_VIEC: 'Nghỉ việc',
}

export default async function HoSoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireOfficeAccess()
  const canSee = canViewOfficeSensitive(user)
  const canRewardDoc = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'reward_manage')
  const canDisciplineDoc = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'discipline_manage')

  const cb = await db.canBo.findUnique({
    where: { id },
    include: {
      chucDanh: true,
      toChuc: true,
      user: { select: { id: true, isDepartmentLeader: true } },
      salaryHistory: { orderBy: { ngayHuong: 'desc' } },
      workHistory: { orderBy: { tuNgay: 'desc' } },
      rewardRecords: { include: { rewardTitle: true, movement: true }, orderBy: [{ nam: 'desc' }, { createdAt: 'desc' }] },
      annualEvaluations: { orderBy: { nam: 'desc' } },
      disciplineRecords: { orderBy: { tuNgay: 'desc' } },
      leaveRequests: { orderBy: { tuNgay: 'desc' }, take: 20 },
    },
  })
  if (!cb) notFound()

  // Danh mục cho form khen thưởng (config — không hard-code)
  const [titles, movements] = await Promise.all([
    db.officeRewardTitle.findMany({ where: { isActive: true }, orderBy: [{ thuTu: 'asc' }, { ten: 'asc' }] }),
    db.officeEmulationMovement.findMany({ where: { isActive: true }, orderBy: [{ nam: 'desc' }, { ten: 'asc' }] }),
  ])
  const titleOpts = titles.map((t) => ({ id: t.id, label: `${t.ten}${t.capKhen ? ` (${t.capKhen})` : ''}` }))
  const movementOpts = movements.map((m) => ({ id: m.id, label: `${m.ten} — ${m.nam}` }))

  // Ghi audit log khi mở hồ sơ có quyền xem dữ liệu nhạy cảm
  if (canSee) await logSensitiveView(cb.id, cb.hoTen)

  // Cảnh báo tính theo NGÀY ĐẾN HẠN nâng lương lần sau (cùng nguồn với trang Lương)
  const alert = classifySalaryAlert(cb.ngayNangLuongKeTiep)
  const contractAlert = classifyContractAlert(cb.ngayKetThucHopDong)
  const luong = tinhLuongThucLinh(cb)
  const canEdit = canManageCanBo(user)
  const canSetLeader = isLeadership(user)

  const infoRows: { label: string; value: string }[] = [
    { label: 'Họ và tên', value: cb.hoTen },
    { label: 'Giới tính', value: cb.gioiTinh === 'NAM' ? 'Nam' : cb.gioiTinh === 'NU' ? 'Nữ' : '—' },
    { label: 'Ngày sinh', value: fmtDate(cb.ngaySinh) },
    { label: 'Tuổi đời', value: cb.ngaySinh ? `${new Date().getFullYear() - new Date(cb.ngaySinh).getFullYear()} tuổi` : '—' },
    { label: 'Số CCCD', value: maskCccd(cb.cccd, canSee) },
    { label: 'Đối tượng', value: cb.doiTuong ? (DOI_TUONG_NHAN_SU_LABEL[cb.doiTuong] ?? cb.doiTuong) : '— (chưa phân loại)' },
    { label: 'Điện thoại', value: cb.soDienThoai ?? '—' },
    { label: 'Email', value: cb.email ?? '—' },
    { label: 'Trạng thái', value: TRANG_THAI_LABEL[cb.trangThai] ?? cb.trangThai },
    { label: 'Quê quán (trước hợp nhất)', value: cb.queQuanTruoc ?? '—' },
    { label: 'Quê quán (sau hợp nhất)', value: cb.queQuanSau ?? '—' },
    { label: 'Nơi ở (trước hợp nhất)', value: cb.noiOTruoc ?? '—' },
    { label: 'Nơi ở (hiện nay)', value: cb.noiOHienNay ?? '—' },
  ]

  const congTacRows: { label: string; value: string }[] = [
    { label: 'Đơn vị', value: cb.toChuc?.ten ?? cb.phongBan ?? '—' },
    { label: 'Chức vụ', value: cb.chucVu ?? cb.chucDanh?.ten ?? '—' },
    { label: 'Chức danh (danh mục)', value: cb.chucDanh?.ten ?? '—' },
    { label: 'Vị trí việc làm', value: cb.viTriViecLam ?? '— (chưa cập nhật)' },
    { label: 'Loại hình BC, HĐ', value: cb.loaiHinh ?? '—' },
    ...(cb.doiTuong === 'NGUOI_LAO_DONG' || cb.loaiHopDong || cb.ngayKetThucHopDong ? [
      { label: 'Loại hợp đồng', value: cb.loaiHopDong ?? '—' },
      { label: 'Hạn hợp đồng', value: fmtDate(cb.ngayKetThucHopDong) + (contractAlert.bucket ? ` · ${contractAlert.label}` : '') },
    ] : []),
    { label: 'Ngày vào BC, HĐ', value: fmtDate(cb.ngayVaoBienChe) },
    { label: 'Bổ nhiệm lần đầu', value: cb.boNhiemLanDau ?? '—' },
    { label: 'Bổ nhiệm gần nhất', value: fmtDate(cb.ngayBoNhiemGanNhat) },
    { label: 'Bổ nhiệm tiếp theo (+5 năm)', value: fmtDate(cb.ngayBoNhiemTiepTheo) },
    { label: `Ngày về hưu (${tuoiNghiHuuLabel(cb.ngaySinh, cb.gioiTinh) ?? 'NĐ 135/2020'})`, value: fmtDate(cb.ngayVeHuu) },
    { label: 'Ghi chú', value: cb.ghiChu ?? '—' },
  ]

  const ngachRows: { label: string; value: string }[] = [
    { label: 'Mã ngạch', value: cb.maNgach ?? '—' },
    { label: 'Ngạch hiện hưởng', value: cb.ngachHienHuong ?? '—' },
    { label: 'Ngày bổ nhiệm vào ngạch', value: fmtDate(cb.ngayBoNhiemNgach) },
    { label: 'Thời gian giữ ngạch', value: khoangThoiGian(cb.ngayBoNhiemNgach) ?? '—' },
    { label: 'Bậc lương', value: canSee ? (cb.bacLuong?.toString() ?? '—') : '•••' },
  ]

  const daoTaoRows: { label: string; value: string }[] = [
    { label: 'Trình độ chuyên môn', value: cb.trinhDoChuyenMon ?? '—' },
    { label: 'Ngành / Chuyên ngành', value: cb.chuyenNganh ?? '—' },
    { label: 'Năm học chuyên môn', value: cb.namTotNghiep ?? '—' },
    { label: 'Hệ đào tạo', value: cb.heDaoTao ?? '—' },
    { label: 'Trình độ QLNN', value: cb.trinhDoQLNN ? `${cb.trinhDoQLNN}${cb.namDaoTaoQLNN ? ` (${cb.namDaoTaoQLNN})` : ''}` : '—' },
    { label: 'Trình độ LLCT', value: cb.trinhDoLLCT ? `${cb.trinhDoLLCT}${cb.namDaoTaoLLCT ? ` (${cb.namDaoTaoLLCT})` : ''}` : '—' },
    { label: 'Ngoại ngữ', value: cb.trinhDoNgoaiNgu ? `${cb.trinhDoNgoaiNgu}${cb.namDaoTaoNgoaiNgu ? ` (${cb.namDaoTaoNgoaiNgu})` : ''}` : '—' },
    { label: 'Tin học', value: cb.trinhDoTinHoc ? `${cb.trinhDoTinHoc}${cb.namDaoTaoTinHoc ? ` (${cb.namDaoTaoTinHoc})` : ''}` : '—' },
    { label: 'Đào tạo Cấp phòng / Cấp Sở', value: [cb.namDaoTaoCapPhong, cb.namDaoTaoCapSo].filter(Boolean).join(' / ') || '—' },
    { label: 'QP-AN', value: cb.qpAn ? `${cb.qpAn}${cb.namDaoTaoQPAN ? ` (${cb.namDaoTaoQPAN})` : ''}` : '—' },
  ]

  const dangRows: { label: string; value: string }[] = [
    { label: 'Số thẻ Đảng viên', value: cb.soTheDang ?? '—' },
    { label: 'Ngày kết nạp Đảng', value: fmtDate(cb.ngayKetNapDang) },
    { label: 'Ngày chính thức', value: fmtDate(cb.ngayVaoDangChinhThuc) },
    { label: 'Tuổi Đảng', value: khoangThoiGian(cb.ngayKetNapDang, true) ?? '—' },
    { label: 'Chi bộ', value: cb.chiBo ?? '—' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/van-phong-so/ho-so" className="hover:text-indigo-700">Hồ sơ cán bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{cb.hoTen}</span>
      </nav>

      {/* Thông tin hồ sơ */}
      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">{cb.hoTen}</h1>
            <span className="text-sm text-slate-500">{cb.chucVu ?? cb.chucDanh?.ten ?? ''} — {cb.toChuc?.ten ?? cb.phongBan ?? ''}</span>
          </div>
          <div className="flex items-center gap-2">
            {alert.bucket && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${salaryAlertBadgeClass(alert.bucket)}`}>
                Nâng lương: {alert.label}
              </span>
            )}
            {canEdit && (
              <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}/sua`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50">
                <PencilLine className="w-4 h-4" />Sửa hồ sơ
              </Link>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {infoRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
              <dt className="text-sm text-slate-500 shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-slate-800 text-right whitespace-pre-line">{r.value}</dd>
            </div>
          ))}
        </dl>
        {!canSee && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Bạn không có quyền xem dữ liệu cá nhân nhạy cảm — số CCCD và thông tin lương được ẩn bớt.
          </p>
        )}
      </section>

      {/* Công tác — biên chế, bổ nhiệm */}
      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <IdCard className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Công tác — biên chế, bổ nhiệm</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {congTacRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
              <dt className="text-sm text-slate-500 shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-slate-800 text-right whitespace-pre-line">{r.value}</dd>
            </div>
          ))}
        </dl>
        {canSetLeader && (
          <DeptLeaderToggle
            canBoId={cb.id}
            initial={cb.user?.isDepartmentLeader ?? false}
            hasUser={!!cb.user}
          />
        )}
      </section>

      {/* Ngạch công chức */}
      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Ngạch công chức</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {ngachRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
              <dt className="text-sm text-slate-500 shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-slate-800 text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Trình độ đào tạo */}
      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Trình độ đào tạo</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {daoTaoRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
              <dt className="text-sm text-slate-500 shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-slate-800 text-right whitespace-pre-line">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Thông tin Đảng */}
      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold text-slate-900">Thông tin Đảng</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {dangRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-slate-100 pb-1.5">
              <dt className="text-sm text-slate-500 shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-slate-800 text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Lương hiện hành + lịch sử */}
      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Lương & lịch sử nâng lương</h2>
          </div>
          {canSee && <SalaryHistoryForm canBoId={cb.id} />}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Hệ số hiện tại" value={canSee ? (cb.heSoLuong?.toString() ?? '—') : '•••'} />
          <Stat label="Phụ cấp" value={canSee ? (cb.phuCap?.toString() ?? '—') : '•••'} />
          <Stat label="% Vượt khung" value={canSee ? (cb.vuotKhung?.toString() ?? '—') : '•••'} />
          <Stat label="Ngày lên lương" value={canSee ? fmtDate(cb.ngayNangLuong) : '•••'} />
        </div>

        {canSee && luong.apDung && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <p className="text-sm text-emerald-900">Lương thực lĩnh (tạm tính)</p>
              <p className="text-xl font-bold text-emerald-700">{fmtVND(luong.tongCong)}/tháng</p>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Lương ngạch bậc {fmtVND(luong.luongNgachBac)}
              {luong.phuCapChucVu > 0 && <> + PC chức vụ {fmtVND(luong.phuCapChucVu)}</>}
              {luong.vuotKhungTien > 0 && <> + vượt khung {fmtVND(luong.vuotKhungTien)}</>}
              {' '}· mức cơ sở {LUONG_CO_SO_CAN_CU}. {luong.ghiChu}
            </p>
          </div>
        )}

        {!canSee ? (
          <p className="text-sm text-slate-400 italic">Lịch sử lương chỉ hiển thị cho người có quyền xem dữ liệu nhạy cảm.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Ngày hưởng</th>
                  <th className="px-3 py-2 font-semibold">Loại</th>
                  <th className="px-3 py-2 font-semibold text-right">Bậc</th>
                  <th className="px-3 py-2 font-semibold text-right">Hệ số</th>
                  <th className="px-3 py-2 font-semibold text-right">PC chức vụ</th>
                  <th className="px-3 py-2 font-semibold">Số QĐ</th>
                  <th className="px-3 py-2 font-semibold">Nâng kế tiếp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cb.salaryHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{fmtDate(s.ngayHuong)}</td>
                    <td className="px-3 py-2 text-slate-600">{LOAI_LABEL[s.loai] ?? s.loai}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{s.bacLuong ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">{s.heSoLuong}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{s.phuCapChucVu ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{s.soQuyetDinh ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{fmtDate(s.ngayNangTiep)}</td>
                  </tr>
                ))}
                {cb.salaryHistory.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400">Chưa có lịch sử lương.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quá trình công tác */}
      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Quá trình công tác</h2>
          </div>
          {canSee && <WorkHistoryForm canBoId={cb.id} />}
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Từ ngày</th>
                <th className="px-3 py-2 font-semibold">Đến ngày</th>
                <th className="px-3 py-2 font-semibold">Đơn vị</th>
                <th className="px-3 py-2 font-semibold">Chức vụ</th>
                <th className="px-3 py-2 font-semibold">Nội dung</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cb.workHistory.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{fmtDate(w.tuNgay)}</td>
                  <td className="px-3 py-2 text-slate-600">{w.denNgay ? fmtDate(w.denNgay) : 'Hiện tại'}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{w.donVi}</td>
                  <td className="px-3 py-2 text-slate-600">{w.chucVu ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{w.noiDung ?? '—'}</td>
                </tr>
              ))}
              {cb.workHistory.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Chưa có quá trình công tác.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Thi đua, khen thưởng */}
      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Thi đua, khen thưởng</h2>
          </div>
          <RewardRecordForm canBoId={cb.id} titles={titleOpts} movements={movementOpts} />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Năm</th>
                <th className="px-3 py-2 font-semibold">Danh hiệu / hình thức</th>
                <th className="px-3 py-2 font-semibold">Cấp khen</th>
                <th className="px-3 py-2 font-semibold">Đợt</th>
                <th className="px-3 py-2 font-semibold">Số QĐ</th>
                {canRewardDoc && <th className="px-3 py-2 font-semibold text-right">QĐ</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {cb.rewardRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{r.nam}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{r.rewardTitle?.ten ?? r.danhHieu ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{r.capKhen ?? r.rewardTitle?.capKhen ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{r.movement?.ten ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{r.soQuyetDinh ?? '—'}</td>
                  {canRewardDoc && (
                    <td className="px-3 py-2 text-right">
                      <a href={`/api/office/khen-thuong/${r.id}/quyet-dinh`} title="Tải Quyết định (.docx)"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline">
                        <FileDown className="w-3.5 h-3.5" />QĐ
                      </a>
                    </td>
                  )}
                </tr>
              ))}
              {cb.rewardRecords.length === 0 && (
                <tr><td colSpan={canRewardDoc ? 6 : 5} className="px-3 py-6 text-center text-slate-400">Chưa có khen thưởng.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Đánh giá, xếp loại hằng năm */}
      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Đánh giá, xếp loại hằng năm</h2>
          </div>
          <EvaluationForm canBoId={cb.id} defaultNam={CURRENT_YEAR} />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Năm</th>
                <th className="px-3 py-2 font-semibold">Mức xếp loại</th>
                <th className="px-3 py-2 font-semibold">CSTĐ cơ sở</th>
                <th className="px-3 py-2 font-semibold">Số QĐ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cb.annualEvaluations.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{e.nam}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${mucXepLoaiBadgeClass(e.mucXepLoai)}`}>
                      {MUC_XEP_LOAI_LABEL[e.mucXepLoai] ?? e.mucXepLoai}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{e.laChienSiThiDua ? 'Có' : '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{e.soQuyetDinh ?? '—'}</td>
                </tr>
              ))}
              {cb.annualEvaluations.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">Chưa có đánh giá năm.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Kỷ luật, kéo dài nâng lương */}
      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">Kỷ luật, kéo dài nâng lương</h2>
          </div>
          <DisciplineForm canBoId={cb.id} />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Hình thức</th>
                <th className="px-3 py-2 font-semibold">Từ ngày</th>
                <th className="px-3 py-2 font-semibold">Đến ngày</th>
                <th className="px-3 py-2 font-semibold text-right">Kéo dài NL (tháng)</th>
                <th className="px-3 py-2 font-semibold">Lý do</th>
                {canDisciplineDoc && <th className="px-3 py-2 font-semibold text-right">QĐ</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {cb.disciplineRecords.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-red-700">{HINH_THUC_KY_LUAT_LABEL[k.hinhThuc] ?? k.hinhThuc}</td>
                  <td className="px-3 py-2 text-slate-700">{fmtDate(k.tuNgay)}</td>
                  <td className="px-3 py-2 text-slate-600">{k.denNgay ? fmtDate(k.denNgay) : '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{k.soThangKeoDaiNangLuong ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{k.lyDo ?? '—'}</td>
                  {canDisciplineDoc && (
                    <td className="px-3 py-2 text-right">
                      <a href={`/api/office/ky-luat/${k.id}/quyet-dinh`} title="Tải Quyết định (.docx)"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline">
                        <FileDown className="w-3.5 h-3.5" />QĐ
                      </a>
                    </td>
                  )}
                </tr>
              ))}
              {cb.disciplineRecords.length === 0 && (
                <tr><td colSpan={canDisciplineDoc ? 6 : 5} className="px-3 py-6 text-center text-slate-400">Không có kỷ luật.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nghỉ phép */}
      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Nghỉ phép</h2>
          </div>
          <Link href="/dashboard/van-phong-so/nghi-phep" className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1">
            Quản lý nghỉ phép <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Loại nghỉ</th>
                <th className="px-3 py-2 font-semibold">Từ ngày</th>
                <th className="px-3 py-2 font-semibold">Đến ngày</th>
                <th className="px-3 py-2 font-semibold text-right">Số ngày</th>
                <th className="px-3 py-2 font-semibold">Lý do</th>
                <th className="px-3 py-2 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cb.leaveRequests.map((lv) => (
                <tr key={lv.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{LOAI_NGHI_PHEP_LABEL[lv.loaiNghi] ?? lv.loaiNghi}</td>
                  <td className="px-3 py-2 text-slate-700">{fmtDate(lv.tuNgay)}</td>
                  <td className="px-3 py-2 text-slate-600">{fmtDate(lv.denNgay)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{lv.soNgay}</td>
                  <td className="px-3 py-2 text-slate-600">{lv.lyDo ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trangThaiNghiPhepBadgeClass(lv.trangThai)}`}>
                      {TRANG_THAI_NGHI_PHEP_LABEL[lv.trangThai]}
                    </span>
                  </td>
                </tr>
              ))}
              {cb.leaveRequests.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Chưa có đơn nghỉ phép.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
