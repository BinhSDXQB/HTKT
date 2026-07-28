'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { updateWOStatusAction } from '@/app/actions/phieu-cv'
import { WO_STATUS_LABEL, WO_STATUS_COLOR } from '@/lib/constants/phieu-cv'
import { toast } from 'sonner'

const STATUS_FLOW: Record<string, string[]> = {
  MOI:            ['DA_GIAO', 'HUY'],
  DA_GIAO:        ['DANG_THUC_HIEN', 'HUY'],
  DANG_THUC_HIEN: ['TAM_DUNG', 'HOAN_THANH'],
  TAM_DUNG:       ['DANG_THUC_HIEN', 'HUY'],
  HOAN_THANH:     ['NGHIEM_THU'],
  NGHIEM_THU:     [],
  HUY:            [],
}

export function UpdateWOStatusForm({ workOrderId, currentStatus }: { workOrderId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const nextStatuses = STATUS_FLOW[currentStatus] ?? []

  function handleUpdate(s: string) {
    startTransition(async () => {
      const result = await updateWOStatusAction(workOrderId, s)
      if (result?.error) toast.error(result.error)
      else toast.success('Đã cập nhật trạng thái')
    })
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Cập nhật trạng thái</h3>
      <div>
        <p className="text-xs text-slate-400 mb-1">Hiện tại</p>
        <Badge className={`text-xs ${WO_STATUS_COLOR[currentStatus]}`}>{WO_STATUS_LABEL[currentStatus]}</Badge>
      </div>
      {nextStatuses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Chuyển sang</p>
          {nextStatuses.map((s) => (
            <Button key={s} variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => handleUpdate(s)} disabled={isPending}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
              {WO_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Phiếu đã hoàn tất</p>
      )}
    </div>
  )
}
