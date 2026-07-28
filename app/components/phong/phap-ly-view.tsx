import Link from 'next/link'
import { ChevronRight, Scale, Star } from 'lucide-react'
import { LOAI_VANBAN_MAU, type VanBan } from '@/lib/htkt/phap-ly'
import { getPhapLyPhong } from '@/lib/phong/phap-ly-phong'

// Khung hiển thị "Cơ sở pháp lý chuyên ngành" dùng chung cho các phòng.
// Truyền `phongKey` (vd "phong-clct") để lấy dữ liệu trong registry phap-ly-phong.

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

const MAU_TIEU_DE: Record<string, string> = {
  indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', cyan: 'bg-cyan-600',
}
const MAU_LINK: Record<string, string> = {
  indigo: 'hover:text-indigo-700', emerald: 'hover:text-emerald-700', cyan: 'hover:text-cyan-700',
}
const MAU_LINHVUC: Record<string, string> = {
  indigo: 'text-indigo-800', emerald: 'text-emerald-800', cyan: 'text-cyan-800',
}

export function PhapLyView({ phongKey }: { phongKey: string }) {
  const phong = getPhapLyPhong(phongKey)
  if (!phong) {
    return <div className="p-6 text-sm text-slate-500">Chưa có danh mục pháp lý cho phòng này.</div>
  }
  const c = phong.color

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href={phong.baseHref} className={MAU_LINK[c]}>{phong.ten}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Cơ sở pháp lý</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${MAU_TIEU_DE[c]} text-white flex items-center justify-center shrink-0`}>
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cơ sở pháp lý — {phong.ten}</h1>
          <p className="text-sm text-slate-500">Danh mục Luật, Nghị định, Thông tư, QCVN mới nhất (mốc 6/2026, theo QĐ 331/QĐ-SXD)</p>
        </div>
      </div>

      {phong.chung.length > 0 && (
        <div className="rounded-xl border bg-white p-5 mb-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Văn bản nền tảng của phòng</p>
          <p className="text-xs text-slate-500 mb-2"><Star className="inline w-3.5 h-3.5 text-amber-500 mr-1 -mt-0.5" />= văn bản cốt lõi đang áp dụng</p>
          <ul>{phong.chung.map((vb) => <VanBanItem key={vb.soHieu + vb.ten} vb={vb} />)}</ul>
        </div>
      )}

      {phong.linhVuc.map((lv) => (
        <div key={lv.key} className="rounded-xl border bg-white p-5 mb-4">
          <p className={`text-sm font-semibold mb-1 ${MAU_LINHVUC[c]}`}>{lv.ten}</p>
          <ul>{lv.vanBan.map((vb) => <VanBanItem key={vb.soHieu + vb.ten} vb={vb} />)}</ul>
        </div>
      ))}

      <p className="text-xs text-slate-400 mt-6">
        Lưu ý: danh mục tổng hợp tham khảo, cần đối chiếu hiệu lực thực tế trên cơ sở dữ liệu pháp luật trước khi viện dẫn.
        Một số công tác thẩm định, cấp phép có tích hợp yêu cầu về phòng cháy, chữa cháy (Luật 55/2024/QH15, NĐ 105/2025/NĐ-CP,
        QCVN 06) — phải trích dẫn đúng điều/khoản và quy chuẩn còn hiệu lực.
      </p>
    </div>
  )
}
