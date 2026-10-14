import { CchnForm } from '@/components/cchn/cchn-form'
import { hoSoTrong } from '@/lib/cchn/mac-dinh'

// Nhập hồ sơ đề nghị cấp chứng chỉ hành nghề mới (layout phòng đã chặn quyền; action kiểm tra lại).
export default function NhapHoSoCchnPage() {
  return <CchnForm initial={hoSoTrong()} />
}
