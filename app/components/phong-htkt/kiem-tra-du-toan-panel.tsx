'use client'

import { useState } from 'react'
import { AlertOctagon, AlertTriangle, Info, Table2, FileWarning, Scale } from 'lucide-react'

// ── Kiểu dữ liệu (khớp app/lib/tham-dinh/kiem-tra-du-toan.ts + doc-to-trinh.ts) ─────────────

export type PhatHienUI = {
  ma: string; mucDo: 'LOI' | 'CANH_BAO' | 'THONG_TIN'
  tep: string; sheet: string; o: string; hienTai: string
  noiDung: string; giaTriAnhHuong: number | null; kienNghi: string; canCu: string
}
export type KhoiLuongTongHopUI = {
  ma: string; ten: string; donVi: string
  klChiTiet: number | null; klDuToan: number | null; chenhLech: number | null; tyLe: number | null
  trangThai: 'KHOP' | 'LECH' | 'CHI_CO_CHI_TIET' | 'CHI_CO_DU_TOAN'
}
export type KetQuaKiemTraDuToanUI = {
  tuyChon: { loaiCongTrinh: string | null; theoTuyen: boolean; thueSuat: number; quyMoTyDong: number | null }
  duLieuDuToanAI: { coDuLieu: boolean; ghiChu: string; phienBan?: string; ngay?: string; vanBan?: string }
  tomTat: { loi: number; canhBao: number; thongTin: number; daCat: boolean }
  phatHien: PhatHienUI[]
  khoiLuong: KhoiLuongTongHopUI[]
  canhBao: string[]
}
export type DongDoiChieuUI = {
  khoanMuc: string; ten: string
  theoToTrinh: number | null; nguonToTrinh: string
  theoDuToan: number | null; nguonDuToan: string
  chenhLech: number | null; tyLe: number | null; ungVienKhac: number
}
export type KetQuaDoiChieuToTrinhUI = { tepDaDoc: string[]; bang: DongDoiChieuUI[]; canhBao: string[] }

const MUC_DO_META = {
  LOI: { nhan: 'Lỗi', icon: AlertOctagon, mau: 'text-rose-700 bg-rose-50 border-rose-200' },
  CANH_BAO: { nhan: 'Cảnh báo', icon: AlertTriangle, mau: 'text-amber-700 bg-amber-50 border-amber-200' },
  THONG_TIN: { nhan: 'Thông tin', icon: Info, mau: 'text-sky-700 bg-sky-50 border-sky-200' },
} as const

