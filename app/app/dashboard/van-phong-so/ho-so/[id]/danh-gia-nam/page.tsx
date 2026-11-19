import Link from 'next/link'
import { requireAuth, canAccessOffice } from '@/lib/auth'
import {
  chuanNam, kiemTraBang, layCanBo, layHoSo, moHoSo, nguCanhQuyen, layDuKien, chayKiemTra,
} from '@/lib/danh-gia-nam/may-chu'
import { xacDinhVaiTro, duocSuaPhan, duocXemHoSo, type LoaiHoSo } from '@/lib/danh-gia-nam/quyen'
import { TRANG_THAI_DANH_GIA, TRANG_THAI_DANH_GIA_LABEL } from '@/lib/danh-gia-nam/trang-thai'
import { TIEU_CHI_CHUNG, mucToiDaTheoDiem } from '@/lib/danh-gia-nam/tieu-chi'
import { MUC_NHAN_XET, laDoanThieuDuLieu } from '@/lib/danh-gia-nam/nhan-xet'
import { timMau, chonMauCaNhan } from '@/lib/danh-gia-nam/mau-bieu'
import { MUC_XEP_LOAI_OPTIONS, MUC_XEP_LOAI_LABEL } from '@/lib/office-labels'
import {
  taoHoSoAction, luuAction, suaDoanAction, soanTuDongAction, chuyenBuocAction, traVeAction,
} from '@/app/actions/danh-gia-nam'
import { luuHopTapTheAction } from '@/app/actions/bieu-mau'
import { kiemTraBienBanPhong } from '@/lib/danh-gia-nam/bien-ban-db'
import { thongKeThamDu } from '@/lib/danh-gia-nam/bien-ban-hop'

export const dynamic = 'force-dynamic'

const fmt = (d: Date | null | undefined) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')
const nhanMuc = (m: string) => MUC_NHAN_XET.find((x) => x[0] === m)?.[1] ?? m

