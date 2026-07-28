import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-qh-kt"
      tenPhong="Phòng Quy hoạch - Kiến trúc"
      baseHref="/dashboard/phong-qh-kt"
      color="indigo"
    />
  )
}
