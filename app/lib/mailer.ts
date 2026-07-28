import 'server-only'
import nodemailer from 'nodemailer'

// Gửi email qua SMTP. Cấu hình bằng biến môi trường (.env):
//   SMTP_HOST   — máy chủ SMTP (vd smtp.gmail.com)
//   SMTP_PORT   — cổng (465 cho SSL, 587 cho STARTTLS)
//   SMTP_SECURE — "true" nếu dùng SSL (cổng 465), ngược lại "false"
//   SMTP_USER   — tài khoản đăng nhập SMTP (vd sgtbinh@gmail.com)
//   SMTP_PASS   — mật khẩu ứng dụng (Gmail: App Password 16 ký tự, KHÔNG dùng mật khẩu thường)
//   SMTP_FROM   — địa chỉ người gửi hiển thị (mặc định = SMTP_USER)
//   APP_URL     — URL gốc hệ thống để dựng link (mặc định https://qlhtkt.htkt.com.vn)

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function getAppUrl(): string {
  return (process.env.APP_URL || 'https://qlhtkt.htkt.com.vn').replace(/\/+$/, '')
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }): Promise<void> {
  if (!isMailConfigured()) throw new Error('SMTP chưa được cấu hình')
  const transporter = createTransport()
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
}
