import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { computeDoiSoatDuong, tomTat, MAU_MUC, type MucDo } from '@/lib/htkt/doi-soat'
import {
  BarChart3, ChevronRight, ShieldCheck, AlertTriangle, Map as MapIcon, Info,
} from 'lucide-react'

export const dynamic = 'force-dynamic' // luôn tính lại từ DB (số liệu động)

const MUC_BADGE: Record<MucDo, string> = {
  'NGHIÊM TRỌNG': 'bg-red-100 text-red-700 border-red-300',
  'CẢNH BÁO': 'bg-orange-100 text-orange-700 border-orange-300',
  'LƯU Ý': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'ĐẠT': 'bg-green-100 text-green-700 border-green-300',
}
const MUC_ROW: Record<MucDo, string> = {
  'NGHIÊM TRỌNG': 'bg-red-50/40', 'CẢNH BÁO': 'bg-orange-50/30', 'LƯU Ý': 'bg-yellow-50/30', 'ĐẠT': '',
}

export default async function DoiSoatPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requireAuth()
  const sp = await searchParams
  const year = Number(sp.year || 2025)
  const rows = await computeDoiSoatDuong(year)
  const s = tomTat(rows)
  const canhBao = s['NGHIÊM TRỌNG'] + s['CẢNH BÁO']

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/bao-cao" className="hover:text-blue-700 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />Báo cáo
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Đối soát số liệu ↔ bản đồ GIS</span>
      </nav>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Đối soát 3 nguồn — Chiều dài đường ({year})
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Chi tiết kê khai (động, cộng từ dữ liệu nhập) ↔ Đơn vị tự khai ↔ Bản đồ GIS thực tế.
            Sửa dữ liệu nhập là bảng này tự cập nhật.
          </p>
        </div>
        <Link href="/dashboard/ban-do"
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800">
          <MapIcon className="w-4 h-4" />Xem trên bản đồ
        </Link>
      </div>

      {/* KPI mức độ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['NGHIÊM TRỌNG', 'CẢNH BÁO', 'LƯU Ý', 'ĐẠT'] as MucDo[]).map((m) => (
          <div key={m} className="bg-white rounded-xl border p-4 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: MAU_MUC[m] }} />
              <p className="text-xs font-medium text-slate-600">{m}</p>
            </div>
            <p className="text-3xl font-bold" style={{ color: MAU_MUC[m] }}>{s[m]}</p>
            <p className="text-xs text-slate-400">đơn vị</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          <b>Nguyên tắc khoa học:</b> hệ chỉ lưu <b>dòng chi tiết</b> (không lưu dòng “Mục I/II/Tổng”)
          nên tổng = SUM, <b>không bao giờ cộng trùng</b>. GIS tổng mạng gồm cả QL/ĐT/cao tốc; đường
          địa phương là phần gần với phần xã/phường quản lý. {canhBao > 0 &&
          <b> Có {canhBao} đơn vị cần rà soát/điều chỉnh.</b>}
        </p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-600">
                <th className="px-3 py-2.5 text-left font-semibold w-8">#</th>
                <th className="px-3 py-2.5 text-left font-semibold min-w-[150px]">Phường/Xã</th>
                <th className="px-2 py-2.5 text-right font-semibold">Chi tiết<br />(km)</th>
                <th className="px-2 py-2.5 text-right font-semibold">Tự khai<br />(km)</th>
                <th className="px-2 py-2.5 text-right font-semibold">GIS địa<br />phương (km)</th>
                <th className="px-2 py-2.5 text-right font-semibold">GIS tổng<br />mạng (km)</th>
                <th className="px-2 py-2.5 text-right font-semibold">Chênh vs<br />bản đồ</th>
                <th className="px-2 py-2.5 text-center font-semibold min-w-[110px]">Mức độ</th>
                <th className="px-3 py-2.5 text-left font-semibold min-w-[260px]">Nhận định</th>
                <th className="px-3 py-2.5 text-left font-semibold min-w-[300px]">Đề nghị điều chỉnh — ai làm gì</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.wardId} className={MUC_ROW[r.mucDo] + ' hover:bg-slate-50/70 align-top'}>
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{r.donVi}</td>
                  <td className="px-2 py-2 text-right font-semibold">{r.chiTiet.toLocaleString('vi-VN')}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{r.khaiBao != null ? r.khaiBao.toLocaleString('vi-VN') : '—'}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{r.gisDiaPhuong.toLocaleString('vi-VN')}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{r.gisTong.toLocaleString('vi-VN')}</td>
                  <td className="px-2 py-2 text-right font-semibold" style={{ color: r.mau }}>
                    {r.thieuSoVoiBanDo > 0 ? '+' : ''}{r.thieuSoVoiBanDo.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${MUC_BADGE[r.mucDo]}`}>
                      {r.mucDo}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 leading-relaxed">{r.nhanDinh}</td>
                  <td className="px-3 py-2 text-slate-600 leading-relaxed">{r.deNghi}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-12 text-center text-slate-400">
                  Chưa có dữ liệu đối soát cho năm {year}.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" />
        Nguồn GIS làm mới bằng <code className="bg-slate-100 px-1 rounded">tools/gis_do_chieu_dai.py</code> +
        seeder <code className="bg-slate-100 px-1 rounded">scripts/seed-doi-soat-gis.mjs</code> khi bản đồ tuyến thay đổi.
      </p>
    </div>
  )
}
