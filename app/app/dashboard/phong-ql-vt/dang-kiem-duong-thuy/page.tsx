import { Ship } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Đăng ký, đăng kiểm đường thủy"
      icon={Ship}
      color="emerald"
      baseHref="/dashboard/phong-ql-vt"
      baseLabel="Phòng Quản lý vận tải"
      moTa="Đăng ký, đăng kiểm phương tiện thủy nội địa"
      nhiemVu={[
        'Tổ chức đăng ký, đăng kiểm phương tiện thủy nội địa theo phân cấp.',
        'Quản lý hồ sơ, dữ liệu phương tiện thủy nội địa.',
        'Kiểm tra điều kiện an toàn kỹ thuật phương tiện.',
      ]}
    />
  )
}
