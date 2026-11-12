// Cập nhật tiến độ thẩm định 77 khu TĐC + nghĩa trang (GPMB đường sắt tốc độ cao) vào module Công việc
// theo Google Sheet "Tổng hợp thẩm định các Đường sắt TĐC 20261110", tab QuanLyTienDo, ngày theo dõi 11/11/2026.
//
// Vì sao có script riêng: trang tính mới hơn "Dự thảo BC đến 31.10.26" và có tình trạng thật từng khu,
// nên thay cho import-dsct-tdc-bc-311026.mjs (script đó chưa từng được ghi; không chạy nữa).
// Nguồn từng dòng ở trường `nguon`: 40 dòng HTKT từ QuanLyTienDo; 37 dòng của 2 phòng còn lại bị bộ lọc
// ẩn nên lấy từ tab Dulieu, đối chiếu số đếm với tab TongHop_TienDo.
//
// Chạy thử (mặc định, KHÔNG ghi):  node prisma/import-dsct-qltd-111126.mjs [--report=tep.md]
// Ghi thật (cần người dùng duyệt): node prisma/import-dsct-qltd-111126.mjs --apply
//
// Idempotent: chỉ UPDATE khi giá trị đổi; việc mới dùng ON CONFLICT ("maCongViec"). Chạy lần hai phải ra 0 thay đổi.
// Không xoá gì. Không đổi phòng của việc đã có; lệch phòng thì dừng để người dùng quyết.

import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const APPLY = process.argv.includes('--apply')
const REPORT = process.argv.find((a) => a.startsWith('--report='))?.slice(9)

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}

const rows = JSON.parse(readFileSync(new URL('./import-dsct-qltd-111126.data.json', import.meta.url), 'utf-8'))
const NGUON = 'Bảng QuanLyTienDo ngày 11/11/2026'
const MOC = `\n\n[${NGUON}`
const HET = ' [hết khối QuanLyTienDo]'
// Thay đúng khối cũ, giữ nguyên phần người dùng viết trước và sau khối.
function ghepMoTa(cu, khoi) {
  const s = cu || ''
  const a = s.indexOf(MOC)
  if (a < 0) return `${s}\n\n${khoi}`
  const b = s.indexOf(HET, a)
  const sau = b < 0 ? '' : s.slice(b + HET.length) // khối cũ không có dấu kết thúc chỉ có thể do script này tạo
  return `${s.slice(0, a)}\n\n${khoi}${sau}`
}
const PHONG = {
  HTKT: 'Phòng Hạ tầng kỹ thuật',
  PTDT: 'Phòng Phát triển đô thị',
  KTVL: 'Phòng Kinh tế và vật liệu xây dựng',
}
const TRANG_THAI = { PD: 'HOAN_THANH', TRINH: 'CHO_DUYET', DANG: 'DANG_LAM', TRA: 'TAM_DUNG', CHUA: 'MOI' }
const TINH_TRANG = {
  PD: 'Đã thẩm định, UBND tỉnh đã phê duyệt',
  TRINH: 'Đã thẩm định, đang ở UBND tỉnh',
  DANG: 'Đang thẩm định',
  TRA: 'Đã trả hồ sơ cho chủ đầu tư',
  CHUA: 'Chưa nộp hồ sơ thẩm định',
}
const ngayVN = (s) => (s ? s.split('-').reverse().join('/') : '')
const fmt = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 })

