'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Boxes, Loader2, Download, CheckCircle2, XCircle, AlertTriangle,
  ShieldCheck, Archive, FileBox, ArrowLeft,
} from 'lucide-react'

type Check = { id: string; checkCode: string; ketQua: string; chiTiet?: Record<string, unknown> }
type BFile = { id: string; kind: string; tenFile: string; dinhDang: string; schemaVersion: string | null; dungLuongByte: string; sha256: string; validationChecks: Check[] }
type Review = { id: string; noiDung: string; ketLuan: string; yeuCauBoSung: string | null; vanBanSo: string | null; createdAt: string }
type Version = {
  id: string; versionNo: number; maContainer: string; stage: string; lodChinh: string
  cdeStatus: string; ngayTiepNhan: string; nguoiNopTen: string | null; nguoiNopDonVi: string | null
  ghiChuNop: string | null; publishedAt: string | null
  files: BFile[]; consistencyReviews: Review[]
}
type Model = {
  id: string; maMoHinh: string; ten: string; moTa: string | null; discipline: string
  capCongTrinh: string | null; nguonVon: string | null; batBuocBim: boolean
  diaChi: string | null; soGiayPhep: string | null; soQuyetDinhThamDinh: string | null
  versions: Version[]
}

const CDE_BADGE: Record<string, { label: string; cls: string }> = {
  SHARED: { label: 'Đang thẩm định (SHARED)', cls: 'bg-amber-100 text-amber-800' },
  PUBLISHED: { label: 'Đã công bố (PUBLISHED)', cls: 'bg-green-100 text-green-800' },
  ARCHIVED: { label: 'Lưu trữ (ARCHIVED)', cls: 'bg-slate-100 text-slate-600' },
}
const KET_LUAN_LABEL: Record<string, string> = {
  NHAT_QUAN: '✅ Nhất quán',
  KHONG_NHAT_QUAN: '❌ Không nhất quán',
  NHAT_QUAN_CO_DIEU_KIEN: '⚠️ Nhất quán có điều kiện',
}

function fmtMB(b: string) { return (Number(b) / 1024 / 1024).toFixed(1) + ' MB' }

