'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { LinhVucKey } from '@/lib/htkt/phap-ly'
import { PHAP_LY_CHUNG, PHAP_LY_LINH_VUC, getPhapLy, LOAI_VANBAN_MAU } from '@/lib/htkt/phap-ly'

export type CanCuPhapLyChiTietProps = {
  linhVuc?: LinhVucKey
  quyMo?: 'A' | 'B' | 'C'
  thamDinhType?: 'bcnckt' | 'bcktkt' | 'thiet-ke' | 'nghiem-thu'
  className?: string
}

/**
 * Component hiển thị căn cứ pháp lý chi tiết theo lĩnh vực + quy mô công trình
 * Smart-filter VBPL dựa trên thẩm quyền thẩm định (Sở XD vs HĐNT/CĐT)
 * Hiển thị các VBPL có liên quan "trongTam" trước
 */
export function CanCuPhapLyChiTiet({
  linhVuc,
  quyMo,
  thamDinhType,
  className = '',
}: CanCuPhapLyChiTietProps) {
  const [expanded, setExpanded] = useState(false)

  // Xác định thẩm quyền (Sở XD: A, HĐNT: B/C)
  const isSoXayDung = quyMo === 'A'

  // Lọc VBPL chung áp dụng cho toàn bộ thẩm định
  const vbplChungAp = PHAP_LY_CHUNG.filter((vb) => {
    // Luật XD 135/2025 luôn áp dụng
    if (vb.soHieu.includes('135/2025')) return true
    // NĐ 217/2026 (thẩm định hoạt động XD) luôn áp dụng
    if (vb.soHieu.includes('217/2026')) return true
    // NĐ 206/2026 (thẩm định TMĐT) luôn áp dụng
    if (vb.soHieu.includes('206/2026')) return true
    // TT 34/2026 (phân cấp) luôn áp dụng
    if (vb.soHieu.includes('34/2026')) return true
    // NĐ 30/2020 (thể thức văn bản) luôn áp dụng
    if (vb.soHieu.includes('30/2020')) return true
    // Các TT khác 36, 37, 38, 40 tuỳ loại thẩm định
    if (thamDinhType === 'bcnckt' && vb.soHieu.includes('206/2026')) return true
    if ((thamDinhType === 'bcnckt' || thamDinhType === 'bcktkt') && vb.soHieu.includes('37/2026')) return true
    if (thamDinhType !== 'bcnckt' && vb.soHieu.includes('36/2026')) return true
    if (thamDinhType !== 'bcnckt' && vb.soHieu.includes('38/2026')) return true
    if (thamDinhType === 'nghiem-thu' && vb.soHieu.includes('207/2026')) return true
    if (thamDinhType === 'nghiem-thu' && vb.soHieu.includes('40/2026')) return true
    return vb.trongTam === true
  })

  // Lọc VBPL theo lĩnh vực (nếu chỉ định)
  const vbplLinhVuc = linhVuc ? getPhapLy(linhVuc).filter((vb) => vb.trongTam === true) : []

  // Sắp xếp: trongTam trước, sau đó theo loại VB
  const vbplTrongTam = [...vbplChungAp, ...vbplLinhVuc].sort((a, b) => {
    if (a.trongTam && !b.trongTam) return -1
    if (!a.trongTam && b.trongTam) return 1
    return 0
  })

  const thongTin = {
    bcnckt: 'Thẩm định BCNCKT (Báo cáo Nghiên cứu Khả thi)',
    bcktkt: 'Thẩm định BCKTKT (Báo cáo Kinh tế - Kỹ thuật)',
    'thiet-ke': 'Thẩm định Thiết kế Triển khai',
    'nghiem-thu': 'Kiểm tra Nghiệm thu Hoàn thành',
  }

  return (
    <div className={`rounded-lg border bg-white overflow-hidden ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 flex items-center justify-between font-semibold text-slate-900 transition"
      >
        <span className="flex items-center gap-2">
          📋 Căn cứ pháp lý chi tiết
          {thamDinhType && <span className="text-xs font-normal text-slate-600 bg-white px-2 py-1 rounded">{thongTin[thamDinhType]}</span>}
          {linhVuc && <span className="text-xs font-normal text-slate-600 bg-white px-2 py-1 rounded">Lĩnh vực: {linhVuc}</span>}
        </span>
        <ChevronDown className={`w-5 h-5 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Thông tin thẩm quyền */}
          <div className="rounded-lg bg-slate-50 p-3 border-l-4 border-blue-500">
            <p className="text-xs font-semibold text-slate-700 mb-1">Thẩm quyền (quy mô công trình):</p>
            <p className="text-sm text-slate-900">
              {isSoXayDung ? (
                <>
                  <strong>Cấp I–II (Nhóm A):</strong> <em>Sở Xây dựng thẩm định</em>
                  <br />
                  <span className="text-xs text-slate-600">Các NĐ/TT dưới đây áp dụng với thẩm quyền của Sở Xây dựng</span>
                </>
              ) : (
                <>
                  <strong>Cấp III–IV (Nhóm B/C):</strong> <em>HĐNT / Chủ đầu tư thẩm định</em>
                  <br />
                  <span className="text-xs text-slate-600">HĐNT phân cấp hoặc chủ đầu tư thẩm định nội bộ</span>
                </>
              )}
            </p>
          </div>

          {/* VBPL cốt lõi */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
              ⭐ Căn cứ cốt lõi (bắt buộc):
            </p>
            <div className="space-y-2">
              {vbplTrongTam.map((vb, i) => (
                <div key={i} className="rounded border-l-4 border-blue-400 bg-blue-50/30 p-3">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded mt-0.5 shrink-0 ${LOAI_VANBAN_MAU[vb.loai] || 'bg-gray-100 text-gray-700'}`}>
                      {vb.loai}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900">
                        {vb.soHieu} — {vb.ten}
                      </p>
                      {vb.hieuLuc && <p className="text-xs text-slate-600 mt-1">📅 {vb.hieuLuc}</p>}
                      {vb.ghiChu && <p className="text-xs text-slate-700 italic mt-1">💡 {vb.ghiChu}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Các VBPL bổ sung theo lĩnh vực */}
          {linhVuc && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                ✓ Căn cứ chuyên ngành ({linhVuc}):
              </p>
              <div className="space-y-2">
                {vbplLinhVuc.length > 0 ? (
                  vbplLinhVuc.map((vb, i) => (
                    <div key={i} className="rounded border-l-4 border-emerald-400 bg-emerald-50/30 p-3">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded mt-0.5 shrink-0 ${LOAI_VANBAN_MAU[vb.loai] || 'bg-gray-100 text-gray-700'}`}>
                          {vb.loai}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">
                            {vb.soHieu} — {vb.ten}
                          </p>
                          {vb.ghiChu && <p className="text-xs text-slate-700 italic mt-1">{vb.ghiChu}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Không có căn cứ chuyên ngành riêng (sử dụng căn cứ chung)</p>
                )}
              </div>
            </div>
          )}

          {/* Lưu ý quan trọng */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Lưu ý:</p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>Tất cả VBPL trên phải được tham chiếu cụ thể trong tờ trình/thông báo kết quả thẩm định</li>
              <li>Nếu chưa có NĐ sửa đổi nhóm HTKT → Dùng NĐ 217/2026 làm căn cứ chuyển tiếp (Điều 10)</li>
              <li>Chiếu sáng: Bắt buộc tham chiếu Sở Công Thương (NĐ 217/2026 Điều 6.2)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
