import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { quetThuMuc, boDau, NHAN_NHOM, type FileHoSo } from './quet-ho-so'

/**
 * HỎI ĐÁP NỘI DUNG HỒ SƠ DỰ ÁN (kiểu ChatGPT) — chỉ trả lời DỰA TRÊN tệp trong thư mục dự án
 * cán bộ đã chọn, luôn kèm nguồn (tệp · trang/sheet) để cán bộ mở ra đối chiếu.
 *
 * Cách làm (không dùng embedding để khỏi tốn phí + khỏi lưu nội dung hồ sơ vào CSDL):
 *   1. Bóc chữ các tệp PDF/DOCX/XLS(X)/TXT → cắt đoạn ~1.200 ký tự, giữ số trang/sheet.
 *   2. Chấm điểm đoạn theo từ khoá câu hỏi (bỏ dấu, TF-IDF + thưởng cụm 2 từ).
 *   3. Gửi các đoạn điểm cao nhất + danh mục tệp cho model, yêu cầu trích nguồn [n].
 * Chỉ mục giữ trong RAM theo thư mục (tối đa vài thư mục gần nhất), tự làm lại khi tệp đổi.
 */

export const GIOI_HAN_HOI_DAP = {
  soTepDoc: 80,
  tongByteDoc: 200 * 1024 * 1024,
  kichThuocTepDoc: 40 * 1024 * 1024,
  // Máy chủ 6GB RAM: mỗi chỉ mục ≤ ~4 triệu ký tự (~50–80MB kể cả bảng từ), giữ tối đa 3 chỉ mục.
  kyTuMoiTep: 150_000,
  kyTuMoiChiMuc: 4_000_000,
  kyTuDoan: 1200,
  soDoanGui: 10,
  kyTuNguCanhToiDa: 14_000,
  soChiMucCache: 3,
} as const

export type Doan = { id: number; tep: string; viTri: string; noiDung: string; tu: Map<string, number>; chuoiBoDau: string }
export type TepChiMuc = { tep: string; nhom: string; kichThuoc: number; trangThai: 'da-doc' | 'khong-doc-duoc' | 'bo-qua'; ghiChu?: string }
export type ChiMuc = { chuKy: string; doan: Doan[]; tep: TepChiMuc[]; df: Map<string, number>; taoLuc: number }

const cache = new Map<string, ChiMuc>()
const dangTao = new Map<string, Promise<ChiMuc>>()

// Từ quá phổ biến trong hồ sơ hành chính — không giúp phân biệt đoạn.
const TU_DUNG = new Set(
  ('va cua cac cho la co duoc trong theo voi nhung mot nay do khi thi de tai ve tu cung nhu ra vao da se dang ' +
    'bao nhieu gi nao sao the nao hay hoac neu ma khong chua con can phai theo tren duoi sau truoc hoi cho biet ' +
    'xin vui long giup toi minh ban em anh chi').split(' '),
)

export function tachTu(s: string): string[] {
  return boDau(s).replace(/[^a-z0-9.,/-]+/g, ' ').split(/\s+/)
    .map((t) => t.replace(/^[.,/-]+|[.,/-]+$/g, ''))
    .filter((t) => t.length >= 2 && !TU_DUNG.has(t))
}

function demTu(s: string): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of tachTu(s)) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

/** Tách văn bản PDF có mốc "[Trang n]" thành từng trang. */
function theoTrang(text: string): { viTri: string; noiDung: string }[] {
  const phan = text.split(/\[Trang (\d+)\]/)
  if (phan.length < 3) return [{ viTri: '', noiDung: text }]
  const out: { viTri: string; noiDung: string }[] = []
  for (let i = 1; i < phan.length; i += 2) out.push({ viTri: `trang ${phan[i]}`, noiDung: phan[i + 1] ?? '' })
  return out
}

function catDoan(s: string, max: number): string[] {
  const sach = s.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (!sach) return []
  const out: string[] = []
  let buf = ''
  for (const p of sach.split(/\n+/)) {
    if (buf && buf.length + p.length + 1 > max) { out.push(buf); buf = '' }
    if (p.length > max) { for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max)); continue }
    buf = buf ? `${buf}\n${p}` : p
  }
  if (buf) out.push(buf)
  return out
}

async function bocNoiDung(goc: string, f: FileHoSo): Promise<{ viTri: string; noiDung: string }[]> {
  const buf = await readFile(path.join(goc, f.duongDanTuongDoi))
  if (['xls', 'xlsx', 'xlsm'].includes(f.duoi)) {
    const wb = XLSX.read(buf, { type: 'buffer', cellFormula: false, cellNF: false, sheetStubs: false })
    return wb.SheetNames.map((ten) => ({
      viTri: `sheet "${ten}"`,
      // CSV giữ cấu trúc hàng/cột đủ để model đọc bảng khối lượng/dự toán.
      noiDung: XLSX.utils.sheet_to_csv(wb.Sheets[ten], { blankrows: false, strip: true }).replace(/,{3,}/g, ',,'),
    }))
  }
  if (f.duoi === 'txt' || f.duoi === 'md' || f.duoi === 'csv') return [{ viTri: '', noiDung: buf.toString('utf8') }]
  const { extractText } = await import('@/lib/rag/extract')
  const { text } = await extractText(buf, f.ten)
  return theoTrang(text || '')
}

const DOC_DUOC = ['pdf', 'docx', 'xls', 'xlsx', 'xlsm', 'txt', 'md', 'csv']

