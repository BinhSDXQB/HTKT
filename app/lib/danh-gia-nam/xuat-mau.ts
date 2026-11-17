// Xuất biểu mẫu Word/Excel theo bản gốc của Sở Nội vụ (CV 6862/SNV-CBCCVC): Mẫu 01, 2A, 2B, 2C, 03, 04.
// Chép NGUYÊN VĂN các câu hướng dẫn của bản gốc; chỗ nào hệ thống không có dữ liệu thì để trống (không điền thay).
// KHÔNG xuất Mẫu 05, 06, 07 (bản gốc .doc chưa đọc được bố cục cột) và 4B, 6C, 6F1–6F4 (không có bản gốc) — xem mau-bieu.ts.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign,
} from 'docx'
import ExcelJS from 'exceljs'
import { TIEU_CHI_CHUNG, diemNhiemVuNam } from './tieu-chi'

const FONT = 'Times New Roman'
const SZ = 26
const MUC = [
  ['HOAN_THANH_XUAT_SAC_NHIEM_VU', 'Hoàn thành xuất sắc nhiệm vụ'],
  ['HOAN_THANH_TOT_NHIEM_VU', 'Hoàn thành tốt nhiệm vụ'],
  ['HOAN_THANH_NHIEM_VU', 'Hoàn thành nhiệm vụ'],
  ['KHONG_HOAN_THANH_NHIEM_VU', 'Không hoàn thành nhiệm vụ'],
] as const

const A_CHUNG_1 = 'Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc.'
const A_CHUNG_2 = 'Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm, gắn với hiệu quả, tiến độ, chất lượng công việc.'
const A_CHUNG_3 = 'Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định.'
const A_LANH_DAO = [
  'Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành; thực hiện chức trách, nhiệm vụ; mức độ hoàn thành nhiệm vụ của các cấp uỷ, tổ chức đảng trực thuộc, địa phương, tổ chức, cơ quan, đơn vị thuộc quyền quản lý; khả năng quy tụ, xây dựng đoàn kết nội bộ.',
  'Trách nhiệm trong công việc; tinh thần năng động, đổi mới sáng tạo, dám nghĩ, dám nói, dám làm, nói đi đôi với làm, dám chịu trách nhiệm, dám đương đầu với khó khăn, thử thách, dám hành động, dám hy sinh lợi ích cá nhân vì lợi ích chung; trách nhiệm trong xây dựng đội ngũ cán bộ, kiểm soát quyền lực, phòng, chống tiêu cực trong phạm vi chức trách, nhiệm vụ được giao; trách nhiệm trong lãnh đạo, chỉ đạo hoàn thiện thể chế góp phần phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số, về mở rộng hợp tác, hội nhập quốc tế, về đổi mới tư duy quản trị, tạo điều kiện phát triển kinh tế tư nhân; xử lý những vấn đề khó, phức tạp, nhạy cảm trong thực hiện nhiệm vụ.',
  'Trách nhiệm nêu gương của bản thân và gia đình; việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá"; sự tín nhiệm của cán bộ, đảng viên; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết; việc xây dựng phong cách lãnh đạo đổi mới, gần dân, sát dân, trọng dân, thường xuyên nắm bắt tâm tư, nguyện vọng của Nhân dân.',
]
const A_2C_1 = 'Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, trách nhiệm nêu gương, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc. việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá"; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết.'
const A_KHAC_PHUC = 'Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của cá nhân.'
const A_GIAI_TRINH = 'Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của cá nhân đối với từng vấn đề được gợi ý kiểm điểm.'
const GHI_CHU_MAU04 = 'Trong đó: Điểm KPI, Điểm đạt được lấy từ Bảng theo dõi, đánh giá và chấm điểm kết quả thực hiện nhiệm vụ đối với cá nhân (Mẫu số 04)'

const r = (t: string, o: { b?: boolean; i?: boolean; sz?: number } = {}) => new TextRun({ text: t, font: FONT, size: o.sz ?? SZ, bold: o.b, italics: o.i })
const p = (t: string, o: { b?: boolean; i?: boolean; al?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number; ind?: number } = {}) =>
  new Paragraph({ alignment: o.al, spacing: { after: o.after ?? 80 }, indent: o.ind ? { left: o.ind } : undefined, children: [r(t, o)] })
