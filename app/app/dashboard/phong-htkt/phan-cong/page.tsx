import Link from 'next/link'
import { ChevronRight, Users, MapPin, Crown, UserCog, User, BarChart3 } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, isLeadership } from '@/lib/auth'
import { PHAN_CONG } from '@/lib/htkt/phan-cong'
import { PhanCongEditor, SinhViecForm, type PhanCongRow } from '@/components/phong-htkt/phan-cong-editor'

export const dynamic = 'force-dynamic'

const HTKT_TOCHUC_ID = 'cmpz3u7uf000bf0umpijd8stn'

function iconChucVu(chucVu: string) {
  if (chucVu.includes('Trưởng phòng') && !chucVu.includes('Phó')) return Crown
  if (chucVu.includes('Phó')) return UserCog
  return User
}

export default async function PhanCongPage() {
  const user = await getCurrentUser()
  const canManage = !!user && (isLeadership(user) || (user.isDepartmentLeader && user.toChucId === HTKT_TOCHUC_ID))

  const [rowsDb, usersDb] = await Promise.all([
    db.phanCongLinhVuc.findMany({ where: { toChucId: HTKT_TOCHUC_ID }, orderBy: { thuTu: 'asc' } }),
    db.user.findMany({ where: { toChucId: HTKT_TOCHUC_ID }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])
  const rows: PhanCongRow[] = rowsDb.map((r) => ({
    id: r.id, linhVucTen: r.linhVucTen, nguoiPhuTrachId: r.nguoiPhuTrachId,
    nguoiPhoiHopIds: r.nguoiPhoiHopIds, ghiChu: r.ghiChu,
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Phân công nhiệm vụ</span>
      </nav>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Phân công nhiệm vụ cán bộ, công chức</h1>
            <p className="text-sm text-slate-500">
              Phân công động theo lĩnh vực · TB 01/TB-HTKT ngày 10/10/2025
            </p>
          </div>
        </div>
        <Link href="/dashboard/phong-htkt/bao-cao" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-2 rounded-lg shrink-0">
          <BarChart3 className="w-4 h-4" /> Báo cáo định kỳ
        </Link>
      </div>

      {/* Phân công lĩnh vực (động, sửa được) */}
      <p className="text-sm font-semibold text-slate-700 mb-2">Phân công lĩnh vực &amp; người phụ trách</p>
      <PhanCongEditor rows={rows} users={usersDb} canManage={canManage} />
      {!canManage && (
        <p className="text-xs text-slate-400 mt-2">Chỉ Lãnh đạo phòng/Sở mới điều chỉnh được phân công &amp; sinh công việc định kỳ.</p>
      )}

      {/* Tự sinh công việc định kỳ */}
      {canManage && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">Sinh công việc định kỳ (báo cáo tháng/quý/năm)</p>
          <SinhViecForm toChucId={HTKT_TOCHUC_ID} />
        </div>
      )}

      {/* Trích yếu nhiệm vụ theo TB 01 (tham chiếu) */}
      <p className="text-sm font-semibold text-slate-700 mt-8 mb-3">Trích yếu nhiệm vụ từng cán bộ (TB 01/TB-HTKT)</p>
      {PHAN_CONG.map((cb) => {
        const Icon = iconChucVu(cb.chucVu)
        return (
          <div key={cb.hoTen} className="rounded-xl border bg-white p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{cb.hoTen}</p>
                <p className="text-xs text-slate-500">{cb.chucVu}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {cb.nhiemVu.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />{n}
                </li>
              ))}
            </ul>
            {cb.diaBan && cb.diaBan.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span><span className="font-medium text-slate-700">Địa bàn phụ trách: </span>{cb.diaBan.join(', ')}</span>
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-slate-400 mt-2">
        Trong quá trình thực hiện nếu có nhiệm vụ phát sinh, có sự thay đổi về nhân sự sẽ được xem xét, điều chỉnh.
      </p>
    </div>
  )
}
