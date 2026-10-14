'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, Save, Trash2, Plus, ArrowUp, ArrowDown, X, Loader2, BadgeCheck,
  CheckCircle2, XCircle, AlertCircle, MinusCircle, Clock, FileCheck2, FileDown, History,
} from 'lucide-react'
import { saveHoSo, deleteHoSo, capChungChi, type HoSoForm, type KinhNghiemForm } from '@/app/actions/cchn'
import {
  LOAI_THU_TUC, TRUONG_HOP, HINH_THUC_NOP, TRINH_DO, LINH_VUC, CAP_CONG_TRINH, NHOM_DU_AN, CAP_PHE_DUYET_QH,
  LOAI_QUY_HOACH, VAI_TRO, TAI_LIEU_KINH_NGHIEM, NGUON_BAT_DAU_KN, TRANG_THAI,
  type LinhVuc,
} from '@/lib/cchn/danh-muc'
import { danhGiaHoSo, tinhThoiHan, thanhPhanApDung as layThanhPhan, homNay, type HoSoInput } from '@/lib/cchn/danh-gia'

const BASE = '/dashboard/phong-qlhd-xd/chung-chi-nha-thau/ho-so'
const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-500'
const lbl = 'block text-xs font-medium text-slate-600 mb-1'

const dongTrong = (): KinhNghiemForm => ({
  tenCongTrinh: '', diaDiem: '', chuDauTu: '', loaiCongTrinh: '', capCongTrinh: '', nhomDuAn: '', capPheDuyetQh: '', loaiQuyHoach: '',
  vaiTro: '', phanViec: '', tuNgay: '', denNgay: '', taiLieu: '', soHieuTaiLieu: '', phuHopNoiDung: '', ghiChu: '',
})

