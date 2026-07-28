import { NextResponse } from 'next/server'
import { getCurrentUser, canAccessOffice, canViewOfficeSensitive } from '@/lib/auth'
import { getCanhBaoCount } from '@/lib/canh-bao-count'

// Badge chuông cảnh báo trên header — trả số người cần xử lý cho người có quyền VP Sở.
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canAccessOffice(user)) {
      return NextResponse.json({ count: 0 })
    }
    const count = await getCanhBaoCount(canViewOfficeSensitive(user))
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
