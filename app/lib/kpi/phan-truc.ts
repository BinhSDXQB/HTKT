// Đề xuất gán nhiệm vụ của Phụ lục KPI vào 6 trục của Hướng dẫn 02-HD/TU.
// Phụ lục KPI KHÔNG ghi trục cho từng nhiệm vụ → đây chỉ là ĐỀ XUẤT theo từ khoá, luôn đánh dấu "chờ xác nhận".
// Mặc định Trục 1 (trục chính: mục tiêu phát triển KT-XH và nhiệm vụ chính trị được giao).
import type { MaTruc } from './tinh-kpi.ts'

export type DeXuatTruc = { truc: MaTruc; tuKhoa: string | null }

// Thứ tự = độ ưu tiên khi một nhiệm vụ khớp nhiều trục.
const QUY_TAC: { truc: MaTruc; re: RegExp }[] = [
  { truc: 4, re: /đánh giá,? xếp loại|thi đua|khen thưởng|tham nhũng|lãng phí|tiêu cực|xây dựng Đảng|kỷ luật|kiểm điểm|đoàn kết/i },
  { truc: 6, re: /quốc phòng|an ninh|quân sự|đối ngoại|hội nhập|biên giới|phòng thủ dân sự|phòng cháy/i },
  { truc: 5, re: /nhà ở xã hội|nhà ở cho người có công|người có công|giảm nghèo|hộ nghèo|an sinh|chương trình mục tiêu quốc gia|nhà ở dột nát|nhà ở công vụ|nhà công vụ|văn hóa/i },
  { truc: 3, re: /chuyển đổi số|công nghệ thông tin|cơ sở dữ liệu|CSDL|khoa học|công nghệ|đổi mới sáng tạo|BIM|phần mềm|số hóa|dịch vụ công trực tuyến|Đề án 06/i },
  { truc: 2, re: /quy phạm pháp luật|QPPL|phân cấp|phân quyền|ủy quyền|thể chế|thủ tục hành chính|TTHC|cải cách hành chính|thanh tra|giám sát/i },
]

export function deXuatTruc(ten: string, sanPham = ''): DeXuatTruc {
  const van = `${ten} ${sanPham}`
  for (const q of QUY_TAC) {
    const m = van.match(q.re)
    if (m) return { truc: q.truc, tuKhoa: m[0] }
  }
  return { truc: 1, tuKhoa: null }
}
