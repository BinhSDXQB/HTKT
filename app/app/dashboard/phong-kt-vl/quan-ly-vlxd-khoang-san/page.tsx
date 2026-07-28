import { Factory } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Quản lý vật liệu xây dựng & khoáng sản"
      icon={Factory}
      color="emerald"
      baseHref="/dashboard/phong-kt-vl"
      baseLabel="Phòng Kinh tế và Vật liệu xây dựng"
      moTa="Quản lý nhà nước về VLXD và khoáng sản làm VLXD (nhóm II)"
      nhiemVu={[
        'Tham mưu quản lý nhà nước về vật liệu xây dựng và khoáng sản làm vật liệu xây dựng thông thường (nhóm II).',
        'Xây dựng, theo dõi quy hoạch, kế hoạch phát triển VLXD; hướng dẫn, kiểm tra hoạt động sản xuất, kinh doanh VLXD.',
        'Quản lý chất lượng sản phẩm, hàng hóa VLXD theo quy định pháp luật.',
      ]}
    />
  )
}
