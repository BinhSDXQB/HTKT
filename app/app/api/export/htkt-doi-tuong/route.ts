import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireAuth } from '@/lib/auth'
import { quyenTrenXa, danhSachDoiTuong, daiSoHieu, canhBao, type DoiTuongDong } from '@/lib/htkt-doi-tuong/truy-van'
import { LINH_VUC, CAP_DUONG, PHAN_LOAI_DO_THI, SH_TRANG_THAI, TINH_TRANG, type TruongDef } from '@/lib/htkt-doi-tuong/danh-muc'

// Xuất hồ sơ đối tượng HTKT của một xã/phường ra Excel để lưu trữ:
//   Tổng hợp · Mẫu 04 (đường xã, thôn, gom) · Mẫu 03 (đường đô thị) · Mẫu 02 (đường huyện cũ → đường xã)
//   theo Phụ lục QĐ 56/2025/QĐ-UBND · một sheet cho mỗi lĩnh vực HTKT · Dải số hiệu (Đ5) · Cảnh báo dữ liệu.
// Mã đối tượng (<mã xã>-<LV>-<NNNN>) có ở mọi sheet để đối chiếu ngược về CSDL.

const VIEN = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } as const
const km = (m: number | null) => (m === null ? null : Math.round(m) / 1000)
const nhanCap = (v: string | null) => CAP_DUONG.find((c) => c.value === v)?.label ?? v ?? ''
const nhanTT = (v: string | null) => TINH_TRANG.find((c) => c.value === v)?.label ?? v ?? ''

function tieuDe(ws: ExcelJS.Worksheet, soCot: number, dong1: string, dong2: string, dong3?: string) {
  const cuoi = ws.getColumn(soCot).letter
  ws.mergeCells(`A1:${cuoi}1`); ws.getCell('A1').value = dong1
  ws.getCell('A1').font = { bold: true, size: 13 }; ws.getCell('A1').alignment = { horizontal: 'center' }
  ws.mergeCells(`A2:${cuoi}2`); ws.getCell('A2').value = dong2
  ws.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF475569' } }; ws.getCell('A2').alignment = { horizontal: 'center', wrapText: true }
  if (dong3) {
    ws.mergeCells(`A3:${cuoi}3`); ws.getCell('A3').value = dong3
    ws.getCell('A3').font = { italic: true, size: 9, color: { argb: 'FF64748B' } }; ws.getCell('A3').alignment = { horizontal: 'center', wrapText: true }
  }
  ws.addRow([])
}

function hangTieuDe(ws: ExcelJS.Worksheet, cols: string[], widths: number[]) {
  const r = ws.addRow(cols)
  r.height = 32
  r.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border = VIEN
  })
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w })
  ws.views = [{ state: 'frozen', ySplit: r.number }]
}

function hang(ws: ExcelJS.Worksheet, vals: unknown[], nhom = false) {
  const r = ws.addRow(vals)
  r.eachCell({ includeEmpty: true }, (c) => {
    c.border = VIEN
    c.alignment = { vertical: 'middle', wrapText: true }
    if (typeof c.value === 'number' && !Number.isInteger(c.value)) c.numFmt = '#,##0.0##'
    if (nhom) { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } }
  })
  return r
}

const ghiChuDuong = (d: DoiTuongDong) => [
  d.shTrangThai ? `${SH_TRANG_THAI.find((s) => s.value === d.shTrangThai)?.label}${d.shSoQd ? ` – QĐ ${d.shSoQd}${d.shNgayQd ? ` ngày ${d.shNgayQd.split('-').reverse().join('/')}` : ''}` : ''}` : '',
  d.thon ? `Thôn: ${d.thon}` : '', d.tuyenSoHieu || d.tuyenTen ? `Nhánh của ${d.tuyenSoHieu ?? d.tuyenTen}` : '',
  d.ghiChu ?? '', `Mã: ${d.maDoiTuong}`,
].filter(Boolean).join('; ')

const beRong = (d: DoiTuongDong) => (d.beRongNenM !== null || d.beRongMatM !== null ? `${d.beRongNenM ?? '–'}/${d.beRongMatM ?? '–'}` : '')

