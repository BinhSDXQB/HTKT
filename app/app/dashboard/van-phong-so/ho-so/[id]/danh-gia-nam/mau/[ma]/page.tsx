import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { chuanNam, kiemTraBang, layHoSo, moHoSo } from '@/lib/danh-gia-nam/may-chu'
import { duocSuaPhan } from '@/lib/danh-gia-nam/quyen'
import { TRANG_THAI_DANH_GIA_LABEL } from '@/lib/danh-gia-nam/trang-thai'
import { TIEU_CHI_CHUNG, diemNhiemVuNam } from '@/lib/danh-gia-nam/tieu-chi'
import { timMau } from '@/lib/danh-gia-nam/mau-bieu'
import { oPhanA, kpiTuMau04, type DongM04 } from '@/lib/danh-gia-nam/bieu-mau-du-lieu'
import { MUC_XEP_LOAI_OPTIONS, MUC_XEP_LOAI_LABEL } from '@/lib/office-labels'
import { luuMauCaNhanAction } from '@/app/actions/bieu-mau'

export const dynamic = 'force-dynamic'

const O = 'w-full border rounded-lg p-2 text-sm'
const SO = 'w-20 h-8 border rounded px-1 text-sm'
const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '—' : String(Math.round(v * 1000) / 1000).replace('.', ','))

