'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, X, Download, Loader2, AlertTriangle } from 'lucide-react'
import { saveBaoTriTuyen, deleteBaoTriTuyen, type BaoTriTuyenInput } from '@/app/actions/bao-tri-tuyen'
import type { ThongKePhuong, TuyenDuong } from '@/lib/htkt/bao-tri-tuyen'
import { CoordPicker } from './coord-picker'

const TINH_TRANG_CLS: Record<string, string> = {
  'Tốt': 'bg-emerald-100 text-emerald-700',
  'Trung bình': 'bg-amber-100 text-amber-700',
  'Xuống cấp': 'bg-rose-100 text-rose-700',
}
const TINH_TRANG_OPT = ['', 'Tốt', 'Trung bình', 'Xuống cấp']

type Props = {
  phuongList: ThongKePhuong[]
  dsDiaBan: string[]
  canEdit: boolean
  wardDiaBan?: string | null
  filterDiaBan?: string
}

const blank = (diaBan?: string): BaoTriTuyenInput => ({
  tieuDe: '', diaBan: diaBan ?? '', ghiChu: '',
  chieuDai: null, matCat: null, matCatQH: null,
  diemDau: '', diemCuoi: '', ketCau: '', tinhTrang: '', namBaoTri: null,
  toaDoDauLat: null, toaDoDauLng: null, toaDoCuoiLat: null, toaDoCuoiLng: null,
  namDuyTu: null, kinhPhiDuyTu: null, noiDungDuyTu: '', donViThucHien: '',
})

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
      {!ok && <AlertTriangle className="w-4 h-4 shrink-0" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function BaoTriManageTable({ phuongList, dsDiaBan, canEdit, wardDiaBan, filterDiaBan }: Props) {
  const [modal, setModal] = useState<'form' | 'del' | null>(null)
  const [editing, setEditing] = useState<TuyenDuong | null>(null)
  const [form, setForm] = useState<BaoTriTuyenInput>(blank(wardDiaBan ?? filterDiaBan))
  const [delTarget, setDelTarget] = useState<TuyenDuong | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, startT] = useTransition()

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(blank(wardDiaBan ?? filterDiaBan))
    setModal('form')
  }

  const openEdit = (t: TuyenDuong) => {
    setEditing(t)
    setForm({
      id: t.id,
      tieuDe: t.tieuDe,
      diaBan: t.diaBan ?? '',
      ghiChu: t.ghiChu ?? '',
      chieuDai: t.chieuDai,
      matCat: t.matCat,
      matCatQH: t.matCatQH,
      diemDau: t.diemDau ?? '',
      diemCuoi: t.diemCuoi ?? '',
      ketCau: t.ketCau ?? '',
      tinhTrang: t.tinhTrang ?? '',
      namBaoTri: t.namBaoTri,
      toaDoDauLat: t.toaDoDauLat,
      toaDoDauLng: t.toaDoDauLng,
      toaDoCuoiLat: t.toaDoCuoiLat,
      toaDoCuoiLng: t.toaDoCuoiLng,
      namDuyTu: t.namDuyTu,
      kinhPhiDuyTu: t.kinhPhiDuyTu,
      noiDungDuyTu: t.noiDungDuyTu ?? '',
      donViThucHien: t.donViThucHien ?? '',
    })
    setModal('form')
  }

  const openDel = (t: TuyenDuong) => { setDelTarget(t); setModal('del') }
  const closeModal = () => { setModal(null); setEditing(null); setDelTarget(null) }

  const set = (k: keyof BaoTriTuyenInput, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const numOrNull = (s: string) => s === '' ? null : Number(s)

  const handleSubmit = () => {
    if (!form.tieuDe.trim()) { showToast(false, 'Vui lòng nhập tên tuyến đường.'); return }
    if (!form.diaBan.trim()) { showToast(false, 'Vui lòng chọn phường/xã.'); return }
    startT(async () => {
      const res = await saveBaoTriTuyen(form)
      if (res.ok) {
        showToast(true, editing ? 'Đã cập nhật tuyến đường.' : 'Đã thêm tuyến đường.')
        closeModal()
      } else {
        showToast(false, res.error ?? 'Lỗi lưu dữ liệu.')
      }
    })
  }

  const handleDelete = () => {
    if (!delTarget) return
    startT(async () => {
      const res = await deleteBaoTriTuyen(delTarget.id)
      if (res.ok) {
        showToast(true, 'Đã xoá tuyến đường.')
        closeModal()
      } else {
        showToast(false, res.error ?? 'Lỗi xoá dữ liệu.')
      }
    })
  }

  const canRowEdit = (diaBan: string | null) =>
    !wardDiaBan || diaBan === wardDiaBan

  const diaBanOptions = wardDiaBan
    ? [wardDiaBan]
    : dsDiaBan.length ? dsDiaBan : []

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm tuyến đường
            </button>
          )}
          <a
            href={`/api/htkt/bao-tri-tuyen/export${filterDiaBan ? `?phuong=${encodeURIComponent(filterDiaBan)}` : ''}`}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg transition-colors"
            download
          >
            <Download className="w-4 h-4" />
            Xuất Excel{filterDiaBan ? ` — ${filterDiaBan}` : ''}
          </a>
        </div>
      </div>

      {/* Table by ward */}
      <div className="space-y-4">
        {phuongList.map(p => (
          <div key={p.diaBan} className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50 border-b flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-800">{p.diaBan}</span>
                <span className="text-sm text-slate-500">{p.soTuyen} tuyến · {p.tongKm.toFixed(2)} km</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.tot > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{p.tot} tốt</span>}
                {p.trungBinh > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{p.trungBinh} trung bình</span>}
                {p.xuongCap > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">{p.xuongCap} xuống cấp</span>}
                {p.chuaXet > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{p.chuaXet} chưa đánh giá</span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-xs uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="text-left font-semibold px-4 py-2 w-[200px]">Tên tuyến đường</th>
                    <th className="text-left font-semibold px-2 py-2">Điểm đầu → Cuối</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Dài (km)</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Rộng HT (m)</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Rộng QH (m)</th>
                    <th className="text-left font-semibold px-2 py-2">Kết cấu</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Tình trạng</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Năm BT</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Tọa độ</th>
                    <th className="text-center font-semibold px-2 py-2 whitespace-nowrap">Năm DT</th>
                    {canEdit && <th className="px-2 py-2 w-[80px]"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {p.tuyen.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{t.tieuDe}</td>
                      <td className="px-2 py-2.5 text-slate-500 text-xs">
                        {t.diemDau || t.diemCuoi ? <>{t.diemDau || '—'} → {t.diemCuoi || '—'}</> : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-700 font-medium">
                        {t.chieuDai != null ? t.chieuDai.toFixed(2) : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-600">{t.matCat ?? '—'}</td>
                      <td className="px-2 py-2.5 text-center text-slate-600">{t.matCatQH ?? '—'}</td>
                      <td className="px-2 py-2.5 text-slate-500 text-xs max-w-[140px] truncate" title={t.ketCau ?? ''}>{t.ketCau || '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        {t.tinhTrang
                          ? <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${TINH_TRANG_CLS[t.tinhTrang] ?? 'bg-slate-100 text-slate-600'}`}>{t.tinhTrang}</span>
                          : <span className="text-xs text-slate-400 italic">Chưa đánh giá</span>}
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-600">{t.namBaoTri ?? '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        {t.toaDoDauLat && t.toaDoDauLng && t.toaDoCuoiLat && t.toaDoCuoiLng
                          ? <span className="text-xs font-medium text-emerald-700">📍 Có</span>
                          : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-600">{t.namDuyTu ?? '—'}</td>
                      {canEdit && (
                        <td className="px-2 py-2.5">
                          {canRowEdit(t.diaBan) && (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => openEdit(t)}
                                className="p-1.5 rounded text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                title="Sửa"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openDel(t)}
                                className="p-1.5 rounded text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                title="Xoá"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {phuongList.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-400">
            {canEdit ? (
              <div className="space-y-3">
                <p>Chưa có dữ liệu tuyến đường.</p>
                <button onClick={openAdd} className="text-sm text-emerald-600 hover:underline">Thêm tuyến đường đầu tiên →</button>
              </div>
            ) : 'Không có dữ liệu tuyến đường.'}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? 'Sửa tuyến đường' : 'Thêm tuyến đường mới'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Tên tuyến */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tên tuyến đường <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tieuDe}
                  onChange={e => set('tieuDe', e.target.value)}
                  placeholder="VD: Đường Lê Lợi, Đường Nguyễn Huệ..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Địa bàn */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Phường/Xã <span className="text-rose-500">*</span>
                </label>
                {wardDiaBan ? (
                  <input
                    type="text"
                    value={wardDiaBan}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500"
                  />
                ) : (
                  <select
                    value={form.diaBan}
                    onChange={e => set('diaBan', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">— Chọn phường/xã —</option>
                    {diaBanOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="__other">Phường/xã khác (nhập tay)…</option>
                  </select>
                )}
                {!wardDiaBan && form.diaBan === '__other' && (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nhập tên phường/xã..."
                    className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onChange={e => set('diaBan', e.target.value || '__other')}
                  />
                )}
              </div>

              {/* Điểm đầu - Cuối */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Điểm đầu (lý trình)</label>
                  <input type="text" value={form.diemDau ?? ''} onChange={e => set('diemDau', e.target.value)}
                    placeholder="VD: Km0+000" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Điểm cuối (lý trình)</label>
                  <input type="text" value={form.diemCuoi ?? ''} onChange={e => set('diemCuoi', e.target.value)}
                    placeholder="VD: Km2+500" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Số liệu */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Chiều dài (km)</label>
                  <input type="number" step="0.01" min="0"
                    value={form.chieuDai ?? ''}
                    onChange={e => set('chieuDai', numOrNull(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rộng HT (m)</label>
                  <input type="number" step="0.5" min="0"
                    value={form.matCat ?? ''}
                    onChange={e => set('matCat', numOrNull(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rộng QH (m)</label>
                  <input type="number" step="0.5" min="0"
                    value={form.matCatQH ?? ''}
                    onChange={e => set('matCatQH', numOrNull(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Kết cấu & Tình trạng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kết cấu mặt đường</label>
                  <input type="text" value={form.ketCau ?? ''} onChange={e => set('ketCau', e.target.value)}
                    placeholder="VD: Bê tông nhựa, đá dăm..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tình trạng mặt đường</label>
                  <select value={form.tinhTrang ?? ''} onChange={e => set('tinhTrang', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {TINH_TRANG_OPT.map(o => <option key={o} value={o}>{o || '— Chưa đánh giá —'}</option>)}
                  </select>
                </div>
              </div>

              {/* Năm bảo trì */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Năm bảo trì gần nhất</label>
                  <input type="number" min="2000" max="2100"
                    value={form.namBaoTri ?? ''}
                    onChange={e => set('namBaoTri', numOrNull(e.target.value))}
                    placeholder="VD: 2024"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Tọa độ & Vị trí */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Tọa độ & Vị trí</h3>
                <div className="space-y-4">
                  <CoordPicker
                    label="Điểm đầu"
                    lat={form.toaDoDauLat}
                    lng={form.toaDoDauLng}
                    onConfirm={(lat, lng) => {
                      set('toaDoDauLat', lat)
                      set('toaDoDauLng', lng)
                    }}
                  />
                  <CoordPicker
                    label="Điểm cuối"
                    lat={form.toaDoCuoiLat}
                    lng={form.toaDoCuoiLng}
                    onConfirm={(lat, lng) => {
                      set('toaDoCuoiLat', lat)
                      set('toaDoCuoiLng', lng)
                    }}
                  />
                </div>
              </div>

              {/* Duy tu / Sửa chữa */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Duy tu / Sửa chữa</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Năm duy tu gần nhất</label>
                    <input type="number" min="2000" max="2100"
                      value={form.namDuyTu ?? ''}
                      onChange={e => set('namDuyTu', numOrNull(e.target.value))}
                      placeholder="VD: 2024"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Kinh phí (triệu VNĐ)</label>
                    <input type="number" step="0.1" min="0"
                      value={form.kinhPhiDuyTu ?? ''}
                      onChange={e => set('kinhPhiDuyTu', numOrNull(e.target.value))}
                      placeholder="VD: 100.5"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nội dung duy tu</label>
                  <textarea rows={2} value={form.noiDungDuyTu ?? ''} onChange={e => set('noiDungDuyTu', e.target.value)}
                    placeholder="Mô tả công việc duy tu..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn vị thực hiện</label>
                  <input type="text" value={form.donViThucHien ?? ''} onChange={e => set('donViThucHien', e.target.value)}
                    placeholder="VD: Công ty ABC, Ban Quản lý..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea rows={2} value={form.ghiChu ?? ''} onChange={e => set('ghiChu', e.target.value)}
                  placeholder="Ghi chú thêm..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 rounded-b-2xl">
              <button onClick={closeModal} disabled={pending} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={handleSubmit} disabled={pending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Lưu thay đổi' : 'Thêm tuyến đường'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'del' && delTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Xoá tuyến đường</h2>
                <p className="text-sm text-slate-500">Thao tác này không thể hoàn tác.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border">
              <span className="font-semibold">{delTarget.tieuDe}</span>
              {delTarget.diaBan && <span className="text-slate-500"> — {delTarget.diaBan}</span>}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} disabled={pending} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={pending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-60">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast ok={toast.ok} msg={toast.msg} onClose={() => setToast(null)} />}
    </>
  )
}
