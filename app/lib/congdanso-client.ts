import 'server-only'
import { db } from '@/lib/db'

export type CongDanSoConfig = {
  enabled: boolean
  apiUrl: string
  clientId: string
  clientSecret: string
  tokenEndpoint: string
  syncEndpoint: string
  domainFilter: string[]
  syncIntervalH: number
  lastSyncAt: string
}

// Lĩnh vực HTKT cần đồng bộ
export const HTKT_DOMAINS = [
  'GIAO_THONG',
  'XAY_DUNG',
  'HA_TANG_KY_THUAT',
  'CAP_NUOC',
  'THOAT_NUOC',
  'CHIEU_SANG',
  'CAY_XANH',
]

// Map từ lĩnh vực Cổng Công dân → lĩnh vực HTKT
export const DOMAIN_MAP: Record<string, string> = {
  'GIAO_THONG':        'GIAO_THONG',
  'XAY_DUNG':          'GIAO_THONG',
  'HA_TANG_KY_THUAT':  'GIAO_THONG',
  'CAP_NUOC':          'CAP_NUOC',
  'THOAT_NUOC':        'THOAT_NUOC',
  'CHIEU_SANG':        'CHIEU_SANG',
  'CAY_XANH':          'CAY_XANH',
}

export async function getIntegrationConfig(): Promise<CongDanSoConfig> {
  const configs = await db.integrationConfig.findMany({
    where: { key: { startsWith: 'congdanso.' } },
  })
  const map = Object.fromEntries(configs.map(c => [c.key.replace('congdanso.', ''), c.value]))
  return {
    enabled:       map.enabled === 'true',
    apiUrl:        map.apiUrl ?? 'https://quantri-congdanso.quangtri.gov.vn/ctz-api',
    clientId:      map.clientId ?? '',
    clientSecret:  map.clientSecret ?? '',
    tokenEndpoint: map.tokenEndpoint ?? '/auth/token',
    syncEndpoint:  map.syncEndpoint ?? '/phan-anh',
    domainFilter:  (map.domainFilter ?? '').split(',').map(s => s.trim()).filter(Boolean),
    syncIntervalH: parseInt(map.syncIntervalH ?? '6'),
    lastSyncAt:    map.lastSyncAt ?? '',
  }
}

export async function saveIntegrationConfig(partial: Partial<CongDanSoConfig>): Promise<void> {
  const updates: { key: string; value: string }[] = []
  if (partial.enabled !== undefined)      updates.push({ key: 'congdanso.enabled',       value: String(partial.enabled) })
  if (partial.apiUrl !== undefined)       updates.push({ key: 'congdanso.apiUrl',         value: partial.apiUrl })
  if (partial.clientId !== undefined)     updates.push({ key: 'congdanso.clientId',       value: partial.clientId })
  if (partial.clientSecret !== undefined) updates.push({ key: 'congdanso.clientSecret',   value: partial.clientSecret })
  if (partial.tokenEndpoint !== undefined)updates.push({ key: 'congdanso.tokenEndpoint',  value: partial.tokenEndpoint })
  if (partial.syncEndpoint !== undefined) updates.push({ key: 'congdanso.syncEndpoint',   value: partial.syncEndpoint })
  if (partial.domainFilter !== undefined) updates.push({ key: 'congdanso.domainFilter',   value: partial.domainFilter.join(',') })
  if (partial.syncIntervalH !== undefined)updates.push({ key: 'congdanso.syncIntervalH',  value: String(partial.syncIntervalH) })
  if (partial.lastSyncAt !== undefined)   updates.push({ key: 'congdanso.lastSyncAt',     value: partial.lastSyncAt })

  for (const u of updates) {
    await db.integrationConfig.upsert({
      where: { key: u.key },
      update: { value: u.value },
      create: { key: u.key, value: u.value },
    })
  }
}

// ── Lấy access token ──────────────────────────────────────────────────────────
let _cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(cfg: CongDanSoConfig): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt - 30000) {
    return _cachedToken.token
  }

  const url = `${cfg.apiUrl}${cfg.tokenEndpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      grantType: 'client_credentials',
    }),
  })

  if (!res.ok) {
    // Thử form-urlencoded (một số API dùng)
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: 'client_credentials',
      }),
    })
    if (!res2.ok) throw new Error(`Auth failed: ${res2.status} ${await res2.text()}`)
    const data = await res2.json()
    const token = data.access_token ?? data.accessToken ?? data.token
    const expiresIn = (data.expires_in ?? data.expiresIn ?? 3600) * 1000
    _cachedToken = { token, expiresAt: Date.now() + expiresIn }
    return token
  }

  const data = await res.json()
  const token = data.access_token ?? data.accessToken ?? data.token
  const expiresIn = (data.expires_in ?? data.expiresIn ?? 3600) * 1000
  _cachedToken = { token, expiresAt: Date.now() + expiresIn }
  return token
}

// ── Test kết nối ──────────────────────────────────────────────────────────────
export async function testConnection(cfg: CongDanSoConfig): Promise<{ ok: boolean; message: string; domains?: string[] }> {
  if (!cfg.clientId || !cfg.clientSecret) {
    return { ok: false, message: 'Chưa nhập Client ID và Client Secret' }
  }
  try {
    const token = await getAccessToken(cfg)
    if (!token) return { ok: false, message: 'Không lấy được access token' }

    // Thử gọi API lấy danh sách lĩnh vực
    const domainRes = await fetch(`${cfg.apiUrl}/linh-vuc`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    let domains: string[] = []
    if (domainRes.ok) {
      const d = await domainRes.json()
      domains = Array.isArray(d) ? d.map((x: Record<string,unknown>) => String(x.code ?? x.id ?? x.name)) : []
    }

    return { ok: true, message: `Kết nối thành công! Token hợp lệ.`, domains }
  } catch (e) {
    return { ok: false, message: `Lỗi: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// ── Phản ánh / Sự cố từ Cổng Công dân ───────────────────────────────────────
