import { Fragment } from 'react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { chuanNam, kiemTraBang } from '@/lib/danh-gia-nam/may-chu'
import { duocXemTongHopSo, duLieuTongHopSo } from '@/lib/danh-gia-nam/may-chu-bieu-mau'
import { lapMau05, lapMau06, tyLe, chuaPhanLoai, MUC_HOP_LE, type HangMau05 } from '@/lib/danh-gia-nam/bieu-mau-du-lieu'
import { MUC_XEP_LOAI_LABEL } from '@/lib/office-labels'

export const dynamic = 'force-dynamic'

// Mẫu 05 (công chức), 06 (viên chức), 07 (danh sách) — tổng hợp TOÀN SỞ từ hồ sơ ĐÃ PHÊ DUYỆT. Không nhập tay số liệu.
export default async function TongHopSoPage({ searchParams }: { searchParams: Promise<{ nam?: string }> }) {
  const user = await requireAuth()
  if (!duocXemTongHopSo(user)) redirect('/forbidden')
  const nam = chuanNam((await searchParams).nam) ?? 2026
  if (!(await kiemTraBang())) return <p className="text-sm text-amber-700">Chưa áp migration 058.</p>
  const ds = await duLieuTongHopSo(nam)
  const bang = (tieuDe: string, hang: HangMau05[], ma: string) => (
    <section className="rounded-xl border bg-white p-5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-slate-900">{tieuDe}</h2>
        <a href={`/api/office/danh-gia-nam/xuat?mau=${ma}&nam=${nam}`} className="text-xs px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Xuất Mẫu {ma} (Word)</a>
      </div>
      <div className="overflow-x-auto"><table className="text-xs min-w-[900px]">
        <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1 text-left">Cơ quan, đơn vị</th><th className="px-2">Tổng số (người)</th>
          {MUC_HOP_LE.map((m) => <th key={m} className="px-2" colSpan={2}>{MUC_XEP_LOAI_LABEL[m]}<br /><span className="font-normal">SL · Tỷ lệ %</span></th>)}<th className="px-2">Ghi chú</th></tr></thead>
        <tbody>{hang.map((h) => (
          <tr key={h.nhan} className="border-t"><td className="px-2 py-1">{h.nhan}</td><td className="px-2 text-center">{h.tong}</td>
            {MUC_HOP_LE.map((m) => <Fragment key={m}><td className="px-2 text-center">{h.theoMuc[m]}</td><td className="px-2 text-center">{tyLe(h.theoMuc[m], h.tong)}</td></Fragment>)}
            <td className="px-2">{h.ghiChu}</td></tr>
        ))}</tbody></table></div>
    </section>
  )
  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-bold text-slate-900">Tổng hợp kết quả đánh giá, xếp loại toàn Sở năm {nam} (Mẫu 05, 06, 07)</h1>
      <p className="text-sm text-slate-600">Chỉ tính hồ sơ đã được cấp có thẩm quyền phê duyệt ({ds.length} người). Mục &ldquo;Cán bộ&rdquo; (diện bầu cử) và các dòng cấp xã của bản gốc không áp dụng cho Sở. Ghi chú: người không hoàn thành nhiệm vụ, ghi rõ lý do khi hoàn thiện văn bản.</p>
      {chuaPhanLoai(ds).length > 0 && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Có {chuaPhanLoai(ds).length} người đã phê duyệt nhưng hồ sơ cán bộ chưa ghi đối tượng (công chức / viên chức), nên CHƯA được tính vào Mẫu 05/06: {chuaPhanLoai(ds).map((d) => d.hoTen).join(', ')}. Bổ sung đối tượng trong hồ sơ cán bộ trước khi xuất bản chính thức.</div>}
      {bang('Mẫu số 05 — Báo cáo tổng hợp kết quả đánh giá, xếp loại chất lượng cán bộ, công chức', lapMau05(ds), '05')}
      {bang('Mẫu số 06 — Báo cáo tổng hợp kết quả đánh giá, xếp loại chất lượng viên chức', lapMau06(ds), '06')}
      <section className="rounded-xl border bg-white p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-900">Mẫu số 07 — Tổng hợp kết quả đánh giá, xếp loại chất lượng CBCCVC</h2>
          <a href={`/api/office/danh-gia-nam/xuat?mau=07&nam=${nam}`} className="text-xs px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Xuất Mẫu 07 (Word)</a></div>
        <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1">TT</th><th className="px-2 text-left">Họ và tên</th><th className="px-2 text-left">Vị trí việc làm (chức vụ/đơn vị công tác)</th><th className="px-2 text-left">Kết quả xếp loại chất lượng</th><th className="px-2 text-left">Ghi chú</th></tr></thead>
          <tbody>{ds.map((d, i) => (
            <tr key={i} className="border-t"><td className="px-2 py-1 text-center">{i + 1}</td><td className="px-2">{d.hoTen}</td><td className="px-2">{d.viTri}</td><td className="px-2">{d.muc ? MUC_XEP_LOAI_LABEL[d.muc] : ''}</td>
              <td className="px-2">{d.doiTuong === 'CONG_CHUC' ? 'Công chức' : d.doiTuong === 'VIEN_CHUC' ? 'Viên chức' : d.doiTuong === 'NGUOI_LAO_DONG' ? 'Người lao động' : ''}</td></tr>
          ))}{ds.length === 0 && <tr><td colSpan={5} className="px-2 py-4 text-center text-slate-400">Chưa có hồ sơ nào được phê duyệt.</td></tr>}</tbody></table>
      </section>
    </div>
  )
}