export default async function DanhGiaNamPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ nam?: string; loai?: string; tb?: string; loi?: string }> }) {
  const { id } = await params
  const sp = await searchParams
  const user = await requireAuth()
  const nam = chuanNam(sp.nam) ?? 2026
  const loai: LoaiHoSo = sp.loai === 'DANG_VIEN' ? 'DANG_VIEN' : 'CBCCVC'

  // Trang mở cho mọi cán bộ (middleware không chặn theo phòng) → kiểm quyền TRƯỚC khi hiện bất kỳ thông tin nào
  // của cán bộ; không có cán bộ / không có quyền / hồ sơ không thuộc quyền trả cùng một thông báo.
  const tuChoi = (
    <div className="space-y-3 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-900">Đánh giá cuối năm {nam}</h1>
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Bạn không có quyền xem hồ sơ này.</div>
      <Link href="/dashboard" className="text-sm text-indigo-700 hover:underline">← Về trang tổng quan</Link>
    </div>
  )
  const cb = await layCanBo(id)
  if (!cb) return tuChoi
  const co = await kiemTraBang()
  const ctxHienTai = await nguCanhQuyen(user, cb)
  // (khung chỉ được dựng SAU khi đã quyết quyền ở từng nhánh dưới)
  const khung = (noiDung: React.ReactNode) => (
    <div className="space-y-5 max-w-5xl">
      <div className="text-sm text-slate-500">
        {canAccessOffice(user)
          ? <Link href={`/dashboard/van-phong-so/ho-so/${id}`} className="hover:underline">Hồ sơ cán bộ</Link>
          : <Link href="/dashboard" className="hover:underline">Tổng quan</Link>} › Đánh giá cuối năm {nam}
      </div>
      <h1 className="text-xl font-bold text-slate-900">Đánh giá cuối năm {nam} — {cb.hoTen}</h1>
      <p className="text-sm text-slate-500">{cb.chucVu ?? '—'} · {cb.tenPhong ?? '—'}{cb.viTri ? ` · Vị trí việc làm: ${cb.viTri}` : ''}</p>
      {noiDung}
    </div>
  )

  if (!co && !duocXemHoSo('CBCCVC', ctxHienTai) && !duocXemHoSo('DANG_VIEN', ctxHienTai)) return tuChoi
  if (!co) return khung(<div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">Chưa áp migration 058 (bảng hồ sơ đánh giá năm). Chức năng chưa sẵn sàng.</div>)

  // Hồ sơ đã lập: quyền theo PHÒNG LƯU TRÊN HỒ SƠ (moHoSo, đồng thời ghi nhật ký xem/từ chối hồ sơ Đảng) và
  // DỪNG nếu bị từ chối. Chưa lập: theo phòng hiện tại. Không nêu hồ sơ có tồn tại hay không khi không có quyền.
  const h = await layHoSo(id, nam, loai)
  let ctx = ctxHienTai
  if (h) {
    const m = await moHoSo(user, h.id)
    if (!m || m.tuChoi) return tuChoi
    ctx = m.ctx
  } else if (!duocXemHoSo(loai, ctx)) {
    return tuChoi
  }
  const vaiTro = xacDinhVaiTro(loai, ctx)
  const tab = (
    <div className="flex gap-2 text-sm">
      {(['CBCCVC', 'DANG_VIEN'] as const).filter((l) => duocXemHoSo(l, ctx)).map((l) => (
        <Link key={l} href={`?nam=${nam}&loai=${l}`} className={`px-3 py-1.5 rounded-lg border ${l === loai ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700'}`}>
          {l === 'CBCCVC' ? 'Đánh giá công chức, viên chức' : 'Kiểm điểm đảng viên'}
        </Link>
      ))}
    </div>
  )
  const thongBao = (<>
    {sp.tb && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{sp.tb}</div>}
    {sp.loi && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.loi}</div>}
  </>)
  const hid = (reviewId: string) => (<>
    <input type="hidden" name="reviewId" value={reviewId} /><input type="hidden" name="canBoId" value={id} />
    <input type="hidden" name="nam" value={nam} /><input type="hidden" name="loai" value={loai} />
  </>)

  if (!h) {
    const duocLap = vaiTro.includes('THU_KY_TONG_HOP') || vaiTro.includes('CHINH_CHU')
    const mauDuKien = loai === 'CBCCVC' ? chonMauCaNhan({ laNguoiDungDau: cb.capQuanLy === 1, laLanhDaoQuanLy: cb.laLanhDao }) : null
    return khung(<>{tab}{thongBao}
      <div className="rounded-xl border bg-white p-5 space-y-3">
        <p className="text-sm text-slate-600">Chưa có hồ sơ {loai === 'CBCCVC' ? 'đánh giá' : 'kiểm điểm đảng viên'} năm {nam}.</p>
        {mauDuKien && (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">Biểu mẫu áp dụng cho {cb.hoTen}: <b>Mẫu {mauDuKien}</b> — {timMau(mauDuKien, 'SNV_CV6862')?.ten}. Phiếu xếp loại: Mẫu 03. Theo dõi KPI: Mẫu 04.</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[mauDuKien, '03', '04'].map((m) => (
                <a key={m} href={`/api/office/danh-gia-nam/xuat?canBoId=${id}&nam=${nam}&mau=${m}`} className="px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Tải Mẫu {m} bản trống ({m === '04' ? 'Excel' : 'Word'})</a>
              ))}
            </div>
            <p className="text-xs text-slate-500">Bản trống chỉ có thông tin hành chính; lập hồ sơ để điền tự đánh giá, điểm và nhận xét.</p>
          </div>
        )}
        {duocLap ? (
          <form action={taoHoSoAction}>
            <input type="hidden" name="canBoId" value={id} /><input type="hidden" name="nam" value={nam} /><input type="hidden" name="loai" value={loai} />
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Lập hồ sơ</button>
          </form>
        ) : <p className="text-xs text-slate-500">Bạn không có quyền lập hồ sơ này.</p>}
      </div></>)
  }

  // Có quyền xem (moHoSo ở trên đã ghi nhật ký xem hồ sơ Đảng) → nạp dữ liệu
  const buocIdx = TRANG_THAI_DANH_GIA.indexOf(h.trangThai)
  const sua = (p: 'tuDanhGia' | 'nhanXet' | 'diem' | 'mucDeXuat') => duocSuaPhan(p, h.trangThai, vaiTro)
  const mau = h.mauApDung ? timMau(h.mauApDung, 'SNV_CV6862') : null
  const du = loai === 'CBCCVC' ? await layDuKien(cb, nam) : null
  const bbPhong = loai === 'CBCCVC' ? await kiemTraBienBanPhong(h.toChucId, nam) : null
  const vanDe = vaiTro.some((v) => v !== 'CHINH_CHU')
    ? (await chayKiemTra(h, cb)).filter((v) => loai === 'CBCCVC' || v.ma === 'TRUY_CAP_NGOAI_THAM_QUYEN')
    : []
  const toiDa = h.tongDiem !== null ? mucToiDaTheoDiem(h.tongDiem) : null
  const dangDuyet = h.trangThai === 'TRINH_PHE_DUYET' && vaiTro.includes('CAP_PHE_DUYET')

  return khung(<>
    {tab}{thongBao}

    {/* Tiến trình 8 bước */}
    <ol className="flex flex-wrap gap-1.5 text-xs">
      {TRANG_THAI_DANH_GIA.map((t, i) => (
        <li key={t} className={`px-2.5 py-1 rounded-full border ${i === buocIdx ? 'bg-indigo-600 text-white border-indigo-600' : i < buocIdx ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
          {i + 1}. {TRANG_THAI_DANH_GIA_LABEL[t]}
        </li>
      ))}
    </ol>
    <div className="text-xs text-slate-500">
      {mau ? <>Biểu mẫu áp dụng: <b>Mẫu {mau.ma}</b> — {mau.ten}. </> : null}
      Vai trò của bạn: {vaiTro.length ? vaiTro.join(', ') : 'chỉ xem'}.
    </div>

    {loai === 'CBCCVC' && (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500 self-center">Nhập theo mẫu:</span>
        {([h.mauApDung, '03', '04'] as (string | null)[]).filter(Boolean).map((m) => (
          <Link key={'n' + m} href={`/dashboard/van-phong-so/ho-so/${id}/danh-gia-nam/mau/${m}?nam=${nam}`} className="px-2.5 py-1 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100">Mẫu {m}</Link>
        ))}
        <span className="text-slate-500 self-center ml-2">Xuất biểu mẫu:</span>
        {([h.mauApDung, '03', '04'] as (string | null)[]).filter(Boolean).map((m) => (
          <a key={m} href={`/api/office/danh-gia-nam/xuat?reviewId=${h.id}&mau=${m}`} className="px-2.5 py-1 rounded-lg border bg-white text-indigo-700 hover:bg-indigo-50">Mẫu {m} ({m === '04' ? 'Excel' : 'Word'})</a>
        ))}
      </div>
    )}

    {/* Dữ liệu hệ thống (nhiệm vụ, đào tạo) */}
    {du && (
      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">Dữ liệu trong hệ thống năm {nam}</h2>
        <p className="text-sm text-slate-600">Nhiệm vụ: {du.congViec.length} (hoàn thành {du.congViec.filter((c) => c.trangThai === 'HOAN_THANH').length}, thiếu minh chứng {du.congViec.filter((c) => c.trangThai === 'HOAN_THANH' && c.soMinhChung === 0).length}). Đào tạo: {du.daoTao.soKhoa} khoá — hoàn thành {du.daoTao.hoanThanh} ({du.daoTao.tongGioHoanThanh} giờ), đang học {du.daoTao.dangHoc} (chưa tính hoàn thành), chưa hoàn thành {du.daoTao.chuaHoanThanh}, đã cấp chứng chỉ {du.daoTao.daCapChungChi}, đã ứng dụng {du.daoTao.daUngDung}. Thành tích ghi nhận: {du.thanhTich.length}.</p>
        {du.daoTaoChuaGan && <p className="text-xs text-amber-700">{du.daoTaoChuaGan}</p>}
        {du.congViec.length === 0 && <p className="text-xs text-amber-700">Chưa có nhiệm vụ nào gắn với tài khoản của cán bộ này trong năm {nam}.</p>}
      </section>
    )}

    {/* Tự đánh giá */}
    <section className="rounded-xl border bg-white p-5 space-y-2">
      <h2 className="font-bold text-slate-900">Tự đánh giá của cá nhân</h2>
      {sua('tuDanhGia') ? (
        <form action={luuAction} className="space-y-2">{hid(h.id)}<input type="hidden" name="phan" value="tuDanhGia" />
          <textarea name="noiDung" defaultValue={h.tuDanhGia.noiDung ?? ''} rows={6} className="w-full border rounded-lg p-2 text-sm" />
          <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm">Lưu tự đánh giá</button>
        </form>
      ) : <p className="text-sm whitespace-pre-wrap text-slate-700">{h.tuDanhGia.noiDung || <span className="text-slate-400">Chưa có.</span>}</p>}
    </section>

    {/* Nhận xét 9 phần */}
    {loai === 'CBCCVC' && (
      <section className="rounded-xl border bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900">Nhận xét (9 phần, mỗi đoạn có nguồn)</h2>
          {sua('nhanXet') && (
            <form action={soanTuDongAction} className="flex gap-2 items-center">{hid(h.id)}
              <select name="doDai" defaultValue="TIEU_CHUAN" className="border rounded-lg h-9 px-2 text-sm">
                <option value="NGAN_GON">Ngắn gọn</option><option value="TIEU_CHUAN">Tiêu chuẩn</option><option value="CHI_TIET">Chi tiết</option>
              </select>
              <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Soạn từ dữ liệu hệ thống</button>
            </form>
          )}
        </div>
        <p className="text-xs text-slate-500">Chỉ soạn từ dữ liệu có trong hệ thống; phần thiếu dữ liệu để trống và ghi rõ. Đoạn đã sửa tay không bị ghi đè khi soạn lại. Không gửi dữ liệu ra dịch vụ AI bên ngoài.</p>
        {h.nhanXet.length === 0 && <p className="text-sm text-slate-400">Chưa có nhận xét.</p>}
        {h.nhanXet.map((d) => (
          <div key={d.muc} className={`rounded-lg border p-3 space-y-1.5 ${laDoanThieuDuLieu(d) ? 'border-amber-300 bg-amber-50/50' : ''}`}>
            <div className="text-sm font-semibold text-slate-800">{nhanMuc(d.muc)} {d.tuDong && !d.nguoiSua ? <span className="text-xs font-normal text-slate-400">(tự soạn)</span> : null}{d.nguoiSua ? <span className="text-xs font-normal text-emerald-600"> (đã sửa tay)</span> : null}</div>
            {sua('nhanXet') ? (
              <form action={suaDoanAction} className="space-y-1.5">{hid(h.id)}<input type="hidden" name="muc" value={d.muc} />
                <textarea name="noiDung" defaultValue={d.noiDung} rows={3} className="w-full border rounded-lg p-2 text-sm" />
                <input name="nguon" defaultValue={d.nguon.join(', ')} placeholder="Nguồn: mã nhiệm vụ, khoá học, minh chứng…" className="w-full border rounded-lg h-8 px-2 text-xs" />
                <button className="px-3 py-1 rounded-lg border text-xs">Lưu đoạn này</button>
              </form>
            ) : <p className="text-sm whitespace-pre-wrap text-slate-700">{d.noiDung}</p>}
            <p className="text-xs text-slate-400">Nguồn: {d.nguon.length ? d.nguon.join(', ') : 'chưa có'}</p>
          </div>
        ))}
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800">Nhận xét của người có thẩm quyền</div>
          {sua('nhanXet') ? (
            <form action={luuAction} className="space-y-1.5">{hid(h.id)}<input type="hidden" name="phan" value="nhanXetLanhDao" />
              <textarea name="noiDung" defaultValue={h.nhanXetLanhDao ?? ''} rows={3} className="w-full border rounded-lg p-2 text-sm" />
              <button className="px-3 py-1 rounded-lg border text-xs">Lưu nhận xét</button>
            </form>
          ) : <p className="text-sm whitespace-pre-wrap text-slate-700">{h.nhanXetLanhDao || <span className="text-slate-400">Chưa có.</span>}</p>}
        </div>
      </section>
    )}

    {/* Điểm */}
    {loai === 'CBCCVC' && (
      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">Điểm theo bộ tiêu chí (30 điểm chung + KPI × 70/100)</h2>
        {sua('diem') ? (
          <form action={luuAction} className="space-y-2">{hid(h.id)}<input type="hidden" name="phan" value="diem" />
            <div className="grid sm:grid-cols-2 gap-2">
              {TIEU_CHI_CHUNG.map((c) => (
                <label key={c.ma} className="flex items-start gap-2 text-xs text-slate-600">
                  <input name={`d_${c.ma}`} defaultValue={h.diemChung[c.ma] ?? ''} className="w-16 h-8 border rounded px-1 text-sm shrink-0" />
                  <span><b>{c.ma}</b> (tối đa {c.toiDa}) {c.ten}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-center text-sm">
              <label>Tổng điểm KPI (Mẫu 04, 0–100) <input name="diemKpiTong" defaultValue={h.diemKpiTong ?? ''} className="w-20 h-8 border rounded px-1 ml-1" /></label>
              {['I', 'II', 'III', 'IV'].map((q) => <label key={q} className="text-xs">Quý {q} <input name={`q_${q}`} defaultValue={h.diemQuy[q] ?? ''} className="w-16 h-8 border rounded px-1" /></label>)}
            </div>
            <div className="flex flex-wrap gap-3 items-center text-xs text-slate-600">
              <label className="flex items-center gap-1"><input type="checkbox" name="top20" defaultChecked={h.diemQuy.top20 === 1} /> Thuộc nhóm 20% cao nhất (người có thẩm quyền xác nhận)</label>
              <label>Số quý xuất sắc <input name="qxs" defaultValue={h.diemQuy.soQuyXuatSac ?? 0} className="w-12 h-8 border rounded px-1" /></label>
              <label>Số quý không hoàn thành <input name="qkht" defaultValue={h.diemQuy.soQuyKHT ?? 0} className="w-12 h-8 border rounded px-1" /></label>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm">Lưu điểm</button>
          </form>
        ) : <p className="text-sm text-slate-700">Tổng điểm {h.tongDiem ?? '—'} (KPI {h.diemKpiTong ?? '—'}).</p>}
        {toiDa && <p className="text-xs text-slate-500">Theo ngưỡng điểm (dự thảo công văn Sở, chưa có số), mức cao nhất có thể đề xuất: {MUC_XEP_LOAI_LABEL[toiDa.muc]}. Đây chỉ là gợi ý; không tự quyết xếp loại.</p>}
      </section>
    )}

    {/* Hồ sơ Đảng: ý kiến của chi ủy/cấp có thẩm quyền (cần để chuyển bước) */}
    {loai === 'DANG_VIEN' && (
      <section className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold text-slate-900">Nhận xét của chi ủy / cấp có thẩm quyền</h2>
        {sua('nhanXet') ? (
          <form action={luuAction} className="space-y-1.5">{hid(h.id)}<input type="hidden" name="phan" value="nhanXetLanhDao" />
            <textarea name="noiDung" defaultValue={h.nhanXetLanhDao ?? ''} rows={4} className="w-full border rounded-lg p-2 text-sm" />
            <button className="px-3 py-1 rounded-lg border text-xs">Lưu nhận xét</button>
          </form>
        ) : <p className="text-sm whitespace-pre-wrap text-slate-700">{h.nhanXetLanhDao || <span className="text-slate-400">Chưa có.</span>}</p>}
      </section>
    )}

    {/* Họp đánh giá của tập thể phòng — cùng điểm vẫn phải có nhận xét của tập thể trước khi trình phê duyệt */}
    {loai === 'CBCCVC' && (() => {
      const hop = h.bieuMau.hopTapThe ?? {}
      const bb = bbPhong?.bb ?? null
      const duocGhi = sua('diem') && (h.trangThai === 'TONG_HOP' || h.trangThai === 'HOP_DANH_GIA') && !bb?.chot
      const loiBb = (bbPhong?.viPham ?? []).filter((v) => v.mucDo === 'LOI')
      const tk = bb ? thongKeThamDu(bb) : null
      return (
        <form action={luuHopTapTheAction} className="rounded-xl border border-indigo-200 bg-white p-5 space-y-2">{hid(h.id)}
          <h2 className="font-bold text-slate-900">Họp đánh giá của tập thể phòng</h2>
          <p className="text-xs text-slate-500">Điểm chỉ là ngưỡng tối đa có thể đề xuất; hai người cùng điểm vẫn có thể có mức khác nhau. Mức đề xuất phải căn cứ nhận xét của tập thể phòng tại cuộc họp. Chưa có nhận xét tập thể thì không trình phê duyệt được. Ghi ở bước Tổng hợp hoặc Họp đánh giá.</p>
          <div className={`rounded-lg border px-3 py-2 text-sm ${loiBb.length ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <b>Biên bản họp của phòng:</b>{' '}
            {!bb ? 'chưa lập.' : <>họp ngày {bb.ngayHop ?? '…'}, có mặt {tk!.coMat}/{tk!.trieuTap} người{loiBb.length ? '' : ' — đủ thành phần'}; {bb.chot ? 'ĐÃ CHỐT (ý kiến bên dưới đã khoá theo biên bản)' : 'chưa chốt'}.</>}
            {loiBb.length > 0 && <ul className="list-disc pl-5 text-xs mt-1">{loiBb.slice(0, 4).map((v, i) => <li key={i}>{v.thongDiep}</li>)}</ul>}
            {h.toChucId && <Link className="ml-1 underline" href={`/dashboard/van-phong-so/danh-gia/bien-ban?phong=${h.toChucId}&nam=${nam}`}>{bb ? 'Xem / sửa biên bản' : 'Lập biên bản'}</Link>}
            <span className="block text-xs mt-1">Biên bản chưa đủ thành phần (Điều 21 NĐ 335/2025; Điều 15 NĐ 233/2026) hoặc chưa chốt thì không trình phê duyệt được. Ghi ý kiến tập thể ở đây TRƯỚC khi chốt biên bản.</span>
          </div>
          {bb ? (
            <p className="text-sm text-slate-700">Ngày họp, chủ trì, số người dự họp lấy theo biên bản: {bb.ngayHop ?? '…'} · {bb.thanhVien.find((x) => x.canBoId === bb.chuTriId)?.hoTen ?? '…'} · {tk!.coMat} người có mặt.</p>
          ) : (
            <div className="flex flex-wrap gap-3 text-sm">
              <label>Ngày họp <input type="date" name="ngayHop" defaultValue={hop.ngayHop ?? ''} disabled={!duocGhi} className="h-9 border rounded-lg px-2 ml-1" /></label>
              <label>Chủ trì <input name="chuTri" defaultValue={hop.chuTri ?? ''} disabled={!duocGhi} className="h-9 border rounded-lg px-2 ml-1 w-56" /></label>
              <label>Số người dự họp <input name="soNguoiDuHop" defaultValue={hop.soNguoiDuHop ?? ''} disabled={!duocGhi} className="h-9 border rounded-lg px-2 ml-1 w-20" /></label>
            </div>
          )}
          <label className="block text-sm font-medium text-slate-800">Ý kiến nhận xét của tập thể phòng *
            <textarea name="yKien" defaultValue={hop.yKien ?? ''} disabled={!duocGhi} rows={4} className="w-full border rounded-lg p-2 text-sm font-normal mt-1" />
          </label>
          <div className="text-sm text-slate-700">Kết quả biểu quyết mức đề xuất (số phiếu, nếu có):</div>
          <div className="flex flex-wrap gap-3 text-xs">
            {MUC_XEP_LOAI_OPTIONS.map((o) => (
              <label key={o.value}>{o.label} <input name={`phieu_${o.value}`} defaultValue={hop.bieuQuyet?.[o.value] ?? ''} disabled={!duocGhi} className="w-14 h-8 border rounded px-1 ml-1" /></label>
            ))}
          </div>
          <label className="block text-sm">Mức tập thể phòng đề xuất sau họp{' '}
            <select name="mucTapTheDeXuat" defaultValue={hop.mucTapTheDeXuat ?? ''} disabled={!duocGhi} className="border rounded-lg h-9 px-2 text-sm ml-1">
              <option value="">—</option>{MUC_XEP_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          {duocGhi ? <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm">Lưu kết quả họp</button>
            : <p className="text-xs text-slate-400">{hop.yKien ? 'Đã ghi; chỉ xem.' : 'Chưa ghi.'} (Thư ký tổng hợp hoặc lãnh đạo phòng ghi ở bước Tổng hợp / Họp đánh giá.)</p>}
        </form>
      )
    })()}

    {/* Đề xuất mức */}
    <section className="rounded-xl border bg-white p-5 space-y-2">
      <h2 className="font-bold text-slate-900">Mức xếp loại</h2>
      <p className="text-sm text-slate-700">Đề xuất: <b>{h.mucDeXuat ? MUC_XEP_LOAI_LABEL[h.mucDeXuat] : '—'}</b> · Được phê duyệt: <b>{h.mucPheDuyet ? MUC_XEP_LOAI_LABEL[h.mucPheDuyet] : 'chưa phê duyệt'}</b>{h.pheDuyetAt ? ` (${fmt(h.pheDuyetAt)})` : ''}</p>
      {sua('mucDeXuat') && (
        <form action={luuAction} className="flex gap-2 items-center">{hid(h.id)}<input type="hidden" name="phan" value="mucDeXuat" />
          <select name="muc" defaultValue={h.mucDeXuat ?? ''} className="border rounded-lg h-9 px-2 text-sm">
            <option value="">— chưa đề xuất —</option>
            {MUC_XEP_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="px-3 py-1.5 rounded-lg border text-sm">Lưu đề xuất</button>
        </form>
      )}
    </section>

    {/* Kiểm tra tự động */}
    {vanDe.length > 0 && (
      <section className="rounded-xl border border-amber-300 bg-amber-50/40 p-5 space-y-1.5">
        <h2 className="font-bold text-slate-900">Kiểm tra tự động ({vanDe.filter((v) => v.mucDo === 'LOI').length} lỗi, {vanDe.filter((v) => v.mucDo === 'CANH_BAO').length} cảnh báo)</h2>
        <ul className="text-sm space-y-1">
          {vanDe.map((v, i) => (
            <li key={i} className={v.mucDo === 'LOI' ? 'text-red-700' : 'text-amber-800'}><b>{v.mucDo === 'LOI' ? 'Lỗi' : 'Cảnh báo'}</b> · {v.viTri} — {v.thongDiep}</li>
          ))}
        </ul>
      </section>
    )}

    {/* Chuyển bước */}
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-bold text-slate-900">Quy trình</h2>
      {h.trangThai !== 'LUU_HO_SO' && vaiTro.length > 0 && (
        <form action={chuyenBuocAction} className="flex flex-wrap gap-2 items-center">{hid(h.id)}
          {dangDuyet && (
            <select name="mucPheDuyet" required defaultValue="" className="border rounded-lg h-9 px-2 text-sm">
              <option value="" disabled>Mức xếp loại chính thức…</option>
              {MUC_XEP_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">{dangDuyet ? 'Phê duyệt' : 'Chuyển sang bước tiếp theo'}</button>
          <span className="text-xs text-slate-500">Hệ thống không tự chuyển bước hay tự phê duyệt.</span>
        </form>
      )}
      {vaiTro.some((v) => v !== 'CHINH_CHU') && h.trangThai !== 'DU_THAO' && h.trangThai !== 'DA_PHE_DUYET' && h.trangThai !== 'LUU_HO_SO' && (
        <form action={traVeAction} className="flex gap-2 items-center">{hid(h.id)}
          <input name="lyDo" placeholder="Lý do trả về bước trước" required className="border rounded-lg h-9 px-2 text-sm w-72" />
          <button className="px-3 py-1.5 rounded-lg border text-sm">Trả về</button>
        </form>
      )}
    </section>
  </>)
}
