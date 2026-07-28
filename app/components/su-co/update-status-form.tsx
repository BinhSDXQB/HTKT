'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { updateIncidentStatusAction } from '@/app/actions/su-co'
import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_COLOR } from '@/lib/constants/su-co'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const STATUS_FLOW: Record<string, string[]> = {
  MOI:           ['DA_TIEP_NHAN', 'DONG'],
  DA_TIEP_NHAN:  ['DANG_XU_LY', 'DONG'],
  DANG_XU_LY:    ['TAM_DUNG', 'DA_GIAI_QUYET'],
  TAM_DUNG:      ['DANG_XU_LY', 'DONG'],
  DA_GIAI_QUYET: ['DONG'],
  DONG:          [],
}

export function UpdateIncidentStatusForm({ incidentId, currentStatus }: { incidentId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const nextStatuses = STATUS_FLOW[currentStatus] ?? []

  function handleUpdate(newStatus: string) {
    startTransition(async () => {
      const result = await updateIncidentStatusAction(incidentId, newStatus)
      if (result?.error) toast.error(result.error)
      else toast.success('Đã cập nhật trạng thái')
    })
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Cập nhật trạng thái</h3>
      <div>
        <p className="text-xs text-slate-400 mb-1">Hiện tại</p>
        <Badge className={`text-xs ${INCIDENT_STATUS_COLOR[currentStatus]}`}>{INCIDENT_STATUS_LABEL[currentStatus]}</Badge>
      </div>
      {nextStatuses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Chuyển sang</p>
          {nextStatuses.map((s) => (
            <Button key={s} variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => handleUpdate(s)} disabled={isPending}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
              {INCIDENT_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Sự cố đã đóng</p>
      )}
    </div>
  )
}
