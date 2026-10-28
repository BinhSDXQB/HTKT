import 'server-only'
import {
  Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType, BorderStyle,
} from 'docx'
import { fmtSo } from './luong'

/**
 * Sinh Quyết định hành chính (.docx) theo thể thức văn bản nhà nước.
 * Mọi căn cứ pháp lý lấy từ dữ liệu nhập (canCuPhapLy) — KHÔNG hard-code điều kiện pháp lý.
 */

const FONT = 'Times New Roman'
const SIZE = 28 // 14pt (half-points) — cỡ chữ thân văn bản theo NĐ 30/2020
const RIGHT_TAB = 9000

function run(text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? SIZE, bold: opts.bold, italics: opts.italics })
}
function center(children: TextRun[], opts: { spacingAfter?: number } = {}) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: opts.spacingAfter ?? 0 }, children })
}
// Thể thức ngày tháng theo Nghị định 30/2020/NĐ-CP, Phụ lục I: số chỉ NGÀY nhỏ hơn 10
// và THÁNG 1, 2 phải ghi thêm số 0 ở trước. Tháng 3–12 giữ nguyên, KHÔNG thêm số 0.
const soNgay = (n: number) => (n < 10 ? `0${n}` : String(n))
const soThang = (n: number) => (n === 1 || n === 2 ? `0${n}` : String(n))

function fmtDmy(d?: Date | null): string {
  if (!d) return '…/…/……'
  return `${soNgay(d.getDate())}/${soThang(d.getMonth() + 1)}/${d.getFullYear()}`
}
function dateLine(d?: Date | null, diaDanh = 'Quảng Trị'): string {
  const dt = d ?? new Date()
  return `${diaDanh}, ngày ${soNgay(dt.getDate())} tháng ${soThang(dt.getMonth() + 1)} năm ${dt.getFullYear()}`
}

// subLines: các dòng phụ trong cùng một Điều, canh trái (không thụt đầu dòng) — vd
// "Chức vụ, đơn vị công tác:...", "Ngạch:...", "Từ bậc ... lên bậc ...".
type DieuItem = { label: string; runs: TextRun[]; subLines?: TextRun[][] }

type DecisionInput = {
  coQuanCapTren: string
  tenCoQuan: string
  soVanBan: string
  ngayVanBan?: Date | null
  diaDanh?: string
  tieuDePhu: string          // dòng dưới "QUYẾT ĐỊNH" (in đậm)
  thamQuyen: string          // vd "GIÁM ĐỐC SỞ XÂY DỰNG QUẢNG TRỊ"
  canCuPhapLy?: string | null
  theoDeNghi?: string
  dieu: DieuItem[]
  nguoiKyChucDanh?: string    // mặc định "GIÁM ĐỐC"
  nguoiKyHoTen?: string       // họ tên người ký (dưới chức danh); để trống nếu là dự thảo
  noiNhan?: string[]          // danh sách "Nơi nhận"; mặc định Như Điều 3 / Lãnh đạo Sở / Lưu VT, VP
}

