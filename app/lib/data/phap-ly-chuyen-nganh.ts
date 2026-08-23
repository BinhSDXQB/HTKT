// TRA CỨU PHÁP LÝ CHUYÊN NGÀNH cho chatbot — nối danh mục văn bản của 11 phòng
// (lib/phong/phap-ly-phong.ts) và Phòng Hạ tầng kỹ thuật (lib/htkt/phap-ly.ts) vào chatbot.
//
// Vì sao cần: hai danh mục trên do chính phòng nghiệp vụ rà soát (đợt hiệu lực 01/7/2026,
// ~225 văn bản) nhưng TRƯỚC 23/8/2026 chỉ hiển thị trên dashboard. Chatbot không đọc được,
// nên câu hỏi "căn cứ pháp lý về cấp nước / thẩm định thiết kế / bảo trì đường bộ…" phải
// dựa vào RAG hoặc kiến thức nền của mô hình — đúng chỗ dễ sinh ra bịa đặt.
//
// Khác nhau giữa 3 nguồn pháp lý của chatbot:
//   • co-so-phap-ly-nhan-su.ts  — nhân sự (lương, nghỉ, nghỉ hưu…), có điều/khoản chi tiết.
//   • file này                  — chuyên ngành xây dựng/hạ tầng/giao thông theo phòng, mức DANH MỤC.
//   • kho RAG (tra_cuu_tai_lieu)— toàn văn văn bản đã nạp, trích được nguyên văn + số trang.

import { PHAP_LY_PHONG } from '@/lib/phong/phap-ly-phong'
import { PHAP_LY_CHUNG, PHAP_LY_LINH_VUC, LINH_VUC_HTKT, type VanBan } from '@/lib/htkt/phap-ly'

export type KetQuaPhapLy = {
  phong: string
  linhVuc: string
  vanBan: VanBan[]
}

/** Bỏ dấu để "cap nuoc" khớp "cấp nước". */
function boDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

function khop(vb: VanBan, tu: string): boolean {
  const kho = boDau(`${vb.soHieu} ${vb.ten} ${vb.ghiChu ?? ''} ${vb.loai}`)
  return kho.includes(tu)
}

/**
 * Tìm theo từ khoá trên CẢ tên phòng, tên lĩnh vực và nội dung văn bản.
 * Khớp ở cấp lĩnh vực thì trả CẢ danh mục lĩnh vực đó (người hỏi "căn cứ pháp lý cấp nước"
 * cần cả danh mục, không phải vài văn bản có chữ "cấp nước" trong tên).
 */
export function timPhapLyChuyenNganh(tuKhoa: string): KetQuaPhapLy[] {
  const tu = boDau((tuKhoa || '').trim())
  if (!tu) return []
  const ra: KetQuaPhapLy[] = []

  // ── Phòng Hạ tầng kỹ thuật (danh mục riêng, chi tiết nhất) ──
  for (const lv of LINH_VUC_HTKT) {
    const ds = PHAP_LY_LINH_VUC[lv.key] ?? []
    const trungLinhVuc = boDau(lv.ten).includes(tu) || boDau(lv.key).includes(tu)
    const loc = trungLinhVuc ? ds : ds.filter((vb) => khop(vb, tu))
    if (loc.length) ra.push({ phong: 'Phòng Hạ tầng kỹ thuật', linhVuc: lv.ten, vanBan: loc })
  }
  const chungHtkt = PHAP_LY_CHUNG.filter((vb) => khop(vb, tu))
  if (chungHtkt.length) ra.push({ phong: 'Phòng Hạ tầng kỹ thuật', linhVuc: 'Văn bản chung', vanBan: chungHtkt })

  // ── 10 phòng còn lại ──
  for (const p of Object.values(PHAP_LY_PHONG)) {
    const trungPhong = boDau(p.ten).includes(tu) || boDau(p.moTaPhong).includes(tu)
    const chung = trungPhong ? p.chung : p.chung.filter((vb) => khop(vb, tu))
    if (chung.length) ra.push({ phong: p.ten, linhVuc: 'Văn bản chung của phòng', vanBan: chung })
    for (const lv of p.linhVuc) {
      const trungLinhVuc = trungPhong || boDau(lv.ten).includes(tu) || boDau(lv.key).includes(tu)
      const loc = trungLinhVuc ? lv.vanBan : lv.vanBan.filter((vb) => khop(vb, tu))
      if (loc.length) ra.push({ phong: p.ten, linhVuc: lv.ten, vanBan: loc })
    }
  }
  return ra
}

/** Định dạng cho chatbot; giới hạn số dòng để không nuốt hết cửa sổ ngữ cảnh. */
export function formatPhapLyChuyenNganh(kq: KetQuaPhapLy[], gioiHan = 30): string {
  if (!kq.length) return ''
  const dong: string[] = []
  let dem = 0
  for (const nhom of kq) {
    if (dem >= gioiHan) break
    dong.push(`\n**${nhom.phong} — ${nhom.linhVuc}**`)
    // Văn bản TRỌNG TÂM lên trước: khi danh mục dài bị cắt ở giới hạn, phần bị cắt phải là
    // văn bản phụ, không được cắt mất căn cứ cốt lõi của lĩnh vực.
    const theoUuTien = [...nhom.vanBan].sort((a, b) => Number(b.trongTam ?? false) - Number(a.trongTam ?? false))
    for (const vb of theoUuTien) {
      if (dem >= gioiHan) { dong.push('  … (còn nữa — hỏi hẹp hơn theo lĩnh vực để xem tiếp)'); break }
      dem++
      dong.push(
        `• ${vb.loai} ${vb.soHieu} — ${vb.ten}` +
        (vb.hieuLuc ? ` [${vb.hieuLuc}]` : '') +
        (vb.ghiChu ? `\n  ${vb.ghiChu}` : ''),
      )
    }
  }
  return dong.join('\n')
}

/** Danh sách lĩnh vực có sẵn — gợi ý khi từ khoá không khớp gì. */
export function danhSachLinhVuc(): string {
  const htkt = LINH_VUC_HTKT.map((l) => l.ten)
  const khac = Object.values(PHAP_LY_PHONG).flatMap((p) => p.linhVuc.map((l) => `${l.ten} (${p.ten})`))
  return [...htkt, ...khac].join(' · ')
}
