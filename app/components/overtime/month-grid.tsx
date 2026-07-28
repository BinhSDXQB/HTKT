'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Check, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { quickCreateOvertimeAction } from '@/app/actions/overtime'

type Props = {
  toChucId: string
  nam: number
  // map tháng → { id, soNguoi } nếu đã có bảng
  existing: Record<number, { id: string; soNguoi: number }>
}

const THANG = Array.from({ length: 12 }, (_, i) => i + 1)

export function MonthGrid({ toChucId, nam, existing }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function openOrCreate(thang: number) {
    const ex = existing[thang]
    if (ex) { router.push(`/dashboard/cham-cong-lam-them/${ex.id}`); return }
    start(async () => {
      try { await quickCreateOvertimeAction(toChucId, thang, nam) }
      catch { toast.error('Không tạo được bảng tháng này.') }
    })
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {THANG.map((t) => {
        const ex = existing[t]
        const done = !!ex
        return (
          <button
            key={t}
            onClick={() => openOrCreate(t)}
            disabled={pending}
            className={`relative rounded-lg border px-3 py-3 text-left transition disabled:opacity-60 ${
              done ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-dashed border-slate-300 bg-white hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">T{t}</span>
              {done ? <Check className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-slate-400" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tháng {t}/{nam}
              {done ? <><br />{ex.soNguoi} người</> : <><br />chưa chấm</>}
            </p>
          </button>
        )
      })}
      {pending && (
        <div className="col-span-full flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang mở bảng…
        </div>
      )}
    </div>
  )
}
