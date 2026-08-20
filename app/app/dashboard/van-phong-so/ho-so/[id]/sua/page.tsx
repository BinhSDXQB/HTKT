import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoDonViOptions } from '@/lib/office-scope'
import { CanBoProfileForm, type CanBoDefaults } from '@/components/van-phong-so/can-bo-profile-form'
import { Briefcase, ChevronRight, PencilLine } from 'lucide-react'

export const dynamic = 'force-dynamic'

function iso(d: Date | null): string | undefined {
  return d ? new Date(d).toISOString().slice(0, 10) : undefined
}
function str(v: string | number | null): string | undefined {
  return v == null ? undefined : String(v)
}

export default async function SuaCanBoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) redirect(`/dashboard/van-phong-so/ho-so/${id}`)

  const cb = await db.canBo.findUnique({ where: { id } })
  if (!cb) notFound()

  const [toChucOptions, chucDanhs] = await Promise.all([
    getSoDonViOptions(),
    db.chucDanh.findMany({ orderBy: { capQuanLy: 'asc' }, select: { id: true, ten: true } }),
  ])

  const defaults: CanBoDefaults = {
    id: cb.id,
    hoTen: cb.hoTen, cccd: cb.cccd, gioiTinh: cb.gioiTinh ?? undefined, ngaySinh: iso(cb.ngaySinh),
    toChucId: cb.toChucId ?? undefined, chucDanhId: cb.chucDanhId ?? undefined, chucVu: str(cb.chucVu),
    soDienThoai: str(cb.soDienThoai), email: str(cb.email),
    queQuanTruoc: str(cb.queQuanTruoc), queQuanSau: str(cb.queQuanSau),
    noiOTruoc: str(cb.noiOTruoc), noiOHienNay: str(cb.noiOHienNay), quangTriCuRa: str(cb.quangTriCuRa),
    doiTuong: cb.doiTuong ?? undefined, viTriViecLam: str(cb.viTriViecLam), loaiHopDong: str(cb.loaiHopDong), ngayKetThucHopDong: iso(cb.ngayKetThucHopDong),
    loaiHinh: str(cb.loaiHinh), ngayVaoBienChe: iso(cb.ngayVaoBienChe), boNhiemLanDau: str(cb.boNhiemLanDau),
    ngayBoNhiemGanNhat: iso(cb.ngayBoNhiemGanNhat),
    ngayVeHuu: iso(cb.ngayVeHuu),
    ngayNghiHuuLui: iso(cb.ngayNghiHuuLui),
    truongHopLui: cb.truongHopLui ?? undefined,
    vanBanLuiNghiHuu: cb.vanBanLuiNghiHuu ?? undefined,
    maNgach: str(cb.maNgach), bacLuong: str(cb.bacLuong), heSoLuong: str(cb.heSoLuong),
    phuCap: str(cb.phuCap), vuotKhung: str(cb.vuotKhung),
    ngayNangLuong: iso(cb.ngayNangLuong), ngachHienHuong: str(cb.ngachHienHuong), ngayBoNhiemNgach: iso(cb.ngayBoNhiemNgach),
    trinhDoChuyenMon: str(cb.trinhDoChuyenMon), chuyenNganh: str(cb.chuyenNganh),
    namTotNghiep: str(cb.namTotNghiep), heDaoTao: str(cb.heDaoTao),
    trinhDoQLNN: str(cb.trinhDoQLNN), namDaoTaoQLNN: str(cb.namDaoTaoQLNN),
    trinhDoLLCT: str(cb.trinhDoLLCT), namDaoTaoLLCT: str(cb.namDaoTaoLLCT),
    trinhDoNgoaiNgu: str(cb.trinhDoNgoaiNgu), namDaoTaoNgoaiNgu: str(cb.namDaoTaoNgoaiNgu),
    trinhDoTinHoc: str(cb.trinhDoTinHoc), namDaoTaoTinHoc: str(cb.namDaoTaoTinHoc),
    namDaoTaoCapPhong: str(cb.namDaoTaoCapPhong), namDaoTaoCapSo: str(cb.namDaoTaoCapSo),
    qpAn: str(cb.qpAn), namDaoTaoQPAN: str(cb.namDaoTaoQPAN),
    soTheDang: str(cb.soTheDang), ngayKetNapDang: iso(cb.ngayKetNapDang),
    ngayVaoDangChinhThuc: iso(cb.ngayVaoDangChinhThuc), chiBo: str(cb.chiBo),
    trangThai: cb.trangThai, ghiChu: str(cb.ghiChu),
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/van-phong-so/ho-so" className="hover:text-indigo-700">Hồ sơ cán bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="hover:text-indigo-700">{cb.hoTen}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Sửa hồ sơ</span>
      </nav>

      <div className="flex items-center gap-2">
        <PencilLine className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Sửa hồ sơ: {cb.hoTen}</h1>
      </div>

      <CanBoProfileForm defaults={defaults} toChucOptions={toChucOptions} chucDanhOptions={chucDanhs} />
    </div>
  )
}
