import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Upload, ChevronRight, BarChart3, FileSpreadsheet } from 'lucide-react'
import { WardReportImportPanel } from '@/components/bao-cao/ward-report-import-panel'
import { TemplateDownload } from '@/components/bao-cao/template-download'

export default async function ImportWardReportPage() {
  await requireAuth()

  const wards = await db.administrativeUnit.findMany({
    where: { type: 'PHUONG_XA', isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  })

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/bao-cao" className="hover:text-blue-700 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />Báo cáo
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/bao-cao/du-lieu-phuong-xa" className="hover:text-blue-700">
          Dữ liệu phường/xã
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Import Excel</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Upload className="w-5 h-5 text-green-700" />
          Import dữ liệu từ file Excel phường/xã
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Mỗi file Excel có thể có nhiều sheet — mỗi sheet sẽ được lưu thành 1 bộ dữ liệu riêng
        </p>
      </div>

      {/* Tải file mẫu */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-green-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />File mẫu — Phụ lục 1
          </h3>
          <p className="text-sm text-green-700">
            Phường/xã tải file mẫu về, điền số liệu rồi import lại tại đây. File gồm 7 biểu:
            Đường GT · Điện chiếu sáng · Thoát nước · Cây xanh · Công viên · Cấp nước · Bãi đỗ xe.
          </p>
          <p className="text-xs text-green-600">
            Nhập <strong>mã đơn vị hành chính</strong> bên dưới — file tải về sẽ tự đặt tên đúng chuẩn:
            <strong> PHỤ LỤC 1_[Tên đơn vị].xlsx</strong>
          </p>
        </div>
        <TemplateDownload wards={wards.map(w => ({ code: w.code, name: w.name }))} />
      </div>

      {/* Thông tin định dạng file */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />Yêu cầu định dạng file Excel
        </h3>
        <div className="text-sm text-blue-700 space-y-1.5">
          <p>• <strong>Dùng đúng file mẫu</strong> ở trên — <strong className="text-red-600">KHÔNG tự ý thêm cột, đổi tên cột, xoá cột hay đổi thứ tự cột</strong> ngoài file mẫu. Chỉ điền số liệu vào các cột đã có.</p>
          <p>• <strong>Không đổi tên sheet</strong> (Đường GT, Điện chiếu sáng, Thoát nước…). Mỗi sheet là 1 biểu — giữ nguyên như mẫu.</p>
          <p>• Hàng tiêu đề cột (ví dụ STT, Tuyến đường, Số cột đèn…) phải <strong>giữ nguyên</strong>; điền dữ liệu từ hàng bên dưới.</p>
          <p>• Ô số liệu chỉ điền <strong>con số</strong> (không kèm chữ, không đơn vị, không dấu chấm phân cách nghìn). Ô không có số liệu để <strong>trống</strong>.</p>
          <p>• Có thể giữ các sheet bìa/hướng dẫn — hệ thống tự bỏ qua sheet trống hoặc chỉ có 1 hàng.</p>
          <p>• Hỗ trợ: <strong>.xlsx</strong> và <strong>.xls</strong></p>
        </div>
      </div>

      {/* Hướng dẫn riêng sheet Điện chiếu sáng */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />Lưu ý riêng — sheet “Điện chiếu sáng”
        </h3>
        <div className="text-sm text-amber-800 space-y-1.5">
          <p>
            Trong <strong>một tuyến đường</strong> nếu có <strong>nhiều loại công suất bóng đèn khác nhau</strong>
            thì phải <strong>tách thành nhiều dòng</strong> — mỗi dòng ghi riêng số cột và công suất tương ứng
            (không gộp chung 1 dòng).
          </p>
          <div className="overflow-x-auto rounded-lg border border-amber-300 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-100 text-amber-900">
                  <th className="px-3 py-1.5 text-left">Tuyến đường</th>
                  <th className="px-3 py-1.5 text-center">Số cột đèn toàn tuyến</th>
                  <th className="px-3 py-1.5 text-center">Loại đèn</th>
                  <th className="px-3 py-1.5 text-center">Công suất (W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 text-slate-700">
                <tr><td className="px-3 py-1.5">Đường Lê Lợi</td><td className="px-3 py-1.5 text-center">20</td><td className="px-3 py-1.5 text-center">LED</td><td className="px-3 py-1.5 text-center">150</td></tr>
                <tr><td className="px-3 py-1.5">Đường Lê Lợi</td><td className="px-3 py-1.5 text-center">8</td><td className="px-3 py-1.5 text-center">LED</td><td className="px-3 py-1.5 text-center">250</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-amber-700">
            Ví dụ: đường Lê Lợi có 20 cột đèn LED 150W và 8 cột đèn LED 250W → ghi thành 2 dòng cùng tên tuyến như trên.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <WardReportImportPanel wards={wards} />
      </div>
    </div>
  )
}
