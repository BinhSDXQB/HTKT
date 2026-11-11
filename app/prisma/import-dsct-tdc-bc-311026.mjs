// Cập nhật 51 khu tái định cư (GPMB đường sắt tốc độ cao) vào module Công việc
// theo "Dự thảo BC đến 31.10.26 gửi lấy ý kiến.doc" (Phụ lục 1, 2, 3, 5).
//
// Vì sao có script riêng: báo cáo là ảnh chụp tiến độ mới hơn lô nhập 18/6/2026
// (mã DSCT-TDC-###); phải cập nhật đúng việc đã có, không tạo trùng.
//
// Chạy thử (mặc định, KHÔNG ghi):  node prisma/import-dsct-tdc-bc-311026.mjs [--report=tep.md]
// Ghi thật (cần người dùng duyệt): node prisma/import-dsct-tdc-bc-311026.mjs --apply
//
// Idempotent: chỉ UPDATE và ghi nhật ký khi giá trị thực sự đổi; việc mới dùng
// ON CONFLICT ("maCongViec"). Chạy lần hai phải ra 0 thay đổi. Không xoá gì.
// Không đụng: daCapTy, soHoBoTri, maDuAn, nghĩa trang DSCT-NT-*, DSCT-TDC-025.

import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const APPLY = process.argv.includes('--apply')
const REPORT = process.argv.find((a) => a.startsWith('--report='))?.slice(9)

// ĐÃ THAY bằng import-dsct-qltd-111126.mjs (bảng QuanLyTienDo 11/11/2026, đã ghi CSDL). Số liệu báo cáo
// 31/10 cũ hơn và đưa 47 khu vào Hoàn thành bất kể tình trạng thật → ghi đè dữ liệu đúng. Chỉ cho chạy thử.
if (APPLY) {
  console.error('⛔ Script này đã bị thay bởi prisma/import-dsct-qltd-111126.mjs — không ghi CSDL.')
  process.exit(1)
}

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}

const rows = JSON.parse(readFileSync(new URL('./import-dsct-tdc-bc-311026.data.json', import.meta.url), 'utf-8'))
const NGUON = 'Dự thảo BC đến 31/10/2026'

// Khoá khớp "PL-TT" → mã việc đã có. Khớp theo tên thôn/xã, đối chiếu thêm diện tích và TMĐT.
const KHOP = {
  '1-1': '001', '1-2': '003', '1-3': '002', '1-4': '004', '1-5': '017', '1-6': '019', '1-7': '037',
  '1-8': '014', '1-9': '039', '1-10': '006', '1-11': '040', '1-12': '043', '1-13': '044', '1-14': '011',
  '1-15': '008', '1-16': '027', '1-17': '029',
  '2-1': '038', '2-2': '047', '2-3': '048', '2-4': '023', '2-5': '049', '2-6': '041', '2-7': '042',
  '2-8': '026', '2-9': '007', '2-10': '033', '2-11': '020', '2-12': '046', '2-13': '036',
  '3-1': '010', '3-2': '012', '3-3': '013', '3-4': '005', '3-5': '024', '3-6': '022', '3-7': '018',
  '3-8': '030', '3-9': '031', '3-10': '032', '3-11': '034', '3-12': '009',
  '5-1': '015', '5-2': '016', '5-3': '021', '5-4': '045', '5-5': '028',
}
// Khu chưa có việc riêng → tạo mới. cha: 3 khu Trường Phú là tách từ DSCT-TDC-035
// (4,69 + 3,24 + 3,12 = 11,05 ha, đúng diện tích của 035).
const MOI = {
  '3-13': { ma: '050', phongTheo: '009' },
  '3-14': { ma: '051', phongTheo: '035', cha: '035' },
  '3-15': { ma: '052', phongTheo: '035', cha: '035' },
  '5-6': { ma: '053', phongTheo: '035', cha: '035' },
}
// Tên trong CSDL sai/thiếu so với tệp → đổi tiêu đề theo tệp. Các việc khác giữ tiêu đề cũ.
// 012 không đổi: tệp ghi "Đông Sơn" nhưng dự án thành phần và việc cũ đều ghi "Đồng Sơn".
const DOI_TEN = new Set(['023', '040', '049'])