async function decisionDocx(input: DecisionInput): Promise<Buffer> {
  const diaDanh = input.diaDanh || 'Quảng Trị'
  const nguoiKy = input.nguoiKyChucDanh || 'GIÁM ĐỐC'

  const heading: Paragraph[] = [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 0 },
      children: [
        run(input.coQuanCapTren || '', { size: 24 }),
        new TextRun({ text: '\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: FONT, size: 24, bold: true }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 0 },
      children: [
        run(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ', { bold: true, size: 24 }),
        new TextRun({ text: '\tĐộc lập - Tự do - Hạnh phúc', font: FONT, size: 26, bold: true }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 120 },
      children: [
        new TextRun({ text: '' }),
        new TextRun({ text: '\t', font: FONT }),
        new TextRun({ text: '_______________________', font: FONT, size: 24 }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 240 },
      children: [
        run(`Số: ${input.soVanBan}`, { size: 24 }),
        new TextRun({ text: `\t${dateLine(input.ngayVanBan, diaDanh)}`, font: FONT, size: 26, italics: true }),
      ],
    }),
  ]

  const canCuLines = (input.canCuPhapLy || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const canCuParas: Paragraph[] =
    canCuLines.length > 0
      ? canCuLines.map((line) => new Paragraph({
          alignment: AlignmentType.JUSTIFIED, spacing: { after: 40 },
          children: [run(/^căn cứ|^theo đề nghị/i.test(line) ? line : `Căn cứ ${line}`, { italics: true })],
        }))
      : [new Paragraph({
          alignment: AlignmentType.JUSTIFIED, spacing: { after: 40 },
          children: [run('Căn cứ ……………………………………………………………………… ;', { italics: true })],
        })]
  if (input.theoDeNghi) {
    canCuParas.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 240 },
      children: [run(input.theoDeNghi, { italics: true })],
    }))
  }

  const articles: Paragraph[] = []
  for (const d of input.dieu) {
    articles.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: d.subLines?.length ? 40 : 160 }, indent: { firstLine: 567 },
      children: [run(d.label, { bold: true }), ...d.runs],
    }))
    for (let i = 0; i < (d.subLines?.length ?? 0); i++) {
      const isLast = i === (d.subLines!.length - 1)
      articles.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED, spacing: { after: isLast ? 160 : 40 },
        children: d.subLines![i],
      }))
    }
  }

  // Nơi nhận: mặc định theo mẫu QĐ nâng lương của Sở
  const noiNhan = input.noiNhan && input.noiNhan.length > 0
    ? input.noiNhan
    : ['- Như Điều 3;', '- Lãnh đạo Sở;', '- Lưu: VT, VP.']

  const NN_TAB = 9000
  const signing: Paragraph[] = [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: NN_TAB }], spacing: { before: 200, after: 0 },
      children: [
        run('Nơi nhận:', { bold: true, italics: true, size: 22 }),
        new TextRun({ text: `\t${nguoiKy}`, font: FONT, size: SIZE, bold: true }),
      ],
    }),
    ...noiNhan.map((line) => new Paragraph({ spacing: { after: 0 }, children: [run(line, { size: 22 })] })),
    // Khoảng trống cho chữ ký + dấu, rồi họ tên người ký (canh giữa cột phải)
    new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER, indent: { left: 5000 },
      children: [run(input.nguoiKyHoTen || '', { bold: true })] }),
  ]

  const doc = new Document({
    sections: [{
      // Lề theo Nghị định 30/2020/NĐ-CP: trên 20mm, dưới 20mm, trái 30mm, phải 15mm (1mm ≈ 56.69 twips)
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } } },
      children: [
        ...heading,
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
          spacing: { after: 120 }, children: [],
        }),
        center([run('QUYẾT ĐỊNH', { bold: true, size: 28 })], { spacingAfter: 60 }),
        center([run(input.tieuDePhu, { bold: true })], { spacingAfter: 240 }),
        center([run(input.thamQuyen, { bold: true })], { spacingAfter: 120 }),
        ...canCuParas,
        center([run('QUYẾT ĐỊNH:', { bold: true })], { spacingAfter: 200 }),
        ...articles,
        ...signing,
      ],
    }],
  })
  return Buffer.from(await Packer.toBuffer(doc))
}

const DIEU_THI_HANH = (doiTuong: string) =>
  `Chánh Văn phòng Sở; Trưởng các phòng, đơn vị có liên quan và ${doiTuong} chịu trách nhiệm thi hành Quyết định này./.`

// Căn cứ pháp lý MẶC ĐỊNH theo mẫu QĐ nâng bậc lương thường xuyên của Sở Xây dựng QT.
// Là văn bản dự thảo — Văn phòng Sở rà soát, cập nhật số/ngày văn bản trước khi trình ký.
const CAN_CU_NANG_BAC_LUONG = [
  'Căn cứ Nghị định số 204/2004/NĐ-CP ngày 14/12/2004 của Chính phủ về chế độ tiền lương đối với cán bộ, công chức, viên chức và lực lượng vũ trang;',
  'Căn cứ Nghị định số 170/2025/NĐ-CP ngày 30/6/2025 của Chính phủ quy định về tuyển dụng, sử dụng và quản lý công chức;',
  'Căn cứ Thông tư số 08/2013/TT-BNV ngày 31/7/2013 của Bộ Nội vụ hướng dẫn thực hiện chế độ nâng bậc lương thường xuyên và nâng bậc lương trước thời hạn đối với cán bộ, công chức, viên chức và người lao động; Thông tư số 03/2021/TT-BNV ngày 29/6/2021 của Bộ Nội vụ về việc sửa đổi, bổ sung chế độ nâng bậc lương thường xuyên, nâng bậc lương trước thời hạn và chế độ phụ cấp thâm niên vượt khung đối với cán bộ, công chức, viên chức và người lao động;',
  'Căn cứ Quy định số 306-QĐ/TU ngày 05/01/2026 về phân cấp thẩm quyền quyết định lương đối với cán bộ, công chức, viên chức tỉnh Quảng Trị;',
  'Căn cứ Quyết định số 07/2025/QĐ-UBND ngày 18/8/2025 của UBND tỉnh Quảng Trị ban hành quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Sở Xây dựng tỉnh Quảng Trị;',
].join('\n')