// Form NHẬP theo biểu mẫu cá nhân: Mẫu 2A / 2B / 2C (bản kiểm điểm), 03 (phiếu xếp loại), 04 (bảng KPI).
export default async function MauCaNhanPage({ params, searchParams }: { params: Promise<{ id: string; ma: string }>; searchParams: Promise<{ nam?: string; tb?: string; loi?: string }> }) {
  const { id, ma } = await params
  const sp = await searchParams
  if (!['2A', '2B', '2C', '03', '04'].includes(ma)) notFound()
  const nam = chuanNam(sp.nam) ?? 2026
  const user = await requireAuth()
  const quayLai = `/dashboard/van-phong-so/ho-so/${id}/danh-gia-nam?nam=${nam}`
  if (!(await kiemTraBang())) return <p className="text-sm text-amber-700">Chưa áp migration 058; chức năng chưa sẵn sàng.</p>
  const h0 = await layHoSo(id, nam, 'CBCCVC')
  if (!h0) return <div className="space-y-2"><p className="text-sm">Chưa có hồ sơ đánh giá năm {nam}.</p><Link className="text-indigo-700 text-sm hover:underline" href={quayLai}>← Lập hồ sơ</Link></div>
  const m = await moHoSo(user, h0.id)
  if (!m || m.tuChoi) return <p className="text-sm text-red-700">Bạn không có quyền xem hồ sơ này.</p>
  const { hs: h, cb, vaiTro } = m
  if (['2A', '2B', '2C'].includes(ma) && ma !== h.mauApDung) {
    return <div className="space-y-2"><p className="text-sm text-red-700">Mẫu {ma} không đúng đối tượng; hồ sơ này áp dụng Mẫu {h.mauApDung}.</p><Link className="text-indigo-700 text-sm hover:underline" href={`./${h.mauApDung}?nam=${nam}`}>Mở Mẫu {h.mauApDung}</Link></div>
  }
  const bm = h.bieuMau
  const chinhChuSua = duocSuaPhan('tuDanhGia', h.trangThai, vaiTro)
  const thuKySua = duocSuaPhan('diem', h.trangThai, vaiTro)
  const nhanXetSua = duocSuaPhan('nhanXet', h.trangThai, vaiTro)
  const mau = timMau(ma, 'SNV_CV6862')
  const hid = (phan: string) => (<>
    <input type="hidden" name="reviewId" value={h.id} /><input type="hidden" name="canBoId" value={id} />
    <input type="hidden" name="nam" value={nam} /><input type="hidden" name="ma" value={ma} /><input type="hidden" name="phan" value={phan} />
  </>)
  const luu = (duoc: boolean, nhan = 'Lưu phần này') => duoc
    ? <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm">{nhan}</button>
    : <p className="text-xs text-slate-400">Chỉ xem (bạn không được sửa phần này ở bước {TRANG_THAI_DANH_GIA_LABEL[h.trangThai]}).</p>
  const chonMuc = (ten: string, giaTri: string | null | undefined, duoc: boolean) => (
    <select name={ten} defaultValue={giaTri ?? ''} disabled={!duoc} className="border rounded-lg h-9 px-2 text-sm">
      <option value="">—</option>{MUC_XEP_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  const dau = (
    <div className="space-y-1">
      <div className="text-sm text-slate-500"><Link href={quayLai} className="hover:underline">← Hồ sơ đánh giá năm {nam}</Link></div>
      <h1 className="text-xl font-bold text-slate-900">Mẫu số {ma} — {mau?.ten}</h1>
      <p className="text-sm text-slate-600">{cb.hoTen} · {cb.chucVu ?? '—'} · {cb.tenPhong ?? '—'} · Bước: <b>{TRANG_THAI_DANH_GIA_LABEL[h.trangThai]}</b></p>
      <p className="text-xs text-slate-500">Căn cứ: {mau?.banGoc}. Dữ liệu nhập ở đây được lưu vào hồ sơ đánh giá và dùng khi xuất Word.</p>
      <a href={`/api/office/danh-gia-nam/xuat?reviewId=${h.id}&mau=${ma}`} className="inline-block text-xs px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Xuất Mẫu {ma} ({ma === '04' ? 'Excel' : 'Word'})</a>
      {sp.tb && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{sp.tb}</div>}
      {sp.loi && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.loi}</div>}
    </div>
  )

  // ── Mẫu 04: bảng KPI ────────────────────────────────────────────────────
  if (ma === '04') {
    const kq = kpiTuMau04(bm.m04)
    const duoc = chinhChuSua || thuKySua
    const nhom = (k: 'A' | 'B', ten: string) => {
      const ds: Partial<DongM04>[] = [...(bm.m04?.[k] ?? []), ...(duoc ? [{}, {}, {}] : [])]
      return (
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-800 text-sm">{ten}</h3>
          <div className="overflow-x-auto">
            <table className="text-xs min-w-[1100px]">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="px-1 py-1 text-left">Nhiệm vụ / công việc chi tiết</th><th className="px-1">Sản phẩm</th><th className="px-1">Hạn (5)</th>
                <th className="px-1">Điểm danh mục (7)</th><th className="px-1">Số lượng (8)</th><th className="px-1">Hoàn thành thực tế (10)</th>
                <th className="px-1">Số lần chỉnh sửa (12)</th><th className="px-1">Ngày hoàn thành (15)</th><th className="px-1">Số ngày chậm</th>
              </tr></thead>
              <tbody>{ds.map((d, i) => (
                <tr key={i} className="border-t">
                  <td className="px-1 py-1"><input name={`${k}.${i}.nhiemVu`} defaultValue={d.nhiemVu ?? ''} disabled={!duoc} className="w-72 h-8 border rounded px-1" /></td>
                  <td className="px-1"><input name={`${k}.${i}.sanPham`} defaultValue={d.sanPham ?? ''} disabled={!duoc} className="w-40 h-8 border rounded px-1" /></td>
                  <td className="px-1"><input name={`${k}.${i}.hanHoanThanh`} defaultValue={d.hanHoanThanh ?? ''} disabled={!duoc} placeholder="dd/mm/yyyy" className="w-24 h-8 border rounded px-1" /></td>
                  {(['diemDanhMuc', 'soLuong', 'hoanThanhThucTe', 'soLanChinhSua'] as const).map((f) => <td key={f} className="px-1"><input name={`${k}.${i}.${f}`} defaultValue={d[f] ?? ''} disabled={!duoc} className="w-16 h-8 border rounded px-1" /></td>)}
                  <td className="px-1"><input name={`${k}.${i}.ngayHoanThanh`} defaultValue={d.ngayHoanThanh ?? ''} disabled={!duoc} placeholder="dd/mm/yyyy" className="w-24 h-8 border rounded px-1" /></td>
                  <td className="px-1"><input name={`${k}.${i}.soNgayCham`} defaultValue={d.soNgayCham ?? ''} disabled={!duoc} className="w-14 h-8 border rounded px-1" /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="text-xs text-slate-600">Tổng điểm quy đổi {fmt(kq[k].tongDiem)} · Điểm KPI nhóm {fmt(kq[k].kpi)} · Điểm đạt {fmt(kq[k].diemDat)}/{k === 'A' ? 10 : 90}</p>
        </div>
      )
    }
    return (
      <div className="space-y-5 max-w-6xl">
        {dau}
        <form action={luuMauCaNhanAction} className="rounded-xl border bg-white p-5 space-y-4">{hid('m04')}
          <p className="text-xs text-slate-500">Công thức theo bản gốc: (9)=(8)×(7); (11)=(10)×(7); (13)=100%−(12)×25%; (16)=1−số ngày chậm×0,05; điểm KPI nhóm = bình quân 3 chỉ số quy đổi / tổng điểm quy đổi. Mỗi lần lưu thêm sẵn 3 dòng trống; dòng để trống bị bỏ.</p>
          {nhom('A', 'A. NHIỆM VỤ TRỌNG TÂM, THEN CHỐT (10 ĐIỂM)')}
          {nhom('B', 'B. NHIỆM VỤ THEO CHỨC NĂNG, NHIỆM VỤ ĐƯỢC GIAO (90 ĐIỂM)')}
          <p className="text-sm font-semibold text-slate-800">TỔNG ĐIỂM ĐẠT (A+B): {fmt(kq.tong)} — dùng làm điểm KPI ở Mẫu {h.mauApDung} (phần B.II) và hồ sơ đánh giá.</p>
          {luu(duoc, 'Lưu bảng KPI')}
        </form>
      </div>
    )
  }

  // ── Mẫu 03: phiếu xếp loại ──────────────────────────────────────────────
  if (ma === '03') {
    const q = h.diemQuy
    return (
      <div className="space-y-5 max-w-4xl">
        {dau}
        <form action={luuMauCaNhanAction} className="rounded-xl border bg-white p-5 space-y-3">{hid('m03')}
          <h2 className="font-bold text-slate-900">I. TỔNG HỢP KẾT QUẢ THEO DÕI, ĐÁNH GIÁ</h2>
          <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1 text-left">Quý</th><th className="px-2">Tổng điểm theo dõi, đánh giá</th><th className="px-2">Kết quả xếp loại chất lượng</th></tr></thead>
            <tbody>{(['I', 'II', 'III', 'IV'] as const).map((k) => (
              <tr key={k} className="border-t"><td className="px-2 py-1">{k}</td><td className="px-2 text-center">{fmt(q[k])}</td><td className="px-2">{chonMuc(`mucQuy_${k}`, bm.m03?.mucQuy?.[k], thuKySua)}</td></tr>
            ))}<tr className="border-t font-semibold"><td className="px-2 py-1">Cả năm</td><td className="px-2 text-center">{fmt(h.tongDiem)}</td><td className="px-2">{h.mucPheDuyet ? MUC_XEP_LOAI_LABEL[h.mucPheDuyet] : 'chưa phê duyệt'}</td></tr></tbody>
          </table>
          <p className="text-xs text-slate-500">Điểm từng quý nhập ở trang hồ sơ đánh giá (phần điểm). Mức cả năm chỉ hiện khi cấp có thẩm quyền đã phê duyệt.</p>
          <h2 className="font-bold text-slate-900">II. CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG</h2>
          <p className="text-sm">{bm.tuNhanMuc ? MUC_XEP_LOAI_LABEL[bm.tuNhanMuc] : 'Chưa tự nhận mức (cá nhân ghi ở Mẫu ' + h.mauApDung + ').'}</p>
          <h2 className="font-bold text-slate-900">III. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN</h2>
          <p className="text-sm">{h.mucPheDuyet ? MUC_XEP_LOAI_LABEL[h.mucPheDuyet] : 'Chưa phê duyệt.'}</p>
          <h2 className="font-bold text-slate-900">IV. ĐỀ XUẤT PHƯƠNG ÁN XỬ LÝ</h2>
          <textarea name="deXuatXuLy" defaultValue={bm.m03?.deXuatXuLy ?? ''} disabled={!thuKySua} rows={3} className={O} />
          {luu(thuKySua)}
        </form>
      </div>
    )
  }

  // ── Mẫu 2A / 2B / 2C: bản kiểm điểm ────────────────────────────────────
  const oA = oPhanA(ma as '2A' | '2B' | '2C')
  const kpi = h.diemKpiTong
  const iii = bm.bangIII
  return (
    <div className="space-y-5 max-w-4xl">
      {dau}
      <form action={luuMauCaNhanAction} className="rounded-xl border bg-white p-5 space-y-3">{hid('phanA')}
        <h2 className="font-bold text-slate-900">A. NỘI DUNG KIỂM ĐIỂM <span className="text-xs font-normal text-slate-500">(cá nhân tự viết, ở bước Tự đánh giá)</span></h2>
        {oA.map((o) => (
          <label key={o.ma} className="block space-y-1">
            <span className="text-sm font-medium text-slate-800">{o.nhan}</span>
            {o.goiY && <span className="block text-xs italic text-slate-500">{o.goiY}</span>}
            <textarea name={o.ma} defaultValue={bm.phanA?.[o.ma] ?? ''} disabled={!chinhChuSua} rows={3} className={O} />
          </label>
        ))}
        {luu(chinhChuSua, 'Lưu phần A')}
      </form>

      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI</h2>
        <h3 className="text-sm font-semibold">I. Nhóm tiêu chí chung (30 điểm) — điểm nhập ở trang hồ sơ đánh giá</h3>
        <table className="w-full text-xs"><tbody>{TIEU_CHI_CHUNG.map((c) => (
          <tr key={c.ma} className="border-t"><td className="py-1 pr-2 w-12">{c.ma}</td><td className="pr-2">{c.ten}</td><td className="w-16 text-center">{String(c.toiDa).replace('.', ',')}</td><td className="w-16 text-center font-semibold">{fmt(h.diemChung[c.ma])}</td></tr>
        ))}</tbody></table>
        <h3 className="text-sm font-semibold">II. Tiêu chí về kết quả thực hiện nhiệm vụ (70 điểm)</h3>
        <p className="text-sm">Điểm KPI (Mẫu 04): <b>{fmt(kpi)}</b>/100 → điểm đánh giá năm {nam}: <b>{kpi === null ? '—' : fmt(diemNhiemVuNam(kpi))}</b>/70. <Link className="text-indigo-700 hover:underline" href={`./04?nam=${nam}`}>Nhập bảng KPI (Mẫu 04)</Link></p>
        <p className="text-sm">Tổng điểm: <b>{fmt(h.tongDiem)}</b>/100</p>
      </section>

      <form action={luuMauCaNhanAction} className="rounded-xl border bg-white p-5 space-y-2">{hid('bangIII')}
        <h3 className="text-sm font-semibold">III. Số nhiệm vụ, công việc vượt mục tiêu và không đạt trong kỳ đánh giá</h3>
        <table className="text-xs"><thead className="text-slate-600"><tr><th className="px-1 text-left">Nhóm</th><th className="px-1">{ma === '2A' ? 'Tổng tiêu chí' : 'Tổng sản phẩm'} được đánh giá</th><th className="px-1">Số vượt mục tiêu</th><th className="px-1">Số đột phá, nổi trội</th><th className="px-1">Số không hoàn thành</th></tr></thead>
          <tbody>{(['A', 'B'] as const).map((k) => (
            <tr key={k} className="border-t"><td className="px-1 py-1">{k === 'A' ? '1. Nhiệm vụ trọng tâm, then chốt' : '2. Nhiệm vụ theo chức năng, thường xuyên'}</td>
              {(['tong', 'vuot', 'dotPha', 'khongHoanThanh'] as const).map((f) => <td key={f} className="px-1"><input name={`${k}_${f}`} defaultValue={iii?.[k]?.[f] ?? ''} disabled={!(chinhChuSua || thuKySua)} className={SO} /></td>)}</tr>
          ))}</tbody></table>
        {luu(chinhChuSua || thuKySua)}
      </form>

      <form action={luuMauCaNhanAction} className="rounded-xl border bg-white p-5 space-y-2">{hid('tuNhanMuc')}
        <h3 className="text-sm font-semibold">{ma === '2A' ? 'Tự nhận mức xếp loại chất lượng' : '3. Tự nhận mức xếp loại chất lượng'}</h3>
        <div className="space-y-1">{MUC_XEP_LOAI_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm"><input type="radio" name="tuNhanMuc" value={o.value} defaultChecked={bm.tuNhanMuc === o.value} disabled={!chinhChuSua} />{o.label}</label>
        ))}</div>
        {luu(chinhChuSua)}
      </form>

      <section className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-bold text-slate-900">C. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN</h2>
        {ma !== '2A' && (
          <form action={luuMauCaNhanAction} className="space-y-1">{hid('yKienDonViCauThanh')}
            <h3 className="text-sm font-semibold">I. Ý kiến nhận xét, đánh giá (phần dành cho người đứng đầu đơn vị cấu thành, nếu có)</h3>
            <textarea name="noiDung" defaultValue={bm.yKienDonViCauThanh ?? ''} disabled={!nhanXetSua} rows={3} className={O} />
            {luu(nhanXetSua)}
          </form>
        )}
        <h3 className="text-sm font-semibold">{ma === '2A' ? '1' : 'II.1'}. Ý kiến nhận xét của cấp có thẩm quyền theo dõi, đánh giá</h3>
        <p className="text-sm whitespace-pre-wrap text-slate-700">{h.nhanXetLanhDao || <span className="text-slate-400">Chưa có (nhập ở trang hồ sơ đánh giá).</span>}</p>
        <h3 className="text-sm font-semibold">{ma === '2A' ? '2' : 'II.2'}. Kết quả xếp loại chất lượng</h3>
        <p className="text-sm">{h.mucPheDuyet ? <b>{MUC_XEP_LOAI_LABEL[h.mucPheDuyet]}</b> : 'Chưa phê duyệt (chỉ cấp có thẩm quyền chọn khi phê duyệt).'}</p>
      </section>
    </div>
  )
}
