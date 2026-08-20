'use client'

import { useEffect, useState } from 'react'
import {
  FolderOpen, Folder, ChevronRight, Loader2, Search, AlertTriangle,
  FileText, CheckCircle2, HelpCircle, XCircle, Home, Table2, Info,
} from 'lucide-react'

type Goc = { id: string; nhan: string; duongDan: string; truyCapDuoc: boolean }
type QuyTrinh = { key: string; ten: string; soThanhPhan: number }
type FileHoSo = {
  ten: string; duongDanTuongDoi: string; duoi: string; kichThuoc: number
  nhom: string; doTinCay: string; lyDo: string; trichYeu?: string; ghiChuDoc?: string
}
type DoiChieuTP = {
  thanhPhan: string; nhomSuyRa: string | null
  trangThai: 'TIM_THAY' | 'CAN_XAC_NHAN' | 'CHUA_TIM_THAY'
  ungVien: string[]; ghiChu: string
}
type UngVienTien = {
  tep: string; sheet: string; o: string; nhan: string
  giaTri: number | null; hienThi: string; donViPhatHien: string | null; laCongThuc: boolean
}
type KetQua = {
  thuMuc: { goc: string; duongDanCon: string }
  quyTrinh: { key: string; ten: string; hoSo: string[] }
  tongFile: number
  theoNhom: Record<string, number>
  chamNguong: string[]
  files: FileHoSo[]
  doiChieu: DoiChieuTP[]
  duToan: { ungVien: UngVienTien[]; tepDaDoc: string[]; canhBao: string[] }
  thongKeDoc: { daDoc: number; tongByte: number }
  thoiGianMs: number
}

const NHAN_NHOM: Record<string, string> = {
  TO_TRINH: 'Tờ trình', THUYET_MINH: 'Thuyết minh', BAN_VE: 'Bản vẽ',
  DU_TOAN: 'Dự toán / TMĐT', PHAP_LY: 'Văn bản pháp lý', KHAO_SAT: 'Khảo sát',
  NANG_LUC: 'Hồ sơ năng lực', KHAC: 'Khác',
}

