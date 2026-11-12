'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, CalendarClock, Check, CircleAlert, Info, Loader2, Save, Search, Send, ShieldCheck, Undo2, Wand2, X,
} from 'lucide-react'
import {
  goi, gioVn, LoiGoi, NhanLich, NhanNoiDung, NUT_CHINH, NUT_NGUY, NUT_PHU, O_NHAP, TEN_KENH, TEN_LOI_LICH, TEN_PHAN_LOAI, THE,
} from './dung-chung'
import { loiNhanAi, thongBaoLoiNhanAi, type ViTriNhanAi } from '@/lib/ai-content/nhan-ai'

type Nguon = { id: string; tieuDe: string; phamVi: string; tinhTrangHieuLuc: string; daXoa?: boolean }
type BienThe = { id: string; channel: string; body: string }
type Lich = {
  id: string; channel: string; adapter: string; status: string; scheduled_at_utc: string; external_post_id: string | null
  external_url: string | null; error_code: string | null; error_detail: string | null; published_at: string | null; version_id: string
}
type ChiTiet = {
  bai: { id: string; title: string; status: string; classification: string; ai_generated: boolean; may_mislead: boolean; current_version_id: string }
  phienBan: { id: string; version_no: number; title: string; body_md: string }
  bienThe: BienThe[]
  nguon: Nguon[]
  pheDuyet: { id: string; decision: string; approved_hash: string; note: string | null; created_at: string; nguoi: string; version_id: string }[]
  lich: Lich[]
  kenhDaDang: { channel: string; chay_thu: boolean }[]
  lichSuPhienBan: { id: string; version_no: number; created_at: string; nguoi: string }[]
  bamHienTai: string
  cauHinhKenh: Record<string, { ten: string; gioiHanKyTu: number | null; daXacMinh: boolean; ghiChu: string }>
  nganCach: string
  nhanAi: string
  viTriNhanAi: ViTriNhanAi
  quyen: { duyet: boolean; lyDoKhongDuyet: string | null; thuHoi: boolean }
}

