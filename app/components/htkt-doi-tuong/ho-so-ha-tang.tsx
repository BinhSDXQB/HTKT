'use client'

import { useMemo, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  Plus, Download, Map as MapIcon, Pencil, Trash2, Wand2, X, Save, AlertTriangle, Database, Loader2, Search, Link2,
} from 'lucide-react'
import {
  LINH_VUC, LINH_VUC_MAP, CAP_DUONG, PHAN_LOAI_DO_THI, SH_TRANG_THAI, CHU_CAI_SO_HIEU, TINH_TRANG,
  kyHieuCap, coQuanDatSoHieu, tachSoHieu, type LinhVuc, type KieuHinhHoc,
} from '@/lib/htkt-doi-tuong/danh-muc'
import type { DoiTuongDong, DaiSoHieu, CanhBao, XaInfo } from '@/lib/htkt-doi-tuong/truy-van'
import { luuDoiTuong, xoaDoiTuong, goiYSoHieu, napTuBieuMau, layHinhHoc, type DoiTuongForm, type KetQuaNap } from '@/app/actions/htkt-doi-tuong'
import type { HinhHocGeo } from './ban-do-ha-tang'

const BanDoHaTang = dynamic(() => import('./ban-do-ha-tang'), { ssr: false, loading: () => <div className="h-[420px] rounded-lg border bg-slate-50 animate-pulse" /> })

type Props = {
  xa: XaInfo
  ghi: boolean
  laSo: boolean
  dsBanDau: DoiTuongDong[]
  dai: DaiSoHieu | null
  canhBao: CanhBao[]
  streets: { id: string; code: string; name: string }[]
  chuaLienKet: { bang: string; nam: number; n: number }[]
}

const o = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100'
const nhanO = 'block text-xs font-medium text-slate-600 mb-1'
const fmt = (v: number | null, d = 3) => (v === null ? '' : v.toLocaleString('vi-VN', { maximumFractionDigits: d }))

function formRong(maXa: string, lv: LinhVuc, laPhuong: boolean): DoiTuongForm {
  return {
    maXa, linhVuc: lv, ten: '', tuyenDuongId: '', streetId: '', capDuong: lv === 'DUONG' ? (laPhuong ? 'DUONG_DO_THI' : 'DUONG_XA') : '',
    phanLoaiDoThi: '', thon: '', shSo: '', shChuCai: '', shTrangThai: '', shSoQd: '', shNgayQd: '',
    soHieuKhac: '', soHieuCu: '', tenCu: '', giaTri: {}, geometry: null, ghiChu: '',
  }
}

function formTu(d: DoiTuongDong, maXa: string): DoiTuongForm {
  const lv = LINH_VUC_MAP[d.linhVuc]
  const giaTri: Record<string, string | boolean> = {}
  const cot: Record<string, unknown> = {
    diem_dau: d.diemDau, diem_cuoi: d.diemCuoi, vi_tri: d.viTri, chieu_dai_m: d.chieuDaiM, be_rong_nen_m: d.beRongNenM,
    be_rong_mat_m: d.beRongMatM, ket_cau_mat: d.ketCauMat, dien_tich_m2: d.dienTichM2, so_luong: d.soLuong,
    nam_su_dung: d.namSuDung, tinh_trang: d.tinhTrang, don_vi_quan_ly: d.donViQuanLy, de_xuat_dieu_chinh: d.deXuatDieuChinh,
  }
  for (const tr of lv?.truong ?? []) {
    const v = tr.key.startsWith('ts.') ? d.thongSo[tr.key.slice(3)] : cot[tr.key]
    if (v === null || v === undefined) continue
    if (tr.kind === 'boolean') giaTri[tr.key] = v === true
    else if (typeof v === 'number' && tr.heSo) giaTri[tr.key] = String(Math.round((v / tr.heSo) * 1000) / 1000)
    else giaTri[tr.key] = String(v)
  }
  return {
    id: d.id, maXa, linhVuc: d.linhVuc as LinhVuc, ten: d.ten ?? '', tuyenDuongId: d.tuyenDuongId ?? '', streetId: d.streetId ?? '',
    capDuong: d.capDuong ?? '', phanLoaiDoThi: d.phanLoaiDoThi ?? '', thon: d.thon ?? '',
    shSo: d.shSo !== null ? String(d.shSo) : '', shChuCai: d.shChuCai ?? '', shTrangThai: (d.shTrangThai ?? '') as DoiTuongForm['shTrangThai'],
    shSoQd: d.shSoQd ?? '', shNgayQd: d.shNgayQd ?? '', soHieuKhac: d.soHieuKhac ?? '', soHieuCu: d.soHieuCu ?? '', tenCu: d.tenCu ?? '',
    giaTri, geometry: null, ghiChu: d.ghiChu ?? '',
  }
}

