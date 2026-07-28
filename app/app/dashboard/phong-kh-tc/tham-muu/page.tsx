import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-kh-tc"
      tenPhong="Phòng Kế hoạch - Tài chính"
      baseHref="/dashboard/phong-kh-tc"
      color="emerald"
    />
  )
}
