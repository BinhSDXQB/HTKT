import Link from 'next/link'
import { ChevronRight, Map, Maximize2, Users2, Building2 } from 'lucide-react'
import { db } from '@/lib/db'
import { DvhcTable, type DvhcRow } from '@/components/phong-htkt/dvhc-table'

export const dynamic = 'force-dynamic'

function loaiCua(name: string): DvhcRow['loai'] {
  if (name.startsWith('Phường')) return 'Phường'
  if (name.startsWith('Đặc khu')) return 'Đặc khu'
  return 'Xã'
}

const nf = new Intl.NumberFormat('vi-VN')
const fmtDt = (n: number) => n.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function Page() {
  const units = await db.administrativeUnit.findMany({
    where: { type: 'PHUONG_XA' },
    select: { code: true, name: true, dienTichKm2: true, danSo: true, trungTamHc: true, truocSapNhap: true },
    orderBy: { name: 'asc' },
  })

  const rows: DvhcRow[] = units.map((u) => ({
    code: u.code,
    name: u.name,
    loai: loaiCua(u.name),
    dienTichKm2: u.dienTichKm2 ? Number(u.dienTichKm2) : 0,
    danSo: u.danSo ?? 0,
    trungTamHc: u.trungTamHc,
    truocSapNhap: u.truocSapNhap,
  }))

  const tongDt = rows.reduce((s, r) => s + r.dienTichKm2, 0)
  const tongDs = rows.reduce((s, r) => s + r.danSo, 0)
  const soPhuong = rows.filter((r) => r.loai === 'Phường').length
  const soXa = rows.filter((r) => r.loai === 'Xã').length
  const soDacKhu = rows.filter((r) => r.loai === 'Đặc khu').length

  const cards = [
    { icon: Building2, label: 'Đơn vị cấp xã', value: nf.format(rows.length), sub: `${soPhuong} phường · ${soXa} xã · ${soDacKhu} đặc khu` },
    { icon: Maximize2, label: 'Tổng diện tích', value: `${fmtDt(tongDt)} km²`, sub: 'Diện tích tự nhiên toàn tỉnh' },
    { icon: Users2, label: 'Tổng dân số', value: nf.format(tongDs), sub: 'người' },
    { icon: Map, label: 'Mật độ trung bình', value: `${nf.format(Math.round(tongDt > 0 ? tongDs / tongDt : 0))}`, sub: 'người/km²' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Đơn vị hành chính (diện tích – dân số)</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <Map className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Đơn vị hành chính tỉnh Quảng Trị</h1>
          <p className="text-sm text-slate-500">
            Thống kê diện tích – dân số 78 phường/xã/đặc khu sau sắp xếp (NQ 1680/NQ-UBTVQH15)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <c.icon className="w-4 h-4 text-cyan-600" /> {c.label}
            </div>
            <div className="text-lg font-bold text-slate-900">{c.value}</div>
            <div className="text-[11px] text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>

      <DvhcTable rows={rows} />

      <p className="text-xs text-slate-400 mt-6">
        Nguồn: <a className="underline" href="https://sapnhap.bando.com.vn/" target="_blank" rel="noreferrer">sapnhap.bando.com.vn</a> (Bộ Nông nghiệp & Môi trường),
        căn cứ Nghị quyết 1680/NQ-UBTVQH15; mã ĐVHC theo Quyết định 19/2025/QĐ-TTg. Số liệu lưu tại
        bảng <code>administrative_units</code>.
      </p>
    </div>
  )
}
