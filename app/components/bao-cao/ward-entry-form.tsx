'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle } from 'lucide-react'
import { addWardReportRow, updateWardReportRow, deleteWardReportRow } from '@/app/actions/ward-report-entry'
import { SHEET_COLUMNS, SHEET_STANDARD } from '@/lib/ward-report-schema'
import { CoordPicker } from '@/components/bao-tri/coord-picker'

type Props = {
  category: string
  wardId: string
  year: number
  entries: any[]
  canEdit: boolean
}

type FormData = Record<string, unknown> & {
  id?: string
  toaDoDauLat?: number | null
  toaDoDauLng?: number | null
  toaDoCuoiLat?: number | null
  toaDoCuoiLng?: number | null
  toaDoLat?: number | null
  toaDoLng?: number | null
}

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
      {!ok && <AlertTriangle className="w-4 h-4 shrink-0" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function WardEntryForm({ category, wardId, year, entries, canEdit }: Props) {
  const [modal, setModal] = useState<'form' | 'del' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormData>({})
  const [delTarget, setDelTarget] = useState<any>(null)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, startT] = useTransition()

  const sheetName = Object.keys(SHEET_STANDARD).find(k => SHEET_STANDARD[k] === category) || ''
  const columns = SHEET_COLUMNS[sheetName] || []
  const hasCoordFields = ['DUONG', 'DIEN_CHIEU_SANG', 'THOAT_NUOC_BC', 'CAY_XANH', 'CONG_VIEN'].includes(category)
  const hasStartEndCoords = ['DUONG', 'THOAT_NUOC_BC', 'CAY_XANH'].includes(category)
  const hasCenterCoord = ['DIEN_CHIEU_SANG', 'CONG_VIEN'].includes(category)

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({})
    setModal('form')
  }

  const openEdit = (entry: any) => {
    setEditing(entry)
    setForm({ ...entry })
    setModal('form')
  }

  const openDel = (entry: any) => {
    setDelTarget(entry)
    setModal('del')
  }

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setDelTarget(null)
  }

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const numOrNull = (s: string) => s === '' ? null : Number(s)

  const handleSubmit = () => {
    const requiredCols = columns.filter(c => c.required).map(c => c.name)
    const missingCol = requiredCols.find(col => !form[col] || form[col] === '')
    if (missingCol) {
      showToast(false, `Vui lòng nhập: ${missingCol}`)
      return
    }

    startT(async () => {
      const coords = hasStartEndCoords
        ? {
            doDauLat: form.toaDoDauLat as number | undefined,
            doDauLng: form.toaDoDauLng as number | undefined,
            doCuoiLat: form.toaDoCuoiLat as number | undefined,
            doCuoiLng: form.toaDoCuoiLng as number | undefined,
          }
        : hasCenterCoord
          ? {
              toaDoLat: form.toaDoLat as number | undefined,
              toaDoLng: form.toaDoLng as number | undefined,
            }
          : undefined

      const rowData = { ...form }
      delete rowData.id
      delete rowData.toaDoDauLat
      delete rowData.toaDoDauLng
      delete rowData.toaDoCuoiLat
      delete rowData.toaDoCuoiLng
      delete rowData.toaDoLat
      delete rowData.toaDoLng

      if (editing) {
        const res = await updateWardReportRow({
          id: editing.id,
          category,
          rowData,
          coords,
        })
        if (res.ok) {
          showToast(true, 'Đã cập nhật dữ liệu.')
          closeModal()
        } else {
          showToast(false, res.error ?? 'Lỗi cập nhật.')
        }
      } else {
        const res = await addWardReportRow({
          wardId,
          year,
          category,
          rowData,
          coords,
        })
        if (res.ok) {
          showToast(true, 'Đã thêm dữ liệu.')
          closeModal()
        } else {
          showToast(false, res.error ?? 'Lỗi thêm dữ liệu.')
        }
      }
    })
  }

  const handleDelete = () => {
    if (!delTarget) return
    startT(async () => {
      const res = await deleteWardReportRow({
        id: delTarget.id,
        category,
      })
      if (res.ok) {
        showToast(true, 'Đã xoá dữ liệu.')
        closeModal()
      } else {
        showToast(false, res.error ?? 'Lỗi xoá dữ liệu.')
      }
    })
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        {canEdit && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm hàng
          </button>
        )}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase bg-slate-50 border-b">
              <tr>
                <th className="text-center font-semibold px-2 py-2 w-[40px]">STT</th>
                {columns.map((col, idx) => (
                  <th key={idx} className={`font-semibold px-2 py-2 ${col.type === 'number' ? 'text-center' : 'text-left'}`}>
                    {col.name}
                    {col.unit && <span className="text-xs">({col.unit})</span>}
                  </th>
                ))}
                {hasCoordFields && <th className="text-center font-semibold px-2 py-2">Tọa độ</th>}
                {canEdit && <th className="px-2 py-2 w-[80px]"></th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-2 py-2.5 text-center font-medium text-slate-800">{idx + 1}</td>
                  {columns.map((col, cidx) => (
                    <td key={cidx} className={`px-2 py-2.5 text-slate-700 ${col.type === 'number' ? 'text-center' : ''}`}>
                      {entry[col.name] ?? '—'}
                    </td>
                  ))}
                  {hasCoordFields && (
                    <td className="px-2 py-2.5 text-center">
                      {hasStartEndCoords && entry.toaDoDauLat && entry.toaDoDauLng && entry.toaDoCuoiLat && entry.toaDoCuoiLng
                        ? <span className="text-xs font-medium text-emerald-700">📍 Có</span>
                        : hasCenterCoord && entry.toaDoLat && entry.toaDoLng
                          ? <span className="text-xs font-medium text-emerald-700">📍 Có</span>
                          : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  )}
                  {canEdit && (
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDel(entry)}
                          className="p-1.5 rounded text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            {canEdit ? (
              <div className="space-y-3">
                <p>Chưa có dữ liệu.</p>
                <button onClick={openAdd} className="text-sm text-emerald-600 hover:underline">Thêm hàng đầu tiên →</button>
              </div>
            ) : 'Không có dữ liệu.'}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? 'Sửa dữ liệu' : 'Thêm dữ liệu mới'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {columns.map((col, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {col.name}
                    {col.required && <span className="text-rose-500">*</span>}
                  </label>
                  {col.type === 'text' && (
                    <input
                      type="text"
                      value={(form[col.name] ?? '') as string}
                      onChange={e => set(col.name, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  {col.type === 'number' && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(form[col.name] ?? '') as string | number}
                      onChange={e => set(col.name, numOrNull(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  {col.type === 'year' && (
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={(form[col.name] ?? '') as string | number}
                      onChange={e => set(col.name, numOrNull(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              ))}

              {hasStartEndCoords && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Tọa độ</h3>
                  <CoordPicker
                    label="Điểm đầu"
                    lat={form.toaDoDauLat as number | null | undefined}
                    lng={form.toaDoDauLng as number | null | undefined}
                    onConfirm={(lat, lng) => {
                      set('toaDoDauLat', lat)
                      set('toaDoDauLng', lng)
                    }}
                  />
                  <div className="mt-4">
                    <CoordPicker
                      label="Điểm cuối"
                      lat={form.toaDoCuoiLat as number | null | undefined}
                      lng={form.toaDoCuoiLng as number | null | undefined}
                      onConfirm={(lat, lng) => {
                        set('toaDoCuoiLat', lat)
                        set('toaDoCuoiLng', lng)
                      }}
                    />
                  </div>
                </div>
              )}

              {hasCenterCoord && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Tọa độ</h3>
                  <CoordPicker
                    label="Vị trí"
                    lat={form.toaDoLat as number | null | undefined}
                    lng={form.toaDoLng as number | null | undefined}
                    onConfirm={(lat, lng) => {
                      set('toaDoLat', lat)
                      set('toaDoLng', lng)
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 rounded-b-2xl">
              <button onClick={closeModal} disabled={pending} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={handleSubmit} disabled={pending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Lưu thay đổi' : 'Thêm dữ liệu'}
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
                <h2 className="font-bold text-slate-900">Xoá dữ liệu</h2>
                <p className="text-sm text-slate-500">Thao tác này không thể hoàn tác.</p>
              </div>
            </div>
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
