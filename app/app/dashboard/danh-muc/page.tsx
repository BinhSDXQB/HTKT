import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookOpen, Building2, MapPin, Road, Users } from 'lucide-react'

export default async function DanhMucPage() {
  await requireAuth()

  const [assetTypeCount, wardCount, streetCount, unitCount] = await Promise.all([
    db.assetType.count({ where: { isActive: true } }),
    db.administrativeUnit.count({ where: { isActive: true } }),
    db.street.count({ where: { isActive: true } }),
    db.executingUnit.count({ where: { isActive: true } }),
  ])

  const cards = [
    { title: 'Loại tài sản', desc: 'Phân loại tài sản theo lĩnh vực', count: assetTypeCount, icon: Building2, href: '/dashboard/danh-muc/loai-tai-san', color: 'text-blue-700', bg: 'bg-blue-50' },
    { title: 'Đơn vị hành chính', desc: 'Quận/huyện, phường/xã', count: wardCount, icon: MapPin, href: '/dashboard/danh-muc/don-vi-hanh-chinh', color: 'text-green-700', bg: 'bg-green-50' },
    { title: 'Tuyến đường', desc: 'Danh mục các tuyến đường', count: streetCount, icon: Road, href: '/dashboard/danh-muc/tuyen-duong', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { title: 'Đơn vị thực hiện', desc: 'Nhà thầu, đội sửa chữa', count: unitCount, icon: Users, href: '/dashboard/danh-muc/don-vi-thuc-hien', color: 'text-purple-700', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-6 h-6 text-slate-600" />Danh mục</h1>
        <p className="text-sm text-slate-500 mt-0.5">Quản lý các danh mục dùng chung trong hệ thống</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow hover:border-blue-200 group">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{c.title}</p>
            <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
            <p className={`text-2xl font-bold mt-3 ${c.color}`}>{c.count}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
