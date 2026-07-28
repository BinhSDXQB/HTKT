import 'server-only'
import {
  Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType, BorderStyle,
} from 'docx'

/**
 * Sinh văn bản hành chính (.docx) của Phòng Hạ tầng kỹ thuật theo thể thức
 * Nghị định 30/2020/NĐ-CP. Hỗ trợ tờ trình, công văn, giấy mời, báo cáo, kế hoạch,
 * phiếu góp ý, dự thảo quyết định, văn bản chỉ đạo. Trường để trống → in dấu "…………"
 * để cán bộ điền tay (mẫu skeleton). Mọi căn cứ pháp lý lấy từ dữ liệu nhập.
 */

const FONT = 'Times New Roman'
const SIZE = 28      // 14pt thân văn bản
const SIZE_SM = 26   // 13pt
const SIZE_XS = 24   // 12pt
const RIGHT_TAB = 9000
const PH = '…………'

const CO_QUAN_CAP_TREN = 'UBND TỈNH QUẢNG TRỊ'
const TEN_CO_QUAN = 'SỞ XÂY DỰNG'
const DIA_DANH = 'Quảng Trị'

function run(text: string, o: { bold?: boolean; italics?: boolean; size?: number; underline?: boolean } = {}) {
  return new TextRun({
    text, font: FONT, size: o.size ?? SIZE, bold: o.bold, italics: o.italics,
    underline: o.underline ? {} : undefined,
  })
}
function center(children: TextRun[], spacingAfter = 0) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: spacingAfter }, children })
}
function justify(children: TextRun[], spacingAfter = 120, firstLine = 567) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: spacingAfter }, indent: { firstLine }, children })
}
function dateLine(d?: Date | null): string {
  const dt = d ?? new Date()
  return `${DIA_DANH}, ngày ${dt.getDate()} tháng ${dt.getMonth() + 1} năm ${dt.getFullYear()}`
}

// Khối quốc hiệu + tiêu ngữ (NĐ 30/2020). soPrefix vd "SXD-HTKT" (công văn) hoặc "QĐ-SXD".
function buildHeading(soVanBan: string | undefined, ngay: Date | null | undefined, trichYeuCongVan?: string): Paragraph[] {
  const heading: Paragraph[] = [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 0 },
      children: [
        run(CO_QUAN_CAP_TREN, { size: SIZE_XS }),
        new TextRun({ text: '\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: FONT, size: SIZE_XS, bold: true }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 0 },
      children: [
        run(TEN_CO_QUAN, { bold: true, size: SIZE_XS }),
        new TextRun({ text: '\tĐộc lập - Tự do - Hạnh phúc', font: FONT, size: SIZE_SM, bold: true }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 120 },
      children: [
        run('________', { size: SIZE_XS }),
        new TextRun({ text: '\t', font: FONT }),
        new TextRun({ text: '_______________________', font: FONT, size: SIZE_XS }),
      ],
    }),
  ]
  // Dòng Số + địa danh, ngày
  heading.push(new Paragraph({
    tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: trichYeuCongVan ? 0 : 240 },
    children: [
      run(`Số: ${soVanBan || PH}`, { size: SIZE_XS }),
      new TextRun({ text: `\t${dateLine(ngay)}`, font: FONT, size: SIZE_SM, italics: true }),
    ],
  }))
  // Công văn: dòng "V/v ..." nằm dưới Số (canh giữa cột trái)
  if (trichYeuCongVan != null) {
    heading.push(new Paragraph({
      alignment: AlignmentType.LEFT, spacing: { after: 240 }, indent: { left: 700, right: 4800 },
      children: [run(`V/v ${trichYeuCongVan || PH}`, { italics: true, size: SIZE_XS })],
    }))
  }
  return heading
}

// Khối ký: chức danh (phải) + khoảng trống + họ tên; Nơi nhận (trái).
function buildSigning(nguoiKyChucDanh: string, nguoiKyHoTen: string | undefined, noiNhan: string[]): Paragraph[] {
  return [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { before: 200, after: 0 },
      children: [
        run('Nơi nhận:', { bold: true, italics: true, size: 22 }),
        new TextRun({ text: `\t${nguoiKyChucDanh}`, font: FONT, size: SIZE, bold: true }),
      ],
    }),
    ...noiNhan.map((line) => new Paragraph({ spacing: { after: 0 }, children: [run(line, { size: 22 })] })),
    new Paragraph({
      spacing: { before: 700 }, alignment: AlignmentType.CENTER, indent: { left: 5000 },
      children: [run(nguoiKyHoTen || PH, { bold: true })],
    }),
  ]
}

