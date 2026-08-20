import type { LoaiToChuc } from '@/lib/generated/prisma/client'

export type ToChucChon = {
  id: string
  ten: string
  tenVietTat: string | null
  loai: LoaiToChuc
}

/**
 * Ô chọn PHÒNG / ĐƠN VỊ cho tài khoản.
 *
 * Vì sao bắt buộc phải có: departmentCode — thứ quyết định menu và quyền truy cập
 * module — được suy ĐỘNG từ to_chuc.ma (lib/auth.ts). Tài khoản tạo ra mà không
 * gán tổ chức thì departmentCode = null, người dùng đăng nhập được nhưng KHÔNG
 * vào được chức năng của phòng nào.
 *
 * Nhóm hiển thị theo đúng cơ cấu Sở: Lãnh đạo Sở · Văn phòng · Phòng chuyên môn ·
 * Đơn vị trực thuộc (trung tâm, ban, viện, trường).
 */
const NHOM: { loai: LoaiToChuc; nhan: string }[] = [
  { loai: 'LANH_DAO_SO' as LoaiToChuc, nhan: 'Lãnh đạo Sở' },
  { loai: 'VAN_PHONG' as LoaiToChuc, nhan: 'Văn phòng Sở' },
  { loai: 'PHONG' as LoaiToChuc, nhan: 'Phòng chuyên môn thuộc Sở' },
  { loai: 'DON_VI_TRUC_THUOC' as LoaiToChuc, nhan: 'Đơn vị trực thuộc Sở (trung tâm, ban, viện, trường)' },
]

export function ToChucSelect({
  danhSach,
  defaultValue,
}: {
  danhSach: ToChucChon[]
  defaultValue?: string | null
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">Phòng / Đơn vị công tác</label>
      <select
        name="toChucId"
        defaultValue={defaultValue ?? ''}
        className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Chưa gán phòng/đơn vị --</option>
        {NHOM.map((n) => {
          const items = danhSach.filter((t) => t.loai === n.loai)
          if (items.length === 0) return null
          return (
            <optgroup key={String(n.loai)} label={n.nhan}>
              {items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten}
                  {t.tenVietTat ? ` (${t.tenVietTat})` : ''}
                </option>
              ))}
            </optgroup>
          )
        })}
      </select>
      <p className="text-xs text-slate-500">
        Quyết định người dùng thấy menu và dùng được chức năng của phòng/đơn vị nào.
        Để trống thì tài khoản đăng nhập được nhưng chưa vào được nghiệp vụ của phòng nào.
      </p>
    </div>
  )
}
