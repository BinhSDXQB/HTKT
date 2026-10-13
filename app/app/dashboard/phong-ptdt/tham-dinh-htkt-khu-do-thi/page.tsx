import { Network } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Góp ý dự án khu đô thị"
      icon={Network}
      color="indigo"
      baseHref="/dashboard/phong-ptdt"
      baseLabel="Phòng Phát triển đô thị"
      moTa="Ý kiến thẩm định của Sở khi chấp thuận chủ trương đầu tư dự án khu đô thị (Đ29 NĐ 11/2013); theo dõi đầu tư đồng bộ hạ tầng"
      nhiemVu={[
        'Có ý kiến thẩm định khi cơ quan đăng ký đầu tư lấy ý kiến chấp thuận chủ trương đầu tư dự án khu đô thị (Đ29 NĐ 11/2013, VBHN 04/VBHN-BXD 2026).',
        'Kiểm tra việc đầu tư đồng bộ hạ tầng kỹ thuật trong khu đô thị theo quy hoạch, chương trình phát triển đô thị.',
        'Tham mưu tiếp nhận, bàn giao công trình hạ tầng kỹ thuật khu đô thị.',
      ]}
    />
  )
}