function canCuParas(canCu: string[]): Paragraph[] {
  const lines = canCu.map((s) => s.trim()).filter(Boolean)
  if (lines.length === 0) {
    return [justify([run(`Căn cứ ${PH} ;`, { italics: true })], 40)]
  }
  return lines.map((line) =>
    justify([run(/^căn cứ/i.test(line) ? line : `Căn cứ ${line}`, { italics: true })], 40))
}

function bodyParas(noiDung: string | undefined): Paragraph[] {
  const text = (noiDung || PH).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  if (text.length === 0) return [justify([run(PH)])]
  return text.map((p) => justify([run(p)]))
}

const MIME_MARGIN = { top: 1134, bottom: 1134, left: 1701, right: 850 }

function wrap(children: Paragraph[]): Document {
  return new Document({
    sections: [{ properties: { page: { margin: MIME_MARGIN } }, children }],
  })
}

// ───────── Kiểu dữ liệu đầu vào ─────────
export type VanBanInput = {
  soVanBan?: string
  ngay?: Date | null
  trichYeu?: string          // trích yếu / V/v
  kinhGui?: string           // nơi nhận chính (Kính gửi)
  canCu?: string[]
  noiDung?: string           // nội dung chính (nhiều dòng = nhiều đoạn)
  kienNghi?: string          // phần kiến nghị / đề nghị (tờ trình)
  nguoiKyChucDanh?: string   // vd "GIÁM ĐỐC", "KT. GIÁM ĐỐC\nPHÓ GIÁM ĐỐC"
  nguoiKyHoTen?: string
  noiNhan?: string[]
  thoiGian?: string          // giấy mời: thời gian
  diaDiem?: string           // giấy mời: địa điểm
  // Mẫu thẩm định & nghiệm thu
  tenDuAn?: string           // tên dự án
  tenChuDauTu?: string       // tên chủ đầu tư
  ketQua?: 'chap_thuan' | 'khong_chap_thuan' | 'yeu_cau_bo_sung'  // kết quả thẩm định
  lyDo?: string              // lý do (nếu không chấp thuận / yêu cầu bổ sung)
  nguoiKiemTra?: string[]    // danh sách người kiểm tra
}

const DEFAULT_NOI_NHAN = ['- Như trên;', '- Lưu: VT, HTKT.']

function chucDanhRuns(chucDanh: string): Paragraph[] {
  // cho phép xuống dòng trong chức danh ký (vd "KT. GIÁM ĐỐC\nPHÓ GIÁM ĐỐC")
  return chucDanh.split(/\r?\n/).map((l, i) =>
    new Paragraph({ alignment: AlignmentType.CENTER, indent: { left: 5000 }, spacing: { after: 0 },
      children: [run(l, { bold: true, size: i === 0 ? 22 : SIZE })] }))
}

// ───────── Tờ trình ─────────
function buildToTrinh(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Như trên;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('TỜ TRÌNH', { bold: true })], 40),
    center([run(i.trichYeu || `Về việc ${PH}`, { bold: true })], 240),
    ...(i.kinhGui ? [justify([run(`Kính gửi: ${i.kinhGui}.`, { bold: true })], 200, 567)] : [justify([run(`Kính gửi: ${PH}.`, { bold: true })], 200, 567)]),
    ...canCuParas(i.canCu || []),
    ...bodyParas(i.noiDung),
    ...(i.kienNghi ? bodyParas(i.kienNghi) : [justify([run(`Kính trình ${i.kinhGui || PH} xem xét, quyết định./.`)])]),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Công văn ─────────
