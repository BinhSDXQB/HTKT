import 'server-only'
import {
  Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType, BorderStyle,
} from 'docx'

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
function fmtDmy(d?: Date | null): string {
  if (!d) return '…/…/……'
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
function dateLine(d?: Date | null, diaDanh = 'Quảng Trị'): string {
  const dt = d ?? new Date()
  return `${diaDanh}, ngày ${dt.getDate()} tháng ${dt.getMonth() + 1} năm ${dt.getFullYear()}`
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
  const heSoCu = input.heSoCu != null ? String(input.heSoCu) : PLACEHOLDER
  const bacMoi = input.bacMoi != null ? String(input.bacMoi) : PLACEHOLDER
  const heSoMoi = input.heSoMoi != null ? String(input.heSoMoi) : PLACEHOLDER

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
  const heSo = input.heSo != null ? String(input.heSo) : PLACEHOLDER
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
// Căn cứ pháp lý mặc định cho thủ tục nghỉ hưu công chức (NĐ 46/2010, NĐ 135/2020).
//
// ĐÃ SỬA CĂN CỨ (20/8/2026) — trước đây khối này viện dẫn NĐ 46/2010/NĐ-CP.
//   Xác minh từ chính văn bản gốc trong kho tài liệu của Sở (170_2025_ND-CP_663212.docx):
//   Điều 71 khoản 2 điểm b NĐ 170/2025/NĐ-CP ghi rõ NĐ 46/2010 HẾT HIỆU LỰC kể từ ngày
//   NĐ 170/2025 có hiệu lực (01/7/2025). Nay dùng NĐ 170/2025 làm căn cứ.
//
//   ⚠️ VIỆC CÒN LẠI CỦA VĂN PHÒNG SỞ: NĐ 170/2025 ban hành kèm MẪU SỐ 2 (Thông báo
//   nghỉ hưu — Điều 62) và MẪU SỐ 3 (Quyết định nghỉ hưu — Điều 63). Cần đối chiếu
//   biểu mẫu hệ thống đang sinh với hai mẫu này. Các văn bản ĐÃ KÝ trước 20/8/2026
//   mang căn cứ NĐ 46/2010 — Văn phòng Sở xem xét có cần đính chính hay không.
const CAN_CU_NGHI_HUU = [
  'Căn cứ Bộ luật Lao động ngày 20/11/2019;',
  'Căn cứ Luật Bảo hiểm xã hội;',
  'Căn cứ Nghị định số 135/2020/NĐ-CP ngày 18/11/2020 của Chính phủ quy định về tuổi nghỉ hưu;',
  'Căn cứ Nghị định số 170/2025/NĐ-CP ngày 30/6/2025 của Chính phủ quy định về tuyển dụng, sử dụng và quản lý công chức;',
  'Căn cứ Quyết định số 07/2025/QĐ-UBND ngày 18/8/2025 của UBND tỉnh Quảng Trị ban hành quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Sở Xây dựng tỉnh Quảng Trị;',
].join('\n')

export type RetirementInput = {
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
  ngayNghiHuu?: Date | null    // thời điểm nghỉ hưu (NĐ 135/2020)
  canCuPhapLy?: string | null
  coQuanCapTren: string
  tenCoQuan: string
  diaDanh?: string
  nguoiKyHoTen?: string
}

function thongTinCongChuc(input: RetirementInput): string {
  const parts = [
    input.ngaySinh ? `sinh ngày ${fmtDmy(input.ngaySinh)}` : null,
    [input.chucDanh, input.donVi].filter(Boolean).join(', ') || null,
  ].filter(Boolean)
  return parts.join('; ')
}

// THÔNG BÁO nghỉ hưu — trước 6 tháng (NĐ 46/2010, Điều 9 khoản 3).
export async function buildRetirementNoticeDocx(input: RetirementInput): Promise<Buffer> {
  const diaDanh = input.diaDanh || 'Quảng Trị'
  const ngachLine = `Ngạch: ${input.ngach || PLACEHOLDER}; Mã số: ${input.maNgach || PLACEHOLDER}; Bậc: ${input.bac ?? PLACEHOLDER}; Hệ số: ${input.heSo ?? PLACEHOLDER}.`

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

  const canCuLines = (input.canCuPhapLy || CAN_CU_NGHI_HUU).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const canCuParas = canCuLines.map((line) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 40 },
    children: [run(/^căn cứ/i.test(line) ? line : `Căn cứ ${line}`, { italics: true })],
  }))

  const body: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { before: 120, after: 120 }, indent: { firstLine: 567 },
      children: [run(`${input.tenCoQuan || 'Sở Xây dựng Quảng Trị'} thông báo thời điểm nghỉ hưu đối với công chức như sau:`)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, indent: { firstLine: 567 },
      children: [run('Ông/bà: '), run(input.hoTen, { bold: true }), run(`, ${thongTinCongChuc(input)}.`)],
    }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, children: [run(ngachLine)] }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, indent: { firstLine: 567 },
      children: [run('Được nghỉ hưu để hưởng chế độ bảo hiểm xã hội kể từ ngày '), run(fmtDmy(input.ngayNghiHuu), { bold: true }), run('.')],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, indent: { firstLine: 567 },
      children: [run('Đề nghị công chức có tên trên và đơn vị quản lý chuẩn bị người thay thế, tổ chức bàn giao công việc, hồ sơ, tài liệu, tài sản (nếu có) theo quy định; hoàn thiện hồ sơ để cơ quan ban hành Quyết định nghỉ hưu trước 03 tháng tính đến thời điểm nghỉ hưu.')],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, indent: { firstLine: 567 },
      children: [run(`${input.tenCoQuan || 'Sở Xây dựng Quảng Trị'} thông báo để công chức và các đơn vị liên quan biết, thực hiện./.`)],
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
    ...['- Công chức có tên trên;', '- Lãnh đạo Sở;', '- Đơn vị quản lý;', '- BHXH tỉnh;', '- Lưu: VT, VP.']
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
        center([run('Về việc nghỉ hưu đối với công chức', { bold: true })], { spacingAfter: 200 }),
        ...canCuParas,
        ...body,
        ...signing,
      ],
    }],
  })
  return Buffer.from(await Packer.toBuffer(doc))
}