// Ghi vào moTa vì trang chi tiết chỉ hiện moTa. Khối này được thay nguyên khối khi chạy lại.
function khoiTienDo(r) {
  const p = [`[${NGUON} - ${r.ma}]`, `Tình trạng: ${TINH_TRANG[r.tt]}.`]
  if (r.nop) p.push(`Ngày nộp gần nhất: ${ngayVN(r.nop)}.`)
  if (r.toTrinhCdt) p.push(`Văn bản chủ đầu tư: ${r.toTrinhCdt}.`)
  if (r.vb) p.push(`Văn bản của Sở: ${r.vb}${r.kq ? ` (${ngayVN(r.kq)})` : ''}.`)
  if (r.trinh) p.push(`Tờ trình UBND tỉnh: ${r.trinh}${r.ngayTrinh ? ` (${ngayVN(r.ngayTrinh)})` : ''}.`)
  if (r.ubnd) p.push(`UBND tỉnh: ${r.ubnd}${r.soQd ? `, QĐ ${r.soQd} ngày ${ngayVN(r.ngayQd)}` : ''}.`)
  if (r.soBo != null) p.push(`Sơ bộ TMĐT theo QĐ 3456: ${fmt(r.soBo)} tỷ đồng.`)
  if (r.tmdt != null) p.push(`TMĐT chủ đầu tư trình: ${fmt(r.tmdt)} tỷ đồng.`)
  if (r.ghiChu) p.push(`Ghi chú: ${r.ghiChu}.`)
  if (r.canXem) p.push(`Cần kiểm tra lại: ${r.canXem}.`)
  return p.join(' ').replace(/\.\./g, '.') + HET
}
function theoDoi(r) {
  const o = { nguon: r.nguon === 'QLTD' ? 'QuanLyTienDo' : 'Dulieu', ngayTheoDoi: '2026-11-11', maDA: r.ma, tinhTrang: TINH_TRANG[r.tt] }
  const them = { ngayNop: r.nop, ngayNopGoc: r.nopGoc, toTrinhCDT: r.toTrinhCdt, vanBanSo: r.vb, ngayVanBan: r.kq, toTrinhSXD: r.trinh,
    ngayTrinhUBND: r.ngayTrinh, tinhTrangUBND: r.ubnd, soQD: r.soQd, ngayQD: r.ngayQd, nguoiThucHien: r.nguoi,
    tmdtSoBoTy: r.soBo, tmdtTrinhTy: r.tmdt, hanThamDinh: r.han, ghiChu: r.ghiChu, canKiemTra: r.canXem }
  for (const [k, v] of Object.entries(them)) if (v != null && v !== '') o[k] = v
  return o
}
const stable = (v) => Array.isArray(v) ? v.map(stable)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v
const giong = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b))
const newId = () => randomUUID().replace(/-/g, '').slice(0, 25)

