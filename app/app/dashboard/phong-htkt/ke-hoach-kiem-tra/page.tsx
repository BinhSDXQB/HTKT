import { CalendarCheck, Grid3X3, CheckCircle2 } from 'lucide-react'
import { LINH_VUC_HTKT } from '@/lib/htkt/phap-ly'
import {
  NHOM_CONG_TRINH, NOI_DUNG_KIEM_TRA, QUY_MO_LINH_VUC, KE_HOACH_KIEM_TRA_NAM,
} from '@/lib/htkt/ke-hoach-kiem-tra'

export const dynamic = 'force-dynamic'

export default function KeHoachKiemTraPage() {
  const tongCongTrinh = NHOM_CONG_TRINH.length
  const tongLinhVuc = LINH_VUC_HTKT.length
  const tongNoiDung = NOI_DUNG_KIEM_TRA.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kế hoạch kiểm tra QLNN</h1>
          <p className="text-sm text-slate-500">
            Ma trận phân loại công trình · Nội dung kiểm tra · Quy mô và thẩm quyền · Lịch kiểm tra hàng năm
          </p>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border bg-emerald-50/50 p-4">
          <p className="text-xs text-slate-600 mb-1">Tổng lĩnh vực HTKT</p>
          <p className="text-2xl font-bold text-emerald-700">{tongLinhVuc}</p>
          <p className="text-xs text-slate-500 mt-1">Cấp nước, thoát nước, cây xanh, chiếu sáng...</p>
        </div>
        <div className="rounded-lg border bg-blue-50/50 p-4">
          <p className="text-xs text-slate-600 mb-1">Nhóm công trình (Cấp I–IV)</p>
          <p className="text-2xl font-bold text-blue-700">{tongCongTrinh}</p>
          <p className="text-xs text-slate-500 mt-1">Phân loại theo quy mô & thẩm quyền</p>
        </div>
        <div className="rounded-lg border bg-purple-50/50 p-4">
          <p className="text-xs text-slate-600 mb-1">Nội dung kiểm tra định kỳ</p>
          <p className="text-2xl font-bold text-purple-700">{tongNoiDung}</p>
          <p className="text-xs text-slate-500 mt-1">Từng lĩnh vực (tháng/quý/năm)</p>
        </div>
      </div>

      {/* 1. Ma trận phân loại công trình */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-emerald-600" />
          1. Ma trận phân loại công trình HTKT
        </h2>
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Lĩnh vực</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Loại công trình</th>
                <th className="text-center px-4 py-2 font-semibold text-slate-700">Cấp</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Quy mô</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Thẩm quyền</th>
                <th className="text-center px-4 py-2 font-semibold text-slate-700">KT-NT</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {NHOM_CONG_TRINH.slice(0, 20).map((nh, i) => {
                const lv = LINH_VUC_HTKT.find((l) => l.key === nh.linhVuc)
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-900 font-medium text-xs">{lv?.ten}</td>
                    <td className="px-4 py-2 text-slate-700 text-xs">{nh.loai}</td>
                    <td className="px-4 py-2 text-center font-semibold text-slate-700">{nh.cap}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{nh.quyMo}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">
                      {nh.thamQuyenThamDinh === 'So_XD' ? 'Sở XD' : 'HĐNT/CĐT'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {nh.doiTuongKiemTraNT && <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-slate-50 text-xs text-slate-600 border-t">
            <p>Hiển thị {Math.min(20, NHOM_CONG_TRINH.length)} / {NHOM_CONG_TRINH.length} nhóm công trình</p>
            <p className="text-slate-500 mt-1">KT-NT = Cơ quan chuyên môn kiểm tra nghiệm thu · TT 34/2026/TT-BXD</p>
          </div>
        </div>
      </div>

      {/* 2. Nội dung kiểm tra */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          2. Nội dung kiểm tra định kỳ theo lĩnh vực
        </h2>
        <div className="space-y-4">
          {NOI_DUNG_KIEM_TRA.map((nd, i) => {
            const lv = LINH_VUC_HTKT.find((l) => l.key === nd.linhVuc)
            const hinhThuc = nd.hinhThucKiemTra === 'thuong_xuyen' ? '🔄 Thường xuyên' : nd.hinhThucKiemTra === 'dinh_ky' ? '📅 Định kỳ' : '🚨 Đột xuất'
            return (
              <details key={i} className="rounded-lg border bg-white group">
                <summary className="px-4 py-3 font-semibold text-slate-900 cursor-pointer hover:bg-slate-50">
                  <span className="flex items-center gap-2">
                    {lv?.ten} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{hinhThuc}</span>
                    <span className="text-xs font-normal text-slate-500 bg-blue-100 px-2 py-1 rounded">Tần suất: {nd.tanSuat}</span>
                  </span>
                </summary>
                <div className="px-4 py-3 bg-slate-50 border-t space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Nội dung kiểm tra:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {nd.noiDungKiemTra.map((nc, j) => <li key={j}>{nc}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Tài liệu yêu cầu:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {nd.taiLieuYeuCau.map((tl, j) => <li key={j}>{tl}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Tiêu chí đánh giá:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {nd.tieuChi.map((tc, j) => <li key={j}>{tc}</li>)}
                    </ul>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      </div>

      {/* 3. Quy mô công trình theo 3 nhóm */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">3. Quy mô công trình & thẩm quyền (Nhóm A / B / C)</h2>
        <div className="space-y-3">
          {QUY_MO_LINH_VUC.map((qm, i) => {
            const lv = LINH_VUC_HTKT.find((l) => l.key === qm.linhVuc)
            return (
              <div key={i} className="rounded-lg border bg-white p-4">
                <p className="font-semibold text-slate-900 mb-3">{lv?.ten}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded bg-red-50/50 p-3 border border-red-100">
                    <p className="text-xs font-bold text-red-700 mb-1">🏆 Nhóm A (Trọng điểm)</p>
                    <p className="text-xs text-slate-700 mb-2">{qm.nhomA.moTa}</p>
                    <p className="text-xs text-slate-600 italic border-t border-red-100 pt-2">{qm.nhomA.thamQuyen}</p>
                  </div>
                  <div className="rounded bg-yellow-50/50 p-3 border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-700 mb-1">📋 Nhóm B (Cấp tỉnh/huyện)</p>
                    <p className="text-xs text-slate-700 mb-2">{qm.nhomB.moTa}</p>
                    <p className="text-xs text-slate-600 italic border-t border-yellow-100 pt-2">{qm.nhomB.thamQuyen}</p>
                  </div>
                  <div className="rounded bg-green-50/50 p-3 border border-green-100">
                    <p className="text-xs font-bold text-green-700 mb-1">✓ Nhóm C (Phân cấp)</p>
                    <p className="text-xs text-slate-700 mb-2">{qm.nhomC.moTa}</p>
                    <p className="text-xs text-slate-600 italic border-t border-green-100 pt-2">{qm.nhomC.thamQuyen}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Lịch kiểm tra hàng năm */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">4. Lịch kiểm tra hàng năm theo tháng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {KE_HOACH_KIEM_TRA_NAM.map((kh, i) => {
            const thangText = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                               'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][kh.thang - 1]
            return (
              <div key={i} className="rounded-lg border bg-white p-4 hover:shadow-sm transition">
                <p className="font-bold text-slate-900 mb-2">{thangText} (T{kh.thang})</p>
                <div className="mb-2">
                  <p className="text-xs text-slate-600 font-semibold mb-1">Lĩnh vực kiểm tra:</p>
                  <div className="flex flex-wrap gap-1">
                    {kh.cauHinhLinhVuc.map((lv, j) => {
                      const lvName = LINH_VUC_HTKT.find((l) => l.key === lv)?.ten || lv
                      return (
                        <span key={j} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                          {lvName}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {kh.noiDungChiDao && (
                  <div className="text-xs text-slate-600 italic border-t border-slate-200 pt-2">
                    💡 {kh.noiDungChiDao}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-8 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-xs text-slate-700">
          <strong>Căn cứ pháp lý:</strong> TT 34/2026/TT-BXD (phân cấp công trình) · TT 33/2026/TT-BXD (đánh giá an toàn) · NĐ 217/2026/NĐ-CP (thẩm định) · NĐ 207/2026/NĐ-CP (kiểm tra, bảo trì) · Luật Xây dựng 135/2025/QH15 (hiệu lực 01/7/2026)
        </p>
      </div>
    </div>
  )
}
