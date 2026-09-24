'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { deptCodeFromToChucMa } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { sendMail, isMailConfigured, getAppUrl } from '@/lib/mailer'
import { chapNhanChoQuenMatKhau } from '@/lib/ten-dang-nhap'

const LoginSchema = z.object({
  email: z.string().min(1, { message: 'Vui lòng nhập tên đăng nhập' }),
  password: z.string().min(1, { message: 'Vui lòng nhập mật khẩu' }),
})

export type LoginState = {
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
} | null

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as {
      email?: string[]
      password?: string[]
    }
    return { fieldErrors }
  }

  const { email, password } = parsed.data

  let user: Awaited<ReturnType<typeof findUserByEmail>>
  try {
    user = await findUserByEmail(email)
  } catch {
    return { error: 'Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại.' }
  }

  if (!user) return { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }
  if (!user.isActive) return { error: 'Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên.' }

  // Khoá sau 5 lần nhập sai liên tiếp — chỉ mở lại khi quản trị cấp lại mật khẩu.
  const MAX_FAILED = 5
  if (user.failedLoginCount >= MAX_FAILED) {
    return { error: `Tài khoản đã bị TẠM KHOÁ do nhập sai mật khẩu ${MAX_FAILED} lần. Bạn không thể tự đăng nhập — vui lòng bấm “Quên mật khẩu?” để được cấp lại, hoặc liên hệ quản trị viên qua email/Zalo bên dưới.` }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    const soLanSai = user.failedLoginCount + 1
    await db.user.update({ where: { id: user.id }, data: { failedLoginCount: soLanSai } }).catch(() => {})
    const conLai = MAX_FAILED - soLanSai
    if (conLai <= 0) {
      return { error: `Sai mật khẩu. Bạn đã nhập sai đủ ${MAX_FAILED} lần nên tài khoản bị TẠM KHOÁ. Vui lòng bấm “Quên mật khẩu?” để được cấp lại, hoặc liên hệ quản trị viên qua email/Zalo bên dưới.` }
    }
    return { error: `Tên đăng nhập hoặc mật khẩu không đúng. Bạn được nhập tối đa ${MAX_FAILED} lần — còn ${conLai} lần, sai hết sẽ bị khoá và phải liên hệ quản trị để cấp lại. Nếu quên mật khẩu, bấm “Quên mật khẩu?”.` }
  }

  // Tính module phòng ban được phép truy cập (cho middleware chặn nhanh ở edge)
  const permKeys = new Set(
    user.role.permissions.map(({ permission }) => `${permission.module}:${permission.action}`)
  )
  const isAdmin = user.role.name === 'admin'
  // Suy ĐỘNG từ to_chuc.ma — không đọc cột users.departmentCode (chờ xoá khi cutover org_v2)
  const deptCode = deptCodeFromToChucMa(user.toChuc?.ma)
  const allowedModules: string[] = []
  if (isAdmin || deptCode === 'VPS' || permKeys.has('office:menu_access')) {
    allowedModules.push('office')
  }
  if (isAdmin || deptCode === 'HTKT' || permKeys.has('htkt:menu_access')) {
    allowedModules.push('htkt')
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    roleId: user.role.id,
    roleName: user.role.name,
    departmentCode: deptCode,
    allowedModules,
  })

  db.user
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedLoginCount: 0 } })
    .catch((err) => console.error('[Auth] Failed to update lastLoginAt:', err))

  await logAction({
    userId: user.id,
    action: 'LOGIN',
    module: 'admin',
    detail: `Đăng nhập thành công: ${user.email}`,
  })

  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  const session = await getSession()
  if (session?.userId) {
    await logAction({
      userId: session.userId,
      action: 'LOGOUT',
      module: 'admin',
      detail: `Đăng xuất: ${session.email}`,
    })
  }
  await deleteSession()
  redirect('/login')
}

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Vui lòng nhập mật khẩu hiện tại' }),
  newPassword: z.string()
    .min(8,  { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    .regex(/[A-Z]/, { message: 'Phải có ít nhất 1 chữ hoa (A–Z)' })
    .regex(/[a-z]/, { message: 'Phải có ít nhất 1 chữ thường (a–z)' })
    .regex(/[0-9]/, { message: 'Phải có ít nhất 1 chữ số (0–9)' })
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, { message: 'Phải có ít nhất 1 ký tự đặc biệt (!@#$%...)' }),
  confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu' }),
})

export type ChangePasswordState = {
  error?: string
  success?: string
  fieldErrors?: {
    currentPassword?: string[]
    newPassword?: string[]
    confirmPassword?: string[]
  }
} | null