const client = new pg.Client({ connectionString: env.DATABASE_URL })
await client.connect()
const report = []
const dem = { capNhat: 0, taoMoi: 0, khongDoi: 0, nhatKy: 0 }
try {
  await client.query(APPLY ? 'BEGIN' : 'BEGIN READ ONLY')
  const { rows: cur } = await client.query(
    `select cv.*, to_char(cv."ngayHoanThanh",'YYYY-MM-DD') ht_text, to_char(cv."ngayBatDau",'YYYY-MM-DD') bd_text,
       to_char(cv."ngayHetHan",'YYYY-MM-DD') hh_text, t.ten phong
     from cong_viec cv left join to_chuc t on t.id=cv."toChucId" where cv."maCongViec" like 'DSCT-%'
     ${APPLY ? 'for update of cv' : ''}`) // khoá dòng khi ghi: không đè sửa đổi người dùng làm giữa lúc đọc và ghi
  const theoMa = new Map(cur.map((c) => [c.maCongViec, c]))
  const mau = theoMa.get('DSCT-TDC-001')
  const admin = mau.createdById

  const { rows: tcs } = await client.query(`select id, ten from to_chuc where ten = any($1)`, [Object.values(PHONG)])
  const toChuc = new Map()
  for (const [k, ten] of Object.entries(PHONG)) {
    const hit = tcs.filter((t) => t.ten === ten)
    if (hit.length !== 1) throw new Error(`Không xác định duy nhất đơn vị: ${ten}`)
    toChuc.set(k, hit[0].id)
  }
  const tenNguoi = [...new Set(rows.map((r) => r.nguoi).filter(Boolean))]
  const { rows: us } = await client.query(`select id, name from users where name = any($1) and "isActive" = true`, [tenNguoi])
  const nguoi = new Map()
  for (const ten of tenNguoi) {
    const hit = us.filter((u) => u.name === ten)
    if (hit.length !== 1) throw new Error(`Không khớp duy nhất tài khoản: ${ten} (${hit.length})`)
    nguoi.set(ten, hit[0].id)
  }

  const maNguon = rows.map((r) => r.dsct)
  const trung = maNguon.filter((m, i) => maNguon.indexOf(m) !== i)
  if (trung.length) throw new Error('Một việc khớp nhiều dòng: ' + trung.join(','))

  for (const r of rows) {
    const ma = `DSCT-${r.dsct}`
    const trangThai = TRANG_THAI[r.tt]
    if (!trangThai) throw new Error(`Tình trạng lạ ở ${r.ma}: ${r.tt}`)
    const nguoiId = r.nguoi ? nguoi.get(r.nguoi) : null
    const bd = r.nop ?? null
    const hh = r.tt === 'DANG' ? r.han ?? null : null // chỉ việc đang thẩm định mới có hạn của Sở
    const ht = r.tt === 'PD' ? r.ngayQd ?? null : null
    const c = theoMa.get(ma)
    const nhan = { maDA: r.ma, ma, phong: PHONG[r.phong], nguon: r.nguon, trangThai, nguoi: r.nguoi || '', canXem: r.canXem || '' }

    if (r.moi) {
      const cha = r.cha ? theoMa.get(`DSCT-${r.cha}`) : null
      if (r.cha && !cha) throw new Error(`Không thấy việc cha DSCT-${r.cha}`)
      if (c) {
        // Đã tạo ở lần chạy trước: chỉ chấp nhận nếu đúng phòng, đúng cha, chưa xoá mềm.
        if (c.toChucId !== toChuc.get(r.phong) || (c.congViecChaId ?? null) !== (cha?.id ?? null) || c.deletedAt) {
          throw new Error(`${ma} đã tồn tại nhưng khác phòng/việc cha hoặc đã xoá mềm`)
        }
        report.push({ ...nhan, loai: 'DA_CO', ten: c.tieuDe, doi: '' }); dem.khongDoi++; continue
      }
      report.push({ ...nhan, loai: 'MOI', ten: r.ten, doi: r.cha ? `con của DSCT-${r.cha}` : '' })
      if (!APPLY) dem.taoMoi++
      if (APPLY) {
        const id = newId()
        const cf = { nguon: 'DSCT-import', phuLuc: r.ma.startsWith('NT') ? 'Nghĩa trang' : 'Tái định cư', tienDoThamDinh: theoDoi(r) }
        const { rowCount } = await client.query(
          `insert into cong_viec (id,"maCongViec","tieuDe","moTa","toChucId","loaiId","trangThai","uuTien","tienDo","nguoiPhuTrachId",
             "ngayBatDau","ngayHetHan","ngayHoanThanh","congViecChaId","customFields","createdById","createdAt","updatedAt")
           values ($1,$2,$3,$4,$5,$6,$7::"CongViecTrangThai",'CAO',$8,$9,$10,$11,$12,$13,$14,$15,now(),now())
           on conflict ("maCongViec") do nothing`,
          [id, ma, r.ten, khoiTienDo(r), toChuc.get(r.phong), mau.loaiId, trangThai, r.tt === 'PD' ? 100 : 0, nguoiId,
            bd, hh, ht, cha?.id ?? null, JSON.stringify(cf), admin])
        if (!rowCount) dem.xungDot = (dem.xungDot || 0) + 1
        if (rowCount) {
          dem.taoMoi++
          await client.query(
            `insert into cong_viec_nhat_ky (id,"congViecId","userId",loai,"noiDung","createdAt") values ($1,$2,$3,'BINH_LUAN',$4,now())`,
            [newId(), id, admin, `Tạo từ ${NGUON} - ${r.ma}.`])
          dem.nhatKy++
        }
      }
      continue
    }

    if (!c) throw new Error(`Không thấy ${ma} cho ${r.ma}`)
    if (c.toChucId !== toChuc.get(r.phong)) throw new Error(`Lệch phòng ở ${ma}: CSDL ${c.phong}, trang tính ${PHONG[r.phong]}`)
    const cfCu = c.customFields || {}
    const cfMoi = { ...cfCu, tienDoThamDinh: theoDoi(r) }
    const moTa = ghepMoTa(c.moTa, khoiTienDo(r))
    const tieuDe = r.doiTen || c.tieuDe
    const tienDo = r.tt === 'PD' ? 100 : c.tienDo
    const nguoiMoi = c.nguoiPhuTrachId ?? nguoiId // chỉ điền khi còn trống, không đè phân công làm tay

    const doi = []
    if (c.trangThai !== trangThai) doi.push(`trạng thái ${c.trangThai} → ${trangThai}`)
    if (c.tienDo !== tienDo) doi.push(`tiến độ ${c.tienDo}% → ${tienDo}%`)
    if (c.bd_text !== bd) doi.push(`ngày bắt đầu → ${ngayVN(bd) || 'trống'}`)
    if (c.hh_text !== hh) doi.push(`hạn → ${ngayVN(hh) || 'trống'}`)
    if (c.ht_text !== ht) doi.push(`ngày hoàn thành → ${ngayVN(ht) || 'trống'}`)
    if (c.nguoiPhuTrachId !== nguoiMoi) doi.push(`người phụ trách → ${r.nguoi}`)
    if (tieuDe !== c.tieuDe) doi.push('tiêu đề theo trang tính')
    const khac = doi.length > 0 || c.moTa !== moTa || !giong(cfCu, cfMoi)
    report.push({ ...nhan, loai: 'DA_CO', ten: tieuDe, doi: doi.join('; ') })
    if (!khac) { dem.khongDoi++; continue }
    dem.capNhat++
    if (APPLY) {
      await client.query(
        `update cong_viec set "tieuDe"=$2,"moTa"=$3,"trangThai"=$4::"CongViecTrangThai","tienDo"=$5,"nguoiPhuTrachId"=$6,
           "ngayBatDau"=$7,"ngayHetHan"=$8,"ngayHoanThanh"=$9,"customFields"=$10,"updatedAt"=now() where id=$1`,
        [c.id, tieuDe, moTa, trangThai, tienDo, nguoiMoi, bd, hh, ht, JSON.stringify(cfMoi)])
      if (c.trangThai !== trangThai) {
        await client.query(
          `insert into cong_viec_nhat_ky (id,"congViecId","userId",loai,"noiDung","giaTriCu","giaTriMoi","createdAt")
           values ($1,$2,$3,'DOI_TRANG_THAI',$4,$5,$6,now())`,
          [newId(), c.id, admin, `Cập nhật theo ${NGUON} - ${r.ma}: ${TINH_TRANG[r.tt]}.`, c.trangThai, trangThai])
        dem.nhatKy++
      }
    }
  }

  const khongCo = [...theoMa.keys()].filter((m) => !maNguon.includes(m.replace('DSCT-', ''))).sort()
  await client.query(APPLY ? 'COMMIT' : 'ROLLBACK')
  console.log(APPLY ? 'ĐÃ GHI' : 'CHẠY THỬ (không ghi)', JSON.stringify({ dongTep: rows.length, ...dem }))
  const theoPhong = {}
  for (const x of report) { (theoPhong[x.phong] ??= {})[x.trangThai] = ((theoPhong[x.phong] ??= {})[x.trangThai] || 0) + 1 }
  console.log('Theo phòng:', JSON.stringify(theoPhong))
  console.log('Việc có trong CSDL nhưng không có dòng riêng trong trang tính:', khongCo.join(', ') || '(không)')

  if (REPORT) try {
    const dong = ['| Mã DA | Mã việc | Phòng | Nguồn | Trạng thái | Người phụ trách | Thay đổi | Cần kiểm tra | Tên |', '|---|---|---|---|---|---|---|---|---|']
    for (const x of report) {
      dong.push(`| ${x.maDA} | ${x.ma}${x.loai === 'MOI' ? ' (MỚI)' : ''} | ${x.phong.replace('Phòng ', '')} | ${x.nguon} | ${x.trangThai} | ${x.nguoi} | ${x.doi} | ${x.canXem} | ${x.ten} |`)
    }
    writeFileSync(REPORT, `# Bảng đối chiếu chạy thử - ${NGUON}\n\n` + dong.join('\n') + '\n', 'utf-8')
    console.log('Đã ghi báo cáo:', REPORT)
  } catch (e) {
    console.error(`${APPLY ? 'CSDL ĐÃ COMMIT; ' : ''}xuất báo cáo thất bại:`, e.message)
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('LỖI:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
