import Link from 'next/link'
import { Award, FileStack, ChevronRight } from 'lucide-react'
import { DeptSection } from '@/components/phong/dept-section'

export default function Page() {
  return (
    <DeptSection
      title="Chứng chỉ & nhà thầu nước ngoài"
      icon={Award}
      color="indigo"
      baseHref="/dashboard/phong-qlhd-xd"
      baseLabel="Phòng Quản lý hoạt động xây dựng"
      moTa="Chứng chỉ hành nghề, năng lực hoạt động XD; quản lý nhà thầu nước ngoài"
      nhiemVu={[
        'Cấp chứng chỉ hành nghề cá nhân, giấy phép nhà thầu nước ngoài theo thẩm quyền (NĐ 212/2026); tổ chức chỉ công khai năng lực trên CSDL quốc gia.',
        'Quản lý hoạt động của nhà thầu nước ngoài trên địa bàn.',
        'Theo dõi, công khai thông tin năng lực hoạt động xây dựng.',
      ]}
    >
      <Link href="/dashboard/phong-qlhd-xd/chung-chi-nha-thau/ho-so"
        className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 mb-6 flex items-center gap-3 hover:border-indigo-400 hover:shadow-sm transition">
        <FileStack className="w-6 h-6 text-indigo-600 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Hồ sơ đề nghị cấp chứng chỉ hành nghề</p>
          <p className="text-sm text-slate-600">Nhập hồ sơ, kê khai kinh nghiệm, đánh giá sơ bộ điều kiện và theo dõi thời hạn (NĐ 212/2026).</p>
        </div>
        <ChevronRight className="w-5 h-5 text-indigo-500" />
      </Link>
    </DeptSection>
  )
}
