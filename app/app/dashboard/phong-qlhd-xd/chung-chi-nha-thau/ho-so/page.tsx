import Link from 'next/link'
import { ChevronRight, Plus, FileStack } from 'lucide-react'
import { listHoSo } from '@/app/actions/cchn'
import { LINH_VUC, LOAI_THU_TUC, TRANG_THAI } from '@/lib/cchn/danh-muc'

// Danh sách hồ sơ đề nghị cấp chứng chỉ hành nghề — Phòng QLHĐ-XD (layout phòng đã chặn quyền).
const BASE = '/dashboard/phong-qlhd-xd/chung-chi-nha-thau/ho-so'
const fmt = (s: string) => (s ? s.split('-').reverse().join('/') : '')

export default async function DanhSachHoSoCchnPage() {
  const rows = await listHoSo()
  const dem = TRANG_THAI.map((t) => ({ ...t, n: rows.filter((r) => r.trangThai === t.value).length })).filter((t) => t.n > 0)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <nav className="text-xs text-slate-500 mb-3 flex flex-wrap items-center gap-1.5">
        <Link href="/dashboard/phong-qlhd-xd" className="hover:text-indigo-700">Phòng QLHĐ-XD</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/phong-qlhd-xd/chung-chi-nha-thau" className="hover:text-indigo-700">Chứng chỉ & nhà thầu nước ngoài</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Hồ sơ cấp chứng chỉ hành nghề</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0"><FileStack className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hồ sơ đề nghị cấp chứng chỉ hành nghề</h1>
            <p className="text-sm text-slate-500">Nhập hồ sơ, kê khai kinh nghiệm, đánh giá sơ bộ và theo dõi thời hạn theo NĐ 212/2026 (Đ27–40).</p>
          </div>
        </div>
        <Link href={`${BASE}/moi`} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nhập hồ sơ mới
        </Link>
      </div>

      {dem.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {dem.map((t) => <span key={t.value} className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.mau}`}>{t.label}: {t.n}</span>)}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500 text-sm">
          Chưa có hồ sơ nào. Bấm “Nhập hồ sơ mới” để bắt đầu.
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Mã hồ sơ</th>
                <th className="text-left px-3 py-2">Người đề nghị</th>
                <th className="text-left px-3 py-2">Thủ tục</th>
                <th className="text-left px-3 py-2">Lĩnh vực · Hạng</th>
                <th className="text-left px-3 py-2">Ngày nộp</th>
                <th className="text-left px-3 py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tt = TRANG_THAI.find((x) => x.value === r.trangThai)
                return (
                  <tr key={r.id} className="border-t hover:bg-indigo-50/40">
                    <td className="px-3 py-2 font-mono"><Link href={`${BASE}/${r.id}`} className="text-indigo-700 hover:underline">{r.maHoSo}</Link></td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{r.hoTen}</div>
                      {r.maDinhDanhAn && <div className="text-xs text-slate-500">{r.maDinhDanhAn}</div>}
                    </td>
                    <td className="px-3 py-2">{LOAI_THU_TUC.find((x) => x.value === r.loaiThuTuc)?.label}</td>
                    <td className="px-3 py-2">{LINH_VUC.find((x) => x.value === r.linhVuc)?.label ?? '—'}{r.hangDeNghi ? ` · Hạng ${r.hangDeNghi}` : ''}</td>
                    <td className="px-3 py-2">{fmt(r.ngayNop)}</td>
                    <td className="px-3 py-2">
                      {tt && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tt.mau}`}>{tt.label}</span>}
                      {r.soChungChi && <div className="text-xs text-slate-500 mt-0.5">Số CC: {r.soChungChi}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
