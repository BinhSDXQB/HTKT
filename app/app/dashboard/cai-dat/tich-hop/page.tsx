import { requireAuth } from '@/lib/auth'
import { getIntegrationConfig, HTKT_DOMAINS } from '@/lib/congdanso-client'
import { db } from '@/lib/db'
import { Settings, Link2, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { IntegrationConfigForm } from '@/components/cai-dat/integration-config-form'

const DOMAIN_LABEL: Record<string, string> = {
  GIAO_THONG:          'Giao thông',
  XAY_DUNG:            'Xây dựng',
  HA_TANG_KY_THUAT:    'Hạ tầng kỹ thuật',
  CAP_NUOC:            'Cấp nước',
  THOAT_NUOC:          'Thoát nước',
  CHIEU_SANG:          'Chiếu sáng',
  CAY_XANH:            'Cây xanh',
}

export default async function TichHopPage() {
  await requireAuth()
  const cfg = await getIntegrationConfig()

  const logs = await db.integrationLog.findMany({
    where: { source: 'congdanso' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const totalSynced = await db.incident.count({
    where: { description: { contains: '[CDS:' } },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-600" />
          Tích hợp Cổng Công dân số Quảng Trị
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Đồng bộ phản ánh / sự cố từ{' '}
          <a href="https://congdanso.quangtri.gov.vn" target="_blank" rel="noreferrer"
            className="text-blue-600 hover:underline">congdanso.quangtri.gov.vn</a>{' '}
          vào hệ thống HTKT — chỉ lấy lĩnh vực Giao thông, Xây dựng, Hạ tầng kỹ thuật
        </p>
      </div>

      {/* Trạng thái */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 ${cfg.enabled ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            {cfg.enabled
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <XCircle className="w-4 h-4 text-slate-400" />}
            <p className="text-xs font-semibold text-slate-700">Trạng thái</p>
          </div>
          <p className={`text-lg font-bold ${cfg.enabled ? 'text-green-700' : 'text-slate-500'}`}>
            {cfg.enabled ? 'Đang bật' : 'Tắt'}
          </p>
        </div>
        <div className="rounded-xl border bg-blue-50 border-blue-200 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-1">Đã đồng bộ</p>
          <p className="text-lg font-bold text-blue-700">{totalSynced} sự cố</p>
          <p className="text-xs text-slate-400">từ Cổng Công dân</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-1">Lần cuối đồng bộ</p>
          <p className="text-sm font-semibold text-slate-700">
            {cfg.lastSyncAt ? new Date(cfg.lastSyncAt).toLocaleString('vi-VN') : '—'}
          </p>
        </div>
      </div>

      {/* Cảnh báo cần API key */}
      {(!cfg.clientId || !cfg.clientSecret) && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Chưa có thông tin xác thực API
          </div>
          <p className="text-sm text-amber-700">
            Để kích hoạt tích hợp, cần liên hệ Ban quản lý Cổng Công dân số tỉnh Quảng Trị
            để được cấp <strong>Client ID</strong> và <strong>Client Secret</strong>.
          </p>
          <div className="mt-3 bg-white rounded-lg border border-amber-200 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Thông tin đề nghị cấp:</p>
            <p>• Tên hệ thống: <strong>Quản lý Hạ tầng Kỹ thuật — Sở Xây dựng Quảng Trị</strong></p>
            <p>• Mục đích: Đồng bộ phản ánh lĩnh vực Giao thông, Xây dựng, Hạ tầng kỹ thuật</p>
            <p>• URL hệ thống: <strong>https://qlhtkt.htkt.com.vn</strong></p>
            <p>• Lĩnh vực cần truy cập: GIAO_THONG, XAY_DUNG, HA_TANG_KY_THUAT, CAP_NUOC, THOAT_NUOC</p>
          </div>
        </div>
      )}

      {/* Form cấu hình */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />Cấu hình kết nối
        </h2>
        <IntegrationConfigForm cfg={cfg} htktDomains={HTKT_DOMAINS} domainLabel={DOMAIN_LABEL} />
      </div>

      {/* Lịch sử đồng bộ */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />Lịch sử đồng bộ
          </h2>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-green-500' : log.status === 'partial' ? 'bg-orange-400' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600">{log.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.action === 'sync' ? 'Đồng bộ' : 'Test kết nối'} —{' '}
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {log.recordCount > 0 && (
                  <span className="text-xs font-semibold text-blue-600 shrink-0">+{log.recordCount}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