function giaTriTruong(d: DoiTuongDong, tr: TruongDef): unknown {
  const raw = tr.key.startsWith('ts.') ? d.thongSo[tr.key.slice(3)] : ({
    diem_dau: d.diemDau, diem_cuoi: d.diemCuoi, vi_tri: d.viTri, chieu_dai_m: d.chieuDaiM, be_rong_nen_m: d.beRongNenM,
    be_rong_mat_m: d.beRongMatM, ket_cau_mat: d.ketCauMat, dien_tich_m2: d.dienTichM2, so_luong: d.soLuong,
    nam_su_dung: d.namSuDung, tinh_trang: d.tinhTrang, don_vi_quan_ly: d.donViQuanLy, de_xuat_dieu_chinh: d.deXuatDieuChinh,
  } as Record<string, unknown>)[tr.key]
  if (raw === null || raw === undefined || raw === '') return ''
  if (tr.kind === 'boolean') return raw === true ? 'Có' : raw === false ? 'Không' : ''
  if (tr.key === 'tinh_trang') return nhanTT(String(raw))
  if (typeof raw === 'number' && tr.heSo) return Math.round((raw / tr.heSo) * 1000) / 1000
  return raw
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const maXa = req.nextUrl.searchParams.get('maXa') ?? ''
    const q = await quyenTrenXa(user, maXa)
    if (!q) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const ds = await danhSachDoiTuong(maXa)
    const dai = await daiSoHieu(maXa)
    const ngay = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    const coQuan = `UBND ${q.xa.name.toUpperCase()}`
    const duong = ds.filter((d) => d.linhVuc === 'DUONG')

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Sở Xây dựng Quảng Trị — Hệ thống QL HTKT'
    wb.created = new Date()

    // ── Tổng hợp ──
    const th = wb.addWorksheet('Tổng hợp')
    tieuDe(th, 8, `${coQuan} — HỒ SƠ ĐỐI TƯỢNG HẠ TẦNG KỸ THUẬT`, `Mã ĐVHC ${q.xa.code} · Xuất ngày ${ngay} · ${ds.length} đối tượng`,
      'Nguồn: bảng trung tâm htkt_doi_tuong (mã định danh <mã xã>-<lĩnh vực>-<số>); số hiệu đường theo Điều 5 QĐ 56/2025/QĐ-UBND')
    hangTieuDe(th, ['Lĩnh vực', 'Số đối tượng', 'Tổng chiều dài khai báo (km)', 'Tổng chiều dài đo GIS (km)', 'Tổng diện tích (m²)', 'Tổng số lượng', 'Có bản đồ GIS', 'Có số hiệu'],
      [32, 14, 18, 18, 16, 14, 14, 12])
    for (const lv of LINH_VUC) {
      const x = ds.filter((d) => d.linhVuc === lv.value)
      if (!x.length) continue
      const tong = (f: (d: DoiTuongDong) => number | null) => x.reduce((s, d) => s + (f(d) ?? 0), 0)
      hang(th, [lv.label, x.length, km(tong((d) => d.chieuDaiM)) || '', km(tong((d) => d.chieuDaiGisM)) || '',
        tong((d) => d.dienTichM2) || '', tong((d) => d.soLuong) || '', x.filter((d) => d.coGis).length, x.filter((d) => d.soHieu).length])
    }

    // ── Mẫu 04: đường xã, thôn, gom ──
    const m4 = wb.addWorksheet('Mẫu 04')
    tieuDe(m4, 9, 'Mẫu số 04: Danh mục đường xã, đường thôn; đường gom, đường bên tách khỏi quốc lộ',
      `${coQuan} — Phụ lục QĐ 56/2025/QĐ-UBND · Báo cáo UBND tỉnh trước ngày 30/5 hằng năm (Đ4 k3)`)
    hangTieuDe(m4, ['TT', 'Tên', 'Số hiệu', 'Điểm đầu', 'Điểm cuối', 'Chiều dài (Km)', 'Bề rộng Nền/mặt (m)', 'Kết cấu mặt', 'Ghi chú'],
      [6, 30, 12, 24, 24, 12, 14, 16, 44])
    const nhom4: [string, string, string][] = [['I', 'Đường xã', 'DUONG_XA'], ['II', 'Đường thôn', 'DUONG_THON'], ['III', 'Đường gom, đường bên tách khỏi quốc lộ', 'DUONG_GOM']]
    for (const [so, ten, cap] of nhom4) {
      const x = duong.filter((d) => d.capDuong === cap)
      hang(m4, [so, ten, '', '', '', km(x.reduce((s, d) => s + (d.chieuDaiM ?? 0), 0)) || '', '', '', `${x.length} tuyến`], true)
      x.forEach((d, i) => hang(m4, [i + 1, d.ten ?? '', d.soHieu ?? d.soHieuKhac ?? '', d.diemDau ?? '', d.diemCuoi ?? '', km(d.chieuDaiM) ?? '', beRong(d), d.ketCauMat ?? '', ghiChuDuong(d)]))
    }

    // ── Mẫu 03: đường đô thị ──
    const dt = duong.filter((d) => d.capDuong === 'DUONG_DO_THI')
    if (dt.length || q.xa.laPhuong) {
      const m3 = wb.addWorksheet('Mẫu 03')
      tieuDe(m3, 9, 'Mẫu số 03: Danh mục đường đô thị', `${coQuan} — Phụ lục QĐ 56/2025/QĐ-UBND`)
      hangTieuDe(m3, ['TT', 'Tên', 'Số hiệu', 'Điểm đầu', 'Điểm cuối', 'Chiều dài (Km)', 'Bề rộng Nền/mặt (m)', 'Kết cấu mặt', 'Ghi chú'],
        [6, 30, 12, 24, 24, 12, 14, 16, 40])
      for (const [nhom, tenNhom] of [['A', 'Đường cấp đô thị'], ['B', 'Đường cấp khu vực']] as const) {
        hang(m3, [nhom, tenNhom, '', '', '', '', '', '', ''], true)
        PHAN_LOAI_DO_THI.filter((p) => p.nhom === nhom).forEach((p, k) => {
          const x = dt.filter((d) => d.phanLoaiDoThi === p.value)
          hang(m3, [['I', 'II', 'III'][k], p.label, '', '', '', km(x.reduce((s, d) => s + (d.chieuDaiM ?? 0), 0)) || '', '', '', `${x.length} tuyến`], true)
          x.forEach((d, i) => hang(m3, [i + 1, d.ten ?? '', d.soHieuHienThi ?? '', d.diemDau ?? '', d.diemCuoi ?? '', km(d.chieuDaiM) ?? '', beRong(d), d.ketCauMat ?? '', ghiChuDuong(d)]))
        })
      }
      const chuaNhom = dt.filter((d) => !d.phanLoaiDoThi)
      if (chuaNhom.length) {
        hang(m3, ['', 'Chưa phân nhóm (cần xác định)', '', '', '', '', '', '', `${chuaNhom.length} tuyến`], true)
        chuaNhom.forEach((d, i) => hang(m3, [i + 1, d.ten ?? '', d.soHieuHienThi ?? '', d.diemDau ?? '', d.diemCuoi ?? '', km(d.chieuDaiM) ?? '', beRong(d), d.ketCauMat ?? '', ghiChuDuong(d)]))
      }
    }

    // ── Mẫu 02: đường huyện cũ → đường xã ──
    const cu = duong.filter((d) => d.soHieuCu || d.tenCu)
    if (cu.length) {
      const m2 = wb.addWorksheet('Mẫu 02')
      tieuDe(m2, 10, 'Mẫu số 02: Danh mục đề xuất điều chỉnh đường huyện có trước ngày 01/7/2025 thành đường xã', `${coQuan} — Đ4 k2 QĐ 56/2025/QĐ-UBND`)
      hangTieuDe(m2, ['TT', 'Tên đường huyện', 'Số hiệu đường huyện', 'Điểm đầu', 'Điểm cuối', 'Chiều dài (Km)', 'Bề rộng Nền/mặt (m)', 'Kết cấu mặt', 'Tên đường xã', 'Số hiệu đường xã'],
        [6, 26, 14, 22, 22, 12, 14, 14, 26, 14])
      cu.forEach((d, i) => hang(m2, [i + 1, d.tenCu ?? '', d.soHieuCu ?? '', d.diemDau ?? '', d.diemCuoi ?? '', km(d.chieuDaiM) ?? '', beRong(d), d.ketCauMat ?? '', d.ten ?? '', d.soHieu ?? '']))
    }

    // ── Đường khác (QL/ĐT tham chiếu, chưa phân cấp) ──
    const khac = duong.filter((d) => !['DUONG_XA', 'DUONG_THON', 'DUONG_GOM', 'DUONG_DO_THI'].includes(d.capDuong ?? ''))
    if (khac.length) {
      const wk = wb.addWorksheet('Đường khác')
      tieuDe(wk, 9, 'Đường chưa phân cấp / quốc lộ, đường tỉnh qua địa bàn (tham chiếu)', coQuan)
      hangTieuDe(wk, ['TT', 'Mã đối tượng', 'Tên', 'Cấp', 'Số hiệu', 'Điểm đầu', 'Điểm cuối', 'Chiều dài (Km)', 'Ghi chú'], [6, 18, 30, 26, 12, 22, 22, 12, 30])
      khac.forEach((d, i) => hang(wk, [i + 1, d.maDoiTuong, d.ten ?? '', nhanCap(d.capDuong), d.soHieuHienThi ?? '', d.diemDau ?? '', d.diemCuoi ?? '', km(d.chieuDaiM) ?? '', d.ghiChu ?? '']))
    }

    // ── Mỗi lĩnh vực HTKT khác: một sheet ──
    for (const lv of LINH_VUC.filter((l) => l.value !== 'DUONG')) {
      const x = ds.filter((d) => d.linhVuc === lv.value)
      if (!x.length) continue
      const ws = wb.addWorksheet(lv.label.slice(0, 31).replace(/[\\/?*[\]:]/g, ' '))
      const truong = lv.truong
      const cols = ['TT', 'Mã đối tượng', 'Tên', ...(lv.trenTuyen ? ['Thuộc tuyến đường'] : []),
        ...truong.map((tr) => (tr.unit ? `${tr.label} (${tr.unit})` : tr.label)), 'Vĩ độ tâm', 'Kinh độ tâm', 'Đo GIS', 'Ghi chú']
      tieuDe(ws, cols.length, lv.label.toUpperCase(), `${coQuan} · ${x.length} đối tượng`)
      hangTieuDe(ws, cols, cols.map((c, i) => (i === 0 ? 6 : i === 1 ? 16 : i === 2 ? 30 : c.length > 18 ? 18 : 14)))
      x.forEach((d, i) => hang(ws, [
        i + 1, d.maDoiTuong, d.ten ?? '', ...(lv.trenTuyen ? [d.tuyenSoHieu ?? d.tuyenTen ?? ''] : []),
        ...truong.map((tr) => giaTriTruong(d, tr)),
        d.tamLat ?? '', d.tamLng ?? '',
        d.chieuDaiGisM !== null ? `${d.chieuDaiGisM.toLocaleString('vi-VN')} m` : d.dienTichGisM2 !== null ? `${d.dienTichGisM2.toLocaleString('vi-VN')} m²` : '',
        d.ghiChu ?? '',
      ]))
    }

    // ── Dải số hiệu (Đ5) ──
    if (dai) {
      const wd = wb.addWorksheet('Dải số hiệu')
      tieuDe(wd, 6, 'DẢI SỐ HIỆU ĐƯỜNG XÃ, ĐƯỜNG THÔN', `${coQuan} — ${dai.canCu ?? 'Điều 5 QĐ 56/2025/QĐ-UBND'}`,
        'Số hiệu = "ĐX." / "Đth." + số tự nhiên trong dải + chữ cái B,C,D,E,F,G,H,I,K,L,M,N cho đường thứ hai trở lên dùng chung số')
      hangTieuDe(wd, ['Loại', 'Dải số', 'Thẩm quyền đặt (Đ5 k2)', 'Đã dùng', 'Sức chứa tối đa', 'Gợi ý số tiếp theo'], [16, 14, 22, 12, 16, 18])
      hang(wd, ['Đường xã (ĐX.)', `${dai.dxTu}–${dai.dxDen}`, 'UBND tỉnh', dai.dxDaDung, dai.dxSucChua, dai.goiYDx ?? 'Hết số'])
      hang(wd, ['Đường thôn (Đth.)', `${dai.dthTu}–${dai.dthDen}`, 'UBND cấp xã', dai.dthDaDung, dai.dthSucChua, dai.goiYDth ?? 'Hết số'])
      wd.addRow([])
      hangTieuDe(wd, ['Số hiệu', 'Tên', 'Trạng thái', 'Quyết định', 'Mã đối tượng', 'Thôn'], [12, 30, 18, 26, 18, 18])
      wd.views = []
      duong.filter((d) => d.soHieu).forEach((d) => hang(wd, [d.soHieu, d.ten ?? '', SH_TRANG_THAI.find((s) => s.value === d.shTrangThai)?.label ?? '',
        d.shSoQd ? `${d.shSoQd}${d.shNgayQd ? ` (${d.shNgayQd.split('-').reverse().join('/')})` : ''}` : '', d.maDoiTuong, d.thon ?? '']))
    }

    // ── Cảnh báo ──
    const cb = canhBao(ds, q.xa.laPhuong)
    if (cb.length) {
      const wc = wb.addWorksheet('Cảnh báo')
      tieuDe(wc, 4, 'CẢNH BÁO CHẤT LƯỢNG DỮ LIỆU', `${coQuan} · ${cb.length} cảnh báo · cần rà soát trước khi báo cáo`)
      hangTieuDe(wc, ['Mức', 'Mã đối tượng', 'Đối tượng', 'Nội dung'], [8, 18, 30, 80])
      cb.forEach((c) => hang(wc, [c.muc === 'cao' ? 'Cao' : 'TB', c.maDoiTuong, c.nhan, c.noiDung]))
    }

    const buffer = await wb.xlsx.writeBuffer()
    const ten = `Ho-so-HTKT_${q.xa.name.replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(ten)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[export/htkt-doi-tuong]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
