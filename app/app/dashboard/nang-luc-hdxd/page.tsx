import { requireAuth, isLeadership } from '@/lib/auth'
import { listNangLucCaNhan } from '@/app/actions/nang-luc-hdxd'
import { NangLucList } from '@/components/xd-lien-thong/nang-luc-list'
import { BadgeCheck } from 'lucide-react'

export default async function NangLucHdxdPage() {
  const user = await requireAuth()
  const canManage = user.role.name === 'admin' || isLeadership(user) || user.toChucId != null
  const rows = await listNangLucCaNhan()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Năng lực hoạt động xây dựng — cá nhân</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Chứng chỉ hành nghề (NĐ 212/2026, TT 39/2026). Mỗi cá nhân gắn <b>một mã định danh</b> (công dân VN: số định danh cá nhân/CCCD;
            khác: hộ chiếu) để <b>liên thông</b> CSDL quốc gia về hoạt động xây dựng.
          </p>
        </div>
      </div>
      <NangLucList initial={rows} canManage={canManage} />
    </div>
  )
}
