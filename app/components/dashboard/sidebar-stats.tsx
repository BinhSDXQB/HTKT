'use client'

import { useEffect, useState } from 'react'
import { Users, Activity, UserCheck } from 'lucide-react'
import { OnlineUsersModal } from './online-users-modal'

type StatsData = {
  online: number
  today: number
  total: number
  timestamp: string
}

export function SidebarStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats/users', {
          cache: 'no-store',
        })
        if (res.ok) {
          setStats(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Cập nhật mỗi 1 phút
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) {
    return null
  }

  return (
    <>
      <div className="px-3 py-2 space-y-1.5">
        {/* Online */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer group"
        >
          <Activity className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs text-slate-400">Đang truy cập</p>
            <p className="text-sm font-semibold text-white">{stats.online} người</p>
          </div>
          <span className="text-xs text-slate-500 group-hover:text-slate-400 shrink-0">→</span>
        </button>

        {/* Hôm nay */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <UserCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Hôm nay</p>
            <p className="text-sm font-semibold text-white">{stats.today} người</p>
          </div>
        </div>

        {/* Tổng */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Tổng người dùng</p>
            <p className="text-sm font-semibold text-white">{stats.total} người</p>
          </div>
        </div>
      </div>

      <OnlineUsersModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
