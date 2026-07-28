import { ShieldCheck } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Cấp phép thi công đường bộ"
      icon={ShieldCheck}
      color="emerald"
      baseHref="/dashboard/phong-qlkcht"
      baseLabel="Phòng Quản lý kết cấu hạ tầng giao thông"
      moTa="Cấp phép thi công, đấu nối trên đường bộ thuộc phạm vi quản lý"
      nhiemVu={[
        'Cấp phép thi công, đấu nối trên đường bộ thuộc phạm vi quản lý.',
        'Quản lý việc sử dụng, khai thác phạm vi bảo vệ kết cấu hạ tầng giao thông đường bộ.',
        'Kiểm tra việc thực hiện giấy phép thi công đã cấp.',
      ]}
    />
  )
}
