import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { FileSpreadsheet, Plus, Upload, ChevronRight, BarChart3, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getWardReportPerms } from '@/lib/ward-report-perms'

const CATEGORY_LABEL: Record<string, string> = {
  DUONG: 'Đường giao thông',
  DIEN_CHIEU_SANG: 'Điện chiếu sáng',
  CAY_XANH: 'Cây xanh',
  CONG_VIEN: 'Công viên',
  DIEN_TONG_HOP: 'Điện tổng hợp',
  THOAT_NUOC_BC: 'Thoát nước',
  CAP_NUOC_BC: 'Cấp nước',
  KHAC: 'Bãi đỗ xe',
}

const CATEGORY_COLOR: Record<string, string> = {
  DUONG: 'bg-blue-100 text-blue-700',
  DIEN_CHIEU_SANG: 'bg-yellow-100 text-yellow-700',
  CAY_XANH: 'bg-green-100 text-green-700',
  CONG_VIEN: 'bg-emerald-100 text-emerald-700',
  DIEN_TONG_HOP: 'bg-amber-100 text-amber-700',
  THOAT_NUOC_BC: 'bg-indigo-100 text-indigo-700',
  CAP_NUOC_BC: 'bg-cyan-100 text-cyan-700',
  KHAC: 'bg-slate-100 text-slate-600',
}

type SP = { wardId?: string; year?: string; category?: string; vungClass?: string }