const TT_META = {
  TIM_THAY:      { nhan: 'Tìm thấy ứng viên', icon: CheckCircle2, mau: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  CAN_XAC_NHAN:  { nhan: 'Cần xác nhận',      icon: HelpCircle,   mau: 'text-amber-700 bg-amber-50 border-amber-200' },
  CHUA_TIM_THAY: { nhan: 'Chưa tìm thấy',     icon: XCircle,      mau: 'text-rose-700 bg-rose-50 border-rose-200' },
} as const

function coChu(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export function KiemKeHoSo() {
  const [gocs, setGocs] = useState<Goc[]>([])
  const [quyTrinhs, setQuyTrinhs] = useState<QuyTrinh[]>([])
  const [chuaCauHinh, setChuaCauHinh] = useState(false)
  const [rootId, setRootId] = useState('')
  const [duongDanCon, setDuongDanCon] = useState('')
  const [thuMucCon, setThuMucCon] = useState<{ ten: string; duongDanCon: string }[]>([])
  const [soFileTrucTiep, setSoFileTrucTiep] = useState(0)
  const [quyTrinh, setQuyTrinh] = useState('')
  const [dangDuyet, setDangDuyet] = useState(false)
  const [dangQuet, setDangQuet] = useState(false)
  const [loi, setLoi] = useState('')
  const [kq, setKq] = useState<KetQua | null>(null)

  useEffect(() => {
    fetch('/api/htkt/tham-dinh-ho-so?hanhDong=goc')
      .then((r) => r.json())
      .then((d) => {
        setGocs(d.goc ?? [])
        setQuyTrinhs(d.quyTrinh ?? [])
        setChuaCauHinh(!!d.chuaCauHinh)
        const dau = (d.goc ?? []).find((g: Goc) => g.truyCapDuoc)
        if (dau) setRootId(dau.id)
        if ((d.quyTrinh ?? []).length) setQuyTrinh(d.quyTrinh[0].key)
      })
      .catch(() => setLoi('Không tải được cấu hình thư mục'))
  }, [])

  async function duyet(dc: string) {
    if (!rootId) return
    setDangDuyet(true); setLoi('')
    try {
      const r = await fetch(`/api/htkt/tham-dinh-ho-so?hanhDong=duyet&rootId=${encodeURIComponent(rootId)}&duongDanCon=${encodeURIComponent(dc)}`)
      const d = await r.json()
      if (!r.ok) { setLoi(d.error ?? 'Không duyệt được thư mục'); return }
      setDuongDanCon(dc); setThuMucCon(d.thuMucCon ?? []); setSoFileTrucTiep(d.soFileTrucTiep ?? 0)
    } finally { setDangDuyet(false) }
  }

  useEffect(() => { if (rootId) duyet('') /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [rootId])

  async function quet() {
    setDangQuet(true); setLoi(''); setKq(null)
    try {
      const r = await fetch('/api/htkt/tham-dinh-ho-so', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootId, duongDanCon, quyTrinh }),
      })
      const d = await r.json()
      if (!r.ok) { setLoi(d.error ?? 'Quét thất bại'); return }
      setKq(d)
    } catch { setLoi('Lỗi kết nối máy chủ') } finally { setDangQuet(false) }
  }

  const mucBreadcrumb = duongDanCon ? duongDanCon.split('/') : []

  if (chuaCauHinh) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />Chưa cấu hình thư mục hồ sơ
        </p>
        <p className="text-sm text-amber-800 mt-2">
          Quản trị viên cần khai biến <code className="bg-white px-1 rounded">THAM_DINH_ROOTS</code> trong tệp
          <code className="bg-white px-1 rounded mx-1">.env</code>, ví dụ:
        </p>
        <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-x-auto">THAM_DINH_ROOTS=&quot;Hồ sơ thẩm định|G:\HoSo_ThamDinh;Lưu trữ|E:\LuuTru&quot;</pre>
        <p className="text-xs text-amber-700 mt-2">
          Chỉ những thư mục khai ở đây mới được phép đọc. Sau khi sửa .env phải khởi động lại ứng dụng.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Chọn nguồn hồ sơ ─────────────────────────────────── */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-cyan-600" />Chọn thư mục hồ sơ dự án
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Kho hồ sơ</label>
            <select
              value={rootId} onChange={(e) => { setRootId(e.target.value); setKq(null) }}
              className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {gocs.map((g) => (
                <option key={g.id} value={g.id} disabled={!g.truyCapDuoc}>
                  {g.nhan}{g.truyCapDuoc ? '' : ' — máy chủ không truy cập được'}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Quy trình thẩm định</label>
            <select
              value={quyTrinh} onChange={(e) => { setQuyTrinh(e.target.value); setKq(null) }}
              className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {quyTrinhs.map((q) => <option key={q.key} value={q.key}>{q.ten} ({q.soThanhPhan} thành phần)</option>)}
            </select>
          </div>
        </div>

        {/* Đường dẫn đang đứng */}
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <button onClick={() => duyet('')} className="flex items-center gap-1 text-cyan-700 hover:underline">
            <Home className="w-3.5 h-3.5" />{gocs.find((g) => g.id === rootId)?.nhan ?? 'Gốc'}
          </button>
          {mucBreadcrumb.map((m, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => duyet(mucBreadcrumb.slice(0, i + 1).join('/'))}
                className="text-cyan-700 hover:underline"
              >{m}</button>
            </span>
          ))}
        </div>

        {/* Danh sách thư mục con */}
        <div className="rounded-lg border bg-slate-50 max-h-56 overflow-y-auto">
          {dangDuyet ? (
            <p className="p-3 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Đang đọc…</p>
          ) : thuMucCon.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Không có thư mục con. {soFileTrucTiep > 0 && `Thư mục này có ${soFileTrucTiep} tệp — có thể kiểm kê ngay.`}</p>
          ) : (
            <ul className="divide-y">
              {thuMucCon.map((t) => (
                <li key={t.duongDanCon}>
                  <button onClick={() => duyet(t.duongDanCon)} className="w-full text-left px-3 py-2 text-sm hover:bg-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />{t.ten}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {soFileTrucTiep > 0 && thuMucCon.length > 0 && (
          <p className="text-xs text-slate-500">Thư mục hiện tại có {soFileTrucTiep} tệp trực tiếp (chưa tính thư mục con).</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={quet} disabled={dangQuet || !rootId || !quyTrinh}
            className="h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2"
          >
            {dangQuet ? <><Loader2 className="w-4 h-4 animate-spin" />Đang kiểm kê…</> : <><Search className="w-4 h-4" />Kiểm kê hồ sơ</>}
          </button>
          <span className="text-xs text-slate-500">Đọc tệp trong thư mục đang đứng và toàn bộ thư mục con.</span>
        </div>

        {loi && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{loi}</p>}
      </div>

      {kq && <KetQuaView kq={kq} />}
    </div>
  )
}

function KetQuaView({ kq }: { kq: KetQua }) {
  const [nhomLoc, setNhomLoc] = useState<string>('')
  const files = nhomLoc ? kq.files.filter((f) => f.nhom === nhomLoc) : kq.files

  return (
    <div className="space-y-4">
      {/* Cảnh báo tính chất kết quả — quan trọng nhất, luôn hiện đầu tiên */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm text-sky-900 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Đây là <strong>kết quả kiểm kê tự động để hỗ trợ rà soát</strong>, không phải kết luận hồ sơ đủ hay thiếu.
            Việc phân loại dựa vào tên tệp và dấu hiệu trong nội dung nên có thể sai — nhất là với tệp scan gộp
            nhiều thành phần. Cán bộ thẩm định phải mở kiểm tra và tự kết luận.
          </span>
        </p>
      </div>

      {/* Tóm tắt */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <p className="font-semibold text-slate-900">{kq.quyTrinh.ten}</p>
          <p className="text-xs text-slate-500">
            {kq.tongFile} tệp · đã bóc nội dung {kq.thongKeDoc.daDoc} tệp · {(kq.thoiGianMs / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setNhomLoc('')} className={`text-xs px-2.5 py-1 rounded-lg border ${!nhomLoc ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600'}`}>
            Tất cả ({kq.tongFile})
          </button>
          {Object.entries(kq.theoNhom).filter(([, n]) => n > 0).map(([k, n]) => (
            <button key={k} onClick={() => setNhomLoc(k === nhomLoc ? '' : k)}
              className={`text-xs px-2.5 py-1 rounded-lg border ${nhomLoc === k ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 hover:border-cyan-300'}`}>
              {NHAN_NHOM[k] ?? k} ({n})
            </button>
          ))}
        </div>
        {kq.chamNguong.length > 0 && (
          <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
            ⚠️ Đã chạm giới hạn quét ({kq.chamNguong.join(', ')}) — kết quả có thể chưa bao hết thư mục. Hãy chọn thư mục dự án cụ thể hơn.
          </p>
        )}
      </div>

      {/* Đối chiếu thành phần hồ sơ */}
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-cyan-600" />Đối chiếu thành phần hồ sơ theo quy trình
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b">
                <th className="py-2 pr-3 font-semibold">Thành phần theo quy định</th>
                <th className="py-2 pr-3 font-semibold whitespace-nowrap">Trạng thái</th>
                <th className="py-2 font-semibold">Tệp ứng viên / ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kq.doiChieu.map((d, i) => {
                const meta = TT_META[d.trangThai]
                const Icon = meta.icon
                return (
                  <tr key={i} className="align-top">
                    <td className="py-2.5 pr-3 text-slate-700">{d.thanhPhan}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border whitespace-nowrap ${meta.mau}`}>
                        <Icon className="w-3 h-3" />{meta.nhan}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {d.ungVien.length > 0 && (
                        <ul className="mb-1 space-y-0.5">
                          {d.ungVien.slice(0, 6).map((u) => (
                            <li key={u} className="font-mono text-xs text-slate-700 break-all">{u}</li>
                          ))}
                          {d.ungVien.length > 6 && <li className="text-xs text-slate-400">… và {d.ungVien.length - 6} tệp khác</li>}
                        </ul>
                      )}
                      <p className="text-xs text-slate-500">{d.ghiChu}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Số liệu dự toán */}
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
          <Table2 className="w-4 h-4 text-cyan-600" />Số liệu đọc được từ tệp dự toán
        </p>
        <p className="text-xs text-slate-500 mb-3">
          Hệ thống <strong>không chọn giúp</strong> con số nào. Dưới đây là mọi ô có nhãn tổng, kèm nguồn đầy đủ để cán bộ tự đối chiếu.
        </p>

        {kq.duToan.canhBao.map((c, i) => (
          <p key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">⚠️ {c}</p>
        ))}

        {kq.duToan.ungVien.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa đọc được số liệu nào từ tệp bảng tính.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b">
                  <th className="py-2 pr-3 font-semibold">Nhãn trong tệp</th>
                  <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">Giá trị</th>
                  <th className="py-2 pr-3 font-semibold whitespace-nowrap">Đơn vị ghi</th>
                  <th className="py-2 font-semibold">Nguồn</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {kq.duToan.ungVien.slice(0, 25).map((u, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3 text-slate-700">{u.nhan}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums whitespace-nowrap text-slate-900">
                      {u.giaTri === null ? <span className="text-amber-700 text-xs">{u.hienThi}</span> : u.hienThi}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600 whitespace-nowrap">{u.donViPhatHien ?? 'không ghi'}</td>
                    <td className="py-2 text-xs font-mono text-slate-500 break-all">{u.tep} · {u.sheet}!{u.o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danh sách tệp */}
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm font-semibold text-slate-800 mb-3">
          Danh sách tệp {nhomLoc && `— ${NHAN_NHOM[nhomLoc] ?? nhomLoc}`} ({files.length})
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b">
                <th className="py-2 pr-3 font-semibold">Tệp</th>
                <th className="py-2 pr-3 font-semibold whitespace-nowrap">Xếp nhóm</th>
                <th className="py-2 pr-3 font-semibold text-right whitespace-nowrap">Cỡ</th>
                <th className="py-2 font-semibold">Căn cứ xếp nhóm / nội dung</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {files.map((f) => (
                <tr key={f.duongDanTuongDoi} className="align-top">
                  <td className="py-2 pr-3 font-mono text-xs text-slate-700 break-all">{f.duongDanTuongDoi}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className="text-xs text-slate-700">{NHAN_NHOM[f.nhom] ?? f.nhom}</span>
                    <span className={`block text-[11px] ${f.doTinCay === 'cao' ? 'text-emerald-600' : f.doTinCay === 'thap' ? 'text-rose-600' : 'text-amber-600'}`}>
                      tin cậy {f.doTinCay}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-xs text-slate-500 tabular-nums whitespace-nowrap">{coChu(f.kichThuoc)}</td>
                  <td className="py-2 text-xs text-slate-500">
                    <span className="block">{f.lyDo}</span>
                    {f.ghiChuDoc && <span className="block text-amber-700 mt-0.5">⚠️ {f.ghiChuDoc}</span>}
                    {f.trichYeu && <span className="block text-slate-600 mt-0.5 line-clamp-2">{f.trichYeu}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
