'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInspectionAction } from '@/app/actions/kiem-tra'
import { DOMAIN_LABEL } from '@/lib/constants/tai-san'

type Asset = { id: string; name: string; assetCode: string; domain: string }
type Template = { id: string; name: string; domain: string }

export function NewInspectionForm({ assets, templates, defaultInspectorId }: { assets: Asset[]; templates: Template[]; defaultInspectorId: string }) {
  const [state, formAction, isPending] = useActionState(createInspectionAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      <input type="hidden" name="inspectorId" value={defaultInspectorId} />

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin phiếu kiểm tra</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tài sản cần kiểm tra *</Label>
            <select name="assetId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Chọn tài sản --</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetCode}) — {DOMAIN_LABEL[a.domain]}</option>)}
            </select>
            {state?.fieldErrors?.assetId && <p className="text-xs text-red-600">{state.fieldErrors.assetId[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Mẫu kiểm tra *</Label>
            <select name="templateId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Chọn mẫu --</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {state?.fieldErrors?.templateId && <p className="text-xs text-red-600">{state.fieldErrors.templateId[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Ngày kiểm tra kế hoạch *</Label>
            <Input name="scheduledDate" type="date" className="h-9" />
            {state?.fieldErrors?.scheduledDate && <p className="text-xs text-red-600">{state.fieldErrors.scheduledDate[0]}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Ghi chú</Label>
          <textarea name="notes" rows={3} placeholder="Ghi chú thêm..." className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Tạo phiếu kiểm tra'}
        </Button>
      </div>
    </form>
  )
}