export default async function DuLieuPhuongXaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireAuth()
  const sp = await searchParams
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  const where: Record<string, unknown> = {}
  // Phường/xã: chỉ xem data của mình
  if (perms.limitWardId) {
    where.wardId = perms.limitWardId
  } else {
    if (sp.wardId) where.wardId = sp.wardId
  }
  if (sp.year) where.year = parseInt(sp.year)
  if (sp.category) where.category = sp.category

  const [reports, wards, years] = await Promise.all([
    db.wardReport.findMany({
      where,
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        ward: { select: { name: true, trungTamHc: true, truocSapNhap: true } },
        createdBy: { select: { name: true } },
      },
    }),
    db.administrativeUnit.findMany({
      where: { type: 'PHUONG_XA', isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    db.wardReport.groupBy({ by: ['year'], orderBy: { year: 'desc' } }),
  ])

  // Lọc theo phân loại vùng (Vùng lõi / Vùng khác)
  let filteredReports = reports
  if (sp.vungClass === 'core') {
    filteredReports = reports.filter(r => {
      const w = r.ward
      if (!w) return false
      return w.name.startsWith('Phường') ||
        !!(w.trungTamHc && (w.trungTamHc.toLowerCase().includes('thị trấn') || w.trungTamHc.toLowerCase().includes('thị xã'))) ||
        !!(w.truocSapNhap && (w.truocSapNhap.toLowerCase().includes('thị trấn') || w.truocSapNhap.toLowerCase().includes('thị xã')))
    })
  } else if (sp.vungClass === 'other') {
    filteredReports = reports.filter(r => {
      const w = r.ward
      if (!w) return false
      const isCore = w.name.startsWith('Phường') ||
        !!(w.trungTamHc && (w.trungTamHc.toLowerCase().includes('thị trấn') || w.trungTamHc.toLowerCase().includes('thị xã'))) ||
        !!(w.truocSapNhap && (w.truocSapNhap.toLowerCase().includes('thị trấn') || w.truocSapNhap.toLowerCase().includes('thị xã')))
      return !isCore
    })
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/bao-cao" className="hover:text-blue-700 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />Báo cáo & Thống kê
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Dữ liệu hiện trạng phường/xã</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-700" />
            Dữ liệu hiện trạng phường/xã
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {perms.type === 'WARD'
              ? `Dữ liệu báo cáo của đơn vị bạn — có thể xem, sửa và xóa`
              : perms.type === 'SO_OTHER'
              ? `Dữ liệu báo cáo tất cả phường/xã — chỉ xem`
              : `Dữ liệu báo cáo từ các phường/xã — toàn quyền quản lý`}
          </p>
        </div>
        {perms.canWrite && (
          <div className="flex gap-2">
            <Link href="/dashboard/bao-cao/du-lieu-phuong-xa/import">
              <Button className="bg-green-700 hover:bg-green-800 text-white gap-1.5">
                <Upload className="w-4 h-4" />Import Excel
              </Button>
            </Link>
          </div>
        )}
        {!perms.canWrite && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 border rounded-lg px-3 py-2">
            <Eye className="w-3.5 h-3.5" />Chỉ xem
          </span>
        )}
      </div>

      {/* Bộ lọc */}
      <form method="GET" className="bg-white rounded-xl border p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Phường/Xã</label>
          <select name="wardId" defaultValue={sp.wardId ?? ''}
            className="h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả</option>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Phân loại vùng</label>
          <select name="vungClass" defaultValue={sp.vungClass ?? ''}
            className="h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả</option>
            <option value="core">Vùng lõi (Phường & Trung tâm)</option>
            <option value="other">Vùng khác (Xã nông thôn)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Năm</label>
          <select name="year" defaultValue={sp.year ?? ''}
            className="h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả</option>
            {years.map(y => <option key={y.year} value={y.year}>{y.year}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Loại dữ liệu</label>
          <select name="category" defaultValue={sp.category ?? ''}
            className="h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Button type="submit" variant="outline" size="sm" className="gap-1.5">
          <Filter className="w-3.5 h-3.5" />Lọc
        </Button>
        {(sp.wardId || sp.year || sp.category || sp.vungClass) && (
          <Link href="/dashboard/bao-cao/du-lieu-phuong-xa">
            <Button type="button" variant="ghost" size="sm" className="text-slate-500">Xóa lọc</Button>
          </Link>
        )}
      </form>

      {/* Danh sách */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-3">
          <FileSpreadsheet className="w-14 h-14 text-slate-200 mx-auto" />
          <p className="font-semibold text-slate-500">Chưa có dữ liệu báo cáo phường/xã</p>
          <p className="text-sm text-slate-400">Import file Excel từ các phường/xã hoặc thêm thủ công</p>
          <Link href="/dashboard/bao-cao/du-lieu-phuong-xa/import">
            <Button className="bg-green-700 hover:bg-green-800 text-white gap-1.5 mt-2">
              <Upload className="w-4 h-4" />Import file Excel đầu tiên
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">{filteredReports.length} bộ dữ liệu</span>
            <Link href="/dashboard/bao-cao/du-lieu-phuong-xa/import">
              <Button variant="ghost" size="sm" className="gap-1.5 text-green-700">
                <Plus className="w-3.5 h-3.5" />Thêm dữ liệu
              </Button>
            </Link>
          </div>

          {/* Group theo phường/xã + năm */}
          <div className="divide-y divide-slate-100">
            {filteredReports.map((r) => {
              const rowCount = Array.isArray(r.rows) ? (r.rows as unknown[]).length : 0
              const colCount = Array.isArray(r.columns) ? (r.columns as unknown[]).length : 0
              
              const w = r.ward
              const isCore = w && (w.name.startsWith('Phường') ||
                !!(w.trungTamHc && (w.trungTamHc.toLowerCase().includes('thị trấn') || w.trungTamHc.toLowerCase().includes('thị xã'))) ||
                !!(w.truocSapNhap && (w.truocSapNhap.toLowerCase().includes('thị trấn') || w.truocSapNhap.toLowerCase().includes('thị xã'))))

              return (
                <Link key={r.id} href={`/dashboard/bao-cao/du-lieu-phuong-xa/${r.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                  <FileSpreadsheet className="w-8 h-8 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span>{r.ward?.name ?? 'Chưa xác định phường/xã'}</span>
                        {isCore && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-amber-300">
                            Vùng lõi
                          </span>
                        )}
                      </div>
                      <Badge className={`text-xs shrink-0 ${CATEGORY_COLOR[r.category]}`}>
                        {CATEGORY_LABEL[r.category]}
                      </Badge>
                      {r.status === 'CHINH_THUC' ? (
                        <Badge className="text-xs bg-green-100 text-green-700 shrink-0">Chính thức</Badge>
                      ) : (
                        <Badge className="text-xs bg-slate-100 text-slate-600 shrink-0">Bản nháp</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Năm {r.year}{r.month ? ` · Tháng ${r.month}` : ''}
                      {r.sheetName ? ` · Sheet: ${r.sheetName}` : ''}
                      {r.sourceFile ? ` · File: ${r.sourceFile}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{rowCount} hàng</p>
                    <p className="text-xs text-slate-400">{colCount} cột · {r.createdBy.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
