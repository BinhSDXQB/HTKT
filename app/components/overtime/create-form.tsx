'use client'

import { useActionState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createOvertimeTimesheetAction } from '@/app/actions/overtime'

const inputCls = 'h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500'

const THANG = Array.from({ length: 12 }, (_, i) => i + 1)

type Props = {
  departments: { id: string; ten: string }[]
  lockedDept: string | null
  defaultThang: number
  defaultNam: number
}

export function OvertimeCreateForm({ departments, lockedDept, defaultThang, defaultNam }: Props) {
  const [state, formAction, isPending] = useActionState(createOvertimeTimesheetAction, null)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  const namOptions = [defaultNam - 1, defaultNam, defaultNam + 1]

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Phòng / đơn vị</label>
        {lockedDept ? (
          <>
            <input type="hidden" name="toChucId" value={lockedDept} />
            <div className={`${inputCls} flex items-center min-w-[240px] bg-slate-50 text-slate-700`}>
              {departments.find((d) => d.id === lockedDept)?.ten ?? '—'}
            </div>
          </>
        ) : (
          <select name="toChucId" className={`${inputCls} min-w-[240px]`} defaultValue="">
            <option value="" disabled>— Chọn phòng —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.ten}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Tháng</label>
        <select name="thang" className={inputCls} defaultValue={defaultThang}>
          {THANG.map((t) => <option key={t} value={t}>Tháng {t}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Năm</label>
        <select name="nam" className={inputCls} defaultValue={defaultNam}>
          {namOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
        {isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
        Tạo & nạp danh sách
      </Button>

      {state?.fieldErrors && (
        <p className="w-full text-xs text-red-600">
          {Object.values(state.fieldErrors).flat().join('; ')}
        </p>
      )}
    </form>
  )
}
