'use client'

import { useActionState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { themThanhTich, capNhatCon, xoaThanhTich, themCon, type ConFormState } from '@/app/actions/con-can-bo'
import { CAP_DO_LABEL } from '@/lib/con-can-bo'

const inputCls = 'h-8 px-2 text-sm border rounded-md bg-white outline-none focus:ring-2 focus:ring-indigo-500'

function ThongBao({ s }: { s: ConFormState }) {
  if (s?.error) return <p className="text-xs text-rose-700">{s.error}</p>
  if (s?.ok) return <p className="text-xs text-emerald-700">Đã lưu.</p>
  return null
}

/** Thêm thành tích cho 1 cháu ở năm học đang xem: giấy khen / thi đạt giải cấp gì, môn gì. */
export function ThemThanhTichForm({ conId, namHoc }: { conId: string; namHoc: number }) {
  const [s, action, pending] = useActionState(themThanhTich, undefined)
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-indigo-700 hover:underline inline-flex items-center gap-1"><Plus className="w-3 h-3" />Thành tích</summary>
      <form action={action} className="mt-2 p-2 rounded-lg border bg-slate-50 space-y-2 min-w-[280px]">
        <input type="hidden" name="conId" value={conId} />
        <input type="hidden" name="namHoc" value={namHoc} />
        <div className="flex flex-wrap gap-2">
          <select name="loai" defaultValue="GIAI" className={inputCls}>
            <option value="GIAI">Thi đạt giải</option>
            <option value="DANH_HIEU">Danh hiệu (HS giỏi/xuất sắc)</option>
            <option value="KHAC">Khác</option>
          </select>
          <select name="capDo" defaultValue="" className={inputCls}>
            <option value="">Cấp — tự nhận từ nội dung</option>
            {Object.entries(CAP_DO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <input name="noiDung" required minLength={3} placeholder="Nội dung (vd: Giải Nhì Tiếng Anh IOE cấp tỉnh)" className={`${inputCls} w-full`} />
        <div className="flex flex-wrap gap-2">
          <input name="mon" placeholder="Môn (bỏ trống = tự nhận)" className={`${inputCls} w-40`} />
          <input name="xepGiai" placeholder="Giải (Nhất/Nhì/Ba/KK…)" className={`${inputCls} w-40`} />
          <select name="coGiayKhen" defaultValue="" className={inputCls}>
            <option value="">Giấy khen: chưa rõ</option>
            <option value="co">Có giấy khen</option>
            <option value="khong">Không có giấy khen</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={pending} className="h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1">
            {pending && <Loader2 className="w-3 h-3 animate-spin" />}Lưu thành tích
          </button>
          <ThongBao s={s} />
        </div>
      </form>
    </details>
  )
}

export function XoaThanhTichButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      title="Xoá thành tích"
      disabled={pending}
      onClick={() => { if (confirm('Xoá thành tích này?')) start(async () => { const r = await xoaThanhTich(id); if (r?.error) alert(r.error) }) }}
      className="text-slate-400 hover:text-rose-600 disabled:opacity-50"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
    </button>
  )
}

type CanBoOpt = { id: string; label: string }

/** Sửa thông tin cháu: xác nhận/chuyển đúng phụ huynh, đăng ký người phụ thuộc, ngày sinh thật. */
export function CapNhatConForm({ con, canBoOpts }: {
  con: { id: string; canBoId: string; hoTen: string; gioiTinh: string | null; ngaySinh: string | null; dangKyNPT: boolean; phuHuynhDaXacNhan: boolean; ghiChu: string | null }
  canBoOpts: CanBoOpt[]
}) {
  const [s, action, pending] = useActionState(capNhatCon, undefined)
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-slate-600 hover:text-indigo-700 inline-flex items-center gap-1"><Pencil className="w-3 h-3" />Sửa</summary>
      <form action={action} className="mt-2 p-2 rounded-lg border bg-slate-50 space-y-2 min-w-[300px]">
        <input type="hidden" name="conId" value={con.id} />
        <label className="block">Họ tên cháu<input name="hoTen" defaultValue={con.hoTen} className={`${inputCls} w-full mt-0.5`} /></label>
        <div className="flex flex-wrap gap-2">
          <label>Ngày sinh (giấy khai sinh)<input type="date" name="ngaySinh" defaultValue={con.ngaySinh ?? ''} className={`${inputCls} block mt-0.5`} /></label>
          <label>Giới tính
            <select name="gioiTinh" defaultValue={con.gioiTinh ?? ''} className={`${inputCls} block mt-0.5`}>
              <option value="">—</option><option value="NAM">Nam</option><option value="NU">Nữ</option>
            </select>
          </label>
        </div>
        <label className="block">Phụ huynh (cán bộ khai người phụ thuộc)
          <select name="canBoId" defaultValue={con.canBoId} className={`${inputCls} w-full mt-0.5`}>
            {canBoOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" name="phuHuynhDaXacNhan" defaultChecked={con.phuHuynhDaXacNhan} />Đã xác nhận đúng phụ huynh</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="dangKyNPT" defaultChecked={con.dangKyNPT} />Đăng ký người phụ thuộc (giảm trừ gia cảnh 6,2 triệu/tháng)</label>
        <input name="ghiChu" defaultValue={con.ghiChu ?? ''} placeholder="Ghi chú" className={`${inputCls} w-full`} />
        <div className="flex items-center gap-2">
          <button disabled={pending} className="h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1">
            {pending && <Loader2 className="w-3 h-3 animate-spin" />}Lưu
          </button>
          <ThongBao s={s} />
        </div>
      </form>
    </details>
  )
}

/** Thêm cháu mới (gia đình có thêm con) — chỉ dùng khi phát sinh, không phải rà lại hằng năm. */
export function ThemConForm({ canBoOpts, canBoId }: { canBoOpts: CanBoOpt[]; canBoId?: string }) {
  const [s, action, pending] = useActionState(themCon, undefined)
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-indigo-700 hover:underline inline-flex items-center gap-1"><Plus className="w-4 h-4" />Thêm cháu</summary>
      <form action={action} className="mt-2 p-3 rounded-lg border bg-slate-50 flex flex-wrap items-end gap-2">
        {canBoId ? <input type="hidden" name="canBoId" value={canBoId} /> : (
          <label className="text-xs">Phụ huynh
            <select name="canBoId" required defaultValue="" className={`${inputCls} block mt-0.5 w-64`}>
              <option value="" disabled>— Chọn cán bộ —</option>
              {canBoOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs">Họ tên cháu<input name="hoTen" required className={`${inputCls} block mt-0.5 w-52`} /></label>
        <label className="text-xs">Ngày sinh<input type="date" name="ngaySinh" className={`${inputCls} block mt-0.5`} /></label>
        <label className="text-xs">hoặc năm sinh<input type="number" name="namSinh" min={1990} max={2100} className={`${inputCls} block mt-0.5 w-24`} /></label>
        <label className="text-xs">Lớp năm học này<input type="number" name="lop" min={1} max={12} className={`${inputCls} block mt-0.5 w-20`} /></label>
        <label className="text-xs flex items-center gap-1 pb-2"><input type="checkbox" name="dangKyNPT" defaultChecked />Đăng ký NPT</label>
        <button disabled={pending} className="h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1">
          {pending && <Loader2 className="w-3 h-3 animate-spin" />}Thêm
        </button>
        <ThongBao s={s} />
      </form>
    </details>
  )
}
