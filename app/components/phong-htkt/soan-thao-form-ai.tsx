'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Zap, Copy, Loader2 } from 'lucide-react'
import {
  autoFillTuQuyMo,
  smartPredictLoaiCongTrinh,
  generateOpenAIPrompt,
  type FormSoanThaoData,
  type QuyMoCongTrinh,
} from '@/lib/htkt/ai-auto-fill'
import { LINH_VUC_HTKT } from '@/lib/htkt/phap-ly'
import { CanCuPhapLyChiTiet } from './can-cu-phap-ly-chi-tiet'

type LinhVucSoanThao = 'cap-nuoc' | 'thoat-nuoc' | 'cay-xanh' | 'chieu-sang' | 'nghia-trang' | 'giao-thong-do-thi' | 'khong-gian-ngam' | 'su-dung-chung'

/** Dữ liệu mồi từ bước Kiểm kê hồ sơ (trang gộp) đổ sang. Mọi trường tùy chọn. */
export type SoanThaoSeed = Partial<{
  linhVuc: LinhVucSoanThao
  quyMo: QuyMoCongTrinh
  thamDinhType: 'bcnckt' | 'bcktkt' | 'thiet-ke' | 'nghiem-thu'
  tenDuAn: string
  loaiCongTrinh: string
  capCongTrinh: 'I' | 'II' | 'III' | 'IV'
}>

