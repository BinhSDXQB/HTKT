import Link from 'next/link'
import type { ElementType } from 'react'
import { requireOfficeAccess, canViewOfficeSensitive, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { checkHoSoCompleteness } from '@/lib/ho-so-completeness'
import { missingRequiredChoCanhBao } from '@/lib/ho-so-alert'
import { checkSalaryConsistency } from '@/lib/bang-luong'
import { classifyRetireAlert, retireAlertBadgeClass } from '@/lib/nghi-huu-alert'
import { classifySalaryAlert, salaryAlertBadgeClass } from '@/lib/salary-alert'
import { huongLuongNgachBac } from '@/lib/luong'
import { classifyContractAlert } from '@/lib/hop-dong-alert'
import { DOI_TUONG_NHAN_SU_LABEL, doiTuongBadgeClass } from '@/lib/office-labels'
import { CO_SO_PHAP_LY } from '@/lib/data/co-so-phap-ly-nhan-su'
import { thoiDiemNghiHuu } from '@/lib/nghi-huu'
import { GuiCanhBaoTelegramButton } from '@/components/van-phong-so/gui-canh-bao-telegram-button'
import {
  Briefcase, ChevronRight, TriangleAlert, FileWarning, Wallet, CalendarClock,
  FileDown, FileText, ClipboardList, BellRing, FileClock, Building2, Scale,
  IdCard, UserX,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

export default async function CanhBaoPage() {
  const user = await requireOfficeAccess()
  const canSensitive = canViewOfficeSensitive(user)
  const canManageDoc = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_manage')

  const soIds = await getSoToChucIds()
  const list = await db.canBo.findMany({
    where: { toChucId: { in: soIds }, trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } },
    include: { chucDanh: { select: { ten: true } }, toChuc: { select: { ten: true } } },
    orderBy: [{ toChuc: { thuTu: 'asc' } }, { hoTen: 'asc' }],
  })

  // ── Tổng hợp 4 nhóm cảnh báo ──
  const thieuHoSo = list
    .map((cb) => ({ cb, kq: checkHoSoCompleteness(cb) }))
    .filter((x) => x.kq.missingRequired.length > 0)

  // Số người đưa vào tin Telegram "liên hệ bổ sung" = thiếu giấy tờ cá nhân thật
  // (đã loại Vị trí việc làm — VTVL do quản lý gán, theo dõi ở mục riêng bên dưới).
  const thieuChoTelegram = list.filter((cb) => missingRequiredChoCanhBao(cb).length > 0).length

  // Công chức/viên chức chưa được gán vị trí việc làm (NĐ 62/2020, 106/2020)
  const chuaVTVL = list.filter(
    (cb) => (cb.doiTuong === 'CONG_CHUC' || cb.doiTuong === 'VIEN_CHUC') && !cb.viTriViecLam?.trim(),
  )

  const saiLuong = canSensitive
    ? list.map((cb) => ({ cb, kq: checkSalaryConsistency(cb) }))
        .filter((x) => x.kq.status === 'MISMATCH' || x.kq.status === 'BAC_OUT_OF_RANGE')
    : []

  // Người lao động (hợp đồng) KHÔNG nghỉ hưu theo tuổi (NĐ 135/2020) — chấm dứt/gia
  // hạn theo hợp đồng (mục "Hết hạn hợp đồng" bên dưới). Loại khỏi cảnh báo nghỉ hưu.
  const nghiHuu = list
    .filter((cb) => cb.doiTuong !== 'NGUOI_LAO_DONG')
    .map((cb) => {
      const td = thoiDiemNghiHuu(cb)
      return { cb, td, alert: classifyRetireAlert(td.ngay, new Date(), cb.doiTuong) }
    })
    .filter((x) => x.alert.bucket !== null)
    .sort((a, b) => (a.alert.daysLeft ?? 0) - (b.alert.daysLeft ?? 0))

  // Chỉ nhắc nâng lương cho người hưởng lương ngạch bậc (CC/VC). NLĐ hợp đồng hưởng
  // lương khoán → không có lịch nâng lương định kỳ, bỏ qua.
  const napLuong = list
    .filter((cb) => huongLuongNgachBac(cb))
    .map((cb) => ({ cb, alert: classifySalaryAlert(cb.ngayNangLuongKeTiep) }))
    .filter((x) => x.alert.bucket !== null)
    .sort((a, b) => (a.alert.daysLeft ?? 0) - (b.alert.daysLeft ?? 0))

  const hetHanHD = list
    .map((cb) => ({ cb, alert: classifyContractAlert(cb.ngayKetThucHopDong) }))
    .filter((x) => x.alert.bucket !== null)
    .sort((a, b) => (a.alert.daysLeft ?? 0) - (b.alert.daysLeft ?? 0))

  // CCCD & quyền truy cập chưa đầy đủ (rà soát 19/6/2026):
  //  - CCCD chưa hợp lệ: số tạm (TAM-) hoặc không đủ 12 chữ số → cần bổ sung/sửa.
  //  - Chưa có tài khoản đăng nhập (đăng nhập = CCCD) → cán bộ chưa truy cập được hệ thống.
  const cccdChuaHopLe = list
    .map((cb) => ({
      cb,
      lyDo: cb.cccd.startsWith('TAM-') ? 'Chưa có số CCCD (đang dùng mã tạm)'
            : !/^\d{12}$/.test(cb.cccd) ? 'CCCD không đủ 12 chữ số (đang dùng CMND cũ)'
            : '',
    }))
    .filter((x) => x.lyDo !== '')
  const chuaCoTaiKhoan = list.filter((cb) => !cb.userId)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Cảnh báo &amp; việc cần làm</span>
      </nav>

      <div className="flex items-center gap-2">
        <BellRing className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Cảnh báo &amp; việc cần làm</h1>
        <span className="text-sm text-slate-500">— {list.length} cán bộ đang công tác</span>
      </div>

      {/* Stat tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Hồ sơ thiếu mục bắt buộc" value={thieuHoSo.length} tone={thieuHoSo.length ? 'red' : 'ok'} href="#thieu-ho-so" />
        <StatCard label="Chưa cập nhật vị trí việc làm" value={chuaVTVL.length} tone={chuaVTVL.length ? 'red' : 'ok'} href="#vtvl" />
        <StatCard label="Sai khác bậc ↔ hệ số lương" value={canSensitive ? saiLuong.length : '•••'} tone={saiLuong.length ? 'red' : 'ok'} href="#sai-luong" />
        <StatCard label="Hết hạn hợp đồng" value={hetHanHD.length} tone={hetHanHD.length ? 'red' : 'ok'} href="#het-han-hd" />
        <StatCard label="Cảnh báo nghỉ hưu" value={nghiHuu.length} tone={nghiHuu.length ? 'amber' : 'ok'} href="#nghi-huu" />
        <StatCard label="Đến hạn nâng lương" value={napLuong.length} tone={napLuong.length ? 'amber' : 'ok'} href="#nang-luong" />
        <StatCard label="Cán bộ chưa có tài khoản" value={chuaCoTaiKhoan.length} tone={chuaCoTaiKhoan.length ? 'red' : 'ok'} href="#chua-tk" />
        <StatCard label="CCCD chưa hợp lệ" value={cccdChuaHopLe.length} tone={cccdChuaHopLe.length ? 'red' : 'ok'} href="#cccd" />
      </div>

      {/* 1. Hồ sơ chưa đầy đủ */}
      <section id="thieu-ho-so" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <SectionHead icon={FileWarning} color="text-red-600" title="Thành phần hồ sơ chưa đầy đủ" count={thieuHoSo.length}
            desc="Liệt kê từng mục bắt buộc còn trống theo biểu QLNS 53 cột." />
          {canManageDoc && <GuiCanhBaoTelegramButton count={thieuChoTelegram} />}
        </div>
        {thieuHoSo.length === 0 ? (
          <Empty text="Tất cả hồ sơ đã đủ các mục bắt buộc." />
        ) : (
          <div className="space-y-2">
            {thieuHoSo.map(({ cb, kq }) => (
              <div key={cb.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                    <span className="text-xs text-slate-500">{cb.chucDanh?.ten ?? cb.chucVu ?? ''} · {cb.toChuc?.ten ?? '—'}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      Thiếu {kq.missingRequired.length} mục · đủ {kq.percent}%
                    </span>
                  </div>
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}/sua`} className="text-xs font-semibold text-indigo-700 hover:underline">Bổ sung →</Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {kq.missingRequired.map((m) => (
                    <span key={m.field} className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{m.label}</span>
                  ))}
                  {kq.missingRecommended.length > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100" title={kq.missingRecommended.map((m) => m.label).join(', ')}>
                      +{kq.missingRecommended.length} mục khuyến nghị
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Chưa cập nhật vị trí việc làm */}
      <section id="vtvl" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={Building2} color="text-violet-600" title="Chưa cập nhật vị trí việc làm" count={chuaVTVL.length}
          desc="Người quản lý phải gán vị trí việc làm cho từng công chức/viên chức — NĐ 62/2020, NĐ 106/2020, Luật CBCC 2025 (hiệu lực 01/7/2025)." />
        {chuaVTVL.length === 0 ? (
          <Empty text="Tất cả công chức/viên chức đã có vị trí việc làm." />
        ) : (
          <div className="space-y-1.5">
            {chuaVTVL.map((cb) => (
              <div key={cb.id} className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                  {cb.doiTuong && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${doiTuongBadgeClass(cb.doiTuong)}`}>{DOI_TUONG_NHAN_SU_LABEL[cb.doiTuong]}</span>}
                  <span className="text-xs text-slate-500">{cb.chucDanh?.ten ?? cb.chucVu ?? ''} · {cb.toChuc?.ten ?? '—'}</span>
                </div>
                <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}/sua`} className="text-xs font-semibold text-indigo-700 hover:underline">Gán VTVL →</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Sai khác bậc ↔ hệ số lương */}
      <section id="sai-luong" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={Wallet} color="text-rose-600" title="Sai khác bậc lương ↔ hệ số lương" count={saiLuong.length}
          desc="Đối chiếu với bảng lương Nghị định 204/2004/NĐ-CP theo ngạch." />
        {!canSensitive ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Cần quyền xem dữ liệu nhạy cảm để đối chiếu lương.
          </p>
        ) : saiLuong.length === 0 ? (
          <Empty text="Không phát hiện sai khác giữa bậc và hệ số lương." />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left text-xs">
                <tr>
                  <th className="px-3 py-2 font-semibold">Cán bộ</th>
                  <th className="px-3 py-2 font-semibold">Ngạch</th>
                  <th className="px-3 py-2 font-semibold text-center">Bậc</th>
                  <th className="px-3 py-2 font-semibold text-center">Hệ số HS</th>
                  <th className="px-3 py-2 font-semibold">Cảnh báo</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {saiLuong.map(({ cb, kq }) => (
                  <tr key={cb.id} className="hover:bg-slate-50 align-top">
                    <td className="px-3 py-2 font-medium text-slate-900">{cb.hoTen}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{cb.ngachHienHuong ?? cb.maNgach ?? '—'}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{cb.bacLuong ?? '—'}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{cb.heSoLuong ?? '—'}</td>
                    <td className="px-3 py-2 text-rose-700 text-xs">
                      {'message' in kq ? kq.message : ''}
                      {kq.status === 'MISMATCH' && (
                        <span className="block text-emerald-700 mt-0.5">Hệ số chuẩn: {kq.heSoChuan.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}/sua`} className="text-xs font-semibold text-indigo-700 hover:underline">Sửa →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. Hết hạn hợp đồng lao động */}
      <section id="het-han-hd" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={FileClock} color="text-rose-600" title="Hết hạn hợp đồng lao động" count={hetHanHD.length}
          desc="Người lao động — nhắc ký HĐ mới trước khi hết hạn (BLLĐ 2019, NĐ 111/2022)." />
        {hetHanHD.length === 0 ? (
          <Empty text="Không có hợp đồng sắp/đã hết hạn (trong 90 ngày)." />
        ) : (
          <div className="space-y-1.5">
            {hetHanHD.map(({ cb, alert }) => (
              <div key={cb.id} className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                  {cb.doiTuong && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${doiTuongBadgeClass(cb.doiTuong)}`}>{DOI_TUONG_NHAN_SU_LABEL[cb.doiTuong]}</span>}
                  <span className="text-xs text-slate-500">{cb.toChuc?.ten ?? '—'}</span>
                  {cb.loaiHopDong && <span className="text-xs text-slate-500">· {cb.loaiHopDong}</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${salaryAlertBadgeClass(alert.bucket)}`}>{alert.label}</span>
                  <span className="text-xs text-slate-500">Hạn: {fmtDate(cb.ngayKetThucHopDong)}</span>
                </div>
                <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}/sua`} className="text-xs font-semibold text-indigo-700 hover:underline">Cập nhật HĐ →</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Cảnh báo nghỉ hưu */}
      <section id="nghi-huu" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={CalendarClock} color="text-amber-600" title="Cảnh báo nghỉ hưu" count={nghiHuu.length}
          desc="Trước 6 tháng: Thông báo + bàn giao công việc · Trước 3 tháng: Quyết định nghỉ hưu (NĐ 46/2010)." />
        {nghiHuu.length === 0 ? (
          <Empty text="Không có cán bộ đến mốc thông báo/quyết định nghỉ hưu." />
        ) : (
          <div className="space-y-2">
            {nghiHuu.map(({ cb, td, alert }) => (
              <div key={cb.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                    <span className="text-xs text-slate-500">{cb.chucDanh?.ten ?? cb.chucVu ?? ''} · {cb.toChuc?.ten ?? '—'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${retireAlertBadgeClass(alert.bucket)}`}>
                      {alert.label}
                    </span>
                  </div>
                  {/* Phân biệt ngày MÁY TÍNH với thời điểm đã được quyết định lùi —
                      Thông báo/Quyết định nghỉ hưu ghi theo mốc này nên không được lẫn. */}
                  <span className="text-xs text-slate-500">
                    Nghỉ hưu: <b className="text-slate-700">{fmtDate(alert.ngayVeHuu)}</b>
                    {td.laDuKien ? (
                      <span className="ml-1.5 text-[11px] font-medium text-slate-500 border border-slate-200 bg-slate-50 rounded px-1.5 py-0.5">dự kiến</span>
                    ) : (
                      <span className="ml-1.5 text-[11px] font-medium text-teal-800 border border-teal-200 bg-teal-50 rounded px-1.5 py-0.5">
                        đã lùi (TH {td.truongHop}) · dự kiến {fmtDate(td.ngayDuKien)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-slate-600 grid sm:grid-cols-3 gap-x-4 gap-y-0.5">
                  <span>Hạn Thông báo (−6 th): <b>{fmtDate(alert.ngayRaThongBao)}</b></span>
                  <span>Hạn Quyết định (−3 th): <b>{fmtDate(alert.ngayRaQuyetDinh)}</b></span>
                </div>
                {alert.viecCanLam && (
                  <p className="mt-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-flex items-start gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 mt-0.5 shrink-0" />{alert.viecCanLam}
                  </p>
                )}
                {canManageDoc && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={`/api/office/ho-so/${cb.id}/luu-van-ban?loai=tb_nghi_huu`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                      <FileText className="w-3.5 h-3.5" />Thông báo nghỉ hưu
                    </a>
                    <a href={`/api/office/ho-so/${cb.id}/luu-van-ban?loai=qd_nghi_huu`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      <FileDown className="w-3.5 h-3.5" />Dự thảo QĐ nghỉ hưu
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Đến hạn nâng lương */}
      <section id="nang-luong" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={TriangleAlert} color="text-orange-600" title="Đến hạn nâng lương" count={napLuong.length}
          desc="Theo ngày nâng lương lần sau (≤90 ngày hoặc đã quá hạn)." />
        {napLuong.length === 0 ? (
          <Empty text="Không có cán bộ đến hạn nâng lương trong 90 ngày." />
        ) : (
          <div className="space-y-1.5">
            {napLuong.map(({ cb, alert }) => (
              <div key={cb.id} className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                  <span className="text-xs text-slate-500">{cb.toChuc?.ten ?? '—'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${salaryAlertBadgeClass(alert.bucket)}`}>{alert.label}</span>
                  <span className="text-xs text-slate-500">Hạn: {fmtDate(cb.ngayNangLuongKeTiep)}</span>
                </div>
                {canManageDoc && (
                  <a href={`/api/office/ho-so/${cb.id}/luu-van-ban?loai=qd_nang_luong`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                    <FileDown className="w-3.5 h-3.5" />Dự thảo QĐ nâng lương
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CCCD chưa hợp lệ */}
      <section id="cccd" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={IdCard} color="text-rose-600" title="CCCD chưa hợp lệ — cần bổ sung/sửa" count={cccdChuaHopLe.length}
          desc="Đăng nhập hệ thống dùng số CCCD (12 chữ số). Các trường hợp dùng mã tạm hoặc CMND cũ cần cập nhật CCCD thật. Dành cho: Quản trị viên, Chánh/Phó Chánh VP, cán bộ phụ trách hồ sơ." />
        {cccdChuaHopLe.length === 0 ? (
          <Empty text="Tất cả cán bộ đã có CCCD hợp lệ (12 chữ số)." />
        ) : (
          <div className="space-y-1.5">
            {cccdChuaHopLe.map(({ cb, lyDo }) => (
              <div key={cb.id} className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                  <span className="text-xs text-slate-500">{cb.chucDanh?.ten ?? cb.chucVu ?? ''} · {cb.toChuc?.ten ?? '—'}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">{lyDo}</span>
                </div>
                <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}/sua`} className="text-xs font-semibold text-indigo-700 hover:underline">Cập nhật CCCD →</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cán bộ chưa có tài khoản đăng nhập */}
      <section id="chua-tk" className="rounded-xl border bg-white p-5 space-y-3 scroll-mt-4">
        <SectionHead icon={UserX} color="text-red-600" title="Cán bộ chưa có tài khoản đăng nhập" count={chuaCoTaiKhoan.length}
          desc="Cán bộ đang công tác nhưng chưa có tài khoản → chưa truy cập được hệ thống (ảnh hưởng quyền lợi). Quản trị viên tạo tài khoản (đăng nhập = CCCD); người CCCD chưa hợp lệ cần bổ sung CCCD trước." />
        {chuaCoTaiKhoan.length === 0 ? (
          <Empty text="Tất cả cán bộ đang công tác đã có tài khoản đăng nhập." />
        ) : (
          <div className="space-y-1.5">
            {chuaCoTaiKhoan.map((cb) => {
              const cccdChuaCo = cb.cccd.startsWith('TAM-') || !/^\d{12}$/.test(cb.cccd)
              return (
                <div key={cb.id} className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{cb.hoTen}</Link>
                    <span className="text-xs text-slate-500">{cb.chucDanh?.ten ?? cb.chucVu ?? ''} · {cb.toChuc?.ten ?? '—'}</span>
                    {cccdChuaCo
                      ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">Cần CCCD hợp lệ trước</span>
                      : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Sẵn sàng tạo tài khoản</span>}
                  </div>
                  <Link href="/dashboard/cai-dat/users" className="text-xs font-semibold text-indigo-700 hover:underline">Quản lý tài khoản →</Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Cơ sở pháp lý — tham chiếu điều/khoản + hiệu lực */}
      <section className="rounded-xl border bg-white p-5">
        <details>
          <summary className="flex items-center gap-2 cursor-pointer select-none">
            <Scale className="w-5 h-5 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Cơ sở pháp lý quản lý nhân sự</h2>
            <span className="text-xs text-slate-400">(bấm để xem điều/khoản + hiệu lực)</span>
          </summary>
          <div className="mt-4 space-y-4">
            {CO_SO_PHAP_LY.map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{m.tieuDe}</p>
                <p className="text-xs text-violet-800 bg-violet-50 border border-violet-100 rounded px-2 py-1 mt-1">
                  ➡️ {m.yeuCauQuanLy}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {m.vanBan.map((v) => (
                    <li key={v.soHieu} className="text-xs text-slate-600">
                      {/* CHỐNG DẪN CHỨNG SAI CĂN CỨ: văn bản đã hết hiệu lực phải
                          hiện rõ màu đỏ + chữ "ĐÃ HẾT HIỆU LỰC". Trước đây mọi
                          văn bản đều in màu xanh kèm "(hiện hành)". */}
                      {v.hieuLucDen ? (
                        <>
                          <span className="font-semibold text-rose-700">⛔ {v.soHieu}</span>
                          {' '}— <span className="text-rose-700 font-medium">
                            ĐÃ HẾT HIỆU LỰC ngày {v.hieuLucDen}
                            {v.thayTheBoi ? `, thay thế bởi ${v.thayTheBoi}` : ''}
                          </span>
                          <span className="block text-rose-600">Không dùng làm căn cứ hiện hành — chỉ để đối chiếu lịch sử.</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-800">{v.soHieu}</span>
                          {' '}— ban hành {v.ngayBanHanh}, <span className="text-emerald-700">hiệu lực từ {v.hieuLucTu} (hiện hành)</span>.
                        </>
                      )}
                      {v.canhBao && (
                        <span className="block mt-1 text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          ⚠️ {v.canhBao}
                        </span>
                      )}
                      <span className="block text-slate-500">{v.trichYeu}</span>
                      {v.dieuKhoan?.map((dk, i) => <span key={i} className="block text-slate-500 pl-3">– {dk}</span>)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-[11px] text-slate-400">Tóm tắt phục vụ tra cứu nhanh — không thay thế văn bản gốc. Có thể hỏi chatbot: “căn cứ pháp lý về vị trí việc làm”.</p>
          </div>
        </details>
      </section>

      <p className="text-xs text-slate-400">
        Văn bản sinh từ trang này là DỰ THẢO, được lưu vào{' '}
        <Link href="/dashboard/van-phong-so/van-ban" className="text-indigo-600 hover:underline">Kho văn bản đã sinh</Link>{' '}
        để tải lại. Văn phòng Sở rà soát số/ngày, căn cứ pháp lý trước khi trình ký.
      </p>
    </div>
  )
}

function StatCard({ label, value, tone, href }: { label: string; value: number | string; tone: 'red' | 'amber' | 'ok'; href: string }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900'
  return (
    <a href={href} className="rounded-xl border bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </a>
  )
}

function SectionHead({ icon: Icon, color, title, count, desc }: { icon: ElementType; color: string; title: string; count: number; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-5 h-5 ${color} mt-0.5`} />
      <div>
        <h2 className="text-base font-bold text-slate-900">{title} <span className="text-sm font-semibold text-slate-400">({count})</span></h2>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">✓ {text}</p>
}