export default function BimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reviewForm, setReviewForm] = useState({ open: false, noiDung: '', ketLuan: 'NHAT_QUAN', yeuCauBoSung: '', vanBanSo: '' })

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bim/models/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi tải dữ liệu')
      setModel(data.model)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function publish(versionId: string) {
    if (!confirm('Công bố phiên bản này? Sau khi công bố sẽ KHÓA chỉnh sửa (CDE PUBLISHED) và các bản công bố cũ chuyển lưu trữ.')) return
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/bim/versions/${versionId}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi công bố')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally { setBusy(false) }
  }

  async function submitReview(versionId: string) {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/bim/versions/${versionId}/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noiDung: reviewForm.noiDung, ketLuan: reviewForm.ketLuan,
          yeuCauBoSung: reviewForm.yeuCauBoSung || undefined,
          vanBanSo: reviewForm.vanBanSo || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu đánh giá')
      setReviewForm({ open: false, noiDung: '', ketLuan: 'NHAT_QUAN', yeuCauBoSung: '', vanBanSo: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally { setBusy(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  if (!model) return <div className="text-red-600">{error || 'Không tìm thấy mô hình'}</div>

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/dashboard/bim" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Danh sách mô hình
      </Link>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-6 h-6 text-blue-600" /> {model.maMoHinh} — {model.ten}
            </h1>
            {model.moTa && <p className="text-sm text-slate-500 mt-1">{model.moTa}</p>}
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {model.capCongTrinh && <span className="px-2 py-1 bg-slate-100 rounded">{model.capCongTrinh.replace('CAP_', 'Cấp ').replace('DAC_BIET', 'đặc biệt')}</span>}
              {model.nguonVon && <span className="px-2 py-1 bg-slate-100 rounded">{model.nguonVon.replace(/_/g, ' ')}</span>}
              {model.batBuocBim && <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">BIM bắt buộc (QĐ 258/QĐ-TTg)</span>}
              {model.soGiayPhep && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">GPXD: {model.soGiayPhep}</span>}
              {model.soQuyetDinhThamDinh && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">QĐ TĐ: {model.soQuyetDinhThamDinh}</span>}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {model.versions.map((v) => {
        const badge = CDE_BADGE[v.cdeStatus]
        return (
          <div key={v.id} className="bg-white rounded-xl border">
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">
                  Phiên bản {v.versionNo} · <span className="font-mono text-sm">{v.maContainer}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {v.stage.replace(/_/g, ' ')} · {v.lodChinh.replace('_', ' ')} · Tiếp nhận {new Date(v.ngayTiepNhan).toLocaleDateString('vi-VN')}
                  {v.nguoiNopDonVi && <> · TV: {v.nguoiNopDonVi}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                {v.cdeStatus === 'SHARED' && (
                  <>
                    <button onClick={() => publish(v.id)} disabled={busy}
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" /> Công bố
                    </button>
                    <button onClick={() => setReviewForm((f) => ({ ...f, open: !f.open }))}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                      Đánh giá nhất quán
                    </button>
                  </>
                )}
                {v.cdeStatus === 'ARCHIVED' && <Archive className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {reviewForm.open && v.cdeStatus === 'SHARED' && (
              <div className="p-4 border-b bg-slate-50 space-y-3">
                <textarea
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3} placeholder="Nội dung đánh giá tính nhất quán mô hình BIM với kết quả tính toán, thiết kế (NĐ 175/2024 — bắt buộc với cấp I, đặc biệt)..."
                  value={reviewForm.noiDung} onChange={(e) => setReviewForm((f) => ({ ...f, noiDung: e.target.value }))}
                />
                <div className="flex flex-wrap gap-3">
                  <select className="h-9 px-3 text-sm border rounded-lg bg-white"
                    value={reviewForm.ketLuan} onChange={(e) => setReviewForm((f) => ({ ...f, ketLuan: e.target.value }))}>
                    <option value="NHAT_QUAN">Nhất quán</option>
                    <option value="NHAT_QUAN_CO_DIEU_KIEN">Nhất quán có điều kiện</option>
                    <option value="KHONG_NHAT_QUAN">Không nhất quán</option>
                  </select>
                  <input className="h-9 px-3 text-sm border rounded-lg flex-1 min-w-40" placeholder="Số văn bản kết quả thẩm định (nếu có)"
                    value={reviewForm.vanBanSo} onChange={(e) => setReviewForm((f) => ({ ...f, vanBanSo: e.target.value }))} />
                  <button onClick={() => submitReview(v.id)} disabled={busy || !reviewForm.noiDung.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg">
                    Lưu đánh giá
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y">
              {v.files.length === 0 && (
                <p className="p-4 text-sm text-slate-400 flex items-center gap-2"><FileBox className="w-4 h-4" /> Chưa có tệp</p>
              )}
              {v.files.map((f) => (
                <div key={f.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {f.tenFile}
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-slate-100 rounded">{f.kind}</span>
                      {f.schemaVersion && <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{f.schemaVersion}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {fmtMB(f.dungLuongByte)} · SHA-256: {f.sha256.slice(0, 16)}...
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {f.validationChecks.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 text-xs">
                          {c.ketQua === 'PASS' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                          {c.ketQua === 'FAIL' && <XCircle className="w-3 h-3 text-red-600" />}
                          {c.ketQua === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          <span className="text-slate-500">{c.checkCode}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <a href={`/api/bim/files/${f.id}/download`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg shrink-0">
                    <Download className="w-3.5 h-3.5" /> Tải về
                  </a>
                </div>
              ))}
            </div>

            {v.consistencyReviews.length > 0 && (
              <div className="p-4 border-t bg-slate-50 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Đánh giá tính nhất quán (NĐ 175/2024)</p>
                {v.consistencyReviews.map((r) => (
                  <div key={r.id} className="text-sm">
                    <span className="font-medium">{KET_LUAN_LABEL[r.ketLuan] || r.ketLuan}</span>
                    {r.vanBanSo && <span className="text-xs text-slate-500 ml-2">VB số {r.vanBanSo}</span>}
                    <p className="text-slate-600 text-xs mt-0.5">{r.noiDung}</p>
                    {r.yeuCauBoSung && <p className="text-amber-700 text-xs mt-0.5">Yêu cầu bổ sung: {r.yeuCauBoSung}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