function trangThaiTheoBaoCao(r) {
  if (r.pl === 1) {
    if (r.pheDuyet === 'Đã phê duyệt') return { trangThai: 'HOAN_THANH', tienDo: 100 }
    if (r.tt === 9) return { trangThai: 'DANG_LAM' } // Đang lập và trình lại theo Luật Xây dựng 2025
    return { trangThai: 'CHO_DUYET' } // Sở đã thẩm định xong, đang trình UBND tỉnh
  }
  if (r.pl === 2) return { trangThai: 'DANG_LAM' }
  if (r.pl === 3) return { trangThai: 'TAM_DUNG' } // Hồ sơ đã trả, chờ chủ đầu tư
  return { trangThai: 'MOI' }
}
function tinhTrangHoSo(r) {
  if (r.pl === 1) return `Đã thẩm định${r.pheDuyet ? '; ' + r.pheDuyet.toLowerCase() : ''}`
  if (r.pl === 2) return 'Đang thẩm định'
  if (r.pl === 3) return 'Đã trả hồ sơ cho chủ đầu tư'
  return 'Chưa trình thẩm định'
}
const fmt = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 })
// Ghi vào moTa vì trang chi tiết chỉ hiện moTa; ghiChu và customFields không hiển thị khi xem.
function moTaTheoBaoCao(r) {
  const parts = [`Chủ trì thẩm định khu tái định cư phục vụ GPMB Dự án đường sắt tốc độ cao Bắc - Nam. Địa bàn: ${r.cdt}.\n`,
    `[${NGUON} - Phụ lục ${r.pl}, TT ${r.tt}]`,
    `Diện tích ${fmt(r.ha)} ha; TMĐT ${fmt(r.ty)} tỷ đồng (dự kiến).`, `Tình trạng: ${tinhTrangHoSo(r)}.`]
  if (r.vanBanTrinh) parts.push(`Văn bản trình: ${r.vanBanTrinh}.`)
  if (r.ghiChu) parts.push(`Ghi chú: ${r.ghiChu}.`)
  return parts.join(' ').replace(/\.\./g, '.')
}
// Ngày hoàn thành chỉ lấy khi tệp ghi rõ ngày quyết định; không suy đoán.
function ngayQuyetDinh(r) {
  const m = /QĐ số \S+ ngày (\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(r.ghiChu || '')
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}

const client = new pg.Client({ connectionString: env.DATABASE_URL })
await client.connect()
const report = []
const dem = { capNhat: 0, taoMoi: 0, khongDoi: 0, nhatKy: 0 }
try {
  await client.query(APPLY ? 'BEGIN' : 'BEGIN READ ONLY')
  const { rows: cur } = await client.query(
    `select cv.*, to_char(cv."ngayHoanThanh",'YYYY-MM-DD') ngay_ht_text, t.ten phong from cong_viec cv left join to_chuc t on t.id=cv."toChucId"
     where cv."maCongViec" like 'DSCT-TDC-%'`)
  const theoMa = new Map(cur.map((c) => [c.maCongViec, c]))
  const admin = theoMa.get('DSCT-TDC-001').createdById

  for (const r of rows) {
    const key = `${r.pl}-${r.tt}`
    // Chỉ đạo của người dùng 04/11/2026: công trình đã khớp tên với việc có sẵn (47 khu)
    // đưa vào Hoàn thành. Tình trạng thật theo tệp vẫn giữ trong mô tả và trangThaiHoSo.
    const tt = KHOP[key] ? { trangThai: 'HOAN_THANH', tienDo: 100 } : trangThaiTheoBaoCao(r)
    const hoSo = tinhTrangHoSo(r)
    const nhan = { pl: r.pl, tt: r.tt, ten: r.ten, ha: r.ha, ty: r.ty, cdt: r.cdt, trangThai: tt.trangThai }

    if (MOI[key]) {
      const m = MOI[key]
      const ma = `DSCT-TDC-${m.ma}`
      const mau = theoMa.get(`DSCT-TDC-${m.phongTheo}`)
      const chaId = m.cha ? theoMa.get(`DSCT-TDC-${m.cha}`).id : null
      report.push({ ...nhan, ma, loai: theoMa.has(ma) ? 'DA_CO' : 'MOI', phong: mau.phong, cha: m.cha ? `DSCT-TDC-${m.cha}` : '' })
      if (theoMa.has(ma)) { dem.khongDoi++; continue }
      dem.taoMoi++
      if (APPLY) {
        const cf = { nguon: 'DSCT-import', nguonCapNhat: NGUON, phuLuc: 'Tái định cư', phuLucBaoCao: r.pl, ttBaoCao: r.tt,
          chuDauTu: r.cdt, diaBan: r.cdt, dienTichHa: r.ha, tongMucDauTuTy: r.ty, trangThaiHoSo: hoSo }
        const id = randomUUID().replace(/-/g, '').slice(0, 25)
        await client.query(
          `insert into cong_viec (id,"maCongViec","tieuDe","moTa","toChucId","loaiId","trangThai","uuTien","tienDo",
             "congViecChaId","customFields","createdById","createdAt","updatedAt")
           values ($1,$2,$3,$4,$5,$6,$7::"CongViecTrangThai",'CAO',0,$8,$9,$10,now(),now())
           on conflict ("maCongViec") do nothing`,
          [id, ma, r.ten, moTaTheoBaoCao(r),
            mau.toChucId, mau.loaiId, tt.trangThai, chaId, JSON.stringify(cf), admin])
        await client.query(
          `insert into cong_viec_nhat_ky (id,"congViecId","userId",loai,"noiDung","createdAt")
           values ($1,$2,$3,'BINH_LUAN',$4,now())`,
          [randomUUID().replace(/-/g, '').slice(0, 25), id, admin, `Tạo từ ${NGUON} - Phụ lục ${r.pl}, TT ${r.tt}.`])
        dem.nhatKy++
      }
      continue
    }

    const ma = `DSCT-TDC-${KHOP[key]}`
    const c = theoMa.get(ma)
    if (!c) throw new Error(`Không thấy ${ma} cho ${key}`)
    const cfCu = c.customFields || {}
    const cfMoi = { ...cfCu, nguonCapNhat: NGUON, phuLucBaoCao: r.pl, ttBaoCao: r.tt, chuDauTu: r.cdt, diaBan: r.cdt,
      dienTichHa: r.ha, tongMucDauTuTy: r.ty, trangThaiHoSo: hoSo }
    const tieuDe = DOI_TEN.has(KHOP[key]) ? r.ten : c.tieuDe
    const moTa = moTaTheoBaoCao(r)
    const tienDo = tt.tienDo ?? c.tienDo
    const ngayHT = tt.trangThai === 'HOAN_THANH' && r.pheDuyet === 'Đã phê duyệt' ? ngayQuyetDinh(r) : null
    const ngayCu = c.ngay_ht_text // to_char: tránh lệch ngày do pg đọc timestamp theo giờ máy

    const doi = []
    if (c.trangThai !== tt.trangThai) doi.push(`trạng thái ${c.trangThai} → ${tt.trangThai}`)
    if (c.tienDo !== tienDo) doi.push(`tiến độ ${c.tienDo}% → ${tienDo}%`)
    if (Number(cfCu.dienTichHa) !== r.ha) doi.push(`diện tích ${fmt(cfCu.dienTichHa)} → ${fmt(r.ha)} ha`)
    if (Number(cfCu.tongMucDauTuTy) !== r.ty) doi.push(`TMĐT ${fmt(cfCu.tongMucDauTuTy)} → ${fmt(r.ty)} tỷ`)
    if (tieuDe !== c.tieuDe) doi.push(`tiêu đề "${c.tieuDe}" → theo tệp`)
    const khac = doi.length > 0 || c.moTa !== moTa || ngayCu !== ngayHT ||
      JSON.stringify(sortObj(cfCu)) !== JSON.stringify(sortObj(cfMoi))

    report.push({ ...nhan, ma, loai: 'DA_CO', phong: c.phong, doi: doi.join('; '), tieuDeCu: c.tieuDe,
      haCu: cfCu.dienTichHa, tyCu: cfCu.tongMucDauTuTy })
    if (!khac) { dem.khongDoi++; continue }
    dem.capNhat++
    if (APPLY) {
      await client.query(
        `update cong_viec set "tieuDe"=$2,"moTa"=$3,"trangThai"=$4::"CongViecTrangThai","tienDo"=$5,
           "ngayHoanThanh"=$6,"customFields"=$7,"updatedAt"=now() where id=$1`,
        [c.id, tieuDe, moTa, tt.trangThai, tienDo, ngayHT, JSON.stringify(cfMoi)])
      if (doi.length) {
        await client.query(
          `insert into cong_viec_nhat_ky (id,"congViecId","userId",loai,"noiDung","giaTriCu","giaTriMoi","createdAt")
           values ($1,$2,$3,'DOI_TRANG_THAI',$4,$5,$6,now())`,
          [randomUUID().replace(/-/g, '').slice(0, 25), c.id, admin,
            `Cập nhật theo ${NGUON} - Phụ lục ${r.pl}, TT ${r.tt}: ${doi.join('; ')}. Đưa vào Hoàn thành theo chỉ đạo đối chiếu tên công trình ngày 04/11/2026; tình trạng theo tệp: ${hoSo}.`, c.trangThai, tt.trangThai])
        dem.nhatKy++
      }
    }
  }

  // Khoá chống trùng: mỗi việc chỉ được một khu nguồn.
  const maSo = report.map((x) => x.ma)
  const trung = maSo.filter((m, i) => maSo.indexOf(m) !== i)
  if (trung.length) throw new Error('Một việc khớp nhiều khu: ' + trung.join(','))
  const khongCoTrongTep = [...theoMa.keys()].filter((m) => !maSo.includes(m) && m !== 'DSCT-TDC-035').sort()

  await client.query(APPLY ? 'COMMIT' : 'ROLLBACK')
  console.log(APPLY ? 'ĐÃ GHI' : 'CHẠY THỬ (không ghi)', JSON.stringify({ dongTep: rows.length, ...dem }))
  console.log('Việc có trong CSDL nhưng không có trong tệp:', khongCoTrongTep.join(', ') || '(không)')

  if (REPORT) {
    const dong = ['| PL-TT | Khu (theo tệp) | Chủ đầu tư | Mã việc | Phòng | Trạng thái đề xuất | Thay đổi |', '|---|---|---|---|---|---|---|']
    for (const x of report) {
      dong.push(`| ${x.pl}-${x.tt} | ${x.ten} | ${x.cdt} | ${x.ma}${x.loai === 'MOI' ? ' (MỚI)' : ''}${x.cha ? ' (con của ' + x.cha + ')' : ''} | ${x.phong} | ${x.trangThai} | ${x.loai === 'MOI' ? `${fmt(x.ha)} ha; ${fmt(x.ty)} tỷ` : (x.doi || '')} |`)
    }
    writeFileSync(REPORT, '# Bảng đối chiếu chạy thử\n\n' + dong.join('\n') + '\n', 'utf-8')
    console.log('Đã ghi báo cáo:', REPORT)
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('LỖI:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}

function sortObj(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
}
