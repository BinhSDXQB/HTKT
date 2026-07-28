import { GraduationCap } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Đào tạo, sát hạch GPLX"
      icon={GraduationCap}
      color="emerald"
      baseHref="/dashboard/phong-ql-vt"
      baseLabel="Phòng Quản lý vận tải"
      moTa="Quản lý đào tạo, sát hạch, cấp giấy phép lái xe, chứng chỉ"
      nhiemVu={[
        'Quản lý đào tạo, sát hạch, cấp giấy phép lái xe, chứng chỉ chuyên môn.',
        'Kiểm tra điều kiện cơ sở đào tạo, trung tâm sát hạch.',
        'Quản lý dữ liệu GPLX, chứng chỉ đã cấp.',
      ]}
    />
  )
}
