import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { BarChart3, Building2, AlertTriangle, Wrench, CheckCircle2, Clock, FileSpreadsheet, TrendingUp } from 'lucide-react'
import { DOMAIN_LABEL, CONDITION_LABEL, CONDITION_COLOR } from '@/lib/constants/tai-san'
import { INCIDENT_STATUS_LABEL } from '@/lib/constants/su-co'
import { WO_STATUS_LABEL } from '@/lib/constants/phieu-cv'
import { Badge } from '@/components/ui/badge'
import { ExportBaoCaoButton } from '@/components/bao-cao/export-button'

export default async function BaoCaoPage() {
  await requireAuth()

  const [
    assetsByDomain,
    assetsByCondition,
    incidentsByStatus,
    incidentsByDomain,
    woByStatus,
    recentIncidents,
  ] = await Promise.all([
    db.asset.groupBy({ by: ['domain'], _count: true, orderBy: { _count: { domain: 'desc' } } }),
    db.asset.groupBy({ by: ['condition'], _count: true, orderBy: { _count: { condition: 'desc' } } }),
    db.incident.groupBy({ by: ['status'], _count: true }),
    db.incident.groupBy({ by: ['domain'], where: { status: { in: ['MOI','DA_TIEP_NHAN','DANG_XU_LY'] } }, _count: true, orderBy: { _count: { domain: 'desc' } } }),
    db.workOrder.groupBy({ by: ['status'], _count: true }),
    db.incident.findMany({ orderBy: { reportedAt: 'desc' }, take: 5, select: { id: true, incidentCode: true, title: true, status: true, priority: true, reportedAt: true, domain: true } }),
  ])

  const totalAssets = assetsByDomain.reduce((s, r) => s + r._count, 0)
  const totalIncidents = incidentsByStatus.reduce((s, r) => s + r._count, 0)
  const openIncidents = incidentsByStatus.filter((r) => r.status !== 'DONG').reduce((s, r) => s + r._count, 0)
  const totalWO = woByStatus.reduce((s, r) => s + r._count, 0)
  // Đồng nhất với dashboard tổng quan: chỉ đếm MOI + DA_GIAO + DANG_THUC_HIEN
  const activeWO = woByStatus.filter((r) => ['MOI','DA_GIAO','DANG_THUC_HIEN'].includes(r.status)).reduce((s, r) => s + r._count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-600" />Báo cáo & Thống kê</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tổng hợp tình hình hạ tầng kỹ thuật — theo Quyết định 2597/QĐ-TTg</p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-3">
        <ExportBaoCaoButton />
        <Link href="/dashboard/bao-cao/tong-hop"
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors">
          <TrendingUp className="w-4 h-4" />Dashboard tổng hợp toàn tỉnh
        </Link>
        <Link href="/dashboard/bao-cao/du-lieu-phuong-xa"
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors">
          <FileSpreadsheet className="w-4 h-4" />Dữ liệu phường/xã
        </Link>
      </div>

      {/* KPI tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng tài sản', value: totalAssets, icon: Building2, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Sự cố đang mở', value: openIncidents, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Phiếu CV đang mở', value: activeWO, icon: Wrench, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Tổng sự cố', value: totalIncidents, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${k.bg} shrink-0`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
            <div><p className="text-xs text-slate-500">{k.label}</p><p className={`text-2xl font-bold ${k.color}`}>{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tài sản theo lĩnh vực */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" />Tài sản theo lĩnh vực</h3>
          <div className="space-y-2">
            {assetsByDomain.map((r) => {
              const pct = totalAssets > 0 ? Math.round((r._count / totalAssets) * 100) : 0
              return (
                <div key={r.domain} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-28 shrink-0">{DOMAIN_LABEL[r.domain]}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{r._count}</span>
                </div>
              )
            })}
            {assetsByDomain.length === 0 && <p className="text-xs text-slate-400">Chưa có dữ liệu</p>}
          </div>
        </div>

        {/* Tình trạng tài sản */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" />Tình trạng tài sản</h3>
          <div className="space-y-2">
            {assetsByCondition.map((r) => (
              <div key={r.condition} className="flex items-center justify-between py-1">
                <Badge className={`text-xs ${CONDITION_COLOR[r.condition]}`}>{CONDITION_LABEL[r.condition]}</Badge>
                <span className="text-sm font-semibold text-slate-800">{r._count} tài sản</span>
              </div>
            ))}
            {assetsByCondition.length === 0 && <p className="text-xs text-slate-400">Chưa có dữ liệu</p>}
          </div>
        </div>

        {/* Sự cố theo lĩnh vực (đang mở) */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-slate-400" />Sự cố đang mở theo lĩnh vực</h3>
          <div className="space-y-2">
            {incidentsByDomain.map((r) => (
              <div key={r.domain} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-600">{DOMAIN_LABEL[r.domain]}</span>
                <span className="text-sm font-semibold text-orange-600">{r._count}</span>
              </div>
            ))}
            {incidentsByDomain.length === 0 && <p className="text-xs text-slate-400 py-2">Không có sự cố đang mở</p>}
          </div>
        </div>

        {/* Phiếu CV theo trạng thái */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-400" />Phiếu CV theo trạng thái ({totalWO} tổng)</h3>
          <div className="space-y-2">
            {woByStatus.map((r) => (
              <div key={r.status} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-600">{WO_STATUS_LABEL[r.status]}</span>
                <span className="text-sm font-semibold text-slate-800">{r._count}</span>
              </div>
            ))}
            {woByStatus.length === 0 && <p className="text-xs text-slate-400">Chưa có dữ liệu</p>}
          </div>
        </div>
      </div>

      {/* Sự cố gần đây */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">Sự cố gần đây</h3>
        {recentIncidents.length === 0 ? <p className="text-xs text-slate-400">Chưa có sự cố</p> : (
          <div className="space-y-2">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <span className="text-xs font-mono text-slate-400 w-32 shrink-0">{inc.incidentCode}</span>
                <span className="text-sm text-slate-700 flex-1 truncate">{inc.title}</span>
                <span className="text-xs text-slate-400 shrink-0">{DOMAIN_LABEL[inc.domain]}</span>
                <Badge className={`text-xs shrink-0 ${inc.status === 'DONG' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{INCIDENT_STATUS_LABEL[inc.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
