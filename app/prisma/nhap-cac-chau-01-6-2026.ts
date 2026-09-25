// Nhập "Danh sách các cháu và thành tích năm học 2025 - 2026" (G:\My Drive\Nâng lương\Danh sách các cháu
// 01_6.xlsx) vào con_can_bo + thanh_tich_con (migration 046). Idempotent: chạy lại không tạo trùng
// (khoá: phụ huynh + họ tên con + năm sinh; thành tích: con + năm học + nội dung).
//
// Ghép phụ huynh ↔ can_bo theo họ tên. Danh sách sắp xếp theo khối Lãnh đạo Sở → Văn phòng → từng phòng,
// nên các cặp TRÙNG HỌ TÊN được suy theo vị trí dòng (xem GHEP_TAY). Lê Anh Tuấn (2 chuyên viên cùng
// Phòng Phát triển đô thị) KHÔNG suy được → gắn tạm, phuHuynhDaXacNhan = false (chưa tính giảm trừ).
//
// Năm sinh: danh sách chỉ ghi tuổi (tại 01/6/2026) → năm sinh ước tính = 2026 − tuổi ("8 tháng" → 2025).
//
// Chạy thử:  node_modules\.bin\jiti.cmd prisma\nhap-cac-chau-01-6-2026.ts --dry-run
// Chạy thật: node_modules\.bin\jiti.cmd prisma\nhap-cac-chau-01-6-2026.ts

import 'dotenv/config'
import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { doanCapDo, doanMon, doanXepGiai } from '../lib/con-can-bo'

const TEP = String.raw`G:\My Drive\Nâng lương\Danh sách các cháu 01_6.xlsx`
const NGUON = 'Danh sách các cháu 01/6/2026 (năm học 2025-2026)'
const NAM_GOC = 2026
const NAM_HOC = 2025
const DRY_RUN = process.argv.includes('--dry-run')

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL }) } as never)

// Ghép tay theo số TT trong danh sách: tìm can_bo theo họ tên + năm sinh cán bộ.
const GHEP_TAY: Record<number, { hoTen: string; namSinh: number; lyDo: string; chacChan: boolean }> = {
  2:  { hoTen: 'Nguyễn Thanh Hải', namSinh: 1975, chacChan: true, lyDo: 'dòng nằm trong khối Lãnh đạo Sở → Phó Giám đốc' },
  54: { hoTen: 'Nguyễn Thanh Hải', namSinh: 1973, chacChan: true, lyDo: 'dòng đầu khối Phòng Quy hoạch - Kiến trúc → Trưởng phòng' },
  6:  { hoTen: 'Nguyễn Xuân Hoàng', namSinh: 1978, chacChan: true, lyDo: 'dòng nằm trong khối Lãnh đạo Sở → Phó Giám đốc' },
  11: { hoTen: 'Nguyễn Thị Thùy Linh', namSinh: 1991, chacChan: true, lyDo: 'dòng nằm trong khối Văn phòng Sở → viên chức biệt phái Văn phòng' },
  69: { hoTen: 'Nguyễn Thị Thùy Linh', namSinh: 1978, chacChan: true, lyDo: 'dòng đầu khối Phòng Quản lý nhà & TT BĐS → Trưởng phòng' },
  14: { hoTen: 'Nguyễn Thị Kiều Trang', namSinh: 0, chacChan: true, lyDo: 'danh sách ghi thiếu chữ "Thị"' },
  17: { hoTen: 'Lê Đinh Hậu', namSinh: 0, chacChan: true, lyDo: 'danh sách ghi "Lê Đình Hậu"' },
  77: { hoTen: 'Lê Anh Tuấn', namSinh: 1973, chacChan: false, lyDo: 'HAI chuyên viên cùng tên ở Phòng PTĐT — gắn tạm người sinh 1973, CHỜ XÁC NHẬN' },
  78: { hoTen: 'Lê Anh Tuấn', namSinh: 1979, chacChan: false, lyDo: 'danh sách ghi "(B)" — gắn tạm người sinh 1979, CHỜ XÁC NHẬN' },
}

const sach = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').replace(/\s*\.\s*$/, '').trim()
const norm = (s: string) => sach(s).replace(/\(.*?\)/g, '').trim().normalize('NFC').toLowerCase()

