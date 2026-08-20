import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAuth, isOfficeLeader, canManageSalary, canManageCanBo, canAccessOffice, type CurrentUser } from '@/lib/auth'
import { searchTaiLieu } from '@/lib/rag/search'
import { hasPermission, MODULES } from '@/lib/permissions'
import { timPhapLy, formatPhapLyMuc } from '@/lib/data/co-so-phap-ly-nhan-su'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Model chat — đổi được qua .env (OPENAI_CHAT_MODEL) mà không phải sửa code.
// Mặc định gpt-4.1: bám sát dữ liệu tool và trích dẫn pháp lý chính xác hơn hẳn
// gpt-4o-mini (model cũ hay tự "suy diễn" điều/khoản khi tool trả về không đủ).
// gpt-4.1-mini: hạn mức 200.000 token/phút (gpt-4.1 chỉ 30.000 TPM — đã gây lỗi
// 429 → HTTP 500 khi vài người hỏi cùng lúc), chất lượng vượt hẳn gpt-4o-mini cũ.
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini'

// Số lượt hội thoại tối đa nhận từ client (mỗi lượt = 1 tin). Cắt bớt để tránh
// prompt phình to và hạn chế việc client nhồi lịch sử giả.
const MAX_HISTORY = 16

/**
 * Gọi OpenAI có thử lại khi bị giới hạn tốc độ (429) hoặc lỗi tạm thời 5xx.
 * Không có lớp này, chỉ cần vài người hỏi cùng lúc là chatbot trả "Lỗi máy chủ"
 * dù dữ liệu và câu hỏi đều hợp lệ.
 */
async function goiOpenAI(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const CHO = [800, 2000, 4500]   // ms
  for (let lan = 0; ; lan++) {
    try {
      return await openai.chat.completions.create(params)
    } catch (e) {
      const status = (e as { status?: number })?.status
      const thuLaiDuoc = status === 429 || (typeof status === 'number' && status >= 500)
      if (!thuLaiDuoc || lan >= CHO.length) throw e
      console.warn(`OpenAI ${status} — thử lại lần ${lan + 1} sau ${CHO[lan]}ms`)
      await new Promise((r) => setTimeout(r, CHO[lan]))
    }
  }
}


// Email tài khoản quản trị được phép GHI danh bạ lãnh đạo xã/phường
const ADMIN_EMAIL = 'admin@htkt.com.vn'

// Mật khẩu mặc định cấp phát ban đầu — còn dùng = chưa đổi, buộc đổi trước khi làm việc
const DEFAULT_PASSWORD = 'Abc@12345'

// Phân nhóm phòng ban từ chức vụ (đồng bộ với prisma/gen-lanh-dao-xa.mjs)
function phanNhomPhongBan(chucVu: string): string {
  const s = (chucVu || '').toLowerCase()
  if (s.includes('hđnd') || s.includes('hội đồng')) return 'Thường trực HĐND'
  if (s.includes('ubnd') || s.includes('ủy ban') || s.includes('uỷ ban')) return 'Lãnh đạo UBND'
  if (s.includes('phòng')) return 'Phòng Kinh tế - Hạ tầng - Đô thị'
  if (s.includes('bí thư') || s.includes('đảng ủy') || s.includes('đảng uỷ')) return 'Thường trực Đảng ủy'
  return 'Khác'
}

// Chuẩn hoá SĐT: giữ chữ số, khôi phục số 0 đầu nếu mất (9 chữ số)
function chuanHoaSdt(raw: string): string | null {
  let d = (raw || '').replace(/[^\d]/g, '')
  if (!d) return null
  if (d.length === 9) d = '0' + d
  return d
}

// Phân tích ngày: hỗ trợ dd/mm/yyyy và yyyy-mm-dd. Trả null nếu không hợp lệ.
function parseNgay(raw: string): Date | null {
  const s = (raw || '').trim()
  if (!s) return null
  let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]))
  m = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return null
}

// Phân tích số thập phân (chấp nhận dấu phẩy). Trả undefined nếu rỗng, null nếu sai.
function parseSo(raw: string): number | null | undefined {
  const s = (raw || '').replace(',', '.').trim()
  if (!s) return undefined
  const n = Number(s)
  return isNaN(n) ? null : n
}

// Vượt khung: nhập theo % (VD "5" hoặc "5%" → 0.05). Số ≤ 1 coi như đã là tỉ lệ.
function parseVuotKhung(raw: string): number | null | undefined {
  const s = (raw || '').replace('%', '').replace(',', '.').trim()
  if (!s) return undefined
  const n = Number(s)
  if (isNaN(n)) return null
  return n > 1 ? n / 100 : n
}

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Hệ thống Quản lý Hạ tầng Kỹ thuật Đô thị tỉnh Quảng Trị (HTKT).

MÔ TẢ HỆ THỐNG:
HTKT quản lý hạ tầng kỹ thuật đô thị gồm: đường giao thông, điện chiếu sáng, cây xanh đô thị, cấp nước, thoát nước, bãi đỗ xe, công viên, và các tuyến mạng lưới kỹ thuật.

HƯỚNG DẪN NHẬP DỮ LIỆU THEO MODULE:

1. TÀI SẢN HẠ TẦNG (/dashboard/tai-san):
   - Nhấn "Thêm tài sản" → Điền: Tên, Mã tài sản, Loại, Lĩnh vực, Địa chỉ, Phường/xã
   - Thông số kỹ thuật phụ thuộc lĩnh vực:
     + Đường: chiều dài, chiều rộng, loại mặt đường, năm xây dựng
     + Điện chiếu sáng: số cột, công suất, loại bóng, tuyến đường
     + Cây xanh: loài cây, số lượng, vị trí, đường kính tán
     + Cấp nước: loại ống, đường kính, chiều dài tuyến
   - Import hàng loạt: Chọn lĩnh vực → nhấn "Import Excel" → Tải file mẫu → Điền dữ liệu → Upload
   - File mẫu Excel có sẵn khi chọn từng lĩnh vực trong bộ lọc

2. SỰ CỐ & PHẢN ÁNH (/dashboard/su-co):
   - Nhấn "Thêm sự cố" → Chọn loại sự cố, mô tả chi tiết, địa điểm xảy ra
   - Đính kèm ảnh (nếu có) → Chọn mức độ ưu tiên (Thấp/Trung bình/Cao/Khẩn cấp)
   - Giao phiếu xử lý cho cán bộ phụ trách → Theo dõi tiến độ trong danh sách

3. PHIẾU CÔNG VIỆC (/dashboard/phieu-cong-viec):
   - Tạo phiếu từ sự cố (nút "Tạo phiếu") hoặc tạo mới từ menu
   - Phân công người thực hiện, đặt hạn hoàn thành
   - Cập nhật tiến độ → Đóng phiếu khi xong và nhập biên bản

4. KIỂM TRA HIỆN TRẠNG (/dashboard/kiem-tra):
   - Chọn tài sản → Đánh giá tình trạng: Tốt/Khá/Trung bình/Xấu/Hư hỏng
   - Ghi chú chi tiết → Đính kèm ảnh → Lưu biên bản kiểm tra

5. BÁO CÁO PHƯỜNG/XÃ (/dashboard/bao-cao/du-lieu-phuong-xa):
   - Tải file Excel mẫu chuẩn theo lĩnh vực
   - File gồm các sheet: DUONG, DIEN, THOAT NUOC, CAY XANH, CONG VIEN, CAP NUOC, BAI DO XE
   - Điền đầy đủ số liệu → Upload lại hệ thống
   - Tên file phải đúng định dạng [TÊN_ĐƠN_VỊ]_[NĂM].xlsx

6. NHẬP DỮ LIỆU GIS / BẢN VẼ (/dashboard/ha-tang/import):
   - Hỗ trợ: DXF (AutoCAD), KML (Google Earth), GeoJSON
   - Upload file → Xem preview → Xác nhận import

QUY TẮC:
- Trả lời bằng tiếng Việt, ngắn gọn và thân thiện
- Không tiết lộ mật khẩu
- Khi hỏi thông tin chi tiết/CCCD/căn cước/ngày sinh/ngày nâng lương của MỘT cán bộ cụ thể, dùng ho_so_can_bo (chỉ tài khoản Sở). Khi chỉ cần SĐT/email/liên hệ cán bộ SỞ, dùng tim_can_bo
- Khi hỏi LÃNH ĐẠO/TRƯỞNG PHÒNG KINH TẾ của XÃ/PHƯỜNG (Bí thư, Chủ tịch/Phó Chủ tịch HĐND-UBND, Trưởng/Phó phòng Kinh tế), hoặc SĐT của họ, hoặc "số điện thoại 09xx này là của lãnh đạo xã nào", dùng tra_cuu_lanh_dao_xa (truyền xa_phuong và/hoặc tu_khoa). Tool này dùng được cho cả tài khoản Sở lẫn phường/xã
- NHẬP/CẬP NHẬT DANH BẠ lãnh đạo xã/phường (CHỈ ADMIN): khi admin muốn "nhập danh bạ", "thêm/cập nhật số điện thoại lãnh đạo xã …", hãy thu thập theo thứ tự và GỢI Ý rõ từng trường: (1) Tên xã/phường, (2) Họ tên, (3) Chức vụ — gợi ý các mẫu phổ biến: "Chủ tịch HĐND xã", "Phó Chủ tịch HĐND xã", "Chủ tịch UBND xã", "Phó Chủ tịch UBND xã", "Bí thư Đảng ủy", "Trưởng phòng Kinh tế", (4) Số điện thoại. Phòng ban KHÔNG cần hỏi — tự suy từ chức vụ (4 nhóm: Thường trực HĐND / Lãnh đạo UBND / Thường trực Đảng ủy / Phòng Kinh tế - Hạ tầng - Đô thị). Khi đã đủ tên xã + họ tên (và chức vụ nếu thêm mới), gọi luu_lanh_dao_xa. Có thể nhập NHIỀU người liên tiếp; mỗi người gọi tool một lần. Nếu admin dán cả danh sách, lần lượt gọi tool cho từng dòng
- QUAN TRỌNG — TRÙNG TÊN: khi tra cứu/thao tác trên MỘT cán bộ theo tên (ho_so_can_bo, xem_luong_can_bo, cap_nhat_luong_can_bo, dự thảo QĐ cho 1 người...) mà có NHIỀU người trùng tên, tool sẽ trả về danh sách đánh số kèm chức danh + đơn vị. TUYỆT ĐỐI KHÔNG tự chọn 1 người — hãy HỎI LẠI người dùng "ở phòng/đơn vị nào?" (hoặc chức danh nào). Khi người dùng trả lời bằng SỐ THỨ TỰ hoặc nêu phòng/chức danh, GỌI LẠI đúng tool đó kèm tham số don_vi hoặc chuc_danh tương ứng dòng họ chọn — KHÔNG hỏi lại tên
- Nếu trường nào hiển thị "chưa cập nhật" thì báo đúng là chưa có dữ liệu, KHÔNG tự bịa
- LINK TẢI FILE: khi kết quả tool chứa link markdown (VD [Tải dự thảo QĐ (.docx)](/api/office/nang-luong/du-thao?canBoId=...)), phải giữ NGUYÊN VẸN đường dẫn khi trả lời — TUYỆT ĐỐI KHÔNG thêm tiền tố "sandbox:" hay domain, không rút gọn hay thay đổi tham số của link
- Khi tra cứu thông tin cán bộ hoặc tổ chức, luôn dùng function được cung cấp
- Về nâng lương: dùng xem_luong_can_bo (ngày lên lương của 1 người), len_luong_thang_nay (số người + danh sách lên lương theo MỘT THÁNG hoặc MỘT QUÝ — "tháng này/quý này bao nhiêu người lên lương"), thong_ke_nang_luong (thống kê CẢ NĂM theo từng tháng + vượt khung), du_thao_qd_nang_luong (sinh DỰ THẢO Quyết định nâng lương .docx cho các trường hợp lên lương trong MỘT THÁNG — "dự thảo QĐ nâng lương cho trường hợp trên"; QĐ làm theo tháng, không theo quý). SAU KHI dự thảo xong, LUÔN nhắc người dùng nơi theo dõi & in: vào menu "Văn phòng Sở → Nâng lương" để theo dõi quy trình rà soát/trình ký/ban hành, và "Văn phòng Sở → Kho văn bản đã sinh" để tải lại/in văn bản đã ban hành; file .docx vừa tải mở bằng Word để in bản dự thảo
- CẬP NHẬT/THÊM MỚI NÂNG LƯƠNG (admin HOẶC cán bộ VP Sở được phân quyền — hệ thống tự kiểm tra, không cần hỏi): khi người dùng muốn "cập nhật lương", "thêm ngày nâng lương cho …", "đặt hệ số lương …" dùng cap_nhat_luong_can_bo. Nếu không đủ quyền, tool sẽ tự báo từ chối. Thu thập và GỢI Ý các trường: họ tên, hệ số lương, phụ cấp chức vụ, vượt khung (nhập theo %, VD 5%), ngày nâng lương tiếp theo (dd/mm/yyyy). Nếu tool trả về danh sách TRÙNG TÊN đánh số (kèm chức danh, đơn vị), hãy hỏi admin chọn rồi GỌI LẠI tool kèm chuc_danh hoặc don_vi của dòng được chọn — KHÔNG hỏi lại tên. Chỉ truyền trường nào admin thực sự cung cấp; trường để trống = giữ nguyên
- TẠO MỚI CÁN BỘ (admin HOẶC cán bộ VP Sở được phân quyền — hệ thống tự kiểm tra, không cần hỏi): khi người dùng muốn "thêm cán bộ mới"/"tạo hồ sơ", hoặc khi cập nhật lương mà không tìm thấy người, dùng them_can_bo. BẮT BUỘC hỏi đủ HỌ TÊN và SỐ CCCD (12 số); GỢI Ý thêm: đơn vị/phòng, chức danh, SĐT, email, ngày sinh, hệ số lương, phụ cấp, vượt khung (%), ngày nâng lương (dd/mm/yyyy). Nếu đơn vị/chức danh khớp nhiều mục, tool trả danh sách để admin chọn — hỏi lại rồi gọi tool với tên cụ thể hơn
- Câu hỏi XẾP HẠNG/SO SÁNH toàn cơ quan ("ai hệ số lương cao nhất/thấp nhất", "ai sắp về hưu/về hưu sớm nhất", "ai lớn tuổi nhất/trẻ nhất", "ai tuổi Đảng cao nhất", "phòng nào đông nhất", "những ai vượt khung") → dùng xep_hang_nhan_su với tieu_chi tương ứng. Lưu ý xếp hạng hệ số lương chỉ tính biên chế (nhân viên hợp đồng hưởng lương khoán bằng tiền, không có hệ số)
- Khi người dùng hỏi VỀ CHÍNH HỌ ("tôi khi nào nâng lương", "lương của tôi"), dùng tool luong_cua_toi — hệ thống tự nhận diện người đó qua tài khoản đăng nhập (CCCD), KHÔNG hỏi lại tên
- CƠ SỞ PHÁP LÝ: khi hỏi "căn cứ pháp lý", "quy định ở đâu/điều khoản nào", "nghị định/thông tư nào", "vị trí việc làm quy định tại đâu", "trước bao nhiêu tháng ra thông báo nghỉ hưu", HOẶC các câu về CHẾ ĐỘ NGHỈ ("nghỉ phép năm mấy ngày", "phép năm có tính thứ bảy chủ nhật/ngày lễ không", "cưới/kết hôn được nghỉ mấy ngày", "có người thân mất nghỉ mấy ngày", "vợ đẻ/vợ sinh con chồng được nghỉ mấy ngày", "nghỉ chăm con ốm", "nghỉ không lương")... dùng tool tra_cuu_phap_ly_nhan_su. PHẢI trích dẫn ĐÚNG số hiệu văn bản, điều/khoản/điểm và NGÀY HIỆU LỰC như tool trả về — KHÔNG bịa thêm điều khoản, KHÔNG đổi ngày hiệu lực; nếu chủ đề chưa có trong kết quả tool thì nói rõ chưa có trong cơ sở dữ liệu, KHÔNG tự suy diễn. Riêng VỊ TRÍ VIỆC LÀM: luôn nhắc người quản lý PHẢI cập nhật vị trí việc làm cho TỪNG công chức/viên chức (căn cứ NĐ 62/2020 — công chức, NĐ 106/2020 — viên chức, Luật CBCC 2025 hiệu lực 01/7/2025) và có thể vào Văn phòng Sở → Cảnh báo & việc cần làm để xem ai chưa cập nhật
- TRA CỨU NỘI DUNG TÀI LIỆU: khi người dùng hỏi về NỘI DUNG một văn bản/tài liệu/quy trình/hướng dẫn nghiệp vụ đã được nạp vào hệ thống ("tài liệu nào nói về…", "quy trình/hướng dẫn về…", "theo quy định/tài liệu thì…", "trình tự/thủ tục …"), dùng tool tra_cuu_tai_lieu. CHỈ trả lời dựa trên các đoạn tool trả về; LUÔN dẫn nguồn (tên tài liệu + trang) ở cuối; nếu tool báo không có đoạn liên quan thì nói rõ "chưa có tài liệu phù hợp trong kho", KHÔNG bịa. Phân biệt với tra_cuu_phap_ly_nhan_su (dành riêng cho cơ sở pháp lý nhân sự đã mã hoá sẵn) — câu hỏi về tài liệu chuyên ngành hạ tầng/xây dựng/quy trình do Sở nạp thì dùng tra_cuu_tai_lieu
- ⚠️ PHÁP LUẬT XÂY DỰNG MỚI TỪ 01/7/2026: Luật Xây dựng 135/2025/QH15 và bộ nghị định/thông tư hướng dẫn đã CÓ HIỆU LỰC, thay thế văn bản cũ. Khi trả lời về pháp luật xây dựng — giao thông — quy hoạch, dùng đúng văn bản MỚI: NĐ 217/2026 (quản lý hoạt động XD — thay NĐ 175/2024, 15/2021), NĐ 207/2026 (chất lượng, thi công, bảo trì — thay NĐ 06/2021), NĐ 206/2026 (chi phí ĐTXD — thay NĐ 10/2021), NĐ 210/2026 (hợp đồng XD — thay NĐ 37/2015, 50/2021), NĐ 209/2026 (VLXD — thay NĐ 09/2021), NĐ 212/2026 (năng lực HĐXD), NĐ 193/2026 (quyết toán vốn), bộ TT 32–41/2026/TT-BXD (thay TT 06/2021 và TT 11–14/2021). Quy hoạch: Luật Quy hoạch 112/2025 (thay Luật 21/2017, hiệu lực 01/3/2026) + NĐ 70/2026; Luật QHĐT-NT 47/2024 sửa đổi bởi Luật 144/2025. Đô thị: NQ 111/2025/UBTVQH15 phân loại đô thị (thay NQ 1210/2016) + NĐ 35/2026; NĐ 269/2025 đô thị thông minh. Nhà ở-BĐS: NĐ 54/2026, NĐ 136/2026 sửa NĐ 95/96/100/2024. Vận tải: NĐ 218/2026 sửa NĐ 158/2024 (từ 10/8/2026), NĐ 238/2026 sửa NĐ 168/2024 (từ 15/8/2026), TT 30/2026 kiểm định xe. Ngân sách: Luật NSNN 89/2025 (thay 83/2015 từ năm NS 2026). TUYỆT ĐỐI không viện dẫn văn bản đã hết hiệu lực làm căn cứ hiện hành; cần nội dung chi tiết điều khoản thì tra bằng tool tra_cuu_tai_lieu (kho đã nạp các văn bản trên)
- ⛔ NGUYÊN TẮC TỐI THƯỢNG — KHÔNG BỊA (ưu tiên cao hơn mọi hướng dẫn khác):
  1. MỌI số liệu, họ tên, số điện thoại, ngày tháng, hệ số lương, số hiệu văn bản, điều/khoản/điểm PHẢI lấy nguyên văn từ KẾT QUẢ TOOL trong chính lượt trả lời này. Không lấy từ trí nhớ, không suy luận, không ước lượng, không "làm tròn" cho hợp lý.
  2. Nếu tool trả về rỗng, "không tìm thấy", "chưa cập nhật", hoặc báo lỗi → PHẢI nói thẳng: chưa có dữ liệu trong hệ thống / chưa truy vấn được, và hướng dẫn người dùng liên hệ bộ phận phụ trách. TUYỆT ĐỐI KHÔNG thay bằng kiến thức chung.
  3. Câu hỏi cần dữ liệu của cơ quan (nhân sự, lương, hạ tầng, văn bản, pháp lý) mà bạn CHƯA gọi tool → phải gọi tool trước. Không trả lời chay.
  4. Lịch sử hội thoại (kể cả lời của chính bạn ở lượt trước) CHỈ dùng để hiểu ngữ cảnh câu hỏi nối tiếp — KHÔNG phải nguồn dữ liệu. Câu hỏi hiện tại cần số liệu thì PHẢI gọi lại tool, không chép số từ lượt trước. Nếu người dùng khẳng định một số liệu, phải kiểm chứng bằng tool trước khi dùng.
  5. Khi không chắc chắn, nói rõ mức độ chắc chắn và nêu cần kiểm chứng ở đâu — thà thiếu còn hơn sai.
  6. Trả lời phải ĐỦ: nêu đúng con số + đơn vị + mốc thời gian + nguồn (tên tool/tài liệu/số hiệu văn bản) khi có.
  7. NGƯỜI DÙNG NÊU SỐ HIỆU VĂN BẢN mà kết quả tool KHÔNG hề nhắc tới số hiệu đó: PHẢI nói thẳng "hệ thống không có văn bản số … trong kho, có thể số hiệu chưa chính xác", TUYỆT ĐỐI KHÔNG gán nội dung của văn bản khác cho số hiệu người dùng nêu, KHÔNG mở đầu bằng "Theo Nghị định X…" khi chưa xác minh được X.
