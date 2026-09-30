'use client'

import { useState, useRef, useEffect, KeyboardEvent, type ReactNode } from 'react'
import { X, Send, Loader2, ChevronDown, Sparkles } from 'lucide-react'
import Image from 'next/image'

type Message = {
  role: 'user' | 'assistant'
  content: string
  logId?: string
  feedback?: 'LIKE' | 'DISLIKE' | null
}

const WELCOME_SO: Message = {
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI của Hệ thống HTKT.\n\nTôi có thể giúp bạn:\n• Hướng dẫn nhập dữ liệu các module\n• Tra cứu số điện thoại, email cán bộ\n• Xem sơ đồ tổ chức & lãnh đạo\n• Kiểm tra sinh nhật hôm nay\n• Giải đáp thắc mắc về hệ thống\n\nBạn cần hỗ trợ gì?',
}

const WELCOME_PHUONG: Message = {
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI của Hệ thống HTKT.\n\nTôi có thể giúp bạn:\n• Hướng dẫn nhập dữ liệu báo cáo phường/xã\n• Hướng dẫn import file Excel các biểu mẫu\n• Tra cứu mã đơn vị hành chính (ĐVHC)\n• Giải đáp thắc mắc về hệ thống\n\nBạn cần hỗ trợ gì?',
}

const QUICK_SO = [
  'Sinh nhật hôm nay?',
  'Sơ đồ tổ chức Sở',
  'Mã ĐVHC Phường Đồng Hới?',
  'Hướng dẫn import Excel',
]

const QUICK_PHUONG = [
  'Mã ĐVHC phường Ba Đồn?',
  'Hướng dẫn import Excel',
  'Cách nhập báo cáo đường',
  'File mẫu báo cáo',
]

// Render tin nhắn bot: biến [nhãn](url) thành link bấm được (mở tab mới — link
// tải .docx của /api/office/... sẽ tải về trực tiếp) và **...** thành in đậm.
// Container đã có whitespace-pre-wrap nên xuống dòng được giữ nguyên.
function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let key = 0
  const pushText = (s: string) => {
    if (!s) return
    const boldRe = /\*\*([^*]+)\*\*/g
    let bl = 0
    let bm: RegExpExecArray | null
    while ((bm = boldRe.exec(s))) {
      if (bm.index > bl) nodes.push(s.slice(bl, bm.index))
      nodes.push(<strong key={`b${key++}`}>{bm[1]}</strong>)
      bl = bm.index + bm[0].length
    }
    if (bl < s.length) nodes.push(s.slice(bl))
  }
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(text))) {
    if (m.index > last) pushText(text.slice(last, m.index))
    nodes.push(
      <a key={`l${key++}`} href={m[2]} target="_blank" rel="noopener noreferrer"
        className="text-indigo-600 underline font-medium hover:text-indigo-800 break-all">
        {m[1]}
      </a>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) pushText(text.slice(last))
  return nodes
}

type BirthdayInfo = { hoTen: string; tuoi: number; gioiTinh: string | null } | null

function buildBirthdayMessage(b: BirthdayInfo): Message | null {
  if (!b) return null
  const xungHo = b.gioiTinh === 'NU' ? 'chị' : b.gioiTinh === 'NAM' ? 'anh' : 'bạn'
  const greetings = [
    `🎂🎉 **Chúc mừng sinh nhật ${xungHo} ${b.hoTen}!**\n\nHôm nay là ngày đặc biệt của ${xungHo} — tròn **${b.tuoi} tuổi**! 🎈\n\nChúc ${xungHo} luôn mạnh khỏe, hạnh phúc và gặt hái thêm nhiều thành công trong công tác! 🌟`,
    `🎉🎂 **Sinh nhật vui vẻ, ${xungHo} ${b.hoTen}!**\n\nChúc mừng ${xungHo} bước sang tuổi **${b.tuoi}**! 🥳\n\nKính chúc ${xungHo} dồi dào sức khỏe, vạn sự như ý, công việc thuận lợi! 🎊`,
    `🥳🎂 **Happy Birthday ${xungHo} ${b.hoTen}!**\n\nTuổi mới **${b.tuoi}** — chúc ${xungHo} luôn tràn đầy năng lượng, niềm vui và thành công! 🎁🌺`,
  ]
  const idx = (b.hoTen.length + b.tuoi) % greetings.length
  return { role: 'assistant', content: greetings[idx] }
}

