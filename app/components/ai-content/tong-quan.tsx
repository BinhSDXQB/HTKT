'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, FilePlus2, Loader2, RefreshCw, Search, Sparkles, TriangleAlert } from 'lucide-react'
import { tongHopXuatBan, type TrangThaiLich } from '@/lib/ai-content/trang-thai'
import { goi, gioVn, NhanNoiDung, NUT_CHINH, NUT_PHU, O_NHAP, TEN_PHAN_LOAI, THE } from './dung-chung'

type Bai = {
  id: string; title: string; status: string; classification: string; ai_generated: boolean
  updated_at: string; nguoi_tao: string; version_no: number; lich: TrangThaiLich[]
}
type ThongKe = Record<'tong_bai' | 'ban_nhap' | 'cho_duyet' | 'da_duyet' | 'lich_cho' | 'da_dang' | 'loi' | 'can_doi_soat', number>
type SuKien = { id: string; action: string; target_type: string; target_id: string; created_at: string; nguoi: string | null }

const TEN_TONG_HOP: Record<string, string> = {
  CHUA_DAT_LICH: 'Chưa đặt lịch', DA_DAT_LICH: 'Đã đặt lịch', DANG_DANG: 'Đang đăng', DA_DANG: 'Đã đăng đủ kênh',
  DANG_MOT_PHAN: 'Đăng một phần', CAN_DOI_SOAT: 'Cần đối soát', LOI: 'Có kênh lỗi', DA_HUY: 'Lịch đã huỷ',
}
const TEN_HANH_DONG: Record<string, string> = {
  TAO_BAI: 'Tạo bài', SUA_BAI: 'Sửa bài', LUU_BIEN_THE: 'Lưu biến thể kênh', GUI_DUYET: 'Gửi duyệt', DUYET: 'Duyệt', TU_CHOI: 'Từ chối',
  THU_HOI: 'Thu hồi phê duyệt', DAT_LICH: 'Đặt lịch', HUY_LICH: 'Huỷ lịch', XAC_NHAN_DANG_TAY: 'Xác nhận đã đăng tay', DOI_SOAT: 'Đối soát',
  CONG_CHAN: 'Cổng xuất bản chặn', BAT_DAU_DANG: 'Bắt đầu đăng', DA_DANG: 'Đã đăng', DANG_LOI: 'Đăng lỗi', LICH_TREO: 'Lịch bị treo', LICH_QUA_HAN: 'Lịch quá hạn',
}
const LOC = [['', 'Tất cả'], ['DRAFT', 'Bản nháp'], ['PENDING_REVIEW', 'Chờ duyệt'], ['APPROVED', 'Đã duyệt'], ['REJECTED', 'Bị từ chối']] as const