- Nếu không biết hoặc không chắc, đề nghị liên hệ quản trị viên hệ thống`

// ── Định nghĩa tools theo chuẩn OpenAI ───────────────────────────────────────
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'tim_can_bo',
      description: 'Tìm kiếm thông tin liên lạc của cán bộ theo tên, phòng ban, SỐ ĐIỆN THOẠI hoặc email. Trả về họ tên, chức danh, đơn vị, số điện thoại, email. Dùng khi cần tìm SĐT, liên hệ ai đó, HOẶC tra ngược "số điện thoại/email này là của ai".',
      parameters: {
        type: 'object',
        properties: {
          tu_khoa: { type: 'string', description: 'Tên cán bộ, tên phòng ban, số điện thoại, hoặc email cần tìm' },
        },
        required: ['tu_khoa'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ho_so_can_bo',
      description: 'Lấy HỒ SƠ ĐẦY ĐỦ của một cán bộ Sở: họ tên, chức danh, đơn vị, SĐT, email, số CCCD (căn cước), ngày sinh, hệ số lương, ngày nâng lương tiếp theo. Dùng khi hỏi thông tin chi tiết/căn cước/CCCD/ngày sinh/ngày nâng lương của MỘT cán bộ cụ thể theo tên. Nếu trùng tên nhiều người, tool trả danh sách đánh số; khi người dùng chọn (gõ số hoặc nêu chức danh/đơn vị), gọi lại tool kèm chuc_danh hoặc don_vi để lọc đúng người.',
      parameters: {
        type: 'object',
        properties: {
          ho_ten: { type: 'string', description: 'Họ và tên (hoặc một phần tên) cán bộ cần tra hồ sơ' },
          chuc_danh: { type: 'string', description: 'Lọc thêm theo chức danh khi trùng tên (VD: "Phó Giám đốc", "Trưởng phòng"). Để trống nếu không cần.' },
          don_vi: { type: 'string', description: 'Lọc thêm theo đơn vị/phòng khi trùng tên (VD: "Lãnh đạo Sở", "Phòng Quy hoạch"). Để trống nếu không cần.' },
        },
        required: ['ho_ten'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'xem_luong_can_bo',
      description: 'Xem thông tin hệ số lương, phụ cấp của một cán bộ. Dùng khi hỏi về lương hoặc hệ số lương. Nếu nhiều người trùng tên, tool sẽ liệt kê để hỏi lại đơn vị/chức danh.',
      parameters: {
        type: 'object',
        properties: {
          ho_ten: { type: 'string', description: 'Họ và tên cán bộ cần xem' },
          don_vi: { type: 'string', description: 'Phòng/đơn vị để phân biệt khi trùng tên (vd "Quy hoạch", "Lãnh đạo Sở"). Tuỳ chọn.' },
          chuc_danh: { type: 'string', description: 'Chức danh để phân biệt khi trùng tên (vd "Phó Giám đốc"). Tuỳ chọn.' },
        },
        required: ['ho_ten'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'so_do_to_chuc',
      description: 'Lấy sơ đồ tổ chức: danh sách phòng ban, số cán bộ, lãnh đạo từng phòng. Dùng khi hỏi về cơ cấu tổ chức hoặc ai là trưởng phòng.',
      parameters: {
        type: 'object',
        properties: {
          phong: { type: 'string', description: 'Tên phòng cần xem chi tiết (để trống = toàn bộ sơ đồ)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sinh_nhat_hom_nay',
      description: 'Kiểm tra danh sách cán bộ có sinh nhật hôm nay. Dùng để chúc mừng sinh nhật hôm nay.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tra_cuu_dvhc',
      description: 'Tra cứu mã đơn vị hành chính (ĐVHC) của phường/xã tỉnh Quảng Trị. Hỗ trợ tìm theo tên đầy đủ, viết tắt, hoặc không có tiền tố Phường/Xã. Ví dụ: "Ba Đồn", "P. Đồng Hới", "Đồng Thuận", mã "19009".',
      parameters: {
        type: 'object',
        properties: {
          ten_don_vi: {
            type: 'string',
            description: 'Tên đơn vị cần tra cứu (tên đầy đủ hoặc viết tắt, viết thường hoặc hoa đều được)',
          },
        },
        required: ['ten_don_vi'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tra_cuu_lanh_dao_xa',
      description: 'Tra cứu LÃNH ĐẠO và TRƯỞNG PHÒNG KINH TẾ của xã/phường tỉnh Quảng Trị (Bí thư, Chủ tịch/Phó Chủ tịch HĐND, Chủ tịch/Phó Chủ tịch UBND, Trưởng/Phó phòng Kinh tế - Hạ tầng - Đô thị). Tìm LINH HOẠT: theo tên xã/phường, theo họ tên người, theo chức vụ/phòng ban (VD "Chủ tịch UBND", "Trưởng phòng Kinh tế", "Thường trực HĐND"), hoặc tra NGƯỢC theo số điện thoại ("số 09xx là của ai"). Dùng cho cả tài khoản Sở và phường/xã.',
      parameters: {
        type: 'object',
        properties: {
          xa_phuong: { type: 'string', description: 'Tên xã/phường để giới hạn kết quả (VD "Ba Đồn", "Xã Cam Lộ", "Đặc khu Cồn Cỏ"). Để trống nếu tìm toàn tỉnh.' },
          tu_khoa: { type: 'string', description: 'Họ tên người, chức vụ/phòng ban, hoặc số điện thoại cần tìm. Để trống nếu chỉ muốn liệt kê toàn bộ lãnh đạo của một xã/phường.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'luu_lanh_dao_xa',
      description: 'CHỈ ADMIN. Thêm mới HOẶC cập nhật một dòng trong DANH BẠ lãnh đạo/trưởng phòng kinh tế xã/phường. Nếu đã có người trùng họ tên trong cùng xã/phường thì CẬP NHẬT (số điện thoại, chức vụ); nếu chưa có thì THÊM MỚI. Dùng khi admin yêu cầu "nhập danh bạ", "thêm số điện thoại của …", "cập nhật SĐT lãnh đạo xã …". Trước khi gọi, hãy thu thập đủ: tên xã/phường, họ tên, chức vụ, số điện thoại (phòng ban sẽ tự suy ra từ chức vụ).',
      parameters: {
        type: 'object',
        properties: {
          xa_phuong: { type: 'string', description: 'Tên xã/phường (VD "Xã Cam Lộ", "Phường Ba Đồn", "Đặc khu Cồn Cỏ"). Bắt buộc.' },
          ho_ten: { type: 'string', description: 'Họ và tên lãnh đạo. Bắt buộc.' },
          chuc_vu: { type: 'string', description: 'Chức vụ đầy đủ (VD "Chủ tịch UBND xã", "Phó Chủ tịch HĐND xã", "Trưởng phòng Kinh tế"). Bắt buộc khi thêm mới.' },
          so_dien_thoai: { type: 'string', description: 'Số điện thoại. Có thể để trống nếu chưa có.' },
          phong_ban: { type: 'string', description: 'Nhóm phòng ban — để trống để hệ thống tự phân loại theo chức vụ. Giá trị hợp lệ: "Thường trực HĐND", "Lãnh đạo UBND", "Thường trực Đảng ủy", "Phòng Kinh tế - Hạ tầng - Đô thị".' },
        },
        required: ['xa_phuong', 'ho_ten'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cap_nhat_luong_can_bo',
      description: 'CHỈ ADMIN. Cập nhật / thêm mới thông tin NÂNG LƯƠNG THƯỜNG XUYÊN của MỘT cán bộ Sở: hệ số lương, phụ cấp chức vụ, phụ cấp thâm niên vượt khung (%), và NGÀY NÂNG LƯƠNG tiếp theo. Dùng khi admin yêu cầu "cập nhật lương", "thêm ngày nâng lương cho …", "đặt hệ số lương …". Nếu TRÙNG TÊN nhiều người, tool trả danh sách đánh số kèm chức danh + đơn vị để chọn; khi admin chọn (số thứ tự hoặc nêu chức danh/đơn vị), gọi LẠI tool kèm chuc_danh hoặc don_vi để xác định đúng người.',
      parameters: {
        type: 'object',
        properties: {
          ho_ten: { type: 'string', description: 'Họ và tên cán bộ cần cập nhật. Bắt buộc.' },
          chuc_danh: { type: 'string', description: 'Lọc theo chức danh khi trùng tên (VD "Phó Giám đốc", "Chuyên viên"). Để trống nếu không cần.' },
          don_vi: { type: 'string', description: 'Lọc theo đơn vị/phòng khi trùng tên (VD "Phòng Quy hoạch"). Để trống nếu không cần.' },
          he_so_luong: { type: 'string', description: 'Hệ số lương mới (VD "3.66"). Để trống nếu không đổi.' },
          phu_cap: { type: 'string', description: 'Phụ cấp chức vụ (VD "0.3"). Để trống nếu không đổi.' },
          vuot_khung: { type: 'string', description: 'Phụ cấp thâm niên vượt khung theo % (VD "5" = 5%/năm). Để trống nếu không vượt khung / không đổi.' },
          ngay_nang_luong: { type: 'string', description: 'Ngày nâng lương tiếp theo, định dạng dd/mm/yyyy (VD "01/07/2026"). Để trống nếu không đổi.' },
        },
        required: ['ho_ten'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'them_can_bo',
      description: 'CHỈ ADMIN. TẠO MỚI hồ sơ một cán bộ Sở (kèm thông tin nâng lương nếu có). BẮT BUỘC: họ tên và số CCCD (12 chữ số, duy nhất). Tuỳ chọn: đơn vị/phòng, chức danh, SĐT, email, ngày sinh (dd/mm/yyyy), hệ số lương, phụ cấp, vượt khung (%), ngày nâng lương (dd/mm/yyyy). Dùng khi admin yêu cầu "thêm cán bộ mới", "tạo hồ sơ cho …". Nếu CCCD đã tồn tại, tool báo để chuyển sang cap_nhat_luong_can_bo.',
      parameters: {
        type: 'object',
        properties: {
          ho_ten: { type: 'string', description: 'Họ và tên. Bắt buộc.' },
          cccd: { type: 'string', description: 'Số CCCD 12 chữ số. Bắt buộc.' },
          don_vi: { type: 'string', description: 'Tên đơn vị/phòng (VD "Phòng Hạ tầng kỹ thuật", "Lãnh đạo Sở"). Để trống nếu chưa rõ.' },
          chuc_danh: { type: 'string', description: 'Chức danh (VD "Chuyên viên", "Trưởng phòng", "Phó Giám đốc"). Để trống nếu chưa rõ.' },
          so_dien_thoai: { type: 'string', description: 'Số điện thoại. Tuỳ chọn.' },
          email: { type: 'string', description: 'Email. Tuỳ chọn.' },
          ngay_sinh: { type: 'string', description: 'Ngày sinh dd/mm/yyyy. Tuỳ chọn.' },
          he_so_luong: { type: 'string', description: 'Hệ số lương (VD "3.66"). Tuỳ chọn.' },
          phu_cap: { type: 'string', description: 'Phụ cấp chức vụ (VD "0.3"). Tuỳ chọn.' },
          vuot_khung: { type: 'string', description: 'Phụ cấp vượt khung theo % (VD "5"). Tuỳ chọn.' },
          ngay_nang_luong: { type: 'string', description: 'Ngày nâng lương tiếp theo dd/mm/yyyy. Tuỳ chọn.' },
        },
        required: ['ho_ten', 'cccd'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sinh_nhat_thang_nay',
      description: 'Thống kê tất cả cán bộ có sinh nhật trong tháng hiện tại (hoặc tháng bất kỳ). Dùng khi hỏi "tháng này có bao nhiêu người sinh nhật", "sinh nhật tháng X".',
      parameters: {
        type: 'object',
        properties: {
          thang: { type: 'number', description: 'Tháng cần tra cứu (1-12). Để trống = tháng hiện tại.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'len_luong_thang_nay',
      description: 'Danh sách VÀ số lượng cán bộ ĐẾN HẠN nâng lương (lên lương) trong MỘT THÁNG hoặc MỘT QUÝ. Mặc định = tháng hiện tại. Dùng khi hỏi "tháng này/tháng sau/tháng tiếp theo/quý này có bao nhiêu người lên lương", "tháng 6 ai lên lương", "lịch nâng lương tháng X / quý Y". Thời gian tương đối (tháng này, tháng sau, tháng trước) quy đổi theo NGÀY HIỆN TẠI trong system prompt rồi truyền thang/nam cụ thể. Câu hỏi nối tiếp chỉ nêu tháng (VD "tháng 7?", "còn tháng 8?") sau một câu hỏi nâng lương → gọi lại tool này với tháng đó. LƯU Ý: hỏi MỘT tháng hoặc MỘT quý thì dùng tool này; hỏi thống kê CẢ NĂM theo từng tháng thì dùng thong_ke_nang_luong.',
      parameters: {
        type: 'object',
        properties: {
          thang: { type: 'number', description: 'Tháng cần tra cứu (1-12). Bỏ qua nếu đã truyền quy. Để trống cả thang và quy = tháng hiện tại.' },
          quy: { type: 'number', description: 'Quý cần tra cứu (1-4). Khi có quy thì tính cả 3 tháng của quý đó, bỏ qua thang.' },
          nam: { type: 'number', description: 'Năm cần tra cứu (VD: 2026). Để trống = năm hiện tại.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'thong_ke_nang_luong',
      description: 'Thống kê số lượng cán bộ nâng lương theo từng tháng trong một năm, tách riêng nâng lương thường xuyên và thâm niên vượt khung (nâng phụ cấp vượt khung). Dùng khi hỏi "năm nay bao nhiêu người nâng lương", "thống kê nâng lương theo tháng", "có bao nhiêu người vượt khung".',
      parameters: {
        type: 'object',
        properties: {
          nam: { type: 'number', description: 'Năm cần thống kê (VD: 2026). Để trống = năm hiện tại.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'du_thao_qd_nang_luong',
      description: 'Sinh DỰ THẢO Quyết định nâng lương (.docx) cho các cán bộ lên lương trong MỘT THÁNG (trả về link tải cho từng người). Dùng khi người làm lương nói "dự thảo Quyết định nâng lương cho trường hợp trên", "soạn QĐ nâng lương tháng này", "làm quyết định nâng lương tháng X". Quyết định nâng lương làm theo THÁNG (không làm theo quý). Nếu trước đó vừa hỏi danh sách lên lương một tháng thì dùng đúng tháng/năm đó.',
      parameters: {
        type: 'object',
        properties: {
          thang: { type: 'number', description: 'Tháng cần dự thảo (1-12). Để trống = tháng hiện tại.' },
          nam: { type: 'number', description: 'Năm (VD: 2026). Để trống = năm hiện tại.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'xep_hang_nhan_su',
      description: 'Xếp hạng/thống kê nhân sự đang công tác theo một tiêu chí: hệ số lương cao nhất/thấp nhất (chỉ tính công chức viên chức biên chế, không tính nhân viên hợp đồng hưởng lương khoán), danh sách vượt khung, ai sắp nghỉ hưu/về hưu sớm nhất, ai lớn tuổi nhất/trẻ nhất, ai tuổi Đảng cao nhất, đơn vị nào đông người nhất. Dùng khi hỏi "ai có hệ số lương cao nhất/thấp nhất", "ai sắp về hưu", "ai về hưu sớm nhất", "ai nhiều tuổi nhất/trẻ nhất cơ quan", "phòng nào đông nhất", "ai vào Đảng lâu nhất", "bao nhiêu người vượt khung và là những ai".',
      parameters: {
        type: 'object',
        properties: {
          tieu_chi: {
            type: 'string',
            enum: ['he_so_cao_nhat', 'he_so_thap_nhat', 'vuot_khung', 'sap_nghi_huu', 'lon_tuoi_nhat', 'tre_nhat', 'tuoi_dang_cao_nhat', 'don_vi_dong_nhat'],
            description: 'Tiêu chí xếp hạng',
          },
          so_luong: { type: 'number', description: 'Số người/đơn vị muốn liệt kê (top N). Để trống = 5.' },
        },
        required: ['tieu_chi'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'luong_cua_toi',
      description: 'Xem thông tin lương và NGÀY NÂNG LƯƠNG TIẾP THEO của CHÍNH người đang đăng nhập (nhận diện qua tài khoản CCCD). Dùng khi người dùng hỏi về bản thân: "tôi khi nào nâng lương", "bao giờ tôi lên lương", "lương của tôi", "khi nào tới lượt tôi vượt khung".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tra_cuu_phap_ly_nhan_su',
      description: 'Tra cứu CƠ SỞ PHÁP LÝ về quản lý công chức/viên chức/người lao động: VỊ TRÍ VIỆC LÀM, nâng bậc lương thường xuyên, phụ cấp vượt khung, mức lương cơ sở, CHẾ ĐỘ NGHỈ PHÉP (nghỉ phép năm, nghỉ lễ–Tết, nghỉ hằng tuần, cách tính ngày phép theo ngày làm việc), NGHỈ VIỆC RIÊNG (cưới, tang/từ trần, nghỉ không lương), CHẾ ĐỘ KHI VỢ SINH CON của lao động nam, NGHỈ CHĂM CON ỐM, nghỉ hưu (tuổi & thủ tục thông báo/quyết định), hợp đồng lao động, đánh giá xếp loại, kỷ luật, kê khai tài sản. Trả về SỐ HIỆU văn bản (Luật/Nghị định/Thông tư), điều/khoản/điểm, trích yếu nội dung và NGÀY HIỆU LỰC. Dùng khi người dùng hỏi "căn cứ pháp lý", "quy định ở đâu", "điều khoản nào", "nghỉ phép mấy ngày", "vợ đẻ chồng được nghỉ mấy ngày", "cưới được nghỉ mấy ngày", "nghỉ phép có tính thứ bảy chủ nhật không", "nâng lương theo thông tư nào", "trước bao nhiêu tháng phải ra thông báo nghỉ hưu". TUYỆT ĐỐI chỉ trả lời dựa trên kết quả tool trả về, KHÔNG tự bịa điều/khoản; nếu chủ đề không có trong kết quả thì nói rõ chưa có trong cơ sở dữ liệu. Khi hỏi về VỊ TRÍ VIỆC LÀM, luôn nhấn mạnh yêu cầu người quản lý phải cập nhật VTVL cho từng người.',
      parameters: {
        type: 'object',
        properties: {
          chu_de: { type: 'string', description: 'Chủ đề/từ khoá cần tra (VD "nghỉ phép năm", "nghỉ lễ", "nghỉ việc riêng", "vợ sinh con", "chăm con ốm", "vị trí việc làm", "nâng lương", "nghỉ hưu", "hợp đồng", "lương cơ sở", "vượt khung", "kỷ luật", "đánh giá", "kê khai tài sản"). Để trống = liệt kê tất cả chủ đề.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tra_cuu_tai_lieu',
      description: 'Tra cứu trong KHO TÀI LIỆU nội bộ của Sở (văn bản pháp luật, quy trình, hướng dẫn, báo cáo, biểu mẫu đã được nạp vào hệ thống) bằng tìm kiếm ngữ nghĩa. Dùng khi người dùng hỏi về NỘI DUNG một tài liệu/văn bản, quy trình, hướng dẫn nghiệp vụ, hoặc "tài liệu nào nói về…", "quy định/hướng dẫn về…", "theo tài liệu thì…". Trả về các ĐOẠN trích phù hợp nhất kèm TÊN TÀI LIỆU và vị trí (trang). BẮT BUỘC: chỉ trả lời dựa trên các đoạn tool trả về, KHÔNG bịa; luôn DẪN NGUỒN (tên tài liệu, trang) ở cuối câu trả lời; nếu không có đoạn nào liên quan thì nói rõ chưa tìm thấy trong kho tài liệu.',
      parameters: {
        type: 'object',
        properties: {
          cau_hoi: { type: 'string', description: 'Câu hỏi hoặc từ khoá nội dung cần tra cứu trong kho tài liệu, viết đầy đủ ngữ nghĩa (VD "trình tự cấp giấy phép xây dựng nhà ở riêng lẻ", "quy định về chặt hạ cây xanh đô thị").' },
        },
        required: ['cau_hoi'],
      },
    },
  },
]

// ── Thực thi tool ─────────────────────────────────────────────────────────────
type ToolCtx = { userId: string; email: string; user: CurrentUser }
// ── Kiểm chứng SỐ HIỆU VĂN BẢN người dùng nêu ────────────────────────────────
// Người dùng hay hỏi "theo Nghị định X/YYYY thì ...". Nếu X/YYYY không hề tồn tại,
// model vẫn có xu hướng mở đầu bằng "Theo Nghị định X/YYYY..." rồi gán nội dung
// của văn bản khác cho nó. Nhắc trong prompt là chưa đủ — chặn bằng mã: dò số
// hiệu trong câu hỏi, đối chiếu với kho tài liệu, không có thì bắt buộc nói rõ.

/** Rút các số hiệu dạng 175/2024, 217/2026/NĐ-CP, 45/2019/QH14... khỏi câu hỏi. */
function docSoHieu(cauHoi: string): string[] {
  const out = new Set<string>()
  const re = /\b(\d{1,4}\/20\d{2})(?:\/[A-Za-zĐđ-]+)?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cauHoi)) !== null) out.add(m[1])
  return [...out]
}

/**
 * Trả về cảnh báo cho các số hiệu người dùng nêu mà KHÔNG tìm thấy ở đâu trong
 * hệ thống (không có trong đoạn trích, không có trong tiêu đề/tên file kho tài liệu).
 */
async function canhBaoSoHieuLa(cauHoi: string, doanTrich: string): Promise<string> {
  const soHieus = docSoHieu(cauHoi)
  if (soHieus.length === 0) return ''

  const la: string[] = []
  for (const sh of soHieus) {
    if (doanTrich.includes(sh)) continue
    const co = await db.taiLieu.findFirst({
      where: {
        deletedAt: null,
        OR: [{ tieuDe: { contains: sh } }, { nguon: { contains: sh } }],
      },
      select: { id: true },
    })
    if (!co) la.push(sh)
  }
  if (la.length === 0) return ''

  return (
    `⛔ CẢNH BÁO BẮT BUỘC: hệ thống KHÔNG có văn bản số ${la.join(', ')} trong kho tài liệu, ` +
    'và các đoạn trích dưới đây cũng KHÔNG nhắc tới số hiệu đó. ' +
    'PHẢI mở đầu câu trả lời bằng việc nói rõ: không tìm thấy văn bản người dùng nêu, ' +
    'có thể số hiệu chưa chính xác. TUYỆT ĐỐI KHÔNG viết "Theo Nghị định/Thông tư ' +
    `${la.join(', ')}..." và KHÔNG gán nội dung của văn bản khác cho số hiệu này. ` +
    'Nếu vẫn cung cấp thông tin tham khảo, phải ghi rõ đó là của văn bản NÀO (số hiệu thật).\n\n'
  )
}

