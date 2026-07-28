import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Plus, Route, ChevronRight, Waves, Droplets, Cable, Ruler, MapPin } from 'lucide-react'

const LOAI_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CONG_THOAT_NUOC: { label: 'Cống thoát nước', color: 'bg-indigo-100 text-indigo-700', icon: Waves },
  ONG_CAP_NUOC:    { label: 'Ống cấp nước',    color: 'bg-cyan-100 text-cyan-700',    icon: Droplets },
  CAP_VIEN_THONG:  { label: 'Cáp viễn thông',  color: 'bg-amber-100 text-amber-700',  icon: Cable },
}

export default async function TuyenMangLuoiPage() {
  await requireAuth()

  const tuyens = await db.tuyenMangLuoi.findMany({
    include: {
      ward: { select: { name: true } },
      nhaMayXuLy: { select: { ten: true } },
      tramBom: { select: { ten: true } },
      doanCong: { include: { street: { select: { name: true } } }, orderBy: { thuTu: 'asc' } },
      doanOng:  { include: { street: { select: { name: true } } }, orderBy: { thuTu: 'asc' } },
    },
    orderBy: { maTuyen: 'asc' },
  })

  const stats = {
    total: tuyens.length,
    cong: tuyens.filter(t => t.loai === 'CONG_THOAT_NUOC').length,
    ong:  tuyens.filter(t => t.loai === 'ONG_CAP_NUOC').length,
    cap:  tuyens.filter(t => t.loai === 'CAP_VIEN_THONG').length,
    tongDai: tuyens.reduce((s, t) => s + (t.chieuDaiTongM ?? 0), 0),
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700">Tài sản hạ tầng</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Tuyến mạng lưới</span>
      </nav>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            Hệ thống Tuyến mạng lưới hạ tầng
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tuyến cống, ống, cáp — đi từ điểm A → qua nhiều đoạn đường → đến điểm B
          </p>
        </div>
        <Link href="/dashboard/ha-tang/tuyen-mang-luoi/moi"
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800">
          <Plus className="w-4 h-4" />Thêm tuyến
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Tổng tuyến', value: stats.total, color: 'text-slate-800' },
          { label: 'Thoát nước', value: stats.cong, color: 'text-indigo-700' },
          { label: 'Cấp nước',   value: stats.ong,  color: 'text-cyan-700' },
          { label: 'Viễn thông', value: stats.cap,  color: 'text-amber-700' },
          { label: 'Tổng chiều dài', value: `${(stats.tongDai/1000).toFixed(1)} km`, color: 'text-green-700' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Danh sách tuyến */}
      {tuyens.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-3">
          <Route className="w-14 h-14 text-slate-200 mx-auto" />
          <p className="font-semibold text-slate-500">Chưa có tuyến mạng lưới nào</p>
          <p className="text-sm text-slate-400">Thêm tuyến cống/ống/cáp đi qua nhiều đoạn đường</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tuyens.map(t => {
            const meta = LOAI_META[t.loai] ?? { label: t.loai, color: 'bg-slate-100 text-slate-600', icon: Route }
            const Icon = meta.icon
            const doanList = t.loai === 'ONG_CAP_NUOC' ? t.doanOng : t.doanCong
            return (
              <div key={t.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${meta.color.replace('text-','bg-').replace('700','100')}`}>
                    <Icon className={`w-5 h-5 ${meta.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{t.tenTuyen}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-slate-400 font-mono">{t.maTuyen}</span>
                    </div>

                    {/* Điểm đầu → các đoạn đường → điểm cuối */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs text-slate-600">
                      {t.diemBatDau && (
                        <span className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                          <MapPin className="w-3 h-3 text-green-600" />{t.diemBatDau}
                        </span>
                      )}
                      {doanList.length > 0 && <span className="text-slate-400">→</span>}
                      {doanList.map((d, i) => (
                        <span key={d.id} className="flex items-center gap-1">
                          <span className="bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                            <Ruler className="w-3 h-3 inline text-blue-500 mr-0.5" />
                            {d.street.name}
                            <span className="text-slate-400 ml-1">
                              Km{(d.lyTrinhTuM/1000).toFixed(2)}+{String(Math.round(d.lyTrinhTuM%1000)).padStart(3,'0')}
                              {' → '}
                              Km{(d.lyTrinhDenM/1000).toFixed(2)}+{String(Math.round(d.lyTrinhDenM%1000)).padStart(3,'0')}
                            </span>
                          </span>
                          {i < doanList.length - 1 && <span className="text-slate-400">→</span>}
                        </span>
                      ))}
                      {t.diemKetThuc && (
                        <>
                          <span className="text-slate-400">→</span>
                          <span className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-0.5">
                            <MapPin className="w-3 h-3 text-red-600" />{t.diemKetThuc}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      {t.chieuDaiTongM && <span>Tổng: <strong className="text-slate-700">{(t.chieuDaiTongM/1000).toFixed(2)} km</strong></span>}
                      {doanList.length > 0 && <span>{doanList.length} đoạn đường</span>}
                      {t.ward && <span>{t.ward.name}</span>}
                      {t.nhaMayXuLy && <span>→ {t.nhaMayXuLy.ten}</span>}
                      {t.tramBom && <span>Trạm bơm: {t.tramBom.ten}</span>}
                    </div>
                  </div>
                  <Link href={`/dashboard/ha-tang/tuyen-mang-luoi/${t.id}`}
                    className="text-xs font-semibold text-blue-600 hover:underline shrink-0">
                    Chi tiết →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
