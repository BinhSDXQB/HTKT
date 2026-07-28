import { ClipboardList } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Kiểm tra công tác nghiệm thu"
      icon={ClipboardList}
      color="indigo"
      baseHref="/dashboard/phong-clct"
      baseLabel="Phòng Quản lý chất lượng công trình giao thông"
      moTa="Kiểm tra công tác nghiệm thu công trình giao thông"
      nhiemVu={[
        'Kiểm tra công tác nghiệm thu trong quá trình thi công và khi hoàn thành công trình giao thông.',
        'Theo dõi việc tuân thủ trình tự, thủ tục nghiệm thu của chủ đầu tư.',
        'Tham mưu xử lý đối với công trình không đảm bảo điều kiện nghiệm thu.',
      ]}
    />
  )
}