// QUYẾT ĐỊNH nghỉ hưu — trước 3 tháng (NĐ 46/2010, Điều 9 khoản 4).
export function buildRetirementDecisionDocx(input: RetirementInput): Promise<Buffer> {
  const chucVuDonVi = [input.chucDanh, input.donVi].filter(Boolean).join(', ')
  return decisionDocx({
    coQuanCapTren: input.coQuanCapTren,
    tenCoQuan: input.tenCoQuan,
    soVanBan: input.soVanBan,
    ngayVanBan: input.ngayVanBan,
    diaDanh: input.diaDanh,
    tieuDePhu: 'Về việc nghỉ hưu đối với công chức',
    thamQuyen: `GIÁM ĐỐC ${(input.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ').toUpperCase()}`,
    canCuPhapLy: input.canCuPhapLy || CAN_CU_NGHI_HUU,
    theoDeNghi: 'Theo đề nghị của Chánh Văn phòng Sở.',
    nguoiKyHoTen: input.nguoiKyHoTen,
    noiNhan: ['- Như Điều 3;', '- Lãnh đạo Sở;', '- BHXH tỉnh;', '- Phòng KH-TC;', '- Lưu: VT, VP.'],
    dieu: [
      {
        label: 'Điều 1. ',
        runs: [
          run('Ông/bà '), run(input.hoTen, { bold: true }),
          run(`${input.ngaySinh ? `, sinh ngày ${fmtDmy(input.ngaySinh)}` : ''} được nghỉ hưu để hưởng chế độ bảo hiểm xã hội kể từ ngày `),
          run(fmtDmy(input.ngayNghiHuu), { bold: true }), run('.'),
        ],
        subLines: [
          [run(`Chức vụ, đơn vị công tác trước khi nghỉ hưu: ${chucVuDonVi || PLACEHOLDER}.`)],
          [run(`Ngạch: ${input.ngach || PLACEHOLDER}; Mã số: ${input.maNgach || PLACEHOLDER}; Bậc: ${input.bac ?? PLACEHOLDER}; Hệ số: ${input.heSo ?? PLACEHOLDER}.`)],
        ],
      },
      { label: 'Điều 2. ', runs: [run('Ông/bà có tên tại Điều 1 được hưởng chế độ hưu trí theo quy định của pháp luật về bảo hiểm xã hội; bàn giao công việc, hồ sơ, tài liệu, tài sản (nếu có) trước thời điểm nghỉ hưu.')] },
      { label: 'Điều 3. ', runs: [run(DIEU_THI_HANH(`ông/bà ${input.hoTen}`))] },
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
