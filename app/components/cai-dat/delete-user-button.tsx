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
        Xoá vĩnh viễn
      </button>
    )
  }

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg border p-5 max-w-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Xoá VĨNH VIỄN người dùng?</h3>
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn xoá <b>{userName}</b>? Hành động này <b>KHÔNG THỂ KHÔI PHỤC</b> (xoá cả nhật ký hoạt động).
            Nếu chỉ cần loại tài khoản khỏi hệ thống mà vẫn giữ dữ liệu (VD đơn vị chuyển đi, nghỉ việc), hãy dùng nút <b>&quot;Khoá&quot;</b> thay vì xoá.
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
              {isDeleting ? 'Đang xoá...' : 'Xoá vĩnh viễn'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="text-xs text-slate-400 hover:text-red-600 hover:underline transition cursor-pointer"
    >
      Xoá vĩnh viễn
    </button>
  )
}