export function ChatWidget({ isWardUser = false, birthday = null }: { isWardUser?: boolean; birthday?: BirthdayInfo }) {
  const WELCOME = isWardUser ? WELCOME_PHUONG : WELCOME_SO
  const QUICK_QUESTIONS = isWardUser ? QUICK_PHUONG : QUICK_SO
  const birthdayMsg = buildBirthdayMessage(birthday ?? null)
  const initialMessages = birthdayMsg ? [birthdayMsg, WELCOME] : [WELCOME]

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const apiMessages = newMessages
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      const data = await res.json().catch(() => ({}))
      // Máy chủ trả thông báo cụ thể (vd hết hạn mức AI, 503) trong data.error —
      // hiển thị nguyên văn thay vì câu lỗi chung chung khiến người dùng tưởng hỏng.
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply ?? 'Xin lỗi, không nhận được phản hồi.',
          logId: data.logId,
          feedback: null,
        },
      ])
    } catch (e) {
      const msg = e instanceof Error && !/^HTTP \d+$/.test(e.message) && e.message !== 'Failed to fetch'
        ? e.message
        : 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.'
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: msg },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  async function sendFeedback(logId: string, feedback: 'LIKE' | 'DISLIKE', msgIndex: number) {
    try {
      await fetch('/api/chatbot/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, feedback }),
      })
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, feedback } : m))
    } catch { /* silent */ }
  }

  return (
    <>
      {/* ── Nút nổi ─────────────────────────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Trợ lý HTKT"
          className="fixed bottom-6 right-6 z-50 group focus:outline-none"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(59,130,246,0.55))' }}
        >
          {/* Vòng sáng pulse */}
          <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${birthday ? 'bg-yellow-400' : 'bg-blue-400'}`} />
          <span className={`absolute inset-[-4px] rounded-full blur-sm ${birthday ? 'bg-gradient-to-br from-yellow-400/40 to-pink-500/40' : 'bg-gradient-to-br from-blue-500/30 to-indigo-600/30'}`} />

          {/* Container ảnh */}
          <span
            className="relative block w-16 h-16 rounded-full overflow-hidden border-2 border-white/70 shadow-lg transition-transform duration-300"
            style={{ transform: hovered ? 'scale(1.12) rotate(-4deg)' : 'scale(1)' }}
          >
            <Image
              src={hovered ? '/chatbot-wave.png' : '/chatbot-robot.png'}
              alt="Trợ lý AI"
              fill
              className="object-cover"
              priority
            />
          </span>

          {/* Badge */}
          {birthday ? (
            <span className="absolute -top-1 -right-1 text-lg leading-none animate-bounce" style={{ animationDuration: '1.5s' }}>🎂</span>
          ) : (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          )}
        </button>
      )}

      {/* ── Cửa sổ chat ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed z-50 flex flex-col overflow-hidden shadow-2xl border border-white/20 rounded-2xl
          inset-x-3 bottom-3 top-3 max-h-[calc(100dvh-1.5rem)]
          sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px]"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)' }}>

          {/* Header gradient */}
          <div className="relative flex items-center gap-3 px-4 py-3 shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #6366f1 100%)' }}>

            {/* Hiệu ứng sóng nền */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }} />

            {/* Avatar robot */}
            <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 border-white/60 shadow-md"
              style={{ filter: 'drop-shadow(0 0 8px rgba(147,197,253,0.8))' }}>
              <Image
                src="/chatbot-robot.png"
                alt="Bot"
                fill
                className="object-cover"
              />
              {/* Chấm online */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>

            <div className="flex-1 min-w-0 relative">
              <p className="font-bold text-white text-sm leading-tight">Trợ lý HTKT</p>
              <p className="text-blue-100 text-xs leading-tight">Powered by Claude AI · Đang hoạt động</p>
            </div>

            {/* Nút reset + đóng */}
            <div className="flex gap-1 relative">
              <button
                onClick={() => setMessages(initialMessages)}
                title="Cuộc trò chuyện mới"
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Thu nhỏ"
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ background: 'linear-gradient(180deg, #f0f7ff 0%, #f8fafc 100%)' }}>

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {/* Avatar bot */}
                {msg.role === 'assistant' && (
                  <div className="relative w-7 h-7 shrink-0 rounded-full overflow-hidden border border-blue-200 shadow-sm mb-0.5 self-start mt-0.5">
                    <Image src="/chatbot-robot.png" alt="bot" fill className="object-cover" />
                  </div>
                )}

                <div className="flex flex-col gap-1 max-w-[78%]">
                  <div className={`px-3 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-white text-slate-800 rounded-bl-sm border border-blue-100'
                  }`}
                    style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #2563eb, #4f46e5)' } : {}}>
                    {msg.role === 'assistant' ? renderRichText(msg.content) : msg.content}
                  </div>

                  {/* Nút feedback chỉ hiện với tin bot có logId */}
                  {msg.role === 'assistant' && msg.logId && (
                    <div className="flex items-center gap-1.5 pl-1">
                      {msg.feedback ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          msg.feedback === 'LIKE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {msg.feedback === 'LIKE' ? '👍 Hữu ích' : '👎 Không đúng'}
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] text-slate-400">Phản hồi:</span>
                          <button
                            onClick={() => sendFeedback(msg.logId!, 'LIKE', i)}
                            title="Trả lời đúng, hữu ích"
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-green-100 transition-colors text-sm"
                          >👍</button>
                          <button
                            onClick={() => sendFeedback(msg.logId!, 'DISLIKE', i)}
                            title="Sai hoặc không phù hợp"
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors text-sm"
                          >👎</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="relative w-7 h-7 shrink-0 rounded-full overflow-hidden border border-blue-200 shadow-sm">
                  <Image src="/chatbot-robot.png" alt="bot" fill className="object-cover" />
                </div>
                <div className="bg-white border border-blue-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Câu hỏi nhanh */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 pt-1 flex flex-wrap gap-1.5 shrink-0 bg-white border-t border-slate-100">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-60 bg-slate-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-3 py-2.5 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
