import { ScrollText, Layers, Map, Cpu, AlertTriangle } from 'lucide-react'
import type { LinhVucKey } from '@/lib/htkt/phap-ly'
import { quyTrinhTheoLinhVuc, CHUA_DU_CAN_CU } from '@/lib/htkt/quy-trinh-linh-vuc'
import { nhomTheoLinhVuc, CAP_LABELS, KET_CAU_COT_HTKT, LUU_Y_AP_DUNG } from '@/lib/htkt/phan-cap-cong-trinh'
import { chiSoTheoLinhVuc } from '@/lib/htkt/ha-tang-thong-minh'
import { CHUYEN_NGANH_HTKT_TRONG_DO_AN, CHECKLIST_GOP_Y } from '@/lib/htkt/quy-hoach'

// Khối "nội dung chuyên môn" hiển thị dưới phần Nhiệm vụ của mỗi lĩnh vực HTKT.
// Toàn bộ dữ liệu lấy từ lib/htkt/* — mỗi mục đều kèm điều, khoản của văn bản gốc.
// Dùng <details> để không cần JavaScript phía client.

function Khoi({
  icon: Icon,
  tieuDe,
  phu,
  children,
  mo = false,
}: {
  icon: React.ElementType
  tieuDe: string
  phu?: string
  children: React.ReactNode
  mo?: boolean
}) {
  return (
    <details open={mo} className="rounded-xl border bg-white mb-4 group">
      <summary className="flex items-center gap-2.5 p-4 cursor-pointer list-none">
        <Icon className="w-4 h-4 text-cyan-600 shrink-0" />
        <span className="text-sm font-semibold text-slate-800">{tieuDe}</span>
        {phu && <span className="text-xs text-slate-400">{phu}</span>}
        <span className="ml-auto text-xs text-slate-400 group-open:hidden">Xem</span>
        <span className="ml-auto text-xs text-slate-400 hidden group-open:inline">Thu gọn</span>
      </summary>
      <div className="px-4 pb-4 border-t pt-4">{children}</div>
    </details>
  )
}

const CanCu = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] text-cyan-700 bg-cyan-50 rounded px-1.5 py-0.5 whitespace-nowrap">{children}</span>
)