const KENH = ['facebook', 'linkedin', 'threads', 'website'] as const
const TEN_QUYET_DINH: Record<string, string> = { APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', REVOKED: 'Thu hồi phê duyệt' }
const TEN_HIEU_LUC: Record<string, string> = { con_hieu_luc: 'Còn hiệu lực', het_hieu_luc: 'Hết hiệu lực', du_thao: 'Dự thảo', can_kiem_chung: 'Cần kiểm chứng' }

function baoLoi(e: unknown) {
  const l = e as LoiGoi
  toast.error(l.message, { description: l.chiTiet?.length ? l.chiTiet.join('\n') : undefined, duration: 8000 })
}

function nguonDungDuoc(n: Nguon) {
  return !n.daXoa && n.phamVi === 'CONG_KHAI' && n.tinhTrangHieuLuc === 'con_hieu_luc'
}

function ngayMai(): string {
  // Ngày mai theo giờ Việt Nam, dạng YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 86400e3))
}

export function AiSoanBai({ id }: { id?: string }) {
  const router = useRouter()
  const [ct, setCt] = useState<ChiTiet | null>(null)
  // "Bản nền": ảnh chụp bản máy chủ lúc các ô nhập được nạp. Mọi thao tác ghi gửi NỀN NÀY (không phải ct mới nhất) để máy chủ phát hiện bản đã đổi (409).
  const [nen, setNen] = useState<{ bam: string; phienBanId: string; bienThe: Record<string, string> } | null>(null)
  const [loiTai, setLoiTai] = useState<string | null>(null)
  const [ban, setBan] = useState(false)

  // Biểu mẫu bài gốc
  const [tieuDe, setTieuDe] = useState('')
  const [noiDung, setNoiDung] = useState('')
  const [phanLoai, setPhanLoai] = useState('INTERNAL')
  const [doAiTao, setDoAiTao] = useState(false)
  const [nhamLan, setNhamLan] = useState(false)
  const [nguon, setNguon] = useState<Nguon[]>([])

  // Chọn nguồn
  const [tuNguon, setTuNguon] = useState('')
  const [kqNguon, setKqNguon] = useState<Nguon[] | null>(null)

  // Biến thể
  const [kenh, setKenh] = useState<string>('facebook')
  const [banNhapBt, setBanNhapBt] = useState<Record<string, string>>({})

  // Duyệt & lịch
  const [ghiChu, setGhiChu] = useState('')
  const [ngay, setNgay] = useState(ngayMai)
  const [gio, setGio] = useState('08:30')
  const [lyDoDangLai, setLyDoDangLai] = useState('')
  const [cachDang, setCachDang] = useState('manual')
  const [url, setUrl] = useState<Record<string, string>>({})

  const nap = useCallback((d: ChiTiet) => {
    setCt(d)
    setNen({ bam: d.bamHienTai, phienBanId: d.phienBan.id, bienThe: Object.fromEntries(d.bienThe.map((b) => [b.channel, b.body])) })
    setTieuDe(d.phienBan.title); setNoiDung(d.phienBan.body_md); setPhanLoai(d.bai.classification)
    setDoAiTao(d.bai.ai_generated); setNhamLan(d.bai.may_mislead); setNguon(d.nguon)
    setBanNhapBt(Object.fromEntries(d.bienThe.map((b) => [b.channel, b.body])))
  }, [])

  // giuNhap: chỉ làm mới dữ liệu máy chủ (trạng thái, lịch…), KHÔNG ghi đè các ô đang gõ dở — dùng cho thao tác phụ không lưu bài.
  const tai = useCallback(async (giuNhap = false) => {
    if (!id) return
    try {
      const d = await goi<ChiTiet>(`/api/ai/v1/noi-dung/${id}`)
      if (giuNhap) setCt(d); else nap(d)
      setLoiTai(null)
    } catch (e) { setLoiTai((e as Error).message) }
  }, [id, nap])
  useEffect(() => {
    const t = setTimeout(() => { void tai() }, 0)
    return () => clearTimeout(t)
  }, [tai])

  useEffect(() => {
    if (kqNguon === null && !tuNguon) return
    const t = setTimeout(async () => {
      try { setKqNguon((await goi<{ items: Nguon[] }>(`/api/ai/v1/nguon?q=${encodeURIComponent(tuNguon)}`)).items) } catch { setKqNguon([]) }
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuNguon])

  const chuaLuu = useMemo(() => {
    if (!ct) return !!(tieuDe || noiDung)
    return tieuDe !== ct.phienBan.title || noiDung !== ct.phienBan.body_md || phanLoai !== ct.bai.classification ||
      doAiTao !== ct.bai.ai_generated || nhamLan !== ct.bai.may_mislead ||
      nguon.map((n) => n.id).sort().join() !== ct.nguon.map((n) => n.id).sort().join()
  }, [ct, tieuDe, noiDung, phanLoai, doAiTao, nhamLan, nguon])

  // Kênh có bản nháp khác với bản đã lưu trong CSDL (mọi kênh, không chỉ kênh đang mở).
  const kenhChuaLuu = useMemo(() => {
    if (!ct) return [] as string[]
    return Object.entries(banNhapBt).filter(([k, v]) => v !== (ct.bienThe.find((b) => b.channel === k)?.body ?? '')).map(([k]) => k)
  }, [ct, banNhapBt])
  const coNhapDo = chuaLuu || kenhChuaLuu.length > 0
  const coNhapDoRef = useRef(false)
  useEffect(() => { coNhapDoRef.current = coNhapDo }, [coNhapDo])

  useEffect(() => {
    if (!coNhapDo) return
    // Đã đồng ý rời trang ở hộp hỏi của liên kết thì không hỏi lần hai (liên kết tải lại toàn trang kích hoạt cả hai).
    let daChoRoi = false
    const h = (e: BeforeUnloadEvent) => { if (!daChoRoi) e.preventDefault() }
    window.addEventListener('beforeunload', h)
    // beforeunload KHÔNG chạy khi chuyển trang trong ứng dụng (menu bên, nút "Danh sách"…): bắt lần bấm vào liên kết ở pha
    // capture của document — trước trình xử lý của <Link>. preventDefault ở đây làm <Link> bỏ qua điều hướng (nó kiểm
    // defaultPrevented) và trình duyệt cũng không tự chuyển trang. Không chặn: mở tab mới, phím bổ trợ, liên kết ngoài, #neo.
    const bamLienKet = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const dich = new URL(a.href, window.location.href)
      if (dich.origin !== window.location.origin) return
      if (dich.pathname === window.location.pathname && dich.search === window.location.search) return
      if (!window.confirm('Bài đang có thay đổi chưa lưu. Rời trang sẽ mất phần đang gõ.\n\nBấm OK để rời trang, Huỷ để ở lại và lưu.')) {
        e.preventDefault()
        e.stopPropagation()
      } else {
        daChoRoi = true
        setTimeout(() => { daChoRoi = false }, 3000)   // điều hướng không xảy ra (bị chặn ở nơi khác) → bảo vệ lại
      }
    }
    document.addEventListener('click', bamLienKet, true)
    // CHƯA chặn nút Quay lại/Tiến của trình duyệt (popstate). Đã thử ngày 12/11/2026: bắt popstate ở pha capture rồi đi
    // ngược lại bằng history.go — kết quả không ổn định (lần Quay lại thứ hai lọt qua không hỏi; có lần không hỏi lần nào),
    // nên đã gỡ thay vì để lại một lớp bảo vệ không tin được. Xem NGHIEM_THU.md.
    return () => {
      window.removeEventListener('beforeunload', h)
      document.removeEventListener('click', bamLienKet, true)
    }
  }, [coNhapDo])

  const lam = async (fn: () => Promise<unknown>, thanhCong: string, giuNhap = false) => {
    setBan(true)
    try { await fn(); toast.success(thanhCong); await tai(giuNhap); return true } catch (e) {
      baoLoi(e)
      // Bị từ chối thường vì dữ liệu trên màn hình đã cũ (người khác vừa sửa/duyệt): tải lại để thấy bản mới nhất.
      // Không tải lại khi đang có bản nháp chưa lưu, để không xoá mất chữ người dùng đang gõ.
      if (!coNhapDoRef.current) await tai()
      return false
    } finally { setBan(false) }
  }

  const luuBai = async () => {
    const body = { tieuDe, noiDung, phanLoai, doAiTao, coTheGayNhamLan: doAiTao && nhamLan, nguonIds: nguon.map((n) => n.id), bamNen: nen?.bam }
    if (!id) {
      setBan(true)
      try {
        const r = await goi<{ id: string }>('/api/ai/v1/noi-dung', body)
        toast.success('Đã tạo bài')
        router.replace(`/dashboard/ai-workspace/${r.id}`)
      } catch (e) { baoLoi(e) } finally { setBan(false) }
      return
    }
    const daDuyet = ct && ct.bai.status !== 'DRAFT'
    if (daDuyet && !window.confirm('Lưu thay đổi sẽ đưa bài về bản nháp, huỷ các lịch chưa đăng và phải duyệt lại. Tiếp tục?')) return
    await lam(() => goi(`/api/ai/v1/noi-dung/${id}`, body, 'PUT'), 'Đã lưu bài')
  }

  const hanhDong = (body: object, thanhCong: string) => lam(() => goi(`/api/ai/v1/noi-dung/${id}`, body), thanhCong)
  const hanhDongLich = (lichId: string, body: object, thanhCong: string) => lam(() => goi(`/api/ai/v1/lich/${lichId}`, body), thanhCong, true)

  const thuHoi = async () => {
    if (!window.confirm('Thu hồi phê duyệt? Các lịch chưa đăng sẽ bị huỷ.')) return
    setBan(true)
    try {
      const r = await goi<{ lichBiHuy: number; dangDangKhongDungDuoc: number }>(`/api/ai/v1/noi-dung/${id}`, { loai: 'thu_hoi', ghiChu })
      if (r.dangDangKhongDungDuoc > 0) {
        // Không được báo "thành công" trơn: có lịch đã bắt đầu đăng trước khi thu hồi, hệ thống không dừng được.
        toast.warning(`Đã thu hồi, nhưng ${r.dangDangKhongDungDuoc} lịch ĐANG ĐĂNG không dừng được`, {
          description: 'Theo dõi lịch đó bên dưới: nếu bài đã lên thì gỡ thủ công trên nền tảng. Báo ngay cho cán bộ phụ trách kênh.', duration: 20000,
        })
      } else {
        toast.success(`Đã thu hồi phê duyệt${r.lichBiHuy ? `, huỷ ${r.lichBiHuy} lịch chưa đăng` : ''}`, {
          description: 'Với kênh đăng tay: báo cán bộ phụ trách để không đăng nội dung đã chép ra ngoài.', duration: 10000,
        })
      }
      await tai(true)
    } catch (e) { baoLoi(e) } finally { setBan(false) }
  }

  if (id && loiTai) {
    return (
      <div role="alert" className={`${THE} text-sm text-rose-800 dark:text-rose-200`}>
        Không mở được bài: {loiTai}. <Link href="/dashboard/ai-workspace" className="underline">Về danh sách</Link>
      </div>
    )
  }
  if (id && !ct) {
    return <div aria-busy="true" className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
  }

  const tt = ct?.bai.status ?? 'MOI'
  const btHienTai = ct?.bienThe.find((b) => b.channel === kenh)
  const banNhap = banNhapBt[kenh] ?? ''
  const btChuaLuu = banNhap !== (btHienTai?.body ?? '')
  const ch = ct?.cauHinhKenh[kenh]
  const doan = ct && kenh === 'threads' ? banNhap.split(ct.nganCach) : [banNhap]
  const vuot = ch?.gioiHanKyTu ? doan.some((d) => d.length > ch.gioiHanKyTu!) : false
  const nguonXau = nguon.filter((n) => !nguonDungDuoc(n))
  const pdMoi = ct?.pheDuyet[0]
  const duyetConHieuLuc = !!ct && tt === 'APPROVED' && pdMoi?.decision === 'APPROVED' && pdMoi.approved_hash === ct.bamHienTai
  // Lịch còn hiệu lực của phiên bản hiện hành, CÙNG LOẠI với cách đăng đang chọn (chạy thử và đăng thật tính riêng).
  // Lịch đang chờ/đang đăng được ưu tiên hơn lịch đã đăng: kênh đã đăng mà đang có lịch đăng lại thì KHÔNG mời đăng lại nữa.
  const lichSong = (k: string) => {
    const cung = (ct?.lich ?? []).filter((l) => l.channel === k && l.version_id === ct!.bai.current_version_id && (l.adapter === 'dry_run') === (cachDang === 'dry_run'))
    return cung.find((l) => ['SCHEDULED', 'PUBLISHING', 'RETRY_PENDING', 'UNKNOWN_OUTCOME'].includes(l.status))
  }
  // "Đã đăng" lấy từ máy chủ (kenhDaDang), không suy từ danh sách lịch sử bị cắt.
  const kenhDaDang = (k: string) => !!ct?.kenhDaDang.some((x) => x.channel === k && x.chay_thu === (cachDang === 'dry_run'))
  const tenKenhChuaLuu = kenhChuaLuu.map((k) => TEN_KENH[k]).join(', ')

  // Điều kiện còn thiếu để đặt lịch — hiện ngay trên giao diện, máy chủ vẫn kiểm lại.
  const thieu: string[] = []
  if (ct) {
    if (chuaLuu) thieu.push('Có thay đổi chưa lưu ở bài gốc.')
    if (kenhChuaLuu.length) thieu.push(`Bản ${tenKenhChuaLuu} có thay đổi chưa lưu.`)
    if (tt !== 'APPROVED') thieu.push('Bài chưa được duyệt.')
    if (ct.bai.classification !== 'PUBLIC') thieu.push('Bài chưa được phân loại "Công khai".')
    if (nguonXau.length) thieu.push(`${nguonXau.length} tài liệu nguồn không dùng được cho bài công khai.`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/ai-workspace" className={NUT_PHU}><ArrowLeft className="h-4 w-4" />Danh sách</Link>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{id ? 'Bài viết' : 'Soạn bài mới'}</h1>
        {ct && <NhanNoiDung tt={ct.bai.status} />}
        {ct && <span className="text-sm text-slate-500 dark:text-slate-400">Phiên bản {ct.phienBan.version_no}</span>}
        {chuaLuu && <span className="text-sm font-medium text-amber-700 dark:text-amber-300">• Chưa lưu</span>}
        {ct && nen && ct.bamHienTai !== nen.bam && (
          <span className="flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-300">
            Bài đã được người khác thay đổi — các thao tác ghi sẽ bị từ chối.
            <button type="button" onClick={() => void tai()} className="underline">Tải lại bản mới (bỏ phần đang gõ)</button>
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ── Cột trái: bài gốc ── */}
        <section className={`${THE} space-y-3 lg:col-span-3`} aria-label="Bài gốc">
          <div>
            <label htmlFor="ai-tieu-de" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tiêu đề</label>
            <input id="ai-tieu-de" value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} maxLength={300} className={O_NHAP} placeholder="Tiêu đề bài viết" />
          </div>
          <div>
            <label htmlFor="ai-noi-dung" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nội dung bài gốc <span className="font-normal text-slate-500">(hỗ trợ Markdown)</span></label>
            <textarea id="ai-noi-dung" value={noiDung} onChange={(e) => setNoiDung(e.target.value)} rows={14} className={`${O_NHAP} font-mono leading-relaxed`} placeholder="Nội dung đầy đủ. Các bản theo kênh được tạo từ đây." />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{noiDung.length.toLocaleString('vi-VN')} ký tự</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ai-phan-loai" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phân loại dữ liệu</label>
              <select id="ai-phan-loai" value={phanLoai} onChange={(e) => setPhanLoai(e.target.value)} className={O_NHAP}>
                {Object.entries(TEN_PHAN_LOAI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chỉ bài “Công khai” mới đặt lịch đăng được. Người duyệt xác nhận phân loại này khi duyệt.</p>
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Sử dụng AI</legend>
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={doAiTao} onChange={(e) => setDoAiTao(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                Nội dung do AI tạo hoặc chỉnh sửa đáng kể
              </label>
              <label className={`mt-1.5 flex items-start gap-2 text-sm ${doAiTao ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                <input type="checkbox" disabled={!doAiTao} checked={doAiTao && nhamLan} onChange={(e) => setNhamLan(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                Có thể gây nhầm lẫn về tính xác thực → bắt buộc kèm thông báo AI
              </label>
            </fieldset>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Tài liệu nguồn trong kho</p>
            {nguon.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Chưa gắn tài liệu nào. Bài viện dẫn văn bản thì nên gắn để hệ thống kiểm hiệu lực.</p>}
            <ul className="space-y-1">
              {nguon.map((n) => (
                <li key={n.id} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${nguonDungDuoc(n) ? 'border-slate-200 dark:border-slate-700' : 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40'}`}>
                  <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-200" title={n.tieuDe}>{n.tieuDe}</span>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {n.daXoa ? 'Đã gỡ khỏi kho' : `${n.phamVi === 'CONG_KHAI' ? 'Công khai' : 'Nội bộ'} · ${TEN_HIEU_LUC[n.tinhTrangHieuLuc] ?? n.tinhTrangHieuLuc}`}
                  </span>
                  <button type="button" onClick={() => setNguon(nguon.filter((x) => x.id !== n.id))} aria-label={`Bỏ nguồn ${n.tieuDe}`} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input value={tuNguon} onChange={(e) => setTuNguon(e.target.value)} onFocus={() => { if (kqNguon === null) void goi<{ items: Nguon[] }>('/api/ai/v1/nguon?q=').then((r) => setKqNguon(r.items)).catch(() => setKqNguon([])) }}
                placeholder="Tìm tài liệu để gắn làm nguồn" aria-label="Tìm tài liệu nguồn" className={`${O_NHAP} pl-8`} />
            </div>
            {kqNguon !== null && (
              <ul className="mt-1 max-h-44 overflow-y-auto rounded-md border border-slate-200 text-sm dark:border-slate-700">
                {kqNguon.filter((k) => !nguon.some((n) => n.id === k.id)).length === 0 && <li className="px-2 py-2 text-slate-500 dark:text-slate-400">Không có tài liệu phù hợp.</li>}
                {kqNguon.filter((k) => !nguon.some((n) => n.id === k.id)).map((k) => (
                  <li key={k.id}>
                    <button type="button" onClick={() => setNguon([...nguon, k])} className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-100 dark:hover:bg-slate-800">
                      <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-200">{k.tieuDe}</span>
                      <span className={`shrink-0 text-xs ${nguonDungDuoc(k) ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {nguonDungDuoc(k) ? 'Dùng được cho bài công khai' : 'Không dùng được cho bài công khai'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button onClick={luuBai} disabled={ban || !chuaLuu || !tieuDe.trim() || !noiDung.trim() || kenhChuaLuu.length > 0} className={NUT_CHINH}>
              {ban ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{id ? 'Lưu bài' : 'Tạo bài'}
            </button>
            {chuaLuu && kenhChuaLuu.length > 0 && <span className="text-xs text-amber-700 dark:text-amber-300">Cả bài gốc và bản {tenKenhChuaLuu} đều chưa lưu: hãy bỏ thay đổi (hoặc chép ra ngoài) ở một bên, lưu bên còn lại rồi làm lại bên kia — mỗi lần lưu tải lại toàn bộ.</span>}
            {ct && chuaLuu && <button onClick={() => nap(ct)} disabled={ban} className={NUT_PHU}><Undo2 className="h-4 w-4" />Bỏ thay đổi</button>}
          </div>
        </section>

        {/* ── Cột phải: quy trình ── */}
        <div className="space-y-4 lg:col-span-2">
          {!ct ? (
            <section className={THE}>
              <p className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />Tạo bài trước; sau đó tạo bản theo từng kênh, gửi lãnh đạo duyệt rồi đặt lịch.</p>
            </section>
          ) : (
            <>
              <section className={THE} aria-label="Phê duyệt">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100"><ShieldCheck className="h-4 w-4" />Phê duyệt</h2>
                {tt === 'DRAFT' || tt === 'REJECTED' ? (
                  <>
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">{tt === 'REJECTED' ? 'Bài bị từ chối. Sửa rồi gửi duyệt lại.' : 'Bài đang là bản nháp.'}</p>
                    <button onClick={() => hanhDong({ loai: 'gui_duyet', bamNen: nen?.bam }, 'Đã gửi duyệt')} disabled={ban || coNhapDo || ct.bienThe.length === 0} className={NUT_CHINH}><Send className="h-4 w-4" />Gửi duyệt</button>
                    {(coNhapDo || ct.bienThe.length === 0) && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{chuaLuu ? 'Lưu bài trước khi gửi duyệt.' : kenhChuaLuu.length ? `Lưu bản ${tenKenhChuaLuu} trước khi gửi duyệt.` : 'Cần ít nhất một bản theo kênh trước khi gửi duyệt.'}</p>}
                  </>
                ) : tt === 'PENDING_REVIEW' ? (
                  ct.quyen.duyet ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-300">Duyệt là xác nhận: nội dung, phân loại <b>{TEN_PHAN_LOAI[ct.bai.classification]}</b>, {ct.bienThe.length} bản theo kênh và {ct.nguon.length} tài liệu nguồn. Người duyệt chịu trách nhiệm về nội dung công bố.</p>
                      <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} placeholder="Ghi chú (không bắt buộc)" aria-label="Ghi chú duyệt" className={O_NHAP} />
                      <div className="flex gap-2">
                        <button onClick={() => hanhDong({ loai: 'duyet', ghiChu, bamDangXem: nen?.bam }, 'Đã duyệt')} disabled={ban || coNhapDo} className={NUT_CHINH}><Check className="h-4 w-4" />Duyệt</button>
                        <button onClick={() => hanhDong({ loai: 'tu_choi', ghiChu, bamDangXem: nen?.bam }, 'Đã từ chối')} disabled={ban || coNhapDo} className={NUT_NGUY}><X className="h-4 w-4" />Từ chối</button>
                      </div>
                      {coNhapDo && <p className="text-xs text-amber-700 dark:text-amber-300">Bạn đang có thay đổi chưa lưu trên màn hình. Bỏ thay đổi hoặc tải lại trang để duyệt đúng bản đã gửi.</p>}
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nếu bài bị sửa sau khi bạn mở trang, hệ thống sẽ từ chối và yêu cầu tải lại.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">Đang chờ lãnh đạo duyệt. {ct.quyen.lyDoKhongDuyet}</p>
                  )
                ) : tt === 'APPROVED' ? (
                  <div className="space-y-2">
                    <p className={`text-sm ${duyetConHieuLuc ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {duyetConHieuLuc ? `Đã duyệt bởi ${pdMoi?.nguoi} lúc ${gioVn(pdMoi?.created_at)}.` : 'Phê duyệt không còn khớp nội dung hiện tại — cần duyệt lại.'}
                    </p>
                    {ct.quyen.thuHoi && (
                      <button onClick={thuHoi} disabled={ban} className={NUT_NGUY}><Undo2 className="h-4 w-4" />Thu hồi phê duyệt</button>
                    )}
                  </div>
                ) : <p className="text-sm text-slate-500">Bài đã huỷ.</p>}

                {ct.pheDuyet.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-slate-600 dark:text-slate-300">Lịch sử quyết định ({ct.pheDuyet.length})</summary>
                    <ul className="mt-1 space-y-1">
                      {ct.pheDuyet.map((p) => (
                        <li key={p.id} className="text-slate-600 dark:text-slate-300">
                          <span className="font-medium">{TEN_QUYET_DINH[p.decision] ?? p.decision}</span> · {p.nguoi} · {gioVn(p.created_at)}{p.note ? ` — ${p.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>

              <section className={THE} aria-label="Lịch xuất bản">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100"><CalendarClock className="h-4 w-4" />Lịch xuất bản</h2>
                {thieu.length > 0 ? (
                  <div className="rounded-md bg-amber-50 p-2.5 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <p className="flex items-center gap-1.5 font-medium"><CircleAlert className="h-4 w-4" />Chưa đặt lịch được:</p>
                    <ul className="ml-6 list-disc">{thieu.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="ai-ngay" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Ngày đăng</label>
                        <input id="ai-ngay" type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} className={O_NHAP} />
                      </div>
                      <div>
                        <label htmlFor="ai-gio" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Giờ (Việt Nam)</label>
                        <input id="ai-gio" type="time" value={gio} onChange={(e) => setGio(e.target.value)} className={O_NHAP} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="ai-cach" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Cách đăng</label>
                      <select id="ai-cach" value={cachDang} onChange={(e) => setCachDang(e.target.value)} className={O_NHAP}>
                        <option value="manual">Đăng tay — đến giờ, cán bộ đăng rồi xác nhận đường dẫn</option>
                        <option value="dry_run">Chạy thử — không đăng đi đâu, chỉ kiểm quy trình</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chưa kết nối tài khoản mạng xã hội nào nên chưa có đăng tự động.</p>
                    </div>
                    {cachDang !== 'dry_run' && ct.bienThe.some((b) => !lichSong(b.channel) && kenhDaDang(b.channel)) && (
                      <div>
                        <label htmlFor="ai-ly-do-dang-lai" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Lý do đăng lại (kênh đã đăng bản này; 10–500 ký tự)</label>
                        <input id="ai-ly-do-dang-lai" value={lyDoDangLai} onChange={(e) => setLyDoDangLai(e.target.value)} maxLength={500}
                          placeholder="Ví dụ: bài trước bị gỡ nhầm; đăng nhắc lại trước hạn nộp hồ sơ" className={O_NHAP} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {ct.bienThe.map((b) => {
                        const s = lichSong(b.channel)
                        const daDang = !s && kenhDaDang(b.channel)
                        const canLyDo = daDang && cachDang !== 'dry_run'
                        const thieuLyDo = canLyDo && lyDoDangLai.trim().length < 10
                        return (
                          <button key={b.channel} disabled={ban || !!s || thieuLyDo || !ngay || !gio}
                            onClick={async () => {
                              const duoc = await hanhDong({ loai: 'dat_lich', kenh: b.channel, ngay, gio, adapter: cachDang, bamNen: nen?.bam, ...(daDang ? { dangLai: true, lyDoDangLai: lyDoDangLai.trim() } : {}) },
                                `Đã đặt lịch ${daDang ? 'đăng lại ' : ''}${TEN_KENH[b.channel]}`)
                              if (daDang && duoc) setLyDoDangLai('')   // thất bại (409, mất mạng) thì giữ lý do đã gõ
                            }}
                            title={s ? 'Kênh này đang có lịch cho phiên bản hiện hành' : thieuLyDo ? 'Ghi lý do đăng lại (ít nhất 10 ký tự)' : undefined} className={NUT_PHU}>
                            {daDang ? 'Đăng lại' : 'Đặt lịch'} {TEN_KENH[b.channel]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {ct.lich.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {ct.lich.map((l) => (
                      <li key={l.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{TEN_KENH[l.channel]}</span>
                          <NhanLich tt={l.status} />
                          <span className="tabular-nums text-slate-500 dark:text-slate-400">{gioVn(l.scheduled_at_utc)}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{l.adapter === 'dry_run' ? 'chạy thử' : 'đăng tay'}</span>
                          {['SCHEDULED', 'RETRY_PENDING', 'FAILED'].includes(l.status) && (
                            <button onClick={() => hanhDongLich(l.id, { loai: 'huy' }, 'Đã huỷ lịch')} disabled={ban} className="ml-auto text-xs text-rose-700 underline dark:text-rose-300">Huỷ</button>
                          )}
                        </div>
                        {l.error_code && <p className="text-xs text-slate-500 dark:text-slate-400">{TEN_LOI_LICH[l.error_code] ?? l.error_code}{l.error_detail ? `: ${l.error_detail}` : ''}</p>}
                        {l.status === 'PUBLISHED' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {l.adapter === 'dry_run' ? 'Chạy thử — KHÔNG có bài thật trên mạng xã hội.' : <>Người dùng khai báo: <a href={l.external_url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline dark:text-indigo-300">{l.external_url}</a></>}
                          </p>
                        )}
                        {((l.status === 'SCHEDULED' && l.adapter === 'manual') || l.status === 'UNKNOWN_OUTCOME') && (
                          <div className="mt-1 flex gap-1.5">
                            <input value={url[l.id] ?? ''} onChange={(e) => setUrl({ ...url, [l.id]: e.target.value })} placeholder="https://… đường dẫn bài đã đăng" aria-label="Đường dẫn bài đã đăng" className={`${O_NHAP} py-1.5`} />
                            <button disabled={ban || !/^https:\/\//i.test((url[l.id] ?? '').trim())} className={NUT_PHU}
                              onClick={() => hanhDongLich(l.id, l.status === 'UNKNOWN_OUTCOME' ? { loai: 'doi_soat', ketQua: 'PUBLISHED', url: url[l.id] } : { loai: 'xac_nhan', url: url[l.id] }, 'Đã ghi nhận bài đăng')}>
                              Đã đăng
                            </button>
                            {l.status === 'UNKNOWN_OUTCOME' && <button disabled={ban} className={NUT_NGUY} onClick={() => hanhDongLich(l.id, { loai: 'doi_soat', ketQua: 'FAILED' }, 'Đã ghi nhận: không có bài')}>Không có bài</button>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* ── Bản theo kênh ── */}
      {ct && (
        <section className={THE} aria-label="Bản theo kênh">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Bản theo kênh</h2>
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Kênh">
              {KENH.map((k) => {
                const co = ct.bienThe.some((b) => b.channel === k)
                return (
                  <button key={k} role="tab" aria-selected={kenh === k} onClick={() => setKenh(k)}
                    className={`rounded-md px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${kenh === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                    {TEN_KENH[k]}{co ? ' ✓' : ''}{kenhChuaLuu.includes(k) ? ' •' : ''}
                  </button>
                )
              })}
            </div>
            <button disabled={ban || coNhapDo} className={`${NUT_PHU} ml-auto`} title={chuaLuu ? 'Lưu bài gốc trước' : kenhChuaLuu.length ? `Bản ${tenKenhChuaLuu} đang có thay đổi chưa lưu — lưu hoặc bỏ nó trước` : undefined}
              onClick={() => hanhDong({ loai: 'bien_the_tu_dong', kenh: [kenh], bamNen: nen?.bam }, `Đã tạo bản ${TEN_KENH[kenh]} từ bài gốc`)}>
              <Wand2 className="h-4 w-4" />Tạo từ bài gốc
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="ai-bien-the" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nội dung sẽ đăng trên {TEN_KENH[kenh]}</label>
              <textarea id="ai-bien-the" value={banNhap} onChange={(e) => setBanNhapBt({ ...banNhapBt, [kenh]: e.target.value })} rows={12} className={`${O_NHAP} leading-relaxed`}
                placeholder={`Chưa có bản ${TEN_KENH[kenh]}. Bấm "Tạo từ bài gốc" hoặc tự soạn.`} />
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
                <span className={vuot ? 'font-medium text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}>
                  {doan.length > 1 ? `${doan.length} bài nối tiếp · dài nhất ${Math.max(...doan.map((d) => d.length))}` : `${banNhap.length}`} ký tự
                  {ch?.gioiHanKyTu ? ` / giới hạn ${ch.gioiHanKyTu} mỗi bài` : ''}
                </span>
                {ch && !ch.daXacMinh && <span className="text-amber-700 dark:text-amber-300">Giới hạn kênh chưa đối chiếu tài liệu chính thức: {ch.ghiChu}</span>}
              </div>
              {ct.bai.ai_generated && ct.bai.may_mislead && (() => {
                // Cùng hàm với cổng xuất bản: giao diện báo đúng điều máy chủ sẽ chặn.
                const l = loiNhanAi(doan[0], ct.nhanAi, ct.viTriNhanAi)
                if (!l) return null
                return <p className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-300">{thongBaoLoiNhanAi(l, ct.nhanAi)}</p>
              })()}
              <div className="mt-2 flex items-center gap-2">
                <button disabled={ban || !btChuaLuu || !banNhap.trim() || vuot || chuaLuu || kenhChuaLuu.some((k) => k !== kenh)} className={NUT_CHINH}
                  onClick={() => {
                    if (tt !== 'DRAFT' && !window.confirm('Sửa bản theo kênh sẽ đưa bài về bản nháp, huỷ lịch chưa đăng và phải duyệt lại. Tiếp tục?')) return
                    void hanhDong({ loai: 'bien_the', kenh, noiDung: banNhap, phienBanNen: nen?.phienBanId, bienTheNen: nen?.bienThe[kenh] ?? '' }, `Đã lưu bản ${TEN_KENH[kenh]}`)
                  }}>
                  <Save className="h-4 w-4" />Lưu bản {TEN_KENH[kenh]}
                </button>
                {btChuaLuu && <button type="button" onClick={() => setBanNhapBt({ ...banNhapBt, [kenh]: btHienTai?.body ?? '' })} disabled={ban} className={NUT_PHU}><Undo2 className="h-4 w-4" />Bỏ thay đổi</button>}
                {btChuaLuu && <span className="text-sm text-amber-700 dark:text-amber-300">
                  {chuaLuu ? 'Lưu bài gốc trước (lưu từng phần một để không mất thay đổi)' : kenhChuaLuu.some((k) => k !== kenh) ? `Lưu bản ${kenhChuaLuu.filter((k) => k !== kenh).map((k) => TEN_KENH[k]).join(', ')} trước` : 'Chưa lưu'}
                </span>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Xem trước</p>
              {banNhap.trim() ? (
                <div className="space-y-2">
                  {doan.map((d, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Sở Xây dựng Quảng Trị{doan.length > 1 ? ` · bài ${i + 1}/${doan.length}` : ''}</p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800 dark:text-slate-200">{d}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Chưa có nội dung để xem trước.</p>}
            </div>
          </div>
        </section>
      )}

      {ct && ct.lichSuPhienBan.length > 1 && (
        <section className={THE} aria-label="Lịch sử phiên bản">
          <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Lịch sử phiên bản</h2>
          <ul className="text-sm text-slate-600 dark:text-slate-300">
            {ct.lichSuPhienBan.map((v) => <li key={v.id}>Phiên bản {v.version_no} · {v.nguoi} · {gioVn(v.created_at)}{v.id === ct.bai.current_version_id ? ' (hiện hành)' : ''}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
