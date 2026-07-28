import { BarChart3 } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Định mức, đơn giá, chỉ số giá xây dựng"
      icon={BarChart3}
      color="emerald"
      baseHref="/dashboard/phong-kt-vl"
      baseLabel="Phòng Kinh tế và Vật liệu xây dựng"
      moTa="Quản lý định mức, đơn giá và chỉ số giá xây dựng trên địa bàn tỉnh"
      nhiemVu={[
        'Tổ chức xây dựng, rà soát, công bố định mức và đơn giá xây dựng đặc thù của địa phương; hướng dẫn áp dụng theo quy định.',
        'Xác định, công bố chỉ số giá xây dựng theo định kỳ phục vụ lập và quản lý chi phí đầu tư xây dựng.',
        'Hướng dẫn, kiểm tra việc áp dụng hệ thống định mức, đơn giá, chỉ số giá trong hoạt động đầu tư xây dựng.',
      ]}
    />
  )
}
