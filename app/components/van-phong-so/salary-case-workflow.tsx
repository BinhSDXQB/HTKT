'use client'

import { useActionState } from 'react'
import { Loader2, ClipboardCheck, Send, Check, Ban, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  reviewSalaryCaseAction, submitSalaryCaseAction, decideSalaryCaseAction, issueSalaryCaseAction,
  type OfficeFormState,
} from '@/app/actions/office'
import { KET_LUAN_RA_SOAT_OPTIONS } from '@/lib/office-labels'

export type CaseProps = {
  id: string
  trangThai: string
  ketLuanRaSoat: string | null
  noiDungRaSoat: string | null
  canCuPhapLy: string | null
  heSoDeXuat: string
  bacDeXuat: string
  ngayHuongMoi: string // yyyy-mm-dd or ''
  soQuyetDinh: string | null
}

export function SalaryCaseWorkflow({
  c,
  canReview,
  canApprove,
  canManage,
}: {
  c: CaseProps
  canReview: boolean
  canApprove: boolean
  canManage: boolean
}) {
  const editable = c.trangThai === 'DU_KIEN' || c.trangThai === 'DANG_RA_SOAT'
  const canSubmit = c.trangThai === 'DANG_RA_SOAT' && c.ketLuanRaSoat === 'DU_DIEU_KIEN'

  return (
    <div className="space-y-4">
      {canReview && editable && <ReviewForm c={c} />}
      {canReview && canSubmit && <SubmitForm id={c.id} />}
      {canApprove && c.trangThai === 'CHO_DUYET' && <DecideForm id={c.id} />}
      {canManage && c.trangThai === 'DA_DUYET' && <IssueForm c={c} />}

      {!canReview && editable && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Bạn chỉ có quyền xem — không thể rà soát/trình duyệt hồ sơ này.
        </p>
      )}
    </div>
  )
}

function Msg({ state }: { state: OfficeFormState }) {
  if (state?.error) return <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>
  return null
}

function ReviewForm({ c }: { c: CaseProps }) {
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(reviewSalaryCaseAction, null)
  return (
    <form action={action} className="rounded-xl border bg-slate-50/60 p-4 space-y-3">
      <input type="hidden" name="id" value={c.id} />
      <p className="font-semibold text-slate-800 text-sm flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-indigo-600" />Phiếu rà soát</p>
      <Msg state={state} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Kết luận rà soát *</Label>
          <select name="ketLuanRaSoat" defaultValue={c.ketLuanRaSoat ?? 'DU_DIEU_KIEN'} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            {KET_LUAN_RA_SOAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Căn cứ pháp lý</Label>
          <Input name="canCuPhapLy" defaultValue={c.canCuPhapLy ?? ''} className="h-9" placeholder="Số/tên văn bản" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Hệ số đề xuất</Label>
          <Input name="heSoDeXuat" defaultValue={c.heSoDeXuat} className="h-9" placeholder="VD: 3.33" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Bậc đề xuất</Label>
          <Input name="bacDeXuat" type="number" min="1" defaultValue={c.bacDeXuat} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày hưởng (dự kiến)</Label>
          <Input name="ngayHuongMoi" type="date" defaultValue={c.ngayHuongMoi} className="h-9" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium text-slate-600">Nội dung rà soát</Label>
          <Textarea name="noiDungRaSoat" defaultValue={c.noiDungRaSoat ?? ''} rows={3}
            placeholder="Rà soát ngạch/bậc, thời gian giữ bậc, đánh giá hằng năm, kỷ luật, quyết định lương..." />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[110px]" disabled={pending}>
          {pending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang lưu</> : 'Lưu phiếu rà soát'}
        </Button>
      </div>
    </form>
  )
}

function SubmitForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(submitSalaryCaseAction, null)
  return (
    <form action={action} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
      <input type="hidden" name="id" value={id} />
      <Msg state={state} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-amber-800">Hồ sơ đủ điều kiện — trình lãnh đạo Văn phòng duyệt.</p>
        <Button type="submit" size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Trình duyệt
        </Button>
      </div>
    </form>
  )
}

function DecideForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(decideSalaryCaseAction, null)
  return (
    <form action={action} className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
      <input type="hidden" name="id" value={id} />
      <Msg state={state} />
      <p className="text-sm text-indigo-800 font-medium">Lãnh đạo Văn phòng duyệt hồ sơ này?</p>
      <div className="flex gap-2">
        <Button type="submit" name="approve" value="true" size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={pending}>
          <Check className="w-4 h-4" /> Duyệt
        </Button>
        <Button type="submit" name="approve" value="false" size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" disabled={pending}>
          <Ban className="w-4 h-4" /> Không duyệt
        </Button>
      </div>
    </form>
  )
}

function IssueForm({ c }: { c: CaseProps }) {
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(issueSalaryCaseAction, null)
  return (
    <form action={action} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
      <input type="hidden" name="id" value={c.id} />
      <p className="font-semibold text-emerald-800 text-sm flex items-center gap-2"><FileSignature className="w-4 h-4" />Ban hành quyết định nâng lương</p>
      <Msg state={state} />
      <p className="text-xs text-slate-600">Ban hành sẽ ghi 1 mốc vào lịch sử lương của cán bộ và cập nhật hệ số hiện hành.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Số quyết định *</Label>
          <Input name="soQuyetDinh" defaultValue={c.soQuyetDinh ?? ''} className="h-9" />
          {state?.fieldErrors?.soQuyetDinh && <p className="text-xs text-red-600">{state.fieldErrors.soQuyetDinh[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày quyết định</Label>
          <Input name="ngayQuyetDinh" type="date" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Hệ số lương mới *</Label>
          <Input name="heSoMoi" defaultValue={c.heSoDeXuat} className="h-9" placeholder="VD: 3.33" />
          {state?.fieldErrors?.heSoMoi && <p className="text-xs text-red-600">{state.fieldErrors.heSoMoi[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày hưởng *</Label>
          <Input name="ngayHuongMoi" type="date" defaultValue={c.ngayHuongMoi} className="h-9" />
          {state?.fieldErrors?.ngayHuongMoi && <p className="text-xs text-red-600">{state.fieldErrors.ngayHuongMoi[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Nâng lương kế tiếp (dự kiến)</Label>
          <Input name="ngayNangTiep" type="date" className="h-9" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px]" disabled={pending}>
          {pending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang ban hành</> : 'Ban hành QĐ'}
        </Button>
      </div>
    </form>
  )
}