export async function changePasswordAction(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    currentPassword: formData.get('currentPassword') as string,
    newPassword: formData.get('newPassword') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const parsed = ChangePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors
    return { fieldErrors: { currentPassword: fe.currentPassword, newPassword: fe.newPassword, confirmPassword: fe.confirmPassword } }
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data
  if (newPassword !== confirmPassword) {
    return { fieldErrors: { confirmPassword: ['Mật khẩu xác nhận không khớp'] } }
  }

  const user = await db.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect('/login')

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) return { fieldErrors: { currentPassword: ['Mật khẩu hiện tại không đúng'] } }

  if (await bcrypt.compare(newPassword, user.password)) {
    return { fieldErrors: { newPassword: ['Mật khẩu mới phải khác mật khẩu hiện tại'] } }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({
    where: { id: user.id },
    data: { password: hashed, mustChangePassword: false, failedLoginCount: 0 },
  })

  await logAction({ userId: user.id, action: 'CHANGE_PASSWORD', module: 'admin', detail: 'Đổi mật khẩu thành công' })

  return { success: 'Đổi mật khẩu thành công!' }
}

// ───────────────────────── Quên / Cấp lại mật khẩu qua email ─────────────────────────
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}
function isRealEmail(s?: string | null): boolean {
  return !!s && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim())
}

// Sinh mật khẩu tạm dễ đọc, đủ chính sách (hoa+thường+số+ký tự đặc biệt), tránh ký tự dễ nhầm.
function genTempPassword(): string {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const L = 'abcdefghijkmnpqrstuvwxyz'
  const D = '23456789'
  const S = '@#$%*!'
  const pick = (s: string) => s[crypto.randomInt(s.length)]
  let mid = ''
  for (let i = 0; i < 4; i++) mid += pick(L)
  return pick(U) + mid + pick(D) + pick(D) + pick(S) // vd: Qabcd83@
}

export type ForgotState = { error?: string; success?: string } | null

