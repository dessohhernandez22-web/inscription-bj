import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ChatBox({ demandeId, onClose }) {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${demandeId}`, { headers: { Authorization: `Bearer ${token()}` } })
      if (res.ok) setMessages(await res.json())
    } catch {}
  }

  useEffect(() => {
    loadMessages().finally(() => setLoading(false))
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [demandeId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async e => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const res = await fetch(`/api/messages/${demandeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ message: text.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setText('')
      }
    } catch {}
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl sm:mb-0 sm:mx-4 max-h-[80vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()} style={{ height: '80vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Discussion</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-sm text-gray-400 py-8">Chargement...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">Aucun message. Écrivez à l'école.</div>
          ) : (
            messages.map(m => {
              const isMe = m.senderId === user.id
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-benin-green text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                    <p>{m.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                      {m.senderRole === 'directeur' ? 'Directeur' : 'Parent'} · {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Écrivez un message..."
            className="input-field text-sm flex-1"
            autoFocus
          />
          <button type="submit" disabled={!text.trim()} className="btn-primary text-sm px-4 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