function Khoi({ so, tieuDe, moTa, children }: { so: number; tieuDe: string; moTa?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4 md:p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">{so}</span>
        <div>
          <h2 className="font-semibold text-slate-900">{tieuDe}</h2>
          {moTa && <p className="text-xs text-slate-500 mt-0.5">{moTa}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

const ICON_KQ = {
  DAT: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
  CHUA_DAT: <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
  CAN_KIEM_TRA: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
  KHONG_AP_DUNG: <MinusCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
}

const fmt = (s: string | null) => (s ? s.split('-').reverse().join('/') : '—')
const HANH_DONG: Record<string, string> = { TAO_MOI: 'Tạo hồ sơ', DOI_TRANG_THAI: 'Đổi trạng thái', CAP_CHUNG_CHI: 'Cấp chứng chỉ', XOA: 'Xoá hồ sơ' }
const nhanTT = (v: string) => TRANG_THAI.find((x) => x.value === v)?.label ?? v

export function CchnForm({ initial }: { initial: HoSoForm }) {
  const router = useRouter()
  const [f, setF] = useState<HoSoForm>(initial)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startT] = useTransition()
  const [moCap, setMoCap] = useState(false)
  const [cap, setCap] = useState({ soChungChi: '', ngayCap: homNay(), thoiHan: '', coQuanCap: 'Sở Xây dựng tỉnh Quảng Trị' })

  const daCap = f.trangThai === 'DA_CAP'
  const set = <K extends keyof HoSoForm>(k: K, v: HoSoForm[K]) => setF((s) => ({ ...s, [k]: v }))
  const setKn = (i: number, patch: Partial<KinhNghiemForm>) =>
    setF((s) => ({ ...s, kinhNghiem: s.kinhNghiem.map((k, j) => (j === i ? { ...k, ...patch } : k)) }))
  const moveKn = (i: number, d: -1 | 1) => setF((s) => {
    const a = [...s.kinhNghiem]; const j = i + d
    if (j < 0 || j >= a.length) return s
    ;[a[i], a[j]] = [a[j], a[i]]
    return { ...s, kinhNghiem: a }
  })

  const lv = LINH_VUC.find((x) => x.value === f.linhVuc)
  const vaiTroLv = VAI_TRO.filter((v) => !f.linhVuc || v.linhVuc.includes(f.linhVuc as LinhVuc))
  const laCapLai = f.loaiThuTuc === 'CAP_LAI'

  // Đánh giá sơ bộ + thời hạn tính lại mỗi lần nhập
  const dg = useMemo(() => {
    const input: HoSoInput = {
      loaiThuTuc: f.loaiThuTuc, truongHop: f.truongHop, laCongDanVN: f.laCongDanVN,
      trinhDo: (f.trinhDo || null) as HoSoInput['trinhDo'], linhVuc: (f.linhVuc || null) as HoSoInput['linhVuc'], noiDung: f.noiDung,
      hangDeNghi: (f.hangDeNghi || null) as HoSoInput['hangDeNghi'], hanhNgheDocLap: f.hanhNgheDocLap, vanBangTrenCsdl: f.vanBangTrenCsdl,
      soCchnCu: f.soCchnCu, ngayBatDauKinhNghiem: f.ngayBatDauKn, ngayNop: f.ngayNop, thanhPhan: f.thanhPhan,
      kinhNghiem: f.kinhNghiem.map((k) => ({
        tenCongTrinh: k.tenCongTrinh, vaiTro: k.vaiTro,
        capCongTrinh: (k.capCongTrinh || null) as never, nhomDuAn: (k.nhomDuAn || null) as never, capPheDuyetQh: (k.capPheDuyetQh || null) as never,
        loaiQuyHoach: k.loaiQuyHoach, denNgay: k.denNgay, taiLieu: k.taiLieu,
        phuHopNoiDung: k.phuHopNoiDung === '' ? null : k.phuHopNoiDung === 'co',
      })),
    }
    return {
      kq: danhGiaHoSo(input),
      han: tinhThoiHan({ loaiThuTuc: f.loaiThuTuc, ngayNop: f.ngayNop, ngayNhanDu: f.ngayNhanDu, ngayHoiDong: f.ngayHoiDong, ngayThongBao: f.ngayThongBao }),
    }
  }, [f])

  const thanhPhanApDung = layThanhPhan(f)

  const luu = () => {
    setErr(null); setMsg(null)
    startT(async () => {
      const r = await saveHoSo(f)
      if (!r.ok) { setErr(r.error ?? 'Lưu thất bại.'); return }
      if (!f.id && r.id) { router.replace(`${BASE}/${r.id}`); return }
      setMsg(`Đã lưu hồ sơ ${r.maHoSo ?? ''}.`)
      router.refresh()
    })
  }
  const xoa = () => {
    if (!f.id || !confirm(`Xoá hồ sơ ${f.maHoSo}?`)) return
    startT(async () => {
      const r = await deleteHoSo(f.id!)
      if (!r.ok) { setErr(r.error ?? 'Xoá thất bại.'); return }
      router.push(BASE)
    })
  }
  const capCC = () => {
    if (!f.id) return
    setErr(null)
    startT(async () => {
      const r = await capChungChi(f.id!, cap)
      if (!r.ok) { setErr(r.error ?? 'Không cấp được.'); return }
      setMoCap(false)
      setF((s) => ({ ...s, trangThai: 'DA_CAP', soChungChi: cap.soChungChi, ngayCap: cap.ngayCap }))
      setMsg('Đã cấp chứng chỉ và ghi sổ năng lực HĐXD (kèm mã định danh).')
      router.refresh()
    })
  }

  const tt = TRANG_THAI.find((x) => x.value === f.trangThai)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <nav className="text-xs text-slate-500 mb-3 flex flex-wrap items-center gap-1.5">
        <Link href="/dashboard/phong-qlhd-xd" className="hover:text-indigo-700">Phòng QLHĐ-XD</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={BASE} className="hover:text-indigo-700">Hồ sơ cấp chứng chỉ hành nghề</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{f.maHoSo ?? 'Hồ sơ mới'}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{f.hoTen || 'Hồ sơ đề nghị cấp chứng chỉ hành nghề'}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
            {f.maHoSo && <span className="font-mono text-slate-600">{f.maHoSo}</span>}
            {tt && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tt.mau}`}>{tt.label}</span>}
            {daCap && <span className="text-emerald-700 text-xs">Số chứng chỉ {f.soChungChi} · cấp {fmt(f.ngayCap)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {f.id && !daCap && (
            <button onClick={xoa} disabled={pending} className="px-3 py-2 rounded-lg border text-sm text-rose-700 hover:bg-rose-50 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Xoá
            </button>
          )}
          {f.id && !daCap && (f.trangThai === 'DU_DIEU_KIEN' || laCapLai) && (
            <button onClick={() => setMoCap(true)} disabled={pending} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4" /> Cấp chứng chỉ
            </button>
          )}
          {!daCap && (
            <button onClick={luu} disabled={pending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 flex items-center gap-1.5">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu hồ sơ
            </button>
          )}
        </div>
      </div>

      {err && <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm px-3 py-2">{err}</div>}
      {msg && <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">{msg}</div>}
      {daCap && <div className="mb-3 rounded-lg bg-slate-50 border text-slate-600 text-sm px-3 py-2">Hồ sơ đã cấp chứng chỉ — chỉ xem. Thay đổi thông tin chứng chỉ thực hiện qua thủ tục cấp lại.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <fieldset disabled={daCap || pending} className="lg:col-span-2 space-y-4 min-w-0">
          {/* 1. Thủ tục */}
          <Khoi so={1} tieuDe="Thủ tục và tiếp nhận" moTa="NĐ 212/2026 Đ29 k1 (loại thủ tục), Đ30 k1 (hình thức nộp). Ngày nộp là mốc tính 10 năm kinh nghiệm (Đ33 k3).">
            <div className="flex flex-wrap gap-2 mb-3">
              {LOAI_THU_TUC.map((x) => (
                <button key={x.value} type="button"
                  onClick={() => setF((s) => ({ ...s, loaiThuTuc: x.value, truongHop: TRUONG_HOP[x.value][0].value }))}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${f.loaiThuTuc === x.value ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-slate-50'}`}>
                  {x.label} <span className="opacity-70 text-xs">({x.canCu})</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className={lbl}>Trường hợp{f.loaiThuTuc === 'CHUYEN_DOI' ? ' — áp dụng người nước ngoài, người Việt Nam định cư ở nước ngoài (Đ27 k2)' : ''}</label>
                <select className={inp} value={f.truongHop} onChange={(e) => set('truongHop', e.target.value)}>
                  {TRUONG_HOP[f.loaiThuTuc].map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Hình thức nộp</label>
                <select className={inp} value={f.hinhThucNop} onChange={(e) => set('hinhThucNop', e.target.value)}>
                  {HINH_THUC_NOP.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Ngày nộp hồ sơ *</label>
                <input type="date" className={inp} value={f.ngayNop} onChange={(e) => set('ngayNop', e.target.value)} />
              </div>
            </div>
          </Khoi>

          {/* 2. Người đề nghị */}
          <Khoi so={2} tieuDe="Người đề nghị cấp" moTa="Mã định danh năng lực: công dân Việt Nam dùng số định danh cá nhân (CCCD 12 số); người nước ngoài dùng hộ chiếu (Đ19).">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2"><label className={lbl}>Họ và tên *</label>
                <input className={inp} value={f.hoTen} onChange={(e) => set('hoTen', e.target.value)} /></div>
              <div><label className={lbl}>Ngày sinh</label>
                <input type="date" className={inp} value={f.ngaySinh} onChange={(e) => set('ngaySinh', e.target.value)} /></div>
              <div><label className={lbl}>Giới tính</label>
                <select className={inp} value={f.gioiTinh} onChange={(e) => set('gioiTinh', e.target.value)}>
                  <option value="">—</option><option value="NAM">Nam</option><option value="NU">Nữ</option>
                </select></div>
              <div><label className={lbl}>Quốc tịch</label>
                <select className={inp} value={f.laCongDanVN ? 'VN' : 'NN'} onChange={(e) => set('laCongDanVN', e.target.value === 'VN')}>
                  <option value="VN">Công dân Việt Nam</option><option value="NN">Người nước ngoài / người VN định cư ở nước ngoài</option>
                </select></div>
              {!f.laCongDanVN && <div><label className={lbl}>Tên quốc tịch</label>
                <input className={inp} value={f.quocTich} onChange={(e) => set('quocTich', e.target.value)} /></div>}
              <div><label className={lbl}>{f.laCongDanVN ? 'Số định danh cá nhân (12 số)' : 'Số hộ chiếu'}</label>
                <input className={inp} inputMode={f.laCongDanVN ? 'numeric' : 'text'} value={f.maDinhDanh} onChange={(e) => set('maDinhDanh', e.target.value)} /></div>
              <div><label className={lbl}>Điện thoại</label>
                <input className={inp} value={f.dienThoai} onChange={(e) => set('dienThoai', e.target.value)} /></div>
              <div><label className={lbl}>Email</label>
                <input type="email" className={inp} value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="md:col-span-2"><label className={lbl}>Địa chỉ</label>
                <input className={inp} value={f.diaChi} onChange={(e) => set('diaChi', e.target.value)} /></div>
              <div><label className={lbl}>Đơn vị công tác</label>
                <input className={inp} value={f.donViCongTac} onChange={(e) => set('donViCongTac', e.target.value)} /></div>
            </div>
          </Khoi>

          {/* 3. Trình độ */}
          <Khoi so={3} tieuDe="Trình độ chuyên môn" moTa="Hạng I, II: trình độ đại học; hạng III: đại học hoặc cao đẳng (Đ33 k4). Chuyên ngành phù hợp theo Phụ lục I — văn bằng không ghi rõ thì xét bảng điểm (Đ33 k2).">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={lbl}>Trình độ</label>
                <select className={inp} value={f.trinhDo} onChange={(e) => set('trinhDo', e.target.value)}>
                  <option value="">—</option>{TRINH_DO.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select></div>
              <div className="md:col-span-2"><label className={lbl}>Chuyên ngành đào tạo (ghi trên văn bằng)</label>
                <input className={inp} value={f.chuyenNganh} onChange={(e) => set('chuyenNganh', e.target.value)} /></div>
              <div className="md:col-span-2"><label className={lbl}>Cơ sở đào tạo</label>
                <input className={inp} value={f.coSoDaoTao} onChange={(e) => set('coSoDaoTao', e.target.value)} /></div>
              <div><label className={lbl}>Năm tốt nghiệp</label>
                <input className={inp} inputMode="numeric" value={f.namTotNghiep} onChange={(e) => set('namTotNghiep', e.target.value)} /></div>
              <div><label className={lbl}>Số hiệu văn bằng</label>
                <input className={inp} value={f.soHieuVanBang} onChange={(e) => set('soHieuVanBang', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2 pt-5">
                <input type="checkbox" checked={f.vanBangTrenCsdl} onChange={(e) => set('vanBangTrenCsdl', e.target.checked)} />
                Văn bằng đã có trên CSDL ngành Giáo dục (không phải nộp — Đ39 k1 điểm c)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-3">
                <input type="checkbox" checked={f.vanBangNuocNgoai} onChange={(e) => set('vanBangNuocNgoai', e.target.checked)} />
                Văn bằng do cơ sở đào tạo nước ngoài cấp (hợp pháp hóa lãnh sự hoặc được công nhận)
              </label>
            </div>
          </Khoi>

          {/* 4. Nội dung đề nghị */}
          <Khoi so={4} tieuDe="Nội dung đề nghị cấp" moTa="Lĩnh vực theo Đ28 k1. Thời gian kinh nghiệm tính từ thời điểm tham gia hoạt động xây dựng (Đ33 k5).">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={lbl}>Lĩnh vực</label>
                <select className={inp} value={f.linhVuc} onChange={(e) => {
                  const v = e.target.value; const l = LINH_VUC.find((x) => x.value === v)
                  setF((s) => ({ ...s, linhVuc: v, noiDung: l?.noiDung[0] ?? '' }))
                }}>
                  <option value="">—</option>{LINH_VUC.map((x) => <option key={x.value} value={x.value}>{x.label} ({x.dieu})</option>)}
                </select></div>
              <div className="md:col-span-2"><label className={lbl}>Nội dung</label>
                <select className={inp} value={f.noiDung} onChange={(e) => set('noiDung', e.target.value)} disabled={!lv}>
                  {(lv?.noiDung ?? []).map((x) => <option key={x} value={x}>{x}</option>)}
                </select></div>
              <div><label className={lbl}>Hạng đề nghị</label>
                <select className={inp} value={f.hangDeNghi} onChange={(e) => set('hangDeNghi', e.target.value)}>
                  <option value="">—</option><option value="I">Hạng I</option><option value="II">Hạng II</option><option value="III">Hạng III</option>
                </select></div>
              <div className="md:col-span-2"><label className={lbl}>Loại công trình (ghi theo đơn)</label>
                <input className={inp} placeholder="Dân dụng, công nghiệp, giao thông, NN&PTNT, hạ tầng kỹ thuật…" value={f.loaiCongTrinh} onChange={(e) => set('loaiCongTrinh', e.target.value)} />
                <p className="text-xs text-amber-700 mt-1">Phạm vi hoạt động theo hạng quy định tại Phụ lục II NĐ 212 — chưa có trong kho, cán bộ đối chiếu bản gốc.</p></div>
              <div><label className={lbl}>Số chứng chỉ đang có (nếu có)</label>
                <input className={inp} value={f.soCchnCu} onChange={(e) => set('soCchnCu', e.target.value)} /></div>
              <div><label className={lbl}>Bắt đầu tham gia hoạt động xây dựng</label>
                <input type="date" className={inp} value={f.ngayBatDauKn} onChange={(e) => set('ngayBatDauKn', e.target.value)} /></div>
              <div><label className={lbl}>Căn cứ xác định mốc bắt đầu</label>
                <select className={inp} value={f.nguonBatDauKn} onChange={(e) => set('nguonBatDauKn', e.target.value)}>
                  <option value="">—</option>{NGUON_BAT_DAU_KN.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select></div>
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-3">
                <input type="checkbox" checked={f.hanhNgheDocLap} onChange={(e) => set('hanhNgheDocLap', e.target.checked)} />
                Cá nhân hành nghề độc lập (chứng minh kinh nghiệm bằng hợp đồng kinh tế và biên bản nghiệm thu — Đ39 k1 điểm đ)
              </label>
            </div>
          </Khoi>

          {/* 5. Kinh nghiệm */}
          {!laCapLai && (
            <Khoi so={5} tieuDe="Kinh nghiệm — công trình, dự án, quy hoạch đã thực hiện"
              moTa={`Kê khai từng công trình. Vai trò lọc theo lĩnh vực${lv ? ` ${lv.dieu}` : ''}. "Đến ngày" (hoàn thành) dùng để tính 10 năm gần nhất. Cấp công trình theo TT 34/2026 (Đ27 k9).`}>
              <div className="space-y-3">
                {f.kinhNghiem.length === 0 && <p className="text-sm text-slate-500">Chưa có công trình nào.</p>}
                {f.kinhNghiem.map((k, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Công trình {i + 1}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveKn(i, -1)} className="p-1 rounded hover:bg-slate-200" title="Lên"><ArrowUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => moveKn(i, 1)} className="p-1 rounded hover:bg-slate-200" title="Xuống"><ArrowDown className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setF((s) => ({ ...s, kinhNghiem: s.kinhNghiem.filter((_, j) => j !== i) }))} className="p-1 rounded hover:bg-rose-100 text-rose-600" title="Xoá dòng"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="md:col-span-2"><label className={lbl}>Tên công trình / dự án / đồ án *</label>
                        <input className={inp} value={k.tenCongTrinh} onChange={(e) => setKn(i, { tenCongTrinh: e.target.value })} /></div>
                      <div><label className={lbl}>Địa điểm</label>
                        <input className={inp} value={k.diaDiem} onChange={(e) => setKn(i, { diaDiem: e.target.value })} /></div>
                      <div><label className={lbl}>{f.linhVuc === 'QUY_HOACH' ? 'Cơ quan tổ chức lập' : 'Chủ đầu tư'}</label>
                        <input className={inp} value={k.chuDauTu} onChange={(e) => setKn(i, { chuDauTu: e.target.value })} /></div>
                      <div className="md:col-span-2"><label className={lbl}>Vai trò *</label>
                        <select className={inp} value={k.vaiTro} onChange={(e) => setKn(i, { vaiTro: e.target.value })}>
                          <option value="">—</option>{vaiTroLv.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                        </select></div>
                      {f.linhVuc === 'QUY_HOACH' ? (<>
                        <div><label className={lbl}>Cấp phê duyệt</label>
                          <select className={inp} value={k.capPheDuyetQh} onChange={(e) => setKn(i, { capPheDuyetQh: e.target.value })}>
                            <option value="">—</option>{CAP_PHE_DUYET_QH.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                          </select></div>
                        <div><label className={lbl}>Loại quy hoạch</label>
                          <select className={inp} value={k.loaiQuyHoach} onChange={(e) => setKn(i, { loaiQuyHoach: e.target.value })}>
                            <option value="">—</option>{LOAI_QUY_HOACH.map((x) => <option key={x} value={x}>{x}</option>)}
                          </select></div>
                      </>) : (<>
                        <div><label className={lbl}>Cấp công trình</label>
                          <select className={inp} value={k.capCongTrinh} onChange={(e) => setKn(i, { capCongTrinh: e.target.value })}>
                            <option value="">—</option>{CAP_CONG_TRINH.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                          </select></div>
                        {f.linhVuc === 'KHAO_SAT' ? (
                          <div><label className={lbl}>Nhóm dự án</label>
                            <select className={inp} value={k.nhomDuAn} onChange={(e) => setKn(i, { nhomDuAn: e.target.value })}>
                              <option value="">—</option>{NHOM_DU_AN.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                            </select></div>
                        ) : (
                          <div><label className={lbl}>Loại công trình</label>
                            <input className={inp} value={k.loaiCongTrinh} onChange={(e) => setKn(i, { loaiCongTrinh: e.target.value })} /></div>
                        )}
                      </>)}
                      <div className="md:col-span-2"><label className={lbl}>Phần việc thực hiện</label>
                        <input className={inp} placeholder="vd: giám sát phần kết cấu, nền móng" value={k.phanViec} onChange={(e) => setKn(i, { phanViec: e.target.value })} /></div>
                      <div><label className={lbl}>Từ ngày</label>
                        <input type="date" className={inp} value={k.tuNgay} onChange={(e) => setKn(i, { tuNgay: e.target.value })} /></div>
                      <div><label className={lbl}>Đến ngày (hoàn thành)</label>
                        <input type="date" className={inp} value={k.denNgay} onChange={(e) => setKn(i, { denNgay: e.target.value })} /></div>
                      <div className="md:col-span-2"><label className={lbl}>Tài liệu chứng minh (Đ39 k1 điểm đ)</label>
                        <select className={inp} value={k.taiLieu} onChange={(e) => setKn(i, { taiLieu: e.target.value })}>
                          <option value="">—</option>{TAI_LIEU_KINH_NGHIEM.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                        </select></div>
                      <div><label className={lbl}>Số hiệu, ngày văn bản</label>
                        <input className={inp} value={k.soHieuTaiLieu} onChange={(e) => setKn(i, { soHieuTaiLieu: e.target.value })} /></div>
                      <div><label className={lbl}>Phần việc thuộc nội dung đề nghị?</label>
                        <select className={inp} value={k.phuHopNoiDung} onChange={(e) => setKn(i, { phuHopNoiDung: e.target.value as KinhNghiemForm['phuHopNoiDung'] })}>
                          <option value="">Chưa đánh giá</option><option value="co">Có — được tính</option><option value="khong">Không — loại khỏi tính</option>
                        </select></div>
                      <div className="md:col-span-4"><label className={lbl}>Ghi chú</label>
                        <input className={inp} value={k.ghiChu} onChange={(e) => setKn(i, { ghiChu: e.target.value })} /></div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setF((s) => ({ ...s, kinhNghiem: [...s.kinhNghiem, dongTrong()] }))}
                  className="w-full py-2 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> Thêm công trình
                </button>
              </div>
            </Khoi>
          )}

          {/* 6. Thành phần hồ sơ */}
          <Khoi so={laCapLai ? 5 : 6} tieuDe="Thành phần hồ sơ đã nhận" moTa="Danh mục tự lọc theo loại thủ tục và thông tin người đề nghị (Đ39). Thiếu thì thông báo bổ sung MỘT lần trong 05 ngày làm việc (Đ30 k5).">
            <div className="space-y-2">
              {thanhPhanApDung.map((t) => (
                <label key={t.key} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={!!f.thanhPhan[t.key]}
                    onChange={(e) => setF((s) => ({ ...s, thanhPhan: { ...s.thanhPhan, [t.key]: e.target.checked } }))} />
                  <span>
                    <span className="text-slate-800">{t.label}</span>
                    <span className="text-xs text-slate-500"> — {t.canCu}</span>
                    {t.ghiChu && <span className="block text-xs text-slate-500">{t.ghiChu}</span>}
                  </span>
                </label>
              ))}
            </div>
          </Khoi>

          {/* 7. Xử lý */}
          <Khoi so={laCapLai ? 6 : 7} tieuDe="Xử lý hồ sơ" moTa="Cấp mới, chuyển đổi: Hội đồng xét cấp đánh giá (Đ30 k4, Đ40) — hồ sơ cấp mới không tổ chức sát hạch. Chỉ cấp chứng chỉ khi trạng thái là “Đủ điều kiện”.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={lbl}>Trạng thái</label>
                <select className={inp} value={f.trangThai} onChange={(e) => set('trangThai', e.target.value)}>
                  {TRANG_THAI.filter((x) => x.value !== 'DA_CAP' || daCap).map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select></div>
              <div><label className={lbl}>Ngày gửi yêu cầu bổ sung</label>
                <input type="date" className={inp} value={f.ngayYeuCauBoSung} onChange={(e) => set('ngayYeuCauBoSung', e.target.value)} /></div>
              <div><label className={lbl}>Ngày nhận đủ hồ sơ hợp lệ</label>
                <input type="date" className={inp} value={f.ngayNhanDu} onChange={(e) => set('ngayNhanDu', e.target.value)} /></div>
              <div className="md:col-span-3"><label className={lbl}>Nội dung yêu cầu bổ sung</label>
                <textarea rows={2} className={inp} value={f.noiDungBoSung} onChange={(e) => set('noiDungBoSung', e.target.value)}
                  placeholder={dg.kq.thanhPhanThieu.length ? 'Gợi ý: ' + dg.kq.thanhPhanThieu.map((x) => x.label).join('; ') : ''} /></div>
              {!laCapLai && (<>
                <div><label className={lbl}>Ngày có kết quả Hội đồng</label>
                  <input type="date" className={inp} value={f.ngayHoiDong} onChange={(e) => set('ngayHoiDong', e.target.value)} /></div>
                <div><label className={lbl}>Hạng Hội đồng đánh giá</label>
                  <select className={inp} value={f.hangHoiDong} onChange={(e) => set('hangHoiDong', e.target.value)}>
                    <option value="">—</option><option value="I">Hạng I</option><option value="II">Hạng II</option><option value="III">Hạng III</option>
                  </select></div>
                <div><label className={lbl}>Ngày thông báo kết quả</label>
                  <input type="date" className={inp} value={f.ngayThongBao} onChange={(e) => set('ngayThongBao', e.target.value)} /></div>
                <div className="md:col-span-3"><label className={lbl}>Kết luận của Hội đồng</label>
                  <textarea rows={2} className={inp} value={f.ketLuanHoiDong} onChange={(e) => set('ketLuanHoiDong', e.target.value)} /></div>
              </>)}
              <div className="md:col-span-3"><label className={lbl}>Ghi chú</label>
                <textarea rows={2} className={inp} value={f.ghiChu} onChange={(e) => set('ghiChu', e.target.value)} /></div>
            </div>
          </Khoi>
        </fieldset>

        {/* Cột phải: đánh giá sơ bộ */}
        <aside className="space-y-4 lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Đánh giá sơ bộ</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">Hỗ trợ rà hồ sơ — không thay kết luận của Hội đồng xét cấp (Đ40).</p>
            {!laCapLai && (
              <div className={`rounded-lg px-3 py-2 mb-3 text-sm ${dg.kq.hangDatSoBo ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600'}`}>
                Hạng đạt sơ bộ: <b>{dg.kq.hangDatSoBo ? `Hạng ${dg.kq.hangDatSoBo}` : 'chưa đạt hạng nào'}</b>
                <span className="block text-xs">Về trình độ, số năm, công trình — chưa xét chuyên ngành (Phụ lục I).</span>
                {f.hangDeNghi && dg.kq.hangDatSoBo && f.hangDeNghi !== dg.kq.hangDatSoBo && (
                  <span className="block text-xs mt-0.5">Đề nghị hạng {f.hangDeNghi} — kiểm tra lại điều kiện.</span>
                )}
              </div>
            )}
            <ul className="space-y-2">
              {dg.kq.muc.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {ICON_KQ[m.ketQua]}
                  <div className="min-w-0">
                    <p className="text-slate-800">{m.noiDung}</p>
                    <p className="text-xs text-slate-500">{m.canCu}</p>
                    {m.ghiChu && <p className="text-xs text-amber-700 mt-0.5">{m.ghiChu}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {f.id && (
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileDown className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Dự thảo văn bản (.docx)</h3>
              </div>
              <div className="space-y-2">
                {(initial.noiDungBoSung.trim() || dg.kq.thanhPhanThieu.length > 0) && !daCap && (
                  <a href={`/api/cchn/${f.id}/van-ban?loai=bo-sung`} className="block rounded-lg border px-3 py-2 text-sm hover:bg-indigo-50 hover:border-indigo-300">
                    Thông báo yêu cầu bổ sung hồ sơ
                    <span className="block text-xs text-slate-500">Đ30 k5 — lấy từ “Nội dung yêu cầu bổ sung”; để trống thì liệt kê thành phần còn thiếu</span>
                  </a>
                )}
                {!laCapLai && ['DU_DIEU_KIEN', 'KHONG_DU_DIEU_KIEN'].includes(initial.trangThai) && (
                  <a href={`/api/cchn/${f.id}/van-ban?loai=ket-qua`} className="block rounded-lg border px-3 py-2 text-sm hover:bg-indigo-50 hover:border-indigo-300">
                    Thông báo kết quả đánh giá hồ sơ
                    <span className="block text-xs text-slate-500">Đ30 k4 — theo trạng thái, hạng và kết luận Hội đồng đã lưu</span>
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Lưu hồ sơ trước khi tải để văn bản lấy dữ liệu mới nhất.</p>
            </div>
          )}

          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Thời hạn giải quyết</h3>
            </div>
            <ul className="space-y-2">
              {dg.han.map((h, i) => (
                <li key={i} className="text-sm">
                  <div className="flex justify-between gap-2"><span className="text-slate-700">{h.nhan}</span><b className="text-slate-900 shrink-0">{fmt(h.ngay)}</b></div>
                  <p className="text-xs text-slate-500">{h.canCu}</p>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 mt-2">Ngày làm việc tính thứ Hai – thứ Sáu, chưa trừ ngày lễ, Tết.</p>
          </div>

          {!!initial.lichSu?.length && (
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Lịch sử xử lý</h3>
              </div>
              <ol className="space-y-2">
                {initial.lichSu.map((l, i) => (
                  <li key={i} className="text-sm border-l-2 border-indigo-200 pl-3">
                    <p className="text-slate-800">
                      {HANH_DONG[l.hanhDong] ?? l.hanhDong}
                      {l.denTrangThai && <>: {l.tuTrangThai ? `${nhanTT(l.tuTrangThai)} → ` : ''}<b>{nhanTT(l.denTrangThai)}</b></>}
                    </p>
                    {l.ghiChu && <p className="text-xs text-slate-600">{l.ghiChu}</p>}
                    <p className="text-xs text-slate-500">{l.nguoiTen ?? '—'} · {new Date(l.thoiDiem).toLocaleString('vi-VN')}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>

      {moCap && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => !pending && setMoCap(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 mb-1">Cấp chứng chỉ hành nghề</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ghi sổ năng lực HĐXD (httt_nang_luc_ca_nhan) và khởi tạo mã định danh. Hiệu lực cấp mới 10 năm (Đ27 k5){laCapLai ? '; cấp lại ghi thời hạn theo chứng chỉ cũ.' : '.'}
            </p>
            <div className="space-y-3">
              <div><label className={lbl}>Số chứng chỉ *</label>
                <input className={inp} value={cap.soChungChi} onChange={(e) => setCap((s) => ({ ...s, soChungChi: e.target.value }))} /></div>
              <div><label className={lbl}>Ngày cấp *</label>
                <input type="date" className={inp} value={cap.ngayCap} onChange={(e) => setCap((s) => ({ ...s, ngayCap: e.target.value }))} /></div>
              <div><label className={lbl}>{laCapLai ? 'Thời hạn (theo chứng chỉ cũ) *' : !f.laCongDanVN ? 'Thời hạn theo giấy phép lao động/thẻ tạm trú (≤ 10 năm) *' : 'Thời hạn (để trống = 10 năm kể từ ngày cấp)'}</label>
                <input type="date" className={inp} value={cap.thoiHan} onChange={(e) => setCap((s) => ({ ...s, thoiHan: e.target.value }))} /></div>
              <div><label className={lbl}>Cơ quan cấp</label>
                <input className={inp} value={cap.coQuanCap} onChange={(e) => setCap((s) => ({ ...s, coQuanCap: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setMoCap(false)} disabled={pending} className="px-3 py-2 rounded-lg border text-sm">Huỷ</button>
              <button onClick={capCC} disabled={pending} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm flex items-center gap-1.5">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />} Xác nhận cấp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
