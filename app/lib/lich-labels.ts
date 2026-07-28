// Nhãn, màu cho Lịch công tác cá nhân (dùng chung client + server).
// hex = màu vẽ trên ô lịch; cls = lớp Tailwind cho chip/legend.

export const LICH_LOAI: Record<string, { label: string; hex: string; cls: string }> = {
  HOP:      { label: 'Họp',      hex: '#2563eb', cls: 'bg-blue-100 text-blue-700' },
  CONG_TAC: { label: 'Công tác', hex: '#7c3aed', cls: 'bg-violet-100 text-violet-700' },
  TRUC:     { label: 'Trực',     hex: '#ea580c', cls: 'bg-orange-100 text-orange-700' },
  NGHI:     { label: 'Nghỉ',     hex: '#16a34a', cls: 'bg-green-100 text-green-700' },
  KHAC:     { label: 'Khác',     hex: '#64748b', cls: 'bg-slate-100 text-slate-700' },
}
export const LICH_LOAI_OPTIONS = Object.entries(LICH_LOAI).map(([value, v]) => ({ value, label: v.label, hex: v.hex }))

/** Màu hiển thị của 1 mục lịch: ưu tiên mauSac tự chọn, không thì theo loại. */
export function lichColor(loai: string, mauSac?: string | null): string {
  if (mauSac && /^#[0-9a-fA-F]{3,8}$/.test(mauSac)) return mauSac
  return LICH_LOAI[loai]?.hex ?? LICH_LOAI.KHAC.hex
}

// Màu riêng cho mục "hạn công việc" gộp vào lịch (phân biệt với mục tự tạo).
export const HAN_CONG_VIEC_HEX = '#dc2626'
