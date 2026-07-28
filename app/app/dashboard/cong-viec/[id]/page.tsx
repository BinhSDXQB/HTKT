import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight, CalendarClock, User2, Building2, Flag } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAuth, canViewAllCongViec } from '@/lib/auth'
import { StatusForm } from '@/components/cong-viec/status-form'
import { CommentForm } from '@/components/cong-viec/comment-form'
import { TaskActions } from '@/components/cong-viec/task-actions'
import { MembersPanel } from '@/components/cong-viec/members-panel'
import { ChecklistPanel } from '@/components/cong-viec/checklist-panel'
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN, VAI_TRO_LABEL, NHAT_KY_LABEL } from '@/lib/cong-viec-labels'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—' }
function fmtDateTime(d: Date) { return new Date(d).toLocaleString('vi-VN') }
/** yyyy-mm-dd cho input[type=date]; cột @db.Date nên dùng UTC để khỏi lệch ngày. */
function toDateInput(d: Date | null) { return d ? new Date(d).toISOString().slice(0, 10) : null }

export default async function CongViecDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth()

  const task = await db.congViec.findFirst({
    where: { id, deletedAt: null },
    include: {
      toChuc: { select: { ten: true, tenVietTat: true } },
      loai: { select: { ten: true } },
      nguoiGiao: { select: { name: true } },
      nguoiPhuTrach: { select: { name: true } },
      createdBy: { select: { name: true } },
      thanhViens: { include: { user: { select: { name: true } } } },
      checkLists: { orderBy: { thuTu: 'asc' } },
      nhatKys: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 50 },
    },
  })
  if (!task) notFound()

  const isMember = task.thanhViens.some((t) => t.userId === user.id)
  const canView = canViewAllCongViec(user) || task.toChucId === user.toChucId || task.createdById === user.id || task.nguoiPhuTrachId === user.id || isMember
  if (!canView) redirect('/forbidden')
  const canUpdate = canViewAllCongViec(user) || (user.isDepartmentLeader && user.toChucId === task.toChucId) || task.createdById === user.id || task.nguoiPhuTrachId === user.id || isMember
  // Quyền QUẢN LÝ (sửa/xoá) — khắt khe hơn canUpdate: không gồm thành viên phối hợp.
  const canManage = canViewAllCongViec(user) || (user.isDepartmentLeader && user.toChucId === task.toChucId) || task.createdById === user.id || task.nguoiPhuTrachId === user.id

  // Danh sách loại việc + thành viên phòng sở hữu việc — chỉ nạp khi được sửa.
  const [loais, members] = canManage
    ? await Promise.all([
        db.congViecLoai.findMany({
          where: { isActive: true, OR: [{ toChucId: null }, { toChucId: task.toChucId }] },
          select: { id: true, ten: true }, orderBy: { thuTu: 'asc' },
        }),
        db.user.findMany({
          where: { toChucId: task.toChucId, isActive: true },
          select: { id: true, name: true }, orderBy: { name: 'asc' },
        }),
      ])
    : [[], []]

  const tThai = CONG_VIEC_TRANG_THAI[task.trangThai] ?? { label: task.trangThai, cls: 'bg-slate-100 text-slate-700' }
  const uu = CONG_VIEC_UU_TIEN[task.uuTien] ?? { label: task.uuTien, cls: 'bg-slate-100 text-slate-600' }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/cong-viec" className="hover:text-blue-700">Quản lý công việc</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{task.maCongViec}</span>
      </nav>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{task.tieuDe}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tThai.cls}`}>{tThai.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${uu.cls}`}>Ưu tiên: {uu.label}</span>
            <span className="text-xs text-slate-400">{task.maCongViec}</span>
          </div>
        </div>
        {canManage && (
          <TaskActions
            task={{
              id: task.id, tieuDe: task.tieuDe, moTa: task.moTa, loaiId: task.loaiId,
              uuTien: task.uuTien, nguoiPhuTrachId: task.nguoiPhuTrachId,
              ngayBatDau: toDateInput(task.ngayBatDau), ngayHetHan: toDateInput(task.ngayHetHan),
              ghiChu: task.ghiChu,
            }}
            loais={loais}
            members={members}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột trái: thông tin + nhật ký */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-white p-5">
            {task.moTa && <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4">{task.moTa}</p>}
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Building2 className="w-4 h-4 text-slate-400" /> Phòng: <span className="text-slate-900 font-medium">{task.toChuc?.tenVietTat || task.toChuc?.ten || '—'}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><Flag className="w-4 h-4 text-slate-400" /> Loại: <span className="text-slate-900">{task.loai?.ten || '—'}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><User2 className="w-4 h-4 text-slate-400" /> Phụ trách: <span className="text-slate-900">{task.nguoiPhuTrach?.name || '—'}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><User2 className="w-4 h-4 text-slate-400" /> Người giao: <span className="text-slate-900">{task.nguoiGiao?.name || '—'}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><CalendarClock className="w-4 h-4 text-slate-400" /> Bắt đầu: <span className="text-slate-900">{fmtDate(task.ngayBatDau)}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><CalendarClock className="w-4 h-4 text-slate-400" /> Hạn: <span className="text-slate-900">{fmtDate(task.ngayHetHan)}</span></div>
            </div>
            {/* Thanh tiến độ */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Tiến độ</span><span>{task.tienDo}%</span></div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${task.tienDo}%` }} />
              </div>
            </div>
            {!canManage && task.thanhViens.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {task.thanhViens.map((tv) => (
                  <span key={tv.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{tv.user.name} · {VAI_TRO_LABEL[tv.vaiTro] || tv.vaiTro}</span>
                ))}
              </div>
            )}
          </div>

          <ChecklistPanel
            id={task.id}
            items={task.checkLists.map((c) => ({ id: c.id, noiDung: c.noiDung, hoanThanh: c.hoanThanh }))}
            canEdit={canUpdate}
            canManage={canManage}
          />

          {/* Nhật ký */}
          <div className="rounded-xl border bg-white p-5">
            <p className="font-semibold text-slate-800 text-sm mb-3">Nhật ký công việc</p>
            {canUpdate && <div className="mb-4"><CommentForm id={task.id} /></div>}
            <ol className="space-y-3">
              {task.nhatKys.map((nk) => (
                <li key={nk.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{nk.user?.name || 'Hệ thống'}</span>
                      <span className="text-slate-400"> · {NHAT_KY_LABEL[nk.loai] || nk.loai}</span>
                      {nk.giaTriCu && nk.giaTriMoi && <span className="text-slate-500"> : {CONG_VIEC_TRANG_THAI[nk.giaTriCu]?.label || nk.giaTriCu} → {CONG_VIEC_TRANG_THAI[nk.giaTriMoi]?.label || nk.giaTriMoi}</span>}
                    </p>
                    {nk.noiDung && <p className="text-slate-600">{nk.noiDung}</p>}
                    <p className="text-xs text-slate-400">{fmtDateTime(nk.createdAt)}</p>
                  </div>
                </li>
              ))}
              {task.nhatKys.length === 0 && <li className="text-sm text-slate-400">Chưa có hoạt động.</li>}
            </ol>
          </div>
        </div>

        {/* Cột phải: cập nhật trạng thái + thành viên */}
        <div className="space-y-4">
          {canUpdate
            ? <StatusForm id={task.id} trangThai={task.trangThai} tienDo={task.tienDo} />
            : <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">Bạn chỉ có quyền xem công việc này.</div>}
          {canManage && (
            <MembersPanel
              id={task.id}
              thanhViens={task.thanhViens.map((tv) => ({ id: tv.id, userId: tv.userId, vaiTro: tv.vaiTro, user: { name: tv.user.name } }))}
              members={members}
            />
          )}
        </div>
      </div>
    </div>
  )
}
