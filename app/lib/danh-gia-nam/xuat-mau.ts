// Xuất biểu mẫu Word/Excel theo bản gốc của Sở Nội vụ (CV 6862/SNV-CBCCVC): Mẫu 01, 2A, 2B, 2C, 03, 04.
// Chép NGUYÊN VĂN các câu hướng dẫn của bản gốc; chỗ nào hệ thống không có dữ liệu thì để trống (không điền thay).
// KHÔNG xuất Mẫu 05, 06, 07 (bản gốc .doc chưa đọc được bố cục cột) và 4B, 6C, 6F1–6F4 (không có bản gốc) — xem mau-bieu.ts.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign,
} from 'docx'
import ExcelJS from 'exceljs'
import { TIEU_CHI_CHUNG, diemNhiemVuNam } from './tieu-chi'
import { TIEU_CHI_TAP_THE, tongDiemTapThe, tyLe, MUC_HOP_LE, type BieuMauCaNhan, type BieuMauTapThe, type BangIII, type DongTongHop, type HangMau05, type DongM04 } from './bieu-mau-du-lieu'
import { THANH_PHAN, THAM_DU_LABEL, thongKeThamDu, type BienBanHop, type YKienChot } from './bien-ban-hop'

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
  tongDiem?: number | null
  /** dữ liệu nhập theo biểu mẫu (ưu tiên hơn nhận xét tự soạn) */
  bieuMau?: BieuMauCaNhan
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