const CAN_CU_VUOT_KHUNG = [
  'Căn cứ Nghị định số 204/2004/NĐ-CP ngày 14/12/2004 của Chính phủ về chế độ tiền lương đối với cán bộ, công chức, viên chức và lực lượng vũ trang;',
  'Căn cứ Thông tư số 04/2005/TT-BNV ngày 05/01/2005 của Bộ Nội vụ hướng dẫn thực hiện chế độ phụ cấp thâm niên vượt khung đối với cán bộ, công chức, viên chức; Thông tư số 03/2021/TT-BNV ngày 29/6/2021 của Bộ Nội vụ sửa đổi chế độ nâng bậc lương thường xuyên, nâng bậc lương trước thời hạn và chế độ phụ cấp thâm niên vượt khung đối với cán bộ, công chức, viên chức và người lao động;',
  'Căn cứ Quy định số 306-QĐ/TU ngày 05/01/2026 của Tỉnh ủy Quảng Trị về phân cấp thẩm quyền quyết định lương đối với cán bộ, công chức, viên chức tỉnh Quảng Trị;',
  'Căn cứ Quyết định số 07/2025/QĐ-UBND ngày 18/8/2025 của UBND tỉnh Quảng Trị ban hành Quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Sở Xây dựng tỉnh Quảng Trị;',
].join('\n')

const PLACEHOLDER = '…………'

// ───────────────────────── Quyết định nâng lương ─────────────────────────
export type SalaryDecisionInput = {
  soQuyetDinh: string
  ngayQuyetDinh?: Date | null
  loaiLabel: string
  hoTen: string
  chucDanh: string         // chức vụ, đơn vị công tác (vd "Chuyên viên phòng ...")
  donVi: string
  ngach?: string | null    // vd "Chuyên viên chính"
  maNgach?: string | null  // vd "01.002"
  bacCu?: number | null
  heSoCu?: number | null
  bacMoi?: number | null
  heSoMoi?: number | null
  ngayHuong?: Date | null
  canCuPhapLy?: string | null   // để trống = dùng căn cứ mẫu nâng bậc lương
  coQuanCapTren: string
  tenCoQuan: string
  diaDanh?: string
  nguoiKyHoTen?: string
}

export function buildSalaryDecisionDocx(input: SalaryDecisionInput): Promise<Buffer> {
  const loai = (input.loaiLabel || 'thường xuyên').trim()
  const chucVuDonVi = [input.chucDanh, input.donVi].filter(Boolean).join(', ')
  const bacCu = input.bacCu != null ? String(input.bacCu) : PLACEHOLDER
  const heSoCu = input.heSoCu != null ? fmtSo(input.heSoCu) : PLACEHOLDER
  const bacMoi = input.bacMoi != null ? String(input.bacMoi) : PLACEHOLDER
  const heSoMoi = input.heSoMoi != null ? fmtSo(input.heSoMoi) : PLACEHOLDER

  return decisionDocx({
    coQuanCapTren: input.coQuanCapTren,
    tenCoQuan: input.tenCoQuan,
    soVanBan: input.soQuyetDinh,
    ngayVanBan: input.ngayQuyetDinh,
    diaDanh: input.diaDanh,
    tieuDePhu: `Nâng bậc lương ${loai} đối với công chức`,
    thamQuyen: `GIÁM ĐỐC ${(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ').toUpperCase()}`,
    canCuPhapLy: input.canCuPhapLy || CAN_CU_NANG_BAC_LUONG,
    theoDeNghi: 'Theo đề nghị của Chánh Văn phòng Sở.',
    nguoiKyHoTen: input.nguoiKyHoTen,
    dieu: [
      {
        label: 'Điều 1. ',
        runs: [
          run(`Nâng bậc lương ${loai} đối với ông/bà `),
          run(input.hoTen, { bold: true }),
          run('.'),
        ],
        subLines: [
          [run(`Chức vụ, đơn vị công tác: ${chucVuDonVi || PLACEHOLDER}.`)],
          [run(`Ngạch: ${input.ngach || PLACEHOLDER}; Mã số: ${input.maNgach || PLACEHOLDER};`)],
          [run(`Từ bậc ${bacCu}, hệ số ${heSoCu} lên bậc ${bacMoi}, hệ số `), run(heSoMoi, { bold: true }), run('.')],
        ],
      },
      { label: 'Điều 2. ', runs: [run(`Lương mới được hưởng và thời gian tính nâng bậc lương lần sau kể từ ngày ${fmtDmy(input.ngayHuong)}.`)] },
      { label: 'Điều 3. ', runs: [run(DIEU_THI_HANH(`ông/bà ${input.hoTen}`))] },
    ],
  })
}

