import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { chuanNam, kiemTraBang, hoSoCuaToi, tongHopTheoPhong } from '@/lib/danh-gia-nam/may-chu'
import { layHoSoTapThe, quyenTapThe } from '@/lib/danh-gia-nam/may-chu-bieu-mau'
import { O_MAU_01, TIEU_CHI_TAP_THE, tongDiemTapThe } from '@/lib/danh-gia-nam/bieu-mau-du-lieu'
import { TRANG_THAI_DANH_GIA_LABEL } from '@/lib/danh-gia-nam/trang-thai'
import { MUC_XEP_LOAI_OPTIONS, MUC_XEP_LOAI_LABEL } from '@/lib/office-labels'
import { taoTapTheAction, luuTapTheAction, buocTapTheAction } from '@/app/actions/bieu-mau'

export const dynamic = 'force-dynamic'
const O = 'w-full border rounded-lg p-2 text-sm'

// Mẫu số 01 — Báo cáo kiểm điểm, tự đánh giá, xếp loại chất lượng của TẬP THỂ (phòng). Soạn: Trưởng phòng / Văn phòng; duyệt: lãnh đạo Sở.
export default async function Mau01Page({ searchParams }: { searchParams: Promise<{ phong?: string; nam?: string; tb?: string; loi?: string }> }) {
  const sp = await searchParams
  const user = await requireAuth()
  const nam = chuanNam(sp.nam) ?? 2026
  const phong = sp.phong || (await hoSoCuaToi(user))?.toChucId || ''
  if (!phong) redirect('/forbidden')
  const q = await quyenTapThe(user, phong)
  if (!q.xem) redirect('/forbidden')
  if (!(await kiemTraBang())) return <p className="text-sm text-amber-700">Chưa áp migration 058.</p>
  const tc = await db.toChuc.findUnique({ where: { id: phong }, select: { ten: true } })
  const h = await layHoSoTapThe(phong, nam)
  const hid = (phan?: string) => (<><input type="hidden" name="phong" value={phong} /><input type="hidden" name="nam" value={nam} />{phan && <input type="hidden" name="phan" value={phan} />}</>)
  const mo = h && ['DU_THAO', 'TU_DANH_GIA', 'GUI_NHAN_XET', 'TONG_HOP', 'HOP_DANH_GIA'].includes(h.trangThai)
  const sua = !!(q.soan && mo)
  const dau = (
    <div className="space-y-1">
      <div className="text-sm text-slate-500"><Link className="hover:underline" href={`/dashboard/van-phong-so/danh-gia/tong-hop?phong=${phong}&nam=${nam}`}>← Tổng hợp đánh giá phòng</Link></div>
      <h1 className="text-xl font-bold text-slate-900">Mẫu số 01 — Báo cáo kiểm điểm, tự đánh giá, xếp loại chất lượng của tập thể {tc?.ten} năm {nam}</h1>
      {h && <p className="text-sm text-slate-600">Bước: <b>{TRANG_THAI_DANH_GIA_LABEL[h.trangThai]}</b> · Tự đề xuất: {h.mucTuDeXuat ? MUC_XEP_LOAI_LABEL[h.mucTuDeXuat] : '—'} · Phê duyệt: <b>{h.mucPheDuyet ? MUC_XEP_LOAI_LABEL[h.mucPheDuyet] : 'chưa'}</b></p>}
      <a href={`/api/office/danh-gia-nam/xuat?phong=${phong}&nam=${nam}&mau=01`} className="inline-block text-xs px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Xuất Mẫu 01 (Word)</a>
      {sp.tb && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{sp.tb}</div>}
      {sp.loi && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.loi}</div>}
    </div>
  )
  if (!h) {
    return <div className="space-y-4 max-w-4xl">{dau}
      {q.soan ? <form action={taoTapTheAction}>{hid()}<button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Lập báo cáo tập thể</button></form>
        : <p className="text-sm text-slate-500">Chưa có báo cáo tập thể. Trưởng phòng hoặc Văn phòng Sở lập.</p>}
    </div>
  }
  const bm = h.bieuMau
  const t = tongDiemTapThe(bm)
  const duThao = (await tongHopTheoPhong(phong, nam))?.duThao ?? []
  const luu = (nhan = 'Lưu phần này') => sua ? <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm">{nhan}</button> : <p className="text-xs text-slate-400">Chỉ xem.</p>
  return (
    <div className="space-y-5 max-w-4xl">
      {dau}
      <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm space-y-1">
        <b>Dữ liệu thực tế để tham khảo khi viết (không tự điền vào báo cáo):</b>
        <ul className="list-disc pl-5">{duThao.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </section>
      <form action={luuTapTheAction} className="rounded-xl border bg-white p-5 space-y-3">{hid('phanA')}
        <h2 className="font-bold">A. NỘI DUNG KIỂM ĐIỂM</h2>
        {O_MAU_01.map((o) => (
          <label key={o.ma} className="block space-y-1"><span className="text-sm font-medium">{o.nhan}</span>{o.goiY && <span className="block text-xs italic text-slate-500">{o.goiY}</span>}
            <textarea name={o.ma} defaultValue={bm.phanA?.[o.ma] ?? ''} disabled={!sua} rows={3} className={O} /></label>
        ))}
        {luu('Lưu phần A')}
      </form>
      <form action={luuTapTheAction} className="rounded-xl border bg-white p-5 space-y-2">{hid('diem')}
        <h2 className="font-bold">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</h2>
        <h3 className="text-sm font-semibold">1. Nhóm tiêu chí chung: {t.chung ?? '…'}/30 điểm</h3>
        <table className="w-full text-xs"><tbody>{TIEU_CHI_TAP_THE.map((ten, i) => (
          <tr key={i} className="border-t"><td className="py-1 w-6">{i + 1}</td><td className="pr-2">{ten}</td><td className="w-10 text-center">05</td>
            <td className="w-20"><input name={`tc_${i + 1}`} defaultValue={bm.diemChung6?.[i] ?? ''} disabled={!sua} className="w-16 h-8 border rounded px-1" /></td></tr>
        ))}</tbody></table>
        <h3 className="text-sm font-semibold">2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: {t.nhiemVu ?? '…'}/70 điểm</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <label>Điểm KPI nhiệm vụ trọng tâm, then chốt (tối đa 10) <input name="kpiA" defaultValue={bm.kpiA ?? ''} disabled={!sua} className="w-16 h-8 border rounded px-1 ml-1" /></label>
          <label>Điểm KPI nhiệm vụ thường xuyên (tối đa 90) <input name="kpiB" defaultValue={bm.kpiB ?? ''} disabled={!sua} className="w-16 h-8 border rounded px-1 ml-1" /></label>
        </div>
        <p className="text-sm">Tổng điểm: <b>{t.tong ?? '…'}</b>/100 (tiêu chí chung + KPI × 70/100). Điểm KPI tập thể theo bộ tiêu chí đánh giá tổ chức của tỉnh; hệ thống không tự suy từ điểm cá nhân.</p>
        {luu('Lưu điểm')}
      </form>
      <form action={luuTapTheAction} className="rounded-xl border bg-white p-5 space-y-2">{hid('bangIII')}
        <h3 className="text-sm font-semibold">3. Số nhiệm vụ, công việc vượt mục tiêu và không đạt trong kỳ đánh giá</h3>
        <table className="text-xs"><thead className="text-slate-600"><tr><th className="px-1 text-left">Nhóm</th><th className="px-1">Tổng tiêu chí</th><th className="px-1">Vượt mục tiêu</th><th className="px-1">Đột phá, nổi trội</th><th className="px-1">Không hoàn thành</th></tr></thead>
          <tbody>{(['A', 'B'] as const).map((k) => (
            <tr key={k} className="border-t"><td className="px-1 py-1">{k === 'A' ? 'Trọng tâm, then chốt' : 'Chức năng, thường xuyên'}</td>
              {(['tong', 'vuot', 'dotPha', 'khongHoanThanh'] as const).map((f) => <td key={f} className="px-1"><input name={`${k}_${f}`} defaultValue={bm.bangIII?.[k]?.[f] ?? ''} disabled={!sua} className="w-16 h-8 border rounded px-1" /></td>)}</tr>
          ))}</tbody></table>
        {luu()}
      </form>
      <form action={luuTapTheAction} className="rounded-xl border bg-white p-5 space-y-2">{hid('mucTuDeXuat')}
        <h3 className="text-sm font-semibold">II. Đề xuất mức xếp loại chất lượng (tập thể tự đề xuất)</h3>
        <div className="space-y-1">{MUC_XEP_LOAI_OPTIONS.map((o) => <label key={o.value} className="flex items-center gap-2 text-sm"><input type="radio" name="muc" value={o.value} defaultChecked={h.mucTuDeXuat === o.value} disabled={!sua} />{o.label}</label>)}</div>
        {luu()}
      </form>
      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h3 className="text-sm font-semibold">Quy trình</h3>
        {sua && <form action={buocTapTheAction}>{hid()}<input type="hidden" name="thaoTac" value="trinh" /><button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Trình lãnh đạo Sở phê duyệt</button></form>}
        {q.duyet && h.trangThai === 'TRINH_PHE_DUYET' && (<>
          <form action={buocTapTheAction} className="flex gap-2 items-center">{hid()}<input type="hidden" name="thaoTac" value="duyet" />
            <select name="muc" required defaultValue="" className="border rounded-lg h-9 px-2 text-sm"><option value="" disabled>Mức xếp loại chính thức…</option>{MUC_XEP_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <button className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-sm">Phê duyệt</button></form>
          <form action={buocTapTheAction} className="flex gap-2 items-center">{hid()}<input type="hidden" name="thaoTac" value="traVe" />
            <input name="lyDo" required placeholder="Lý do trả về" className="border rounded-lg h-9 px-2 text-sm w-72" /><button className="px-3 py-1.5 rounded-lg border text-sm">Trả về</button></form>
        </>)}
        {(q.soan || q.duyet) && h.trangThai === 'DA_PHE_DUYET' && <form action={buocTapTheAction}>{hid()}<input type="hidden" name="thaoTac" value="luu" /><button className="px-3 py-1.5 rounded-lg border text-sm">Lưu hồ sơ</button></form>}
        <p className="text-xs text-slate-500">Mức xếp loại tập thể do tập thể tự đề xuất và lãnh đạo Sở phê duyệt; hệ thống không suy ra từ xếp loại cá nhân.</p>
      </section>
    </div>
  )
}