function hangIII(b?: BangIII, tyLeDotPha = false): string[][] {
  const o = (k: 'A' | 'B') => {
    const x = b?.[k] ?? {}
    const tl = (v?: number | null) => (v === null || v === undefined ? '' : x.tong ? `${v} (${tyLe(v, x.tong)}%)` : String(v))
    return [k === 'A' ? '1' : '2', k === 'A' ? 'Nhiệm vụ trọng tâm, then chốt' : 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', so(x.tong), tl(x.vuot), tyLeDotPha ? tl(x.dotPha) : so(x.dotPha), tl(x.khongHoanThanh)]
  }
  return [o('A'), o('B')]
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
  const pa = d.bieuMau?.phanA ?? {}
  // Bản kiểm điểm là lời của CHÍNH CHỦ: chỉ in phần A cá nhân đã lưu, không lấp bằng nhận xét của người khác
  const noi = (ma: string, _duPhong?: string) => { void _duPhong; return p(pa[ma] ?? '', { ind: 360 }) }
  uuDiem.forEach((t, i) => {
    c.push(p(`${i + 1}. ${t}`, { i: true }))
    c.push(noi(`A_I_${i + 1}`, i === 1 ? nx.ket_qua_nhiem_vu : undefined))
  })
  if (d.tuDanhGia) c.push(p('Nội dung tự đánh giá do cá nhân nhập trên hệ thống:', { i: true }), p(d.tuDanhGia, { ind: 360 }))
  c.push(p('II. Hạn chế, khuyết điểm và nguyên nhân', { b: true }), p('1. Hạn chế, khuyết điểm.', { i: true }), noi('A_II_1', nx.han_che), p('2. Nguyên nhân của hạn chế, khuyết điểm.', { i: true }), noi('A_II_2', nx.nguyen_nhan),
    p('III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước', { b: true }), p(A_KHAC_PHUC, { i: true }), noi('A_III', nx.khac_phuc),
    p('IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)', { b: true }), p(A_GIAI_TRINH, { i: true }), noi('A_IV'),
    p('V. Làm rõ trách nhiệm của cá nhân đối với những hạn chế, khuyết điểm của tập thể (nếu có)', { b: true }), noi('A_V'),
    p('VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm', { b: true }), noi('A_VI', nx.phuong_huong),
    p('B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI', { b: true }), p(`I. Nhóm tiêu chí chung: ${tc.tong === null ? '…' : so(tc.tong)}/30 điểm`, { b: true }), tc.bang,
    p(`II. Tiêu chí về kết quả thực hiện nhiệm vụ: ${tongNam === null ? '…' : so(tongNam)}/70 điểm`, { b: true }), bangKetQua(ma, d))
  c.push(p(ma === '2A' ? 'Điểm KPI: Được tính theo kết quả điểm đánh giá, xếp loại chất lượng đối với tập thể lãnh đạo cơ quan, đơn vị, địa phương' : GHI_CHU_MAU04, { i: true }),
    p(`Tổng điểm = Điểm tiêu chí chung + Điểm tiêu chí về kết quả thực hiện nhiệm vụ${tongDiem === null ? '' : ` = ${so(tongDiem)}`}`, { i: true }),
    p(ma === '2A' ? 'III. SỐ NHIỆM VỤ, CÔNG VIỆC VƯỢT MỤC TIÊU VÀ KHÔNG HOÀN THÀNH TRONG KỲ ĐÁNH GIÁ' : 'III. SỐ NHIỆM VỤ, CÔNG VIỆC VƯỢT MỤC TIÊU VÀ KHÔNG ĐẠT TRONG KỲ ĐÁNH GIÁ', { b: true }),
    bang(ma === '2A'
      ? [['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Tổng tiêu chí được đánh giá trong kỳ', 'Số tiêu chí vượt mục tiêu', 'Có giải pháp đột phá, nổi trội, tạo chuyển biến rõ, tích cực', 'Số tiêu chí không đạt'], hangIII(d.bieuMau?.bangIII)[0], hangIII(d.bieuMau?.bangIII)[1]]
      : [['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Tổng sản phẩm được đánh giá trong kỳ', 'Số sản phẩm vượt mục tiêu (số lượng / tỷ lệ so với tổng số nhiệm vụ trong kỳ)', 'Số sản phẩm đột phá, nổi trội, tạo chuyển biến rõ, tích cực', 'Số nhiệm vụ không hoàn thành (số lượng / tỷ lệ)'], hangIII(d.bieuMau?.bangIII)[0], hangIII(d.bieuMau?.bangIII)[1]],
      [7, 29, 14, 18, 18, 14]),
    ...(ma === '2A' ? [] : [p('3. Tự nhận mức xếp loại chất lượng', { b: true }), ...oMuc(d.bieuMau?.tuNhanMuc ?? null)]),
    ...(ma === '2A' ? [p('Tự nhận mức xếp loại chất lượng', { b: true }), ...oMuc(d.bieuMau?.tuNhanMuc ?? null)] : []),
    ...chuKy('NGƯỜI TỰ KIỂM ĐIỂM'),
    p('C. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN', { b: true }),
    ...(ma === '2A' ? [] : [p('I. Ý KIẾN NHẬN XÉT, ĐÁNH GIÁ', { b: true }), p('(Phần dành cho người đứng đầu đơn vị cấu thành (nếu có)', { i: true }), p(d.bieuMau?.yKienDonViCauThanh ?? ''), ...trong(1), ...chuKy('NGƯỜI NHẬN XÉT, ĐÁNH GIÁ'), p('II. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN (Phần dành cho cấp có thẩm quyền đánh giá)', { b: true })]),
    p('1. Ý kiến nhận xét của cấp có thẩm quyền theo dõi, đánh giá:'), p(d.nhanXetLanhDao ?? ''),
    p('2. Kết quả xếp loại chất lượng'), ...oMuc(d.mucPheDuyet), ...chuKy('CẤP CÓ THẨM QUYỀN XẾP LOẠI'))
  return pack(c)
}

/** Mẫu số 3 — Phiếu xếp loại chất lượng cán bộ, công chức, viên chức. */
export function buildMau03(d: DuLieuCaNhan): Promise<Buffer> {
  const q = d.diemQuy ?? {}
  const hang = [['Quý', 'Tổng điểm theo dõi, đánh giá', 'Kết quả xếp loại chất lượng'],
    ...(['I', 'II', 'III', 'IV'] as const).map((k) => [k, so(q[k]), MUC.find((m) => m[0] === d.bieuMau?.m03?.mucQuy?.[k])?.[1] ?? '']),
    ['Cả năm', d.tongDiem === null || d.tongDiem === undefined ? '' : so(d.tongDiem), MUC.find((m) => m[0] === d.mucPheDuyet)?.[1] ?? '']]
  return pack([
    p('Mẫu số 3', { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(d.tenCoQuan, d.tenDonVi), ...trong(1),
    p('PHIẾU XẾP LOẠI CHẤT LƯỢNG CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC', { b: true, al: AlignmentType.CENTER }), p(`Năm ${d.nam}`, { b: true, al: AlignmentType.CENTER }),
    p(`Họ và tên: ${d.hoTen}`), p(`Chức vụ, chức danh: ${d.chucVuChinhQuyen ?? ''}`), p(`Đơn vị công tác: ${d.donViCongTac}`),
    p('I. TỔNG HỢP KẾT QUẢ THEO DÕI, ĐÁNH GIÁ', { b: true }), bang(hang, [20, 40, 40]),
    p('II. CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG', { b: true }), ...oMuc(d.bieuMau?.tuNhanMuc ?? null),
    p('III. KẾT QUẢ XẾP LOẠI CHẤT LƯỢNG CỦA CẤP CÓ THẨM QUYỀN', { b: true }), ...oMuc(d.mucPheDuyet),
    p('IV. ĐỀ XUẤT PHƯƠNG ÁN XỬ LÝ', { b: true }), p(d.bieuMau?.m03?.deXuatXuLy ?? ''), ...trong(1),
    ...chuKy('CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC TỰ ĐÁNH GIÁ'), ...chuKy('CẤP CÓ THẨM QUYỀN XẾP LOẠI'),
  ])
}

const M1_1 = 'Việc chấp hành nguyên tắc tổ chức và hoạt động, nhất là nguyên tắc tập trung dân chủ; thực hiện quy chế làm việc.'
const M1_2 = 'Kết quả thực hiện các mục tiêu, chỉ tiêu, nhiệm vụ được đề ra trong nghị quyết đại hội nhiệm kỳ, kế hoạch, chương trình công tác năm, được cấp có thẩm quyền giao, phê duyệt và các nhiệm vụ phát sinh, đột xuất được cấp có thẩm quyền giao.'
const M1_3 = 'Công tác xây dựng, chỉnh đốn Đảng và hệ thống chính trị; xây dựng tổ chức bộ máy tinh gọn, hoạt động hiệu năng, hiệu lực, hiệu quả; tinh giản biên chế gắn với cải cách hành chính và chuyển đổi số; năng lực, trách nhiệm của tập thể lãnh đạo, quản lý; trách nhiệm nêu gương; trách nhiệm giải trình; công tác đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí và ngăn chặn, đẩy lùi những biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá" trong nội bộ gắn với việc học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh; công tác kiểm soát quyền lực, phòng, chống chạy chức, chạy quyền, lợi ích nhóm; xây dựng và thực hiện cơ chế công khai, minh bạch trong công tác cán bộ; công tác kiểm tra, giám sát, kỷ luật đảng và công tác tiếp công dân, giải quyết khiếu nại, tố cáo, kiến nghị, phản ánh của tổ chức, cá nhân.'
const M1_4 = 'Trách nhiệm của tập thể lãnh đạo, quản lý trong triển khai thực hiện các chủ trương, đường lối, nghị quyết, văn bản chỉ đạo của Đảng, của cấp trên; thực hiện nhiệm vụ chính trị của địa phương, tổ chức, cơ quan, đơn vị.'
const M1_V = 'Về hạn chế, khuyết điểm trong thực hiện nhiệm vụ hoặc khi có dấu hiệu vi phạm; để xảy ra những vấn đề bức xúc, phức tạp, dư luận quan tâm; có đơn, thư khiếu nại, tố cáo; biểu hiện mất đoàn kết nội bộ; vi phạm nguyên tắc, quy định của Đảng; biểu hiện "lợi ích nhóm", tham nhũng, lãng phí, tiêu cực, suy thoái, "tự diễn biến", "tự chuyển hoá"; để tập thể, cá nhân thuộc quyền quản lý bị kỷ luật, khởi tố; trì trệ, yếu kém, không hoàn thành chức trách, nhiệm vụ được giao.'

export type DuLieuTapThe = {
  tenCoQuan: string; tenDonVi: string; nam: number; tenTapThe: string; duThaoNhanXet: string[]
  bieuMau?: BieuMauTapThe; mucTuDeXuat?: string | null
}

/** Mẫu số 01 — Báo cáo kiểm điểm, tự đánh giá, xếp loại chất lượng của tập thể (dữ liệu nhập ở form Mẫu 01). */
export function buildMau01(d: DuLieuTapThe): Promise<Buffer> {
  const pa = d.bieuMau?.phanA ?? {}
  const noi = (ma: string) => p(pa[ma] ?? '', { ind: 360 })
  const t = tongDiemTapThe(d.bieuMau ?? {})
  const dc = d.bieuMau?.diemChung6 ?? []
  const kpiA = d.bieuMau?.kpiA ?? null, kpiB = d.bieuMau?.kpiB ?? null
  const kpiTong = kpiA === null || kpiB === null ? null : kpiA + kpiB
  const c: (Paragraph | Table)[] = [
    p('Mẫu số 01', { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(d.tenCoQuan, d.tenDonVi), ...trong(1),
    p('BÁO CÁO KIỂM ĐIỂM, TỰ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG', { b: true, al: AlignmentType.CENTER, after: 0 }), p(`CỦA TẬP THỂ ${d.tenTapThe.toUpperCase()}`, { b: true, al: AlignmentType.CENTER, after: 0 }), p(`Năm ${d.nam}`, { b: true, al: AlignmentType.CENTER }),
    p(`Căn cứ kết quả lãnh đạo, chỉ đạo thực hiện nhiệm vụ chính trị tại địa phương (cơ quan, đơn vị); tập thể ${d.tenTapThe} kiểm điểm, tự đánh giá, xếp loại chất lượng với các nội dung chủ yếu sau:`),
    p('A. NỘI DUNG KIỂM ĐIỂM', { b: true }), p('I. Ưu điểm, kết quả đạt được', { b: true }),
    p(`1. ${M1_1}`, { i: true }), noi('A_I_1'), p(`2. ${M1_2}`, { i: true }),
    noi('A_I_2'),
    p(`3. ${M1_3}`, { i: true }), noi('A_I_3'), p(`4. ${M1_4}`, { i: true }), noi('A_I_4'),
    p('II. Hạn chế, khuyết điểm và nguyên nhân', { b: true }), p('- Hạn chế, khuyết điểm.'), noi('A_II_1'), p('- Nguyên nhân của hạn chế, khuyết điểm.'), noi('A_II_2'),
    p('III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước', { b: true }),
    p('Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của tập thể, cá nhân có liên quan.', { i: true }), noi('A_III'),
    p('IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)', { b: true }),
    p('Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của tập thể, cá nhân đối với từng vấn đề được gợi ý kiểm điểm.', { i: true }), noi('A_IV'),
    p('V. Trách nhiệm của tập thể, cá nhân', { b: true }), p(M1_V, { i: true }), noi('A_V'),
    p('VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm', { b: true }), noi('A_VI'),
    p('B. NỘI DUNG TỰ ĐÁNH GIÁ, XẾP LOẠI', { b: true }), p('I. Đánh giá theo các nhóm tiêu chí', { b: true }), p(`1. Nhóm tiêu chí chung: ${t.chung === null ? '…' : so(t.chung)}/30 điểm`, { b: true }),
    bang([['TT', 'TIÊU CHÍ', 'ĐIỂM (tối đa)', 'Tự đánh giá'], ['', 'Tổng điểm', '30 điểm', t.chung === null ? '' : so(t.chung)], ...TIEU_CHI_TAP_THE.map((x, k) => [String(k + 1), x, '05', so(dc[k])])], [8, 62, 15, 15]),
    p(`2. Nhóm tiêu chí về kết quả thực hiện nhiệm vụ: ${t.nhiemVu === null ? '…' : so(t.nhiemVu)}/70 điểm`, { b: true }),
    bang([['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Điểm tối đa', 'Điểm KPI', `Điểm đánh giá năm ${d.nam}`], ['(1)', '(2)', '(3)', '(4)', '(5)=(4)*70/100'],
      ['1', 'Nhiệm vụ trọng tâm, then chốt', '10', so(kpiA), kpiA === null ? '' : so(Math.round(kpiA * 70) / 100)],
      ['2', 'Nhiệm vụ theo chức năng, nhiệm vụ thường xuyên', '90', so(kpiB), kpiB === null ? '' : so(Math.round(kpiB * 70) / 100)],
      ['', 'TỔNG CỘNG', '100', so(kpiTong), t.nhiemVu === null ? '' : so(t.nhiemVu)]], [7, 41, 14, 14, 24], 2),
    p(`Tổng điểm = (Điểm tiêu chí chung + Điểm tiêu chí về kết quả thực hiện nhiệm vụ)/100 điểm${t.tong === null ? '' : ` = ${so(t.tong)}`}.`, { i: true }),
    p('3. SỐ NHIỆM VỤ, CÔNG VIỆC VƯỢT MỤC TIÊU VÀ KHÔNG ĐẠT TRONG KỲ ĐÁNH GIÁ', { b: true }),
    bang([['TT', 'Mục tiêu, nhiệm vụ, công việc', 'Tổng tiêu chí được đánh giá trong kỳ', 'Số tiêu chí vượt mục tiêu (số lượng / tỷ lệ)', 'Có giải pháp đột phá, nổi trội, tạo chuyển biến rõ, tích cực (số lượng / tỷ lệ)', 'Số tiêu chí không hoàn thành'], hangIII(d.bieuMau?.bangIII, true)[0], hangIII(d.bieuMau?.bangIII, true)[1]], [7, 29, 14, 18, 18, 14]),
    p('II. ĐỀ XUẤT MỨC XẾP LOẠI CHẤT LƯỢNG:', { b: true }), ...oMuc(d.mucTuDeXuat ?? null),
    p('T/M TẬP THỂ LÃNH ĐẠO, QUẢN LÝ', { al: AlignmentType.RIGHT, b: true, after: 0 }), p('(Ký, ghi rõ họ tên và đóng dấu)', { al: AlignmentType.RIGHT, i: true }),
  ]
  return pack(c)
}

/** Mẫu số 05 / 06 — Báo cáo tổng hợp kết quả đánh giá, xếp loại (12 cột theo bản gốc). */
export function buildMau0506(ma: '05' | '06', nam: number, tenCoQuan: string, hang: HangMau05[], chuaPhanLoai: string[] = []): Promise<Buffer> {
  const tieuDe = ma === '05' ? `BÁO CÁO TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG CÁN BỘ, CÔNG CHỨC NĂM ${nam}` : `BÁO CÁO TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG VIÊN CHỨC NĂM ${nam}`
  const nhom = ma === '05' ? 'Sở, ban, ngành cấp tỉnh' : 'Viên chức trong các đơn vị sự nghiệp công lập thuộc UBND tỉnh và thuộc cơ quan chuyên môn cấp tỉnh'
  const tong = hang.reduce((t, x) => t + x.tong, 0)
  const rows: string[][] = [
    ['TT', 'Cơ quan, đơn vị', 'Tổng số (người)', ...MUC_HOP_LE.flatMap((m) => [`${MUC.find((x) => x[0] === m)![1]} - Số lượng (người)`, 'Tỷ lệ (%)']), 'Ghi chú (đối với không hoàn thành nhiệm vụ thì ghi rõ lý do)'],
    ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)'],
    ['1', `${nhom} — ${tenCoQuan}`, String(tong), ...MUC_HOP_LE.flatMap((m) => { const n = hang.reduce((t, x) => t + x.theoMuc[m], 0); return [String(n), tyLe(n, tong)] }), ''],
    ...hang.map((h, k) => [`1.${k + (ma === '05' ? 2 : 1)}`, h.nhan, String(h.tong), ...MUC_HOP_LE.flatMap((m) => [String(h.theoMuc[m]), tyLe(h.theoMuc[m], h.tong)]), h.ghiChu]),
  ]
  return pack([
    p(`Mẫu số ${ma === '05' ? '5' : '6'}`, { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(tenCoQuan, ''), ...trong(1),
    p(tieuDe, { b: true, al: AlignmentType.CENTER }), bang(rows, [4, 18, 7, 8, 6, 8, 6, 8, 6, 8, 6, 15], 2),
    p('Ghi chú: chỉ tổng hợp hồ sơ đã được cấp có thẩm quyền phê duyệt trên hệ thống.', { i: true }),
    ...(chuaPhanLoai.length ? [p(`Lưu ý: ${chuaPhanLoai.length} người đã phê duyệt chưa ghi đối tượng (công chức/viên chức) nên chưa được tính: ${chuaPhanLoai.join(', ')}.`, { i: true })] : []),
    ...chuKy('THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ', '(Ký, ghi rõ họ tên và đóng dấu)'),
  ])
}

/** Mẫu số 07 — Tổng hợp kết quả đánh giá, xếp loại chất lượng CBCCVC (danh sách). */
export function buildMau07(nam: number, tenCoQuan: string, ds: DongTongHop[]): Promise<Buffer> {
  const dt = (x: DongTongHop['doiTuong']) => (x === 'CONG_CHUC' ? 'Công chức' : x === 'VIEN_CHUC' ? 'Viên chức' : x === 'NGUOI_LAO_DONG' ? 'Người lao động' : '')
  return pack([
    p('Mẫu số 7', { b: true, i: true, al: AlignmentType.RIGHT }), khungTren(tenCoQuan, ''), ...trong(1),
    p('TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG CBCCVC', { b: true, al: AlignmentType.CENTER, after: 0 }), p(`NĂM ${nam}`, { b: true, al: AlignmentType.CENTER }),
    bang([['TT', 'Họ và tên', 'Vị trí việc làm (chức vụ/đơn vị công tác)', 'Kết quả xếp loại chất lượng', 'Ghi chú'],
      ...ds.map((x, k) => [String(k + 1), x.hoTen, x.viTri, MUC.find((m) => m[0] === x.muc)?.[1] ?? '', dt(x.doiTuong)])], [6, 24, 34, 22, 14]),
    ...chuKy('THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ', '(Ký, ghi rõ họ tên và đóng dấu)'),
  ])
}

export type DongKpiXuat = { nhiemVu: string; sanPham?: string; hanHoanThanh?: string } & Partial<Omit<DongM04, 'nhiemVu' | 'sanPham' | 'hanHoanThanh'>>

/** Mẫu số 04 — Bảng theo dõi, đánh giá và chấm điểm kết quả thực hiện nhiệm vụ (.xlsx, có công thức theo cột bản gốc). */
export async function buildMau04(nam: number, hoTen: string, dong: DongKpiXuat[], dongB: DongKpiXuat[] = []): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Mẫu số 04')
  ws.addRow(['MẪU SỐ 4'])
  ws.addRow([`BẢNG THEO DÕI, ĐÁNH GIÁ VÀ CHẤM ĐIỂM KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐỐI VỚI CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC — ${hoTen} — Năm ${nam}`])
  ws.addRow(['TT', 'Nhiệm vụ / Công việc chi tiết', 'Sản phẩm', 'Thời gian yêu cầu hoàn thành (tiến độ đề ra)', 'Phân nhóm độ khó, phức tạp, phạm vi tác động', 'Điểm theo danh mục nhiệm vụ, công việc (7)', 'Số lượng (8)', 'Tổng điểm quy đổi (9)=(8)*(7)', 'Hoàn thành thực tế (10)', 'Quy đổi số lượng (11)=(10)*(7)', 'Số lần yêu cầu hoàn thiện, chỉnh sửa (12)', 'Chất lượng thực tế (13)=100%-(12)*25%', 'Quy đổi chất lượng (14)=(13)*(9)', 'Ngày hoàn thành (15)', 'Số ngày chậm (làm việc)', 'Tiến độ (16)=1,00-(số ngày chậm)*0,05', 'Quy đổi tiến độ (17)=(16)*(9)'])
  ws.addRow(['A', 'NHIỆM VỤ TRỌNG TÂM, THEN CHỐT (10 ĐIỂM)'])
  const dauA = ws.rowCount + 1
  const hang = (d: DongKpiXuat, i: number) => {
    const n = ws.rowCount + 1
    const v = (x: number | undefined) => (x === undefined ? null : x)
    ws.addRow([i + 1, d.nhiemVu, d.sanPham ?? '', d.hanHoanThanh ?? '', null, v(d.diemDanhMuc), v(d.soLuong), { formula: `G${n}*F${n}` }, v(d.hoanThanhThucTe), { formula: `I${n}*F${n}` }, v(d.soLanChinhSua), { formula: `MAX(0,1-K${n}*0.25)` }, { formula: `L${n}*H${n}` }, d.ngayHoanThanh ?? null, v(d.soNgayCham), { formula: `MIN(1,MAX(0,1-O${n}*0.05))` }, { formula: `P${n}*H${n}` }])
  }
  if (dong.length) dong.forEach(hang)
  else ws.addRow([1, '(nhập nhiệm vụ nhóm A)'])
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
  if (dongB.length) dongB.forEach(hang)
  else ws.addRow([1, '(nhập nhiệm vụ nhóm B)'])
  const diemB = tongNhom('B', dauB, ws.rowCount, 90)
  ws.addRow(['TỔNG ĐIỂM ĐẠT (A+B)', null, { formula: `C${diemA}+C${diemB}` }])
  ws.getColumn(2).width = 48; ws.getColumn(3).width = 28
  for (let i = 4; i <= 17; i++) ws.getColumn(i).width = 16
  ws.getRow(3).font = { bold: true }; ws.getRow(3).alignment = { wrapText: true, vertical: 'middle' }
  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ── Biên bản cuộc họp nhận xét, đánh giá cuối năm (theo từng phòng / đơn vị) ────────────
// Không có mẫu gốc ban hành kèm NĐ 335/2025 / NĐ 233/2026: bố cục theo thể thức biên bản hành chính, nội dung bắt buộc
// theo Điều 21 NĐ 335 / Điều 15 NĐ 233 (thành phần, ý kiến ghi vào biên bản và thông qua tại cuộc họp).
// Đã chốt: in theo ẢNH CHỤP ý kiến lúc chốt. Chưa chốt: in "DỰ THẢO" từ dữ liệu hiện có và KHÔNG khẳng định đã thông qua.
// Ô chưa ghi để "…" — không tự điền diễn biến hay kết quả thay người ghi biên bản.
export type DuLieuBienBan = { tenCoQuan: string; tenDonVi: string; nam: number; bb: BienBanHop; nguoi: YKienChot[] }

const ngayVN = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? `ngày ${s.slice(8, 10)} tháng ${s.slice(5, 7)} năm ${s.slice(0, 4)}` : 'ngày … tháng … năm …')
const tenMuc = (m?: string | null) => MUC.find((x) => x[0] === m)?.[1] ?? ''

export function buildBienBan(d: DuLieuBienBan): Promise<Buffer> {
  const { bb } = d
  const daChot = !!bb.chot
  const nguoi = bb.chot ? bb.chot.yKien : d.nguoi
  const tk = thongKeThamDu(bb)
  const ten = (id?: string | null) => bb.thanhVien.find((x) => x.canBoId === id)
  const ct = ten(bb.chuTriId), tky = ten(bb.thuKyId)
  const tp = THANH_PHAN[bb.loai]
  const doiTuong = bb.loai === 'LANH_DAO_SO' ? 'lãnh đạo Sở' : bb.loai === 'LANH_DAO_DON_VI' ? 'lãnh đạo đơn vị' : 'công chức, viên chức, người lao động'
  const tq = bb.thongQua
  const c: (Paragraph | Table)[] = [
    ...(daChot ? [] : [p('DỰ THẢO — biên bản chưa được chốt', { b: true, i: true, al: AlignmentType.RIGHT })]),
    khungTren(d.tenCoQuan, d.tenDonVi),
    p(`Số:      /BB-…                                        Quảng Trị, ${ngayVN(bb.ngayHop)}`, { i: true }),
    ...trong(1),
    p('BIÊN BẢN', { b: true, al: AlignmentType.CENTER, after: 0 }),
    p(`Cuộc họp nhận xét, đánh giá, xếp loại chất lượng ${doiTuong} năm ${d.nam}`, { b: true, al: AlignmentType.CENTER, after: 0 }),
    p(`của ${d.tenDonVi}`, { b: true, al: AlignmentType.CENTER }),
    p(`Căn cứ ${tp.canCu};`, { i: true, after: 0 }),
    p('Căn cứ Công văn số 6862/SNV-CBCCVC của Sở Nội vụ và văn bản hướng dẫn đánh giá, xếp loại tập thể, cá nhân năm 2026 của Sở Xây dựng.', { i: true }),
    p('I. THỜI GIAN, ĐỊA ĐIỂM', { b: true }),
    p(`- Thời gian: bắt đầu lúc ${bb.gioBatDau ?? '… giờ …'}, ${ngayVN(bb.ngayHop)}.`),
    p(`- Địa điểm: ${bb.diaDiem ?? '…'}.`),
    p('II. THÀNH PHẦN', { b: true }),
    p(`- Chủ trì: ${ct ? `${ct.hoTen}${ct.chucVu ? `, ${ct.chucVu}` : ''}` : '…'}.`),
    p(`- Thư ký: ${tky ? `${tky.hoTen}${tky.chucVu ? `, ${tky.chucVu}` : ''}` : '…'}.`),
    ...(bb.loai !== 'PHONG' ? [p(`- Đại diện cấp ủy đảng: ${bb.daiDienCapUy ?? '…'}.`)] : []),
    ...(bb.loai === 'LANH_DAO_DON_VI' ? [p(`- Đại diện các tổ chức chính trị - xã hội: ${bb.daiDienDoanThe ?? '…'}.`)] : []),
    p(`- Thành phần triệu tập theo quy định: ${tp.thanhPhan}`),
    p(`- Tổng số triệu tập: ${tk.trieuTap} người; có mặt: ${tk.coMat} người${tk.vanBan ? `; tham gia ý kiến bằng văn bản: ${tk.vanBan} người` : ''}; vắng: ${tk.vangCoLyDo + tk.vangKhongLyDo} người (có lý do: ${tk.vangCoLyDo}; không lý do: ${tk.vangKhongLyDo}).`),
    bang([['TT', 'Họ và tên', 'Chức vụ', 'Tham dự', 'Ghi chú'],
      ...bb.thanhVien.map((x, k) => [String(k + 1), x.hoTen, x.chucVu ?? '', THAM_DU_LABEL[x.thamDu], x.lyDo ?? ''])], [6, 26, 30, 18, 20]),
    ...(bb.khachMoi ? [p(`- Khách mời: ${bb.khachMoi}.`)] : []),
    p('III. NỘI DUNG CUỘC HỌP', { b: true }),
    p('1. Diễn biến cuộc họp', { b: true }),
    p(bb.noiDung ?? '…', { ind: 360 }),
    p('2. Ý kiến nhận xét, đánh giá đối với từng người', { b: true }),
  ]
  nguoi.forEach((n, k) => {
    const phieu = n.bieuQuyet ? MUC_HOP_LE.filter((m) => (n.bieuQuyet?.[m] ?? null) !== null).map((m) => `${tenMuc(m)}: ${n.bieuQuyet![m]} phiếu`) : []
    c.push(
      p(`2.${k + 1}. ${n.hoTen}${n.chucVu ? ` — ${n.chucVu}` : ''}`, { b: true }),
      p(`- Tổng điểm theo dõi, đánh giá: ${n.tongDiem === null ? '…' : so(n.tongDiem)}/100; tự nhận mức: ${tenMuc(n.tuNhanMuc) || '…'}.`, { ind: 360 }),
      p(`- Ý kiến của tập thể: ${n.yKien?.trim() || '…'}`, { ind: 360 }),
      p(`- Kết quả biểu quyết: ${phieu.length ? phieu.join('; ') : '…'}.`, { ind: 360 }),
      p(`- Tập thể đề xuất mức: ${tenMuc(n.mucTapTheDeXuat) || '…'}.`, { ind: 360 }),
    )
  })
  c.push(
    p('3. Tổng hợp kết quả', { b: true }),
    bang([['TT', 'Họ và tên', 'Tổng điểm', 'Tự nhận mức', 'Tập thể đề xuất'],
      ...nguoi.map((n, k) => [String(k + 1), n.hoTen, n.tongDiem === null ? '' : so(n.tongDiem), tenMuc(n.tuNhanMuc), tenMuc(n.mucTapTheDeXuat)])], [6, 30, 14, 25, 25]),
    p('Mức xếp loại đề xuất của tập thể là căn cứ để cấp có thẩm quyền xem xét, quyết định; không phải kết quả xếp loại chính thức.', { i: true }),
    p('IV. THÔNG QUA BIÊN BẢN', { b: true }),
    p(daChot
      ? `Biên bản đã được đọc lại cho các thành viên dự họp. Số người tán thành: ${tq?.tanThanh ?? '…'}/${tk.coMat} người có mặt; không tán thành: ${tq?.khongTanThanh ?? 0}.`
      : `Kết quả biểu quyết thông qua biên bản: tán thành ${tq?.tanThanh ?? '…'}/${tk.coMat} người có mặt; không tán thành ${tq?.khongTanThanh ?? '…'}.`),
    p(`Cuộc họp kết thúc lúc ${bb.gioKetThuc ?? '… giờ …'} cùng ngày.${bb.ketThuc ? ` ${bb.ketThuc}` : ''}`),
    ...trong(1),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
      rows: [new TableRow({ children: [['THƯ KÝ', tky?.hoTen], ['CHỦ TRÌ', ct?.hoTen]].map(([nhan, ho]) => new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        children: [p(nhan!, { b: true, al: AlignmentType.CENTER, after: 0 }), p('(Ký, ghi rõ họ tên)', { i: true, al: AlignmentType.CENTER }), ...trong(3), p(ho ?? '', { b: true, al: AlignmentType.CENTER })],
      })) })],
    }),
  )
  return pack(c)
}
