import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getSoDonViOptions } from '@/lib/office-scope'
import { chuanNam, kiemTraBang, tongHopTheoPhong, duocXemTongHopPhong, hoSoCuaToi } from '@/lib/danh-gia-nam/may-chu'
import { duocXemTongHopSo } from '@/lib/danh-gia-nam/may-chu-bieu-mau'
import { TRANG_THAI_DANH_GIA, TRANG_THAI_DANH_GIA_LABEL } from '@/lib/danh-gia-nam/trang-thai'
import { MUC_XEP_LOAI_LABEL } from '@/lib/office-labels'

export const dynamic = 'force-dynamic'

// Dashboard "Tổng hợp đánh giá cuối năm" theo phòng. Chỉ lãnh đạo Sở, Văn phòng, người có quyền quản lý đánh giá
// hoặc lãnh đạo CHÍNH phòng đó mới xem. Không có dữ liệu Đảng. Không suy xếp loại tập thể từ cá nhân.
export default async function TongHopDanhGiaPhong({ searchParams }: { searchParams: Promise<{ phong?: string; nam?: string }> }) {
  const sp = await searchParams
  const user = await requireAuth()
  const nam = chuanNam(sp.nam) ?? 2026
  // Phòng mặc định theo HỒ SƠ CÁN BỘ của người xem (tài khoản có thể lệch hồ sơ)
  const phongId = sp.phong || (await hoSoCuaToi(user))?.toChucId || user.toChucId || ''
  if (!phongId || !(await duocXemTongHopPhong(user, phongId))) redirect('/forbidden')
  if (!(await kiemTraBang())) return <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">Chưa áp migration 058; chức năng chưa sẵn sàng.</div>
  const d = await tongHopTheoPhong(phongId, nam)
  if (!d) redirect('/forbidden')
  const donVi = await getSoDonViOptions()
  const xemToanSo = duocXemTongHopSo(user)
  const t = d.tong

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-bold text-slate-900">Tổng hợp đánh giá cuối năm {nam} — {d.tenPhong}</h1>
      <form className="flex flex-wrap gap-2 items-center text-sm">
        {/* Trưởng/Phó phòng chỉ xem phòng mình: không liệt kê đơn vị khác (chọn vào sẽ bị từ chối) */}
        <select name="phong" defaultValue={phongId} className="border rounded-lg h-9 px-2">
          {donVi.filter((o) => xemToanSo || o.id === phongId).map((o) => <option key={o.id} value={o.id}>{o.ten}</option>)}
        </select>
        <input name="nam" type="number" defaultValue={nam} className="border rounded-lg h-9 px-2 w-24" />
        <button className="px-3 h-9 rounded-lg border">Xem</button>
      </form>

      <a href={`/api/office/danh-gia-nam/xuat?phong=${phongId}&nam=${nam}&mau=01`} className="inline-block text-sm px-3 py-1.5 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Xuất Mẫu 01 (Word)</a>
      <a href={`/dashboard/van-phong-so/danh-gia/tong-hop/mau-01?phong=${phongId}&nam=${nam}`} className="inline-block ml-2 text-sm px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100">Nhập Mẫu 01 của phòng</a>
      <a href={`/dashboard/van-phong-so/danh-gia/bien-ban?phong=${phongId}&nam=${nam}`} className="inline-block ml-2 text-sm px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100">Biên bản họp đánh giá</a>
      {xemToanSo && <a href={`/dashboard/van-phong-so/danh-gia/tong-hop-so?nam=${nam}`} className="inline-block ml-2 text-sm px-3 py-1.5 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Mẫu 05, 06, 07 toàn Sở</a>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Nhân sự thuộc diện đánh giá', t.tongNhanSu], ['Chưa lập hồ sơ', t.chuaLapHoSo], ['Hồ sơ đã hoàn thành (đã phê duyệt)', t.hoSoHoanThanh], ['Hồ sơ còn thiếu', t.hoSoConThieu],
          ['Hồ sơ chờ nhận xét', t.choNhanXet], ['Hồ sơ chờ phê duyệt', t.choPheDuyet], ['Nhiệm vụ trong năm', t.nhiemVu.tong], ['Nhiệm vụ đã hoàn thành', t.nhiemVu.hoanThanh],
        ].map(([ten, v]) => (
          <div key={String(ten)} className="rounded-xl border bg-white p-4"><div className="text-2xl font-bold text-slate-900">{v}</div><div className="text-xs text-slate-500">{ten}</div></div>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">Đào tạo, bồi dưỡng năm {nam}</h2>
        <p className="text-sm text-slate-700">{t.daoTao.soKhoa} khoá: hoàn thành {t.daoTao.hoanThanh} ({t.daoTao.tongGioHoanThanh} giờ) · đang học {t.daoTao.dangHoc} (không tính hoàn thành) · chưa hoàn thành {t.daoTao.chuaHoanThanh} · đã cấp chứng chỉ {t.daoTao.daCapChungChi} · hoàn thành chưa có chứng nhận {t.daoTao.hoanThanhChuaChungNhan} · đã ứng dụng {t.daoTao.daUngDung}.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">Mức xếp loại cá nhân đã được phê duyệt</h2>
        <p className="text-sm text-slate-700">{Object.entries(t.mucDaPheDuyet).map(([m, n]) => `${MUC_XEP_LOAI_LABEL[m]}: ${n}`).join(' · ')}</p>
        <p className="text-xs text-slate-500">Hồ sơ chưa phê duyệt không được tính vào bảng này. Mức xếp loại tập thể do tập thể tự đánh giá (Mẫu 01), không suy từ xếp loại cá nhân.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">Dự thảo nhận xét tập thể (từ kết quả công việc thực tế)</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">{d.duThao.map((l, i) => <li key={i}>{l}</li>)}</ul>
        <p className="text-xs text-slate-500">Bản nháp để người có thẩm quyền sửa khi lập Mẫu 01; chưa phải kết luận.</p>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-bold text-slate-900 mb-2">Từng cán bộ</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 bg-slate-50"><tr><th className="px-3 py-2">Họ tên</th><th className="px-3 py-2">Chức vụ</th><th className="px-3 py-2">Bước</th><th className="px-3 py-2">Điểm</th><th className="px-3 py-2">Đề xuất</th><th className="px-3 py-2">Phê duyệt</th><th className="px-3 py-2">Khoá học</th></tr></thead>
            <tbody className="divide-y">
              {d.nhanSu.map((n) => (
                <tr key={n.canBoId}>
                  <td className="px-3 py-2"><Link className="text-indigo-700 hover:underline" href={`/dashboard/van-phong-so/ho-so/${n.canBoId}/danh-gia-nam?nam=${nam}`}>{n.hoTen}</Link></td>
                  <td className="px-3 py-2 text-slate-600">{n.chucVu ?? '—'}</td>
                  <td className="px-3 py-2">{n.trangThai ? TRANG_THAI_DANH_GIA_LABEL[n.trangThai] : <span className="text-slate-400">chưa lập</span>}</td>
                  <td className="px-3 py-2">{n.tongDiem ?? '—'}</td>
                  <td className="px-3 py-2">{n.mucDeXuat ? MUC_XEP_LOAI_LABEL[n.mucDeXuat] : '—'}</td>
                  <td className="px-3 py-2">{n.mucPheDuyet ? MUC_XEP_LOAI_LABEL[n.mucPheDuyet] : '—'}</td>
                  <td className="px-3 py-2">{n.soKhoa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">Các bước: {TRANG_THAI_DANH_GIA.map((x) => TRANG_THAI_DANH_GIA_LABEL[x]).join(' → ')}.</p>
      </section>
    </div>
  )
}
