import { FileSpreadsheet } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Công bố giá vật liệu xây dựng"
      icon={FileSpreadsheet}
      color="emerald"
      baseHref="/dashboard/phong-kt-vl"
      baseLabel="Phòng Kinh tế và Vật liệu xây dựng"
      moTa="Theo dõi, công bố giá vật liệu xây dựng trên địa bàn tỉnh"
      nhiemVu={[
        'Tổ chức khảo sát, tổng hợp và công bố giá vật liệu xây dựng định kỳ trên địa bàn tỉnh.',
        'Hướng dẫn việc áp dụng giá VLXD công bố trong lập, thẩm định và quản lý chi phí đầu tư xây dựng.',
        'Xây dựng cơ sở dữ liệu giá VLXD phục vụ quản lý nhà nước và tra cứu.',
      ]}
    />
  )
}
