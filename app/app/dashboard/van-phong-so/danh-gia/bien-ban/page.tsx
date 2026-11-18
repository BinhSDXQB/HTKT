import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { chuanNam, kiemTraBang, hoSoCuaToi } from '@/lib/danh-gia-nam/may-chu'
import { quyenTapThe, duocXemTongHopSo } from '@/lib/danh-gia-nam/may-chu-bieu-mau'
import { thanhPhanTrieuTap, layBienBan, nguoiDuocDanhGia } from '@/lib/danh-gia-nam/bien-ban-db'
import { THANH_PHAN, THAM_DU_LABEL, kiemTraBienBan, thongKeThamDu, type NguoiTrieuTap, type ThamDu } from '@/lib/danh-gia-nam/bien-ban-hop'
import { MUC_XEP_LOAI_LABEL } from '@/lib/office-labels'
import { luuBienBanAction, chotBienBanAction, moLaiBienBanAction } from '@/app/actions/bieu-mau'

export const dynamic = 'force-dynamic'
const O = 'border rounded-lg h-9 px-2 text-sm'
const LOAI_DON_VI = ['LANH_DAO_SO', 'VAN_PHONG', 'PHONG', 'BAN', 'DON_VI_TRUC_THUOC']

// Biên bản cuộc họp nhận xét, đánh giá, xếp loại chất lượng cuối năm — mỗi phòng/đơn vị một biên bản.
// Thành phần triệu tập tính từ hồ sơ cán bộ theo Điều 21 NĐ 335/2025 (NĐ 233/2026 với viên chức).
export default async function BienBanPage({ searchParams }: { searchParams: Promise<{ phong?: string; nam?: string; tb?: string; loi?: string }> }) {
  const sp = await searchParams
  const user = await requireAuth()
  const nam = chuanNam(sp.nam) ?? 2026
  const phong = sp.phong || (await hoSoCuaToi(user))?.toChucId || ''
  if (!phong) redirect('/forbidden')
  const q = await quyenTapThe(user, phong)
  if (!q.xem) redirect('/forbidden')
  if (!(await kiemTraBang())) return <p className="text-sm text-amber-700">Chưa áp migration 058.</p>
  const tp = await thanhPhanTrieuTap(phong)
  const bb = await layBienBan(phong, nam)
  const nguoi = await nguoiDuocDanhGia(phong, nam)
  if (!tp) redirect('/forbidden')
  const donVi = duocXemTongHopSo(user)
    ? await db.toChuc.findMany({ where: { isActive: true, loai: { in: LOAI_DON_VI as never } }, select: { id: true, ten: true }, orderBy: [{ cap: 'asc' }, { thuTu: 'asc' }] })
    : []
  // Danh sách trên form = thành phần hiện tại ∪ người đã ghi trong biên bản (giữ người đã dự họp rồi chuyển đi)
  const ds: (NguoiTrieuTap & { moi?: boolean; daRoi?: boolean })[] = tp.ds.map((d) => ({ ...d, moi: !!bb && !bb.thanhVien.some((x) => x.canBoId === d.canBoId) }))
  for (const x of bb?.thanhVien ?? []) if (!ds.some((d) => d.canBoId === x.canBoId)) ds.push({ ...x, daRoi: true })
  const theoId = new Map((bb?.thanhVien ?? []).map((x) => [x.canBoId, x]))
  const viPham = kiemTraBienBan(bb, tp.ds, nguoi.map((n) => n.canBoId))
  const tk = bb ? thongKeThamDu(bb) : null
  const khoa = !!bb?.chot
  const sua = q.soan && !khoa
  const coLanhDao = tp.loai !== 'PHONG'
  const hidDv = (<><input type="hidden" name="phong" value={phong} /><input type="hidden" name="nam" value={nam} /></>)
  const thanhPhan = THANH_PHAN[tp.loai]
  return (
    <div className="space-y-5 max-w-5xl">
      <div className="space-y-1">
        <div className="text-sm text-slate-500"><Link className="hover:underline" href={`/dashboard/van-phong-so/danh-gia/tong-hop?phong=${phong}&nam=${nam}`}>← Tổng hợp đánh giá phòng</Link></div>
        <h1 className="text-xl font-bold text-slate-900">Biên bản họp nhận xét, đánh giá, xếp loại chất lượng năm {nam} — {tp.ten}</h1>
        {donVi.length > 0 && (
          <form className="flex gap-2 items-center text-sm">
            <select name="phong" defaultValue={phong} className={O}>{donVi.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}</select>
            <input type="hidden" name="nam" value={nam} /><button className="px-3 py-1.5 rounded-lg border text-sm">Xem đơn vị</button>
          </form>
        )}
        {bb && <p className="text-sm">Trạng thái: {bb.chot ? <b className="text-emerald-700">Đã chốt (thông qua) lúc {new Date(bb.chot.luc).toLocaleString('vi-VN')}</b> : <b className="text-amber-700">Đang soạn — chưa chốt</b>}</p>}
        {bb && <a href={`/api/office/danh-gia-nam/xuat?phong=${phong}&nam=${nam}&mau=BB`} className="inline-block text-xs px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">{bb.chot ? 'Xuất biên bản (Word)' : 'Xuất bản dự thảo (Word)'}</a>}
        {sp.tb && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{sp.tb}</div>}
        {sp.loi && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.loi}</div>}
      </div>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm space-y-1">
        <div><b>Loại cuộc họp:</b> {thanhPhan.nhan}</div>
        <div><b>Thành phần theo quy định:</b> {thanhPhan.thanhPhan}</div>
        <div><b>Căn cứ:</b> {thanhPhan.canCu}. Các ý kiến phải được ghi vào biên bản và thông qua tại cuộc họp.</div>
        {tp.ghiChu && <div className="text-amber-800">{tp.ghiChu}</div>}
        <div className="text-xs text-slate-600">Văn bản hiện hành không quy định số người tối thiểu phải có mặt, cũng không quy định tỷ lệ thông qua. Hệ thống yêu cầu ghi đủ toàn bộ thành phần triệu tập (chọn có mặt hoặc vắng cho từng người), coi biên bản được thông qua khi quá nửa số người có mặt tán thành, và chỉ cảnh báo khi có mặt dưới 2/3. Hồ sơ cá nhân chỉ trình được sau khi biên bản đã chốt.</div>
      </section>

      <section className={`rounded-xl border p-4 text-sm ${viPham.some((v) => v.mucDo === 'LOI') ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <b>Kiểm tra biên bản:</b> {tk ? `triệu tập ${tk.trieuTap}, có mặt ${tk.coMat}, vắng ${tk.vangCoLyDo + tk.vangKhongLyDo}${tk.vanBan ? `, ý kiến bằng văn bản ${tk.vanBan}` : ''}.` : ''}
        {viPham.length === 0 ? <span className="text-emerald-800"> Đủ thành phần, đủ nội dung.</span> : (
          <ul className="list-disc pl-5 mt-1">{viPham.map((v, i) => <li key={i} className={v.mucDo === 'LOI' ? 'text-red-700' : 'text-amber-800'}>{v.mucDo === 'LOI' ? 'Lỗi' : 'Lưu ý'}: {v.thongDiep}</li>)}</ul>
        )}
      </section>

      <form action={luuBienBanAction} className="rounded-xl border bg-white p-5 space-y-4">
        {hidDv}<input type="hidden" name="phienBan" value={bb?.phienBan ?? ''} />
        <h2 className="font-bold">I. Thời gian, địa điểm</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <label>Ngày họp <input type="date" name="ngayHop" defaultValue={bb?.ngayHop ?? ''} disabled={!sua} className={`${O} ml-1`} /></label>
          <label>Bắt đầu <input type="time" name="gioBatDau" defaultValue={bb?.gioBatDau ?? ''} disabled={!sua} className={`${O} ml-1`} /></label>
          <label>Kết thúc <input type="time" name="gioKetThuc" defaultValue={bb?.gioKetThuc ?? ''} disabled={!sua} className={`${O} ml-1`} /></label>
          <label>Địa điểm <input name="diaDiem" defaultValue={bb?.diaDiem ?? ''} disabled={!sua} className={`${O} ml-1 w-72`} /></label>
        </div>
        <h2 className="font-bold">II. Thành phần</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {(['chuTriId', 'thuKyId'] as const).map((k) => (
            <label key={k}>{k === 'chuTriId' ? 'Chủ trì' : 'Thư ký'}{' '}
              <select name={k} defaultValue={bb?.[k] ?? ''} disabled={!sua} className={`${O} ml-1`}>
                <option value="">—</option>{ds.map((d) => <option key={d.canBoId} value={d.canBoId}>{d.hoTen}</option>)}
              </select></label>
          ))}
          {coLanhDao && <label>Đại diện cấp ủy đảng * <input name="daiDienCapUy" defaultValue={bb?.daiDienCapUy ?? ''} disabled={!sua} placeholder="Họ tên, chức vụ đảng" className={`${O} ml-1 w-72`} /></label>}
          {tp.loai === 'LANH_DAO_DON_VI' && <label>Đại diện tổ chức chính trị - xã hội * <input name="daiDienDoanThe" defaultValue={bb?.daiDienDoanThe ?? ''} disabled={!sua} placeholder="Công đoàn, Đoàn thanh niên…" className={`${O} ml-1 w-72`} /></label>}
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-600"><tr><th className="text-left py-1 w-8">TT</th><th className="text-left">Họ và tên</th><th className="text-left">Chức vụ</th><th className="text-left">Tham dự</th><th className="text-left">Lý do / ghi chú</th></tr></thead>
          <tbody>{ds.map((d, i) => {
            const x = theoId.get(d.canBoId)
            const choVanBan = coLanhDao && d.vaiTro === 'TRUONG_DON_VI'
            return (
              <tr key={d.canBoId} className="border-t">
                <td className="py-1">{i + 1}</td>
                <td>{d.hoTen}{d.moi && <span className="ml-1 text-xs text-amber-700">(mới bổ sung — lưu lại)</span>}{d.daRoi && <span className="ml-1 text-xs text-slate-500">(đã chuyển khỏi đơn vị)</span>}</td>
                <td className="text-xs text-slate-600">{d.chucVu}</td>
                <td><select name={`td_${d.canBoId}`} defaultValue={x?.thamDu ?? ''} required disabled={!sua} className="border rounded h-8 px-1 text-xs">
                  <option value="" disabled>— chọn —</option>{(Object.keys(THAM_DU_LABEL) as ThamDu[]).filter((t) => t !== 'Y_KIEN_VAN_BAN' || choVanBan).map((t) => <option key={t} value={t}>{THAM_DU_LABEL[t]}</option>)}
                </select></td>
                <td><input name={`ly_${d.canBoId}`} defaultValue={x?.lyDo ?? ''} disabled={!sua} className="border rounded h-8 px-1 text-xs w-full" /></td>
              </tr>
            )
          })}</tbody>
        </table>
        <label className="block text-sm">Khách mời (nếu có) <input name="khachMoi" defaultValue={bb?.khachMoi ?? ''} disabled={!sua} className={`${O} w-full mt-1`} /></label>
        <h2 className="font-bold">III. Nội dung cuộc họp</h2>
        <label className="block text-sm">Diễn biến cuộc họp (ghi đúng thực tế: nội dung quán triệt, việc từng người trình bày báo cáo tự đánh giá, các ý kiến chung)
          <textarea name="noiDung" defaultValue={bb?.noiDung ?? ''} disabled={!sua} rows={4} className="w-full border rounded-lg p-2 text-sm mt-1" /></label>
        <div className="text-sm">
          <div className="font-medium mb-1">Ý kiến nhận xét từng người (ghi ở hồ sơ đánh giá năm của từng người, mục &quot;Họp đánh giá của tập thể phòng&quot;):</div>
          {nguoi.length === 0 ? <p className="text-slate-500">Chưa có hồ sơ đánh giá năm {nam} nào thuộc đơn vị này.</p> : (
            <table className="w-full text-xs"><tbody>{nguoi.map((n) => (
              <tr key={n.canBoId} className="border-t">
                <td className="py-1"><Link className="text-indigo-700 hover:underline" href={`/dashboard/van-phong-so/ho-so/${n.canBoId}/danh-gia-nam?nam=${nam}&loai=CBCCVC`}>{n.hoTen}</Link></td>
                <td>{n.tongDiem ?? '—'} điểm</td>
                <td>{n.hop?.yKien?.trim() ? 'Đã ghi ý kiến tập thể' : <span className="text-amber-700">Chưa ghi ý kiến tập thể</span>}</td>
                <td>{n.hop?.mucTapTheDeXuat ? `Tập thể đề xuất: ${MUC_XEP_LOAI_LABEL[n.hop.mucTapTheDeXuat]}` : ''}</td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
        <h2 className="font-bold">IV. Thông qua biên bản</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <label>Số người tán thành <input name="tanThanh" defaultValue={bb?.thongQua?.tanThanh ?? ''} disabled={!sua} className={`${O} ml-1 w-20`} /></label>
          <label>Không tán thành <input name="khongTanThanh" defaultValue={bb?.thongQua?.khongTanThanh ?? ''} disabled={!sua} className={`${O} ml-1 w-20`} /></label>
          <label>Ghi chú kết thúc <input name="ketThuc" defaultValue={bb?.ketThuc ?? ''} disabled={!sua} className={`${O} ml-1 w-80`} /></label>
        </div>
        {sua ? <button className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm">Lưu biên bản</button>
          : <p className="text-xs text-slate-400">{khoa ? 'Biên bản đã chốt: chỉ xem. Muốn sửa thì mở lại (kèm lý do).' : 'Chỉ xem. Trưởng phòng của đơn vị hoặc Văn phòng Sở lập biên bản.'}</p>}
      </form>

      {q.soan && bb && (
        <section className="rounded-xl border bg-white p-5 space-y-2">
          <h2 className="font-bold">Chốt biên bản</h2>
          {!bb.chot ? (
            <form action={chotBienBanAction} className="space-y-1">{hidDv}<input type="hidden" name="phienBan" value={bb.phienBan ?? ''} />
              <p className="text-xs text-slate-600">Chốt khi biên bản đã được đọc lại và thông qua tại cuộc họp. Khi chốt, hệ thống lưu lại ý kiến của tập thể về từng người như hiện tại; sau đó không sửa được biên bản và ý kiến từng người.</p>
              <button className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm">Chốt biên bản</button></form>
          ) : (
            <form action={moLaiBienBanAction} className="flex gap-2 items-center">{hidDv}
              <input name="lyDo" required placeholder="Lý do mở lại (vd: họp bổ sung)" className={`${O} w-80`} />
              <button className="px-3 py-1.5 rounded-lg border text-sm">Mở lại biên bản</button>
              <span className="text-xs text-slate-500">Chỉ mở lại được khi chưa có hồ sơ nào của đơn vị đã trình/đã duyệt.</span></form>
          )}
        </section>
      )}
    </div>
  )
}