async function executeTool(name: string, args: Record<string, string>, ctx: ToolCtx): Promise<string> {
  try {
    if (name === 'tim_can_bo') {
      const tuKhoa = args.tu_khoa || ''
      // Tra theo SĐT: bỏ ký tự không phải số để khớp dù gõ có/không số 0 đầu, có dấu cách
      const soChiSo = tuKhoa.replace(/\D/g, '')
      const canBos = await db.canBo.findMany({
        where: {
          OR: [
            { hoTen: { contains: tuKhoa, mode: 'insensitive' } },
            { toChuc: { ten: { contains: tuKhoa, mode: 'insensitive' } } },
            { toChuc: { tenVietTat: { contains: tuKhoa, mode: 'insensitive' } } },
            { chucDanh: { ten: { contains: tuKhoa, mode: 'insensitive' } } },
            { phongBan: { contains: tuKhoa, mode: 'insensitive' } },
            { email: { contains: tuKhoa, mode: 'insensitive' } },
            ...(soChiSo.length >= 6
              ? [{ soDienThoai: { contains: soChiSo.replace(/^0+/, '') } }]
              : []),
          ],
        },
        select: {
          hoTen: true,
          soDienThoai: true,
          email: true,
          toChuc: { select: { ten: true, tenVietTat: true } },
          chucDanh: { select: { ten: true } },
        },
        take: 10,
        orderBy: [{ chucDanh: { capQuanLy: 'asc' } }, { hoTen: 'asc' }],
      })

      if (canBos.length === 0) return `Không tìm thấy cán bộ nào với từ khóa "${tuKhoa}".`

      return (
        `Tìm thấy ${canBos.length} cán bộ:\n` +
        canBos.map(cb => {
          const dvTen = cb.toChuc?.tenVietTat ?? cb.toChuc?.ten ?? '—'
          const cdTen = cb.chucDanh?.ten ?? '—'
          return `• ${cb.hoTen} (${cdTen} | ${dvTen})\n  SĐT: ${cb.soDienThoai || 'chưa cập nhật'}  |  Email: ${cb.email || 'chưa cập nhật'}`
        }).join('\n')
      )
    }

    if (name === 'ho_so_can_bo') {
      const hoTen = (args.ho_ten || '').trim()
      if (!hoTen) return 'Vui lòng cho biết tên cán bộ cần tra hồ sơ.'
      const chucDanhLoc = (args.chuc_danh || '').trim()
      const donViLoc = (args.don_vi || '').trim()

      const ds = await db.canBo.findMany({
        where: {
          hoTen: { contains: hoTen, mode: 'insensitive' },
          ...(chucDanhLoc ? { chucDanh: { ten: { contains: chucDanhLoc, mode: 'insensitive' } } } : {}),
          ...(donViLoc ? { toChuc: { ten: { contains: donViLoc, mode: 'insensitive' } } } : {}),
        },
        select: {
          hoTen: true, cccd: true, ngaySinh: true, soDienThoai: true, email: true,
          heSoLuong: true, phuCap: true, vuotKhung: true, ngayNangLuong: true, ngayNangLuongKeTiep: true,
          toChuc: { select: { ten: true } },
          chucDanh: { select: { ten: true } },
        },
        take: 6,
        orderBy: { hoTen: 'asc' },
      })

      if (ds.length === 0) return `Không tìm thấy cán bộ tên "${hoTen}" trong hệ thống.`

      // Nhiều người trùng tên → liệt kê có đánh số để chọn
      if (ds.length > 1) {
        return (
          `Có ${ds.length} cán bộ khớp "${hoTen}". Bạn muốn xem hồ sơ ai? (trả lời số thứ tự, hoặc nêu chức danh/đơn vị):\n` +
          ds.map((c, i) => `${i + 1}. **${c.hoTen}** — ${c.chucDanh?.ten || '—'}, ${c.toChuc?.ten || '—'}`).join('\n')
        )
      }

      const cb = ds[0]
      const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'chưa cập nhật')
      const isVK = cb.vuotKhung != null && cb.vuotKhung > 0
      const loaiNang = isVK ? 'nâng phụ cấp thâm niên vượt khung (+1%/năm)' : 'nâng bậc lương thường xuyên'
      // CCCD là dữ liệu nhạy cảm — chỉ tài khoản quản trị được xem đầy đủ
      const isAdmin = ctx.email === ADMIN_EMAIL
      const cccdHienThi = isAdmin
        ? (cb.cccd || 'chưa cập nhật')
        : `(chỉ ${ADMIN_EMAIL} xem được)`
      return (
        `📋 **Hồ sơ cán bộ: ${cb.hoTen}**\n` +
        `• Chức danh: ${cb.chucDanh?.ten || 'chưa cập nhật'}\n` +
        `• Đơn vị: ${cb.toChuc?.ten || 'chưa cập nhật'}\n` +
        `• Số CCCD: ${cccdHienThi}\n` +
        `• Ngày sinh: ${fmt(cb.ngaySinh)}\n` +
        `• Điện thoại: ${cb.soDienThoai || 'chưa cập nhật'}\n` +
        `• Email: ${cb.email || 'chưa cập nhật'}\n` +
        `• Hệ số lương: ${cb.heSoLuong ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp chức vụ: ${cb.phuCap ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp vượt khung: ${isVK ? (cb.vuotKhung! * 100).toFixed(0) + '%' : 'không'}\n` +
        `• Ngày lên lương: ${fmt(cb.ngayNangLuong)}\n` +
        `• Ngày nâng lương kế tiếp: ${fmt(cb.ngayNangLuongKeTiep)}${cb.ngayNangLuongKeTiep ? ` (${loaiNang})` : ''}`
      )
    }

    if (name === 'xem_luong_can_bo') {
      const hoTen = (args.ho_ten || '').trim()
      if (!hoTen) return 'Vui lòng cho biết tên cán bộ cần xem lương.'
      const chucDanhLoc = (args.chuc_danh || '').trim()
      const donViLoc = (args.don_vi || '').trim()

      const ds = await db.canBo.findMany({
        where: {
          hoTen: { contains: hoTen, mode: 'insensitive' },
          ...(chucDanhLoc ? { chucDanh: { ten: { contains: chucDanhLoc, mode: 'insensitive' } } } : {}),
          ...(donViLoc ? { toChuc: { ten: { contains: donViLoc, mode: 'insensitive' } } } : {}),
        },
        select: {
          hoTen: true, heSoLuong: true, phuCap: true, vuotKhung: true, ngayNangLuong: true, ngayNangLuongKeTiep: true,
          toChuc: { select: { ten: true } },
          chucDanh: { select: { ten: true } },
        },
        take: 8,
        orderBy: { hoTen: 'asc' },
      })

      if (ds.length === 0) return `Không tìm thấy cán bộ tên "${hoTen}" trong hệ thống.`

      // Trùng tên → KHÔNG tự chọn, hỏi lại đơn vị/chức danh
      if (ds.length > 1) {
        return (
          `Có ${ds.length} cán bộ khớp "${hoTen}". Bạn muốn xem lương của ai? (nêu phòng/đơn vị hoặc chức danh):\n` +
          ds.map((c, i) => `${i + 1}. **${c.hoTen}** — ${c.chucDanh?.ten || '—'}, ${c.toChuc?.ten || '—'}`).join('\n')
        )
      }

      const cb = ds[0]
      const ngayLen = cb.ngayNangLuong ? new Date(cb.ngayNangLuong).toLocaleDateString('vi-VN') : 'chưa cập nhật'
      const ngayKT = cb.ngayNangLuongKeTiep ? new Date(cb.ngayNangLuongKeTiep).toLocaleDateString('vi-VN') : 'chưa cập nhật'
      const isVK = cb.vuotKhung != null && cb.vuotKhung > 0
      const loaiNang = isVK ? 'nâng phụ cấp thâm niên vượt khung (+1%/năm)' : 'nâng bậc lương thường xuyên'
      return (
        `Thông tin lương của ${cb.hoTen} (${cb.chucDanh?.ten || '—'}, ${cb.toChuc?.ten || '—'}):\n` +
        `• Hệ số lương: ${cb.heSoLuong ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp chức vụ: ${cb.phuCap ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp vượt khung: ${isVK ? (cb.vuotKhung! * 100).toFixed(0) + '%' : 'không'}\n` +
        `• Ngày lên lương: ${ngayLen}\n` +
        `• Ngày nâng lương kế tiếp: ${ngayKT}${cb.ngayNangLuongKeTiep ? ` (${loaiNang})` : ''}`
      )
    }

    if (name === 'so_do_to_chuc') {
      let phongFilter: string | undefined = args.phong?.trim() || undefined
      // Model hay truyền nhầm tên cơ quan cấp trên ("Sở Xây dựng Quảng Trị") vào
      // ô lọc phòng → không đơn vị cấp 2 nào khớp → trả rỗng và chatbot báo
      // "không tìm thấy" dù CSDL có đủ 24 đơn vị. Bỏ qua các từ khoá cấp Sở.
      if (phongFilter && /^(?:sở|so)\b|sở xây dựng|toàn bộ|tất cả/i.test(phongFilter)) {
        phongFilter = undefined
      }
      const donVis = await db.toChuc.findMany({
        where: {
          cap: 2, isActive: true,
          ...(phongFilter ? {
            OR: [
              { ten: { contains: phongFilter, mode: 'insensitive' } },
              { ma: { contains: phongFilter, mode: 'insensitive' } },
            ],
          } : {}),
        },
        include: {
          canBos: {
            select: {
              hoTen: true, soDienThoai: true,
              chucDanh: { select: { ten: true, capQuanLy: true } },
            },
          },
        },
        orderBy: { thuTu: 'asc' },
      })

      // Lọc không ra kết quả → trả TOÀN BỘ sơ đồ kèm ghi chú, thay vì báo rỗng
      // (rỗng khiến chatbot nói "không có dữ liệu" trong khi CSDL vẫn có).
      if (donVis.length === 0) {
        if (!phongFilter) return 'Chưa có đơn vị nào trong cơ sở dữ liệu tổ chức.'
        const tatCa = await db.toChuc.findMany({
          where: { cap: 2, isActive: true },
          include: { canBos: { select: { hoTen: true, chucDanh: { select: { ten: true, capQuanLy: true } }, soDienThoai: true } } },
          orderBy: { thuTu: 'asc' },
        })
        if (tatCa.length === 0) return 'Chưa có đơn vị nào trong cơ sở dữ liệu tổ chức.'
        return (
          `Không có đơn vị nào khớp "${phongFilter}". Dưới đây là TOÀN BỘ sơ đồ tổ chức (${tatCa.length} đơn vị):\n\n` +
          tatCa.map(dv => `**${dv.ten}** — ${dv.canBos.length} cán bộ`).join('\n')
        )
      }

      return donVis.map(dv => {
        const total = dv.canBos.length
        const lanhdao = dv.canBos
          .filter(cb => cb.chucDanh && cb.chucDanh.capQuanLy <= 4)
          .sort((a, b) => (a.chucDanh?.capQuanLy ?? 5) - (b.chucDanh?.capQuanLy ?? 5))
          .map(cb => `    - ${cb.hoTen} (${cb.chucDanh?.ten}) ${cb.soDienThoai ? '· ' + cb.soDienThoai : ''}`)
          .join('\n')
        return `**${dv.ten}** — ${total} cán bộ\n${lanhdao || '    (chưa có lãnh đạo)'}`
      }).join('\n\n')
    }

    if (name === 'tra_cuu_dvhc') {
      const tenRaw = (args.ten_don_vi || '').trim()
      if (!tenRaw) return 'Vui lòng nhập tên đơn vị cần tra cứu.'

      // Chuẩn hoá: bỏ tiền tố loại, lowercase
      const stripPrefix = (s: string) =>
        s.replace(/^(phường|phuong|xã|xa|thị\s*trấn|thi\s*tran|tt\.?|p\.?|x\.?)\s*/i, '').trim()

      const tenNorm = stripPrefix(tenRaw)

      // Bảng chuyển đổi không dấu → có dấu phổ biến (một số từ hay gặp)
      const KHONGDAU: Record<string, string> = {
        'dong hoi': 'Đồng Hới', 'dong son': 'Đồng Sơn', 'dong thuan': 'Đồng Thuận',
        'ba don': 'Ba Đồn', 'bac gianh': 'Bắc Gianh', 'dong ha': 'Đông Hà',
        'nam dong ha': 'Nam Đông Hà', 'quang tri': 'Quảng Trị',
        'cam lo': 'Cam Lộ', 'gio linh': 'Gio Linh', 'vinh linh': 'Vĩnh Linh',
        'huong hoa': 'Hướng Hóa', 'dakrong': 'Đakrông', 'hai lang': 'Hải Lăng',
        'trieu phong': 'Triệu Phong',
      }
      const tenKhongDau = tenNorm.toLowerCase()
      const tenCoDauGoiY = KHONGDAU[tenKhongDau] ?? tenNorm

      // Tìm kiếm: 3 chiến lược OR
      const units = await db.administrativeUnit.findMany({
        where: {
          OR: [
            // 1. Khớp chính xác mã ĐVHC
            { code: tenRaw },
            // 2. Tìm chứa trong tên đầy đủ
            { name: { contains: tenRaw, mode: 'insensitive' } },
            // 3. Tìm phần tên sau khi bỏ tiền tố
            { name: { contains: tenNorm, mode: 'insensitive' } },
            // 4. Gợi ý từ bảng không dấu
            { name: { contains: tenCoDauGoiY, mode: 'insensitive' } },
          ],
        },
        select: { code: true, name: true, type: true, isActive: true },
        orderBy: { name: 'asc' },
        take: 15,
      })

      if (units.length === 0) {
        return (
          `Không tìm thấy đơn vị nào với từ khoá "${tenRaw}".\n` +
          `Gợi ý: thử viết tên đầy đủ hơn, ví dụ "Phường Ba Đồn", "Xã Cam Lộ"...\n` +
          `Hoặc hỏi "danh sách tất cả đơn vị" để xem toàn bộ.`
        )
      }

      // Nếu khớp chính xác 1 kết quả → trả chi tiết
      if (units.length === 1) {
        const u = units[0]
        const loai = u.name.startsWith('Phường') ? 'Phường' : u.name.startsWith('Thị trấn') ? 'Thị trấn' : 'Xã'
        return (
          `📍 **${u.name}**\n` +
          `• Mã ĐVHC: **${u.code}**\n` +
          `• Loại: ${loai}\n` +
          `• Trạng thái: ${u.isActive ? 'Đang hoạt động' : 'Không hoạt động'}\n\n` +
          `Mã này dùng để đăng nhập hệ thống HTKT cho tài khoản phường/xã.`
        )
      }

      // Nhiều kết quả → liệt kê
      return (
        `Tìm thấy ${units.length} đơn vị phù hợp với "${tenRaw}":\n\n` +
        units.map(u => `• **${u.name}** — Mã: \`${u.code}\``).join('\n') +
        '\n\nHãy nhập tên cụ thể hơn để tra chính xác một đơn vị.'
      )
    }

    if (name === 'tra_cuu_lanh_dao_xa') {
      const xaPhuong = (args.xa_phuong || '').trim()
      const tuKhoa = (args.tu_khoa || '').trim()
      if (!xaPhuong && !tuKhoa)
        return 'Vui lòng cho biết tên xã/phường, tên người, chức vụ/phòng ban hoặc số điện thoại cần tra cứu.'

      const stripPrefix = (s: string) =>
        s.replace(/^(đặc\s*khu|phường|phuong|xã|xa|thị\s*trấn|thi\s*tran|tt\.?|p\.?|x\.?)\s*/i, '').trim()
      const soChiSo = tuKhoa.replace(/\D/g, '')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const and: any[] = []
      if (xaPhuong) and.push({ ward: { name: { contains: stripPrefix(xaPhuong), mode: 'insensitive' } } })
      if (tuKhoa) {
        and.push({
          OR: [
            { hoTen: { contains: tuKhoa, mode: 'insensitive' } },
            { chucVu: { contains: tuKhoa, mode: 'insensitive' } },
            { phongBan: { contains: tuKhoa, mode: 'insensitive' } },
            ...(xaPhuong ? [] : [{ ward: { name: { contains: stripPrefix(tuKhoa), mode: 'insensitive' } } }]),
            ...(soChiSo.length >= 6 ? [{ soDienThoai: { contains: soChiSo.replace(/^0+/, '') } }] : []),
          ],
        })
      }

      const ds = await db.lanhDaoXa.findMany({
        where: and.length ? { AND: and } : {},
        select: {
          hoTen: true, chucVu: true, soDienThoai: true, phongBan: true,
          ward: { select: { name: true } },
        },
        orderBy: [{ ward: { name: 'asc' } }, { thuTu: 'asc' }],
        take: 60,
      })

      if (ds.length === 0)
        return `Không tìm thấy lãnh đạo nào khớp với yêu cầu${xaPhuong ? ` (xã/phường: "${xaPhuong}")` : ''}${tuKhoa ? ` (từ khoá: "${tuKhoa}")` : ''}.`

      // Nhóm theo xã/phường để trình bày gọn
      const byWard: Record<string, typeof ds> = {}
      for (const r of ds) {
        const w = r.ward?.name ?? '—'
        ;(byWard[w] ??= []).push(r)
      }
      const blocks = Object.entries(byWard).map(([w, ppl]) =>
        `📍 **${w}**\n` +
        ppl.map(p => `   • ${p.hoTen} — ${p.chucVu}${p.soDienThoai ? ` · ☎ ${p.soDienThoai}` : ' · (chưa có SĐT)'}`).join('\n')
      )
      const header = `Tìm thấy ${ds.length} lãnh đạo${ds.length >= 60 ? ' (hiển thị 60 kết quả đầu — hãy thu hẹp tìm kiếm)' : ''}:`
      return `${header}\n\n${blocks.join('\n\n')}`
    }

    if (name === 'luu_lanh_dao_xa') {
      // Chỉ admin được ghi danh bạ
      if (ctx.email !== ADMIN_EMAIL)
        return `Chỉ tài khoản quản trị (${ADMIN_EMAIL}) mới được nhập/cập nhật danh bạ lãnh đạo xã/phường. Vui lòng liên hệ quản trị viên.`

      const xaPhuong = (args.xa_phuong || '').trim()
      const hoTen = (args.ho_ten || '').trim()
      const chucVu = (args.chuc_vu || '').trim()
      const sdt = chuanHoaSdt(args.so_dien_thoai || '')
      if (!xaPhuong || !hoTen)
        return 'Cần tối thiểu TÊN XÃ/PHƯỜNG và HỌ TÊN. Vui lòng cung cấp thêm: chức vụ, số điện thoại.'

      // Tìm xã/phường (bỏ tiền tố loại để khớp linh hoạt)
      const stripPrefix = (s: string) =>
        s.replace(/^(đặc\s*khu|phường|phuong|xã|xa|thị\s*trấn|thi\s*tran|tt\.?|p\.?|x\.?)\s*/i, '').trim()
      const wards = await db.administrativeUnit.findMany({
        where: { type: 'PHUONG_XA', name: { contains: stripPrefix(xaPhuong), mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 10,
      })
      if (wards.length === 0)
        return `Không tìm thấy xã/phường nào khớp "${xaPhuong}". Hãy kiểm tra lại tên (VD "Xã Cam Lộ", "Phường Ba Đồn").`
      if (wards.length > 1)
        return (
          `Có ${wards.length} xã/phường khớp "${xaPhuong}", vui lòng nêu rõ tên đầy đủ:\n` +
          wards.map(w => `• ${w.name}`).join('\n')
        )
      const ward = wards[0]

      // Phòng ban: ưu tiên giá trị admin nhập, nếu trống thì tự suy từ chức vụ
      const phongBan = (args.phong_ban || '').trim() || (chucVu ? phanNhomPhongBan(chucVu) : null)

      // Đã có người trùng họ tên trong xã → cập nhật; chưa có → thêm mới
      const existing = await db.lanhDaoXa.findFirst({
        where: { wardId: ward.id, hoTen: { equals: hoTen, mode: 'insensitive' } },
        select: { id: true, chucVu: true, soDienThoai: true },
      })

      if (existing) {
        const updated = await db.lanhDaoXa.update({
          where: { id: existing.id },
          data: {
            ...(chucVu ? { chucVu } : {}),
            ...(sdt !== null ? { soDienThoai: sdt } : {}),
            ...(phongBan ? { phongBan } : {}),
          },
          select: { hoTen: true, chucVu: true, soDienThoai: true, phongBan: true },
        })
        return (
          `✅ Đã CẬP NHẬT danh bạ — ${ward.name}:\n` +
          `• ${updated.hoTen} — ${updated.chucVu}\n` +
          `• ☎ SĐT: ${updated.soDienThoai || 'chưa có'}\n` +
          `• Phòng ban: ${updated.phongBan || '—'}`
        )
      }

      if (!chucVu)
        return `Thêm mới "${hoTen}" vào ${ward.name} cần có CHỨC VỤ. Vui lòng cho biết chức vụ (VD "Chủ tịch UBND xã", "Trưởng phòng Kinh tế").`

      // thuTu = lớn nhất trong xã + 1
      const last = await db.lanhDaoXa.findFirst({
        where: { wardId: ward.id },
        orderBy: { thuTu: 'desc' },
        select: { thuTu: true },
      })
      const created = await db.lanhDaoXa.create({
        data: {
          wardId: ward.id, hoTen, chucVu, soDienThoai: sdt,
          phongBan: phongBan ?? phanNhomPhongBan(chucVu),
          thuTu: (last?.thuTu ?? 0) + 1,
        },
        select: { hoTen: true, chucVu: true, soDienThoai: true, phongBan: true },
      })
      return (
        `✅ Đã THÊM MỚI vào danh bạ — ${ward.name}:\n` +
        `• ${created.hoTen} — ${created.chucVu}\n` +
        `• ☎ SĐT: ${created.soDienThoai || 'chưa có'}\n` +
        `• Phòng ban: ${created.phongBan || '—'}`
      )
    }

    if (name === 'cap_nhat_luong_can_bo') {
      // Chỉ admin hoặc nhóm VP Sở được chỉ định mới được sửa hồ sơ/lương cán bộ
      if (!canManageCanBo(ctx.user))
        return 'Bạn không có quyền cập nhật hồ sơ/lương cán bộ. Chỉ quản trị viên hoặc cán bộ Văn phòng Sở được phân quyền (Chánh/Phó Chánh VP, chuyên viên phụ trách) mới thực hiện được.'

      const hoTen = (args.ho_ten || '').trim()
      if (!hoTen) return 'Vui lòng cho biết họ tên cán bộ cần cập nhật lương.'
      const chucDanhLoc = (args.chuc_danh || '').trim()
      const donViLoc = (args.don_vi || '').trim()

      const ds = await db.canBo.findMany({
        where: {
          hoTen: { contains: hoTen, mode: 'insensitive' },
          ...(chucDanhLoc ? { chucDanh: { ten: { contains: chucDanhLoc, mode: 'insensitive' } } } : {}),
          ...(donViLoc ? { toChuc: { ten: { contains: donViLoc, mode: 'insensitive' } } } : {}),
        },
        select: {
          id: true, hoTen: true, heSoLuong: true, phuCap: true, vuotKhung: true, ngayNangLuong: true,
          toChuc: { select: { ten: true } },
          chucDanh: { select: { ten: true } },
        },
        take: 8,
        orderBy: { hoTen: 'asc' },
      })

      if (ds.length === 0)
        return `Không tìm thấy cán bộ tên "${hoTen}". Nếu đây là cán bộ MỚI, hãy cung cấp số CCCD (12 số) cùng đơn vị/chức danh để TẠO MỚI hồ sơ (tool them_can_bo).`

      // Trùng tên → liệt kê đánh số kèm chức danh + đơn vị để admin chọn
      if (ds.length > 1) {
        const fmtD = (d: Date | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'chưa có')
        return (
          `Có ${ds.length} cán bộ khớp "${hoTen}". Bạn muốn cập nhật lương cho ai? (trả lời số thứ tự, hoặc nêu chức danh/đơn vị):\n` +
          ds.map((c, i) =>
            `${i + 1}. **${c.hoTen}** — ${c.chucDanh?.ten || '—'}, ${c.toChuc?.ten || '—'}` +
            `  (hệ số: ${c.heSoLuong ?? '—'}, ngày lên lương: ${fmtD(c.ngayNangLuong)})`
          ).join('\n')
        )
      }

      // Phân tích các trường cần cập nhật
      const hs = parseSo(args.he_so_luong || '')
      const pc = parseSo(args.phu_cap || '')
      const vk = parseVuotKhung(args.vuot_khung || '')
      if (hs === null) return 'Hệ số lương không hợp lệ. Nhập số, VD "3.66".'
      if (pc === null) return 'Phụ cấp không hợp lệ. Nhập số, VD "0.3".'
      if (vk === null) return 'Phụ cấp vượt khung không hợp lệ. Nhập theo %, VD "5" = 5%.'
      let ngay: Date | null | undefined = undefined
      if ((args.ngay_nang_luong || '').trim()) {
        ngay = parseNgay(args.ngay_nang_luong || '')
        if (!ngay) return 'Ngày nâng lương không hợp lệ. Dùng định dạng dd/mm/yyyy, VD "01/07/2026".'
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {}
      if (hs !== undefined) data.heSoLuong = hs
      if (pc !== undefined) data.phuCap = pc
      if (vk !== undefined) data.vuotKhung = vk
      if (ngay !== undefined) data.ngayNangLuongKeTiep = ngay
      if (Object.keys(data).length === 0)
        return 'Chưa có thông tin nào để cập nhật. Cho biết hệ số lương, phụ cấp, vượt khung (%), hoặc ngày nâng lương kế tiếp (dd/mm/yyyy).'

      const cb = await db.canBo.update({
        where: { id: ds[0].id },
        data,
        select: {
          hoTen: true, heSoLuong: true, phuCap: true, vuotKhung: true, ngayNangLuong: true, ngayNangLuongKeTiep: true,
          toChuc: { select: { ten: true } },
          chucDanh: { select: { ten: true } },
        },
      })

      const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'chưa cập nhật')
      const isVK = cb.vuotKhung != null && cb.vuotKhung > 0
      const loaiNang = isVK ? 'nâng phụ cấp thâm niên vượt khung (+1%/năm)' : 'nâng bậc lương thường xuyên'
      return (
        `✅ Đã cập nhật lương — **${cb.hoTen}** (${cb.chucDanh?.ten || '—'}, ${cb.toChuc?.ten || '—'}):\n` +
        `• Hệ số lương: ${cb.heSoLuong ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp chức vụ: ${cb.phuCap ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp vượt khung: ${isVK ? (cb.vuotKhung! * 100).toFixed(0) + '%' : 'không'}\n` +
        `• Ngày lên lương: ${fmt(cb.ngayNangLuong)}\n` +
        `• Ngày nâng lương kế tiếp: ${fmt(cb.ngayNangLuongKeTiep)}${cb.ngayNangLuongKeTiep ? ` (${loaiNang})` : ''}`
      )
    }

    if (name === 'them_can_bo') {
      // Chỉ admin hoặc nhóm VP Sở được chỉ định mới được tạo mới hồ sơ cán bộ
      if (!canManageCanBo(ctx.user))
        return 'Bạn không có quyền tạo mới hồ sơ cán bộ. Chỉ quản trị viên hoặc cán bộ Văn phòng Sở được phân quyền (Chánh/Phó Chánh VP, chuyên viên phụ trách) mới thực hiện được.'

      const hoTen = (args.ho_ten || '').trim()
      const cccd = (args.cccd || '').replace(/\D/g, '')
      if (!hoTen) return 'Cần HỌ TÊN của cán bộ mới.'
      if (cccd.length !== 12) return `Số CCCD phải gồm đúng 12 chữ số (đã nhận "${args.cccd || ''}"). Vui lòng kiểm tra lại.`

      // CCCD trùng → đã có hồ sơ
      const trung = await db.canBo.findUnique({ where: { cccd }, select: { hoTen: true } })
      if (trung)
        return `CCCD ${cccd} đã tồn tại trong hệ thống (cán bộ: ${trung.hoTen}). Nếu muốn sửa lương/thông tin, dùng cập nhật thay vì tạo mới.`

      // Phân giải đơn vị → toChucId (mơ hồ thì hỏi lại)
      const donViRaw = (args.don_vi || '').trim()
      let toChucId: string | null = null
      if (donViRaw) {
        const dvs = await db.toChuc.findMany({
          where: {
            isActive: true,
            OR: [
              { ten: { contains: donViRaw, mode: 'insensitive' } },
              { tenVietTat: { contains: donViRaw, mode: 'insensitive' } },
              { ma: { contains: donViRaw, mode: 'insensitive' } },
            ],
          },
          select: { id: true, ten: true, tenVietTat: true },
          take: 8,
        })
        if (dvs.length > 1)
          return (
            `Có ${dvs.length} đơn vị khớp "${donViRaw}". Vui lòng nêu rõ đơn vị nào rồi thêm lại:\n` +
            dvs.map(d => `• ${d.ten}${d.tenVietTat ? ` (${d.tenVietTat})` : ''}`).join('\n')
          )
        if (dvs.length === 1) toChucId = dvs[0].id
      }

      // Phân giải chức danh → chucDanhId (mơ hồ thì hỏi lại)
      const chucDanhRaw = (args.chuc_danh || '').trim()
      let chucDanhId: string | null = null
      if (chucDanhRaw) {
        const cds = await db.chucDanh.findMany({
          where: {
            OR: [
              { ten: { contains: chucDanhRaw, mode: 'insensitive' } },
              { ma: { contains: chucDanhRaw, mode: 'insensitive' } },
            ],
          },
          select: { id: true, ten: true },
          take: 8,
        })
        if (cds.length > 1)
          return (
            `Có ${cds.length} chức danh khớp "${chucDanhRaw}". Vui lòng nêu rõ chức danh nào rồi thêm lại:\n` +
            cds.map(c => `• ${c.ten}`).join('\n')
          )
        if (cds.length === 1) chucDanhId = cds[0].id
      }

      // Parse các trường lương/ngày sinh
      const hs = parseSo(args.he_so_luong || '')
      const pc = parseSo(args.phu_cap || '')
      const vk = parseVuotKhung(args.vuot_khung || '')
      if (hs === null) return 'Hệ số lương không hợp lệ. Nhập số, VD "3.66".'
      if (pc === null) return 'Phụ cấp không hợp lệ. Nhập số, VD "0.3".'
      if (vk === null) return 'Phụ cấp vượt khung không hợp lệ. Nhập theo %, VD "5".'
      let ngayNL: Date | null = null
      if ((args.ngay_nang_luong || '').trim()) {
        ngayNL = parseNgay(args.ngay_nang_luong || '')
        if (!ngayNL) return 'Ngày nâng lương không hợp lệ. Dùng dd/mm/yyyy, VD "01/07/2026".'
      }
      let ngaySinh: Date | null = null
      if ((args.ngay_sinh || '').trim()) {
        ngaySinh = parseNgay(args.ngay_sinh || '')
        if (!ngaySinh) return 'Ngày sinh không hợp lệ. Dùng dd/mm/yyyy, VD "20/05/1985".'
      }

      const cb = await db.canBo.create({
        data: {
          cccd, hoTen,
          ...(toChucId ? { toChucId } : (donViRaw ? { phongBan: donViRaw } : {})),
          ...(chucDanhId ? { chucDanhId } : (chucDanhRaw ? { chucVu: chucDanhRaw } : {})),
          ...((args.so_dien_thoai || '').trim() ? { soDienThoai: chuanHoaSdt(args.so_dien_thoai || '') } : {}),
          ...((args.email || '').trim() ? { email: (args.email || '').trim() } : {}),
          ...(ngaySinh ? { ngaySinh } : {}),
          ...(hs !== undefined ? { heSoLuong: hs } : {}),
          ...(pc !== undefined ? { phuCap: pc } : {}),
          ...(vk !== undefined ? { vuotKhung: vk } : {}),
          ...(ngayNL ? { ngayNangLuongKeTiep: ngayNL } : {}),
        },
        select: {
          hoTen: true, cccd: true, soDienThoai: true, email: true, ngaySinh: true,
          heSoLuong: true, phuCap: true, vuotKhung: true, ngayNangLuong: true, ngayNangLuongKeTiep: true,
          toChuc: { select: { ten: true } }, chucDanh: { select: { ten: true } },
        },
      })

      const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'chưa cập nhật')
      const isVK = cb.vuotKhung != null && cb.vuotKhung > 0
      const dvHienThi = cb.toChuc?.ten ?? (donViRaw ? `${donViRaw} (chưa khớp danh mục — lưu dạng văn bản)` : 'chưa cập nhật')
      const cdHienThi = cb.chucDanh?.ten ?? (chucDanhRaw ? `${chucDanhRaw} (chưa khớp danh mục — lưu dạng văn bản)` : 'chưa cập nhật')
      return (
        `✅ Đã TẠO MỚI hồ sơ cán bộ: **${cb.hoTen}**\n` +
        `• Số CCCD: ${cb.cccd}\n` +
        `• Đơn vị: ${dvHienThi}\n` +
        `• Chức danh: ${cdHienThi}\n` +
        `• Ngày sinh: ${fmt(cb.ngaySinh)}\n` +
        `• Điện thoại: ${cb.soDienThoai || 'chưa cập nhật'}\n` +
        `• Email: ${cb.email || 'chưa cập nhật'}\n` +
        `• Hệ số lương: ${cb.heSoLuong ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp chức vụ: ${cb.phuCap ?? 'chưa cập nhật'}\n` +
        `• Phụ cấp vượt khung: ${isVK ? (cb.vuotKhung! * 100).toFixed(0) + '%' : 'không'}\n` +
        `• Ngày lên lương: ${fmt(cb.ngayNangLuong)}\n` +
        `• Ngày nâng lương kế tiếp: ${fmt(cb.ngayNangLuongKeTiep)}`
      )
    }

    if (name === 'sinh_nhat_hom_nay') {
      const today = new Date()
      const month = today.getMonth() + 1
      const day = today.getDate()

      const rows = await db.$queryRaw<Array<{ hoTen: string; chucVu: string | null; phongBan: string | null }>>`
        SELECT "hoTen", "chucVu", "phongBan"
        FROM can_bo
        WHERE "ngaySinh" IS NOT NULL
          AND EXTRACT(MONTH FROM "ngaySinh") = ${month}
          AND EXTRACT(DAY FROM "ngaySinh") = ${day}
        ORDER BY "hoTen"
      `

      if (rows.length === 0) return `Hôm nay (${day}/${month}/${today.getFullYear()}) không có cán bộ nào có sinh nhật.`
      return (
        `🎂 Sinh nhật hôm nay (${day}/${month}):\n` +
        rows.map(r => `• ${r.hoTen} — ${r.chucVu || '—'} | ${r.phongBan || '—'}`).join('\n')
      )
    }

    if (name === 'sinh_nhat_thang_nay') {
      const today = new Date()
      const month = args.thang ? Number(args.thang) : today.getMonth() + 1
      const nam = today.getFullYear()

      type BirthdayRow = { hoTen: string; chucVu: string | null; phongBan: string | null; ngaySinh: Date }
      const rows = await db.$queryRaw<BirthdayRow[]>`
        SELECT "hoTen", "chucVu", "phongBan", "ngaySinh"
        FROM can_bo
        WHERE "ngaySinh" IS NOT NULL
          AND EXTRACT(MONTH FROM "ngaySinh") = ${month}
        ORDER BY EXTRACT(DAY FROM "ngaySinh"), "hoTen"
      `

      if (rows.length === 0) return `Tháng ${month}/${nam} không có cán bộ nào có sinh nhật.`

      // Nhóm theo ngày trong tháng
      const byDay: Record<number, BirthdayRow[]> = {}
      for (const r of rows) {
        const d = new Date(r.ngaySinh).getDate()
        if (!byDay[d]) byDay[d] = []
        byDay[d].push(r)
      }

      const lines = Object.entries(byDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([day, people]) =>
          `📅 Ngày ${day}/${month}:\n` +
          people.map(p => `   • ${p.hoTen} (${p.chucVu || '—'} | ${p.phongBan || '—'})`).join('\n')
        ).join('\n')

      return `🎂 Danh sách sinh nhật tháng ${month}/${nam} — ${rows.length} người:\n\n${lines}`
    }

    if (name === 'len_luong_thang_nay') {
      const today = new Date()
      const nam = args.nam ? Number(args.nam) : today.getFullYear()
      const quy = args.quy ? Number(args.quy) : null

      // Xác định khoảng tháng: theo quý (3 tháng) hoặc 1 tháng (mặc định tháng hiện tại)
      let fromMonth: number, toMonth: number, periodLabel: string
      if (quy && quy >= 1 && quy <= 4) {
        fromMonth = (quy - 1) * 3 + 1
        toMonth = quy * 3
        periodLabel = `Quý ${quy}/${nam}`
      } else {
        const month = args.thang ? Number(args.thang) : today.getMonth() + 1
        fromMonth = month
        toMonth = month
        periodLabel = `Tháng ${month}/${nam}`
      }

      // Đến hạn nâng lương = can_bo.ngayNangLuongKeTiep (cùng nguồn với trang Văn phòng Sở → Lương)
      const rows = await db.canBo.findMany({
        where: {
          ngayNangLuongKeTiep: {
            gte: new Date(nam, fromMonth - 1, 1),
            lt: new Date(nam, toMonth, 1),
          },
        },
        select: { hoTen: true, chucVu: true, phongBan: true, ngayNangLuongKeTiep: true, heSoLuong: true, phuCap: true },
        orderBy: { ngayNangLuongKeTiep: 'asc' },
      })

      if (rows.length === 0)
        return `${periodLabel} không có cán bộ nào đến hạn nâng lương.`

      const lines = rows.map(r => {
        const ngay = r.ngayNangLuongKeTiep ? new Date(r.ngayNangLuongKeTiep).toLocaleDateString('vi-VN') : '—'
        const hesoStr = r.heSoLuong != null ? ` | Hệ số hiện tại: ${r.heSoLuong}` : ''
        const phucapStr = r.phuCap != null ? ` | PC chức vụ: ${r.phuCap}` : ''
        return `• ${r.hoTen} (${r.chucVu || '—'} | ${r.phongBan || '—'})\n  📅 Ngày lên lương: ${ngay}${hesoStr}${phucapStr}`
      }).join('\n')

      return `💰 ${periodLabel}: **${rows.length}** người lên lương.\n\n${lines}`
    }

    if (name === 'du_thao_qd_nang_luong') {
      // Quyết định nâng lương làm theo THÁNG (không theo quý)
      const today = new Date()
      const month = args.thang ? Number(args.thang) : today.getMonth() + 1
      const nam = args.nam ? Number(args.nam) : today.getFullYear()

      const canManage = canManageSalary(ctx.user)
      if (!canManage) return 'Bạn không có quyền sinh Quyết định nâng lương. Cần quyền quản lý lương (office:salary_manage), là cán bộ theo dõi nâng lương, hoặc là lãnh đạo Văn phòng Sở.'

      const rows = await db.canBo.findMany({
        where: { ngayNangLuongKeTiep: { gte: new Date(nam, month - 1, 1), lt: new Date(nam, month, 1) } },
        select: { id: true, hoTen: true, chucVu: true, phongBan: true, ngayNangLuongKeTiep: true, heSoLuong: true },
        orderBy: { ngayNangLuongKeTiep: 'asc' },
      })

      if (rows.length === 0)
        return `Tháng ${month}/${nam} không có cán bộ nào đến hạn nâng lương để dự thảo Quyết định.`

      const lines = rows.map(r => {
        const ngay = r.ngayNangLuongKeTiep ? new Date(r.ngayNangLuongKeTiep).toLocaleDateString('vi-VN') : '—'
        const heso = r.heSoLuong != null ? ` | Hệ số: ${r.heSoLuong}` : ''
        return `• **${r.hoTen}** (${r.chucVu || '—'} | ${r.phongBan || '—'}) — lên lương ${ngay}${heso}\n  📄 [Tải dự thảo QĐ (.docx)](/api/office/nang-luong/du-thao?canBoId=${r.id})`
      }).join('\n')

      return (
        `📝 Dự thảo Quyết định nâng lương tháng ${month}/${nam} — ${rows.length} trường hợp.\n` +
        `Mỗi người một dự thảo (.docx), bấm link để tải. Số Quyết định, bậc lương và căn cứ pháp lý để trống — Văn phòng Sở bổ sung trước khi trình ký:\n\n` +
        `${lines}\n\n` +
        `---\n` +
        `**Cách in dự thảo — vào menu bên trái, mục "Văn phòng Sở":**\n` +
        `• 🖨️ **Kho văn bản đã sinh**: mỗi bản dự thảo vừa tải đều được lưu tại đây (tiêu đề có tiền tố "[Dự thảo]"); bấm để mở lại file .docx rồi in. Khi ban hành chính thức, Quyết định cũng nằm ở mục này.\n` +
        `• 👉 **Nâng lương (quy trình)**: theo dõi rà soát → trình ký → ban hành Quyết định chính thức. Bấm "Sinh danh sách đến hạn" để tạo hồ sơ theo dõi nếu chưa có.\n` +
        `• Hoặc mở file .docx vừa tải bằng Microsoft Word để in trực tiếp bản dự thảo.`
      )
    }

    if (name === 'thong_ke_nang_luong') {
      const nam = args.nam ? Number(args.nam) : new Date().getFullYear()

      const rows = await db.canBo.findMany({
        where: {
          ngayNangLuongKeTiep: { gte: new Date(nam, 0, 1), lt: new Date(nam + 1, 0, 1) },
        },
        select: { hoTen: true, ngayNangLuongKeTiep: true, vuotKhung: true, phongBan: true },
        orderBy: { ngayNangLuongKeTiep: 'asc' },
      })

      const tongCanBo   = await db.canBo.count()
      const chuaCapNhat = await db.canBo.count({ where: { ngayNangLuongKeTiep: null } })

      if (rows.length === 0) {
        return (
          `Năm ${nam} chưa có cán bộ nào có dữ liệu ngày nâng lương.\n` +
          `Lưu ý: ${chuaCapNhat}/${tongCanBo} cán bộ chưa cập nhật "Ngày nâng lương" nên không thống kê được — cần bổ sung dữ liệu.`
        )
      }

      // Gom theo tháng, tách nâng lương thường vs vượt khung
      type Stat = { total: number; vk: number; nguoi: string[] }
      const byMonth: Record<number, Stat> = {}
      let tongVK = 0
      for (const r of rows) {
        const m = new Date(r.ngayNangLuongKeTiep!).getMonth() + 1
        const isVK = r.vuotKhung != null && r.vuotKhung > 0
        if (!byMonth[m]) byMonth[m] = { total: 0, vk: 0, nguoi: [] }
        byMonth[m].total++
        if (isVK) { byMonth[m].vk++; tongVK++ }
        byMonth[m].nguoi.push(`${r.hoTen}${isVK ? ' (vượt khung)' : ''}`)
      }

      const lines = Object.entries(byMonth)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([m, s]) => {
          const vkStr = s.vk > 0 ? ` — trong đó ${s.vk} vượt khung` : ''
          return `📅 Tháng ${m}/${nam}: **${s.total}** người${vkStr}\n   ${s.nguoi.join(', ')}`
        }).join('\n')

      const tongThuong = rows.length - tongVK
      return (
        `💰 THỐNG KÊ NÂNG LƯƠNG NĂM ${nam} — tổng **${rows.length}** lượt:\n` +
        `• Nâng lương thường xuyên: ${tongThuong} người\n` +
        `• Thâm niên vượt khung (nâng phụ cấp): ${tongVK} người\n\n` +
        `${lines}\n\n` +
        `(Lưu ý: còn ${chuaCapNhat}/${tongCanBo} cán bộ chưa cập nhật ngày nâng lương — số liệu trên chỉ tính trên người đã có dữ liệu.)`
      )
    }

    if (name === 'xep_hang_nhan_su') {
      const tieuChi = (args.tieu_chi || '').trim()
      const topN = Math.min(Math.max(Number(args.so_luong) || 5, 1), 20)
      const fmtNgay = (x: Date | null) => (x ? new Date(x).toLocaleDateString('vi-VN') : 'chưa cập nhật')

      const all = await db.canBo.findMany({
        // HOP_DONG: nhân viên hợp đồng (bảo vệ, lái xe, tạp vụ) vẫn đang làm việc — tính vào thống kê
        where: { trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } },
        select: {
          hoTen: true, chucVu: true, phongBan: true, loaiHinh: true,
          heSoLuong: true, phuCap: true, vuotKhung: true,
          ngaySinh: true, ngayVeHuu: true, ngayKetNapDang: true,
        },
      })
      const ten = (c: typeof all[number]) => `**${c.hoTen}** (${c.chucVu || '—'} | ${c.phongBan || '—'})`
      // Nhân viên hợp đồng (lái xe, bảo vệ, tạp vụ) hưởng lương khoán — cột hệ số chứa số tiền, không so sánh được với hệ số biên chế
      const bienChe = all.filter(c => c.heSoLuong != null && c.heSoLuong <= 20 && !/HĐ|LX/i.test(c.loaiHinh || ''))

      if (tieuChi === 'he_so_cao_nhat' || tieuChi === 'he_so_thap_nhat') {
        const sorted = [...bienChe].sort((a, b) =>
          tieuChi === 'he_so_cao_nhat' ? b.heSoLuong! - a.heSoLuong! : a.heSoLuong! - b.heSoLuong!)
        const lines = sorted.slice(0, topN).map((c, i) =>
          `${i + 1}. ${ten(c)} — hệ số **${c.heSoLuong}**` +
          (c.phuCap ? ` + phụ cấp chức vụ ${c.phuCap}` : '') +
          (c.vuotKhung ? ` + vượt khung ${(c.vuotKhung * 100).toFixed(0)}%` : '')
        ).join('\n')
        return `🏆 Top ${topN} hệ số lương ${tieuChi === 'he_so_cao_nhat' ? 'CAO' : 'THẤP'} nhất (${bienChe.length} công chức/viên chức biên chế đang công tác, không tính nhân viên hợp đồng hưởng lương khoán):\n\n${lines}`
      }

      if (tieuChi === 'vuot_khung') {
        const vk = all.filter(c => (c.vuotKhung ?? 0) > 0).sort((a, b) => b.vuotKhung! - a.vuotKhung!)
        if (vk.length === 0) return 'Hiện không có cán bộ nào đang hưởng phụ cấp thâm niên vượt khung.'
        const lines = vk.map((c, i) => `${i + 1}. ${ten(c)} — vượt khung **${(c.vuotKhung! * 100).toFixed(0)}%** (hệ số ${c.heSoLuong ?? '—'})`).join('\n')
        return `📈 Cán bộ đang hưởng phụ cấp thâm niên vượt khung: **${vk.length}** người\n\n${lines}`
      }

      if (tieuChi === 'sap_nghi_huu') {
        const today = new Date()
        const huu = all.filter(c => c.ngayVeHuu && new Date(c.ngayVeHuu) >= today)
          .sort((a, b) => +new Date(a.ngayVeHuu!) - +new Date(b.ngayVeHuu!))
        const chuaCo = all.filter(c => !c.ngayVeHuu).length
        if (huu.length === 0)
          return `Không có cán bộ đang công tác nào có ngày nghỉ hưu sắp tới trong dữ liệu (${chuaCo} người chưa cập nhật ngày nghỉ hưu).`
        const lines = huu.slice(0, topN).map((c, i) =>
          `${i + 1}. ${ten(c)} — nghỉ hưu **${fmtNgay(c.ngayVeHuu)}** (sinh ${fmtNgay(c.ngaySinh)})`).join('\n')
        return `🏖️ Cán bộ sắp nghỉ hưu (gần nhất trước):\n\n${lines}\n\n(${chuaCo} người chưa cập nhật ngày nghỉ hưu)`
      }

      if (tieuChi === 'lon_tuoi_nhat' || tieuChi === 'tre_nhat') {
        const coNs = all.filter(c => c.ngaySinh).sort((a, b) =>
          tieuChi === 'lon_tuoi_nhat'
            ? +new Date(a.ngaySinh!) - +new Date(b.ngaySinh!)
            : +new Date(b.ngaySinh!) - +new Date(a.ngaySinh!))
        const nay = new Date().getFullYear()
        const lines = coNs.slice(0, topN).map((c, i) =>
          `${i + 1}. ${ten(c)} — sinh **${fmtNgay(c.ngaySinh)}** (~${nay - new Date(c.ngaySinh!).getFullYear()} tuổi)`).join('\n')
        return `👤 Top ${topN} cán bộ ${tieuChi === 'lon_tuoi_nhat' ? 'LỚN TUỔI' : 'TRẺ'} nhất đang công tác:\n\n${lines}`
      }

      if (tieuChi === 'tuoi_dang_cao_nhat') {
        const dang = all.filter(c => c.ngayKetNapDang).sort((a, b) => +new Date(a.ngayKetNapDang!) - +new Date(b.ngayKetNapDang!))
        if (dang.length === 0) return 'Chưa có dữ liệu ngày kết nạp Đảng.'
        const nay = new Date().getFullYear()
        const lines = dang.slice(0, topN).map((c, i) =>
          `${i + 1}. ${ten(c)} — kết nạp **${fmtNgay(c.ngayKetNapDang)}** (~${nay - new Date(c.ngayKetNapDang!).getFullYear()} năm tuổi Đảng)`).join('\n')
        return `🚩 Tổng số đảng viên đang công tác: **${dang.length}** người. Top ${topN} tuổi Đảng cao nhất:\n\n${lines}`
      }

      if (tieuChi === 'don_vi_dong_nhat') {
        const byPb = new Map<string, number>()
        for (const c of all) byPb.set(c.phongBan || 'Chưa rõ đơn vị', (byPb.get(c.phongBan || 'Chưa rõ đơn vị') ?? 0) + 1)
        const lines = [...byPb.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN)
          .map(([pb, n], i) => `${i + 1}. **${pb}**: ${n} người`).join('\n')
        return `🏢 Top ${topN} đơn vị đông người nhất (tổng ${all.length} cán bộ / ${byPb.size} đơn vị):\n\n${lines}`
      }

      return 'Tiêu chí xếp hạng không hợp lệ. Hỗ trợ: hệ số cao/thấp nhất, vượt khung, sắp nghỉ hưu, lớn tuổi/trẻ nhất, tuổi Đảng cao nhất, đơn vị đông nhất.'
    }

    if (name === 'luong_cua_toi') {
      // Nhận diện người đang đăng nhập: ưu tiên liên kết userId, sau đó CCCD = email đăng nhập
      const cb = await db.canBo.findFirst({
        where: { OR: [{ userId: ctx.userId }, { cccd: ctx.email }] },
        select: {
          hoTen: true, heSoLuong: true, phuCap: true, vuotKhung: true, ngayNangLuong: true, ngayNangLuongKeTiep: true,
          chucDanh: { select: { ten: true } },
          toChuc: { select: { ten: true } },
        },
      })

      if (!cb) {
        return 'Không tìm thấy hồ sơ cán bộ gắn với tài khoản của bạn. Có thể tài khoản đăng nhập chưa được liên kết CCCD trong hệ thống — vui lòng liên hệ quản trị viên.'
      }

      const isVK = cb.vuotKhung != null && cb.vuotKhung > 0
      const loai = isVK ? 'nâng phụ cấp thâm niên vượt khung (+1%/năm)' : 'nâng bậc lương thường xuyên'
      const ngayLen = cb.ngayNangLuong ? new Date(cb.ngayNangLuong).toLocaleDateString('vi-VN') : 'chưa cập nhật'

      if (!cb.ngayNangLuongKeTiep) {
        return (
          `${cb.hoTen}, hồ sơ của bạn chưa có dữ liệu "Ngày nâng lương kế tiếp" nên chưa xác định được khi nào đến hạn nâng lương.\n` +
          `• Ngày lên lương (bậc hiện tại): ${ngayLen}\n` +
          `• Hệ số hiện tại: ${cb.heSoLuong ?? 'chưa cập nhật'}. Vui lòng đề nghị Văn phòng Sở bổ sung ngày nâng lương kế tiếp.`
        )
      }

      const ngayKT = new Date(cb.ngayNangLuongKeTiep).toLocaleDateString('vi-VN')
      return (
        `${cb.hoTen} (${cb.chucDanh?.ten || '—'}${cb.toChuc?.ten ? ', ' + cb.toChuc.ten : ''}):\n` +
        `• Ngày nâng lương kế tiếp của bạn: **${ngayKT}** (${loai})\n` +
        `• Ngày lên lương (bậc hiện tại): ${ngayLen}\n` +
        `• Hệ số lương hiện tại: ${cb.heSoLuong ?? 'chưa cập nhật'}` +
        (isVK ? `\n• Phụ cấp vượt khung: ${(cb.vuotKhung! * 100).toFixed(0)}%` : '')
      )
    }

    if (name === 'tra_cuu_phap_ly_nhan_su') {
      const chuDe = (args.chu_de || '').trim()
      const mucs = timPhapLy(chuDe)
      // Không có từ khoá → liệt kê danh mục chủ đề để người dùng chọn
      if (!chuDe) {
        return (
          'Cơ sở pháp lý quản lý nhân sự gồm các chủ đề sau (hỏi cụ thể để xem điều/khoản + hiệu lực):\n' +
          mucs.map((m, i) => `${i + 1}. ${m.tieuDe}`).join('\n') +
          '\n\nVí dụ: "căn cứ pháp lý về vị trí việc làm", "nâng lương theo thông tư nào", "trước mấy tháng phải ra thông báo nghỉ hưu".'
        )
      }
      // CHỐNG BỊA: không mục nào khớp → báo rõ chưa có, KHÔNG trả mục không liên quan
      if (mucs.length === 0) {
        return (
          `KHÔNG TÌM THẤY căn cứ pháp lý về "${chuDe}" trong cơ sở dữ liệu pháp lý nhân sự của hệ thống.\n` +
          'BẮT BUỘC: nói rõ với người dùng là chủ đề này CHƯA có trong cơ sở dữ liệu, ' +
          'TUYỆT ĐỐI KHÔNG tự nêu số hiệu văn bản/điều/khoản nào. ' +
          'Có thể gợi ý người dùng thử tool tra_cuu_tai_lieu (kho văn bản đã nạp) hoặc liên hệ Văn phòng Sở.\n' +
          'Các chủ đề HIỆN CÓ: ' + timPhapLy().map((m) => m.tieuDe).join('; ')
        )
      }
      // Buộc model chuyển tiếp cảnh báo hiệu lực thay vì bỏ qua (mục có nhãn ⛔/⚠️)
      const ket = mucs.slice(0, 3).map(formatPhapLyMuc).join('\n\n──────────\n\n')
      if (ket.includes('ĐÃ HẾT HIỆU LỰC') || ket.includes('⚠️')) {
        return (
          'LƯU Ý BẮT BUỘC: kết quả dưới đây có văn bản ĐÃ HẾT HIỆU LỰC hoặc CHƯA XÁC MINH. ' +
          'PHẢI nêu rõ điều đó cho người dùng, KHÔNG trình bày như căn cứ đang áp dụng, ' +
          'và nói rõ văn bản thay thế nếu có.' + '\n\n' + ket
        )
      }
      return ket
    }

    if (name === 'tra_cuu_tai_lieu') {
      const cauHoi = (args.cau_hoi || '').trim()
      if (!cauHoi) return 'Vui lòng nêu nội dung cần tra cứu trong kho tài liệu.'
      // Phạm vi: tài khoản thuộc Sở/admin tra được cả NỘI BỘ; còn lại chỉ CÔNG KHAI.
      const phamViCho = canAccessOffice(ctx.user) ? ['CONG_KHAI', 'NOI_BO_SO'] : ['CONG_KHAI']
      const hits = await searchTaiLieu({ query: cauHoi, phamViCho, topK: 6 })
      // Lọc ngưỡng: cosine distance > 0.6 coi như không đủ liên quan.
      const relevant = hits.filter((h) => h.distance <= 0.6)
      if (relevant.length === 0) {
        return 'Không tìm thấy đoạn tài liệu nào đủ liên quan trong kho tài liệu của Sở. Hãy nói rõ với người dùng là chưa có tài liệu phù hợp; tuyệt đối không bịa nội dung.'
      }
      // HIỆU LỰC PHÁP LÝ (mig 043): gắn nhãn ngay trên từng đoạn để model không
      // viện dẫn văn bản đã hết hiệu lực làm căn cứ hiện hành.
      const nhanHieuLuc = (h: { tinhTrangHieuLuc: string; thayTheBoi: string | null }): string => {
        if (h.tinhTrangHieuLuc === 'het_hieu_luc') {
          return ` ⛔ ĐÃ HẾT HIỆU LỰC${h.thayTheBoi ? ` — thay thế bởi ${h.thayTheBoi}` : ''}. KHÔNG dùng làm căn cứ hiện hành.`
        }
        if (h.tinhTrangHieuLuc === 'du_thao') return ' ⚠️ MỚI LÀ DỰ THẢO — chưa có hiệu lực thi hành.'
        if (h.tinhTrangHieuLuc === 'can_kiem_chung') return ' ⚠️ CHƯA XÁC MINH HIỆU LỰC — nhắc người dùng đối chiếu bản chính thức.'
        return ''
      }
      const ctxText = relevant
        .map((h, i) => {
          const nguon = `${h.tieuDe}${h.viTri ? `, ${h.viTri}` : ''}${nhanHieuLuc(h)}`
          return `【Đoạn ${i + 1} — Nguồn: ${nguon}】\n${h.noiDung.replace(/\[Trang \d+\]/g, '').trim()}`
        })
        .join('\n\n──────────\n\n')
      const canhBao = await canhBaoSoHieuLa(cauHoi, ctxText)
      return (
        canhBao +
        'Các đoạn tài liệu liên quan (CHỈ trả lời dựa trên đây, BẮT BUỘC dẫn nguồn tên tài liệu + trang ở cuối).' +
        ' Nếu đoạn trích có nhãn ĐÃ HẾT HIỆU LỰC / DỰ THẢO / CHƯA XÁC MINH thì PHẢI nói rõ điều đó cho người dùng,' +
        ' không trình bày như quy định đang áp dụng. Nếu nội dung đoạn trích viện dẫn một văn bản mà hệ thống đã' +
        ' báo là bị thay thế từ 01/7/2026, phải nêu rõ văn bản thay thế tương ứng.' +
        '\n\n' +
        ctxText
      )
    }

    return 'Không thể thực hiện yêu cầu này.'
  } catch (err) {
    console.error(`Tool ${name} error:`, err)
    return 'Không thể truy vấn dữ liệu lúc này.'
  }
}

