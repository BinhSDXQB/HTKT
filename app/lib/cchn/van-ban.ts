import 'server-only'
import { Packer, Paragraph } from 'docx'
import { run, center, justify, buildHeading, buildSigning, wrap } from '@/lib/htkt/van-ban-docx'
import { LINH_VUC, LOAI_THU_TUC } from './danh-muc'
import { thanhPhanApDung } from './danh-gia'

// DỰ THẢO văn bản phát sinh từ hồ sơ đề nghị cấp chứng chỉ hành nghề (Phòng QLHĐ-XD), thể thức NĐ 30/2020.
// NĐ 212/2026 không ban hành mẫu cho hai thông báo này (Phụ lục III chỉ có Mẫu 01–03: đơn, chứng chỉ —
// theo dẫn chiếu Đ27 k6, Đ39) → dùng dạng công văn. Chỉ viện dẫn điều khoản đã đọc nguyên văn:
//   - Thông báo bổ sung: Đ30 k5 (thông báo một lần, nêu rõ lý do, trong 05 ngày làm việc).
//   - Thông báo kết quả đánh giá: Đ30 k4 (sau kết quả Hội đồng); đủ điều kiện → cấp trong 06/11 ngày làm việc (Đ30 k2).
// KHÔNG tự đặt thời hạn cho người nộp bổ sung (NĐ 212 không quy định).

export type HoSoVanBan = {
  maHoSo: string; loaiThuTuc: string; hoTen: string; gioiTinh: string | null
  ngayNop: string; linhVuc: string | null; noiDung: string | null; hangDeNghi: string | null
  truongHop: string | null; laCongDanVN: boolean; vanBangTrenCsdl: boolean; soCchnCu: string | null; hanhNgheDocLap: boolean
  thanhPhan: Record<string, boolean>; noiDungBoSung: string | null
  trangThai: string; hangHoiDong: string | null; ketLuanHoiDong: string | null; ngayHoiDong: string | null
  diaChi: string | null; email: string | null
}

const PH = '…………'
const fmt = (s: string | null) => (s ? s.split('-').reverse().join('/') : PH)
const xungHo = (g: string | null) => (g === 'NAM' ? 'Ông' : g === 'NU' ? 'Bà' : 'Ông/Bà')

function moTaDeNghi(h: HoSoVanBan): string {
  const lt = LOAI_THU_TUC.find((x) => x.value === h.loaiThuTuc)?.label.toLowerCase() ?? 'cấp'
  const lv = LINH_VUC.find((x) => x.value === h.linhVuc)?.label.toLowerCase()
  return `đề nghị ${lt} chứng chỉ hành nghề hoạt động xây dựng${lv ? ` lĩnh vực ${lv}` : ''}${h.noiDung ? ` (${h.noiDung.toLowerCase()})` : ''}${h.hangDeNghi ? `, hạng ${h.hangDeNghi}` : ''}`
}

function kinhGui(h: HoSoVanBan): Paragraph[] {
  return [
    center([run('Kính gửi: '), run(`${xungHo(h.gioiTinh)} ${h.hoTen}`, { bold: true })], 60),
    ...(h.diaChi ? [center([run(`Địa chỉ: ${h.diaChi}`, { size: 26, italics: true })], 200)] : [new Paragraph({ spacing: { after: 140 }, children: [] })]),
  ]
}

const NOI_NHAN = (h: HoSoVanBan) => [`- ${xungHo(h.gioiTinh)} ${h.hoTen};`, '- Lãnh đạo Sở (để b/c);', '- Lưu: VT, QLHĐXD.']

/** Danh sách nội dung cần bổ sung: ưu tiên nội dung cán bộ nhập; để trống thì lấy thành phần còn thiếu (Đ39). */
export function noiDungCanBoSung(h: HoSoVanBan): string[] {
  const NHAN_BO_SUNG: Record<string, string> = { le_phi: 'Nộp lệ phí cấp chứng chỉ hành nghề theo quy định của pháp luật về phí và lệ phí' }
  const tuNhap = (h.noiDungBoSung ?? '').split(/\r?\n/).map((s) => s.replace(/^[-•\d.)\s]+/, '').trim()).filter(Boolean)
  if (tuNhap.length) return tuNhap
  return thanhPhanApDung({ loaiThuTuc: h.loaiThuTuc as 'CAP_MOI', truongHop: h.truongHop, laCongDanVN: h.laCongDanVN,
    vanBangTrenCsdl: h.vanBangTrenCsdl, soCchnCu: h.soCchnCu, hanhNgheDocLap: h.hanhNgheDocLap })
    .filter((t) => !h.thanhPhan[t.key]).map((t) => `${NHAN_BO_SUNG[t.key] ?? t.label} (${t.canCu} NĐ 212/2026/NĐ-CP)`)
}

