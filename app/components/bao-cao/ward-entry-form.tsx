'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle, Copy, CopyPlus } from 'lucide-react'
import { addWardReportRow, updateWardReportRow, deleteWardReportRow, copyWardReportYear } from '@/app/actions/ward-report-entry'
import { editableColumns, CATEGORY_COORDS, coerceCellValue } from '@/lib/ward-report-schema'
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
  const [modal, setModal] = useState<'form' | 'del' | 'copy' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormData>({})
  const [delTarget, setDelTarget] = useState<any>(null)
  const [copyFromYear, setCopyFromYear] = useState<number>(year - 1)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, startT] = useTransition()

  const columns = editableColumns(category)
  const coordKind = CATEGORY_COORDS[category] ?? 'none'
  const hasStartEndCoords = coordKind === 'startEnd'
  const hasCenterCoord = coordKind === 'center'
  const hasCoordFields = coordKind !== 'none'

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

  const openDuplicate = (entry: Record<string, unknown>) => {
    // Nhân bản: mở modal THÊM với dữ liệu dòng nguồn (bỏ id/metadata → tạo mới).
    setEditing(null)
    const { id, createdAt, updatedAt, ...rest } = entry
    void id; void createdAt; void updatedAt
    setForm({ ...rest })
    setModal('form')
  }

  const openDel = (entry: any) => {
    setDelTarget(entry)
    setModal('del')
  }

  const openCopy = () => {
    setCopyFromYear(year - 1)
    setModal('copy')
  }

  const handleCopyYear = () => {
    startT(async () => {
      const res = await copyWardReportYear({ category, wardId, fromYear: copyFromYear, toYear: year })
      if (res.ok) {
        showToast(true, `Đã sao chép ${res.count ?? 0} dòng từ năm ${copyFromYear}.`)
        closeModal()
      } else {
        showToast(false, res.error ?? 'Lỗi sao chép.')
      }
    })
  }

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setDelTarget(null)
  }

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const numOrNull = (s: string) => s === '' ? null : Number(s)

  const handleSubmit = (keepOpen = false) => {
    const missing = columns.find(c => c.required && (form[c.field] === undefined || form[c.field] === null || form[c.field] === ''))
    if (missing) {
      showToast(false, `Vui lòng nhập: ${missing.name}`)
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

      // Dựng rowData CHỈ từ các cột khai báo (khoá = field camelCase = trường Prisma),
      // ép kiểu theo type → không rò rỉ metadata DB (id/createdAt/wardId…) khi sửa.
      const rowData: Record<string, unknown> = {}
      for (const c of columns) rowData[c.field] = coerceCellValue(c.type, form[c.field])

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
          // "Lưu & thêm tiếp": giữ modal, reset form để nhập dòng kế tiếp.
          if (keepOpen) setForm({})
          else closeModal()
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
      <div className="flex flex-wrap gap-2 mb-4">
        {canEdit && (
          <>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm hàng
            </button>
            <button
              onClick={openCopy}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
              title={`Sao chép toàn bộ dữ liệu từ năm ${year - 1} sang năm ${year}`}
            >
              <CopyPlus className="w-4 h-4" />
              Sao chép năm trước
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase bg-slate-50 border-b">
              <tr>
                <th className="text-center font-semibold px-2 py-2 w-[40px]">STT</th>
                {columns.map((col, idx) => (
                  <th key={idx} className={`font-semibold px-2 py-2 ${col.type === 'number' || col.type === 'integer' ? 'text-center' : 'text-left'}`}>
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
                  {columns.map((col, cidx) => {
                    const v = entry[col.field]
                    const isNumeric = col.type === 'number' || col.type === 'integer'
                    const display = col.type === 'boolean'
                      ? (v === true ? 'Có' : v === false ? 'Không' : '—')
                      : (v === null || v === undefined || v === '' ? '—'
                        : isNumeric && typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v))
                    return (
                      <td key={cidx} className={`px-2 py-2.5 text-slate-700 ${isNumeric ? 'text-center' : ''}`}>
                        {display}
                      </td>
                    )
                  })}
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
                          onClick={() => openDuplicate(entry)}
                          className="p-1.5 rounded text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Nhân bản dòng này"
                        >
                          <Copy className="w-3.5 h-3.5" />
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
                    {col.name}{col.unit && <span className="font-normal text-slate-400"> ({col.unit})</span>}
                    {col.required && <span className="text-rose-500">*</span>}
                  </label>
                  {col.type === 'text' && (
                    <input
                      type="text"
                      value={(form[col.field] ?? '') as string}
                      onChange={e => set(col.field, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  {(col.type === 'number' || col.type === 'integer') && (
                    <input
                      type="number"
                      step={col.type === 'integer' ? '1' : '0.01'}
                      min="0"
                      value={(form[col.field] ?? '') as string | number}
                      onChange={e => set(col.field, numOrNull(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  {col.type === 'year' && (
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={(form[col.field] ?? '') as string | number}
                      onChange={e => set(col.field, numOrNull(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  {col.type === 'boolean' && (
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form[col.field] === true}
                        onChange={e => set(col.field, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">Có</span>
                    </label>
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
              {!editing && (
                <button onClick={() => handleSubmit(true)} disabled={pending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-300 bg-white hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-60"
                  title="Lưu dòng này và tiếp tục nhập dòng mới">
                  <Plus className="w-4 h-4" />
                  Lưu & thêm tiếp
                </button>
              )}
              <button onClick={() => handleSubmit(false)} disabled={pending}
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

      {/* Copy-year Modal */}
      {modal === 'copy' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <CopyPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Sao chép dữ liệu từ năm trước</h2>
                <p className="text-sm text-slate-500">Chép toàn bộ dòng sang năm {year} (trạng thái Nháp).</p>
              </div>
            </div>

            <label className="block">
              <span className="block text-sm font-semibold text-slate-700 mb-1">Năm nguồn</span>
              <input
                type="number"
                min="2000"
                max={year - 1}
                value={copyFromYear}
                onChange={e => setCopyFromYear(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Thao tác THÊM MỚI các dòng — dữ liệu năm {year} hiện có vẫn được giữ nguyên (có thể tạo trùng nếu chạy nhiều lần).</span>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} disabled={pending} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={handleCopyYear} disabled={pending || copyFromYear >= year}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Sao chép
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast ok={toast.ok} msg={toast.msg} onClose={() => setToast(null)} />}
    </>
  )
}