// Tools chỉ dành cho cán bộ Sở (không phải phường/xã)
// tra_cuu_dvhc và sinh_nhat_thang_nay cho phép tất cả dùng
const SO_ONLY_TOOLS = new Set(['tim_can_bo', 'ho_so_can_bo', 'xem_luong_can_bo', 'so_do_to_chuc', 'sinh_nhat_hom_nay', 'sinh_nhat_thang_nay', 'len_luong_thang_nay', 'thong_ke_nang_luong', 'du_thao_qd_nang_luong', 'xep_hang_nhan_su', 'luong_cua_toi', 'luu_lanh_dao_xa', 'cap_nhat_luong_can_bo', 'them_can_bo'])

// ── HỌC HỎI TỪ NGƯỜI DÙNG ─────────────────────────────────────────────────────
// Tách từ khoá tiếng Việt: bỏ dấu, tách theo ký tự không phải chữ/số
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 2)
}
const STOPWORDS = new Set([
  'toi','ban','cho','la','va','co','cua','khi','nao','the','nhu','mot','cac','de','duoc',
  'gi','nhe','khong','can','lam','muon','hoi','minh','nay','do','voi','tai','tren','trong','hay',
])

/**
 * CHẶN TÁI SỬ DỤNG DỮ KIỆN CŨ.
 * Câu trả lời cũ (dù đã được LIKE) KHÔNG được dùng làm nguồn cho các nội dung
 * dễ thay đổi hoặc buộc phải tra từ CSDL: số hiệu văn bản, điều/khoản, hệ số
 * lương, tiền, ngày tháng, danh sách người... Một cú LIKE nhầm sẽ khiến chatbot
 * lặp lại con số sai mãi mãi. Những câu chứa các dấu hiệu này bị loại khỏi
 * "kiến thức đã học"; chatbot phải gọi tool để lấy dữ liệu thật.
 */