export type VuotKhungDecisionInput = {
  soQuyetDinh: string
  ngayQuyetDinh?: Date | null
  hoTen: string
  chucDanh: string
  donVi: string
  ngach?: string | null
  maNgach?: string | null
  bac?: number | null
  heSo?: number | null
  phuCapCu?: number | null   // % vượt khung hiện tại
  phuCapMoi?: number | null  // % vượt khung mới
  ngayHuong?: Date | null
  canCuPhapLy?: string | null
  coQuanCapTren: string
  tenCoQuan: string
  diaDanh?: string
  nguoiKyHoTen?: string
}

export function buildVuotKhungDecisionDocx(input: VuotKhungDecisionInput): Promise<Buffer> {
  const chucVuDonVi = [input.chucDanh, input.donVi].filter(Boolean).join(', ')
  const bac = input.bac != null ? String(input.bac) : PLACEHOLDER
  const heSo = input.heSo != null ? fmtSo(input.heSo) : PLACEHOLDER
  const pcCu = input.phuCapCu != null ? `${input.phuCapCu}%` : PLACEHOLDER
  const pcMoi = input.phuCapMoi != null ? `${input.phuCapMoi}%` : PLACEHOLDER

  return decisionDocx({
    coQuanCapTren: input.coQuanCapTren,
    tenCoQuan: input.tenCoQuan,
    soVanBan: input.soQuyetDinh,
    ngayVanBan: input.ngayQuyetDinh,
    diaDanh: input.diaDanh,
    tieuDePhu: 'Về việc nâng phụ cấp thâm niên vượt khung đối với công chức',
    thamQuyen: `GIÁM ĐỐC ${(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ').toUpperCase()}`,
    canCuPhapLy: input.canCuPhapLy || CAN_CU_VUOT_KHUNG,
    theoDeNghi: 'Theo đề nghị của Chánh Văn phòng Sở Xây dựng.',
    nguoiKyHoTen: input.nguoiKyHoTen,
    noiNhan: ['- Như Điều 3;', '- Lãnh đạo Sở;', '- Phòng KH-TC;', '- Lưu: VT, VP.'],
    dieu: [
      {
        label: 'Điều 1. ',
        runs: [run('Nâng phụ cấp thâm niên vượt khung đối với ông/bà '), run(input.hoTen, { bold: true }), run(';')],
        subLines: [
          [run(`Chức vụ, đơn vị công tác: ${chucVuDonVi || PLACEHOLDER};`)],
          [run(`Ngạch: ${input.ngach || PLACEHOLDER}; Mã số: ${input.maNgach || PLACEHOLDER}; Bậc: ${bac} Hệ số: ${heSo}`)],
          [run(`Nâng phụ cấp thâm niên vượt khung từ ${pcCu} lên ${pcMoi}.`)],
        ],
      },
      { label: 'Điều 2. ', runs: [run(`Mức phụ cấp thâm niên vượt khung mới được hưởng và thời điểm tính nâng phụ cấp thâm niên vượt khung lần sau kể từ ngày ${fmtDmy(input.ngayHuong)}.`)] },
      { label: 'Điều 3. ', runs: [run(DIEU_THI_HANH(`ông/bà ${input.hoTen}`))] },
    ],
  })
}

// ───────────────────────── Nghỉ hưu (Thông báo & Quyết định) ─────────────────────────
// Căn cứ pháp lý mặc định cho thủ tục nghỉ hưu công chức (NĐ 170/2025, NĐ 135/2020).
//
// ĐÃ SỬA CĂN CỨ (20/8/2026) — trước đây khối này viện dẫn NĐ 46/2010/NĐ-CP.
//   Xác minh từ chính văn bản gốc trong kho tài liệu của Sở (170_2025_ND-CP_663212.docx):
//   Điều 71 khoản 2 điểm b NĐ 170/2025/NĐ-CP ghi rõ NĐ 46/2010 HẾT HIỆU LỰC kể từ ngày
//   NĐ 170/2025 có hiệu lực (01/7/2025). Nay dùng NĐ 170/2025 làm căn cứ.
//
//   ĐÃ ĐỐI CHIẾU MẪU (20/8/2026): hai khối căn cứ dưới đây chép theo đúng MẪU SỐ 2
//   (Thông báo nghỉ hưu — Điều 62) và MẪU SỐ 3 (Quyết định nghỉ hưu — Điều 63) ban
//   hành kèm NĐ 170/2025, trích từ bản gốc 170_2025_ND-CP_663212.docx trong kho.
//   LƯU Ý HAI MẪU KHÁC NHAU: Mẫu số 2 có "Căn cứ Bộ luật Lao động" và "Căn cứ hồ sơ
//   công chức và hồ sơ bảo hiểm xã hội"; Mẫu số 3 KHÔNG có hai căn cứ này mà thay
//   bằng "Xét đề nghị của …". Không gộp chung.
//
//   Quyết định 07/2025/QĐ-UBND là căn cứ thẩm quyền riêng của Sở (không có trong mẫu,
//   nhưng cần để xác lập thẩm quyền ký của Giám đốc Sở) — giữ ở cuối khối.
//   Ngày tháng trong phần căn cứ VIẾT ĐẦY ĐỦ ("ngày 29 tháng 6 năm 2024") đúng như
//   bản gốc hai mẫu, không viết tắt 29/6/2024.
const CAN_CU_CHUNG_NGHI_HUU = [
  'Căn cứ Luật Bảo hiểm xã hội ngày 29 tháng 6 năm 2024;',
  'Căn cứ Luật Cán bộ, công chức ngày 24 tháng 6 năm 2025;',
  'Căn cứ Nghị định số 135/2020/NĐ-CP ngày 18 tháng 11 năm 2020 của Chính phủ quy định về tuổi nghỉ hưu;',
  'Căn cứ Nghị định số 170/2025/NĐ-CP ngày 30 tháng 6 năm 2025 của Chính phủ quy định về tuyển dụng, sử dụng và quản lý công chức;',
  'Căn cứ Quyết định số 07/2025/QĐ-UBND ngày 18 tháng 8 năm 2025 của UBND tỉnh Quảng Trị ban hành quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Sở Xây dựng tỉnh Quảng Trị;',
]

