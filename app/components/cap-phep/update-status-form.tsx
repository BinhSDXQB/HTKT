'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateRoadPermitStatusAction } from '@/app/actions/cap-phep'
import { ROAD_PERMIT_STATUS_LABEL, ROAD_PERMIT_STATUS_COLOR } from '@/lib/constants/cap-phep'

// Luồng trạng thái hợp lệ (Workflow 9.3)
const STATUS_FLOW: Record<string, string[]> = {
  TAO_MOI:        ['DA_TIEP_NHAN', 'THU_HOI'],
  DA_TIEP_NHAN:   ['KIEM_TRA_HO_SO', 'CHO_BO_SUNG', 'TU_CHOI'],
  CHO_BO_SUNG:    ['KIEM_TRA_HO_SO', 'THU_HOI'],
  KIEM_TRA_HO_SO: ['KIEM_TRA_GIS', 'CHO_BO_SUNG', 'TU_CHOI'],
  KIEM_TRA_GIS:   ['DANG_THAM_DINH', 'CHO_BO_SUNG'],
  DANG_THAM_DINH: ['DE_NGHI_CAP', 'TU_CHOI'],
  DE_NGHI_CAP:    ['DA_CAP_PHEP', 'TU_CHOI'],
  DA_CAP_PHEP:    ['DANG_THI_CONG', 'HET_HAN', 'THU_HOI'],
  DANG_THI_CONG:  ['HOAN_THANH', 'THU_HOI'],
  HOAN_THANH:     [],
  TU_CHOI:        [],
  HET_HAN:        [],
  THU_HOI:        [],
}

type Props = {
  kind: 'oversized' | 'connection'
  id: string
  currentStatus: string
}

export function UpdateStatusForm({ kind, id, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const nextStatuses = STATUS_FLOW[currentStatus] ?? []

  function handleUpdate(toStatus: string) {
    const fd = new FormData()
    fd.set('kind', kind)
    fd.set('id', id)
    fd.set('toStatus', toStatus)
    fd.set('note', note)
    startTransition(async () => {
      const res = await updateRoadPermitStatusAction(null, fd)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Đã cập nhật trạng thái')
        setNote('')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Xử lý hồ sơ</h3>
      <div>
        <p className="text-xs text-slate-400 mb-1">Trạng thái hiện tại</p>
        <Badge className={`text-xs ${ROAD_PERMIT_STATUS_COLOR[currentStatus]}`}>{ROAD_PERMIT_STATUS_LABEL[currentStatus]}</Badge>
      </div>
      {nextStatuses.length > 0 ? (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ý kiến / ghi chú (tuỳ chọn)"
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Chuyển sang</p>
            {nextStatuses.map((s) => (
              <Button key={s} variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => handleUpdate(s)} disabled={isPending}>
                {isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                {ROAD_PERMIT_STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400">Hồ sơ đã kết thúc quy trình.</p>
      )}
    </div>
  )
}