const trong = (n = 2) => Array.from({ length: n }, () => p('', {}))
const so = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v).replace('.', ','))
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const cell = (t: string, o: { b?: boolean; w?: number; al?: (typeof AlignmentType)[keyof typeof AlignmentType]; span?: number } = {}) => new TableCell({
  width: o.w ? { size: o.w, type: WidthType.PERCENTAGE } : undefined, columnSpan: o.span, verticalAlign: VerticalAlign.CENTER,
  borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
  children: [new Paragraph({ alignment: o.al, children: [r(t, { b: o.b, sz: 22 })] })],
})
const bang = (hang: string[][], w: number[], dau = 1) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: hang.map((h, i) => new TableRow({ children: h.map((t, j) => cell(t, { b: i < dau, w: w[j], al: i < dau || j === 0 ? AlignmentType.CENTER : undefined })) })),
})
const khungTren = (tenCoQuan: string, tenDonVi: string) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p(tenCoQuan.toUpperCase(), { al: AlignmentType.CENTER, b: true, after: 0 }), p(tenDonVi.toUpperCase(), { al: AlignmentType.CENTER, b: true })] }),
    new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { al: AlignmentType.CENTER, b: true, after: 0 }), p('Độc lập - Tự do - Hạnh phúc', { al: AlignmentType.CENTER, b: true })] }),
  ] })],
})
const chuKy = (nhan: string, ghi = '(Ký, ghi rõ họ tên)') => [
  p('…, ngày … tháng … năm …', { al: AlignmentType.RIGHT, i: true, after: 0 }),
  p(nhan, { al: AlignmentType.RIGHT, b: true, after: 0 }), p(ghi, { al: AlignmentType.RIGHT, i: true }), ...trong(3),
]
const oMuc = (chon?: string | null) => MUC.map(([ma, ten]) => p(`${chon === ma ? '☒' : '☐'}  ${ten}`, { ind: 360 }))
const pack = (children: (Paragraph | Table)[]) => Packer.toBuffer(new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } }, children }] }))

export type DuLieuCaNhan = {
  tenCoQuan: string; tenDonVi: string; nam: number
  hoTen: string; ngaySinh?: string | null; chucVuDang?: string | null; chucVuChinhQuyen?: string | null; chucVuDoanThe?: string | null
  viTriViecLam?: string | null; donViCongTac: string
  tuDanhGia?: string | null
  /** nội dung nhận xét đã có trong hồ sơ, theo mã mục (đoạn "chưa có dữ liệu" phải được lọc trước khi truyền vào) */
  nhanXet?: Partial<Record<'ket_qua_nhiem_vu' | 'han_che' | 'nguyen_nhan' | 'khac_phuc' | 'phuong_huong', string>>
  diemChung?: Record<string, number | null>
  diemKpiTong?: number | null
  nhanXetLanhDao?: string | null
  mucPheDuyet?: string | null
  diemQuy?: Record<string, number | null>
}

const heroInfo = (ma: '2A' | '2B' | '2C', d: DuLieuCaNhan) => ma === '2C'
  ? [p(`Họ và tên: ${d.hoTen}    Ngày sinh: ${d.ngaySinh ?? ''}`), p(`Vị trí việc làm: ${d.viTriViecLam ?? ''}`), p(`Đơn vị công tác: ${d.donViCongTac}`)]
  : [p(`Họ và tên: ${d.hoTen}    Ngày sinh: ${d.ngaySinh ?? ''}`), p(`Chức vụ Đảng: ${d.chucVuDang ?? ''}`), p(`Chức vụ chính quyền: ${d.chucVuChinhQuyen ?? ''}`), p(`Chức vụ đoàn thể: ${d.chucVuDoanThe ?? ''}`), p(`Đơn vị công tác: ${d.donViCongTac}`)]

