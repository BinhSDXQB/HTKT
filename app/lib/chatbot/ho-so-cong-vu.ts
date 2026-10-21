/**
 * Dựng câu trả lời hồ sơ cán bộ cho người KHÔNG có quyền xem dữ liệu nhân sự nhạy cảm (Q4):
 * chỉ thông tin liên hệ công vụ. Nhận đầu vào dạng rộng (có thể chứa cả trường nhạy cảm) nhưng
 * CHỈ đọc các trường công vụ — để test chứng minh được đầu ra không lộ gì dù dữ liệu vào có đủ.
 */
export type CanBoCongVu = {
  hoTen: string
  soDienThoai?: string | null
  email?: string | null
  chucDanh?: { ten: string } | null
  toChuc?: { ten: string } | null
}

const GHI_CHU =
  '\n\n(Thông tin ngày sinh, lương, nâng lương, nghỉ hưu chỉ dành cho người có quyền xem dữ liệu nhân sự nhạy cảm.)'

function dong(c: CanBoCongVu): string {
  return (
    `**${c.hoTen}** — ${c.chucDanh?.ten || '—'}, ${c.toChuc?.ten || '—'}\n` +
    `  SĐT: ${c.soDienThoai || 'chưa cập nhật'}  |  Email: ${c.email || 'chưa cập nhật'}`
  )
}

export function hoSoCongVu(ds: CanBoCongVu[], hoTenTim: string): string {
  if (ds.length > 1) {
    return `Có ${ds.length} cán bộ khớp "${hoTenTim}" (nêu thêm đơn vị/chức danh để thu hẹp):\n` +
      ds.map((c, i) => `${i + 1}. ${dong(c)}`).join('\n') + GHI_CHU
  }
  return `📋 Thông tin công vụ của cán bộ:\n${dong(ds[0])}${GHI_CHU}`
}
