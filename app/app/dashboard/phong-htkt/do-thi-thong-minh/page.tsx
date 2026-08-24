import Link from 'next/link'
import { ChevronRight, Cpu, Lightbulb, Layers, ShieldCheck, AlertTriangle, ListChecks } from 'lucide-react'
import {
  CAP_DO,
  NGUYEN_TAC_PHAT_TRIEN,
  YEU_CAU_LIEN_THONG,
  LINH_VUC_THONG_MINH,
  CHI_SO_TRUONG_THANH,
  CACH_DANH_GIA,
  VIEC_CUA_PHONG,
  KHOANG_TRONG,
  CAN_CU_MODULE,
} from '@/lib/htkt/ha-tang-thong-minh'
import { quyTrinhTheoLinhVuc } from '@/lib/htkt/quy-trinh-linh-vuc'

export const dynamic = 'force-dynamic'

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border bg-white p-5 mb-5 ${className}`}>{children}</div>
)

const TieuDe = ({ icon: Icon, children, phu }: { icon: React.ElementType; children: React.ReactNode; phu?: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-cyan-600" />
    <p className="text-sm font-semibold text-slate-800">{children}</p>
    {phu && <span className="text-xs text-slate-400">{phu}</span>}
  </div>
)

export default function Page() {
  const chieuSang = CHI_SO_TRUONG_THANH.filter((c) => c.nhom === 'Năng lượng')
  const conLai = CHI_SO_TRUONG_THANH.filter((c) => c.nhom !== 'Năng lượng')
  const quyTrinhChieuSang = quyTrinhTheoLinhVuc('chieu-sang').filter((q) => q.key === 'phat-trien-chieu-sang-thong-minh')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Hạ tầng kỹ thuật & chiếu sáng đô thị thông minh</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hạ tầng kỹ thuật & chiếu sáng đô thị thông minh</h1>
          <p className="text-sm text-slate-500">
            Nghị định 269/2025/NĐ-CP · Thông tư 03/2026/TT-BXD — nội dung đã đối chiếu bản gốc, ghi rõ điều – khoản
          </p>
        </div>
      </div>

      {/* Ba cấp độ trưởng thành */}
      <Card>
        <TieuDe icon={Layers} phu="TT 03/2026/TT-BXD, Điều 2 khoản 2 điểm a">Ba cấp độ trưởng thành</TieuDe>
        <div className="grid gap-3 sm:grid-cols-3">
          {CAP_DO.map((c, i) => (
            <div key={c.key} className="rounded-lg border bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">
                <span className="text-cyan-600">{i + 1}.</span> {c.ten}
              </p>
              <p className="text-xs text-slate-600 mt-1">{c.moTa}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Chiếu sáng thông minh — trọng tâm */}
      <Card className="border-cyan-200">
        <TieuDe icon={Lightbulb} phu="NĐ 269/2025/NĐ-CP Điều 24 khoản 3">Chiếu sáng công cộng thông minh</TieuDe>
        <p className="text-xs text-slate-600 mb-3">
          Bốn hợp phần bắt buộc theo định nghĩa của Nghị định — thiếu một hợp phần thì chưa gọi là chiếu sáng thông minh:
        </p>
        <ul className="space-y-1.5 mb-4">
          {LINH_VUC_THONG_MINH.find((l) => l.khoan === 'Điều 24 khoản 3')?.thanhPhan.map((t) => (
            <li key={t} className="text-sm text-slate-700 flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
              {t}
            </li>
          ))}
        </ul>

        <p className="text-xs font-medium text-slate-700 mb-2">Chỉ số đánh giá theo cấp độ (Phụ lục I):</p>
        <div className="space-y-3">
          {chieuSang.map((c) => (
            <div key={c.kyHieu} className="border-l-2 border-cyan-300 pl-3">
              <p className="text-sm font-medium text-slate-800">
                <span className="text-cyan-700">{c.kyHieu}</span> — {c.ten}
              </p>
              <p className="text-xs text-slate-600 mt-1"><strong>① Nền tảng:</strong> {c.nenTang}</p>
              {c.lienKet && <p className="text-xs text-slate-600"><strong>② Liên kết hệ thống:</strong> {c.lienKet}</p>}
              {c.doiMoi && <p className="text-xs text-slate-600"><strong>③ Đổi mới quản trị:</strong> {c.doiMoi}</p>}
            </div>
          ))}
        </div>

        {quyTrinhChieuSang.map((q) => (
          <div key={q.key} className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800 mb-2">{q.ten} — các bước</p>
            <ol className="space-y-1.5">
              {q.buoc.map((b) => (
                <li key={b.buoc} className="text-xs text-slate-600 flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 text-[10px] font-semibold">
                    {b.buoc}
                  </span>
                  <span>
                    <span className="font-medium text-slate-800">{b.ten}. </span>
                    {b.noiDung}
                    {b.canCu && <em className="block text-[11px] text-cyan-700 mt-0.5">{b.canCu}</em>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </Card>

      {/* Năm lĩnh vực */}
      <Card>
        <TieuDe icon={Cpu} phu="NĐ 269/2025/NĐ-CP Điều 24">Năm lĩnh vực hạ tầng kỹ thuật đô thị thông minh</TieuDe>
        <div className="space-y-3">
          {LINH_VUC_THONG_MINH.map((l) => (
            <div key={l.khoan}>
              <p className="text-sm font-medium text-slate-800">
                {l.ten} <span className="text-[11px] text-slate-400">({l.khoan})</span>
              </p>
              <ul className="mt-1 space-y-0.5">
                {l.thanhPhan.map((t) => (
                  <li key={t} className="text-xs text-slate-600 pl-3">• {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Nguyên tắc + liên thông */}
      <Card>
        <TieuDe icon={ShieldCheck} phu="NĐ 269/2025/NĐ-CP Điều 23, Điều 25">Nguyên tắc phát triển và yêu cầu liên thông</TieuDe>
        <ul className="space-y-2 mb-4">
          {NGUYEN_TAC_PHAT_TRIEN.map((n) => (
            <li key={n.khoan} className="text-xs text-slate-600">
              • {n.noiDung} <span className="text-[11px] text-cyan-700 bg-cyan-50 rounded px-1.5 py-0.5">{n.khoan}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {YEU_CAU_LIEN_THONG.map((n) => (
            <li key={n.khoan} className="text-xs text-slate-600">
              • {n.noiDung} <span className="text-[11px] text-cyan-700 bg-cyan-50 rounded px-1.5 py-0.5">{n.khoan}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Chỉ số các lĩnh vực khác */}
      <Card>
        <TieuDe icon={Layers} phu={`${conLai.length} chỉ số · TT 03/2026/TT-BXD Phụ lục I`}>
          Chỉ số các lĩnh vực hạ tầng kỹ thuật khác
        </TieuDe>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border p-2 text-left font-medium text-slate-700">Ký hiệu</th>
                <th className="border p-2 text-left font-medium text-slate-700">Chỉ số</th>
                <th className="border p-2 text-left font-medium text-slate-700">① Nền tảng</th>
                <th className="border p-2 text-left font-medium text-slate-700">② Liên kết hệ thống</th>
                <th className="border p-2 text-left font-medium text-slate-700">③ Đổi mới quản trị</th>
              </tr>
            </thead>
            <tbody>
              {conLai.map((c) => (
                <tr key={c.kyHieu}>
                  <td className="border p-2 text-cyan-700 whitespace-nowrap align-top">{c.kyHieu}</td>
                  <td className="border p-2 text-slate-800 align-top">
                    {c.ten}
                    <span className="block text-[11px] text-slate-400">{c.nhom}</span>
                    {c.giaiThich && <span className="block text-[11px] text-slate-500 mt-1">Giải thích: {c.giaiThich}</span>}
                  </td>
                  <td className="border p-2 text-slate-600 align-top">{c.nenTang}</td>
                  <td className="border p-2 text-slate-600 align-top">{c.lienKet || '—'}</td>
                  <td className="border p-2 text-slate-600 align-top">{c.doiMoi || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cách đánh giá */}
      <Card>
        <TieuDe icon={ListChecks} phu="TT 03/2026/TT-BXD Điều 2">Cách đánh giá, công nhận</TieuDe>
        <ul className="space-y-2">
          {CACH_DANH_GIA.map((c) => (
            <li key={c.khoan} className="text-xs text-slate-600">
              • {c.noiDung} <span className="text-[11px] text-cyan-700 bg-cyan-50 rounded px-1.5 py-0.5">{c.khoan}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Việc của phòng */}
      <Card>
        <TieuDe icon={ListChecks}>Việc của Phòng Hạ tầng kỹ thuật</TieuDe>
        <ul className="space-y-2">
          {VIEC_CUA_PHONG.map((v, i) => (
            <li key={i} className="text-xs text-slate-700">
              ☐ {v.viec} <span className="text-[11px] text-cyan-700 bg-cyan-50 rounded px-1.5 py-0.5">{v.bamVao}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Khoảng trống */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900">Khoảng trống đã đối chiếu — không suy đoán thay</p>
        </div>
        <ul className="space-y-1.5">
          {KHOANG_TRONG.map((k, i) => (
            <li key={i} className="text-xs text-amber-800">• {k}</li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-slate-400">Căn cứ: {CAN_CU_MODULE.join(' · ')}</p>
    </div>
  )
}