function bangTieuChiChung(d: DuLieuCaNhan) {
  const nhom: [string, string, number][] = [
    ['I', 'Phẩm chất chính trị, phẩm chất đạo đức, văn hóa thực thi công vụ, nhiệm vụ và ý thức kỷ luật, kỷ cương trong thực thi công vụ, nhiệm vụ', 10],
    ['II', 'Năng lực chuyên môn, nghiệp vụ theo yêu cầu của vị trí việc làm; khả năng đáp ứng yêu cầu thực thi nhiệm vụ được giao; tinh thần trách nhiệm trong thực thi công vụ, nhiệm vụ; thái độ phục vụ người dân, doanh nghiệp và khả năng phối hợp với đồng nghiệp', 10],
    ['III', 'Năng lực đổi mới, sáng tạo, dám nghĩ, dám làm, dám chịu trách nhiệm vì lợi ích chung trong thực thi công vụ, nhiệm vụ', 10],
  ]
  const hang: string[][] = [['TT', 'Tiêu chí chấm điểm', 'Điểm tối đa', 'Điểm tự chấm'], ['(1)', '(2)', '(3)', '']]
  let tong = 0; let du = false
  for (const [ma, ten, toiDa] of nhom) {
    const con = TIEU_CHI_CHUNG.filter((c) => c.ma.startsWith(`${ma}.`))
    const diemNhom = con.reduce((t, c) => t + (d.diemChung?.[c.ma] ?? 0), 0)
    const coNhom = con.some((c) => d.diemChung?.[c.ma] !== null && d.diemChung?.[c.ma] !== undefined)
    if (coNhom) { tong += diemNhom; du = true }
    hang.push([ma, ten, String(toiDa), coNhom ? so(diemNhom) : ''])
    for (const c of con) hang.push([c.ma.split('.')[1], c.ten, so(c.toiDa), so(d.diemChung?.[c.ma])])
  }
  hang.push(['', 'Tổng cộng', '30', du ? so(tong) : ''])
  return { bang: bang(hang, [8, 62, 15, 15], 2), tong: du ? tong : null }
}

function bangKetQua(ma: '2A' | '2B' | '2C', d: DuLieuCaNhan) {
  const kpi = d.diemKpiTong ?? null
  const nam = kpi === null ? null : diemNhiemVuNam(kpi)
  if (ma === '2A') {
    return bang([['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Điểm KPI', 'Điểm tối đa'],
      ['1', 'Nhiệm vụ trọng tâm, then chốt (1)', '', '10'], ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên (2)', '', '90'],
      ['3', 'Tổng điểm KPI (3)', kpi === null ? '(3)= (1) + (2)' : so(kpi), ''], ['4', 'Tổng điểm đánh giá năm 2026 (4)', nam === null ? '(4) = (3)*70/100' : so(nam), '']], [8, 52, 20, 20])
  }
  return bang([['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Điểm KPI', 'Điểm tối đa', 'Điểm đạt', 'Điểm đánh giá năm 2026'],
    ['(1)', '(2)', '(3)', '(4)', '(5)= (3)*(4)', '(6)=(5)*70/100'],
    ['1', 'Nhiệm vụ trọng tâm, then chốt', '', '10', '', ''], ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', '', '90', '', ''],
    ['', 'TỔNG CỘNG', '', '100', so(kpi), so(nam)]], [7, 37, 12, 12, 16, 16], 2)
}

