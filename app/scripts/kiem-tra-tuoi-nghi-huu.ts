// Đối chiếu lib/nghi-huu.ts với BẢNG GỐC Phụ lục I và Phụ lục II Nghị định
// 135/2020/NĐ-CP. Chạy lại mỗi khi sửa công thức tính tuổi nghỉ hưu.
//
//   npx tsx scripts/kiem-tra-tuoi-nghi-huu.ts
//
// Kiểm cả hai mốc BIÊN của từng bậc (tháng đầu và tháng cuối của mỗi nhóm sinh)
// vì lỗi lệch bậc chỉ lộ ra ở biên.

import { tuoiNghiHuuThang, tinhNgayNghiHuu } from '../lib/nghi-huu'

type Bac = { tu: string; den: string; tuoi: string }

// Phụ lục I — lộ trình tuổi nghỉ hưu NAM trong điều kiện lao động bình thường.
const NAM: Bac[] = [
  { tu: '01/1961', den: '09/1961', tuoi: '60-3' },
  { tu: '10/1961', den: '06/1962', tuoi: '60-6' },
  { tu: '07/1962', den: '03/1963', tuoi: '60-9' },
  { tu: '04/1963', den: '12/1963', tuoi: '61-0' },
  { tu: '01/1964', den: '09/1964', tuoi: '61-3' },
  { tu: '10/1964', den: '06/1965', tuoi: '61-6' },
  { tu: '07/1965', den: '03/1966', tuoi: '61-9' },
  { tu: '04/1966', den: '12/1980', tuoi: '62-0' },   // từ 04/1966 trở đi: 62 tuổi
]

// Phụ lục II — lộ trình tuổi nghỉ hưu NỮ trong điều kiện lao động bình thường.
const NU: Bac[] = [
  { tu: '01/1966', den: '08/1966', tuoi: '55-4' },
  { tu: '09/1966', den: '04/1967', tuoi: '55-8' },
  { tu: '05/1967', den: '12/1967', tuoi: '56-0' },
  { tu: '01/1968', den: '08/1968', tuoi: '56-4' },
  { tu: '09/1968', den: '04/1969', tuoi: '56-8' },
  { tu: '05/1969', den: '12/1969', tuoi: '57-0' },
  { tu: '01/1970', den: '08/1970', tuoi: '57-4' },
  { tu: '09/1970', den: '04/1971', tuoi: '57-8' },
  { tu: '05/1971', den: '12/1971', tuoi: '58-0' },
  { tu: '01/1972', den: '08/1972', tuoi: '58-4' },
  { tu: '09/1972', den: '04/1973', tuoi: '58-8' },
  { tu: '05/1973', den: '12/1973', tuoi: '59-0' },
  { tu: '01/1974', den: '08/1974', tuoi: '59-4' },
  { tu: '09/1974', den: '04/1975', tuoi: '59-8' },
  { tu: '05/1975', den: '12/1990', tuoi: '60-0' },   // từ 05/1975 trở đi: 60 tuổi
]

function moc(s: string): Date {
  const [m, y] = s.split('/').map(Number)
  return new Date(Date.UTC(y, m - 1, 15))     // ngày 15 cho khỏi lệch múi giờ
}
function nhan(thang: number): string {
  return `${Math.floor(thang / 12)}-${thang % 12}`
}

let dat = 0
let sai = 0

for (const [gioi, bang] of [['NAM', NAM], ['NU', NU]] as const) {
  for (const b of bang) {
    for (const [nhan_moc, ngay] of [['đầu', moc(b.tu)], ['cuối', moc(b.den)]] as const) {
      const got = nhan(tuoiNghiHuuThang(ngay, gioi))
      if (got === b.tuoi) {
        dat++
      } else {
        sai++
        console.log(`❌ ${gioi} sinh ${nhan_moc} bậc (${nhan_moc === 'đầu' ? b.tu : b.den}): mong ${b.tuoi}, được ${got}`)
      }
    }
  }
}

// Thời điểm nghỉ hưu = ngày 01 của THÁNG LIỀN KỀ SAU tháng đủ tuổi.
// Nam sinh 15/3/1965 → thuộc bậc 10/1964–06/1965 = 61 tuổi 6 tháng
//   → đủ tuổi trong tháng 9/2026 → nghỉ hưu 01/10/2026.
const caThu: [string, 'NAM' | 'NU', string, string][] = [
  ['15/03/1965', 'NAM', '61-6', '2026-10-01'],
  ['01/01/1961', 'NAM', '60-3', '2021-05-01'],
  ['20/04/1966', 'NAM', '62-0', '2028-05-01'],
  ['10/01/1966', 'NU', '55-4', '2021-06-01'],
  ['05/05/1975', 'NU', '60-0', '2035-06-01'],
]
for (const [sinh, gioi, tuoiMong, huuMong] of caThu) {
  const [dd, mm, yyyy] = sinh.split('/').map(Number)
  const ngaySinh = new Date(Date.UTC(yyyy, mm - 1, dd))
  const tuoi = nhan(tuoiNghiHuuThang(ngaySinh, gioi))
  const huu = tinhNgayNghiHuu(ngaySinh, gioi)!.toISOString().slice(0, 10)
  if (tuoi === tuoiMong && huu === huuMong) {
    dat++
  } else {
    sai++
    console.log(`❌ ${gioi} sinh ${sinh}: mong tuổi ${tuoiMong} nghỉ ${huuMong}, được tuổi ${tuoi} nghỉ ${huu}`)
  }
}

console.log(`\n${dat} đạt · ${sai} KHÔNG ĐẠT`)
process.exit(sai > 0 ? 1 : 0)