function namSinhTuTuoi(v: unknown): { namSinh: number; ghiChu?: string } | null {
  const s = sach(v).toLowerCase()
  if (!s) return null
  const thang = s.match(/^(\d+)\s*tháng$/)
  if (thang) return { namSinh: Number(thang[1]) <= 5 ? NAM_GOC : NAM_GOC - 1 }   // tính tại 01/6/2026
  const n = Number(s.replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return { namSinh: Math.floor(NAM_GOC - n) }
}

async function main() {
  const wb = XLSX.read(readFileSync(TEP), { type: 'buffer' })
  const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null, blankrows: false })

  type Con = { hoTen: string; tuoi: unknown; lop: unknown; cot: (unknown)[] }
  const ds: { tt: number; phuHuynh: string; con: Con[] }[] = []
  for (const r of rows.slice(2)) {
    const [tt, ph, ten] = r
    if (typeof ph === 'string' && ph.startsWith('Tổng')) break
    if (ph) ds.push({ tt: Number(tt), phuHuynh: sach(ph), con: [] })
    if (ten && ds.length) ds[ds.length - 1].con.push({ hoTen: sach(ten), tuoi: r[4], lop: r[5], cot: r.slice(6, 11) })
  }

  const canBo = await db.canBo.findMany({ select: { id: true, hoTen: true, ngaySinh: true, chucVu: true } })
  const theoTen = new Map<string, typeof canBo>()
  for (const c of canBo) theoTen.set(norm(c.hoTen), [...(theoTen.get(norm(c.hoTen)) ?? []), c])

  let soCon = 0, soTT = 0, boQua = 0, soCapNhat = 0
  const canXem: string[] = []
  for (const p of ds) {
    const tay = GHEP_TAY[p.tt]
    let ungVien = theoTen.get(norm(tay?.hoTen ?? p.phuHuynh)) ?? []
    if (tay?.namSinh) ungVien = ungVien.filter((c) => c.ngaySinh && new Date(c.ngaySinh).getFullYear() === tay.namSinh)
    if (ungVien.length !== 1) { canXem.push(`#${p.tt} ${p.phuHuynh}: không xác định được hồ sơ cán bộ (${ungVien.length} ứng viên) — BỎ QUA`); boQua += p.con.length; continue }
    const cb = ungVien[0]
    const chacChan = tay ? tay.chacChan : true
    if (tay) canXem.push(`#${p.tt} ${p.phuHuynh} → ${cb.hoTen} (${cb.chucVu ?? ''}, sinh ${cb.ngaySinh ? new Date(cb.ngaySinh).getFullYear() : '?'}): ${tay.lyDo}`)

    const tenTrongNha = new Map<string, number>()
    for (const c of p.con) tenTrongNha.set(norm(c.hoTen), (tenTrongNha.get(norm(c.hoTen)) ?? 0) + 1)

    for (const c of p.con) {
      const ns = namSinhTuTuoi(c.tuoi)
      if (!ns) { canXem.push(`#${p.tt} ${c.hoTen}: không đọc được tuổi "${c.tuoi}" — BỎ QUA`); boQua++; continue }
      const tuoi = NAM_GOC - ns.namSinh
      const lopRaw = sach(c.lop).toLowerCase()
      const mamNon = /m[ầa]m non/.test(lopRaw)
      let lopGoc: number | null = mamNon || !lopRaw ? null : Number(lopRaw)
      const ghiChu: string[] = []
      if (lopGoc != null && (!Number.isInteger(lopGoc) || lopGoc < 1 || lopGoc > 12 || Math.abs(lopGoc - (tuoi - 6)) > 2)) {
        ghiChu.push(`Danh sách ghi lớp "${c.lop}" không khớp ${tuoi} tuổi — chưa dùng, cần kiểm tra lại`)
        lopGoc = null
      }
      if ((tenTrongNha.get(norm(c.hoTen)) ?? 0) > 1) ghiChu.push('Trùng họ tên với anh/chị/em trong cùng gia đình — kiểm tra lại tên')
      if (!chacChan) ghiChu.push('Phụ huynh trùng họ tên, chưa xác nhận đúng người — chưa tính giảm trừ gia cảnh')
      if (ghiChu.length) canXem.push(`#${p.tt} ${c.hoTen}: ${ghiChu.join('; ')}`)

      const tonTai = await db.conCanBo.findFirst({ where: { canBoId: cb.id, hoTen: c.hoTen, namSinh: ns.namSinh } })
      const con = tonTai ?? (DRY_RUN ? null : await db.conCanBo.create({
        data: {
          canBoId: cb.id, hoTen: c.hoTen, namSinh: ns.namSinh, namSinhUocTinh: true, lopGoc, mamNonGoc: mamNon,
          namHocGoc: NAM_HOC, dangKyNPT: true, phuHuynhDaXacNhan: chacChan,
          ghiChu: ghiChu.join('; ') || null, nguon: NGUON,
        },
      }))
      if (!tonTai) soCon++

      // Thành tích: G danh hiệu · H cấp xã/phường · I cấp tỉnh · J quốc gia · K ghi chú (thường là cấp trường)
      const COT: [number, 'DANH_HIEU' | 'GIAI', string | null][] = [[0, 'DANH_HIEU', null], [1, 'GIAI', 'XA'], [2, 'GIAI', 'TINH'], [3, 'GIAI', 'QUOC_GIA'], [4, 'GIAI', null]]
      for (const [i, loai, capMacDinh] of COT) {
        const nd = sach(c.cot[i])
        if (!nd) continue
        const du = {
          namHoc: NAM_HOC, loai, noiDung: nd,
          capDo: loai === 'DANH_HIEU' ? null : doanCapDo(nd, capMacDinh),
          mon: loai === 'DANH_HIEU' ? null : doanMon(nd),
          xepGiai: loai === 'DANH_HIEU' ? null : doanXepGiai(nd),
        }
        if (!con) { soTT++; continue }
        const co = await db.thanhTichCon.findFirst({ where: { conId: con.id, namHoc: NAM_HOC, noiDung: nd } })
        if (!co) { await db.thanhTichCon.create({ data: { ...du, conId: con.id } }); soTT++ }
        // Đã có: chỉ làm mới các trường ĐOÁN tự động (khi bộ đoán được cải tiến), giữ nguyên nội dung gốc.
        else if (co.capDo !== du.capDo || co.mon !== du.mon || co.xepGiai !== du.xepGiai) {
          await db.thanhTichCon.update({ where: { id: co.id }, data: { capDo: du.capDo, mon: du.mon, xepGiai: du.xepGiai } })
          soCapNhat++
        }
      }
    }
  }

  console.log(`Phụ huynh: ${ds.length} · con trong danh sách: ${ds.reduce((s, p) => s + p.con.length, 0)}`)
  console.log(`${DRY_RUN ? '[CHẠY THỬ] sẽ tạo' : 'Đã tạo'}: ${soCon} con, ${soTT} thành tích · làm mới phân loại ${soCapNhat} · bỏ qua ${boQua}`)
  console.log('\nCần xem lại:\n' + canXem.map((s) => '  - ' + s).join('\n'))
}

main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => db.$disconnect())
