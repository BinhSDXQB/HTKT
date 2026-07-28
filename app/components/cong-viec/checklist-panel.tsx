'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addCheckListAction, toggleCheckListAction, deleteCheckListAction, type CongViecFormState } from '@/app/actions/cong-viec'

type Item = { id: string; noiDung: string; hoanThanh: boolean }

/** Checklist đầu việc con: thêm / tick / xoá.
 *  canEdit = được thêm & tick (người quản lý, phụ trách, thành viên);
 *  canManage = được xoá mục (chỉ người quản lý việc). */
export function ChecklistPanel({ id, items, canEdit, canManage }: { id: string; items: Item[]; canEdit: boolean; canManage: boolean }) {
  const router = useRouter()
  const addRef = useRef<HTMLFormElement>(null)
  const [addState, addAction, adding] = useActionState<CongViecFormState, FormData>(addCheckListAction, null)
  const [toggleState, toggleAction, toggling] = useActionState<CongViecFormState, FormData>(toggleCheckListAction, null)
  const [delState, delAction, deleting] = useActionState<CongViecFormState, FormData>(deleteCheckListAction, null)

  useEffect(() => { if (addState?.ok) { addRef.current?.reset(); router.refresh() } }, [addState, router])
  useEffect(() => { if (toggleState?.ok) router.refresh() }, [toggleState, router])
  useEffect(() => { if (delState?.ok) router.refresh() }, [delState, router])

  const done = items.filter((c) => c.hoanThanh).length
  const error = addState?.error || toggleState?.error || delState?.error

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-slate-800 text-sm">Đầu việc con</p>
        {items.length > 0 && <span className="text-xs text-slate-400">{done}/{items.length} hoàn thành</span>}
      </div>
      {error && <div className="mb-2 rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

      <ul className="space-y-1.5">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-sm group">
            {canEdit ? (
              <form action={toggleAction} className="shrink-0 flex">
                <input type="hidden" name="itemId" value={c.id} />
                <button type="submit" disabled={toggling} title={c.hoanThanh ? 'Bỏ đánh dấu' : 'Đánh dấu hoàn thành'}
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors disabled:opacity-50 ${c.hoanThanh ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}>
                  {c.hoanThanh ? '✓' : ''}
                </button>
              </form>
            ) : (
              <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${c.hoanThanh ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>{c.hoanThanh ? '✓' : ''}</span>
            )}
            <span className={`flex-1 ${c.hoanThanh ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.noiDung}</span>
            {canManage && (
              <form action={delAction}>
                <input type="hidden" name="itemId" value={c.id} />
                <button type="submit" disabled={deleting} title="Xoá đầu việc" className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-slate-400">Chưa có đầu việc con.</li>}
      </ul>

      {canEdit && (
        <form ref={addRef} action={addAction} className="flex items-center gap-1.5 mt-3 pt-3 border-t">
          <input type="hidden" name="id" value={id} />
          <Input name="noiDung" required placeholder="Thêm đầu việc con..." className="h-8 text-sm" />
          <Button type="submit" size="sm" className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white" disabled={adding} title="Thêm">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </form>
      )}
    </div>
  )
}