// MẪU SỐ 2 — Thông báo nghỉ hưu: CÓ thêm "Căn cứ Bộ luật Lao động"; căn cứ cuối ("hồ sơ công
// chức và hồ sơ bảo hiểm xã hội") KHÔNG đứng riêng mà nối liền vào câu dẫn thân bài.
// MẪU SỐ 3 — Quyết định nghỉ hưu: KHÔNG viện dẫn Bộ luật Lao động.
// Hai khối căn cứ này do canCuNghiHuu() dựng theo đối tượng (xem ngay bên dưới).

// VIÊN CHỨC do văn bản KHÁC điều chỉnh: Luật Viên chức số 129/2025/QH15 (hiệu lực 01/7/2026)
// và Nghị định 259/2026/NĐ-CP Điều 54 (bản .docx trong kho: 259_2026_ND-CP_713417.docx).
// Dùng khối căn cứ của công chức cho viên chức là viện dẫn SAI trong văn bản trình ký.
// NĐ 259/2026 không ban hành mẫu thông báo/quyết định nghỉ hưu (chỉ có Mẫu số 01–04 về tuyển
// dụng và hợp đồng làm việc) nên giữ bố cục theo thể thức NĐ 30/2020, chỉ thay khối căn cứ.
const CAN_CU_CHUNG_NGHI_HUU_VC = [
  'Căn cứ Luật Bảo hiểm xã hội ngày 29 tháng 6 năm 2024;',
  'Căn cứ Luật Viên chức ngày 10 tháng 12 năm 2025;',
  'Căn cứ Nghị định số 135/2020/NĐ-CP ngày 18 tháng 11 năm 2020 của Chính phủ quy định về tuổi nghỉ hưu;',
  'Căn cứ Nghị định số 259/2026/NĐ-CP ngày 30 tháng 6 năm 2026 của Chính phủ quy định về tuyển dụng, sử dụng và quản lý viên chức;',
  'Căn cứ Quyết định số 07/2025/QĐ-UBND ngày 18 tháng 8 năm 2025 của UBND tỉnh Quảng Trị ban hành quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Sở Xây dựng tỉnh Quảng Trị;',
]

/**
 * Khối căn cứ ĐÚNG THEO ĐỐI TƯỢNG.
 * Viên chức không do NĐ 170/2025 điều chỉnh — viện dẫn nhầm là sai căn cứ trong văn bản
 * trình ký. Xem CAN_CU_CHUNG_NGHI_HUU_VC ở trên.
 */
export function canCuNghiHuu(loai: 'tb' | 'qd', doiTuong?: string | null): string {
  const chung = doiTuong === 'VIEN_CHUC' ? CAN_CU_CHUNG_NGHI_HUU_VC : CAN_CU_CHUNG_NGHI_HUU
  return loai === 'tb'
    ? ['Căn cứ Bộ luật Lao động ngày 20 tháng 11 năm 2019;', ...chung].join('\n')
    : chung.join('\n')
}

