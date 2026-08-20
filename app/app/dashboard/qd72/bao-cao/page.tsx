import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getQd72Auth } from '@/lib/qd72/auth'
import { baoCaoTongHop } from '@/lib/qd72/bao-cao'
import { ArrowLeft, BarChart3 } from 'lucide-react'

const TT_TEN: Record<string, string> = { DRAFT: 'Nháp', SUBMITTED: 'Đã gửi', RETURNED: 'Bị trả lại', TECHNICAL_VERIFICATION: 'Đang xác minh', VERIFIED: 'Đã xác minh', APPROVED: 'Đã phê duyệt', ARCHIVED: 'Lưu trữ' }
const NHOM_TEN: Record<string, string> = { DAT: 'Đạt', KHONG_DAT_CO_THE_CAI_TAO: 'Không đạt - có thể cải tạo', KHONG_DAT_CHUA_THE_CAI_TAO_DAY_DU: 'Không đạt - chưa thể cải tạo đầy đủ', CHUA_DU_DU_LIEU: 'Chưa đủ dữ liệu' }

function Stat({ label, value, sub, tone = 'slate' }: { label: string; value: string | number; sub?: string; tone?: string }) {
  const tones: Record<string, string> = { slate: 'text-slate-800', rose: 'text-rose-600', amber: 'text-amber-600', emerald: 'text-emerald-600', indigo: 'text-indigo-600' }
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function Qd72BaoCaoPage() {
  const auth = await getQd72Auth()
  if (!auth) redirect('/login')
  const wardScope = auth.vaiTro === 'XA_PHUONG' ? auth.wardId : null
  const bc = await baoCaoTongHop(wardScope)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-5">
        <Link href="/dashboard/qd72" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-1"><ArrowLeft className="w-4 h-4" /> Danh sách hồ sơ</Link>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-600" /> Báo cáo tổng hợp QĐ72</h1>
        <p className="text-slate-600 mt-1 text-sm">
          {wardScope ? 'Phạm vi: địa bàn của bạn.' : 'Phạm vi: toàn tỉnh.'} Ngưỡng đánh giá lấy từ bảng tiêu chí:
          rộng ≥ {bc.nguongRongM} m, cao ≥ {bc.nguongCaoM} m. Số liệu <b>sơ bộ</b> — cần đơn vị chuyên môn xác minh.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Tổng hồ sơ khảo sát" value={bc.soHoSo} tone="indigo" />
        <Stat label="Đoạn đường không đạt bề rộng" value={bc.soDuongKhongDatRong} sub={`Tổng dài ${bc.tongDaiKhongDatRongM.toLocaleString('vi-VN')} m`} tone="rose" />
        <Stat label="Điểm chiều cao < ngưỡng" value={bc.soDiemDuoiChieuCao} sub="đường + dây/cáp" tone="rose" />
        <Stat label="Cáp không rõ chủ sở hữu" value={bc.soCapKhongRoChuSoHuu} tone="amber" />
        <Stat label="Cáp ngừng sử dụng" value={bc.soCapNgungSuDung} tone="amber" />
        <Stat label="Tổng tuyến dây/cáp" value={bc.soTuyenDayCap} />
        <Stat label="Tổng đoạn đường" value={bc.soDoanDuong} />
        <Stat label="Số cột" value={bc.soCot} />
        <Stat label="Nguồn nước" value={bc.soNguonNuoc} />
        <Stat label="Trụ nước chữa cháy" value={bc.soTruNuoc} tone="emerald" />
        <Stat label="Kế hoạch chỉnh trang" value={bc.soKeHoachChinhTrang} tone="indigo" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="font-semibold text-slate-800 mb-2 text-sm">Hồ sơ theo trạng thái</p>
          {Object.keys(bc.hoSoTheoTrangThai).length === 0 ? <p className="text-sm text-slate-400">Chưa có dữ liệu.</p> : (
            <div className="space-y-1.5">
              {Object.entries(bc.hoSoTheoTrangThai).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm"><span className="text-slate-600">{TT_TEN[k] ?? k}</span><b className="text-slate-800">{v}</b></div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="font-semibold text-slate-800 mb-2 text-sm">Hồ sơ theo nhóm đánh giá sơ bộ</p>
          {Object.keys(bc.hoSoTheoNhomDanhGia).length === 0 ? <p className="text-sm text-slate-400">Chưa đánh giá hồ sơ nào.</p> : (
            <div className="space-y-1.5">
              {Object.entries(bc.hoSoTheoNhomDanhGia).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm"><span className="text-slate-600">{NHOM_TEN[k] ?? k}</span><b className="text-slate-800">{v}</b></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
