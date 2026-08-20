'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { kiemTraTenDangNhap } from '@/lib/ten-dang-nhap'

// TEN DANG NHAP = SO CCCD (xem lib/ten-dang-nhap.ts). Truoc day dung .email()
// nen khong the them nguoi dung bang so CCCD.
const tenDangNhapField = z.string().superRefine((v, ctx) => {
  const kq = kiemTraTenDangNhap(v)
  if (!kq.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: kq.loi })
}).transform((v) => {
  const kq = kiemTraTenDangNhap(v)
  return kq.ok ? kq.giaTri : v
})

const UserSchema = z.object({
  name:     z.string().min(1, { message: 'Vui lòng nhập họ tên' }),
  email:    tenDangNhapField,
  roleId:   z.string().min(1, { message: 'Vui lòng chọn vai trò' }),
  toChucId: z.string().optional(),
  phone:    z.string().optional(),
  password: z.string().min(8, { message: 'Mật khẩu tối thiểu 8 ký tự' }),
})

const UpdateUserSchema = z.object({
  userId:   z.string().min(1),
  name:     z.string().min(1, { message: 'Vui lòng nhập họ tên' }),
  email:    tenDangNhapField,
  roleId:   z.string().min(1, { message: 'Vui lòng chọn vai trò' }),
  toChucId: z.string().optional(),
  phone:    z.string().optional(),
  password: z.string().min(8, { message: 'Mật khẩu tối thiểu 8 ký tự' }).optional(),
  isActive: z.boolean().optional(),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof UserSchema>, string[]>>
export type UserFormState = { error?: string; fieldErrors?: FieldErrors } | null

export async function createUserAction(prevState: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requireAuth()
  if (admin.role?.name !== 'admin') return { error: 'Chỉ admin mới có quyền tạo tài khoản' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = UserSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors }

  const d = parsed.data
  const existing = await db.user.findUnique({ where: { email: d.email } })
  if (existing) return { error: `Tên đăng nhập "${d.email}" đã được sử dụng` }

  // Gan don vi: departmentCode (quyet dinh menu + quyen module) duoc SUY DONG tu
  // to_chuc.ma. Khong gan toChucId thi tai khoan khong vao duoc chuc nang phong nao.
  if (d.toChucId) {
    // Chi nhan don vi CAP 2 thuoc So (dung pham vi o chon hien thi). Kiem ca o day
    // vi client co the POST thang toChucId cua "So Xay dung" cap 1 hoac UBND phuong/xa.
    const tc = await db.toChuc.findFirst({
      where: {
        id: d.toChucId, isActive: true, cap: 2,
        loai: { in: ['LANH_DAO_SO', 'VAN_PHONG', 'PHONG', 'BAN', 'DON_VI_TRUC_THUOC'] },
      },
      select: { id: true },
    })
    if (!tc) return { error: 'Phòng/đơn vị không hợp lệ hoặc đã ngừng hoạt động' }
  }

  const hashed = await bcrypt.hash(d.password, 12)
  const user = await db.user.create({
    data: {
      name: d.name, email: d.email, roleId: d.roleId, phone: d.phone || null,
      toChucId: d.toChucId || null, password: hashed, isActive: true,
    },
  })

  await logAction({ userId: admin.id, action: 'CREATE', module: 'admin', targetId: user.id, targetType: 'User', detail: `Tạo tài khoản: ${user.email}` })
  revalidatePath('/dashboard/cai-dat/users')
  redirect('/dashboard/cai-dat/users')
}

export async function updateUserAction(prevState: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requireAuth()
  if (admin.role?.name !== 'admin') return { error: 'Chỉ admin mới có quyền sửa tài khoản' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = UpdateUserSchema.safeParse({ ...raw, isActive: raw.isActive === 'on' })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors }

  const d = parsed.data
  const user = await db.user.findUnique({ where: { id: d.userId } })
  if (!user) return { error: 'Người dùng không tồn tại' }

  const existing = await db.user.findUnique({ where: { email: d.email } })
  if (existing && existing.id !== d.userId) return { error: `Tên đăng nhập "${d.email}" đã được sử dụng` }

  if (d.toChucId) {
    // Chi nhan don vi CAP 2 thuoc So (dung pham vi o chon hien thi). Kiem ca o day
    // vi client co the POST thang toChucId cua "So Xay dung" cap 1 hoac UBND phuong/xa.
    const tc = await db.toChuc.findFirst({
      where: {
        id: d.toChucId, isActive: true, cap: 2,
        loai: { in: ['LANH_DAO_SO', 'VAN_PHONG', 'PHONG', 'BAN', 'DON_VI_TRUC_THUOC'] },
      },
      select: { id: true },
    })
    if (!tc) return { error: 'Phòng/đơn vị không hợp lệ hoặc đã ngừng hoạt động' }
  }

  const updateData: any = {
    name: d.name, email: d.email, roleId: d.roleId, phone: d.phone || null,
    toChucId: d.toChucId || null, isActive: d.isActive ?? true,
  }
  if (d.password) {
    updateData.password = await bcrypt.hash(d.password, 12)
  }

  const updated = await db.user.update({ where: { id: d.userId }, data: updateData })
  await logAction({ userId: admin.id, action: 'UPDATE', module: 'admin', targetId: updated.id, targetType: 'User', detail: `Sửa tài khoản: ${updated.email}` })
  revalidatePath('/dashboard/cai-dat/users')
  redirect('/dashboard/cai-dat/users')
}
