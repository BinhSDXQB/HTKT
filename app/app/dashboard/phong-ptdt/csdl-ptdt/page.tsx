import { Boxes } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Cơ sở dữ liệu phát triển đô thị"
      icon={Boxes}
      color="indigo"
      baseHref="/dashboard/phong-ptdt"
      baseLabel="Phòng Phát triển đô thị"
      moTa="Xây dựng, quản lý cơ sở dữ liệu phát triển đô thị toàn tỉnh"
      nhiemVu={[
        'Xây dựng, cập nhật và quản lý cơ sở dữ liệu về phát triển đô thị trên địa bàn tỉnh.',
        'Tổng hợp số liệu, lập báo cáo định kỳ và đột xuất về tình hình phát triển đô thị.',
        'Cung cấp, chia sẻ dữ liệu phục vụ quản lý nhà nước và kết nối hệ thống thông tin chung.',
      ]}
    />
  )
}
