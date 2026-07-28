'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkOrderAction } from '@/app/actions/phieu-cv'
import { DOMAIN_OPTIONS } from '@/lib/constants/tai-san'
import { WO_TYPE_OPTIONS, WO_PRIORITY_OPTIONS } from '@/lib/constants/phieu-cv'

type Asset = { id: string; name: string; assetCode: string; domain: string }
type EU = { id: string; name: string }
type Incident = { id: string; incidentCode: string; title: string }

export function NewWorkOrderForm({ assets, executingUnits, incidents, createdById, defaultAssetId, defaultIncidentId }: { assets: Asset[]; executingUnits: EU[]; incidents: Incident[]; createdById: string; defaultAssetId?: string; defaultIncidentId?: string }) {
  const [state, formAction, isPending] = useActionState(createWorkOrderAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      <input type="hidden" name="createdById" value={createdById} />

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin phiếu</h3>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tiêu đề công việc *</Label>
          <Input name="title" placeholder="Mô tả ngắn gọn nội dung công việc" className="h-9" />
          {state?.fieldErrors?.title && <p className="text-xs text-red-600">{state.fieldErrors.title[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Loại công việc *</Label>
            <select name="type" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="">-- Chọn loại --</option>
              {WO_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {state?.fieldErrors?.type && <p className="text-xs text-red-600">{state.fieldErrors.type[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Lĩnh vực *</Label>
            <select name="domain" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="">-- Chọn lĩnh vực --</option>
              {DOMAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {state?.fieldErrors?.domain && <p className="text-xs text-red-600">{state.fieldErrors.domain[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Ưu tiên</Label>
            <select name="priority" defaultValue="TRUNG" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-500">
              {WO_PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tài sản</Label>
            <select name="assetId" defaultValue={defaultAssetId ?? ''} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="">-- Không xác định --</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Sự cố liên quan</Label>
            <select name="incidentId" defaultValue={defaultIncidentId ?? ''} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="">-- Không liên quan --</option>
              {incidents.map((i) => <option key={i.id} value={i.id}>{i.incidentCode}: {i.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Đơn vị thực hiện</Label>
            <select name="executingUnitId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-500">
              <option value="">-- Chưa phân công --</option>
              {executingUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Ngày bắt đầu KH</Label>
            <Input name="plannedStart" type="date" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Ngày kết thúc KH</Label>
            <Input name="plannedEnd" type="date" className="h-9" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Chi phí ước tính (đ)</Label>
          <Input name="estimatedCost" type="number" min="0" placeholder="0" className="h-9 w-48" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Mô tả nội dung công việc</Label>
          <textarea name="description" rows={3} placeholder="Nội dung chi tiết cần thực hiện..." className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Tạo phiếu công việc'}
        </Button>
      </div>
    </form>
  )
}