async function taoChiMuc(dir: string, chuKy: string, files: FileHoSo[]): Promise<ChiMuc> {
  const G = GIOI_HAN_HOI_DAP
  const doan: Doan[] = []
  const tep: TepChiMuc[] = []
  let soDoc = 0, tongByte = 0, tongKyTu = 0

  // Ưu tiên văn bản có giá trị hỏi đáp cao trước (tờ trình, thuyết minh, pháp lý, dự toán).
  const thuTu = ['TO_TRINH', 'THUYET_MINH', 'PHAP_LY', 'DU_TOAN', 'KHAO_SAT', 'NANG_LUC', 'KHAC', 'BAN_VE']
  const sx = [...files].sort((a, b) => thuTu.indexOf(a.nhom) - thuTu.indexOf(b.nhom))

  for (const f of sx) {
    const base: TepChiMuc = { tep: f.duongDanTuongDoi, nhom: NHAN_NHOM[f.nhom as keyof typeof NHAN_NHOM] ?? f.nhom, kichThuoc: f.kichThuoc, trangThai: 'bo-qua' }
    if (!DOC_DUOC.includes(f.duoi)) { tep.push({ ...base, ghiChu: f.duoi === 'doc' ? 'Word .doc cũ — chưa đọc được' : `định dạng .${f.duoi} không đọc chữ` }); continue }
    if (f.kichThuoc > G.kichThuocTepDoc) { tep.push({ ...base, ghiChu: 'tệp quá lớn để đọc nội dung' }); continue }
    if (soDoc >= G.soTepDoc || tongByte + f.kichThuoc > G.tongByteDoc || tongKyTu >= G.kyTuMoiChiMuc) {
      tep.push({ ...base, ghiChu: 'vượt trần số tệp/dung lượng đọc' }); continue
    }
    soDoc++; tongByte += f.kichThuoc
    try {
      const phan = await bocNoiDung(dir, f)
      let kyTu = 0
      for (const p of phan) {
        for (const nd of catDoan(p.noiDung, G.kyTuDoan)) {
          if (kyTu >= G.kyTuMoiTep || tongKyTu >= G.kyTuMoiChiMuc) break
          kyTu += nd.length; tongKyTu += nd.length
          doan.push({ id: doan.length, tep: f.duongDanTuongDoi, viTri: p.viTri, noiDung: nd, tu: demTu(nd), chuoiBoDau: boDau(nd) })
        }
      }
      tep.push(kyTu > 0
        ? { ...base, trangThai: 'da-doc' }
        : { ...base, trangThai: 'khong-doc-duoc', ghiChu: 'không có lớp chữ (nhiều khả năng là bản scan)' })
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      tep.push({ ...base, trangThai: 'khong-doc-duoc', ghiChu: /scan|lớp văn bản/i.test(m) ? 'bản scan, chưa có lớp chữ' : `lỗi đọc: ${m.slice(0, 120)}` })
    }
  }

  const df = new Map<string, number>()
  for (const d of doan) for (const t of d.tu.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  return { chuKy, doan, tep, df, taoLuc: Date.now() }
}

/** Lấy chỉ mục của thư mục (dựng mới nếu tệp đã đổi). Nhiều câu hỏi cùng lúc dùng chung 1 lần dựng. */
export async function layChiMuc(dir: string): Promise<ChiMuc> {
  const quet = await quetThuMuc(dir, dir)
  const chuKy = quet.files.map((f) => `${f.duongDanTuongDoi}|${f.kichThuoc}|${f.sua}`).join('\n')
  const coSan = cache.get(dir)
  if (coSan && coSan.chuKy === chuKy) { cache.delete(dir); cache.set(dir, coSan); return coSan }

  const khoa = `${dir}\n${chuKy}`
  let p = dangTao.get(khoa)
  if (!p) {
    p = taoChiMuc(dir, chuKy, quet.files).finally(() => dangTao.delete(khoa))
    dangTao.set(khoa, p)
  }
  const cm = await p
  cache.set(dir, cm)
  while (cache.size > GIOI_HAN_HOI_DAP.soChiMucCache) cache.delete(cache.keys().next().value as string)
  return cm
}

/** Chấm điểm đoạn theo câu hỏi: TF-IDF (log) + thưởng khi khớp nguyên cụm 2 từ liền nhau + tên tệp. */
export function timDoan(cm: ChiMuc, cauHoi: string, k: number = GIOI_HAN_HOI_DAP.soDoanGui): Doan[] {
  const tuHoi = [...new Set(tachTu(cauHoi))]
  if (!tuHoi.length || !cm.doan.length) return []
  const N = cm.doan.length
  const idf = new Map(tuHoi.map((t) => [t, Math.log(1 + N / (1 + (cm.df.get(t) ?? 0)))]))
  const cumTu = tuHoi.slice(0, -1).map((t, i) => `${t} ${tuHoi[i + 1]}`)

  const diem = cm.doan.map((d) => {
    let s = 0
    for (const t of tuHoi) {
      const tf = d.tu.get(t)
      if (tf) s += (1 + Math.log(tf)) * (idf.get(t) ?? 0)
    }
    for (const c of cumTu) if (d.chuoiBoDau.includes(c)) s += 1.5
    const tenTep = boDau(d.tep)
    for (const t of tuHoi) if (tenTep.includes(t)) s += 0.5
    return { d, s }
  }).filter((x) => x.s > 0)

  diem.sort((a, b) => b.s - a.s)
  // Không để 1 tệp chiếm hết chỗ: tối đa 4 đoạn/tệp.
  const out: Doan[] = []
  const demTep = new Map<string, number>()
  let kyTu = 0
  for (const { d } of diem) {
    if (out.length >= k) break
    if ((demTep.get(d.tep) ?? 0) >= 4) continue
    if (kyTu + d.noiDung.length > GIOI_HAN_HOI_DAP.kyTuNguCanhToiDa) continue
    demTep.set(d.tep, (demTep.get(d.tep) ?? 0) + 1)
    kyTu += d.noiDung.length
    out.push(d)
  }
  return out
}
