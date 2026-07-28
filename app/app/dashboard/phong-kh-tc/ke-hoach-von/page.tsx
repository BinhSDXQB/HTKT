import { Banknote } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Kế hoạch vốn & dự toán"
      icon={Banknote}
      color="emerald"
      baseHref="/dashboard/phong-kh-tc"
      baseLabel="Phòng Kế hoạch - Tài chính"
      moTa="Kế hoạch vốn đầu tư công và dự toán thu - chi hằng năm"
      nhiemVu={[
        'Tham mưu xây dựng kế hoạch vốn đầu tư công, dự toán thu - chi hằng năm.',
        'Phân bổ, theo dõi giải ngân kế hoạch vốn của các dự án.',
        'Tổng hợp, báo cáo tình hình thực hiện kế hoạch vốn.',
      ]}
    />
  )
}
