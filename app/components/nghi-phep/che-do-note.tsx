import { Info } from 'lucide-react'
import { CHE_DO_NGHI_PHEP } from '@/lib/leave-reasons'

/** Hộp gập/mở tóm tắt chế độ nghỉ theo luật — hiển thị dưới ô Lý do. */
export function CheDoNghiNote() {
  return (
    <details className="rounded-lg border border-sky-200 bg-sky-50 text-xs">
      <summary className="flex items-center gap-1.5 cursor-pointer select-none px-3 py-2 font-medium text-sky-800">
        <Info className="w-3.5 h-3.5" /> Xem chế độ nghỉ theo luật (cưới, tang, vợ sinh con, chăm con ốm…)
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-2 text-slate-700">
        {CHE_DO_NGHI_PHEP.map((c) => (
          <div key={c.ten} className="border-t border-sky-100 pt-1.5 first:border-0 first:pt-0">
            <p className="font-medium text-slate-800">{c.ten}</p>
            <p>• Thời gian: {c.soNgay}</p>
            <p className="text-slate-500">{c.huongLuong} · {c.canCu}</p>
          </div>
        ))}
        <p className="text-[11px] text-slate-400 pt-1">
          Số ngày theo luật là mức tối thiểu được hưởng; ghi đúng lý do để cấp duyệt áp đúng chế độ.
        </p>
      </div>
    </details>
  )
}
