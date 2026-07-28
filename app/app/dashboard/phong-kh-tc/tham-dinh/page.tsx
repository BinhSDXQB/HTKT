import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-kh-tc"
      tenPhong="Phòng Kế hoạch - Tài chính"
      baseHref="/dashboard/phong-kh-tc"
      color="emerald"
    />
  )
}
