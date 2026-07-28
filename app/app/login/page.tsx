import { db } from '@/lib/db'
import { LoginForm, type AdminContact } from '@/components/auth/login-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const dynamic = 'force-dynamic'

// Kênh liên hệ Quản trị lấy từ Cấu hình cơ quan (admin chỉnh trong Quản trị → Cấu hình);
// có giá trị mặc định an toàn nếu chưa cấu hình.
async function getAdminContact(): Promise<AdminContact> {
  const cfg = await db.facilityConfig.findFirst().catch(() => null)
  return {
    email: cfg?.email?.trim() || 'admin@htkt.com.vn',
    phone: cfg?.dienThoai?.trim() || '',
    tenCoQuan: cfg?.tenCoQuan?.trim() || 'Sở Xây dựng Quảng Trị',
  }
}

export default async function LoginPage() {
  const contact = await getAdminContact()

  return (
    <AuthShell heading="Đăng nhập hệ thống" sub="Vui lòng đăng nhập để tiếp tục">
      <LoginForm contact={contact} />
    </AuthShell>
  )
}