export async function forgotPasswordAction(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const username = String(formData.get('email') ?? '').trim()
  if (!username) return { error: 'Vui lòng nhập tên đăng nhập.' }

  // Kênh liên hệ Quản trị (email/Zalo) lấy từ Cấu hình cơ quan — chèn vào mọi thông báo hướng dẫn.
  const cfg = await db.facilityConfig.findFirst().catch(() => null)
  const adminEmail = cfg?.email?.trim() || ''
  const adminPhone = (cfg?.dienThoai || '').replace(/\D/g, '')
  const kenh = [adminEmail && `email ${adminEmail}`, adminPhone && `Zalo ${adminPhone}`].filter(Boolean).join(' hoặc ')
  const lienHe = kenh
    ? ` Để lấy lại mật khẩu, vui lòng kiểm tra email đã đăng ký, hoặc liên hệ quản trị viên qua ${kenh}.`
    : ' Vui lòng liên hệ quản trị viên để được hỗ trợ.'

  // YÊU CẦU: tên đăng nhập phải đúng SỐ CCCD (12 số) hoặc MÃ PHƯỜNG/XÃ (5 số) — nhập khác là từ chối.
  const kqTenDangNhap = chapNhanChoQuenMatKhau(username)
  if (!kqTenDangNhap.ok) {
    return { error: 'Từ chối: Tên đăng nhập không hợp lệ. Chỉ chấp nhận SỐ CCCD gồm 12 chữ số (đối với cán bộ) hoặc MÃ PHƯỜNG/XÃ gồm 5 chữ số (đối với đơn vị). Vui lòng nhập đúng, không nhập ký tự hay định dạng khác.' + lienHe }
  }
  const digits = kqTenDangNhap.digits

  if (!isMailConfigured()) {
    return { error: 'Hệ thống gửi email (SMTP) chưa được cấu hình.' + lienHe }
  }

  let user
  try { user = await findUserByEmail(digits) } catch { return { error: 'Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại.' } }
  if (!user || !user.isActive) {
    return { error: `Từ chối: Tên đăng nhập "${username}" không có trong hệ thống (hoặc tài khoản đã bị khoá). Vui lòng nhập đúng số CCCD hoặc mã phường/xã ĐANG SỬ DỤNG.` + lienHe }
  }

  const generic: ForgotState = {
    success: `Đã gửi MẬT KHẨU MỚI tới email đăng ký (hoặc quản trị viên nếu tài khoản chưa có email). Vui lòng kiểm tra hộp thư (kể cả mục Spam) và đổi lại mật khẩu sau khi đăng nhập.${adminPhone ? ` Nếu không nhận được, liên hệ quản trị viên qua Zalo ${adminPhone}.` : ''}`,
  }

  // CẤP LẠI MẬT KHẨU TẠM mới (đúng chính sách) — gửi qua email để dùng ngay rồi đổi sau.
  // LƯU Ý: CHƯA ghi vào CSDL ở đây — chỉ ghi SAU KHI gửi email thành công (xem dưới), để
  // tránh trường hợp gửi email lỗi (SMTP tạm trục trặc) mà mật khẩu cũ đã bị đổi, khiến
  // người dùng mất quyền truy cập hoàn toàn mà không nhận được mật khẩu mới.
  const tempPassword = genTempPassword()
  const hashedTemp = await bcrypt.hash(tempPassword, 12)

  // Thông tin định danh tài khoản — TỰ ĐỘNG đưa CCCD / mã phường-xã + đơn vị vào email
  const canBo = await db.canBo.findUnique({
    where: { userId: user.id },
    select: { email: true, hoTen: true, phongBan: true, toChuc: { select: { ten: true } } },
  })
  const acctInfo = await db.user.findUnique({
    where: { id: user.id },
    select: { ward: { select: { name: true } }, toChuc: { select: { ten: true } } },
  })
  const userEmail = isRealEmail(canBo?.email) ? canBo!.email!.trim() : (isRealEmail(user.email) ? user.email : '')
  const tenNguoi = canBo?.hoTen || user.name || username
  const donVi = canBo?.toChuc?.ten || canBo?.phongBan || acctInfo?.ward?.name || acctInfo?.toChuc?.ten || '—'

  // Nhận diện loại tài khoản theo độ dài: 5 số = mã phường/xã, 11–12 số = CCCD
  const idLen = (user.email || '').replace(/\D/g, '').length
  const nhanTaiKhoan = idLen === 5 ? 'Mã phường/xã' : (idLen >= 11 ? 'Số CCCD' : 'Tên đăng nhập')
  const subject = `[QLHTKT] Mật khẩu mới — ${nhanTaiKhoan} ${user.email}`

  // ── Mẫu email gọn: logo + tiêu đề cơ quan + lời chào + mật khẩu nổi bật ──
  const coQuanTren = cfg?.coQuanCapTren || 'UBND TỈNH QUẢNG TRỊ'
  const tenCoQuan = cfg?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ'
  const logoUrl = `${getAppUrl()}/logo-htkt.png`
  const loginUrl = `${getAppUrl()}/login`

  const header =
    `<div style="text-align:center;border-bottom:2px solid #1d4ed8;padding-bottom:10px;margin-bottom:14px">` +
    `<img src="${logoUrl}" alt="Logo" width="56" height="56" style="object-fit:contain"/>` +
    `<div style="font-size:12px;color:#475569;text-transform:uppercase">${coQuanTren}</div>` +
    `<div style="font-size:15px;font-weight:bold;color:#1e3a8a;text-transform:uppercase">${tenCoQuan}</div></div>`
  const dinhDanhHtml =
    `<table cellpadding="5" style="border-collapse:collapse;font-size:14px;margin:6px 0">` +
    `<tr><td style="color:#64748b">${nhanTaiKhoan}:</td><td><b>${user.email}</b></td></tr>` +
    `<tr><td style="color:#64748b">Họ tên / Đơn vị:</td><td>${tenNguoi}</td></tr>` +
    `<tr><td style="color:#64748b">Đơn vị / Phường-xã:</td><td>${donVi}</td></tr>` +
    `</table>`
  const passBox =
    `<p style="margin:14px 0 4px;color:#334155">Mật khẩu mới của bạn:</p>` +
    `<div style="font-size:28px;font-weight:bold;letter-spacing:2px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;text-align:center;font-family:Consolas,'Courier New',monospace">${tempPassword}</div>`
  const footer =
    `<p style="font-size:13px;color:#475569;margin-top:14px">Đăng nhập tại <a href="${loginUrl}">${loginUrl}</a> và <b>đổi mật khẩu ngay</b> sau khi vào hệ thống để bảo mật.</p>` +
    `<p style="font-size:12px;color:#94a3b8;margin-top:10px">Email tự động từ Hệ thống QLHTKT — vui lòng không trả lời.</p>`
  const wrap = (intro: string) =>
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:auto;color:#1f2937;padding:16px">` +
    `${header}${intro}${dinhDanhHtml}${passBox}${footer}</div>`

  let recipient = ''
  let html = ''
  if (userEmail) {
    recipient = userEmail
    html = wrap(`<p>Kính gửi <b>${tenNguoi}</b>,</p><p>Hệ thống đã cấp lại mật khẩu cho tài khoản của bạn:</p>`)
  } else if (isRealEmail(adminEmail)) {
    recipient = adminEmail
    html = wrap(`<p>Kính gửi Quản trị viên,</p><p>Đã cấp lại mật khẩu cho tài khoản sau (chưa có email cá nhân) — vui lòng chuyển mật khẩu cho người dùng:</p>`)
  } else {
    return { error: 'Tài khoản chưa có email cá nhân và hệ thống chưa cấu hình email quản trị, nên không thể gửi mật khẩu mới.' + lienHe }
  }

  try {
    await sendMail({ to: recipient, subject, html })
  } catch (e) {
    console.error('[Auth] sendMail reset error:', e)
    return { error: 'Không gửi được email lúc này. Mật khẩu CHƯA bị thay đổi — vui lòng thử lại sau.' + lienHe }
  }

  // Gửi email THÀNH CÔNG rồi mới ghi mật khẩu mới vào CSDL (xem lưu ý ở trên).
  await db.user.update({
    where: { id: user.id },
    data: { password: hashedTemp, mustChangePassword: true, failedLoginCount: 0, resetTokenHash: null, resetTokenExpiresAt: null },
  })

  await logAction({
    userId: user.id, action: 'RESET_PASSWORD', module: 'admin',
    detail: `Cấp lại mật khẩu (gửi email): ${user.email} → ${recipient}`,
  })
  return generic
}

