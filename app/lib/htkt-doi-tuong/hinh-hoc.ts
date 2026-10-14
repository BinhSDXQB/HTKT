import 'server-only'
import { readFile } from 'fs/promises'
import path from 'path'

// Hình học GeoJSON cho bảng trung tâm HTKT (chưa có PostGIS). Chiều dài/diện tích/tâm do trigger CSDL tính;
// ở đây chỉ: kiểm cấu trúc trước khi ghi và tính % đỉnh nằm NGOÀI ranh xã (ranh lấy từ
// public/data/admin-boundaries.geojson, khoá `code` = mã ĐVHC = htkt_doi_tuong.ma_xa).

export type Pos = [number, number]
export type HinhHoc =
  | { type: 'Point'; coordinates: Pos }
  | { type: 'MultiPoint' | 'LineString'; coordinates: Pos[] }
  | { type: 'MultiLineString' | 'Polygon'; coordinates: Pos[][] }
  | { type: 'MultiPolygon'; coordinates: Pos[][][] }

const KHUNG = { lngMin: 105.4, lngMax: 107.8, latMin: 15.9, latMax: 18.3 }   // trùng trigger fn_htkt_truoc_ghi

export function cacDinh(g: HinhHoc): Pos[] {
  switch (g.type) {
    case 'Point': return [g.coordinates]
    case 'MultiPoint': case 'LineString': return g.coordinates
    case 'MultiLineString': case 'Polygon': return g.coordinates.flat()
    case 'MultiPolygon': return g.coordinates.flat(2)
  }
}

const laPos = (p: unknown): p is Pos =>
  Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[0]) && Number.isFinite(p[1])

/** Kiểm & làm sạch GeoJSON từ form/Excel. Trả thông báo lỗi tiếng Việt nếu không hợp lệ. */
export function kiemHinhHoc(raw: unknown): { ok: true; g: HinhHoc } | { ok: false; loi: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, loi: 'Hình học không hợp lệ' }
  const g = raw as { type?: string; coordinates?: unknown }
  const c = g.coordinates
  const mang = (x: unknown): x is unknown[] => Array.isArray(x)
  let hop = false
  switch (g.type) {
    case 'Point': hop = laPos(c); break
    case 'MultiPoint': hop = mang(c) && c.length >= 1 && c.every(laPos); break
    case 'LineString': hop = mang(c) && c.length >= 2 && c.every(laPos); break
    case 'MultiLineString': hop = mang(c) && c.length >= 1 && c.every((l) => mang(l) && l.length >= 2 && l.every(laPos)); break
    case 'Polygon': hop = mang(c) && c.length >= 1 && c.every((r) => mang(r) && r.length >= 4 && r.every(laPos)); break
    case 'MultiPolygon': hop = mang(c) && c.length >= 1 && c.every((p) => mang(p) && p.every((r) => mang(r) && r.length >= 4 && r.every(laPos))); break
    default: return { ok: false, loi: `Kiểu hình học "${g.type}" không hỗ trợ` }
  }
  if (!hop) return { ok: false, loi: `Toạ độ ${g.type} không đủ hoặc sai cấu trúc` }
  const hh = { type: g.type, coordinates: c } as HinhHoc
  const ngoai = cacDinh(hh).find(([x, y]) => x < KHUNG.lngMin || x > KHUNG.lngMax || y < KHUNG.latMin || y > KHUNG.latMax)
  if (ngoai) {
    const dao = ngoai[1] >= KHUNG.lngMin && ngoai[1] <= KHUNG.lngMax && ngoai[0] >= KHUNG.latMin && ngoai[0] <= KHUNG.latMax
    return { ok: false, loi: dao ? 'Toạ độ bị đảo: phải là [kinh độ, vĩ độ] (vd 106.6, 17.4)' : 'Có điểm nằm ngoài phạm vi tỉnh Quảng Trị (cần toạ độ WGS84, không phải VN-2000)' }
  }
  // Polygon: tự khép vòng nếu thiếu điểm cuối
  if (hh.type === 'Polygon') hh.coordinates = hh.coordinates.map(dongVong)
  if (hh.type === 'MultiPolygon') hh.coordinates = hh.coordinates.map((p) => p.map(dongVong))
  return { ok: true, g: hh }
}

function dongVong(r: Pos[]): Pos[] {
  const a = r[0], b = r[r.length - 1]
  return a[0] === b[0] && a[1] === b[1] ? r : [...r, a]
}

/** Đọc danh sách "x,y" / "y,x" / dòng mới / ";" thành mảng [lng, lat] (tự nhận đảo nếu số đầu là vĩ độ). */
export function docToaDo(text: string): Pos[] {
  const so = (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const out: Pos[] = []
  for (let i = 0; i + 1 < so.length; i += 2) {
    const [a, b] = [so[i], so[i + 1]]
    out.push(a < 30 && b > 100 ? [b, a] : [a, b])   // "17.4, 106.6" (Google Maps) → [106.6, 17.4]
  }
  return out
}

// ── Ranh giới xã ───────────────────────────────────────────────────────────────────────────────────────
type Ranh = { bbox: [number, number, number, number]; polys: Pos[][][] }
let cacheRanh: Map<string, Ranh> | null = null

async function napRanh(): Promise<Map<string, Ranh>> {
  if (cacheRanh) return cacheRanh
  const raw = await readFile(path.join(process.cwd(), 'public', 'data', 'admin-boundaries.geojson'), 'utf8')
  const fc = JSON.parse(raw) as { features: { properties: { code: string; bbox?: [number, number, number, number] }; geometry: { type: string; coordinates: unknown } }[] }
  const m = new Map<string, Ranh>()
  for (const f of fc.features) {
    const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Pos[][][]
    const pts = polys.flat(2)
    const bbox = f.properties.bbox ?? [
      Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])),
      Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])),
    ]
    m.set(String(f.properties.code), { bbox, polys })
  }
  cacheRanh = m
  return m
}

function trongVong(p: Pos, ring: Pos[]): boolean {
  let trong = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) trong = !trong
  }
  return trong
}

function trongRanh(p: Pos, r: Ranh): boolean {
  const [x0, y0, x1, y1] = r.bbox
  if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1) return false
  return r.polys.some((poly) => trongVong(p, poly[0]) && !poly.slice(1).some((hole) => trongVong(p, hole)))
}

/** % số đỉnh nằm ngoài ranh xã (0–100, 1 chữ số thập phân); null nếu không có ranh của mã xã đó. */
export async function phanTramNgoaiRanh(g: HinhHoc, maXa: string): Promise<number | null> {
  const r = (await napRanh()).get(maXa)
  if (!r) return null
  const ds = cacDinh(g)
  if (!ds.length) return null
  const ngoai = ds.filter((p) => !trongRanh(p, r)).length
  return Math.round((ngoai / ds.length) * 1000) / 10
}

/** Mã xã chứa điểm (dùng gợi ý khi người dùng vẽ nhầm sang xã khác). */
export async function xaChuaDiem(p: Pos): Promise<string | null> {
  for (const [ma, r] of await napRanh()) if (trongRanh(p, r)) return ma
  return null
}