/** Mẫu số 2A, 2B, 2C — Bản kiểm điểm, tự đánh giá, xếp loại của cá nhân. */
export function buildMauCaNhan(ma: '2A' | '2B' | '2C', d: DuLieuCaNhan): Promise<Buffer> {
  const phuDe = ma === '2A' ? '(Đối với chức danh người đứng đầu các cơ quan, đơn vị, địa phương)'
    : ma === '2B' ? '(Đối với chức danh lãnh đạo, quản lý từ cấp phó của người đứng đầu cơ quan, đơn vị, địa phương trở xuống)'
    : '(Đối với cá nhân không giữ chức vụ lãnh đạo, quản lý)'
  const uuDiem = ma === '2C' ? [A_2C_1, A_CHUNG_2, A_CHUNG_3] : [A_CHUNG_1, A_CHUNG_2, A_CHUNG_3, ...A_LANH_DAO]
  const nx = d.nhanXet ?? {}
  const tc = bangTieuChiChung(d)
  const tongNam = d.diemKpiTong === null || d.diemKpiTong === undefined ? null : diemNhiemVuNam(d.diemKpiTong)
  const tongDiem = tc.tong !== null && tongNam !== null ? Math.round((tc.tong + tongNam) * 1e6) / 1e6 : null
  const c: (Paragraph | Table)[] = [
    p(`Mẫu số ${ma}`, { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(d.tenCoQuan, d.tenDonVi), ...trong(1),
    p('BẢN KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN', { b: true, al: AlignmentType.CENTER, after: 0 }),
    p(`Năm ${d.nam}`, { b: true, al: AlignmentType.CENTER, after: 0 }), p(phuDe, { i: true, al: AlignmentType.CENTER }),
    ...heroInfo(ma, d),
    p('A. NỘI DUNG KIỂM ĐIỂM', { b: true }), p('I. Ưu điểm, kết quả đạt được', { b: true }),
  ]
  uuDiem.forEach((t, i) => {
    c.push(p(`${i + 1}. ${t}`, { i: true }))
    if (i === 1 && nx.ket_qua_nhiem_vu) c.push(p(nx.ket_qua_nhiem_vu, { ind: 360 }))
    else c.push(p(''))
  })
  if (d.tuDanhGia) c.push(p('Nội dung tự đánh giá do cá nhân nhập trên hệ thống:', { i: true }), p(d.tuDanhGia, { ind: 360 }))
  c.push(p('II. Hạn chế, khuyết điểm và nguyên nhân', { b: true }), p('1. Hạn chế, khuyết điểm.', { i: true }), p(nx.han_che ?? ''), p('2. Nguyên nhân của hạn chế, khuyết điểm.', { i: true }), p(nx.nguyen_nhan ?? ''),
    p('III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước', { b: true }), p(A_KHAC_PHUC, { i: true }), p(nx.khac_phuc ?? ''),
    p('IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)', { b: true }), p(A_GIAI_TRINH, { i: true }), p(''),
    p('V. Làm rõ trách nhiệm của cá nhân đối với những hạn chế, khuyết điểm của tập thể (nếu có)', { b: true }), p(''),
    p('VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm', { b: true }), p(nx.phuong_huong ?? ''),
    p('B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI', { b: true }), p(`I. Nhóm tiêu chí chung: ${tc.tong === null ? '…' : so(tc.tong)}/30 điểm`, { b: true }), tc.bang,
    p(`II. Tiêu chí về kết quả thực hiện nhiệm vụ: ${tongNam === null ? '…' : so(tongNam)}/70 điểm`, { b: true }), bangKetQua(ma, d))
  c.push(p(ma === '2A' ? 'Điểm KPI: Được tính theo kết quả điểm đánh giá, xếp loại chất lượng đối với tập thể lãnh đạo cơ quan, đơn vị, địa phương' : GHI_CHU_MAU04, { i: true }),
    p(`Tổng điểm = Điểm tiêu chí chung + Điểm tiêu chí về kết quả thực hiện nhiệm vụ${tongDiem === null ? '' : ` = ${so(tongDiem)}`}`, { i: true }),
    p(ma === '2A' ? 'III. SỐ NHIỆM VỤ, CÔNG VIỆC VƯỢT MỤC TIÊU VÀ KHÔNG HOÀN THÀNH TRONG KỲ ĐÁNH GIÁ' : 'III. SỐ NHIỆM VỤ, CÔNG VIỆC VƯỢT MỤC TIÊU VÀ KHÔNG ĐẠT TRONG KỲ ĐÁNH GIÁ', { b: true }),
    bang(ma === '2A'
      ? [['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Tổng tiêu chí được đánh giá trong kỳ', 'Số tiêu chí vượt mục tiêu', 'Có giải pháp đột phá, nổi trội, tạo chuyển biến rõ, tích cực', 'Số tiêu chí không đạt'], ['1', 'Nhiệm vụ trọng tâm, then chốt', '', '', '', ''], ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', '', '', '', '']]
      : [['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Tổng sản phẩm được đánh giá trong kỳ', 'Số sản phẩm vượt mục tiêu (số lượng / tỷ lệ so với tổng số nhiệm vụ trong kỳ)', 'Số sản phẩm đột phá, nổi trội, tạo chuyển biến rõ, tích cực', 'Số nhiệm vụ không hoàn thành (số lượng / tỷ lệ)'], ['1', 'Nhiệm vụ trọng tâm, then chốt', '', '', '', ''], ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', '', '', '', '']],
      [7, 29, 14, 18, 18, 14]),
    ...(ma === '2A' ? [] : [p('3. Tự nhận mức xếp loại chất lượng', { b: true }), ...oMuc(null)]),
    ...(ma === '2A' ? [p('Tự nhận mức xếp loại chất lượng', { b: true }), ...oMuc(null)] : []),
    ...chuKy('NGƯỜI TỰ KIỂM ĐIỂM'),
    p('C. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN', { b: true }),
    ...(ma === '2A' ? [] : [p('I. Ý KIẾN NHẬN XÉT, ĐÁNH GIÁ', { b: true }), p('(Phần dành cho người đứng đầu đơn vị cấu thành (nếu có)', { i: true }), ...trong(2), ...chuKy('NGƯỜI NHẬN XÉT, ĐÁNH GIÁ'), p('II. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN (Phần dành cho cấp có thẩm quyền đánh giá)', { b: true })]),
    p('1. Ý kiến nhận xét của cấp có thẩm quyền theo dõi, đánh giá:'), p(d.nhanXetLanhDao ?? ''),
    p('2. Kết quả xếp loại chất lượng'), ...oMuc(d.mucPheDuyet), ...chuKy('CẤP CÓ THẨM QUYỀN XẾP LOẠI'))
  return pack(c)
}

/** Mẫu số 3 — Phiếu xếp loại chất lượng cán bộ, công chức, viên chức. */
export function buildMau03(d: DuLieuCaNhan): Promise<Buffer> {
  const q = d.diemQuy ?? {}
  const hang = [['Quý', 'Tổng điểm theo dõi, đánh giá', 'Kết quả xếp loại chất lượng'],
    ...(['I', 'II', 'III', 'IV'] as const).map((k) => [k, so(q[k]), '']),
    ['Cả năm', d.diemKpiTong === null || d.diemKpiTong === undefined ? '' : so(d.diemKpiTong), MUC.find((m) => m[0] === d.mucPheDuyet)?.[1] ?? '']]
  return pack([
    p('Mẫu số 3', { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(d.tenCoQuan, d.tenDonVi), ...trong(1),
    p('PHIẾU XẾP LOẠI CHẤT LƯỢNG CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC', { b: true, al: AlignmentType.CENTER }), p(`Năm ${d.nam}`, { b: true, al: AlignmentType.CENTER }),
    p(`Họ và tên: ${d.hoTen}`), p(`Chức vụ, chức danh: ${d.chucVuChinhQuyen ?? ''}`), p(`Đơn vị công tác: ${d.donViCongTac}`),
    p('I. TỔNG HỢP KẾT QUẢ THEO DÕI, ĐÁNH GIÁ', { b: true }), bang(hang, [20, 40, 40]),
    p('II. CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG', { b: true }), ...oMuc(null),
    p('III. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN', { b: true }), ...oMuc(d.mucPheDuyet),
    p('IV. ĐỀ XUẤT PHƯƠNG ÁN XỬ LÝ', { b: true }), ...trong(2),
    ...chuKy('CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC TỰ ĐÁNH GIÁ'), ...chuKy('CẤP CÓ THẨM QUYỀN XẾP LOẠI'),
  ])
}

const M1_1 = 'Việc chấp hành nguyên tắc tổ chức và hoạt động, nhất là nguyên tắc tập trung dân chủ; thực hiện quy chế làm việc.'
const M1_2 = 'Kết quả thực hiện các mục tiêu, chỉ tiêu, nhiệm vụ được đề ra trong nghị quyết đại hội nhiệm kỳ, kế hoạch, chương trình công tác năm, được cấp có thẩm quyền giao, phê duyệt và các nhiệm vụ phát sinh, đột xuất được cấp có thẩm quyền giao.'
const M1_3 = 'Công tác xây dựng, chỉnh đốn Đảng và hệ thống chính trị; xây dựng tổ chức bộ máy tinh gọn, hoạt động hiệu năng, hiệu lực, hiệu quả; tinh giản biên chế gắn với cải cách hành chính và chuyển đổi số; năng lực, trách nhiệm của tập thể lãnh đạo, quản lý; trách nhiệm nêu gương; trách nhiệm giải trình; công tác đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá" trong nội bộ gắn với việc học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh; công tác kiểm soát quyền lực, phòng, chống chạy chức, chạy quyền, lợi ích nhóm; xây dựng và thực hiện cơ chế công khai, minh bạch trong công tác cán bộ; công tác kiểm tra, giám sát, kỷ luật đảng và công tác tiếp công dân, giải quyết khiếu nại, tố cáo, kiến nghị, phản ánh của tổ chức, cá nhân.'
const M1_4 = 'Trách nhiệm của tập thể lãnh đạo, quản lý trong triển khai thực hiện các chủ trương, đường lối, nghị quyết, văn bản chỉ đạo của Đảng, của cấp trên; thực hiện nhiệm vụ chính trị của địa phương, tổ chức, cơ quan, đơn vị.'
const M1_V = 'Về hạn chế, khuyết điểm trong thực hiện nhiệm vụ hoặc khi có dấu hiệu vi phạm; để xảy ra những vấn đề bức xúc, phức tạp, dư luận quan tâm; có đơn, thư khiếu nại, tố cáo; biểu hiện mất đoàn kết nội bộ; vi phạm nguyên tắc, quy định của Đảng; biểu hiện "lợi ích nhóm", tham nhũng, lãng phí, tiêu cực, suy thoái, "tự diễn biến", "tự chuyển hoá"; để tập thể, cá nhân thuộc quyền quản lý bị kỷ luật, khởi tố; trì trệ, yếu kém, không hoàn thành chức trách, nhiệm vụ được giao.'
const M1_CHUNG = [
  'Kết quả công tác xây dựng, chỉnh đốn Đảng; củng cố, xây dựng tổ chức đảng và hệ thống chính trị; nâng cao chất lượng đội ngũ cán bộ, đảng viên theo nghị quyết, kế hoạch, chỉ tiêu được giao.',
  'Năng lực lãnh đạo của cấp uỷ; hiệu quả lãnh đạo, chỉ đạo của cấp uỷ đối với chính quyền, Mặt trận Tổ quốc và các tổ chức chính trị - xã hội; hiệu quả trong phối hợp công tác; xây dựng đoàn kết nội bộ.',
  'Hiệu quả trong công tác thanh tra, kiểm tra, giám sát và kỷ luật đảng; thực hiện các quy định về kiểm soát quyền lực; không để xảy ra tham nhũng, lãng phí, tiêu cực, suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá" trong nội bộ.',
  'Kết quả thực hiện các nguyên tắc tổ chức và hoạt động của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình; việc chấp hành quy chế làm việc, nội quy, chế độ công tác; phân công nhiệm vụ, tổ chức thực hiện hiệu quả.',
  'Kết quả lãnh đạo, chỉ đạo, kiểm tra, giám sát việc thực hiện nhiệm vụ chính trị; xây dựng bộ máy tinh gọn, tinh giản biên chế, hoạt động hiệu năng, hiệu lực, hiệu quả; thực hiện cải cách hành chính, chuyển đổi số, đẩy mạnh ứng dụng khoa học, công nghệ, phương pháp quản lý gắn với xây dựng văn hoá công vụ trong hoạt động quản lý, điều hành tổ chức, cơ quan, đơn vị.',
  'Tinh thần tự phê bình và phê bình, tự soi, tự sửa của tập thể; kết quả khắc phục những hạn chế, yếu kém, khuyết điểm đã được chỉ ra trong các kỳ kiểm điểm trước hoặc qua thanh tra, kiểm tra, giám sát.',
]

export type DuLieuTapThe = { tenCoQuan: string; tenDonVi: string; nam: number; tenTapThe: string; duThaoNhanXet: string[] }

/** Mẫu số 01 — Báo cáo kiểm điểm, tự đánh giá, xếp loại chất lượng của tập thể. Mức xếp loại để trống (tập thể tự đề xuất). */
export function buildMau01(d: DuLieuTapThe): Promise<Buffer> {
  const c: (Paragraph | Table)[] = [
    p('Mẫu số 01', { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(d.tenCoQuan, d.tenDonVi), ...trong(1),
    p('BÁO CÁO KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG', { b: true, al: AlignmentType.CENTER, after: 0 }), p(`CỦA TẬP THỂ ${d.tenTapThe.toUpperCase()}`, { b: true, al: AlignmentType.CENTER, after: 0 }), p(`Năm ${d.nam}`, { b: true, al: AlignmentType.CENTER }),
    p(`Căn cứ kết quả lãnh đạo, chỉ đạo thực hiện nhiệm vụ chính trị tại địa phương (cơ quan, đơn vị); tập thể ${d.tenTapThe} kiểm điểm, tự đánh giá, xếp loại chất lượng với các nội dung chủ yếu sau:`),
    p('A. NỘI DUNG KIỂM ĐIỂM', { b: true }), p('I. Ưu điểm, kết quả đạt được', { b: true }),
    p(`1. ${M1_1}`, { i: true }), p(''), p(`2. ${M1_2}`, { i: true }),
    ...(d.duThaoNhanXet.length ? [p('Dự thảo từ dữ liệu công việc thực tế trên hệ thống (cần người có thẩm quyền xem xét, sửa):', { i: true }), ...d.duThaoNhanXet.map((l) => p(`- ${l}`, { ind: 360 }))] : [p('')]),
    p(`3. ${M1_3}`, { i: true }), p(''), p(`4. ${M1_4}`, { i: true }), p(''),
    p('II. Hạn chế, khuyết điểm và nguyên nhân', { b: true }), p('- Hạn chế, khuyết điểm.'), p(''), p('- Nguyên nhân của hạn chế, khuyết điểm.'), p(''),
    p('III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước', { b: true }),
    p('Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của tập thể, cá nhân có liên quan.', { i: true }), p(''),
    p('IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)', { b: true }),
    p('Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của tập thể, cá nhân đối với từng vấn đề được gợi ý kiểm điểm.', { i: true }), p(''),
    p('V. Trách nhiệm của tập thể, cá nhân', { b: true }), p(M1_V, { i: true }), p(''),
    p('VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm', { b: true }), p(''),
    p('B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI', { b: true }), p('I. Đánh giá theo các nhóm tiêu chí', { b: true }), p('1. Nhóm tiêu chí chung: …/30 điểm', { b: true }),
    bang([['TT', 'TIÊU CHÍ', 'ĐIỂM (tối đa)', 'Tự đánh giá'], ['', 'Tổng điểm', '30 điểm', ''], ...M1_CHUNG.map((t, i) => [String(i + 1), t, '05', ''])], [8, 62, 15, 15]),
    p('2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: …/70 điểm', { b: true }),
    bang([['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Điểm tối đa', 'Điểm KPI', 'Điểm đánh giá năm 2026'], ['(1)', '(2)', '(3)', '(4)', '(5)=(4)*70/100'], ['1', 'Nhiệm vụ trọng tâm, then chốt', '10', '', ''], ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', '90', '', ''], ['', 'TỔNG CỘNG', '100', '', '']], [7, 41, 14, 14, 24], 2),
    p('Tổng điểm = (Điểm tiêu chí chung + Điểm tiêu chí về kết quả thực hiện nhiệm vụ)/100 điểm.', { i: true }),
    p('3. SỐ NHIỆM VỤ, CÔNG VIỆC VƯỢT MỤC TIÊU VÀ KHÔNG ĐẠT TRONG KỲ ĐÁNH GIÁ', { b: true }),
    bang([['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Tổng tiêu chí được đánh giá trong kỳ', 'Số tiêu chí vượt mục tiêu (số lượng / tỷ lệ)', 'Có giải pháp đột phá, nổi trội, tạo chuyển biến rõ, tích cực (số lượng / tỷ lệ)', 'Số tiêu chí không hoàn thành'], ['1', 'Nhiệm vụ trọng tâm, then chốt', '', '', '', ''], ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', '', '', '', '']], [7, 29, 14, 18, 18, 14]),
    p('II. ĐỀ XUẤT MỨC XẾP LOẠI CHẤT LƯỢNG:', { b: true }), ...oMuc(null),
    p('T/M TẬP THỂ LÃNH ĐẠO, QUẢN LÝ', { al: AlignmentType.RIGHT, b: true, after: 0 }), p('(Ký, ghi rõ họ tên và đóng dấu)', { al: AlignmentType.RIGHT, i: true }),
  ]
  return pack(c)
}

export type DongKpiXuat = { nhiemVu: string; sanPham?: string; hanHoanThanh?: string }

/** Mẫu số 04 — Bảng theo dõi, đánh giá và chấm điểm kết quả thực hiện nhiệm vụ (.xlsx, có công thức theo cột bản gốc). */
export async function buildMau04(nam: number, hoTen: string, dong: DongKpiXuat[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Mẫu số 04')
  ws.addRow(['MẪU SỐ 4'])
  ws.addRow([`BẢNG THEO DÕI, ĐÁNH GIÁ VÀ CHẤM ĐIỂM KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐỐI VỚI CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC — ${hoTen} — Năm ${nam}`])
  ws.addRow(['TT', 'Nhiệm vụ / Công việc chi tiết', 'Sản phẩm', 'Thời gian yêu cầu hoàn thành (tiến độ đề ra)', 'Phân nhóm độ khó, phức tạp, phạm vi tác động', 'Điểm theo danh mục nhiệm vụ, công việc (7)', 'Số lượng (8)', 'Tổng điểm quy đổi (9)=(8)*(7)', 'Hoàn thành thực tế (10)', 'Quy đổi số lượng (11)=(10)*(7)', 'Số lần yêu cầu hoàn thiện, chỉnh sửa (12)', 'Chất lượng thực tế (13)=100%-(12)*25%', 'Quy đổi chất lượng (14)=(13)*(9)', 'Ngày hoàn thành (15)', 'Số ngày chậm (làm việc)', 'Tiến độ (16)=1,00-(số ngày chậm)*0,05', 'Quy đổi tiến độ (17)=(16)*(9)'])
  ws.addRow(['A', 'NHIỆM VỤ TRỌNG TÂM, THEN CHỐT (10 ĐIỂM)'])
  const dauA = ws.rowCount + 1
  const hang = (d: DongKpiXuat, i: number) => {
    const n = ws.rowCount + 1
    ws.addRow([i + 1, d.nhiemVu, d.sanPham ?? '', d.hanHoanThanh ?? '', null, null, null, { formula: `G${n}*F${n}` }, null, { formula: `I${n}*F${n}` }, null, { formula: `MAX(0,1-K${n}*0.25)` }, { formula: `L${n}*H${n}` }, null, null, { formula: `MIN(1,MAX(0,1-O${n}*0.05))` }, { formula: `P${n}*H${n}` }])
  }
  dong.forEach(hang)
  const cuoiA = ws.rowCount
  const tongNhom = (ten: string, a: number, b: number, diem: number) => {
    const n = ws.rowCount + 1
    ws.addRow([`Tổng nhóm ${ten}`, null, null, null, null, null, null, { formula: `SUM(H${a}:H${b})` }, null, { formula: `SUM(J${a}:J${b})` }, null, null, { formula: `SUM(M${a}:M${b})` }, null, null, null, { formula: `SUM(Q${a}:Q${b})` }])
    ws.addRow([`Điểm KPI (nhóm ${ten})`, null, { formula: `IF(H${n}=0,0,AVERAGE(J${n},M${n},Q${n})/H${n})` }])
    ws.addRow([`Tổng điểm đạt (nhóm ${ten})`, null, { formula: `C${n + 1}*${diem}` }])
    return n + 2
  }
  const diemA = tongNhom('A', dauA, Math.max(dauA, cuoiA), 10)
  ws.addRow(['B', 'NHIỆM VỤ THEO CHỨC NĂNG, NHIỆM VỤ ĐƯỢC GIAO (90 ĐIỂM)'])
  const dauB = ws.rowCount + 1
  ws.addRow([1, '(nhập nhiệm vụ nhóm B)'])
  const diemB = tongNhom('B', dauB, dauB, 90)
  ws.addRow(['TỔNG ĐIỂM ĐẠT (A+B)', null, { formula: `C${diemA}+C${diemB}` }])
  ws.getColumn(2).width = 48; ws.getColumn(3).width = 28
  for (let i = 4; i <= 17; i++) ws.getColumn(i).width = 16
  ws.getRow(3).font = { bold: true }; ws.getRow(3).alignment = { wrapText: true, vertical: 'middle' }
  return Buffer.from(await wb.xlsx.writeBuffer())
}
