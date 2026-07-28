import { redirect } from 'next/navigation'
import { requireAuth, canAccessOffice } from '@/lib/auth'
import { db } from '@/lib/db'
import { TaiLieuManager } from '@/components/tai-lieu/tai-lieu-manager'
import { BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TaiLieuPage() {
  const user = await requireAuth()
  if (!canAccessOffice(user)) redirect('/forbidden')

  const items = await db.taiLieu.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, tieuDe: true, loai: true, nguon: true, moTa: true, phamVi: true,
      soChunk: true, soKyTu: true, trangThai: true, ghiChuLoi: true, createdAt: true,
    },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kho tài liệu tra cứu</h1>
          <p className="text-sm text-slate-500">
            Nạp tài liệu (PDF/Word/dán văn bản) để chatbot tra cứu & trả lời có trích dẫn ·
            dữ liệu lưu trên máy chủ Sở
          </p>
        </div>
      </div>

      <TaiLieuManager
        initialItems={items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
      />
    </div>
  )
}
