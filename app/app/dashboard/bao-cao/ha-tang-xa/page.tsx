import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Link2, ChevronRight } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getWardReportPerms } from '@/lib/ward-report-perms'
import { maXaCuaTaiKhoan } from '@/lib/htkt-doi-tuong/truy-van'
import { LINH_VUC } from '@/lib/htkt-doi-tuong/danh-muc'

// Hồ sơ đối tượng HTKT + số hiệu đường xã/thôn (QĐ 56/2025/QĐ-UBND) — danh sách 78 xã/phường cho Sở;
// tài khoản xã/phường được chuyển thẳng vào đơn vị mình.

const BASE = '/dashboard/bao-cao/ha-tang-xa'

type Dong = {
  code: string; name: string; dx_tu: number | null; dx_den: number | null; dth_tu: number | null; dth_den: number | null
  tong: bigint; duong: bigint; co_so_hieu: bigint; dx_cho_qd: bigint; co_gis: bigint; lien_ket_bc: bigint
}
type TheoLv = { linh_vuc: string; n: bigint }

export default async function HaTangXaPage() {
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  if (perms.limitWardId) {
    const ma = await maXaCuaTaiKhoan(user)
    if (ma) redirect(`${BASE}/${ma}`)
  }

  const rows = await db.$queryRaw<Dong[]>`
    SELECT au.code, au.name, au."soHieuDxTu" AS dx_tu, au."soHieuDxDen" AS dx_den, au."soHieuDthTu" AS dth_tu, au."soHieuDthDen" AS dth_den,
           count(d.id) AS tong,
           count(d.id) FILTER (WHERE d.linh_vuc = 'DUONG') AS duong,
           count(d.id) FILTER (WHERE d.sh_so IS NOT NULL) AS co_so_hieu,
           count(d.id) FILTER (WHERE d.cap_duong = 'DUONG_XA' AND d.sh_trang_thai = 'DE_XUAT') AS dx_cho_qd,
           count(d.id) FILTER (WHERE d.geometry IS NOT NULL) AS co_gis,
           (SELECT count(*) FROM report_duong r WHERE r."wardId" = au.id AND r."doiTuongId" IS NOT NULL) AS lien_ket_bc
      FROM administrative_units au
      LEFT JOIN htkt_doi_tuong d ON d.ma_xa = au.code AND d.deleted_at IS NULL
     WHERE au.type = 'PHUONG_XA'
     GROUP BY au.id, au.code, au.name
     ORDER BY au.code`
  const theoLv = await db.$queryRaw<TheoLv[]>`
    SELECT linh_vuc, count(*) AS n FROM htkt_doi_tuong WHERE deleted_at IS NULL GROUP BY linh_vuc`
  const tongLv = new Map(theoLv.map((r) => [r.linh_vuc, Number(r.n)]))

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><Link2 className="w-6 h-6" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hồ sơ đối tượng HTKT & số hiệu đường xã, đường thôn</h1>
          <p className="text-sm text-slate-500">
            Một bảng trung tâm liên kết theo mã xã: đường, chiếu sáng, cây xanh, công viên, thoát nước mưa/thải, cấp nước, bãi đỗ xe ·
            số hiệu “ĐX.” / “Đth.” theo Điều 5 QĐ 56/2025/QĐ-UBND.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
        {LINH_VUC.map((lv) => (
          <div key={lv.value} className="rounded-lg border bg-white px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ background: lv.mau }} />{lv.label}</div>
            <div className="text-lg font-semibold text-slate-900">{(tongLv.get(lv.value) ?? 0).toLocaleString('vi-VN')}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">Mã ĐVHC</th>
              <th className="text-left px-3 py-2">Xã / phường / đặc khu</th>
              <th className="text-left px-3 py-2">Dải ĐX.</th>
              <th className="text-left px-3 py-2">Dải Đth.</th>
              <th className="text-right px-3 py-2">Đối tượng</th>
              <th className="text-right px-3 py-2">Tuyến đường</th>
              <th className="text-right px-3 py-2">Có số hiệu</th>
              <th className="text-right px-3 py-2" title="Số hiệu đường xã xã đề xuất, chờ UBND tỉnh quyết định (Đ5 k2)">ĐX chờ QĐ</th>
              <th className="text-right px-3 py-2">Có GIS</th>
              <th className="text-right px-3 py-2">Dòng BM01 đã liên kết</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-t hover:bg-blue-50/40">
                <td className="px-3 py-2 font-mono text-slate-500">{r.code}</td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  <Link href={`${BASE}/${r.code}`} className="hover:text-blue-700 hover:underline">{r.name}</Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.dx_tu ? `${r.dx_tu}–${r.dx_den}` : <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-2 text-slate-600">{r.dth_tu ? `${r.dth_tu}–${r.dth_den}` : <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-2 text-right">{Number(r.tong) || ''}</td>
                <td className="px-3 py-2 text-right">{Number(r.duong) || ''}</td>
                <td className="px-3 py-2 text-right">{Number(r.co_so_hieu) || ''}</td>
                <td className="px-3 py-2 text-right">{Number(r.dx_cho_qd) ? <span className="px-1.5 rounded bg-amber-100 text-amber-800">{Number(r.dx_cho_qd)}</span> : ''}</td>
                <td className="px-3 py-2 text-right">{Number(r.co_gis) || ''}</td>
                <td className="px-3 py-2 text-right">{Number(r.lien_ket_bc) || ''}</td>
                <td className="px-3 py-2 text-right"><Link href={`${BASE}/${r.code}`} className="text-blue-700"><ChevronRight className="w-4 h-4 inline" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-3">
        8 phường không được giao dải số (đường trong phường là đường đô thị — QĐ 56 Đ3). Dải mỗi xã: 14 số ĐX. và 50 số Đth.;
        mỗi số dùng thêm được 12 chữ cái B…N cho đường thứ hai trở lên.
      </p>
    </div>
  )
}