function buildCongVan(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : DEFAULT_NOI_NHAN
  return [
    ...buildHeading(i.soVanBan, i.ngay, i.trichYeu ?? ''),
    ...(i.kinhGui ? [center([run(`Kính gửi: ${i.kinhGui}.`, { bold: true })], 200)] : [center([run(`Kính gửi: ${PH}.`, { bold: true })], 200)]),
    ...(i.canCu?.length ? canCuParas(i.canCu) : []),
    ...bodyParas(i.noiDung),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Giấy mời ─────────
function buildGiayMoi(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Như trên;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('GIẤY MỜI', { bold: true })], 240),
    justify([run(`${TEN_CO_QUAN} trân trọng kính mời: ${i.kinhGui || PH}`)], 120),
    justify([run(`Tới dự ${i.trichYeu || PH}.`)], 120),
    justify([run('Thời gian: ', { bold: true }), run(i.thoiGian || PH)], 60, 567),
    justify([run('Địa điểm: ', { bold: true }), run(i.diaDiem || PH)], 120, 567),
    ...(i.noiDung ? bodyParas(i.noiDung) : []),
    justify([run('Trân trọng kính mời./.')], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Báo cáo ─────────
function buildBaoCao(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('BÁO CÁO', { bold: true })], 40),
    center([run(i.trichYeu || PH, { bold: true })], 240),
    ...(i.kinhGui ? [justify([run(`Kính gửi: ${i.kinhGui}.`, { bold: true })], 200, 567)] : []),
    ...bodyParas(i.noiDung),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Kế hoạch ─────────
function buildKeHoach(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Như trên;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('KẾ HOẠCH', { bold: true })], 40),
    center([run(i.trichYeu || PH, { bold: true })], 240),
    ...(i.canCu?.length ? canCuParas(i.canCu) : []),
    ...bodyParas(i.noiDung),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Văn bản góp ý dự thảo VBPL ─────────
