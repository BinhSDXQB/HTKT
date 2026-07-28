import { ShieldCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Cấp phép xây dựng"
      icon={ShieldCheck}
      color="indigo"
      baseHref="/dashboard/phong-qlhd-xd"
      baseLabel="Phòng Quản lý hoạt động xây dựng"
      moTa="Cấp, điều chỉnh, gia hạn, cấp lại, thu hồi giấy phép xây dựng"
      nhiemVu={[
        'Cấp, điều chỉnh, gia hạn, cấp lại, thu hồi giấy phép xây dựng theo thẩm quyền.',
        'Hướng dẫn, kiểm tra việc cấp phép xây dựng của cấp huyện.',
        'Tổng hợp tình hình cấp phép xây dựng trên địa bàn.',
      ]}
    />
  )
}
