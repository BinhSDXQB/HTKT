import { FileBarChart, AlertTriangle, CheckCircle2, Ban } from 'lucide-react'
import { computeChiTieu41, NGUONG_NGHI_KM } from '@/lib/htkt/nq06-ha-tang'

export const dynamic = 'force-dynamic'

const km = (x: number) => x.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
const pct = (x: number | null) => (x == null ? '—' : x.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%')

export default async function BaoCaoNQ06Page() {
  const year = 2025
  const data = await computeChiTieu41(year)
  const d = data.duong
  const cn = data.capNuoc

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <FileBarChart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo NQ 06 — Mục 4.1 Hạ tầng kỹ thuật cơ bản</h1>
          <p className="text-sm text-slate-500">
            Rút số tự động từ CSDL (năm {year}) · 29 đơn vị có đô thị · đã khử trùng nguồn phường + Trung tâm bảo trì
          </p>
        </div>
      </div>

      {/* Thẻ chỉ tiêu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-slate-600">③ Tỷ lệ đường đô thị trải nhựa/bê tông hóa</p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{pct(d.tong.tyLe)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Cứng hóa {km(d.tong.cungHoaKm)} / {km(d.tong.tongKm - d.tong.khongRoKm)} km (đã ghi kết cấu)
          </p>
        </div>
        <div className="rounded-lg border bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            {cn.coDuLieu ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Ban className="w-4 h-4 text-slate-400" />}
            <p className="text-xs text-slate-600">④ Tỷ lệ hộ được cấp nước sạch tập trung</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{cn.coDuLieu ? pct(cn.tyLe) : 'Chưa có dữ liệu'}</p>
          <p className="text-xs text-slate-500 mt-1">
            {cn.coDuLieu
              ? `${cn.hoCoNuoc.toLocaleString('vi-VN')} / ${cn.tongHo.toLocaleString('vi-VN')} hộ`
              : 'Bảng report_cap_nuoc chưa nhập — cần cập nhật số hộ/hiện trạng'}
          </p>
        </div>
      </div>

      {/* Cảnh báo chất lượng dữ liệu */}
      {(d.tong.khongRoKm > 0 || d.tong.nghiNgoKm > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" /> Lưu ý chất lượng dữ liệu (đã loại khỏi tỷ lệ)
          </div>
          <ul className="list-disc pl-6 space-y-0.5">
            {d.tong.khongRoKm > 0 && (
              <li>{km(d.tong.khongRoKm)} km chưa ghi kết cấu mặt đường → loại khỏi mẫu số (cần bổ sung).</li>
            )}
            {d.tong.nghiNgoKm > 0 && (
              <li>
                {km(d.tong.nghiNgoKm)} km ở {d.tuyenNghiNgo.length} tuyến dài ≥ {NGUONG_NGHI_KM} km — nghi mét ghi
                nhầm km / dòng gộp, tách riêng chờ rà soát.
              </li>
            )}
            {d.tong.trungTamKm > 0 && (
              <li>{km(d.tong.trungTamKm)} km lấy từ nguồn Trung tâm bảo trì (mặt cắt ≥ 20m), đã khử trùng với báo cáo phường.</li>
            )}
          </ul>
        </div>
      )}

      {/* Bảng chi tiết ③ theo đơn vị */}
      <h2 className="text-lg font-semibold text-slate-900 mb-2">③ Chi tiết theo đơn vị đô thị</h2>
      <div className="overflow-x-auto rounded-lg border mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">Đơn vị</th>
              <th className="text-left px-3 py-2">Phân loại</th>
              <th className="text-right px-3 py-2">Tổng (km)</th>
              <th className="text-right px-3 py-2">Cứng hóa</th>
              <th className="text-right px-3 py-2">Chưa</th>
              <th className="text-right px-3 py-2">Trống</th>
              <th className="text-right px-3 py-2">Trung tâm</th>
              <th className="text-right px-3 py-2">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.filter((r) => r.tongKm > 0 || r.nghiNgoKm > 0).map((r) => (
              <tr key={r.wardId} className="border-t">
                <td className="px-3 py-1.5 font-medium text-slate-800">{r.donVi}</td>
                <td className="px-3 py-1.5 text-slate-500 text-xs">{r.vungLoi}</td>
                <td className="px-3 py-1.5 text-right">{km(r.tongKm)}</td>
                <td className="px-3 py-1.5 text-right text-emerald-700">{km(r.cungHoaKm)}</td>
                <td className="px-3 py-1.5 text-right">{r.chuaKm ? km(r.chuaKm) : '—'}</td>
                <td className="px-3 py-1.5 text-right text-amber-600">{r.khongRoKm ? km(r.khongRoKm) : '—'}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">{r.trungTamKm ? km(r.trungTamKm) : '—'}</td>
                <td className="px-3 py-1.5 text-right font-semibold">{pct(r.tyLe)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold">
            <tr className="border-t-2">
              <td className="px-3 py-2" colSpan={2}>TỔNG (29 đô thị)</td>
              <td className="px-3 py-2 text-right">{km(d.tong.tongKm)}</td>
              <td className="px-3 py-2 text-right text-emerald-700">{km(d.tong.cungHoaKm)}</td>
              <td className="px-3 py-2 text-right">{km(d.tong.chuaKm)}</td>
              <td className="px-3 py-2 text-right text-amber-600">{km(d.tong.khongRoKm)}</td>
              <td className="px-3 py-2 text-right text-slate-500">{km(d.tong.trungTamKm)}</td>
              <td className="px-3 py-2 text-right">{pct(d.tong.tyLe)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tuyến nghi ngờ */}
      {d.tuyenNghiNgo.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Tuyến nghi ngờ đơn vị đo (≥ {NGUONG_NGHI_KM} km) — cần cán bộ rà soát
          </h2>
          <div className="overflow-x-auto rounded-lg border mb-8">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Đơn vị</th>
                  <th className="text-left px-3 py-2">Tên tuyến</th>
                  <th className="text-left px-3 py-2">Kết cấu</th>
                  <th className="text-right px-3 py-2">Ghi nhận (km)</th>
                </tr>
              </thead>
              <tbody>
                {d.tuyenNghiNgo.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-1.5">{t.donVi}</td>
                    <td className="px-3 py-1.5">{t.tenDuong}</td>
                    <td className="px-3 py-1.5 text-slate-500">{t.ketCau ?? '—'}</td>
                    <td className="px-3 py-1.5 text-right text-red-600 font-medium">{km(t.km)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Chỉ tiêu ngoài phạm vi HTKT */}
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Chỉ tiêu cần nhập tay / phối hợp ngoài</h2>
      <div className="rounded-lg border divide-y">
        {data.ngoaiPhamVi.map((n) => (
          <div key={n.ma} className="flex items-start gap-3 px-4 py-3 text-sm">
            <Ban className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-800">{n.ma} {n.ten}</p>
              <p className="text-xs text-slate-500">Nguồn: {n.nguon}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