export function SoanThaoFormAI({ seed, embedded = false, onDirtyChange }: {
  seed?: SoanThaoSeed
  embedded?: boolean
  /** Báo cho trang gộp biết form đang có dữ liệu người dùng nhập dở, để cảnh báo trước khi ghi đè. */
  onDirtyChange?: (dirty: boolean) => void
} = {}) {
  const [step, setStep] = useState<'input' | 'preview' | 'result'>('input')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [error, setError] = useState('')

  // Form state — khởi tạo từ seed nếu có (component được remount bằng key khi seed đổi)
  const [linhVuc, setLinhVuc] = useState<LinhVucSoanThao>(seed?.linhVuc ?? 'cap-nuoc')
  const [quyMo, setQuyMo] = useState<QuyMoCongTrinh>(seed?.quyMo ?? 'A')
  const [thamDinhType, setThamDinhType] = useState<'bcnckt' | 'bcktkt' | 'thiet-ke' | 'nghiem-thu'>(seed?.thamDinhType ?? 'bcnckt')
  const [tenDuAn, setTenDuAn] = useState(seed?.tenDuAn ?? '')
  const [tenChuDauTu, setTenChuDauTu] = useState('')
  const [diaDiem, setDiaDiem] = useState('')
  const [quyMoCT, setQuyMoCT] = useState('')
  const [loaiCongTrinh, setLoaiCongTrinh] = useState(seed?.loaiCongTrinh ?? '')
  const [capCongTrinh, setCapCongTrinh] = useState<'I' | 'II' | 'III' | 'IV'>(seed?.capCongTrinh ?? 'I')

  // "Dirty" = có gì đó KHÁC với giá trị khởi tạo (mồi hoặc mặc định) → người dùng đã nhập/chỉnh.
  // Trang gộp dùng cờ này để hỏi trước khi mang kết quả kiểm kê mới sang, tránh xoá trắng dữ liệu
  // đang nhập dở mà không báo.
  const coDuLieuDangNhap =
    tenChuDauTu !== '' || diaDiem !== '' || quyMoCT !== '' || step !== 'input' ||
    tenDuAn !== (seed?.tenDuAn ?? '') ||
    loaiCongTrinh !== (seed?.loaiCongTrinh ?? '') ||
    linhVuc !== (seed?.linhVuc ?? 'cap-nuoc') ||
    quyMo !== (seed?.quyMo ?? 'A') ||
    thamDinhType !== (seed?.thamDinhType ?? 'bcnckt') ||
    capCongTrinh !== (seed?.capCongTrinh ?? 'I')

  useEffect(() => {
    onDirtyChange?.(coDuLieuDangNhap)
  }, [coDuLieuDangNhap, onDirtyChange])

  // Generate auto-fill kết quả
  const kqAutoFill = useMemo(() => {
    if (!tenDuAn || !tenChuDauTu) return null
    return autoFillTuQuyMo({
      linhVuc,
      quyMo,
      thamDinhType,
      tenDuAn,
      tenChuDauTu,
      diaDiem,
      quyMoCT,
      loaiCongTrinh,
      capCongTrinh,
    })
  }, [linhVuc, quyMo, thamDinhType, tenDuAn, tenChuDauTu, diaDiem, quyMoCT, loaiCongTrinh, capCongTrinh])

  // Smart predict
  const handleSmartPredict = useCallback(() => {
    if (!tenDuAn) return
    const predict = smartPredictLoaiCongTrinh(tenDuAn, '')
    if (predict.linhVuc) setLinhVuc(predict.linhVuc)
    if (predict.capDuKien) setCapCongTrinh(predict.capDuKien)
    if (predict.loaiCongTrinh) setLoaiCongTrinh(predict.loaiCongTrinh)
  }, [tenDuAn])

  // Copy to clipboard
  const handleCopyAutoFill = () => {
    if (!kqAutoFill) return
    const text = `【THÔNG TIN CÔNG TRÌNH】
${kqAutoFill.hoanCanhDuAn}

【KẾT QUẢ AUTO-FILL】
Loại văn bản: ${kqAutoFill.loaiVanBan}
Thẩm quyền: ${kqAutoFill.thamQuyen}
Thời hạn: ${kqAutoFill.thoiHan} ngày

【NỘI DUNG THẨM ĐỊNH】
${kqAutoFill.noiDungThanhDinh}

【GHI CHÚ】
${kqAutoFill.ghiChuThemDo}`
    navigator.clipboard.writeText(text)
    alert('✅ Đã copy dữ liệu auto-fill!')
  }

  // Sinh tờ trình từ OpenAI
  const handleGenerate = async () => {
    if (!kqAutoFill) return
    setIsLoading(true)
    setError('')
    try {
      const prompt = generateOpenAIPrompt(
        { linhVuc, quyMo, thamDinhType, tenDuAn, tenChuDauTu, diaDiem, quyMoCT, loaiCongTrinh, capCongTrinh },
        kqAutoFill
      )

      const response = await fetch('/api/htkt/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setGeneratedText(data.text)
      setEstimatedCost(data.estimatedCost || 0)
      setStep('result')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={embedded ? '' : 'max-w-6xl mx-auto p-6'}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            AI Soạn thảo VBPL — Auto-fill từ quy mô công trình
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Nhập thông tin công trình → AI auto-fill dữ liệu thẩm định, nội dung, căn cứ pháp lý
          </p>
        </div>
      )}

      {embedded && seed && step === 'input' && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
          Đã mang sang từ bước Kiểm kê hồ sơ:
          {seed.tenDuAn ? ' tên dự án gợi ý,' : ''}
          {seed.thamDinhType ? ' loại thẩm định,' : ''}
          {seed.linhVuc ? ' lĩnh vực (đoán theo tên),' : ''} — các trường khác đang để MẶC ĐỊNH.
          {!seed.thamDinhType && (
            <span className="block mt-1 text-amber-800">
              ⚠️ Quy trình kiểm kê không phải một loại thẩm định — ô “Loại thẩm định” đang để mặc định BCNCKT,
              hãy chọn lại cho đúng.
            </span>
          )}
          <span className="block mt-1">
            Hãy tự xác định <strong>cấp công trình</strong>, bổ sung chủ đầu tư và quy mô cụ thể trước khi sinh tờ trình.
          </span>
        </div>
      )}

      {step === 'input' && (
        <div className="space-y-6">
          {/* 1. Chọn lĩnh vực + quy mô + loại thẩm định */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">1️⃣ Chọn lĩnh vực & quy mô công trình</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Lĩnh vực HTKT</label>
                <select
                  value={linhVuc}
                  onChange={(e) => setLinhVuc(e.target.value as any)}
                  className="w-full rounded border bg-white px-3 py-2 text-sm"
                >
                  {LINH_VUC_HTKT.map((lv) => (
                    <option key={lv.key} value={lv.key}>
                      {lv.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Quy mô công trình</label>
                <select
                  value={quyMo}
                  onChange={(e) => setQuyMo(e.target.value as QuyMoCongTrinh)}
                  className="w-full rounded border bg-white px-3 py-2 text-sm"
                >
                  <option value="A">Cấp I–II (Nhóm A — Sở XD)</option>
                  <option value="B">Cấp III (Nhóm B — HĐNT)</option>
                  <option value="C">Cấp IV (Nhóm C — CĐT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Loại thẩm định</label>
                <select
                  value={thamDinhType}
                  onChange={(e) => setThamDinhType(e.target.value as any)}
                  className="w-full rounded border bg-white px-3 py-2 text-sm"
                >
                  <option value="bcnckt">Thẩm định BCNCKT</option>
                  <option value="bcktkt">Thẩm định BCKTKT</option>
                  <option value="thiet-ke">Thẩm định Thiết kế</option>
                  <option value="nghiem-thu">Kiểm tra Nghiệm thu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Cấp công trình</label>
                <select
                  value={capCongTrinh}
                  onChange={(e) => setCapCongTrinh(e.target.value as any)}
                  className="w-full rounded border bg-white px-3 py-2 text-sm"
                >
                  <option value="I">Cấp I</option>
                  <option value="II">Cấp II</option>
                  <option value="III">Cấp III</option>
                  <option value="IV">Cấp IV</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Nhập thông tin công trình */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">2️⃣ Thông tin công trình</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Vd: Nhà máy nước Đồng Hới Giai đoạn I, công suất 50.000 m³/ngày"
                    value={tenDuAn}
                    onChange={(e) => setTenDuAn(e.target.value)}
                    className="flex-1 rounded border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleSmartPredict}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-medium text-sm hover:bg-blue-200"
                  >
                    🤖 Auto-detect
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chủ đầu tư <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Vd: Công ty Cấp nước Đồng Hới"
                    value={tenChuDauTu}
                    onChange={(e) => setTenChuDauTu(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Địa điểm</label>
                  <input
                    type="text"
                    placeholder="Vd: Xã Hương Sơn, huyện Vĩnh Linh"
                    value={diaDiem}
                    onChange={(e) => setDiaDiem(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại công trình</label>
                  <input
                    type="text"
                    placeholder="Vd: Nhà máy nước, Mạng phân phối"
                    value={loaiCongTrinh}
                    onChange={(e) => setLoaiCongTrinh(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quy mô cụ thể</label>
                  <input
                    type="text"
                    placeholder="Vd: Công suất 50.000 m³/ngày, Diện tích 5 ha"
                    value={quyMoCT}
                    onChange={(e) => setQuyMoCT(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview dữ liệu auto-fill */}
          {kqAutoFill && (
            <div className="rounded-lg border bg-slate-50 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">3️⃣ Dữ liệu auto-fill (Preview)</h2>

              {/* Thông tin hoàn cảnh dự án */}
              <div className="rounded bg-white p-4 mb-4 border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-slate-700 mb-2">📋 Hoàn cảnh dự án:</p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">{kqAutoFill.hoanCanhDuAn}</pre>
              </div>

              {/* Nội dung thẩm định */}
              <div className="rounded bg-white p-4 mb-4 border-l-4 border-green-500">
                <p className="text-xs font-semibold text-slate-700 mb-2">✓ Nội dung thẩm định:</p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">{kqAutoFill.noiDungThanhDinh}</pre>
              </div>

              {/* Ghi chú thêm độ */}
              <div className="rounded bg-white p-4 mb-4 border-l-4 border-amber-500">
                <p className="text-xs font-semibold text-slate-700 mb-2">⚠️ Ghi chú thêm độ:</p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">{kqAutoFill.ghiChuThemDo}</pre>
              </div>

              {/* Phần lựa chọn hành động */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCopyAutoFill}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy dữ liệu
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-medium text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isLoading ? 'Sinh tờ trình...' : 'Sinh tờ trình (OpenAI)'}
                </button>
              </div>
            </div>
          )}

          {!kqAutoFill && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Chưa đủ dữ liệu</p>
                <p className="text-xs mt-1">Vui lòng nhập Tên dự án và Chủ đầu tư để auto-fill dữ liệu</p>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Lỗi sinh tờ trình</h3>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                  <button
                    onClick={() => setStep('input')}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                  >
                    ← Quay lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success — Generated text */}
          {!error && generatedText && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">✨</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900">Tờ trình sinh hoàn chỉnh</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                      Chi phí dự kiến: <span className="font-semibold">${estimatedCost.toFixed(4)}</span> (gpt-3.5-turbo)
                    </p>
                  </div>
                </div>

                <div className="rounded bg-white p-4 mb-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedText}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedText)
                      alert('✅ Đã copy tờ trình!')
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy tờ trình
                  </button>
                  <button
                    onClick={() => setStep('input')}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded font-medium text-sm hover:bg-slate-300"
                  >
                    ← Soạn lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hiển thị căn cứ pháp lý (chỉ step input) */}
      {step === 'input' && (
        <div className="mt-8">
          <CanCuPhapLyChiTiet
            linhVuc={linhVuc}
            quyMo={quyMo}
            thamDinhType={thamDinhType}
            className="border-2 border-emerald-300"
          />
        </div>
      )}
    </div>
  )
}
