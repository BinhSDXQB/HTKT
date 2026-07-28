import Link from 'next/link'
import { requireOfficeAccess, canViewOfficeSensitive } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { isUpcomingRaise } from '@/lib/salary-alert'
import { huongLuongNgachBac } from '@/lib/luong'
import { Briefcase, Users, Wallet, Award, FileText, ScrollText, ChevronRight, ClipboardCheck, BarChart3, CalendarDays, BellRing, GraduationCap, Gavel, Network, Package, Scale } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Menu con của module Văn phòng Sở (theo prompt mục 12).
// Các mục `href` đã có trang; mục chưa có để `ready: false` (bổ sung ở Commit 3–4).
const subMenus = [
  { label: 'Cảnh báo & việc cần làm', desc: 'Hồ sơ thiếu mục · sai khác lương · nghỉ hưu · đến hạn nâng lương', icon: BellRing, ready: true, href: '/dashboard/van-phong-so/canh-bao' },
  { label: 'Hồ sơ cán bộ', desc: 'Thông tin cán bộ, công chức, viên chức, NLĐ', icon: Users, ready: true, href: '/dashboard/van-phong-so/ho-so' },
  { label: 'Quản lý lương', desc: 'Hệ số, phụ cấp, cảnh báo nâng lương', icon: Wallet, ready: true, href: '/dashboard/van-phong-so/luong' },
  { label: 'Thi đua, khen thưởng', desc: 'Đợt thi đua, danh hiệu, khen thưởng', icon: Award, ready: true, href: '/dashboard/van-phong-so/thi-dua-khen-thuong' },
  { label: 'Đánh giá, xếp loại & kỷ luật', desc: 'Xếp loại hằng năm · kỷ luật, kéo dài nâng lương', icon: ClipboardCheck, ready: true, href: '/dashboard/van-phong-so/danh-gia' },
  { label: 'Nâng lương (quy trình)', desc: 'Sinh danh sách đến hạn · rà soát · trình duyệt', icon: ScrollText, ready: true, href: '/dashboard/van-phong-so/nang-luong' },
  { label: 'Nghỉ phép', desc: 'Đơn nghỉ phép toàn Sở · duyệt · theo dõi ngày phép năm', icon: CalendarDays, ready: true, href: '/dashboard/van-phong-so/nghi-phep' },
  { label: 'Kho văn bản đã sinh', desc: 'Quyết định đã ban hành (.docx) — lưu vết, tải lại', icon: FileText, ready: true, href: '/dashboard/van-phong-so/van-ban' },
  { label: 'Đào tạo, bồi dưỡng', desc: 'Kế hoạch & theo dõi đào tạo, bồi dưỡng CBCCVC', icon: GraduationCap, ready: true, href: '/dashboard/van-phong-so/dao-tao-boi-duong' },
  { label: 'Pháp chế', desc: 'Thẩm định văn bản, theo dõi thi hành pháp luật', icon: Gavel, ready: true, href: '/dashboard/van-phong-so/phap-che' },
  { label: 'Cơ sở pháp lý', desc: 'Luật, NĐ, TT, QCVN chuyên ngành (văn thư–lưu trữ, ISO–CCHC, chuyển đổi số, tài sản công)', icon: Scale, ready: true, href: '/dashboard/van-phong-so/phap-ly' },
  { label: 'ISO & Cải cách hành chính', desc: 'TCVN ISO 9001 · kiểm soát TTHC · kế hoạch CCHC', icon: ClipboardCheck, ready: true, href: '/dashboard/van-phong-so/iso-cchc' },
  { label: 'Chuyển đổi số & Đề án 06', desc: 'Ứng dụng CNTT, an toàn thông tin, Đề án 06', icon: Network, ready: true, href: '/dashboard/van-phong-so/chuyen-doi-so' },
  { label: 'Văn thư – Lưu trữ', desc: 'Văn bản đi/đến, con dấu, hồ sơ lưu trữ', icon: ScrollText, ready: true, href: '/dashboard/van-phong-so/van-thu-luu-tru' },
  { label: 'Hành chính – Quản trị', desc: 'Tài sản công, hậu cần, trụ sở, xe công', icon: Package, ready: true, href: '/dashboard/van-phong-so/hanh-chinh-quan-tri' },
  { label: 'Báo cáo tổng hợp', desc: 'Thống kê nhân sự, lương, khen thưởng, kỷ luật · xuất Excel', icon: BarChart3, ready: true, href: '/dashboard/van-phong-so/bao-cao' },
]

export default async function VanPhongSoPage() {
  const user = await requireOfficeAccess()
  const canSensitive = canViewOfficeSensitive(user)

  // Thống kê nhanh: TOÀN BỘ cán bộ thuộc Sở + cảnh báo nâng lương sắp đến hạn
  const soIds = await getSoToChucIds()
  const canBoSo = await db.canBo.findMany({
    where: { toChucId: { in: soIds } },
    select: { ngayNangLuongKeTiep: true, doiTuong: true, loaiHinh: true },
  })
  const soCanBoVPS = canBoSo.length
  // NLĐ hợp đồng không nâng lương ngạch bậc → không tính vào cảnh báo nâng lương.
  const soCanhBaoLuong = canBoSo.filter((c) => huongLuongNgachBac(c) && isUpcomingRaise(c.ngayNangLuongKeTiep)).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Văn phòng Sở</h1>
          <p className="text-sm text-slate-500">
            Quản lý nhân sự, lương, thi đua – khen thưởng · Sở Xây dựng Quảng Trị
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/van-phong-so/ho-so" className="rounded-xl border bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition">
          <p className="text-xs text-slate-500">Cán bộ toàn Sở</p>
          <p className="text-2xl font-bold text-slate-900">{soCanBoVPS}</p>
        </Link>
        <Link href="/dashboard/van-phong-so/luong" className="rounded-xl border bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition">
          <p className="text-xs text-slate-500">Sắp nâng lương (≤90 ngày / quá hạn)</p>
          <p className={`text-2xl font-bold ${soCanhBaoLuong > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{soCanhBaoLuong}</p>
        </Link>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Phòng ban của bạn</p>
          <p className="text-2xl font-bold text-slate-900">{user.departmentCode ?? '—'}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Quyền xem dữ liệu nhạy cảm</p>
          <p className="text-2xl font-bold text-slate-900">{canSensitive ? 'Có' : 'Không'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subMenus.map((m) => {
          const inner = (
            <>
              <m.icon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">{m.label}</p>
                <p className="text-xs text-slate-500">{m.desc}</p>
                {!m.ready && (
                  <span className="inline-block mt-2 text-[10px] font-semibold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Đang phát triển
                  </span>
                )}
              </div>
              {m.ready && m.href && <ChevronRight className="w-4 h-4 text-slate-300 ml-auto self-center" />}
            </>
          )
          return m.ready && m.href ? (
            <Link key={m.label} href={m.href} className="rounded-xl border bg-white p-4 flex items-start gap-3 hover:border-indigo-300 hover:shadow-sm transition">
              {inner}
            </Link>
          ) : (
            <div key={m.label} className="rounded-xl border bg-white p-4 flex items-start gap-3 opacity-90">
              {inner}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 mt-8">
        Module Văn phòng Sở — hồ sơ nhân sự &amp; lương, thi đua – khen thưởng, đánh giá – kỷ luật, quy trình nâng lương
        và sinh Quyết định (.docx) có lưu vết. Kho căn cứ pháp lý &amp; báo cáo tổng hợp sẽ bổ sung ở bước tiếp theo.
      </p>
    </div>
  )
}
