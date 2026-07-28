'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, CheckCircle2, XCircle, AlertTriangle, Boxes } from 'lucide-react'

type CheckResult = { checkCode: string; ketQua: 'PASS' | 'FAIL' | 'WARNING'; chiTiet?: Record<string, unknown> }
type UploadedFile = { tenFile: string; kind: string; checks: CheckResult[] }

const CHECK_LABEL: Record<string, string> = {
  FILE_SIZE_500MB: 'Dung lượng ≤ 500MB (NĐ 175/2024)',
  IFC_SCHEMA_VALID: 'Định dạng IFC 4.0',
}

export default function BimTiepNhanPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modelId, setModelId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [maMoHinh, setMaMoHinh] = useState('')
  const [uploaded, setUploaded] = useState<UploadedFile[]>([])
  const [uploadPct, setUploadPct] = useState<number | null>(null)

  // Bước 1: thông tin mô hình + phiên bản đầu
  const [form, setForm] = useState({
    ten: '', moTa: '', discipline: 'TONG_HOP',
    capCongTrinh: '', nguonVon: '', diaChi: '',
    soGiayPhep: '', soQuyetDinhThamDinh: '',
    stage: 'TK_KY_THUAT', lodChinh: 'LOD_300',
    nguoiNopTen: '', nguoiNopDonVi: '', ghiChuNop: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function createModelAndVersion() {
    setBusy(true); setError('')
    try {
      const res1 = await fetch('/api/bim/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ten: form.ten, moTa: form.moTa || undefined, discipline: form.discipline,
          capCongTrinh: form.capCongTrinh || undefined, nguonVon: form.nguonVon || undefined,
          diaChi: form.diaChi || undefined,
          soGiayPhep: form.soGiayPhep || undefined,
          soQuyetDinhThamDinh: form.soQuyetDinhThamDinh || undefined,
        }),
      })
      const d1 = await res1.json()
      if (!res1.ok) throw new Error(d1.error || 'Lỗi tạo mô hình')

      const res2 = await fetch(`/api/bim/models/${d1.model.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: form.stage, lodChinh: form.lodChinh,
          nguoiNopTen: form.nguoiNopTen || undefined,
          nguoiNopDonVi: form.nguoiNopDonVi || undefined,
          ghiChuNop: form.ghiChuNop || undefined,
        }),
      })
      const d2 = await res2.json()
      if (!res2.ok) throw new Error(d2.error || 'Lỗi tạo phiên bản')

      setModelId(d1.model.id)
      setMaMoHinh(d1.model.maMoHinh)
      setVersionId(d2.version.id)
      setStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally {
      setBusy(false)
    }
  }

  async function uploadFile(kind: string, file: File) {
    setBusy(true); setError(''); setUploadPct(0)
    try {
      if (file.size > 500 * 1024 * 1024) throw new Error('Tệp vượt 500MB — NĐ 175/2024 không cho phép')

      // XHR để có tiến độ upload (fetch chưa hỗ trợ upload progress rộng rãi)
      const result = await new Promise<{ ok: boolean; data: { error?: string; checks?: CheckResult[] } }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', `/api/bim/versions/${versionId}/upload?kind=${kind}&fileName=${encodeURIComponent(file.name)}`)
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100)) }
        xhr.onload = () => resolve({ ok: xhr.status < 300, data: JSON.parse(xhr.responseText || '{}') })
        xhr.onerror = () => reject(new Error('Lỗi mạng khi upload'))
        xhr.send(file)
      })
      if (!result.ok) throw new Error(result.data.error || 'Lỗi upload')
      setUploaded((u) => [...u, { tenFile: file.name, kind, checks: result.data.checks || [] }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally {
      setBusy(false); setUploadPct(null)
    }
  }

  const inputCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'text-sm font-medium text-slate-700'

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Boxes className="w-7 h-7 text-blue-600" /> Tiếp nhận mô hình BIM
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className={labelCls}>Tên công trình / mô hình *</label>
              <input className={inputCls} value={form.ten} onChange={(e) => set('ten', e.target.value)} placeholder="VD: Hệ thống thoát nước đường Hùng Vương" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Bộ môn</label>
              <select className={inputCls} value={form.discipline} onChange={(e) => set('discipline', e.target.value)}>
                <option value="TONG_HOP">Tổng hợp (federated)</option>
                <option value="KIEN_TRUC">Kiến trúc</option>
                <option value="KET_CAU">Kết cấu</option>
                <option value="CO_DIEN">Cơ điện (MEP)</option>
                <option value="HA_TANG_GIAO_THONG">Hạ tầng giao thông</option>
                <option value="CAP_THOAT_NUOC">Cấp thoát nước</option>
                <option value="CHIEU_SANG">Chiếu sáng</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Cấp công trình</label>
              <select className={inputCls} value={form.capCongTrinh} onChange={(e) => set('capCongTrinh', e.target.value)}>
                <option value="">— Chọn —</option>
                <option value="CAP_DAC_BIET">Cấp đặc biệt</option>
                <option value="CAP_I">Cấp I</option>
                <option value="CAP_II">Cấp II</option>
                <option value="CAP_III">Cấp III</option>
                <option value="CAP_IV">Cấp IV</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Nguồn vốn</label>
              <select className={inputCls} value={form.nguonVon} onChange={(e) => set('nguonVon', e.target.value)}>
                <option value="">— Chọn —</option>
                <option value="DAU_TU_CONG">Đầu tư công</option>
                <option value="VON_NN">Vốn NN ngoài đầu tư công</option>
                <option value="PPP">PPP</option>
                <option value="VON_KHAC">Vốn khác</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Địa chỉ công trình</label>
              <input className={inputCls} value={form.diaChi} onChange={(e) => set('diaChi', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Giai đoạn nộp</label>
              <select className={inputCls} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                <option value="NCTKT">Tiền khả thi (LOD 100)</option>
                <option value="NCKT_TKCS">NCKT / TK cơ sở (LOD 200)</option>
                <option value="TK_KY_THUAT">TK kỹ thuật (LOD 300)</option>
                <option value="TK_BAN_VE_THI_CONG">Bản vẽ thi công (LOD 400)</option>
                <option value="HOAN_CONG">Hoàn công (LOD 500)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>LOD chủ đạo</label>
              <select className={inputCls} value={form.lodChinh} onChange={(e) => set('lodChinh', e.target.value)}>
                {['LOD_100', 'LOD_200', 'LOD_300', 'LOD_350', 'LOD_400', 'LOD_500'].map((l) => (
                  <option key={l} value={l}>{l.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Người nộp (đại diện CĐT)</label>
              <input className={inputCls} value={form.nguoiNopTen} onChange={(e) => set('nguoiNopTen', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Đơn vị tư vấn lập mô hình</label>
              <input className={inputCls} value={form.nguoiNopDonVi} onChange={(e) => set('nguoiNopDonVi', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Số GPXD (nếu có)</label>
              <input className={inputCls} value={form.soGiayPhep} onChange={(e) => set('soGiayPhep', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Số QĐ thẩm định (nếu có)</label>
              <input className={inputCls} value={form.soQuyetDinhThamDinh} onChange={(e) => set('soQuyetDinhThamDinh', e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className={labelCls}>Ghi chú</label>
              <input className={inputCls} value={form.ghiChuNop} onChange={(e) => set('ghiChuNop', e.target.value)} />
            </div>
          </div>
          <button
            onClick={createModelAndVersion}
            disabled={busy || !form.ten.trim()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Tạo hồ sơ &amp; chuyển bước upload
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            Đã tạo mô hình <strong>{maMoHinh}</strong>. Tải tệp lên — theo NĐ 175/2024 cần <strong>cả định dạng gốc và IFC 4.0</strong>.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([['IFC', 'Tệp IFC 4.0 *', '.ifc,.ifczip'], ['GOC', 'Tệp gốc (RVT/DGN...)', '.rvt,.rfa,.dgn,.pln,.skp,.nwd,.nwc,.dwg,.dxf,.3dm'], ['PHU_TRO', 'Phụ trợ (BEP/PDF...)', '.bcf,.bcfzip,.pdf,.docx,.xlsx,.zip,.png,.jpg']] as const).map(([kind, label, accept]) => (
            <label key={kind} className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 p-5 text-center cursor-pointer transition-colors">
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-1">{accept.split(',').slice(0, 4).join(' ')}</p>
              <input
                type="file" className="hidden" accept={accept} disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(kind, f); e.target.value = '' }}
              />
            </label>
            ))}
          </div>

          {uploadPct !== null && (
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lên... {uploadPct}%
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}

          {uploaded.length > 0 && (
            <div className="bg-white rounded-xl border divide-y">
              {uploaded.map((f, i) => (
                <div key={i} className="p-4">
                  <p className="font-medium text-sm text-slate-800">{f.tenFile} <span className="text-xs text-slate-400">({f.kind})</span></p>
                  <div className="mt-2 space-y-1">
                    {f.checks.map((c) => (
                      <div key={c.checkCode} className="flex items-center gap-2 text-xs">
                        {c.ketQua === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                        {c.ketQua === 'FAIL' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                        {c.ketQua === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="text-slate-600">{CHECK_LABEL[c.checkCode] || c.checkCode}</span>
                        <span className={c.ketQua === 'PASS' ? 'text-green-700 font-medium' : c.ketQua === 'FAIL' ? 'text-red-700 font-medium' : 'text-amber-700 font-medium'}>
                          {c.ketQua}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/dashboard/bim/${modelId}`)}
              disabled={uploaded.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm"
            >
              Hoàn tất — xem hồ sơ mô hình
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
