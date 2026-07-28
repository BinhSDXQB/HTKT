import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, FolderKanban } from 'lucide-react'
import { NewProjectForm } from '@/components/du-an/new-project-form'

export default async function DuAnMoiPage() {
  await requireAuth()
  const [wards, executingUnits] = await Promise.all([
    db.administrativeUnit.findMany({ where: { type: 'PHUONG_XA', isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    db.executingUnit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])
  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/du-an" className="hover:text-purple-600 flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" />Dự án</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Thêm mới</span>
      </nav>
      <div><h1 className="text-xl font-bold text-slate-800">Thêm dự án công trình</h1></div>
      <NewProjectForm wards={wards} executingUnits={executingUnits} />
    </div>
  )
}
