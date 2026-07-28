'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { autoFillWeekendsAction, syncMembersFromFirstMonthAction } from '@/app/actions/overtime'

export function AutoFillButton({ toChucId, nam, tenPhong }: { toChucId: string; nam: number; tenPhong: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function sync() {
    if (!confirm(
      `Đồng bộ danh sách người cho ${tenPhong} năm ${nam}?\n\n` +
      `• Lấy danh sách của THÁNG ĐẦU TIÊN đã có làm mẫu.\n` +
      `• Áp danh sách đó sang TẤT CẢ các tháng còn lại.\n` +
      `• Giữ nguyên giờ đã chấm của người trùng; người bị bỏ sẽ mất giờ.`
    )) return
    start(async () => {
      const res = await syncMembersFromFirstMonthAction(toChucId, nam)
      if (res?.ok) { toast.success(res.summary ?? 'Đã đồng bộ danh sách'); router.refresh() }
      else toast.error(res?.error ?? 'Không thực hiện được')
    })
  }

  function run() {
    if (!confirm(
      `Tự động chấm CẢ NĂM ${nam} cho ${tenPhong}?\n\n` +
      `• Chỉ điền vào Thứ Bảy & Chủ nhật, mỗi ngày 4 giờ.\n` +
      `• Điền từ đầu năm đến khi mỗi người đủ 200 giờ thì dừng.\n` +
      `• GHI ĐÈ các ô cuối tuần đã có; ngày thường để trống.\n` +
      `• Tự tạo đủ 12 bảng tháng nếu chưa có.`
    )) return
    start(async () => {
      const res = await autoFillWeekendsAction(toChucId, nam)
      if (res?.ok) { toast.success(res.summary ?? 'Đã tự động chấm cả năm'); router.refresh() }
      else toast.error(res?.error ?? 'Không thực hiện được')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={sync} disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 disabled:opacity-60">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
        Đồng bộ danh sách theo tháng đầu
      </button>
      <button onClick={run} disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg px-3 py-1.5 disabled:opacity-60">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        Tự động chấm T7/CN cả năm
      </button>
    </div>
  )
}