export function vanBanBoSung(h: HoSoVanBan): Paragraph[] {
  const xh = xungHo(h.gioiTinh).toLowerCase()   // giữa câu viết thường; "Kính gửi" viết hoa
  const muc = noiDungCanBoSung(h)
  return [
    ...buildHeading(undefined, null, 'bổ sung hồ sơ đề nghị cấp chứng chỉ hành nghề hoạt động xây dựng'),
    ...kinhGui(h),
    justify([run(`Ngày ${fmt(h.ngayNop)}, Sở Xây dựng nhận được hồ sơ của ${xh} (mã hồ sơ ${h.maHoSo}) ${moTaDeNghi(h)}.`)]),
    justify([run(`Căn cứ Nghị định số 212/2026/NĐ-CP ngày 17/6/2026 của Chính phủ quy định về điều kiện năng lực hoạt động xây dựng và hệ thống thông tin, cơ sở dữ liệu quốc gia về hoạt động xây dựng; sau khi kiểm tra, hồ sơ chưa đầy đủ, hợp lệ theo quy định tại Điều 39 Nghị định này. Theo khoản 5 Điều 30 Nghị định số 212/2026/NĐ-CP, Sở Xây dựng thông báo để ${xh} bổ sung, hoàn thiện các nội dung sau:`)]),
    ...muc.map((m, i) => justify([run(`${i + 1}. ${m}`)], 60)),
    ...(h.loaiThuTuc === 'CAP_MOI'
      ? [justify([run('Văn bằng, chứng chỉ hành nghề đã được cấp, tài liệu chứng minh kinh nghiệm, giấy tờ về cư trú hoặc giấy phép lao động (nếu có) là bản sao có chứng thực khi nộp trực tiếp, qua bưu chính hoặc tệp tin bản sao điện tử được chứng thực khi nộp trực tuyến (điểm g khoản 1 Điều 39 Nghị định số 212/2026/NĐ-CP).')], 120)]
      : h.loaiThuTuc === 'CHUYEN_DOI'
        ? [justify([run('Văn bằng, giấy phép năng lực hành nghề do nước ngoài cấp và giấy tờ về cư trú hoặc giấy phép lao động là bản sao có chứng thực hoặc tệp tin bản sao điện tử được chứng thực (điểm đ khoản 3 Điều 39 Nghị định số 212/2026/NĐ-CP).')], 120)]
        : []),
    justify([run(`Sau khi nhận đủ hồ sơ hợp lệ, Sở Xây dựng sẽ xem xét, giải quyết theo quy định. Sở Xây dựng thông báo để ${xh} biết, thực hiện./.`)]),
    ...buildSigning('GIÁM ĐỐC', undefined, NOI_NHAN(h)),
  ]
}

export function vanBanKetQua(h: HoSoVanBan): Paragraph[] {
  const xh = xungHo(h.gioiTinh).toLowerCase()   // giữa câu viết thường; "Kính gửi" viết hoa
  const du = h.trangThai === 'DU_DIEU_KIEN'
  const khongDu = h.trangThai === 'KHONG_DU_DIEU_KIEN'
  const lv = LINH_VUC.find((x) => x.value === h.linhVuc)?.label.toLowerCase() ?? PH
  const soNgay = h.loaiThuTuc === 'CHUYEN_DOI' ? '11' : '06'
  const diemK2 = h.loaiThuTuc === 'CHUYEN_DOI' ? 'c' : 'a'
  const ketLuan: Paragraph[] = du
    ? [
        justify([run(`Kết quả: `), run(`hồ sơ đủ điều kiện cấp chứng chỉ hành nghề hoạt động xây dựng lĩnh vực ${lv}${h.noiDung ? ` (${h.noiDung.toLowerCase()})` : ''}, hạng ${h.hangHoiDong ?? PH}.`, { bold: true })]),
        justify([run(`Theo điểm ${diemK2} khoản 2 Điều 30 Nghị định số 212/2026/NĐ-CP, chứng chỉ hành nghề được cấp trong thời hạn ${soNgay} ngày làm việc kể từ ngày có thông báo này.`)]),
      ]
    : khongDu
      ? [
          justify([run('Kết quả: '), run('hồ sơ không đủ điều kiện cấp chứng chỉ hành nghề hoạt động xây dựng.', { bold: true })]),
          justify([run(`Lý do: ${h.ketLuanHoiDong?.trim() || PH}`)]),
        ]
      : [justify([run(`Kết quả: ${PH} (hồ sơ chưa có kết luận đủ/không đủ điều kiện — cập nhật trạng thái trước khi phát hành).`)])]
  return [
    ...buildHeading(undefined, null, 'thông báo kết quả đánh giá hồ sơ đề nghị cấp chứng chỉ hành nghề hoạt động xây dựng'),
    ...kinhGui(h),
    justify([run(`Ngày ${fmt(h.ngayNop)}, Sở Xây dựng nhận được hồ sơ của ${xh} (mã hồ sơ ${h.maHoSo}) ${moTaDeNghi(h)}.`)]),
    justify([run(`Căn cứ khoản 4 Điều 30 Nghị định số 212/2026/NĐ-CP ngày 17/6/2026 của Chính phủ và kết quả đánh giá ngày ${fmt(h.ngayHoiDong)} của Hội đồng xét cấp chứng chỉ hành nghề, Sở Xây dựng thông báo kết quả đánh giá hồ sơ như sau:`)]),
    ...ketLuan,
    justify([run(`Sở Xây dựng thông báo để ${xh} biết./.`)]),
    ...buildSigning('GIÁM ĐỐC', undefined, NOI_NHAN(h)),
  ]
}

export async function vanBanCchnDocx(loai: 'bo-sung' | 'ket-qua', h: HoSoVanBan): Promise<Buffer> {
  const doc = wrap(loai === 'bo-sung' ? vanBanBoSung(h) : vanBanKetQua(h))
  return Buffer.from(await Packer.toBuffer(doc))
}

