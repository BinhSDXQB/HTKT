'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  userId: string
  userName: string
  isActive: boolean
  isAdmin?: boolean
}

/** Khoá/mở khoá đăng nhập (isActive) — hành động CHÍNH để loại 1 tài khoản khỏi hệ thống,
 * giữ nguyên toàn bộ hồ sơ/dữ liệu. Ưu tiên dùng thay vì xoá vĩnh viễn. */
export function LockUserButton({ userId, userName, isActive, isAdmin = false }: Props) {
  const [busy, setBusy] = useState(false)

  const handleToggle = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/cai-dat/users/${userId}`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        toast.success(isActive ? `Đã khoá tài khoản ${userName}` : `Đã mở khoá tài khoản ${userName}`)
        window.location.reload()
      } else {
        toast.error(data.error || 'Lỗi khoá/mở khoá tài khoản')
      }
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) return null

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      title={isActive ? 'Khoá đăng nhập (giữ nguyên hồ sơ)' : 'Mở khoá đăng nhập'}
      className={`inline-flex items-center gap-1 text-xs hover:underline transition disabled:opacity-50 ${
        isActive ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'
      }`}
    >
      {isActive ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
      {busy ? '...' : isActive ? 'Khoá' : 'Mở khoá'}
    </button>
  )
}