function fmtTien(n: number | null): string {
  if (n === null) return '—'
  return n.toLocaleString('vi-VN')
}
function fmtTyLe(n: number | null): string {
  if (n === null) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

export function KiemTraDuToanPanel({ kq, doiChieu }: { kq: KetQuaKiemTraDuToanUI; doiChieu: KetQuaDoiChieuToTrinhUI | null }) {
  const [locMuc, setLocMuc] = useState<'' | 'LOI' | 'CANH_BAO' | 'THONG_TIN'>('')
  const phatHien = locMuc ? kq.phatHien.filter((p) => p.mucDo === locMuc) : kq.phatHien
  const lechKl = kq.khoiLuong.filter((k) => k.trangThai === 'LECH')
  const chiMotBenKl = kq.khoiLuong.filter((k) => k.trangThai !== 'LECH' && k.trangThai !== 'KHOP')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
        <p className="text-sm text-cyan-900 flex items-start gap-2">
          <Scale className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Đây là kết quả <strong>tính lại</strong> khối lượng → THKP chi phí xây dựng → tổng hợp dự toán/TMĐT theo Bảng 3.8/2.1/1.2
            Thông tư 36/2026/TT-BXD, đối chiếu với chính số liệu trong tệp. Công cụ chỉ <strong>phát hiện và trích dẫn ô nguồn</strong>,
            không kết luận thay — cán bộ thẩm định phải mở tệp kiểm tra lại từng mục.
          </span>
        </p>
        {!kq.duLieuDuToanAI.coDuLieu && (
          <p className="text-xs text-cyan-800 mt-2">⚠️ {kq.duLieuDuToanAI.ghiChu}</p>
        )}
        {kq.duLieuDuToanAI.coDuLieu && (
          <p className="text-xs text-cyan-700 mt-2">
            Bảng tra tỷ lệ chi phí: gói {kq.duLieuDuToanAI.phienBan} ({kq.duLieuDuToanAI.ngay}) — {kq.duLieuDuToanAI.vanBan}.
          </p>
        )}
        {kq.canhBao.map((c, i) => <p key={i} className="text-xs text-amber-800 mt-1.5">⚠️ {c}</p>)}
      </div>

      {/* Tóm tắt mức độ */}
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
          <FileWarning className="w-4 h-4 text-cyan-600" />Tóm tắt phát hiện
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setLocMuc('')} className={`text-xs px-2.5 py-1 rounded-lg border ${!locMuc ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600'}`}>
            Tất cả ({kq.phatHien.length})
          </button>
          {(['LOI', 'CANH_BAO', 'THONG_TIN'] as const).map((m) => {
            const n = m === 'LOI' ? kq.tomTat.loi : m === 'CANH_BAO' ? kq.tomTat.canhBao : kq.tomTat.thongTin
            if (n === 0) return null
            const meta = MUC_DO_META[m]
            return (
              <button key={m} onClick={() => setLocMuc(m === locMuc ? '' : m)}
                className={`text-xs px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${locMuc === m ? meta.mau.replace('50', '100') : 'bg-white text-slate-600 hover:border-cyan-300'}`}>
                <meta.icon className="w-3 h-3" />{meta.nhan} ({n})
              </button>
            )
          })}
        </div>
        {kq.tomTat.daCat && <p className="mt-2 text-xs text-amber-700">⚠️ Danh sách đã bị cắt bớt — sửa các lỗi lớn rồi kiểm tra lại.</p>}
      </div>

      {/* Đối chiếu tờ trình vs dự toán (Phụ lục 4) */}
      {doiChieu && doiChieu.bang.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <Table2 className="w-4 h-4 text-cyan-600" />So sánh dự toán/TMĐT với tờ trình (Phụ lục 4)
          </p>
          <p className="text-xs text-slate-500 mb-3">A = số trong tờ trình/thuyết minh · B = số trong dự toán/TMĐT · Δ = B − A.</p>
          {doiChieu.canhBao.map((c, i) => <p key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">⚠️ {c}</p>)}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b">
                  <th className="py-2 pr-3 font-semibold">Khoản mục</th>
                  <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">Theo tờ trình (A)</th>
                  <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">Theo dự toán (B)</th>
                  <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">Chênh lệch Δ</th>
                  <th className="py-2 font-semibold">Nguồn</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {doiChieu.bang.map((d, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-2 pr-3 text-slate-700">{d.ten}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">
                      {d.theoToTrinh === null ? <span className="text-rose-600 text-xs">CHƯA CÓ TRONG HỒ SƠ</span> : fmtTien(d.theoToTrinh)}
                      {d.ungVienKhac > 0 && <span className="block text-[11px] text-amber-600">+{d.ungVienKhac} số khác trong văn bản</span>}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">
                      {d.theoDuToan === null ? <span className="text-rose-600 text-xs">CHƯA CÓ TRONG HỒ SƠ</span> : fmtTien(d.theoDuToan)}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {d.chenhLech === null ? '—' : (
                        <span className={Math.abs(d.tyLe ?? 0) > 1 ? 'text-rose-700 font-semibold' : 'text-slate-700'}>
                          {fmtTien(d.chenhLech)} <span className="text-xs">({fmtTyLe(d.tyLe)})</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-[11px] text-slate-500 font-mono break-all">{d.nguonToTrinh} → {d.nguonDuToan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Đối chiếu khối lượng chi tiết ↔ dự toán */}
      {kq.khoiLuong.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Table2 className="w-4 h-4 text-cyan-600" />Đối chiếu khối lượng chi tiết ↔ dự toán
          </p>
          {lechKl.length === 0 ? (
            <p className="text-sm text-emerald-700">Không thấy công tác nào lệch khối lượng giữa bảng chi tiết và dự toán.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b">
                    <th className="py-2 pr-3 font-semibold">Công tác</th>
                    <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">KL chi tiết</th>
                    <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">KL dự toán</th>
                    <th className="py-2 font-semibold text-right whitespace-nowrap">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lechKl.map((k, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 text-slate-700">{k.ma} {k.ten.slice(0, 60)} <span className="text-slate-400">({k.donVi})</span></td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{fmtTien(k.klChiTiet)}</td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums">{fmtTien(k.klDuToan)}</td>
                      <td className="py-2 text-right font-mono tabular-nums text-rose-700">{fmtTien(k.chenhLech)} ({fmtTyLe(k.tyLe)})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {chiMotBenKl.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">{chiMotBenKl.length} công tác chỉ có ở một bên (chi tiết hoặc dự toán) — xem trong danh sách phát hiện.</p>
          )}
        </div>
      )}

      {/* Danh sách phát hiện */}
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm font-semibold text-slate-800 mb-3">
          Danh sách phát hiện {locMuc && `— ${MUC_DO_META[locMuc].nhan}`} ({phatHien.length})
        </p>
        {phatHien.length === 0 ? (
          <p className="text-sm text-slate-500">Không có phát hiện nào ở mức này.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b">
                  <th className="py-2 pr-3 font-semibold whitespace-nowrap">Mức</th>
                  <th className="py-2 pr-3 font-semibold">Nội dung</th>
                  <th className="py-2 font-semibold">Nguồn / Kiến nghị</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {phatHien.slice(0, 200).map((p, i) => {
                  const meta = MUC_DO_META[p.mucDo]
                  const Icon = meta.icon
                  return (
                    <tr key={i} className="align-top">
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border whitespace-nowrap ${meta.mau}`}>
                          <Icon className="w-3 h-3" />{meta.nhan}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700">
                        {p.noiDung}
                        {p.giaTriAnhHuong !== null && Math.abs(p.giaTriAnhHuong) >= 1 && (
                          <span className="block text-xs text-rose-600 mt-0.5">Chênh lệch: {fmtTien(p.giaTriAnhHuong)} đồng</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-slate-500">
                        <span className="block font-mono break-all">{p.tep}{p.sheet && ` · ${p.sheet}`}{p.o && `!${p.o}`}</span>
                        <span className="block mt-0.5">{p.kienNghi}</span>
                        {p.canCu && <span className="block mt-0.5 text-slate-400">{p.canCu}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {phatHien.length > 200 && <p className="mt-2 text-xs text-slate-400">… và {phatHien.length - 200} phát hiện khác — lọc theo mức để xem tiếp.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