export type RetirementInput = {
  /** CONG_CHUC | VIEN_CHUC — quyết định khối căn cứ và cách gọi đối tượng trong văn bản. */
  doiTuong?: string | null
  soVanBan: string
  ngayVanBan?: Date | null
  hoTen: string
  ngaySinh?: Date | null
  chucDanh: string
  donVi: string
  ngach?: string | null
  maNgach?: string | null
  bac?: number | null
  heSo?: number | null
  ngayNghiHuu?: Date | null    // ngày ghi trong hai mẫu = THỜI ĐIỂM HƯỞNG CHẾ ĐỘ HƯU TRÍ
                               // (NĐ 135/2020 Điều 3 khoản 2 — ngày 01 tháng liền kề), khớp câu
                               // "được nghỉ hưu để hưởng chế độ bảo hiểm xã hội từ ngày…" của Mẫu 2/3.
  canCuPhapLy?: string | null
  coQuanCapTren: string
  tenCoQuan: string
  diaDanh?: string
  nguoiKyHoTen?: string
  // Các trường MẪU SỐ 3 (Điều 1) bắt buộc phải có. Thiếu thì in PLACEHOLDER để
  // người soạn thấy ngay chỗ trống, KHÔNG tự suy đoán.
  soSoBHXH?: string | null
  noiSinh?: string | null
  noiCuTruSauNghiHuu?: string | null
  baoHiemKhuVuc?: string | null   // "Bảo hiểm xã hội khu vực …" giải quyết chế độ
}