export function AiTongQuan() {
  const [bai, setBai] = useState<Bai[] | null>(null)
  const [tk, setTk] = useState<ThongKe | null>(null)
  const [nk, setNk] = useState<SuKien[]>([])
  const [loc, setLoc] = useState('')
  const [tu, setTu] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const [dangTai, setDangTai] = useState(false)

  const luot = useRef(0)
  const tai = useCallback(async (trangThai: string, tuKhoa: string) => {
    const cuaToi = ++luot.current     // chỉ nhận phản hồi của lần lọc/tìm mới nhất
    setDangTai(true)
    setLoi(null)
    try {
      const q = new URLSearchParams()
      if (trangThai) q.set('trangThai', trangThai)
      if (tuKhoa.trim()) q.set('tu', tuKhoa.trim())
      const [a, b] = await Promise.all([
        goi<{ items: Bai[] }>(`/api/ai/v1/noi-dung?${q}`),
        goi<{ thongKe: ThongKe; nhatKy: SuKien[] }>('/api/ai/v1/tong-quan?nhatKy=15'),
      ])
      if (cuaToi !== luot.current) return
      setBai(a.items); setTk(b.thongKe); setNk(b.nhatKy)
    } catch (e) {
      if (cuaToi === luot.current) setLoi((e as Error).message)
    } finally {
      if (cuaToi === luot.current) setDangTai(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { void tai(loc, tu) }, tu ? 300 : 0)
    return () => clearTimeout(t)
  }, [loc, tu, tai])

  const o = (ten: string, so: number | undefined, canhBao = false) => (
    <div className={`${THE} ${canhBao && so ? 'border-orange-300 dark:border-orange-700' : ''}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400">{ten}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${canhBao && so ? 'text-orange-700 dark:text-orange-300' : 'text-slate-900 dark:text-slate-100'}`}>
        {so ?? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />}
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"><Sparkles className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Workspace · Nội dung truyền thông</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Soạn bài → chuyển thể theo kênh → lãnh đạo duyệt → đặt lịch. Không bài nào được đăng khi chưa duyệt.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ai-workspace/lich" className={NUT_PHU}><CalendarDays className="h-4 w-4" />Lịch xuất bản</Link>
          <Link href="/dashboard/ai-workspace/moi" className={NUT_CHINH}><FilePlus2 className="h-4 w-4" />Soạn bài mới</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {o('Bản nháp', tk?.ban_nhap)}
        {o('Chờ duyệt', tk?.cho_duyet)}
        {o('Lịch đang chờ đăng', tk?.lich_cho)}
        {o('Đã đăng', tk?.da_dang)}
        {o('Đã duyệt', tk?.da_duyet)}
        {o('Tổng số bài', tk?.tong_bai)}
        {o('Lịch lỗi', tk?.loi, true)}
        {o('Cần đối soát', tk?.can_doi_soat, true)}
      </div>

      <section className={THE} aria-label="Danh sách bài viết">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Lọc theo trạng thái">
            {LOC.map(([k, ten]) => (
              <button key={k} role="tab" aria-selected={loc === k} onClick={() => setLoc(k)}
                className={`rounded-md px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${loc === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                {ten}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={tu} onChange={(e) => setTu(e.target.value)} placeholder="Tìm theo tiêu đề" aria-label="Tìm theo tiêu đề" className={`${O_NHAP} pl-8`} />
          </div>
          <button onClick={() => void tai(loc, tu)} className={NUT_PHU} aria-label="Tải lại">
            {dangTai ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>

        {loi && (
          <div role="alert" className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
            <TriangleAlert className="h-4 w-4 shrink-0" />Không tải được dữ liệu: {loi}
          </div>
        )}
        {!loi && bai === null && (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />)}</div>
        )}
        {!loi && bai?.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">{loc || tu ? 'Không có bài nào khớp bộ lọc.' : 'Chưa có bài viết nào.'}</p>
            {!loc && !tu && <Link href="/dashboard/ai-workspace/moi" className={`${NUT_CHINH} mt-3`}><FilePlus2 className="h-4 w-4" />Soạn bài đầu tiên</Link>}
          </div>
        )}
        {!loi && !!bai?.length && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">Tiêu đề</th>
                  <th className="py-2 pr-3 font-medium">Trạng thái</th>
                  <th className="py-2 pr-3 font-medium">Xuất bản</th>
                  <th className="py-2 pr-3 font-medium">Phân loại</th>
                  <th className="py-2 pr-3 font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {bai.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 pr-3">
                      <Link href={`/dashboard/ai-workspace/${b.id}`} className="font-medium text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">{b.title}</Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{b.nguoi_tao} · phiên bản {b.version_no}{b.ai_generated ? ' · có dùng AI' : ''}</p>
                    </td>
                    <td className="py-2.5 pr-3"><NhanNoiDung tt={b.status} /></td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{TEN_TONG_HOP[tongHopXuatBan(b.lich)]}</td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{TEN_PHAN_LOAI[b.classification] ?? b.classification}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{gioVn(b.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={THE} aria-label="Nhật ký gần đây">
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Nhật ký gần đây</h2>
        {nk.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có hoạt động.</p> : (
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {nk.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 py-1.5">
                <span className="w-36 shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{gioVn(e.created_at)}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{TEN_HANH_DONG[e.action] ?? e.action}</span>
                <span className="text-slate-500 dark:text-slate-400">{e.nguoi ?? 'Hệ thống'}</span>
                {e.target_type === 'content' && <Link href={`/dashboard/ai-workspace/${e.target_id}`} className="ml-auto text-indigo-700 hover:underline dark:text-indigo-300">Mở bài</Link>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