export function NoiDungChuyenMon({ linhVuc }: { linhVuc: LinhVucKey }) {
  const quyTrinh = quyTrinhTheoLinhVuc(linhVuc)
  const phanCap = nhomTheoLinhVuc(linhVuc)
  const chiSo = chiSoTheoLinhVuc(linhVuc)
  const chuaDu = CHUA_DU_CAN_CU.find((c) => c.linhVuc === linhVuc)
  const chuyenNganhQH = CHUYEN_NGANH_HTKT_TRONG_DO_AN.filter((c) => c.linhVucHtkt === linhVuc)
  const coCot = linhVuc === 'chieu-sang'

  return (
    <div className="mb-6">
      {/* ── Quy trình ── */}
      {quyTrinh.length > 0 && (
        <Khoi icon={ScrollText} tieuDe="Quy trình nghiệp vụ" phu={`${quyTrinh.length} quy trình`} mo>
          <div className="space-y-5">
            {quyTrinh.map((q) => (
              <div key={q.key}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{q.ten}</p>
                  <span className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{q.loai}</span>
                  {q.apDungMoiLinhVuc && (
                    <span className="text-[11px] rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                      Quy định KHUNG về tài sản KCHT (NĐ 178/2026) — không thay quy trình chuyên ngành
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2">{q.moTa}</p>
                <p className="text-xs text-slate-600 mb-2">
                  <span className="font-medium">Phạm vi áp dụng: </span>
                  {q.apDung}
                </p>

                {q.hoSo && q.hoSo.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-slate-700 mb-1">Hồ sơ:</p>
                    <ul className="space-y-0.5">
                      {q.hoSo.map((h, i) => (
                        <li key={i} className="text-xs text-slate-600 pl-3">
                          • {h.ten} {h.soLuong && <em className="text-slate-400">({h.soLuong})</em>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <ol className="space-y-1.5 mb-2">
                  {q.buoc.map((b) => (
                    <li key={b.buoc} className="text-xs text-slate-600 flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 text-[10px] font-semibold">
                        {b.buoc}
                      </span>
                      <span>
                        <span className="font-medium text-slate-800">{b.ten}. </span>
                        {b.noiDung}
                        {b.trachNhiem && <span className="text-slate-500"> — {b.trachNhiem}</span>}
                        {b.thoiHan && <strong className="text-amber-700"> · {b.thoiHan}</strong>}{' '}
                        {b.canCu && <CanCu>{b.canCu}</CanCu>}
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="text-xs text-slate-600">
                  <span className="font-medium">Kết quả: </span>
                  {q.ketQua}
                </p>
                {q.luuY && q.luuY.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {q.luuY.map((l, i) => (
                      <li key={i} className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
                        Lưu ý: {l}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">Căn cứ: {q.canCu.join(' · ')}</p>
              </div>
            ))}
          </div>
        </Khoi>
      )}

      {/* ── Phân cấp công trình ── */}
      {(phanCap.length > 0 || coCot) && (
        <Khoi icon={Layers} tieuDe="Tiêu chí kỹ thuật — phân cấp công trình" phu="TT 34/2026/TT-BXD">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border p-2 text-left font-medium text-slate-700">Loại công trình</th>
                  <th className="border p-2 text-left font-medium text-slate-700">Tiêu chí</th>
                  {CAP_LABELS.map((c) => (
                    <th key={c} className="border p-2 text-center font-medium text-slate-700 whitespace-nowrap">
                      Cấp {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phanCap.flatMap((n) =>
                  n.dong.map((d) => (
                    <tr key={d.ma}>
                      <td className="border p-2 text-slate-700">
                        <span className="text-slate-400">{d.ma}</span> {d.ten}
                        {d.ghiChu && <em className="block text-[11px] text-amber-700 mt-0.5">{d.ghiChu}</em>}
                      </td>
                      <td className="border p-2 text-slate-600">{d.tieuChi}</td>
                      {d.o.map((v, i) => (
                        <td key={i} className="border p-2 text-center text-slate-700 whitespace-nowrap">
                          {v || <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
                {coCot && (
                  <tr>
                    <td className="border p-2 text-slate-700">
                      <span className="text-slate-400">{KET_CAU_COT_HTKT.ma}</span> {KET_CAU_COT_HTKT.ten}
                      <em className="block text-[11px] text-amber-700 mt-0.5">{KET_CAU_COT_HTKT.ghiChu}</em>
                    </td>
                    <td className="border p-2 text-slate-600">{KET_CAU_COT_HTKT.tieuChi}</td>
                    {KET_CAU_COT_HTKT.o.map((v, i) => (
                      <td key={i} className="border p-2 text-center text-slate-700 whitespace-nowrap">
                        {v || <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-1">
            {LUU_Y_AP_DUNG.map((l, i) => (
              <li key={i} className="text-xs text-slate-600">
                • {l.noiDung} <CanCu>{l.canCu}</CanCu>
              </li>
            ))}
          </ul>
        </Khoi>
      )}

      {/* ── Quy hoạch ── */}
      {chuyenNganhQH.length > 0 && (
        <Khoi icon={Map} tieuDe="Trong đồ án quy hoạch" phu="Luật 47/2024 · TT 16/2025/TT-BXD">
          <p className="text-xs text-slate-600 mb-2">
            Chuyên ngành hạ tầng kỹ thuật tương ứng phải thể hiện trong bản đồ hiện trạng và bản đồ định hướng của đồ án:
          </p>
          <ul className="space-y-1 mb-3">
            {chuyenNganhQH.map((c) => (
              <li key={c.ten} className="text-xs text-slate-700">
                • <span className="font-medium">{c.ten}</span>
                {c.ghiChu && <em className="text-slate-500"> — {c.ghiChu}</em>}
              </li>
            ))}
          </ul>
          <p className="text-xs font-medium text-slate-700 mb-1">Danh mục kiểm khi góp ý đồ án:</p>
          <ul className="space-y-1">
            {CHECKLIST_GOP_Y.map((c, i) => (
              <li key={i} className="text-xs text-slate-600">
                ☐ {c.muc} <CanCu>{c.bamVao}</CanCu>
              </li>
            ))}
          </ul>
        </Khoi>
      )}

      {/* ── Đô thị thông minh ── */}
      {chiSo.length > 0 && (
        <Khoi
          icon={Cpu}
          tieuDe="Chỉ số đô thị thông minh"
          phu={`${chiSo.length} chỉ số · NĐ 269/2025 · TT 03/2026/TT-BXD`}
        >
          <div className="space-y-3">
            {chiSo.map((c) => (
              <div key={c.kyHieu} className="border-l-2 border-cyan-200 pl-3">
                <p className="text-sm font-medium text-slate-800">
                  <span className="text-cyan-700">{c.kyHieu}</span> — {c.ten}
                  {c.coBan && <span className="ml-2 text-[11px] rounded bg-cyan-100 text-cyan-800 px-1.5">cơ bản {c.coBan}</span>}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  <span className="font-medium">① Nền tảng: </span>
                  {c.nenTang}
                </p>
                {c.lienKet && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">② Liên kết hệ thống: </span>
                    {c.lienKet}
                  </p>
                )}
                {c.doiMoi && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">③ Đổi mới quản trị: </span>
                    {c.doiMoi}
                  </p>
                )}
                {c.giaiThich && <p className="text-[11px] text-slate-500 mt-1">Giải thích chỉ số: {c.giaiThich}</p>}
              </div>
            ))}
          </div>
        </Khoi>
      )}

      {/* ── Khoảng trống ── */}
      {chuaDu && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Chưa đủ căn cứ để dựng quy trình chuyên ngành</p>
            <p className="text-xs text-amber-800 mt-1">{chuaDu.canVanBan}</p>
            <p className="text-xs text-amber-700 mt-1">
              Đề nghị Sở cung cấp bản gốc văn bản để nạp vào kho — trước đó, hệ thống và chatbot sẽ trả lời là chưa có căn cứ
              thay vì mô tả quy trình theo kiến thức chung.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