// THÔNG BÁO nghỉ hưu — trước 06 tháng (NĐ 170/2025, Điều 62; theo MẪU SỐ 2).
export async function buildRetirementNoticeDocx(input: RetirementInput): Promise<Buffer> {
  const diaDanh = input.diaDanh || 'Quảng Trị'

  const heading: Paragraph[] = [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 0 },
      children: [
        run(input.coQuanCapTren || '', { size: 24 }),
        new TextRun({ text: '\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', font: FONT, size: 24, bold: true }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 0 },
      children: [
        run(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ', { bold: true, size: 24 }),
        new TextRun({ text: '\tĐộc lập - Tự do - Hạnh phúc', font: FONT, size: 26, bold: true }),
      ],
    }),
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: RIGHT_TAB }], spacing: { after: 240 },
      children: [
        run(`Số: ${input.soVanBan}`, { size: 24 }),
        new TextRun({ text: `\t${dateLine(input.ngayVanBan, diaDanh)}`, font: FONT, size: 26, italics: true }),
      ],
    }),
  ]

  const canCuLines = (input.canCuPhapLy || canCuNghiHuu('tb', input.doiTuong)).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const canCuParas = canCuLines.map((line) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 40 },
    children: [run(/^căn cứ/i.test(line) ? line : `Căn cứ ${line}`, { italics: true })],
  }))

  // Thân bài chép đúng bố cục MẪU SỐ 2: câu dẫn có căn cứ hồ sơ nối liền, rồi TỪNG
  // DÒNG RIÊNG "Ông (bà)" / "Sinh ngày" / "Chức vụ" / "Đơn vị công tác" / "Kể từ ngày".
  // Mẫu KHÔNG có dòng ngạch/bậc/hệ số nên không đưa vào (giữ đúng mẫu ban hành).
  const body: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { before: 120, after: 120 }, indent: { firstLine: 567 },
      children: [run(`Căn cứ hồ sơ ${input.doiTuong === 'VIEN_CHUC' ? 'viên chức' : 'công chức'} và hồ sơ bảo hiểm xã hội, ${input.tenCoQuan || 'Sở Xây dựng Quảng Trị'} thông báo:`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 },
      children: [run('Ông (bà): '), run(input.hoTen, { bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 },
      children: [run(`Sinh ngày: ${fmtDmy(input.ngaySinh)}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 },
      children: [run(`Chức vụ: ${input.chucDanh || PLACEHOLDER}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 },
      children: [run(`Đơn vị công tác: ${input.donVi || PLACEHOLDER}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, indent: { firstLine: 567 },
      children: [
        run('Kể từ ngày '), run(fmtDmy(input.ngayNghiHuu), { bold: true }),
        run(' sẽ được nghỉ hưu để hưởng chế độ bảo hiểm xã hội theo quy định.'),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, indent: { firstLine: 567 },
      children: [run(`${input.tenCoQuan || 'Sở Xây dựng Quảng Trị'} thông báo để ông (bà) ${input.hoTen} được biết và thực hiện./.`)],
    }),
  ]

  const NN_TAB = 9000
  const signing: Paragraph[] = [
    new Paragraph({
      tabStops: [{ type: TabStopType.CENTER, position: NN_TAB }], spacing: { before: 200, after: 0 },
      children: [
        run('Nơi nhận:', { bold: true, italics: true, size: 22 }),
        new TextRun({ text: '\tGIÁM ĐỐC', font: FONT, size: SIZE, bold: true }),
      ],
    }),
    // Nơi nhận theo đúng MẪU SỐ 2 NĐ 170/2025.
    ...['- Như trên;', '- Lưu: VT, Hồ sơ công chức, TCCB.']
      .map((line) => new Paragraph({ spacing: { after: 0 }, children: [run(line, { size: 22 })] })),
    new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER, indent: { left: 5000 },
      children: [run(input.nguoiKyHoTen || '', { bold: true })] }),
  ]

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } } },
      children: [
        ...heading,
        center([run('THÔNG BÁO', { bold: true, size: 28 })], { spacingAfter: 60 }),
        center([run(`Về việc nghỉ hưu đối với ${input.doiTuong === 'VIEN_CHUC' ? 'viên chức' : 'công chức'}`, { bold: true })], { spacingAfter: 200 }),
        // "Kính gửi" — bắt buộc theo MẪU SỐ 2 (trước đây thiếu).
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 240 },
          children: [run('Kính gửi: Ông (bà) '), run(input.hoTen, { bold: true })],
        }),
        ...canCuParas,
        ...body,
        ...signing,
      ],
    }],
  })
  return Buffer.from(await Packer.toBuffer(doc))
}

// QUYẾT ĐỊNH nghỉ hưu — trước 03 tháng (NĐ 170/2025, Điều 63; theo MẪU SỐ 3).
export function buildRetirementDecisionDocx(input: RetirementInput): Promise<Buffer> {
  return decisionDocx({
    coQuanCapTren: input.coQuanCapTren,
    tenCoQuan: input.tenCoQuan,
    soVanBan: input.soVanBan,
    ngayVanBan: input.ngayVanBan,
    diaDanh: input.diaDanh,
    // MẪU SỐ 3 ghi tiêu đề phụ là "Về việc nghỉ hưu để hưởng chế độ bảo hiểm xã hội".
    tieuDePhu: 'Về việc nghỉ hưu để hưởng chế độ bảo hiểm xã hội',
    thamQuyen: `GIÁM ĐỐC ${(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ').toUpperCase()}`,
    canCuPhapLy: input.canCuPhapLy || canCuNghiHuu('qd', input.doiTuong),
    // (2) trong mẫu = "Người đứng đầu đơn vị phụ trách công tác tổ chức, cán bộ" → Chánh Văn phòng Sở.
    theoDeNghi: 'Xét đề nghị của Chánh Văn phòng Sở,',
    nguoiKyHoTen: input.nguoiKyHoTen,
    // Nơi nhận theo MẪU SỐ 3. Mẫu ghi "BHXH tỉnh (thành phố)…", nhưng chính Điều 2 của
    // mẫu đã dùng "Bảo hiểm khu vực" (từ 01/7/2025 BHXH tỉnh tổ chức lại thành khu vực)
    // nên thống nhất dùng "khu vực" và để trống tên khu vực cho người soạn điền.
    noiNhan: ['- Như Điều 3;', `- Bảo hiểm xã hội khu vực ${PLACEHOLDER};`, '- Lưu: VT, Hồ sơ công chức, TCCB.'],
    dieu: [
      {
        // Điều 1 chép đúng bố cục MẪU SỐ 3: họ tên + Số sổ BHXH trên cùng dòng, rồi
        // Sinh ngày / Nơi sinh / Chức vụ / Đơn vị công tác / Được nghỉ hưu / Nơi cư trú.
        // Mẫu KHÔNG có dòng ngạch, bậc, hệ số nên không đưa vào.
        label: 'Điều 1. ',
        runs: [
          run('Ông (bà) '), run(input.hoTen, { bold: true }),
          run(`  Số sổ BHXH: ${input.soSoBHXH || PLACEHOLDER}`),
        ],
        subLines: [
          [run(`Sinh ngày: ${fmtDmy(input.ngaySinh)}`)],
          [run(`Nơi sinh: ${input.noiSinh || PLACEHOLDER}`)],
          [run(`Chức vụ: ${input.chucDanh || PLACEHOLDER}`)],
          [run(`Đơn vị công tác: ${input.donVi || PLACEHOLDER}`)],
          [run('Được nghỉ hưu để hưởng chế độ bảo hiểm xã hội từ ngày '), run(fmtDmy(input.ngayNghiHuu), { bold: true })],
          [run(`Nơi cư trú sau khi nghỉ hưu: ${input.noiCuTruSauNghiHuu || PLACEHOLDER}`)],
        ],
      },
      {
        label: 'Điều 2. ',
        runs: [run(`Chế độ bảo hiểm xã hội đối với ông (bà) ${input.hoTen} do ${input.baoHiemKhuVuc || `Bảo hiểm khu vực ${PLACEHOLDER}`} trực thuộc Bảo hiểm xã hội Việt Nam giải quyết theo quy định của pháp luật bảo hiểm xã hội hiện hành.`)],
      },
      {
        label: 'Điều 3. ',
        runs: [run(`Thủ trưởng các cơ quan, đơn vị có liên quan và ông (bà) ${input.hoTen} chịu trách nhiệm thi hành quyết định này./.`)],
      },
    ],
  })
}

// ───────────────────────── Quyết định khen thưởng ─────────────────────────
export type RewardDecisionInput = {
  soQuyetDinh: string
  ngayQuyetDinh?: Date | null
  hoTen: string
  chucDanh: string
  donVi: string
  danhHieu: string
  capKhen?: string | null
  thanhTich?: string | null
  canCuPhapLy?: string | null
  coQuanCapTren: string
  tenCoQuan: string
  diaDanh?: string
}

export function buildRewardDecisionDocx(input: RewardDecisionInput): Promise<Buffer> {
  return decisionDocx({
    coQuanCapTren: input.coQuanCapTren,
    tenCoQuan: input.tenCoQuan,
    soVanBan: input.soQuyetDinh,
    ngayVanBan: input.ngayQuyetDinh,
    diaDanh: input.diaDanh,
    tieuDePhu: 'Về việc khen thưởng đối với công chức, viên chức',
    thamQuyen: `GIÁM ĐỐC ${(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ').toUpperCase()}`,
    canCuPhapLy: input.canCuPhapLy,
    theoDeNghi: 'Theo đề nghị của Hội đồng Thi đua – Khen thưởng và Chánh Văn phòng Sở.',
    dieu: [
      { label: 'Điều 1. ', runs: [
        run(`Tặng ${input.danhHieu}${input.capKhen ? ` (${input.capKhen})` : ''} cho ông/bà `),
        run(input.hoTen, { bold: true }),
        run(`, ${input.chucDanh}${input.donVi ? `, ${input.donVi}` : ''}${input.thanhTich ? `, vì đã có thành tích: ${input.thanhTich}` : ''}.`),
      ] },
      { label: 'Điều 2. ', runs: [run('Ông/bà có tên tại Điều 1 được hưởng các quyền lợi khen thưởng theo quy định hiện hành.')] },
      { label: 'Điều 3. ', runs: [run(DIEU_THI_HANH('ông/bà có tên tại Điều 1'))] },
    ],
  })
}

// ───────────────────────── Quyết định kỷ luật ─────────────────────────
export type DisciplineDecisionInput = {
  soQuyetDinh: string
  ngayQuyetDinh?: Date | null
  hoTen: string
  chucDanh: string
  donVi: string
  hinhThucLabel: string
  lyDo?: string | null
  tuNgay?: Date | null
  denNgay?: Date | null
  soThangKeoDaiNangLuong?: number | null
  canCuPhapLy?: string | null
  coQuanCapTren: string
  tenCoQuan: string
  diaDanh?: string
}

export function buildDisciplineDecisionDocx(input: DisciplineDecisionInput): Promise<Buffer> {
  const thoiGian = input.tuNgay
    ? ` Thời gian áp dụng: từ ${fmtDmy(input.tuNgay)}${input.denNgay ? ` đến ${fmtDmy(input.denNgay)}` : ''}.`
    : ''
  const keoDai = input.soThangKeoDaiNangLuong
    ? ` Kéo dài thời gian nâng bậc lương ${input.soThangKeoDaiNangLuong} tháng.`
    : ''
  return decisionDocx({
    coQuanCapTren: input.coQuanCapTren,
    tenCoQuan: input.tenCoQuan,
    soVanBan: input.soQuyetDinh,
    ngayVanBan: input.ngayQuyetDinh,
    diaDanh: input.diaDanh,
    tieuDePhu: 'Về việc thi hành kỷ luật đối với công chức, viên chức',
    thamQuyen: `GIÁM ĐỐC ${(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ').toUpperCase()}`,
    canCuPhapLy: input.canCuPhapLy,
    theoDeNghi: 'Theo đề nghị của Hội đồng kỷ luật và Chánh Văn phòng Sở.',
    dieu: [
      { label: 'Điều 1. ', runs: [
        run(`Thi hành kỷ luật bằng hình thức “${input.hinhThucLabel}” đối với ông/bà `),
        run(input.hoTen, { bold: true }),
        run(`, ${input.chucDanh}${input.donVi ? `, ${input.donVi}` : ''}.${input.lyDo ? ` Lý do: ${input.lyDo}.` : ''}${thoiGian}${keoDai}`),
      ] },
      { label: 'Điều 2. ', runs: [run('Quyết định này có hiệu lực kể từ ngày ký.')] },
      { label: 'Điều 3. ', runs: [run(DIEU_THI_HANH('ông/bà có tên tại Điều 1'))] },
    ],
  })
}
