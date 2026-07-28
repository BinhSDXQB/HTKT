import { headers } from 'next/headers'
import { listNghiepVu } from '@/app/actions/nghiep-vu'
import { getNghiepVuSchema } from '@/lib/nghiep-vu/schema'
import { NghiepVuModule } from './nghiep-vu-module'

// Bọc server cho module nghiệp vụ: lấy lĩnh vực từ pathname (middleware set header
// 'x-pathname') và nạp sẵn dữ liệu NGAY trên server → module hiện dữ liệu ở lần
// render đầu, bỏ vòng gọi server action phía client (loại bỏ spinner "tải lâu").
// Nếu không có header (route không qua middleware) → để module tự nạp như cũ.

function deriveLinhVuc(pathname: string): string {
  return pathname.replace(/^\/dashboard\//, '').replace(/\/$/, '')
}

export async function NghiepVuSection() {
  const pathname = (await headers()).get('x-pathname') ?? ''
  const linhVuc = pathname ? deriveLinhVuc(pathname) : ''

  // Không suy được lĩnh vực hoặc lĩnh vực chưa có schema → fallback nạp phía client.
  if (!linhVuc || !getNghiepVuSchema(linhVuc)) {
    return <NghiepVuModule />
  }

  const initialRecords = await listNghiepVu(linhVuc)
  return <NghiepVuModule linhVuc={linhVuc} initialRecords={initialRecords} />
}
