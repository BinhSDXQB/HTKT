import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-qh-kt"
      tenPhong="Phòng Quy hoạch - Kiến trúc"
      baseHref="/dashboard/phong-qh-kt"
      color="indigo"
    />
  )
}
