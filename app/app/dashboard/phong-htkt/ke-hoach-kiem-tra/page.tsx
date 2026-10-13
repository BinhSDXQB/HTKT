import { CalendarCheck, Grid3X3, CheckCircle2 } from 'lucide-react'
import { LINH_VUC_HTKT } from '@/lib/htkt/phap-ly'
import {
  NOI_DUNG_KIEM_TRA, KE_HOACH_KIEM_TRA_NAM,
} from '@/lib/htkt/ke-hoach-kiem-tra'
import { LOAI_CONG_TRINH_TT34, THU_TU_CAP, TT34 } from '@/lib/htkt/cap-cong-trinh-tt34'
import { PHU_LUC_IV_HTKT, PHU_LUC_IX_207, NHANH_THAM_QUYEN_KIEM_TRA, ND217, ND207 } from '@/lib/htkt/tham-quyen-tham-dinh'

export const dynamic = 'force-dynamic'

export default function KeHoachKiemTraPage() {
  const tongCongTrinh = LOAI_CONG_TRINH_TT34.length
  const tongLinhVuc = LINH_VUC_HTKT.length
  const tongNoiDung = NOI_DUNG_KIEM_TRA.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kế hoạch kiểm tra QLNN</h1>
          <p className="text-sm text-slate-500">
            Ma trận phân loại công trình · Nội dung kiểm tra · Quy mô và thẩm quyền · Lịch kiểm tra hàng năm
          </p>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border bg-emerald-50/50 p-4">
          <p className="text-xs text-slate-600 mb-1">Tổng lĩnh vực HTKT</p>
          <p className="text-2xl font-bold text-emerald-700">{tongLinhVuc}</p>
          <p className="text-xs text-slate-500 mt-1">Cấp nước, thoát nước, cây xanh, chiếu sáng...</p>
        </div>
        <div className="rounded-lg border bg-blue-50/50 p-4">
          <p className="text-xs text-slate-600 mb-1">Mục phân cấp công trình</p>
          <p className="text-2xl font-bold text-blue-700">{tongCongTrinh}</p>
          <p className="text-xs text-slate-500 mt-1">Thang 5 bậc: Đặc biệt, I, II, III, IV</p>
        </div>
        <div className="rounded-lg border bg-purple-50/50 p-4">
          <p className="text-xs text-slate-600 mb-1">Nội dung kiểm tra định kỳ</p>
          <p className="text-2xl font-bold text-purple-700">{tongNoiDung}</p>
          <p className="text-xs text-slate-500 mt-1">Từng lĩnh vực (tháng/quý/năm)</p>
        </div>
      </div>

      {/* 1. Ma trận phân loại công trình */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-emerald-600" />
          1. Ma trận phân loại công trình HTKT
        </h2>
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900 space-y-2">
          <p className="font-semibold">Bảng dưới chép từ bản gốc {TT34.so} (hiệu lực {TT34.hieuLucTu}), Phụ lục I và II.</p>
          <p>
            Trước đây bảng này có hai cột <strong>&quot;Thẩm quyền thẩm định&quot;</strong> và <strong>&quot;KT-NT&quot;</strong> gán
            theo cấp (Cấp I–II → Sở XD, Cấp III–IV → HĐNT/Chủ đầu tư). Cách gán đó <strong>sai mô hình</strong>:
            thẩm quyền KHÔNG phải là hàm của cấp công trình. Theo <strong>NĐ {ND217.so} Điều 32, 33</strong>, thẩm quyền
            thẩm định xác định theo <em>loại dự án</em> (đầu tư công / PPP / đầu tư kinh doanh), <em>cơ quan chủ quản</em> và
            <em> địa bàn</em> — không có bảng ánh xạ &quot;cấp nào → cơ quan nào&quot;.
          </p>
          <p>
            Cấp công trình <strong>vẫn tham gia</strong>, nhưng theo cách khác: công trình <strong>cấp đặc biệt</strong> thì
            cơ quan chuyên môn thuộc bộ thẩm định (Đ32 khoản 2) và kiểm tra nghiệm thu (<strong>NĐ {ND207.so} Đ26</strong>
            khoản 1 điểm b); dự án nhiều công trình thì lấy <strong>công trình chính có cấp cao nhất</strong> làm căn cứ
            (Đ33 khoản 3 NĐ {ND217.so}; Đ26 khoản 3 NĐ {ND207.so}); dự án thành phần, phân kỳ đầu tư, sửa chữa cải tạo có
            quy tắc riêng (Đ33 khoản 4, 5, 6). Tức là cấp quyết định <em>lấy công trình nào làm căn cứ</em>, chứ không tự
            nó chỉ ra cơ quan.
          </p>
          <p>
            Thứ <em>thực sự</em> khoá theo cấp là <strong>ngưỡng thuộc diện</strong> — xem bảng Phụ lục IV ngay dưới.
            Điều 2 khoản 2 TT {TT34.so}: cấp công trình là cấp <strong>cao nhất</strong> theo <strong>cả</strong> Phụ lục I và II;
            bảng này không thay việc đối chiếu bản gốc.
          </p>
        </div>

        <div className="mb-5 rounded-lg border bg-white overflow-x-auto">
          <div className="px-4 py-3 border-b bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">
              Ngưỡng thuộc diện — Phụ lục IV NĐ {ND217.so} (công trình ảnh hưởng lớn đến an toàn, lợi ích cộng đồng)
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Đạt ngưỡng ⇒ phải <strong>kiểm tra công tác nghiệm thu</strong> (NĐ {ND207.so} Đ25 khoản 1 điểm b);
              và với dự án <strong>đầu tư kinh doanh</strong> thì thuộc diện cơ quan chuyên môn thẩm định BCNCKT
              (NĐ {ND217.so} Đ32 khoản 1 điểm d). Dự án đầu tư công và PPP vốn đã thuộc diện thẩm định theo điểm a, b.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Mã</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Loại công trình</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Ngưỡng</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PHU_LUC_IV_HTKT.map((d) => (
                <tr key={d.ma} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs font-mono text-slate-500 whitespace-nowrap">{d.ma}</td>
                  <td className="px-3 py-2 text-xs text-slate-900">
                    {d.ten}
                    {d.chiTiet && <span className="block text-slate-500 mt-0.5">{d.chiTiet}</span>}
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap">{d.nguong}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-amber-50 text-xs text-amber-900 border-t">
            <p>
              <strong>Cây xanh/công viên và chiếu sáng đô thị KHÔNG có dòng nào</strong> trong phần hạ tầng kỹ thuật của
              Phụ lục IV. Đừng suy ra là &quot;không thuộc diện&quot; — công trình cụ thể vẫn có thể rơi vào dòng thuộc
              loại khác của Phụ lục IV, phải mở bản gốc đối chiếu.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border bg-white overflow-x-auto">
          <div className="px-4 py-3 border-b bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">
              Nhánh riêng — Phụ lục IX NĐ {ND207.so} (công trình quy mô lớn, kỹ thuật phức tạp)
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Công trình thuộc dự án quan trọng quốc gia, <strong>hoặc</strong> công trình thuộc danh mục này (hai
              trường hợp <strong>thay thế nhau</strong>, bản gốc ngăn bằng dấu phẩy chứ không phải điều kiện đồng thời) do
              <strong> Hội đồng kiểm tra nhà nước</strong> về công tác nghiệm thu kiểm tra (Đ25 khoản 1 điểm a;
              Đ26 khoản 1 điểm a) — <strong>không phải</strong> cơ quan chuyên môn như nhánh Phụ lục IV.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">STT</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Loại công trình</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Tiêu chí</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Quy mô</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PHU_LUC_IX_207.map((d) => (
                <tr key={d.stt} className={d.linhVuc.length ? 'bg-amber-50' : 'hover:bg-slate-50'}>
                  <td className="px-3 py-2 text-xs text-slate-500">{d.stt}</td>
                  <td className="px-3 py-2 text-xs text-slate-900">
                    {d.ten}
                    {d.linhVuc.length > 0 && (
                      <span className="block text-amber-800 mt-0.5">
                        Dòng duy nhất của Phụ lục IX <strong>có thể</strong> chạm tới hạ tầng kỹ thuật đô thị. Bản gốc ghi
                        &quot;Cầu&quot; chung, không giới hạn cầu quốc gia hay cầu đô thị — chỉ áp dụng khi hạng mục đúng là
                        cầu VÀ đạt ngưỡng nhịp ≥ 350 m. Đường đô thị, hay cầu dưới ngưỡng, không thuộc dòng này.
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{d.tieuChi}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap">{d.quyMo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-slate-50 text-xs text-slate-600 border-t">
            <p>Đủ 6 dòng của Phụ lục IX · 5 dòng còn lại ngoài phạm vi hạ tầng kỹ thuật của Sở, chép để khỏi phải tra lại.</p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border bg-white overflow-x-auto">
          <div className="px-4 py-3 border-b bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">
              Ai kiểm tra công tác nghiệm thu — NĐ {ND207.so} Điều 26
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Phụ thuộc cơ quan chủ quản, nguồn vốn và địa bàn — <strong>không suy ra được từ cấp công trình</strong>.
              Bảng để cán bộ tự đối chiếu; nhánh thường gặp của Sở Xây dựng được tô sáng.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Điều khoản</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Cơ quan kiểm tra</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Trường hợp</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {NHANH_THAM_QUYEN_KIEM_TRA.map((n) => (
                <tr key={n.dieuKhoan} className={n.truongHop.includes('THƯỜNG GẶP') ? 'bg-emerald-50' : 'hover:bg-slate-50'}>
                  <td className="px-3 py-2 text-xs font-mono text-slate-500 whitespace-nowrap">{n.dieuKhoan}</td>
                  <td className="px-3 py-2 text-xs text-slate-900">{n.coQuan}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{n.truongHop}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-slate-50 text-xs text-slate-600 border-t">
            <p>
              Trình tự, nội dung, chi phí kiểm tra (Đ27) và trường hợp dự án nhiều công trình (Đ25 khoản 1 điểm c)
              chưa chép — tra bản gốc khi cần.
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Mục</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Loại công trình</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Tiêu chí phân cấp</th>
                {THU_TU_CAP.map((c) => (
                  <th key={c} className="text-center px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {LOAI_CONG_TRINH_TT34.map((loai) => {
                const lv = LINH_VUC_HTKT.find((l) => l.key === loai.linhVuc)
                // Mục phân theo "mức độ quan trọng" hoặc cấp cố định: không có dải số để xếp cột.
                if (!loai.tieuChi.length) {
                  const moTa = loai.capCoDinh
                    ? `Cấp ${loai.capCoDinh} với mọi quy mô`
                    : (loai.luaChon ?? []).map((x) => `${x.nhan} → cấp ${x.cap}`).join(' · ')
                  return (
                    <tr key={loai.ma} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs font-mono text-slate-500 whitespace-nowrap">{loai.ma}</td>
                      <td className="px-3 py-2 text-xs text-slate-900">
                        {loai.ten}
                        <span className="block text-slate-400">{lv?.ten} · Phụ lục {loai.phuLuc}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">Mức độ quan trọng</td>
                      <td className="px-3 py-2 text-xs text-slate-700" colSpan={THU_TU_CAP.length}>{moTa}</td>
                    </tr>
                  )
                }
                return loai.tieuChi.map((tc, j) => (
                  <tr key={`${loai.ma}-${j}`} className="hover:bg-slate-50">
                    {j === 0 && (
                      <>
                        <td className="px-3 py-2 text-xs font-mono text-slate-500 whitespace-nowrap" rowSpan={loai.tieuChi.length}>{loai.ma}</td>
                        <td className="px-3 py-2 text-xs text-slate-900" rowSpan={loai.tieuChi.length}>
                          {loai.ten}
                          <span className="block text-slate-400">{lv?.ten} · Phụ lục {loai.phuLuc}</span>
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2 text-xs text-slate-600">{tc.ten}</td>
                    {THU_TU_CAP.map((c) => {
                      const bac = tc.bac.find((b) => b.cap === c)
                      return (
                        <td key={c} className={`px-3 py-2 text-xs text-center whitespace-nowrap ${bac ? 'text-slate-800' : 'text-slate-300'}`}>
                          {bac ? bac.moTa : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-slate-50 text-xs text-slate-600 border-t">
            <p>Đủ {LOAI_CONG_TRINH_TT34.length} mục thuộc 8 lĩnh vực hạ tầng kỹ thuật · ô &quot;—&quot; là bảng gốc để trống</p>
            <p className="text-slate-500 mt-1">Nguồn: {TT34.so} — {TT34.ten}</p>
          </div>
        </div>
      </div>

      {/* 2. Nội dung kiểm tra */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          2. Nội dung kiểm tra định kỳ theo lĩnh vực
        </h2>
        <div className="space-y-4">
          {NOI_DUNG_KIEM_TRA.map((nd, i) => {
            const lv = LINH_VUC_HTKT.find((l) => l.key === nd.linhVuc)
            const hinhThuc = nd.hinhThucKiemTra === 'thuong_xuyen' ? '🔄 Thường xuyên' : nd.hinhThucKiemTra === 'dinh_ky' ? '📅 Định kỳ' : '🚨 Đột xuất'
            return (
              <details key={i} className="rounded-lg border bg-white group">
                <summary className="px-4 py-3 font-semibold text-slate-900 cursor-pointer hover:bg-slate-50">
                  <span className="flex items-center gap-2">
                    {lv?.ten} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{hinhThuc}</span>
                    <span className="text-xs font-normal text-slate-500 bg-blue-100 px-2 py-1 rounded">Tần suất: {nd.tanSuat}</span>
                  </span>
                </summary>
                <div className="px-4 py-3 bg-slate-50 border-t space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Nội dung kiểm tra:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {nd.noiDungKiemTra.map((nc, j) => <li key={j}>{nc}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Tài liệu yêu cầu:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {nd.taiLieuYeuCau.map((tl, j) => <li key={j}>{tl}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Tiêu chí đánh giá (các chỉ tiêu % là mục tiêu tham khảo nội bộ, không phải ngưỡng pháp luật):</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {nd.tieuChi.map((tc, j) => <li key={j}>{tc}</li>)}
                    </ul>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      </div>

      {/* 3. Nhóm dự án, thẩm quyền, đối tượng thẩm tra & kiểm tra nghiệm thu — theo văn bản gốc (rà soát 13/10/2026) */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">3. Nhóm dự án, thẩm quyền & đối tượng kiểm tra (theo quy định)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="rounded-lg border bg-white p-4">
            <p className="font-semibold text-slate-900 mb-2">Nhóm dự án (Đ9–11 Luật Đầu tư công 58/2024, sửa bởi Luật 90/2025)</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Cấp thoát nước, xử lý rác thải, HTKT khác: nhóm A từ 3.000 tỷ; nhóm B 160 – dưới 3.000 tỷ; nhóm C dưới 160 tỷ.</li>
              <li>HTKT khu đô thị mới: nhóm A từ 2.000 tỷ; nhóm B 120 – dưới 2.000 tỷ; nhóm C dưới 120 tỷ.</li>
              <li>Giao thông (cầu, quốc lộ…): nhóm A từ 4.600 tỷ; nhóm B 240 – dưới 4.600 tỷ; nhóm C dưới 240 tỷ.</li>
              <li>Nhóm dự án xác định theo tổng mức đầu tư — KHÔNG đồng nhất với cấp công trình.</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="font-semibold text-slate-900 mb-2">Thẩm quyền thẩm định BCNCKT (Đ32, Đ33 NĐ 217/2026)</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sở Xây dựng: dự án thuộc đối tượng Đ27 k1 Luật 135 trên địa bàn tỉnh (Đ32 k5), xét theo công trình chính cấp cao nhất.</li>
              <li>Cơ quan chuyên môn thuộc bộ: công trình cấp đặc biệt, dự án trên 2 tỉnh trở lên… (Đ32 k2).</li>
              <li>Cơ quan chuyên môn thuộc UBND cấp xã: dự án do UBND cấp xã quyết định đầu tư (Đ32 k4).</li>
              <li>Dự án chỉ lập BCKTKT: không thẩm định tại cơ quan chuyên môn (Đ27 k2 Luật 135).</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="font-semibold text-slate-900 mb-2">Bắt buộc thẩm tra thiết kế (Đ26 k5 Luật 135)</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Công trình thuộc Phụ lục IV NĐ 217 — HTKT (cấp nước, thoát nước, chất thải rắn, nhà tang lễ, hỏa táng, nhà để xe, tuy nen…): cấp II trở lên.</li>
              <li>Công trình quy mô lớn, kỹ thuật phức tạp — Phụ lục IX NĐ 207 (ví dụ cầu nhịp ≥ 350 m).</li>
              <li>Công trình thuộc diện thẩm định thiết kế PCCC — Phụ lục III NĐ 105 (sửa bởi NĐ 347/2026); mục 11: HTKT khu đô thị, khu nhà ở, KCN, CCN, khu du lịch.</li>
              <li>Đường bộ: thẩm tra, thẩm định an toàn giao thông ngay giai đoạn lập dự án (Đ29 Luật Đường bộ).</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="font-semibold text-slate-900 mb-2">Kiểm tra công tác nghiệm thu (Đ25–27 NĐ 207/2026)</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Đối tượng: công trình thuộc Phụ lục IV NĐ 217 (HTKT cấp II trở lên), trừ công trình do Hội đồng kiểm tra nhà nước hoặc bộ kiểm tra.</li>
              <li>Trong thi công: tối đa 03 lần (cấp đặc biệt, cấp I) / 02 lần (còn lại); thông báo trong 10 ngày làm việc.</li>
              <li>Hoàn thành: thông báo trong 16 ngày làm việc (cấp I, đặc biệt) / 12 ngày làm việc (còn lại).</li>
              <li>Cấp công trình xác định theo TT 34/2026 — xem bảng ở mục 1.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Lịch kiểm tra hàng năm */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">4. Lịch kiểm tra hàng năm theo tháng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {KE_HOACH_KIEM_TRA_NAM.map((kh, i) => {
            const thangText = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                               'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][kh.thang - 1]
            return (
              <div key={i} className="rounded-lg border bg-white p-4 hover:shadow-sm transition">
                <p className="font-bold text-slate-900 mb-2">{thangText} (T{kh.thang})</p>
                <div className="mb-2">
                  <p className="text-xs text-slate-600 font-semibold mb-1">Lĩnh vực kiểm tra:</p>
                  <div className="flex flex-wrap gap-1">
                    {kh.cauHinhLinhVuc.map((lv, j) => {
                      const lvName = LINH_VUC_HTKT.find((l) => l.key === lv)?.ten || lv
                      return (
                        <span key={j} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                          {lvName}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {kh.noiDungChiDao && (
                  <div className="text-xs text-slate-600 italic border-t border-slate-200 pt-2">
                    💡 {kh.noiDungChiDao}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-8 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-xs text-slate-700">
          <strong>Căn cứ pháp lý:</strong> TT 34/2026/TT-BXD (phân cấp công trình) · TT 33/2026/TT-BXD (đánh giá an toàn) · NĐ 217/2026/NĐ-CP (thẩm định, Phụ lục IV) · NĐ 207/2026/NĐ-CP (kiểm tra nghiệm thu, bảo trì, Phụ lục IX) · NĐ 105/2025 sửa bởi NĐ 347/2026 (PCCC) · Luật Đầu tư công 58/2024 · Luật Xây dựng 135/2025/QH15 (hiệu lực 01/7/2026)
        </p>
      </div>
    </div>
  )
}
