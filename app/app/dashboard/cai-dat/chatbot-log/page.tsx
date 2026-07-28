import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MessageSquare, ThumbsUp, ThumbsDown, Users, AlertTriangle, TrendingUp, GraduationCap } from 'lucide-react'

export default async function ChatbotLogPage() {
  const user = await requireAuth()
  if (user.role.name !== 'admin') redirect('/forbidden')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    tongTatCa, tongThang, tongHomNay,
    tongLike, tongDislike, tongChuaDanhGia,
    caSo, caPhuong,
    dislikeLogs,
    tongNguoiDung,
    learnedLogs,
  ] = await Promise.all([
    db.chatbotLog.count(),
    db.chatbotLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.chatbotLog.count({ where: { createdAt: { gte: startOfToday } } }),
    db.chatbotLog.count({ where: { feedback: 'LIKE' } }),
    db.chatbotLog.count({ where: { feedback: 'DISLIKE' } }),
    db.chatbotLog.count({ where: { feedback: null } }),
    db.chatbotLog.count({ where: { isWardUser: false } }),
    db.chatbotLog.count({ where: { isWardUser: true } }),

    // Các câu trả lời bị đánh giá sai — để admin xem xét
    db.chatbotLog.findMany({
      where: { feedback: 'DISLIKE' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { feedbackAt: 'desc' },
      take: 20,
    }),

    // Số người dùng unique đã dùng chatbot
    db.chatbotLog.findMany({
      distinct: ['userId'],
      select: { userId: true },
    }).then(r => r.length),

    // Kiến thức đã học: câu trả lời được 👍 và KHÔNG dùng tool dữ liệu (chatbot tái sử dụng)
    db.chatbotLog.findMany({
      where: { feedback: 'LIKE', toolsUsed: { isEmpty: true } },
      orderBy: { feedbackAt: 'desc' },
      take: 30,
    }),
  ])

  const pctHaiLong = tongLike + tongDislike > 0
    ? Math.round((tongLike / (tongLike + tongDislike)) * 100)
    : null

  const fmt = (d: Date) => new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Thống kê Chatbot AI
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Theo dõi lượt truy cập và chất lượng phản hồi</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Tổng câu hỏi</p>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-700">{tongTatCa.toLocaleString('vi')}</p>
          <p className="text-xs text-slate-400 mt-1">Tháng này: <strong className="text-slate-600">{tongThang}</strong> · Hôm nay: <strong className="text-slate-600">{tongHomNay}</strong></p>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Người dùng</p>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-indigo-700">{tongNguoiDung}</p>
          <p className="text-xs text-slate-400 mt-1">Cán bộ Sở: <strong>{caSo}</strong> · Phường/xã: <strong>{caPhuong}</strong></p>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Hài lòng</p>
            <ThumbsUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-700">
            {pctHaiLong !== null ? `${pctHaiLong}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            👍 {tongLike} · 👎 {tongDislike} · Chưa đánh giá: {tongChuaDanhGia}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${tongDislike > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Cần kiểm tra</p>
            <AlertTriangle className={`w-4 h-4 ${tongDislike > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <p className={`text-3xl font-bold ${tongDislike > 0 ? 'text-red-600' : 'text-slate-300'}`}>{tongDislike}</p>
          <p className="text-xs text-slate-400 mt-1">Phản hồi bị đánh dấu sai</p>
        </div>
      </div>

      {/* Danh sách DISLIKE để admin xem */}
      {dislikeLogs.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-red-50">
            <ThumbsDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">Phản hồi cần xem lại ({dislikeLogs.length})</span>
            <span className="text-xs text-red-500 ml-auto">Người dùng đánh dấu ❌ → kiểm tra dữ liệu</span>
          </div>

          <div className="divide-y divide-slate-100">
            {dislikeLogs.map(log => (
              <div key={log.id} className="px-5 py-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{log.user.name}</span>
                    <span>·</span>
                    <span>{log.isWardUser ? 'Phường/xã' : 'Cán bộ Sở'}</span>
                    <span>·</span>
                    <span>{fmt(log.createdAt)}</span>
                  </div>
                  {log.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {log.toolsUsed.map(t => (
                        <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-400 mb-0.5 font-medium uppercase tracking-wide">Câu hỏi</p>
                    <p className="text-sm text-slate-700">{log.question}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                    <p className="text-[10px] text-red-400 mb-0.5 font-medium uppercase tracking-wide">Trả lời (cần kiểm tra)</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dislikeLogs.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">Chưa có phản hồi tiêu cực nào</p>
          <p className="text-green-600 text-sm mt-1">Người dùng chưa đánh dấu câu trả lời sai</p>
        </div>
      )}

      {/* Kiến thức đã học từ người dùng */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-emerald-50">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Kiến thức chatbot đã học ({learnedLogs.length})</span>
          <span className="text-xs text-emerald-600 ml-auto hidden sm:inline">
            Câu trả lời được 👍 → chatbot tự dùng lại cho câu hỏi tương tự
          </span>
        </div>

        {learnedLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Chưa có kiến thức nào. Khi người dùng bấm 👍 vào một câu trả lời hướng dẫn,
            chatbot sẽ ghi nhận và tự dùng lại để trả lời nhất quán hơn.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {learnedLogs.map(log => (
              <div key={log.id} className="px-5 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">👍 đã xác nhận</span>
                  <span>·</span>
                  <span>{log.feedbackAt ? fmt(log.feedbackAt) : fmt(log.createdAt)}</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-400 mb-0.5 font-medium uppercase tracking-wide">Câu hỏi</p>
                    <p className="text-sm text-slate-700">{log.question}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                    <p className="text-[10px] text-emerald-500 mb-0.5 font-medium uppercase tracking-wide">Trả lời chuẩn (tái sử dụng)</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
