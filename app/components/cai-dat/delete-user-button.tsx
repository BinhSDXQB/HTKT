'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  userId: string
  userName: string
  isAdmin?: boolean
}

export function DeleteUserButton({ userId, userName, isAdmin = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/cai-dat/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Đã xoá người dùng')
        window.location.reload()
      } else {
        toast.error(data.error || 'Lỗi xoá người dùng')
      }
    } catch (err) {
      toast.error('Lỗi kết nối')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isAdmin) {
    return (
      <button disabled className="text-xs text-slate-300 cursor-not-allowed" title="Chỉ admin mới có quyền xoá">
        Xoá
      </button>
    )
  }

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg border p-5 max-w-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Xoá người dùng?</h3>
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn xoá người dùng <b>{userName}</b>? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              className="px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Đang xoá...' : 'Xoá'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="text-xs text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
    >
      Xoá
    </button>
  )
}
