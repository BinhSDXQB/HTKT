import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Plus, ChevronRight, Factory, MapPin } from 'lucide-react'

const TINH_TRANG_COLOR: Record<string, string> = {
  TOT: 'bg-green-100 text-green-700', KHA: 'bg-blue-100 text-blue-700',
  TRUNG_BINH: 'bg-yellow-100 text-yellow-700', XAU: 'bg-orange-100 text-orange-700',
}

export default async function NhaMayXuLyPage() {
  await requireAuth()

  const nhaMays = await db.nhaMayXuLyNuocThai.findMany({
    include: {
      ward: { select: { name: true } },
      tramBom: { select: { id: true, ten: true } },
      tuyenDanVao: { select: { id: true, tenTuyen: true, chieuDaiTongM: true } },
    },
    orderBy: { maCS: 'asc' },
  })

  const tongCongSuat = nhaMays.reduce((s, n) => s + (n.congSuatThietKeM3Ngay ?? 0), 0)
  const tongHienTai  = nhaMays.reduce((s, n) => s + (n.congSuatHienTaiM3Ngay ?? 0), 0)

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700">Tài sản hạ tầng</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Nhà máy xử lý nước thải</span>
      </nav>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-600" />
            Nhà máy Xử lý Nước thải
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Các cơ sở xử lý nước thải đô thị và công nghiệp</p>
        </div>
        <Link href="/dashboard/ha-tang/nha-may-xu-ly/moi"
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800">
          <Plus className="w-4 h-4" />Thêm nhà máy
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Số nhà máy</p><p className="text-3xl font-bold text-blue-700">{nhaMays.length}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Tổng CS thiết kế</p><p className="text-2xl font-bold text-cyan-700">{tongCongSuat.toLocaleString('vi-VN')} m³/ngày</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Tổng CS hiện tại</p><p className="text-2xl font-bold text-green-700">{tongHienTai.toLocaleString('vi-VN')} m³/ngày</p></div>
      </div>

      {nhaMays.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-3">
          <Factory className="w-14 h-14 text-slate-200 mx-auto" />
          <p className="font-semibold text-slate-500">Chưa có nhà máy xử lý nước thải nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nhaMays.map(n => (
            <div key={n.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">{n.ten}</h3>
                    <span className="text-xs font-mono text-slate-400">{n.maCS}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TINH_TRANG_COLOR[n.tinhTrang] ?? 'bg-slate-100 text-slate-600'}`}>{n.tinhTrang}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{n.diaChi ?? n.ward?.name ?? '—'}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-cyan-50 rounded-lg p-2.5">
                      <p className="text-slate-500">CS thiết kế</p>
                      <p className="font-bold text-cyan-700">{n.congSuatThietKeM3Ngay?.toLocaleString('vi-VN') ?? '—'} m³/ng</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2.5">
                      <p className="text-slate-500">CS hiện tại</p>
                      <p className="font-bold text-green-700">{n.congSuatHienTaiM3Ngay?.toLocaleString('vi-VN') ?? '—'} m³/ng</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2.5">
                      <p className="text-slate-500">Công nghệ</p>
                      <p className="font-bold text-blue-700">{n.congNghe ?? '—'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-slate-500">Tiêu chuẩn xả</p>
                      <p className="font-bold text-slate-700">{n.tieuchuanXaThai ?? '—'}</p>
                    </div>
                  </div>

                  {/* Trạm bơm + Tuyến dẫn vào */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {n.tramBom.length > 0 && (
                      <span className="bg-indigo-50 border border-indigo-200 rounded px-2 py-1 text-indigo-700">
                        {n.tramBom.length} Trạm bơm: {n.tramBom.map(t => t.ten).join(', ')}
                      </span>
                    )}
                    {n.tuyenDanVao.length > 0 && (
                      <span className="bg-amber-50 border border-amber-200 rounded px-2 py-1 text-amber-700">
                        {n.tuyenDanVao.length} tuyến dẫn vào
                      </span>
                    )}
                    {n.noiXaThai && (
                      <span className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        Xả thải: {n.noiXaThai}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/dashboard/ha-tang/nha-may-xu-ly/${n.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline shrink-0">
                  Chi tiết →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
