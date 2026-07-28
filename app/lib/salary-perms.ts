// Quyền import file "Theo dõi lên lương" vào bảng CanBo.
// Cho phép: admin (admin@htkt.com.vn) + các tài khoản được chỉ định theo email đăng nhập (CCCD).
export const SALARY_IMPORT_EMAILS = new Set<string>([
  '044076001638', // Hoàng Đăng Cương
  '044080000694', // Trần Nguyễn
  '045083007427', // Nguyễn Thành Lai
])

export function canImportSalary(user: { email: string; role: { name: string } }): boolean {
  return user.role.name === 'admin' || SALARY_IMPORT_EMAILS.has(user.email)
}
