import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Settings, Building2 } from 'lucide-react'
import { FacilityConfigForm } from '@/components/cai-dat/facility-config-form'

export default async function CoQuanPage() {
  await requireAuth()
  const config = await db.facilityConfig.findFirst()

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cai-dat" className="hover:text-blue-700 flex items-center gap-1"><Settings className="w-3.5 h-3.5" />Quản trị</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Thông tin cơ quan</span>
      </nav>
      <div><h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-green-700" />Thông tin cơ quan</h1></div>
      <FacilityConfigForm config={config} />
    </div>
  )
}