function buildPhieuGopY(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Như trên;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay, i.trichYeu ?? `Góp ý dự thảo ${PH}`),
    ...(i.kinhGui ? [center([run(`Kính gửi: ${i.kinhGui}.`, { bold: true })], 200)] : [center([run(`Kính gửi: ${PH}.`, { bold: true })], 200)]),
    justify([run(`${TEN_CO_QUAN} nhận được đề nghị góp ý dự thảo ${i.trichYeu || PH}. Sau khi nghiên cứu, ${TEN_CO_QUAN} có ý kiến như sau:`)], 120),
    ...bodyParas(i.noiDung),
    justify([run(`Trên đây là ý kiến góp ý của ${TEN_CO_QUAN}, đề nghị Quý cơ quan tổng hợp./.`)], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Văn bản chỉ đạo, đôn đốc ─────────
function buildVanBanChiDao(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Như trên;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay, i.trichYeu ?? ''),
    ...(i.kinhGui ? [center([run(`Kính gửi: ${i.kinhGui}.`, { bold: true })], 200)] : [center([run(`Kính gửi: ${PH}.`, { bold: true })], 200)]),
    ...bodyParas(i.noiDung),
    justify([run(`Đề nghị các cơ quan, đơn vị nghiêm túc triển khai thực hiện./.`)], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Dự thảo Quyết định ─────────
function buildQuyetDinh(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Như Điều ...;', '- Lãnh đạo Sở;', '- Lưu: VT, HTKT.']
  // Số mặc định dạng QĐ-SXD
  const heading = buildHeading(i.soVanBan, i.ngay)
  return [
    ...heading,
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
      spacing: { after: 120 }, children: [],
    }),
    center([run('QUYẾT ĐỊNH', { bold: true })], 60),
    center([run(i.trichYeu || `Về việc ${PH}`, { bold: true })], 240),
    center([run(i.nguoiKyChucDanh ? `${i.nguoiKyChucDanh} ${TEN_CO_QUAN.toUpperCase()}` : `GIÁM ĐỐC ${TEN_CO_QUAN.toUpperCase()}`, { bold: true })], 120),
    ...canCuParas(i.canCu || []),
    center([run('QUYẾT ĐỊNH:', { bold: true })], 200),
    ...bodyParas(i.noiDung),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Thông báo kết quả thẩm định BCNCKT ─────────
function buildThongBaoThamDinhBcnckt(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Chủ đầu tư;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('THÔNG BÁO KẾT QUẢ THẨM ĐỊNH', { bold: true })], 40),
    center([run('BÁO CÁO NGHIÊN CỨU KHẢ THI', { bold: true })], 240),
    justify([run(`Dự án: ${i.tenDuAn || PH}`)], 120),
    justify([run(`Chủ đầu tư: ${i.tenChuDauTu || PH}`)], 120),
    justify([run(`Căn cứ NĐ 217/2026/NĐ-CP, kết quả thẩm định BCNCKT như sau:`)], 240),
    justify([run(i.ketQua === 'chap_thuan'
      ? 'Chấp thuận BCNCKT.'
      : i.ketQua === 'khong_chap_thuan'
        ? `Không chấp thuận BCNCKT vì: ${i.lyDo || PH}`
        : `Yêu cầu bổ sung/điều chỉnh BCNCKT: ${i.lyDo || PH}`)], 120),
    ...bodyParas(i.noiDung),
    justify([run('Văn bản này làm căn cứ cho các bước tiếp theo (lập BCKTKT, thiết kế, cấp phép xây dựng)./.')], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Thông báo kết quả thẩm định BCKTKT ─────────
function buildThongBaoThamDinhBcktkt(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Chủ đầu tư;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('THÔNG BÁO KẾT QUẢ THẨM ĐỊNH', { bold: true })], 40),
    center([run('BÁAO CÁO KINH TẾ - KỸ THUẬT', { bold: true })], 240),
    justify([run(`Dự án: ${i.tenDuAn || PH}`)], 120),
    justify([run(`Chủ đầu tư: ${i.tenChuDauTu || PH}`)], 120),
    justify([run(`Căn cứ NĐ 217/2026/NĐ-CP, kết quả thẩm định BCKTKT như sau:`)], 240),
    justify([run(i.ketQua === 'chap_thuan'
      ? 'Chấp thuận BCKTKT.'
      : i.ketQua === 'khong_chap_thuan'
        ? `Không chấp thuận BCKTKT vì: ${i.lyDo || PH}`
        : `Yêu cầu bổ sung/điều chỉnh BCKTKT: ${i.lyDo || PH}`)], 120),
    ...bodyParas(i.noiDung),
    justify([run('Văn bản này làm căn cứ cho thiết kế, cấp phép xây dựng./.')], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Thông báo kết quả thẩm định thiết kế triển khai ─────────
function buildThongBaoThamDinhThietKe(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Chủ đầu tư;', '- Nhà thầu;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('THÔNG BÁO KẾT QUẢ THẨM ĐỊNH', { bold: true })], 40),
    center([run('THIẾT KẾ TRIỂN KHAI SAU THIẾT KẾ CƠ SỞ', { bold: true })], 240),
    justify([run(`Dự án: ${i.tenDuAn || PH}`)], 120),
    justify([run(`Chủ đầu tư: ${i.tenChuDauTu || PH}`)], 120),
    justify([run(`Căn cứ NĐ 217/2026/NĐ-CP và NĐ 206/2026/NĐ-CP, kết quả thẩm định thiết kế như sau:`)], 240),
    justify([run(i.ketQua === 'chap_thuan'
      ? 'Chấp thuận thiết kế xây dựng triển khai.'
      : i.ketQua === 'khong_chap_thuan'
        ? `Không chấp thuận thiết kế vì: ${i.lyDo || PH}`
        : `Yêu cầu bổ sung/điều chỉnh thiết kế: ${i.lyDo || PH}`)], 120),
    ...bodyParas(i.noiDung),
    justify([run('Văn bản này làm căn cứ cho cấp phép xây dựng và thi công./.')], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Chấp thuận kết quả kiểm tra nghiệm thu ─────────
function buildChapThuanNghiemThu(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Chủ đầu tư;', '- Nhà thầu;', '- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('VĂN BẢN CHẤP THUẬN', { bold: true })], 40),
    center([run('KẾT QUẢ KIỂM TRA NGHIỆM THU HOÀN THÀNH', { bold: true })], 240),
    justify([run(`Dự án: ${i.tenDuAn || PH}`)], 120),
    justify([run(`Chủ đầu tư: ${i.tenChuDauTu || PH}`)], 120),
    justify([run(`Căn cứ NĐ 207/2026/NĐ-CP, kết quả kiểm tra như sau:`)], 240),
    justify([run(i.ketQua === 'chap_thuan'
      ? 'Chấp thuận kết quả kiểm tra nghiệm thu hoàn thành. Công trình đạt tiêu chí, có thể đưa vào sử dụng/khai thác.'
      : i.ketQua === 'khong_chap_thuan'
        ? `Không chấp thuận vì: ${i.lyDo || PH}`
        : `Yêu cầu khắc phục: ${i.lyDo || PH}`)], 120),
    ...bodyParas(i.noiDung),
    justify([run('Văn bản này làm căn cứ cho quyết toán, bàn giao công trình./.')], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'GIÁM ĐỐC', i.nguoiKyHoTen, noiNhan),
  ]
}

