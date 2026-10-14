import { NextRequest, NextResponse } from 'next/server'
import { requireDeptAccess } from '@/lib/auth'
import { db } from '@/lib/db'
import { streamDocx } from '@/lib/office-doc-store'
import { vanBanCchnDocx, noiDungCanBoSung, type HoSoVanBan } from '@/lib/cchn/van-ban'

// Tải DỰ THẢO văn bản (.docx) từ hồ sơ đề nghị cấp chứng chỉ hành nghề:
//   ?loai=bo-sung  → thông báo yêu cầu bổ sung hồ sơ (Đ30 k5 NĐ 212/2026)
//   ?loai=ket-qua  → thông báo kết quả đánh giá hồ sơ (Đ30 k4)
// /api/cchn không nằm trong matcher middleware → tự kiểm tra quyền Phòng QLHĐ-XD tại đây.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireDeptAccess('PHONG_QLHD_XD')
  const { id } = await params
  const loai = req.nextUrl.searchParams.get('loai')
  if (loai !== 'bo-sung' && loai !== 'ket-qua') return NextResponse.json({ error: 'Loại văn bản không hợp lệ' }, { status: 400 })

  const r = await db.cchn_ho_so.findFirst({ where: { id, deleted_at: null } })
  if (!r) return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 })
  if (r.loai_thu_tuc === 'CAP_LAI' && loai === 'ket-qua') {
    return NextResponse.json({ error: 'Cấp lại không qua Hội đồng đánh giá — không có thông báo kết quả đánh giá' }, { status: 400 })
  }

  const d = (x: Date | null) => (x ? `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}` : null)
  const h: HoSoVanBan = {
    maHoSo: r.ma_ho_so, loaiThuTuc: r.loai_thu_tuc, hoTen: r.ho_ten, gioiTinh: r.gioi_tinh, ngayNop: d(r.ngay_nop)!,
    linhVuc: r.linh_vuc, noiDung: r.noi_dung, hangDeNghi: r.hang_de_nghi, truongHop: r.truong_hop, laCongDanVN: r.la_cong_dan_vn,
    vanBangTrenCsdl: r.van_bang_tren_csdl, soCchnCu: r.so_cchn_cu, hanhNgheDocLap: r.hanh_nghe_doc_lap,
    thanhPhan: (r.thanh_phan ?? {}) as Record<string, boolean>, noiDungBoSung: r.noi_dung_bo_sung,
    trangThai: r.trang_thai, hangHoiDong: r.hang_hoi_dong, ketLuanHoiDong: r.ket_luan_hoi_dong, ngayHoiDong: d(r.ngay_hoi_dong),
    diaChi: r.dia_chi, email: r.email,
  }
  if (loai === 'ket-qua' && !['DU_DIEU_KIEN', 'KHONG_DU_DIEU_KIEN'].includes(r.trang_thai)) {
    return NextResponse.json({ error: 'Chỉ lập thông báo kết quả khi hồ sơ ở trạng thái Đủ/Không đủ điều kiện (Đ30 k4).' }, { status: 400 })
  }
  if (loai === 'bo-sung' && noiDungCanBoSung(h).length === 0) {
    return NextResponse.json({ error: 'Hồ sơ không còn thành phần thiếu và chưa nhập nội dung yêu cầu bổ sung.' }, { status: 400 })
  }
  const buf = await vanBanCchnDocx(loai, h)
  const ten = loai === 'bo-sung' ? 'Thong_bao_bo_sung_ho_so' : 'Thong_bao_ket_qua_danh_gia'
  return streamDocx(buf, `${ten}_${r.ma_ho_so}.docx`)
}