const MAU_DU_KIEN_DONG: RegExp[] = [
  /\d{1,4}\s*\/\s*\d{4}\s*\/?\s*(nđ|tt|qh|qđ)/i,   // 175/2024/NĐ-CP, 07/2024/TT-BNV...
  /(điều|khoản|điểm)\s*\d/i,                        // trích dẫn điều/khoản/điểm
  /hệ số\s*(lương)?\s*\d/i,
  /\d[\d.,]{5,}\s*(đ|đồng|vnđ)/i,                   // số tiền
  /\d{1,2}\/\d{1,2}\/\d{4}/,                        // ngày cụ thể
  /\b(cccd|căn cước|số điện thoại|0\d{9})\b/i,
]

/**
 * Truy hồi "kiến thức đã học": các câu trả lời đã được người dùng đánh giá ĐÚNG (LIKE)
 * và KHÔNG dùng tool dữ liệu (kiến thức ổn định, không chứa dữ liệu cá nhân động).
 * Chấm điểm theo độ trùng từ khoá với câu hỏi hiện tại, lấy tối đa 3 câu giống nhất.
 *
 * Kết quả chỉ là GỢI Ý CÁCH TRẢ LỜI (hướng dẫn thao tác, cách diễn đạt) — model
 * được nhắc rõ đây KHÔNG phải nguồn dữ kiện, mọi số liệu vẫn phải lấy từ tool.
 */
