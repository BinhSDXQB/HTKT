import Link from 'next/link'
import { Baby, Trophy, ShieldCheck, AlertTriangle, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import {
  namHocHienTai, nhanNamHoc, tuoiCon, lopHienTai, nhanCapHoc, xetNguoiPhuThuoc, CAP_DO_LABEL,
} from '@/lib/con-can-bo'
import { CapNhatConForm, ThemThanhTichForm, XoaThanhTichButton, ThemConForm } from '@/components/van-phong-so/con-can-bo-forms'

export const dynamic = 'force-dynamic'

// Các cháu (con cán bộ) & thành tích học tập theo năm học. Danh sách nhập 1 lần (migration 046);
// tuổi/lớp tự tăng — mỗi năm học chỉ cần cập nhật thành tích (giấy khen, thi đạt giải cấp gì, môn gì).
export default async function CacChauPage({ searchParams }: { searchParams: Promise<{ namHoc?: string; q?: string; loc?: string }> }) {
  const sp = await searchParams
  const user = await requireOfficeAccess()
  const canEdit = canManageCanBo(user)
  const nay = new Date()
  const namHocNay = namHocHienTai(nay)
  const namHoc = Number(sp.namHoc) || namHocNay
  const q = (sp.q ?? '').trim().toLowerCase()
  const loc = sp.loc ?? ''

  const [ds, canBoDs] = await Promise.all([
    db.conCanBo.findMany({
      include: {
        canBo: { select: { id: true, hoTen: true, chucVu: true, toChuc: { select: { ten: true } } } },
        thanhTich: { orderBy: [{ namHoc: 'desc' }, { createdAt: 'asc' }] },
      },
      orderBy: [{ canBo: { hoTen: 'asc' } }, { namSinh: 'asc' }],
    }),
    canEdit
      ? db.canBo.findMany({ where: { trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } }, select: { id: true, hoTen: true, chucVu: true, ngaySinh: true, toChuc: { select: { ten: true } } }, orderBy: { hoTen: 'asc' } })
      : Promise.resolve([]),
  ])
  const canBoOpts = canBoDs.map((c) => ({ id: c.id, label: `${c.hoTen} — ${c.chucVu ?? ''}, ${c.toChuc?.ten ?? ''}${c.ngaySinh ? ` (sinh ${new Date(c.ngaySinh).getFullYear()})` : ''}` }))

  const rows = ds.map((c) => {
    const tuoi = tuoiCon(c, nay)
    const lop = lopHienTai(c, namHocNay)
    const npt = xetNguoiPhuThuoc(c, nay)
    const ttNam = c.thanhTich.filter((t) => t.namHoc === namHoc)
    return { c, tuoi, lop, npt, ttNam }
  }).filter(({ c, npt, ttNam }) => {
    if (q && !`${c.hoTen} ${c.canBo.hoTen}`.toLowerCase().includes(q)) return false
    if (loc === 'cho-xac-nhan') return !c.phuHuynhDaXacNhan || !!c.ghiChu
    if (loc === 'co-thanh-tich') return ttNam.length > 0
    if (loc === 'npt') return npt.duocTinh
    return true
  })

  const tong = ds.length
  const soPhuHuynh = new Set(ds.map((c) => c.canBoId)).size
  const soNPT = ds.filter((c) => xetNguoiPhuThuoc(c, nay).duocTinh).length
  const soChoXacNhan = ds.filter((c) => !c.phuHuynhDaXacNhan).length
  const ttNamAll = ds.flatMap((c) => c.thanhTich.filter((t) => t.namHoc === namHoc))
  const theoCap = Object.entries(CAP_DO_LABEL).map(([k, v]) => [v, ttNamAll.filter((t) => t.capDo === k).length] as const).filter(([, n]) => n > 0)
  const cacNamHoc = [...new Set([namHocNay, ...ds.flatMap((c) => c.thanhTich.map((t) => t.namHoc))])].sort((a, b) => b - a)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Baby className="w-6 h-6 text-pink-500" />Các cháu &amp; thành tích học tập</h1>
        <p className="text-sm text-slate-600 mt-1">
          Danh sách nhập một lần; tuổi và lớp <strong>tự tăng theo năm học</strong> — mỗi năm chỉ cần cập nhật thành tích (giấy khen, thi đạt giải cấp gì, môn gì).
          Cháu đủ điều kiện được tính <strong>người phụ thuộc</strong> khi tính thuế TNCN của phụ huynh (giảm trừ 6,2 triệu/người/tháng — NQ 110/2025/UBTVQH15).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={Baby} label="Số cháu" value={tong} />
        <Stat icon={Users} label="Phụ huynh" value={soPhuHuynh} />
        <Stat icon={ShieldCheck} label="Được tính người phụ thuộc" value={soNPT} />
        <Stat icon={AlertTriangle} label="Chờ xác nhận phụ huynh" value={soChoXacNhan} warn={soChoXacNhan > 0} />
        <Stat icon={Trophy} label={`Thành tích ${nhanNamHoc(namHoc)}`} value={ttNamAll.length} sub={theoCap.map(([k, n]) => `${k}: ${n}`).join(' · ')} />
      </div>

      <form className="flex flex-wrap items-end gap-2 rounded-xl border bg-white p-3">
        <label className="text-xs text-slate-600">Năm học
          <select name="namHoc" defaultValue={namHoc} className="block h-9 px-2 text-sm border rounded-lg bg-white mt-0.5">
            {cacNamHoc.map((n) => <option key={n} value={n}>{nhanNamHoc(n)}{n === namHocNay ? ' (hiện tại)' : ''}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-600">Lọc
          <select name="loc" defaultValue={loc} className="block h-9 px-2 text-sm border rounded-lg bg-white mt-0.5">
            <option value="">Tất cả</option>
            <option value="co-thanh-tich">Có thành tích năm học này</option>
            <option value="npt">Được tính người phụ thuộc</option>
            <option value="cho-xac-nhan">Cần xem lại / chờ xác nhận</option>
          </select>
        </label>
        <label className="text-xs text-slate-600">Tìm tên cháu / phụ huynh
          <input name="q" defaultValue={sp.q ?? ''} className="block h-9 px-2 text-sm border rounded-lg bg-white mt-0.5 w-64" />
        </label>
        <button className="h-9 px-4 rounded-lg bg-slate-800 text-white text-sm">Xem</button>
        {canEdit && <div className="ml-auto"><ThemConForm canBoOpts={canBoOpts} /></div>}
      </form>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Phụ huynh</th>
              <th className="px-3 py-2">Cháu</th>
              <th className="px-3 py-2 whitespace-nowrap">Tuổi · Lớp {nhanNamHoc(namHocNay)}</th>
              <th className="px-3 py-2">Thành tích {nhanNamHoc(namHoc)}</th>
              <th className="px-3 py-2">Người phụ thuộc</th>
              {canEdit && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ c, tuoi, lop, npt, ttNam }) => (
              <tr key={c.id} className="align-top hover:bg-slate-50/60">
                <td className="px-3 py-2">
                  <Link href={`/dashboard/van-phong-so/ho-so/${c.canBo.id}`} className="font-medium text-slate-900 hover:text-indigo-700">{c.canBo.hoTen}</Link>
                  <p className="text-xs text-slate-500">{c.canBo.chucVu ?? ''}{c.canBo.toChuc ? ` · ${c.canBo.toChuc.ten}` : ''}</p>
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-800">{c.hoTen}</p>
                  <p className="text-xs text-slate-500">sinh {c.ngaySinh ? new Date(c.ngaySinh).toLocaleDateString('vi-VN') : `${c.namSinh}${c.namSinhUocTinh ? ' (ước tính)' : ''}`}</p>
                  {c.ghiChu && <p className="text-xs text-amber-700 mt-0.5">⚠️ {c.ghiChu}</p>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-700">{tuoi} tuổi<br /><span className="text-xs text-slate-500">{nhanCapHoc(lop, tuoi)}</span></td>
                <td className="px-3 py-2">
                  {ttNam.length === 0 ? <span className="text-xs text-slate-400">—</span> : (
                    <ul className="space-y-1">
                      {ttNam.map((t) => (
                        <li key={t.id} className="text-xs flex items-start gap-1.5">
                          <span className={`shrink-0 px-1.5 py-0.5 rounded ${t.loai === 'DANH_HIEU' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                            {t.loai === 'DANH_HIEU' ? 'Danh hiệu' : t.capDo ? CAP_DO_LABEL[t.capDo] : 'Giải'}
                          </span>
                          <span className="text-slate-700">
                            {t.noiDung}
                            {(t.mon || t.xepGiai) && <span className="text-slate-400"> ({[t.mon, t.xepGiai].filter(Boolean).join(' · ')})</span>}
                            {t.coGiayKhen && <span className="text-emerald-700"> · có giấy khen</span>}
                          </span>
                          {canEdit && <XoaThanhTichButton id={t.id} />}
                        </li>
                      ))}
                    </ul>
                  )}
                  {canEdit && <div className="mt-1"><ThemThanhTichForm conId={c.id} namHoc={namHoc} /></div>}
                </td>
                <td className="px-3 py-2 text-xs max-w-[220px]">
                  <span className={npt.duocTinh ? 'text-emerald-700 font-medium' : 'text-slate-500'}>{npt.duocTinh ? '✓ Được tính' : '✗ Không tính'}</span>
                  <p className="text-slate-500">{npt.lyDo}</p>
                </td>
                {canEdit && (
                  <td className="px-3 py-2">
                    <CapNhatConForm
                      canBoOpts={canBoOpts}
                      con={{ id: c.id, canBoId: c.canBoId, hoTen: c.hoTen, gioiTinh: c.gioiTinh, ngaySinh: c.ngaySinh ? new Date(c.ngaySinh).toISOString().slice(0, 10) : null, dangKyNPT: c.dangKyNPT, phuHuynhDaXacNhan: c.phuHuynhDaXacNhan, ghiChu: c.ghiChu }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">Không có cháu nào phù hợp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Điều kiện người phụ thuộc: con dưới 18 tuổi; hoặc từ 18 tuổi đang học THPT/đại học/cao đẳng/trung cấp và thu nhập ≤ 1 triệu/tháng
        (TT 111/2013/TT-BTC Điều 9 — cần đối chiếu khi có hướng dẫn Luật Thuế TNCN 109/2025/QH15). Mỗi cháu chỉ được giảm trừ cho một phụ huynh.
      </p>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, warn }: { icon: React.ElementType; label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${warn ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <p className="text-xs text-slate-500 flex items-center gap-1"><Icon className="w-3.5 h-3.5" />{label}</p>
      <p className={`text-2xl font-bold ${warn ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}
