import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Truck, GitMerge, Car, BookMarked, ChevronRight } from 'lucide-react'

export default async function CapPhepHubPage() {
  await requireAuth()

  const [oversizedTotal, oversizedActive, connTotal, connActive, vehicles] = await Promise.all([
    db.oversizedVehiclePermit.count(),
    db.oversizedVehiclePermit.count({ where: { status: { notIn: ['HOAN_THANH', 'TU_CHOI', 'THU_HOI', 'HET_HAN'] } } }),
    db.roadConnectionApplication.count(),
    db.roadConnectionApplication.count({ where: { status: { notIn: ['HOAN_THANH', 'TU_CHOI', 'THU_HOI', 'HET_HAN'] } } }),
    db.permitVehicle.count(),
  ])

  const cards = [
    { href: '/dashboard/cap-phep/xe-qua-kho', icon: Truck, title: 'Xe quá khổ, quá tải', desc: 'Cấp giấy phép lưu hành xe quá khổ giới hạn, quá tải trọng, bánh xích, hàng siêu trường siêu trọng', total: oversizedTotal, active: oversizedActive, color: 'text-teal-600 bg-teal-50' },
    { href: '/dashboard/cap-phep/dau-noi', icon: GitMerge, title: 'Đấu nối, nút giao, thi công', desc: 'Chấp thuận vị trí, thiết kế nút giao và cấp phép thi công trong phạm vi bảo vệ kết cấu hạ tầng đường bộ', total: connTotal, active: connActive, color: 'text-blue-600 bg-blue-50' },
    { href: '/dashboard/cap-phep/phuong-tien', icon: Car, title: 'Quản lý phương tiện', desc: 'Hồ sơ phương tiện: biển số, thông số kỹ thuật, tải trọng, lịch sử cấp phép', total: vehicles, active: null, color: 'text-indigo-600 bg-indigo-50' },
    { href: '/dashboard/cap-phep/can-cu', icon: BookMarked, title: 'Căn cứ pháp lý', desc: 'Danh mục văn bản pháp lý áp dụng cho cấp phép đường bộ và kiểm tra hiệu lực', total: null, active: null, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cấp phép đường bộ</h1>
        <p className="text-sm text-slate-500 mt-0.5">Quản lý cấp phép, chấp thuận liên quan đến kết cấu hạ tầng đường bộ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.href} href={c.href} className="group bg-white rounded-xl border p-5 hover:border-teal-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 group-hover:text-teal-700">{c.title}</h3>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                  {c.total !== null && (
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs text-slate-600"><b className="text-slate-800">{c.total}</b> hồ sơ</span>
                      {c.active !== null && <span className="text-xs text-teal-600"><b>{c.active}</b> đang xử lý</span>}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