export type CongDanSoIncident = {
  id: string
  code: string
  title: string
  description?: string
  domain: string       // lĩnh vực gốc từ cổng
  address?: string
  wardName?: string
  priority?: string
  status: string
  reportedAt: string
  reporterName?: string
  reporterPhone?: string
  latitude?: number
  longitude?: number
}

export async function fetchIncidents(
  cfg: CongDanSoConfig,
  fromDate?: Date,
  page = 0,
  size = 50,
): Promise<{ items: CongDanSoIncident[]; total: number }> {
  const token = await getAccessToken(cfg)

  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    linhVuc: cfg.domainFilter.join(','),
  })
  if (fromDate) params.set('fromDate', fromDate.toISOString().split('T')[0])

  const url = `${cfg.apiUrl}${cfg.syncEndpoint}?${params}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  const data = await res.json()

  // Chuẩn hoá response (API có thể trả về nhiều format)
  const raw = Array.isArray(data) ? data : (data.content ?? data.data ?? data.items ?? [])
  const total = data.totalElements ?? data.total ?? raw.length

  const items: CongDanSoIncident[] = raw.map((r: Record<string, unknown>) => ({
    id:            String(r.id ?? r.maPhananh ?? ''),
    code:          String(r.code ?? r.maPhananh ?? r.id ?? ''),
    title:         String(r.title ?? r.tieuDe ?? r.noidung ?? ''),
    description:   String(r.description ?? r.moTa ?? r.noiDungChiTiet ?? ''),
    domain:        String(r.linhVuc ?? r.domain ?? r.category ?? ''),
    address:       String(r.address ?? r.diaChi ?? ''),
    wardName:      String(r.wardName ?? r.tenPhuongXa ?? r.phuongXa ?? ''),
    priority:      String(r.priority ?? r.mucDo ?? r.uuTien ?? 'TRUNG'),
    status:        String(r.status ?? r.trangThai ?? 'MOI'),
    reportedAt:    String(r.reportedAt ?? r.thoiGianPhanAnh ?? r.ngayTao ?? new Date().toISOString()),
    reporterName:  String(r.reporterName ?? r.nguoiPhanAnh ?? r.tenNguoiGui ?? ''),
    reporterPhone: String(r.reporterPhone ?? r.soDienThoai ?? ''),
    latitude:      typeof r.latitude === 'number' ? r.latitude : (typeof r.lat === 'number' ? r.lat : undefined),
    longitude:     typeof r.longitude === 'number' ? r.longitude : (typeof r.lng === 'number' ? r.lng : undefined),
  }))

  return { items, total }
}

// ── Đồng bộ vào DB HTKT ──────────────────────────────────────────────────────
export async function syncToHTKT(
  cfg: CongDanSoConfig,
  importedById: string,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const fromDate = cfg.lastSyncAt ? new Date(cfg.lastSyncAt) : undefined
  const { items } = await fetchIncidents(cfg, fromDate)

  let created = 0, skipped = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      // Kiểm tra đã tồn tại chưa (theo mã phản ánh từ cổng)
      const existing = await db.incident.findFirst({
        where: { description: { contains: `[CDS:${item.id}]` } },
      })
      if (existing) { skipped++; continue }

      // Map domain
      const htktDomain = DOMAIN_MAP[item.domain] ?? 'GIAO_THONG'

      // Map priority
      const priority = (['THAP','TRUNG','CAO','KHAN_CAP'].includes(item.priority ?? '')
        ? item.priority : 'TRUNG') as 'THAP' | 'TRUNG' | 'CAO' | 'KHAN_CAP'

      // Tạo sự cố trong HTKT
      await db.incident.create({
        data: {
          incidentCode:  `CDS-${item.code || item.id}`,
          title:         item.title || `Phản ánh từ Cổng Công dân số`,
          description:   `[CDS:${item.id}] ${item.description || ''}`.trim(),
          source:        'PHAN_ANH_CD',
          domain:        htktDomain as never,
          address:       item.address || null,
          reporterName:  item.reporterName || null,
          reporterPhone: item.reporterPhone || null,
          priority:      priority as never,
          status:        'MOI',
          latitude:      item.latitude ?? null,
          longitude:     item.longitude ?? null,
          reportedById:  importedById,
          reportedAt:    new Date(item.reportedAt),
        },
      })
      created++
    } catch (e) {
      errors.push(`${item.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Cập nhật lastSyncAt
  await saveIntegrationConfig({ lastSyncAt: new Date().toISOString() })

  // Ghi log
  await db.integrationLog.create({
    data: {
      source:      'congdanso',
      action:      'sync',
      status:      errors.length === 0 ? 'success' : created > 0 ? 'partial' : 'error',
      message:     `Tạo: ${created}, Bỏ qua: ${skipped}, Lỗi: ${errors.length}`,
      recordCount: created,
    },
  })

  return { created, skipped, errors }
}