export default function HoSoHaTang({ xa, ghi, laSo, dsBanDau: ds, dai, canhBao, streets, chuaLienKet }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<LinhVuc | 'CANH_BAO'>('DUONG')
  const [tim, setTim] = useState('')
  const [hienBanDo, setHienBanDo] = useState(true)
  const [chonId, setChonId] = useState<string | null>(null)
  const [form, setForm] = useState<DoiTuongForm | null>(null)
  const [nap, setNap] = useState(false)
  const [phienBan, setPhienBan] = useState(0)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const demLv = useMemo(() => {
    const m: Record<string, number> = {}
    for (const d of ds) m[d.linhVuc] = (m[d.linhVuc] ?? 0) + 1
    return m
  }, [ds])
  const duong = useMemo(() => ds.filter((d) => d.linhVuc === 'DUONG'), [ds])
  const dsTab = useMemo(() => {
    const k = tim.trim().toLowerCase()
    return ds.filter((d) => d.linhVuc === tab && (!k || [d.maDoiTuong, d.ten, d.soHieuHienThi, d.diemDau, d.diemCuoi, d.viTri, d.tuyenTen, d.tuyenSoHieu, d.thon]
      .some((x) => x?.toLowerCase().includes(k))))
  }, [ds, tab, tim])
  const cbTheoId = useMemo(() => {
    const m = new Map<string, CanhBao[]>()
    for (const c of canhBao) m.set(c.id, [...(m.get(c.id) ?? []), c])
    return m
  }, [canhBao])

  const lamMoi = () => { router.refresh(); setPhienBan((v) => v + 1) }

  const moSua = (d: DoiTuongDong) => {
    start(async () => {
      const g = await layHinhHoc(xa.code, d.id)
      setForm({ ...formTu(d, xa.code), geometry: g })
    })
  }
  const xoa = (d: DoiTuongDong) => {
    if (!confirm(`Xoá ${d.maDoiTuong} — ${d.nhan ?? ''}?\nSố hiệu (nếu có) được giải phóng; lịch sử vẫn lưu.`)) return
    start(async () => {
      const r = await xoaDoiTuong(xa.code, d.id)
      if (!r.ok) alert(r.error)
      else { setThongBao(`Đã xoá ${d.maDoiTuong}`); lamMoi() }
    })
  }

  const lvHienTai = tab === 'CANH_BAO' ? null : LINH_VUC_MAP[tab]
  const tongNap = chuaLienKet.reduce((s, r) => s + r.n, 0)

  return (
    <div className="space-y-4">
      {/* ── Đầu trang: xã + dải số ── */}
      <div className="rounded-xl border bg-white p-4 flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{xa.name}</h1>
          <p className="text-sm text-slate-500">Mã ĐVHC <span className="font-mono">{xa.code}</span> · {ds.length} đối tượng HTKT trong hồ sơ</p>
          {dai ? (
            <div className="mt-3 grid sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                { k: 'ĐX.', ten: 'Đường xã', tu: dai.dxTu, den: dai.dxDen, dung: dai.dxDaDung, sc: dai.dxSucChua, goi: dai.goiYDx, ai: 'UBND tỉnh đặt' },
                { k: 'Đth.', ten: 'Đường thôn', tu: dai.dthTu, den: dai.dthDen, dung: dai.dthDaDung, sc: dai.dthSucChua, goi: dai.goiYDth, ai: 'UBND xã đặt' },
              ].map((x) => (
                <div key={x.k} className="rounded-lg border bg-slate-50 px-3 py-2">
                  <div className="flex justify-between text-xs text-slate-600"><span><b>{x.ten}</b> {x.k}{x.tu}–{x.k}{x.den}</span><span>{x.ai}</span></div>
                  <div className="h-1.5 bg-slate-200 rounded mt-1.5"><div className="h-1.5 bg-blue-600 rounded" style={{ width: `${Math.min(100, (x.dung / Math.max(1, x.den - x.tu + 1)) * 100)}%` }} /></div>
                  <div className="text-xs text-slate-500 mt-1">Đã dùng {x.dung}/{x.den - x.tu + 1} số tròn (tối đa {x.sc} kể cả chữ cái) · số trống tiếp theo: <b className="text-slate-800">{x.goi ?? 'hết'}</b></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500 max-w-xl">Phường không được giao dải số hiệu đường xã/thôn (Đ5 QĐ 56/2025/QĐ-UBND); đường trong phường là đường đô thị — phân nhóm theo Mẫu 03.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ghi && tab !== 'CANH_BAO' && (
            <button onClick={() => setForm(formRong(xa.code, tab, xa.laPhuong))} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Thêm {lvHienTai?.label.toLowerCase()}
            </button>
          )}
          {ghi && (
            <button onClick={() => setNap(true)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Nạp từ Biểu mẫu{tongNap ? <span className="ml-1 text-xs bg-amber-100 text-amber-800 rounded-full px-1.5">{tongNap}</span> : null}
            </button>
          )}
          <a href={`/api/export/htkt-doi-tuong?maXa=${xa.code}`} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Tải Excel lưu trữ
          </a>
          <button onClick={() => setHienBanDo((v) => !v)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50 flex items-center gap-1.5">
            <MapIcon className="w-4 h-4" /> {hienBanDo ? 'Ẩn' : 'Hiện'} bản đồ
          </button>
        </div>
      </div>

      {thongBao && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2 flex justify-between">
          <span>{thongBao}</span><button onClick={() => setThongBao(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Tab lĩnh vực ── */}
      <div className="flex flex-wrap gap-1.5">
        {LINH_VUC.map((lv) => (
          <button key={lv.value} onClick={() => setTab(lv.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${tab === lv.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 hover:border-slate-400'}`}>
            <span className="w-2 h-2 rounded-full" style={{ background: lv.mau }} />{lv.label}
            <span className={tab === lv.value ? 'text-slate-300' : 'text-slate-400'}>{demLv[lv.value] ?? 0}</span>
          </button>
        ))}
        <button onClick={() => setTab('CANH_BAO')}
          className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${tab === 'CANH_BAO' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'}`}>
          <AlertTriangle className="w-3.5 h-3.5" />Cảnh báo dữ liệu {canhBao.length}
        </button>
      </div>

      {hienBanDo && (
        <BanDoHaTang maXa={xa.code} cheDo="xem" phienBan={phienBan} chonId={chonId}
          onChon={(id) => { setChonId(id); const d = ds.find((x) => x.id === id); if (d) setTab(d.linhVuc as LinhVuc) }} />
      )}

      {tab === 'CANH_BAO' ? (
        <div className="rounded-xl border bg-white overflow-x-auto">
          {canhBao.length === 0 ? <p className="p-6 text-sm text-slate-500 text-center">Không có cảnh báo.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="text-left px-3 py-2">Mức</th><th className="text-left px-3 py-2">Đối tượng</th><th className="text-left px-3 py-2">Nội dung</th><th /></tr></thead>
              <tbody>{canhBao.map((c, i) => {
                const d = ds.find((x) => x.id === c.id)
                return (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${c.muc === 'cao' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{c.muc === 'cao' ? 'Cao' : 'TB'}</span></td>
                    <td className="px-3 py-2"><div className="font-mono text-xs text-slate-500">{c.maDoiTuong}</div>{c.nhan}</td>
                    <td className="px-3 py-2 text-slate-700">{c.noiDung}</td>
                    <td className="px-3 py-2">{ghi && d && <button onClick={() => moSua(d)} className="text-blue-700 text-xs hover:underline">Sửa</button>}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <div className="p-3 border-b flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm theo mã, tên, số hiệu, điểm đầu/cuối, thôn…" className="flex-1 text-sm outline-none" />
            <span className="text-xs text-slate-500">{dsTab.length} dòng</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Mã đối tượng</th>
                  {tab === 'DUONG' && <th className="text-left px-3 py-2">Số hiệu</th>}
                  <th className="text-left px-3 py-2">Tên</th>
                  <th className="text-left px-3 py-2">{tab === 'DUONG' ? 'Cấp' : lvHienTai?.trenTuyen ? 'Thuộc tuyến' : 'Vị trí'}</th>
                  <th className="text-left px-3 py-2">Điểm đầu → cuối</th>
                  <th className="text-right px-3 py-2">{tab === 'CONG_VIEN' || tab === 'BAI_DO_XE' ? 'Diện tích (m²)' : tab === 'DUONG' || tab === 'CHIEU_SANG' ? 'Dài (km)' : 'Dài (m)'}</th>
                  <th className="text-right px-3 py-2">Số lượng</th>
                  <th className="text-center px-3 py-2" title="Đã có hình học trên bản đồ / số dòng Biểu mẫu liên kết">GIS · BM</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dsTab.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    Chưa có dữ liệu. {ghi && <>Bấm “Thêm” hoặc “Nạp từ Biểu mẫu” để lấy dữ liệu đã báo cáo.</>}
                  </td></tr>
                )}
                {dsTab.map((d) => {
                  const cb = cbTheoId.get(d.id)
                  const kichThuoc = tab === 'CONG_VIEN' || tab === 'BAI_DO_XE' ? fmt(d.dienTichM2, 1)
                    : tab === 'DUONG' || tab === 'CHIEU_SANG' ? fmt(d.chieuDaiM === null ? null : d.chieuDaiM / 1000) : fmt(d.chieuDaiM, 1)
                  return (
                    <tr key={d.id} onClick={() => setChonId(d.id)} className={`border-t cursor-pointer ${chonId === d.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">{d.maDoiTuong}{cb && <AlertTriangle className="w-3.5 h-3.5 inline ml-1 text-amber-500" aria-label={cb.map((c) => c.noiDung).join('\n')} />}</td>
                      {tab === 'DUONG' && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          {d.soHieuHienThi ? <span className="font-semibold text-slate-900">{d.soHieuHienThi}</span> : <span className="text-slate-400">—</span>}
                          {d.shTrangThai && <div className={`text-[10px] inline-block ml-1 px-1.5 rounded ${SH_TRANG_THAI.find((s) => s.value === d.shTrangThai)?.mau}`}>{d.shTrangThai === 'HIEU_LUC' ? 'QĐ' : 'đề xuất'}</div>}
                        </td>
                      )}
                      <td className="px-3 py-2 text-slate-900">{d.ten ?? <span className="text-slate-400">(chưa đặt tên)</span>}{d.thon && <div className="text-xs text-slate-500">Thôn {d.thon}</div>}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {tab === 'DUONG' ? (CAP_DUONG.find((c) => c.value === d.capDuong)?.label ?? '') + (d.tuyenSoHieu || d.tuyenTen ? ` · nhánh của ${d.tuyenSoHieu ?? d.tuyenTen}` : '')
                          : lvHienTai?.trenTuyen ? (d.tuyenSoHieu || d.tuyenTen ? <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{d.tuyenSoHieu ?? d.tuyenTen}</span> : <span className="text-slate-400">—</span>)
                          : d.viTri}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{d.diemDau || d.diemCuoi ? `${d.diemDau ?? '…'} → ${d.diemCuoi ?? '…'}` : ''}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{kichThuoc}{d.lechChieuDaiPct !== null && Math.abs(d.lechChieuDaiPct) > 30 && <div className="text-[10px] text-amber-700">GIS lệch {d.lechChieuDaiPct}%</div>}</td>
                      <td className="px-3 py-2 text-right">{d.soLuong ?? ''}</td>
                      <td className="px-3 py-2 text-center text-xs whitespace-nowrap">{d.coGis ? '🗺️' : '·'} {d.soDongBaoCao || ''}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {ghi && <>
                          <button onClick={() => moSua(d)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Sửa"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => xoa(d)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Xoá"><Trash2 className="w-4 h-4" /></button>
                        </>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pending && !form && <div className="fixed bottom-4 right-4 bg-white border shadow rounded-lg px-3 py-2 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý…</div>}

      {form && (
        <FormDoiTuong
          f={form} xa={xa} laSo={laSo} duong={duong} streets={streets}
          onHuy={() => setForm(null)}
          onXong={(msg, tiep) => { setThongBao(msg); lamMoi(); setForm(tiep ? formRong(xa.code, form.linhVuc, xa.laPhuong) : null) }}
        />
      )}
      {nap && <NapBieuMau maXa={xa.code} chuaLienKet={chuaLienKet} onDong={() => setNap(false)} onXong={() => lamMoi()} />}
    </div>
  )
}

// ── Form nhập / sửa một đối tượng ───────────────────────────────────────────────────────────────────────
function FormDoiTuong({ f: f0, xa, laSo, duong, streets, onHuy, onXong }: {
  f: DoiTuongForm; xa: XaInfo; laSo: boolean; duong: DoiTuongDong[]; streets: Props['streets']
  onHuy: () => void; onXong: (msg: string, tiep: boolean) => void
}) {
  const [f, setF] = useState<DoiTuongForm>(f0)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangLuu, setDangLuu] = useState(false)
  const [goiY, setGoiY] = useState<string | null>(null)
  const lv = LINH_VUC_MAP[f.linhVuc]
  const [kieu, setKieu] = useState<KieuHinhHoc>(() => {
    const g = f0.geometry as HinhHocGeo | null
    if (g?.type === 'Point' || g?.type === 'MultiPoint') return 'diem'
    if (g?.type === 'Polygon' || g?.type === 'MultiPolygon') return 'vung'
    return lv.hinhHoc[0]
  })
  const [dan, setDan] = useState('')
  const set = <K extends keyof DoiTuongForm>(k: K, v: DoiTuongForm[K]) => setF((x) => ({ ...x, [k]: v }))
  const setGT = (k: string, v: string | boolean) => setF((x) => ({ ...x, giaTri: { ...x.giaTri, [k]: v } }))

  const laDuong = f.linhVuc === 'DUONG'
  const ky = kyHieuCap(f.capDuong)
  const dai = f.capDuong === 'DUONG_XA' ? [xa.dxTu, xa.dxDen] : f.capDuong === 'DUONG_THON' ? [xa.dthTu, xa.dthDen] : [null, null]
  const coDai = ky !== null && dai[0] !== null
  const soN = Number(f.shSo)
  const ngoaiDai = coDai && f.shSo !== '' && (!Number.isInteger(soN) || soN < (dai[0] as number) || soN > (dai[1] as number))
  const xemTruoc = coDai && f.shSo ? `${ky}${f.shSo}${f.shChuCai}` : null
  const khoaDx = !laSo && f.capDuong === 'DUONG_XA' && f0.shTrangThai === 'HIEU_LUC' && f0.capDuong === 'DUONG_XA'
  const duongCoSo = duong.filter((d) => d.shSo !== null && d.capDuong === f.capDuong && !d.shChuCai && d.id !== f.id)

  const layGoiY = async (soGoc?: number) => {
    const r = await goiYSoHieu(xa.code, f.capDuong, soGoc ?? null)
    if (!r) { setGoiY('Hết số trống trong dải'); return }
    setF((x) => ({ ...x, shSo: String(r.so), shChuCai: r.chuCai ?? '', shTrangThai: x.shTrangThai || 'DE_XUAT' }))
    setGoiY(`Đã điền ${r.kyHieu}`)
  }

  const dinhDangDan = () => {
    const so = (dan.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    const pts: [number, number][] = []
    for (let i = 0; i + 1 < so.length; i += 2) { const [a, b] = [so[i], so[i + 1]]; pts.push(a < 30 && b > 100 ? [b, a] : [a, b]) }
    if (!pts.length) { setLoi('Không đọc được toạ độ. Dán dạng "17.4612, 106.6021" mỗi điểm một dòng.'); return }
    const g = kieu === 'diem' ? { type: 'Point', coordinates: pts[0] }
      : kieu === 'tuyen' ? (pts.length >= 2 ? { type: 'LineString', coordinates: pts } : null)
      : (pts.length >= 3 ? { type: 'Polygon', coordinates: [[...pts, pts[0]]] } : null)
    if (!g) { setLoi('Chưa đủ số điểm cho dạng hình học đã chọn.'); return }
    set('geometry', g); setDan(''); setLoi(null)
  }

  const luu = async (tiep: boolean) => {
    setLoi(null)
    if (!f.ten.trim() && !(coDai && f.shSo) && !f.soHieuKhac.trim()) { setLoi('Nhập tên (hoặc số hiệu).'); return }
    if (ngoaiDai) { setLoi(`Số hiệu phải trong dải ${ky}${dai[0]}–${ky}${dai[1]}.`); return }
    setDangLuu(true)
    const r = await luuDoiTuong(f)
    setDangLuu(false)
    if (!r.ok) { setLoi(r.error ?? 'Không lưu được'); return }
    onXong(`Đã lưu ${r.maDoiTuong}`, tiep)
  }

  // Dán số hiệu kiểu "ĐX.15B" vào ô số → tự tách.
  const nhapSo = (v: string) => {
    const t = tachSoHieu(v)
    if (t && t.cap === f.capDuong) setF((x) => ({ ...x, shSo: String(t.so), shChuCai: t.chuCai ?? '' }))
    else set('shSo', v.replace(/[^\d]/g, ''))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-2 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl">
        <div className="flex items-center justify-between px-5 py-3 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: lv.mau }} />
            {f.id ? 'Sửa' : 'Thêm'} {lv.label.toLowerCase()} — {xa.name}
          </h3>
          <button onClick={onHuy} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className={nhanO}>Tên {laDuong && <span className="text-slate-400">(không bắt buộc với đường xã, thôn — Luật Đường bộ Đ11 k3)</span>}</label>
              <input className={o} value={f.ten} onChange={(e) => set('ten', e.target.value)} placeholder={laDuong ? 'vd: Đường Hùng Vương / Đường liên thôn 2' : ''} />
            </div>

            {laDuong && (
              <div className="rounded-lg border p-3 space-y-3 bg-slate-50/60">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={nhanO}>Cấp đường (QĐ 56 Đ3)</label>
                    <select className={o} value={f.capDuong} disabled={khoaDx}
                      onChange={(e) => setF((x) => ({ ...x, capDuong: e.target.value, ...(kyHieuCap(e.target.value) ? {} : { shSo: '', shChuCai: '', shTrangThai: '' }) }))}>
                      {CAP_DUONG.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {f.capDuong === 'DUONG_THON' || f.capDuong === 'DUONG_XA' ? (
                    <div><label className={nhanO}>Thôn / bản</label><input className={o} value={f.thon} onChange={(e) => set('thon', e.target.value)} /></div>
                  ) : f.capDuong === 'DUONG_DO_THI' ? (
                    <div>
                      <label className={nhanO}>Nhóm (Mẫu 03)</label>
                      <select className={o} value={f.phanLoaiDoThi} onChange={(e) => set('phanLoaiDoThi', e.target.value)}>
                        <option value="">— chọn —</option>
                        {PHAN_LOAI_DO_THI.map((p) => <option key={p.value} value={p.value}>{p.nhom}. {p.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div><label className={nhanO}>Số hiệu (QL./ĐT./ĐĐT.)</label><input className={o} value={f.soHieuKhac} onChange={(e) => set('soHieuKhac', e.target.value)} /></div>
                  )}
                </div>

                {ky && (coDai ? (
                  <div className="rounded-lg border border-blue-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Số hiệu {ky} <span className="font-normal text-slate-500 text-xs">dải của xã: {ky}{dai[0]}–{ky}{dai[1]} · {coQuanDatSoHieu(f.capDuong)} quyết định</span></span>
                      {xemTruoc && <span className={`text-lg font-bold ${ngoaiDai ? 'text-red-600' : 'text-blue-700'}`}>{xemTruoc}</span>}
                    </div>
                    <div className="grid grid-cols-[1fr_90px_auto] gap-2">
                      <input className={o} inputMode="numeric" placeholder={`${dai[0]}…${dai[1]} (bỏ trống nếu chưa đặt)`} value={f.shSo} disabled={khoaDx}
                        onChange={(e) => nhapSo(e.target.value)} />
                      <select className={o} value={f.shChuCai} disabled={khoaDx || !f.shSo} onChange={(e) => set('shChuCai', e.target.value)} title="Chữ cái cho đường thứ hai trở lên dùng chung số (Đ5 k1 điểm c)">
                        <option value="">—</option>
                        {CHU_CAI_SO_HIEU.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="button" disabled={khoaDx} onClick={() => layGoiY()} className="px-3 rounded-lg border border-blue-300 text-blue-700 text-sm hover:bg-blue-50 flex items-center gap-1 disabled:opacity-40">
                        <Wand2 className="w-4 h-4" />Gợi ý
                      </button>
                    </div>
                    {duongCoSo.length > 0 && !khoaDx && (
                      <select className={o} value="" onChange={(e) => e.target.value && layGoiY(Number(e.target.value))}>
                        <option value="">Dùng chung số với tuyến đã có (đường nhánh → chữ cái tiếp theo)…</option>
                        {duongCoSo.map((d) => <option key={d.id} value={d.shSo!}>{d.soHieu} — {d.ten ?? ''}</option>)}
                      </select>
                    )}
                    {goiY && <p className="text-xs text-blue-700">{goiY}</p>}
                    {ngoaiDai && <p className="text-xs text-red-600">Ngoài dải số của {xa.name}.</p>}
                    {f.shSo && (
                      <div className="grid grid-cols-3 gap-2">
                        <select className={o} value={f.shTrangThai || 'DE_XUAT'} disabled={khoaDx} onChange={(e) => set('shTrangThai', e.target.value as DoiTuongForm['shTrangThai'])}>
                          {SH_TRANG_THAI.map((s) => (
                            <option key={s.value} value={s.value} disabled={s.value === 'HIEU_LUC' && f.capDuong === 'DUONG_XA' && !laSo}>{s.label}</option>
                          ))}
                        </select>
                        <input className={o} placeholder="Số QĐ" value={f.shSoQd} disabled={khoaDx} onChange={(e) => set('shSoQd', e.target.value)} />
                        <input className={o} type="date" value={f.shNgayQd} disabled={khoaDx} onChange={(e) => set('shNgayQd', e.target.value)} />
                      </div>
                    )}
                    {f.capDuong === 'DUONG_XA' && !laSo && (
                      <p className="text-[11px] text-slate-500">{khoaDx ? 'Số hiệu đã được UBND tỉnh quyết định — chỉ Sở Xây dựng thay đổi.' : 'Xã đề xuất số hiệu đường xã; Sở Xây dựng chốt khi có quyết định của UBND tỉnh (Đ5 k2 điểm a).'}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">{xa.name} không có dải số {ky} theo Đ5 QĐ 56 — không đặt số hiệu.</p>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={nhanO}>Là nhánh của tuyến</label>
                    <select className={o} value={f.tuyenDuongId} onChange={(e) => set('tuyenDuongId', e.target.value)}>
                      <option value="">— không —</option>
                      {duong.filter((d) => d.id !== f.id).map((d) => <option key={d.id} value={d.id}>{d.soHieuHienThi ? `${d.soHieuHienThi} · ` : ''}{d.ten ?? d.maDoiTuong}</option>)}
                    </select>
                  </div>
                  {streets.length > 0 ? (
                    <div>
                      <label className={nhanO}>Tuyến đô thị (mạng lưới cũ)</label>
                      <select className={o} value={f.streetId} onChange={(e) => set('streetId', e.target.value)}>
                        <option value="">— không —</option>
                        {streets.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                      </select>
                    </div>
                  ) : <div />}
                  <div><label className={nhanO}>Số hiệu đường huyện cũ (Mẫu 02)</label><input className={o} placeholder="vd ĐH.12" value={f.soHieuCu} onChange={(e) => set('soHieuCu', e.target.value)} /></div>
                  <div><label className={nhanO}>Tên đường huyện cũ</label><input className={o} value={f.tenCu} onChange={(e) => set('tenCu', e.target.value)} /></div>
                </div>
              </div>
            )}

            {lv.trenTuyen && (
              <div>
                <label className={nhanO}>Nằm trên tuyến đường</label>
                <select className={o} value={f.tuyenDuongId} onChange={(e) => set('tuyenDuongId', e.target.value)}>
                  <option value="">— chưa gắn —</option>
                  {duong.map((d) => <option key={d.id} value={d.id}>{d.soHieuHienThi ? `${d.soHieuHienThi} · ` : ''}{d.ten ?? d.maDoiTuong}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {lv.truong.map((tr) => (
                <div key={tr.key} className={tr.rong || tr.kind === 'textarea' ? 'col-span-2' : ''}>
                  <label className={nhanO}>{tr.label}{tr.unit ? ` (${tr.unit})` : ''}</label>
                  {tr.kind === 'select' ? (
                    <select className={o} value={String(f.giaTri[tr.key] ?? '')} onChange={(e) => setGT(tr.key, e.target.value)}>
                      <option value="">—</option>
                      {(tr.key === 'tinh_trang' ? TINH_TRANG : tr.options ?? []).map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                      {f.giaTri[tr.key] && !(tr.key === 'tinh_trang' ? TINH_TRANG : tr.options ?? []).some((x) => x.value === f.giaTri[tr.key]) &&
                        <option value={String(f.giaTri[tr.key])}>{String(f.giaTri[tr.key])} (dữ liệu cũ)</option>}
                    </select>
                  ) : tr.kind === 'boolean' ? (
                    <label className="flex items-center gap-2 text-sm py-2"><input type="checkbox" checked={f.giaTri[tr.key] === true} onChange={(e) => setGT(tr.key, e.target.checked)} />Có</label>
                  ) : tr.kind === 'textarea' ? (
                    <textarea className={o} rows={2} value={String(f.giaTri[tr.key] ?? '')} onChange={(e) => setGT(tr.key, e.target.value)} />
                  ) : (
                    <input className={o} inputMode={tr.kind === 'text' ? 'text' : 'decimal'} value={String(f.giaTri[tr.key] ?? '')} onChange={(e) => setGT(tr.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            <div><label className={nhanO}>Ghi chú</label><textarea className={o} rows={2} value={f.ghiChu} onChange={(e) => set('ghiChu', e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Vị trí trên bản đồ (WGS84)</span>
              {lv.hinhHoc.length > 1 && (
                <div className="flex gap-1">
                  {lv.hinhHoc.map((k) => (
                    <button key={k} type="button" onClick={() => { setKieu(k); set('geometry', null) }}
                      className={`text-xs px-2 py-1 rounded border ${kieu === k ? 'bg-slate-900 text-white' : 'bg-white'}`}>{{ tuyen: 'Tuyến', diem: 'Điểm', vung: 'Vùng' }[k]}</button>
                  ))}
                </div>
              )}
            </div>
            <BanDoHaTang key={`${f.id ?? 'moi'}-${kieu}`} maXa={xa.code} cheDo="sua" kieu={kieu} boQuaId={f.id ?? null} cao="h-[380px]"
              giaTri={f.geometry as HinhHocGeo | null} onChange={(g) => setF((x) => (JSON.stringify(x.geometry) === JSON.stringify(g) ? x : { ...x, geometry: g }))} />
            <div className="flex gap-2">
              <textarea className={`${o} text-xs`} rows={2} value={dan} onChange={(e) => setDan(e.target.value)}
                placeholder={'Hoặc dán toạ độ (Google Maps "17.4612, 106.6021"), mỗi điểm một dòng'} />
              <button type="button" onClick={dinhDangDan} disabled={!dan.trim()} className="px-3 rounded-lg border text-sm hover:bg-slate-50 disabled:opacity-40">Áp dụng</button>
            </div>
            <p className="text-[11px] text-slate-500">Chiều dài/diện tích đo GIS và % nằm ngoài ranh xã được hệ thống tự tính khi lưu và đối chiếu với số khai báo.</p>
          </div>
        </div>

        {loi && <div className="mx-5 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{loi}</div>}
        <div className="px-5 py-3 border-t flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onHuy} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Huỷ</button>
          {!f.id && <button disabled={dangLuu} onClick={() => luu(true)} className="px-4 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50">Lưu & thêm tiếp</button>}
          <button disabled={dangLuu} onClick={() => luu(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
            {dangLuu ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Nạp từ 7 Biểu mẫu ───────────────────────────────────────────────────────────────────────────────────
function NapBieuMau({ maXa, chuaLienKet, onDong, onXong }: {
  maXa: string; chuaLienKet: Props['chuaLienKet']; onDong: () => void; onXong: () => void
}) {
  const nams = [...new Set(chuaLienKet.map((r) => r.nam))].sort((a, b) => b - a)
  const [nam, setNam] = useState<number>(nams[0] ?? new Date().getFullYear())
  const [kq, setKq] = useState<KetQuaNap | null>(null)
  const [dang, setDang] = useState(false)
  const theoNam = chuaLienKet.filter((r) => r.nam === nam)

  const chay = async () => {
    setDang(true)
    const r = await napTuBieuMau(maXa, nam)
    setDang(false)
    setKq(r)
    if (r.ok) onXong()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-bold text-slate-900">Nạp dữ liệu từ 7 Biểu mẫu đã báo cáo</h3>
          <button onClick={onDong} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto text-sm">
          <p className="text-slate-600">
            Mỗi dòng Biểu mẫu chưa liên kết sẽ được gắn với một hồ sơ gốc (tạo mới nếu chưa có cùng tên + điểm đầu + điểm cuối).
            Chiếu sáng, cây xanh, thoát nước, cấp nước tự gắn vào tuyến đường cùng tên. Thoát nước tự phân loại mưa/thải/chung;
            dòng không rõ loại nước sẽ được liệt kê để xã tự nhập.
          </p>
          {nams.length === 0 ? <p className="text-emerald-700">Mọi dòng Biểu mẫu đã được liên kết.</p> : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Năm báo cáo:</span>
                {nams.map((n) => <button key={n} onClick={() => setNam(n)} className={`text-xs px-2.5 py-1 rounded border ${n === nam ? 'bg-slate-900 text-white' : ''}`}>{n}</button>)}
              </div>
              <ul className="text-xs text-slate-700 grid grid-cols-2 gap-1">
                {theoNam.map((r) => <li key={r.bang} className="flex justify-between border rounded px-2 py-1"><span>{r.bang}</span><b>{r.n}</b></li>)}
              </ul>
            </>
          )}
          {kq && (kq.ok ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 space-y-1">
              <p>Tạo mới <b>{kq.taoMoi}</b> hồ sơ · liên kết vào hồ sơ có sẵn <b>{kq.lienKet}</b> dòng · tự gắn tuyến đường <b>{kq.ganTuyen}</b>{kq.ganStreet ? <> · gắn tuyến đô thị <b>{kq.ganStreet}</b></> : null}</p>
              {Object.keys(kq.theoLinhVuc).length > 0 && (
                <p className="text-xs">{Object.entries(kq.theoLinhVuc).map(([k, v]) => `${LINH_VUC_MAP[k]?.label ?? k}: ${v}`).join(' · ')}</p>
              )}
              {kq.boQua.length > 0 && (
                <details className="text-xs text-amber-800">
                  <summary className="cursor-pointer">{kq.boQua.length} dòng chưa nạp (cần xã nhập tay)</summary>
                  <ul className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">{kq.boQua.map((b, i) => <li key={i}>• [{b.bang}] {b.ten} — {b.lyDo}</li>)}</ul>
                </details>
              )}
            </div>
          ) : <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">{kq.error}</div>)}
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onDong} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Đóng</button>
          {nams.length > 0 && (
            <button onClick={chay} disabled={dang || theoNam.length === 0} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              {dang ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}Nạp năm {nam}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