// ───────── Biên bản kiểm tra hiện trường ─────────
function buildBienBanKiemTra(i: VanBanInput): Paragraph[] {
  const noiNhan = i.noiNhan?.length ? i.noiNhan : ['- Lưu: VT, HTKT.']
  return [
    ...buildHeading(i.soVanBan, i.ngay),
    center([run('BIÊN BẢN KIỂM TRA', { bold: true })], 240),
    justify([run(`Dự án: ${i.tenDuAn || PH}`)], 120),
    justify([run(`Chủ đầu tư: ${i.tenChuDauTu || PH}`)], 120),
    justify([run(`Địa điểm kiểm tra: ${i.diaDiem || PH}`)], 120),
    justify([run(`Thời gian kiểm tra: ${i.thoiGian || PH}`)], 120),
    justify([run(`Cán bộ kiểm tra: ${i.nguoiKiemTra?.join(', ') || PH}`)], 240),
    center([run('NỘI DUNG KIỂM TRA:', { bold: true })], 120),
    ...bodyParas(i.noiDung),
    justify([run(i.ketQua === 'chap_thuan'
      ? 'Kết luận: Công trình đạt tiêu chí nghiệm thu, đề nghị chấp thuận.'
      : i.ketQua === 'khong_chap_thuan'
        ? `Kết luận: Công trình không đạt tiêu chí. Lý do: ${i.lyDo || PH}`
        : `Kết luận: Cần bổ sung/khắc phục. Yêu cầu: ${i.lyDo || PH}`)], 120),
    justify([run('Biên bản này được lập làm bằng chứng cho công tác kiểm tra./.')], 120),
    ...buildSigning(i.nguoiKyChucDanh || 'TRƯỞNG ĐỘI KIỂM TRA', i.nguoiKyHoTen, noiNhan),
  ]
}

const BUILDERS: Record<string, (i: VanBanInput) => Paragraph[]> = {
  'to-trinh': buildToTrinh,
  'cong-van': buildCongVan,
  'giay-moi': buildGiayMoi,
  'bao-cao': buildBaoCao,
  'ke-hoach': buildKeHoach,
  'phieu-gop-y': buildPhieuGopY,
  'van-ban-chi-dao': buildVanBanChiDao,
  'quyet-dinh': buildQuyetDinh,
  'thong-bao-tham-dinh-bcnckt': buildThongBaoThamDinhBcnckt,
  'thong-bao-tham-dinh-bcktkt': buildThongBaoThamDinhBcktkt,
  'thong-bao-tham-dinh-thiet-ke': buildThongBaoThamDinhThietKe,
  'chap-thuan-nghiem-thu': buildChapThuanNghiemThu,
  'bien-ban-kiem-tra': buildBienBanKiemTra,
}

export async function buildVanBanDocx(loai: string, input: VanBanInput = {}): Promise<Buffer> {
  const builder = BUILDERS[loai]
  if (!builder) throw new Error(`Loại văn bản không hỗ trợ: ${loai}`)
  const doc = wrap(builder(input))
  return Buffer.from(await Packer.toBuffer(doc))
}

export const TEN_FILE_MAU: Record<string, string> = {
  'to-trinh': 'Mau_To_trinh',
  'cong-van': 'Mau_Cong_van',
  'giay-moi': 'Mau_Giay_moi',
  'bao-cao': 'Mau_Bao_cao',
  'ke-hoach': 'Mau_Ke_hoach',
  'phieu-gop-y': 'Mau_Gop_y_VBPL',
  'van-ban-chi-dao': 'Mau_Van_ban_chi_dao',
  'quyet-dinh': 'Mau_Du_thao_Quyet_dinh',
  'thong-bao-tham-dinh-bcnckt': 'Mau_Thong_bao_KQ_tham_dinh_BCNCKT',
  'thong-bao-tham-dinh-bcktkt': 'Mau_Thong_bao_KQ_tham_dinh_BCKTKT',
  'thong-bao-tham-dinh-thiet-ke': 'Mau_Thong_bao_KQ_tham_dinh_Thiet_ke',
  'chap-thuan-nghiem-thu': 'Mau_Chap_thuan_ket_qua_Nghiem_thu',
  'bien-ban-kiem-tra': 'Mau_Bien_ban_Kiem_tra',
}