async function getLearnedKnowledge(question: string, isWardUser: boolean): Promise<string> {
  const qTokens = new Set(tokenize(question).filter(t => !STOPWORDS.has(t)))
  if (qTokens.size < 2) return ''

  const candidates = await db.chatbotLog.findMany({
    where: { feedback: 'LIKE', isWardUser, toolsUsed: { isEmpty: true } },
    select: { question: true, answer: true },
    orderBy: { feedbackAt: 'desc' },
    take: 200,
  })

  const scored = candidates
    .filter(c => c.answer.length >= 40 && !/^xin lỗi/i.test(c.answer.trim()))
    // Loại câu trả lời chứa dữ kiện động (số hiệu VB, điều khoản, tiền, ngày, CCCD...)
    .filter(c => !MAU_DU_KIEN_DONG.some(re => re.test(c.answer)))
    .map(c => {
      const tks = new Set(tokenize(c.question).filter(t => !STOPWORDS.has(t)))
      let overlap = 0
      for (const t of qTokens) if (tks.has(t)) overlap++
      return { ...c, overlap, score: overlap / Math.sqrt(Math.max(tks.size, 1)) }
    })
    // Ngưỡng chặt hơn (>=3 từ khoá chung) để không kéo nhầm câu chỉ hao hao
    .filter(c => c.overlap >= 3)
    .sort((a, b) => b.score - a.score)

  // Khử trùng câu hỏi giống nhau, lấy 3 câu tốt nhất
  const seen = new Set<string>()
  const top = scored.filter(c => {
    const key = c.question.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)

  if (top.length === 0) return ''

  return (
    '\n\nGỢI Ý TỪ CÁC LƯỢT TRẢ LỜI ĐÃ ĐƯỢC NGƯỜI DÙNG XÁC NHẬN ĐÚNG:\n' +
    '⚠️ Đây CHỈ là gợi ý về cách diễn đạt / hướng dẫn thao tác để trả lời nhất quán. ' +
    'ĐÂY KHÔNG PHẢI NGUỒN DỮ KIỆN: mọi số liệu, họ tên, ngày tháng, số hiệu văn bản ' +
    'vẫn PHẢI lấy từ kết quả tool trong lượt này. Nếu gợi ý mâu thuẫn với kết quả tool, ' +
    'LUÔN theo kết quả tool.\n' +
    top.map((c, i) => `[${i + 1}] Hỏi: ${c.question}\nĐáp: ${c.answer}`).join('\n---\n')
  )
}

// ── API Route ─────────────────────────────────────────────────────────────────

/**
 * GHI NHẬN CÂU HỎI — luôn lưu lại mọi lượt hỏi, kể cả khi trả lời thất bại.
 * Trước đây chỉ lưu khi model trả lời thành công, nên các câu hỏi gây lỗi hoặc
 * chạy hết vòng lặp tool đều biến mất, không phân tích để cải tiến được.
 * Tình huống bất thường được đánh dấu bằng phần tử "__..." trong toolsUsed.
 */
async function ghiNhanCauHoi(opts: {
  userId: string
  isWardUser: boolean
  question: string
  answer: string
  toolsUsed: string[]
}): Promise<string | undefined> {
  try {
    const log = await db.chatbotLog.create({
      data: {
        userId: opts.userId,
        isWardUser: opts.isWardUser,
        question: opts.question.slice(0, 4000),
        answer: opts.answer.slice(0, 8000),
        toolsUsed: opts.toolsUsed,
      },
    })
    return log.id
  } catch (e) {
    console.error('Không ghi được chatbot log:', e)
    return undefined
  }
}

/**
 * Lấy CÂU HỎI của lượt này từ body client.
 * Chỉ tin phần người dùng gõ; mọi nội dung role "assistant" do client gửi lên
 * đều BỊ BỎ (client có thể tự chế "assistant: hệ số lương ông A là 9.99" rồi hỏi
 * tiếp "nhắc lại con số đó" để mớm dữ kiện giả cho model).
 */
function layCauHoi(raw: unknown): string | null {
  if (!Array.isArray(raw)) return null
  const cuoi = raw
    .filter(
      (m): m is { role: string; content: string } =>
        !!m && typeof m === 'object' && typeof (m as { content?: unknown }).content === 'string',
    )
    .filter((m) => m.role === 'user' && m.content.trim().length > 0)
    .at(-1)
  return cuoi ? cuoi.content.slice(0, 4000) : null
}

/**
 * Dựng LỊCH SỬ HỘI THOẠI TỪ PHÍA MÁY CHỦ (bảng chatbot_logs) thay vì tin mảng
 * messages của client. Giữ được ngữ cảnh câu hỏi nối tiếp ("còn tháng 7 thì sao")
 * mà không cho client bịa lời của trợ lý.
 * Chỉ lấy các lượt trong 3 giờ gần nhất của chính người dùng đó.
 */
async function dungLichSuTuMayChu(
  userId: string,
  soLuot = MAX_HISTORY / 2,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  // Cửa sổ 90 phút: đủ cho một phiên làm việc liên tục, đủ ngắn để không tái sử
  // dụng câu trả lời cũ khi dữ liệu đã thay đổi.
  const tuLuc = new Date(Date.now() - 90 * 60 * 1000)
  const logs = await db.chatbotLog.findMany({
    where: { userId, createdAt: { gte: tuLuc } },
    select: { question: true, answer: true },
    orderBy: { createdAt: 'desc' },
    take: soLuot,
  })
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const l of logs.reverse()) {
    out.push({ role: 'user', content: l.question.slice(0, 2000) })
    out.push({ role: 'assistant', content: l.answer.slice(0, 2000) })
  }
  return out
}


