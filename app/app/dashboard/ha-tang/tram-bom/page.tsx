import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Plus, ChevronRight, Settings } from 'lucide-react'

const LOAI_META: Record<string, { label: string; color: string }> = {
  THOAT_NUOC: { label: 'Thoát nước', color: 'bg-indigo-100 text-indigo-700' },
  CAP_NUOC:   { label: 'Cấp nước',   color: 'bg-cyan-100 text-cyan-700' },
  NUOC_THAI:  { label: 'Nước thải',  color: 'bg-orange-100 text-orange-700' },
  PHONG_CHAY: { label: 'Phòng cháy', color: 'bg-red-100 text-red-700' },
}

const TINH_TRANG_COLOR: Record<string, string> = {
  TOT: 'bg-green-100 text-green-700', KHA: 'bg-blue-100 text-blue-700',
  TRUNG_BINH: 'bg-yellow-100 text-yellow-700', XAU: 'bg-orange-100 text-orange-700', HU_HONG: 'bg-red-100 text-red-700',
}

export default async function TramBomPage() {
  await requireAuth()

  const tramBoms = await db.tramBom.findMany({
    include: {
      ward: { select: { name: true } },
      street: { select: { name: true } },
      nhaMayXuLy: { select: { ten: true } },
    },
    orderBy: { maCS: 'asc' },
  })

  const stats = {
    total: tramBoms.length,
    tongCongSuatKW: tramBoms.reduce((s, t) => s + ((t.soBom ?? 0) * (t.congSuatMoiBomKW ?? 0)), 0),
    tongLuuLuongM3h: tramBoms.reduce((s, t) => s + (t.luuLuongThietKeM3h ?? 0), 0),
    coMayPhat: tramBoms.filter(t => t.coMayPhatDuPhong).length,
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700">Tài sản hạ tầng</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Trạm bơm</span>
      </nav>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Hệ thống Trạm bơm
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Trạm bơm thoát nước / cấp nước / nước thải / phòng cháy</p>
        </div>
        <Link href="/dashboard/ha-tang/tram-bom/moi"
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800">
          <Plus className="w-4 h-4" />Thêm trạm bơm
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Tổng trạm bơm</p><p className="text-2xl font-bold text-slate-800">{stats.total}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Tổng công suất</p><p className="text-2xl font-bold text-blue-700">{stats.tongCongSuatKW.toLocaleString('vi-VN')} kW</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Tổng lưu lượng</p><p className="text-2xl font-bold text-cyan-700">{stats.tongLuuLuongM3h.toLocaleString('vi-VN')} m³/h</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-slate-500">Có máy phát dự phòng</p><p className="text-2xl font-bold text-green-700">{stats.coMayPhat}/{stats.total}</p></div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{tramBoms.length} trạm bơm</span>
        </div>
        {tramBoms.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Chưa có trạm bơm nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b text-xs text-slate-500">
              <th className="px-4 py-2.5 text-left">Mã / Tên</th>
              <th className="px-3 py-2.5 text-center">Loại</th>
              <th className="px-3 py-2.5 text-center">Số bơm</th>
              <th className="px-3 py-2.5 text-center">Công suất</th>
              <th className="px-3 py-2.5 text-center">Lưu lượng</th>
              <th className="px-3 py-2.5 text-left">Vị trí</th>
              <th className="px-3 py-2.5 text-center">Tình trạng</th>
              <th className="px-3 py-2.5 w-12"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {tramBoms.map(t => {
                const loaiMeta = LOAI_META[t.loai] ?? { label: t.loai, color: 'bg-slate-100 text-slate-600' }
                const ttColor = TINH_TRANG_COLOR[t.tinhTrang] ?? 'bg-slate-100 text-slate-600'
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{t.ten}</p>
                      <p className="text-xs text-slate-400 font-mono">{t.maCS}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${loaiMeta.color}`}>{loaiMeta.label}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold">{t.soBom ?? '—'}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{t.congSuatMoiBomKW ? `${t.congSuatMoiBomKW} kW` : '—'}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{t.luuLuongThietKeM3h ? `${t.luuLuongThietKeM3h} m³/h` : '—'}</td>
                    <td className="px-3 py-3 text-slate-600 text-xs">
                      {t.street?.name ?? ''}{t.ward?.name ? ` · ${t.ward.name}` : ''}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ttColor}`}>{t.tinhTrang}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link href={`/dashboard/ha-tang/tram-bom/${t.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline">Xem →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
