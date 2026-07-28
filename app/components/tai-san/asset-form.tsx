'use client'

import { useActionState, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DOMAIN_OPTIONS, CONDITION_OPTIONS, STATUS_OPTIONS } from '@/lib/constants/tai-san'
import { ASSET_TYPE_SPECS } from '@/lib/tech-specs/config'
import type { AssetFormState } from '@/app/actions/tai-san'

type AssetType = { id: string; name: string; domain: string; code: string }
type Ward = { id: string; name: string }
type Street = { id: string; name: string }

type DefaultValues = {
  assetCode?: string
  nationalCode?: string
  name?: string
  assetTypeId?: string
  assetTypeCode?: string
  domain?: string
  address?: string
  wardId?: string
  streetId?: string
  latitude?: string
  longitude?: string
  installDate?: string
  warrantyExpiry?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  condition?: string
  status?: string
  notes?: string
  techSpecs?: Record<string, unknown>
  lyTrinh?: string
  viTriDuong?: string
}

type AssetFormProps = {
  action: (prevState: AssetFormState, formData: FormData) => Promise<AssetFormState>
  assetTypes: AssetType[]
  wards: Ward[]
  streets: Street[]
  defaultValues?: DefaultValues
  submitLabel?: string
}

export function AssetForm({ action, assetTypes, wards, streets, defaultValues = {}, submitLabel = 'Lưu tài sản' }: AssetFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)
  const [selectedTypeCode, setSelectedTypeCode] = useState(defaultValues.assetTypeCode ?? '')
  const [hasStreet, setHasStreet] = useState(!!(defaultValues.streetId))

  const spec = selectedTypeCode ? ASSET_TYPE_SPECS[selectedTypeCode] ?? null : null
  const existingSpecs = defaultValues.techSpecs ?? {}

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value
    const found = assetTypes.find(t => t.id === selectedId)
    setSelectedTypeCode(found?.code ?? '')
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin cơ bản</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Mã tài sản *" error={state?.fieldErrors?.assetCode?.[0]}>
            <Input name="assetCode" defaultValue={defaultValues.assetCode} placeholder="VD: GT-D001" className="h-9" />
          </FormField>
          <FormField label="Tên tài sản *" error={state?.fieldErrors?.name?.[0]}>
            <Input name="name" defaultValue={defaultValues.name} placeholder="Tên đầy đủ của tài sản" className="h-9" />
          </FormField>
          <FormField label="Mã định danh quốc gia (QĐ2597)" error={state?.fieldErrors?.nationalCode?.[0]}>
            <Input name="nationalCode" defaultValue={defaultValues.nationalCode ?? ''} placeholder="Mã Bộ XD cấp (để trống nếu chưa có)" className="h-9" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Lĩnh vực *" error={state?.fieldErrors?.domain?.[0]}>
            <select name="domain" defaultValue={defaultValues.domain || ''} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn lĩnh vực --</option>
              {DOMAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Loại tài sản *" error={state?.fieldErrors?.assetTypeId?.[0]}>
            <select name="assetTypeId" defaultValue={defaultValues.assetTypeId || ''} onChange={handleTypeChange}
              className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn loại --</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tình trạng" error={state?.fieldErrors?.condition?.[0]}>
            <select name="condition" defaultValue={defaultValues.condition || 'TOT'} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Trạng thái" error={state?.fieldErrors?.status?.[0]}>
            <select name="status" defaultValue={defaultValues.status || 'DANG_SU_DUNG'} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Vị trí */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Vị trí</h3>

        <FormField label="Địa chỉ / Tuyến đường">
          <Input name="address" defaultValue={defaultValues.address} placeholder="VD: Đường Lê Lợi, đoạn từ..." className="h-9" />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Phường / Xã">
            <select name="wardId" defaultValue={defaultValues.wardId || ''} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn phường/xã --</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tuyến đường">
            <select name="streetId" defaultValue={defaultValues.streetId || ''}
              onChange={e => setHasStreet(!!e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn tuyến đường --</option>
              {streets.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Lý trình + vị trí ngang — chỉ hiện khi đã chọn tuyến đường */}
        {hasStreet && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-800">Vị trí trên tuyến (bình đồ duỗi thẳng)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Lý trình (m từ đầu tuyến)">
                <Input name="lyTrinh" type="number" step="0.1" min="0"
                  defaultValue={defaultValues.lyTrinh ?? ''}
                  placeholder="VD: 1250 (= Km 1+250)"
                  className="h-9" />
                <p className="text-xs text-amber-600 mt-0.5">
                  {defaultValues.lyTrinh
                    ? `= Km ${Math.floor(Number(defaultValues.lyTrinh) / 1000)}+${String(Math.round(Number(defaultValues.lyTrinh) % 1000)).padStart(3, '0')}`
                    : 'Nhập mét từ đầu tuyến'}
                </p>
              </FormField>
              <FormField label="Vị trí ngang">
                <select name="viTriDuong" defaultValue={defaultValues.viTriDuong || ''}
                  className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">-- Chọn --</option>
                  <option value="TRAI">◀ Trái (bên trái chiều đi)</option>
                  <option value="PHAI">▶ Phải (bên phải chiều đi)</option>
                  <option value="GIUA">▬ Giữa (dải phân cách)</option>
                  <option value="TREN">▲ Trên mặt đường</option>
                </select>
              </FormField>
              <FormField label="Khoảng cách từ tim đường (m)">
                <Input name="spec_kc_tim_duong" type="number" step="0.1" min="0"
                  defaultValue={defaultValues.techSpecs?.kc_tim_duong != null ? String(defaultValues.techSpecs.kc_tim_duong) : ''}
                  placeholder="VD: 2.5"
                  className="h-9" />
              </FormField>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Vĩ độ (Latitude)">
            <Input name="latitude" type="number" step="any" defaultValue={defaultValues.latitude} placeholder="VD: 16.8139" className="h-9" />
          </FormField>
          <FormField label="Kinh độ (Longitude)">
            <Input name="longitude" type="number" step="any" defaultValue={defaultValues.longitude} placeholder="VD: 107.0961" className="h-9" />
          </FormField>
        </div>
      </div>

      {/* Thông số chuyên ngành — hiển thị động theo loại tài sản */}
      {spec && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-blue-800 text-sm">Thông số chuyên ngành</h3>
            <p className="text-xs text-blue-600 mt-0.5">Các trường đặc thù theo loại tài sản đã chọn</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spec.fields.map((field) => {
              const defVal = existingSpecs[field.key]
              const fieldName = `spec_${field.key}`
              const label = `${field.label}${field.unit ? ` (${field.unit})` : ''}${field.required ? ' *' : ''}`

              if (field.type === 'boolean') {
                return (
                  <FormField key={field.key} label={label}>
                    <select name={fieldName} defaultValue={defVal != null ? String(defVal) : ''}
                      className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Chọn --</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </FormField>
                )
              }
              if (field.type === 'select' && field.options) {
                return (
                  <FormField key={field.key} label={label}>
                    <select name={fieldName} defaultValue={defVal != null ? String(defVal) : ''}
                      className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Chọn --</option>
                      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {field.description && <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>}
                  </FormField>
                )
              }
              if (field.type === 'text' || field.type === 'date' || field.type === 'number') {
                const isFullWidth = field.type === 'text' && (field.description || (String(field.label).length > 20))
                return (
                  <div key={field.key} className={isFullWidth ? 'sm:col-span-2' : ''}>
                    <FormField label={label}>
                      <Input name={fieldName} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        step={field.type === 'number' ? 'any' : undefined}
                        defaultValue={defVal != null ? String(defVal) : ''}
                        placeholder={field.description ?? ''}
                        className="h-9" />
                    </FormField>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      )}

      {!spec && selectedTypeCode && (
        <div className="bg-slate-50 rounded-xl border p-4 text-sm text-slate-500 text-center">
          Loại tài sản này chưa có cấu hình thông số chuyên ngành.
        </div>
      )}

      {/* Thông tin thiết bị */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin thiết bị / Nhà sản xuất</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nhà sản xuất / Cung cấp">
            <Input name="manufacturer" defaultValue={defaultValues.manufacturer} placeholder="VD: Công ty TNHH ABC" className="h-9" />
          </FormField>
          <FormField label="Model / Kiểu loại">
            <Input name="model" defaultValue={defaultValues.model} placeholder="VD: LED-150W" className="h-9" />
          </FormField>
        </div>

        <FormField label="Số series / Mã thiết bị">
          <Input name="serialNumber" defaultValue={defaultValues.serialNumber} placeholder="Số series hoặc mã định danh" className="h-9" />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Ngày lắp đặt / Xây dựng">
            <Input name="installDate" type="date" defaultValue={defaultValues.installDate} className="h-9" />
          </FormField>
          <FormField label="Hạn bảo hành">
            <Input name="warrantyExpiry" type="date" defaultValue={defaultValues.warrantyExpiry} className="h-9" />
          </FormField>
        </div>

        <FormField label="Ghi chú">
          <textarea name="notes" defaultValue={defaultValues.notes} placeholder="Ghi chú thêm về tài sản..."
            rows={3} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </FormField>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white min-w-[120px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