const PASSWORD_POLICY = z.string()
  .min(8,  { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  .regex(/[A-Z]/, { message: 'Phải có ít nhất 1 chữ hoa (A–Z)' })
  .regex(/[a-z]/, { message: 'Phải có ít nhất 1 chữ thường (a–z)' })
  .regex(/[0-9]/, { message: 'Phải có ít nhất 1 chữ số (0–9)' })
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, { message: 'Phải có ít nhất 1 ký tự đặc biệt (!@#$%...)' })

const ResetSchema = z.object({
  token: z.string().min(10, { message: 'Liên kết không hợp lệ' }),
  newPassword: PASSWORD_POLICY,
  confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu' }),
})

export type ResetState = {
  error?: string
  success?: string
  fieldErrors?: { newPassword?: string[]; confirmPassword?: string[] }
} | null

export async function resetPasswordAction(prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = ResetSchema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors
    if (fe.token) return { error: 'Liên kết đặt lại mật khẩu không hợp lệ.' }
    return { fieldErrors: { newPassword: fe.newPassword, confirmPassword: fe.confirmPassword } }
  }
  const { token, newPassword, confirmPassword } = parsed.data
  if (newPassword !== confirmPassword) {
    return { fieldErrors: { confirmPassword: ['Mật khẩu xác nhận không khớp'] } }
  }

  const user = await db.user.findFirst({
    where: { resetTokenHash: hashToken(token), resetTokenExpiresAt: { gt: new Date() } },
    select: { id: true, email: true },
  })
  if (!user) {
    return { error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.' }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({
    where: { id: user.id },
    data: { password: hashed, mustChangePassword: false, failedLoginCount: 0, resetTokenHash: null, resetTokenExpiresAt: null },
  })
  await logAction({ userId: user.id, action: 'RESET_PASSWORD', module: 'admin', detail: `Đặt lại mật khẩu thành công: ${user.email}` })
  return { success: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' }
}

async function findUserByEmail(emailInput: string) {
  // KHÔNG phân biệt chữ hoa/thường: CSDL lưu email chữ thường, chuẩn hoá đầu vào trước khi tìm
  const email = emailInput.trim().toLowerCase()
  const include = {
    role: { include: { permissions: { include: { permission: true } } } },
    toChuc: { select: { ma: true } },
  }
  // Tìm chính xác trước (so khớp không phân biệt hoa/thường để chống dữ liệu cũ lưu chữ hoa)
  const exact = await db.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include,
  })
  if (exact) return exact

  // CCCD nhập có số 0 đứng đầu (VD: 044073000678) → thử bỏ số 0 (DB lưu: 44073000678)
  const stripped = email.replace(/^0+/, '')
  if (stripped !== email) {
    return db.user.findUnique({ where: { email: stripped }, include })
  }

  // Hoặc ngược lại: nhập không có 0 đầu → thử thêm 0
  return db.user.findUnique({ where: { email: '0' + email }, include })
}
