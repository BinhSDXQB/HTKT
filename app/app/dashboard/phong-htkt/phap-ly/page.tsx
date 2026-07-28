import Link from 'next/link'
import { ChevronRight, Scale, Star } from 'lucide-react'
import {
  PHAP_LY_CHUNG, PHAP_LY_LINH_VUC, LINH_VUC_HTKT, LOAI_VANBAN_MAU, type VanBan,
} from '@/lib/htkt/phap-ly'

export const dynamic = 'force-dynamic'

function VanBanItem({ vb }: { vb: VanBan }) {
  return (
    <li className="flex items-start gap-2.5 py-2 border-b last:border-0">
      <span className={`shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded ${LOAI_VANBAN_MAU[vb.loai]}`}>
        {vb.loai}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">
          {vb.trongTam && <Star className="inline w-3.5 h-3.5 text-amber-500 mr-1 -mt-0.5" />}
          <span className="font-semibold">{vb.soHieu}</span> — {vb.ten}
        </p>
        {vb.hieuLuc && <p className="text-xs text-emerald-700 mt-0.5">{vb.hieuLuc}</p>}
        {vb.ghiChu && <p className="text-xs text-slate-500 mt-0.5">{vb.ghiChu}</p>}
      </div>
    </li>
  )
}

export default function PhapLyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Cơ sở pháp lý</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cơ sở pháp lý chuyên ngành HTKT</h1>
          <p className="text-sm text-slate-500">Danh mục Luật, Nghị định, Thông tư, QCVN cập nhật (mốc 6/2026)</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 mb-5">
        <p className="text-sm font-semibold text-slate-800 mb-1">Văn bản chung — xây dựng, thẩm định, chất lượng, thể thức</p>
        <p className="text-xs text-slate-500 mb-2"><Star className="inline w-3.5 h-3.5 text-amber-500 mr-1 -mt-0.5" />= văn bản cốt lõi đang áp dụng</p>
        <ul>{PHAP_LY_CHUNG.map((vb) => <VanBanItem key={vb.soHieu} vb={vb} />)}</ul>
      </div>

      {LINH_VUC_HTKT.map((lv) => {
        const ds = PHAP_LY_LINH_VUC[lv.key]
        if (!ds?.length) return null
        return (
          <div key={lv.key} className="rounded-xl border bg-white p-5 mb-4">
            <p className="text-sm font-semibold text-cyan-800 mb-1">{lv.ten}</p>
            <ul>{ds.map((vb) => <VanBanItem key={vb.soHieu + vb.ten} vb={vb} />)}</ul>
          </div>
        )
      })}

      <p className="text-xs text-slate-400 mt-6">
        Lưu ý: danh mục mang tính tổng hợp tham khảo, cần đối chiếu hiệu lực thực tế trên cơ sở dữ liệu pháp luật
        trước khi viện dẫn. Luật Cấp, thoát nước đang dự thảo (lùi 2026–2027). Nghị định mới chi tiết Luật Xây dựng
        2025 về quản lý hoạt động xây dựng đang được soạn thảo.
      </p>
    </div>
  )
}
