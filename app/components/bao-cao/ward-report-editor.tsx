'use client'

import { useState, useActionState } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateWardReportRowsAction, type UpdateRowsState } from '@/app/actions/ward-reports'

type Props = {
  id: string
  initialColumns: string[]
  initialRows: (string | number | null)[][]
  initialNotes?: string | null
  status: string
}

export function WardReportEditor({ id, initialColumns, initialRows, initialNotes, status }: Props) {
  const [columns, setColumns] = useState<string[]>(initialColumns)
  const [rows, setRows] = useState<(string | number | null)[][]>(initialRows)
  const [notes, setNotes] = useState(initialNotes ?? '')

  const boundAction = updateWardReportRowsAction.bind(null, id)
  const [state, formAction, isPending] = useActionState<UpdateRowsState, FormData>(boundAction, null)

  const isLocked = status === 'CHINH_THUC'

  function addRow() {
    setRows(r => [...r, columns.map(() => null)])
  }

  function deleteRow(ri: number) {
    setRows(r => r.filter((_, i) => i !== ri))
  }

  function setCell(ri: number, ci: number, val: string) {
    setRows(r => r.map((row, i) => i === ri ? row.map((c, j) => j === ci ? (val === '' ? null : (isNaN(Number(val)) ? val : Number(val))) : c) : row))
  }

  function addColumn() {
    const name = prompt('Tên cột mới:')
    if (!name) return
    setColumns(c => [...c, name])
    setRows(r => r.map(row => [...row, null]))
  }

  function deleteColumn(ci: number) {
    if (!confirm(`Xóa cột "${columns[ci]}"?`)) return
    setColumns(c => c.filter((_, i) => i !== ci))
    setRows(r => r.map(row => row.filter((_, i) => i !== ci)))
  }

  function renameColumn(ci: number) {
    const name = prompt('Đổi tên cột:', columns[ci])
    if (!name) return
    setColumns(c => c.map((v, i) => i === ci ? name : v))
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="columns" value={JSON.stringify(columns)} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      {state?.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />{state.success}
        </div>
      )}

      {isLocked && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Báo cáo đã được xác nhận chính thức — chuyển về &quot;Bản nháp&quot; để chỉnh sửa.
        </div>
      )}

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b">
              <th className="px-3 py-2 text-xs text-slate-500 font-medium w-10 text-center">#</th>
              {columns.map((col, ci) => (
                <th key={ci} className="px-3 py-2 text-left font-medium text-slate-700 min-w-[120px]">
                  {isLocked ? col : (
                    <span className="flex items-center gap-1 group">
                      <button type="button" onClick={() => renameColumn(ci)}
                        className="hover:text-blue-700 cursor-pointer text-left flex-1"
                        title="Click đổi tên cột">{col}</button>
                      <button type="button" onClick={() => deleteColumn(ci)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                        title="Xóa cột">×</button>
                    </span>
                  )}
                </th>
              ))}
              {!isLocked && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-slate-400 text-xs">
                  Chưa có dữ liệu. Nhấn &quot;Thêm hàng&quot; để bắt đầu.
                </td>
              </tr>
            ) : rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50">
                <td className="px-3 py-1.5 text-xs text-slate-400 text-center">{ri + 1}</td>
                {columns.map((_, ci) => (
                  <td key={ci} className="px-1 py-1">
                    {isLocked ? (
                      <span className="px-2 py-1 text-sm text-slate-700">{row[ci] ?? ''}</span>
                    ) : (
                      <input
                        type="text"
                        value={row[ci] !== null && row[ci] !== undefined ? String(row[ci]) : ''}
                        onChange={e => setCell(ri, ci, e.target.value)}
                        className="w-full px-2 py-1 text-sm border-0 rounded focus:bg-blue-50 focus:outline focus:outline-2 focus:outline-blue-400 bg-transparent"
                      />
                    )}
                  </td>
                ))}
                {!isLocked && (
                  <td className="px-2 py-1">
                    <button type="button" onClick={() => deleteRow(ri)}
                      className="text-red-400 hover:text-red-600 p-1 rounded" title="Xóa hàng">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ghi chú */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Ghi chú</label>
        <textarea name="notes" value={notes} onChange={e => setNotes(e.target.value)}
          disabled={isLocked} rows={2}
          placeholder="Ghi chú về báo cáo này..."
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none disabled:bg-slate-50 disabled:text-slate-500" />
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="flex items-center gap-3 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Thêm hàng
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addColumn} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Thêm cột
          </Button>
          <span className="flex-1" />
          <span className="text-xs text-slate-400">{rows.length} hàng · {columns.length} cột</span>
          <Button type="submit" disabled={isPending} className="bg-green-700 hover:bg-green-800 text-white gap-1.5">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Save className="w-4 h-4" />Lưu thay đổi</>}
          </Button>
        </div>
      )}
    </form>
  )
}
