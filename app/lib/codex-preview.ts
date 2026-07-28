/**
 * CODEX: Dynamic Content Preview Generator
 * Auto-detect & generate previews cho tất cả content types
 */

export type ContentType = 'dvhc' | 'to-chuc' | 'user' | 'document' | 'report' | 'page'

export interface ContentPreview {
  id: string
  type: ContentType
  title: string
  description?: string
  thumbnail?: string
  metadata: Record<string, any>
  tags: string[]
  url: string
  cachedAt: Date
  expiresAt: Date
}

export interface PreviewConfig {
  cacheSeconds: number
  maxMetadataSize: number
  includeRelations: boolean
}

const DEFAULT_CONFIG: PreviewConfig = {
  cacheSeconds: 3600, // 1 giờ
  maxMetadataSize: 5000,
  includeRelations: true,
}

/**
 * Generate preview cho ĐVHC (Đơn vị hành chính)
 */
export function generateDVHCPreview(dvhc: any): Omit<ContentPreview, 'cachedAt' | 'expiresAt'> {
  return {
    id: dvhc.id,
    type: 'dvhc',
    title: dvhc.name,
    description: `${dvhc.type} • Dân số: ${dvhc.danSo?.toLocaleString('vi-VN')} • Diện tích: ${dvhc.dienTichKm2} km²`,
    metadata: {
      code: dvhc.code,
      type: dvhc.type,
      danSo: dvhc.danSo,
      dienTichKm2: dvhc.dienTichKm2,
      location: dvhc.centerLat && dvhc.centerLon ? { lat: dvhc.centerLat, lon: dvhc.centerLon } : null,
      status: dvhc.isActive ? 'Hoạt động' : 'Không hoạt động',
    },
    tags: ['ĐVHC', dvhc.type, dvhc.name.split(' ')[0]],
    url: `/dashboard/phong-htkt/don-vi-hanh-chinh?id=${dvhc.id}`,
  }
}

/**
 * Generate preview cho Tổ chức (ToChuc)
 */
export function generateToChucPreview(toChuc: any): Omit<ContentPreview, 'cachedAt' | 'expiresAt'> {
  return {
    id: toChuc.id,
    type: 'to-chuc',
    title: toChuc.ten,
    description: `${toChuc.loai} • Mã: ${toChuc.ma}${toChuc.maSoThue ? ' • MST: ' + toChuc.maSoThue : ''}`,
    metadata: {
      ma: toChuc.ma,
      loai: toChuc.loai,
      maSoThue: toChuc.maSoThue,
      cap: toChuc.cap,
      isActive: toChuc.isActive,
      moTa: toChuc.moTa,
    },
    tags: ['ToChuc', toChuc.loai, toChuc.ma],
    url: `/admin/to-chuc/${toChuc.id}`,
  }
}

/**
 * Generate preview cho User
 */
export function generateUserPreview(user: any): Omit<ContentPreview, 'cachedAt' | 'expiresAt'> {
  return {
    id: user.id,
    type: 'user',
    title: user.name,
    description: `${user.email}${user.toChuc ? ' • ' + user.toChuc.ten : ''}`,
    metadata: {
      email: user.email,
      phone: user.phone,
      role: user.role?.displayName,
      toChuc: user.toChuc?.ten,
      isActive: user.isActive,
      lastLogin: user.lastLoginAt,
    },
    tags: ['User', user.role?.name, user.email.split('@')[0]],
    url: `/admin/users/${user.id}`,
  }
}

/**
 * Detect content type từ data shape
 */
export function detectContentType(data: any): ContentType {
  if (data.dienTichKm2 !== undefined || data.danSo !== undefined) return 'dvhc'
  if (data.ma && data.loai && data.ten) return 'to-chuc'
  if (data.email && data.role) return 'user'
  if (data.content || data.markdown) return 'document'
  if (data.reportType || data.status === 'completed') return 'report'
  return 'page'
}

/**
 * Auto-generate preview - detect type + create preview
 */
export async function generatePreview(
  id: string,
  data: any,
  config: Partial<PreviewConfig> = {}
): Promise<ContentPreview> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const type = detectContentType(data)

  let preview: Omit<ContentPreview, 'cachedAt' | 'expiresAt'>

  switch (type) {
    case 'dvhc':
      preview = generateDVHCPreview(data)
      break
    case 'to-chuc':
      preview = generateToChucPreview(data)
      break
    case 'user':
      preview = generateUserPreview(data)
      break
    default:
      preview = {
        id,
        type: 'page',
        title: data.title || 'Unnamed',
        description: data.description,
        metadata: data,
        tags: [],
        url: '/',
      }
  }

  const now = new Date()
  return {
    ...preview,
    cachedAt: now,
    expiresAt: new Date(now.getTime() + cfg.cacheSeconds * 1000),
  }
}

/**
 * Check nếu preview expired
 */
export function isPreviewExpired(preview: ContentPreview): boolean {
  return new Date() > preview.expiresAt
}

/**
 * Format preview cho display
 */
export function formatPreviewForDisplay(preview: ContentPreview): string {
  return `
📌 **${preview.title}**
${preview.description ? `${preview.description}\n` : ''}
🏷️  Tags: ${preview.tags.join(', ')}
🔗 Link: ${preview.url}
  `.trim()
}
