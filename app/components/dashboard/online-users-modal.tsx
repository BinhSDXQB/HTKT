'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

type OnlineUser = {
  id: string
  name: string
  email: string
  lastLoginAt: string
  role: { displayName: string }
  toChuc: { ten: string; tenVietTat: string | null } | null
}

type OnlineUsersData = {
  online: OnlineUser[]
  count: number
  timestamp: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function OnlineUsersModal({ isOpen, onClose }: Props) {
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/stats/users/online', {
          cache: 'no-store',
        })
        if (res.ok) {
          const data: OnlineUsersData = await res.json()
          setUsers(data.online)
        }
      } catch (error) {
        console.error('Failed to fetch online users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    // Cập nhật mỗi 30s khi modal mở
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Người dùng đang truy cập</h2>
                <p className="text-sm text-slate-500">{users.length} người đang online</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-500">
                Không có người dùng đang online
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {user.role.displayName}
                          </span>
                          {user.toChuc && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                              {user.toChuc.tenVietTat || user.toChuc.ten}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(user.lastLoginAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                        <span className="inline-flex w-2 h-2 bg-green-500 rounded-full mt-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 text-center">
            Cập nhật tự động mỗi 30 giây · Tính theo truy cập trong 15 phút gần đây
          </div>
        </div>
      </div>
    </>
  )
}