export async function POST(req: NextRequest) {
  let userIdForLog: string | undefined
  let isWardForLog = false
  let questionForLog = ''
  const toolsUsedInSession: string[] = []

  try {
    const user = await requireAuth()
    userIdForLog = user.id
    isWardForLog = user.wardId !== null

    // Đọc câu hỏi TRƯỚC mọi nhánh chặn, để lượt hỏi nào cũng được GHI NHẬN
    // (trước đây các nhánh trả sớm 400 / chặn mật khẩu mặc định không ghi log,
    // quản trị viên không thấy người dùng đã hỏi gì).
    const body = await req.json().catch(() => null)
    const cauHoi = layCauHoi((body as { messages?: unknown } | null)?.messages)
    questionForLog = cauHoi ?? ''

    // BẢO MẬT: chặn làm việc khi còn dùng MẬT KHẨU MẶC ĐỊNH (Abc@12345) → buộc đổi trước.
    const acct = await db.user.findUnique({ where: { id: user.id }, select: { password: true } })
    if (acct && (await bcrypt.compare(DEFAULT_PASSWORD, acct.password))) {
      const chan = NextResponse.json({
        reply:
          '🔒 **Cảnh báo bảo mật — tài khoản đang dùng mật khẩu mặc định.**\n\n' +
          'Tài khoản của bạn vẫn đang dùng mật khẩu mặc định (`Abc@12345`). Vì lý do an toàn dữ liệu, ' +
          'vui lòng **đổi mật khẩu trước khi làm việc**.\n\n' +
          '👉 Vào [Hồ sơ → Đổi mật khẩu](/dashboard/profile) để đặt mật khẩu mới (tối thiểu 8 ký tự, có chữ HOA, thường, số và ký tự đặc biệt).\n\n' +
          'Sau khi đổi mật khẩu, hãy quay lại đặt câu hỏi nhé.',
      })
      if (cauHoi) {
        await ghiNhanCauHoi({
          userId: user.id,
          isWardUser: user.wardId !== null,
          question: cauHoi,
          answer: '[CHẶN — TÀI KHOẢN CÒN DÙNG MẬT KHẨU MẶC ĐỊNH]',
          toolsUsed: ['__chan_mat_khau_mac_dinh__'],
        })
      }
      return chan
    }

    // Xác định vai trò: wardId !== null → tài khoản phường/xã
    const isWardUser = user.wardId !== null
    isWardForLog = isWardUser

    if (!cauHoi) {
      return NextResponse.json({ error: 'Không có câu hỏi hợp lệ' }, { status: 400 })
    }
    const question = cauHoi

    // Lịch sử lấy TỪ LOG MÁY CHỦ (không tin mảng messages của client)
    const userMessages = [
      ...(await dungLichSuTuMayChu(user.id)),
      { role: 'user' as const, content: question },
    ]

    // Lọc tools theo quyền
    const allowedTools = isWardUser
      ? tools.filter(t => !SO_ONLY_TOOLS.has((t as { function?: { name?: string } }).function?.name ?? ''))
      : tools

    // Ngữ cảnh thời gian thực — để model hiểu "tháng này", "tháng sau", "quý này", "năm nay"
    const now = new Date()
    const thangNay = now.getMonth() + 1
    const namNay = now.getFullYear()
    const thangSau = thangNay === 12 ? 1 : thangNay + 1
    const namThangSau = thangNay === 12 ? namNay + 1 : namNay
    const dateContext =
      `\n\nNGÀY HIỆN TẠI: hôm nay là ngày ${now.getDate()}/${thangNay}/${namNay} (quý ${Math.ceil(thangNay / 3)}/${namNay}).\n` +
      `Khi người dùng nói thời gian tương đối, quy đổi như sau rồi truyền tham số cụ thể cho tool:\n` +
      `- "tháng này" = tháng ${thangNay}/${namNay}; "tháng sau/tháng tới/tháng tiếp theo" = tháng ${thangSau}/${namThangSau}; "tháng trước" = tháng ${thangNay === 1 ? 12 : thangNay - 1}/${thangNay === 1 ? namNay - 1 : namNay}.\n` +
      `- Hỏi tháng cụ thể không kèm năm (VD "tháng 6 có ai lên lương") = tháng đó của năm ${namNay}.\n` +
      `- Câu hỏi nối tiếp ngắn gọn (VD sau khi hỏi tháng 6, hỏi tiếp "tháng 7?" hoặc "còn tháng 7 thì sao") = giữ nguyên chủ đề câu trước, chỉ đổi tháng — gọi lại đúng tool đó với thang=7.`

    // Thêm chú thích vào system prompt nếu là phường/xã
    const systemPrompt = (isWardUser
      ? SYSTEM_PROMPT + '\n\nLƯU Ý: Người dùng là tài khoản phường/xã. Chỉ hỗ trợ: hướng dẫn nhập dữ liệu, báo cáo, tra cứu mã đơn vị hành chính (tra_cuu_dvhc), và tra cứu lãnh đạo/trưởng phòng kinh tế các xã/phường (tra_cuu_lanh_dao_xa). KHÔNG trả lời câu hỏi về nhân sự nội bộ Sở, lương, sơ đồ tổ chức, sinh nhật cán bộ Sở.'
      : SYSTEM_PROMPT + '\n\nBạn cũng có thể tra cứu mã đơn vị hành chính (ĐVHC) của 78 phường/xã tỉnh Quảng Trị qua tool tra_cuu_dvhc.') + dateContext

    // Học hỏi từ người dùng: chèn các câu trả lời đã được xác nhận đúng (LIKE) tương tự câu hỏi hiện tại
    const learned = await getLearnedKnowledge(question, isWardUser)

    // Chuyển messages sang định dạng OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt + learned },
      ...userMessages,
    ]

    // Vòng lặp tool-use (max 5 lần)
    for (let i = 0; i < 5; i++) {
      const response = await goiOpenAI({
        model: CHAT_MODEL,
        messages,
        tools: allowedTools.length > 0 ? allowedTools : undefined,
        tool_choice: allowedTools.length > 0 ? 'auto' : undefined,
        // Nhiệt độ thấp: bám sát dữ liệu tool, hạn chế "sáng tác" số liệu/điều khoản
        temperature: 0.1,
        max_tokens: 2048,
      })

      const choice = response.choices[0]
      const msg = choice.message

      // Không gọi tool → lưu log + trả kết quả
      if (choice.finish_reason === 'stop' || !msg.tool_calls?.length) {
        // GPT hay tự thêm tiền tố "sandbox:" vào link tải file làm link không bấm được → gỡ bỏ
        const reply = (msg.content ?? 'Xin lỗi, không có phản hồi.').replace(/\(sandbox:[/]*/g, '(/')

        const logId = await ghiNhanCauHoi({
          userId: user.id,
          isWardUser,
          question,
          answer: reply,
          toolsUsed: toolsUsedInSession,
        })

        return NextResponse.json({ reply, logId })
      }

      // Có tool call → thực thi và gửi lại
      messages.push(msg)

      const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
      for (const tc of msg.tool_calls) {
        if (tc.type !== 'function') continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (tc as any).function as { name: string; arguments: string }
        let args: Record<string, string> = {}
        try { args = JSON.parse(fn.arguments) } catch { /* empty args */ }

        toolsUsedInSession.push(fn.name)
        const result = await executeTool(fn.name, args, { userId: user.id, email: user.email, user })
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        })
      }

      messages.push(...toolResults)
    }

    // Hết 5 vòng mà model vẫn đòi gọi tool → vẫn PHẢI ghi nhận câu hỏi để phân tích
    const replyQuaPhucTap =
      'Xin lỗi, yêu cầu này cần quá nhiều bước tra cứu nên tôi chưa tổng hợp được. ' +
      'Bạn thử tách thành các câu hỏi nhỏ hơn (VD hỏi từng tháng, từng phòng) hoặc liên hệ quản trị viên hệ thống.'
    await ghiNhanCauHoi({
      userId: user.id,
      isWardUser,
      question,
      answer: replyQuaPhucTap,
      toolsUsed: [...toolsUsedInSession, '__het_vong_lap__'],
    })
    return NextResponse.json({ reply: replyQuaPhucTap })
  } catch (err) {
    console.error('Chatbot error:', err)
    // Ghi nhận cả lượt hỏi bị lỗi (nếu đã xác định được người dùng) để quản trị viên rà soát
    if (userIdForLog && questionForLog) {
      await ghiNhanCauHoi({
        userId: userIdForLog,
        isWardUser: isWardForLog,
        question: questionForLog,
        answer: `[LỖI HỆ THỐNG] ${err instanceof Error ? err.message : String(err)}`,
        toolsUsed: [...toolsUsedInSession, '__loi_he_thong__'],
      })
    }
    return NextResponse.json(
      { error: 'Hệ thống chưa truy vấn được dữ liệu lúc này. Vui lòng thử lại hoặc liên hệ quản trị viên.' },
      { status: 500 },
    )
  }
}
