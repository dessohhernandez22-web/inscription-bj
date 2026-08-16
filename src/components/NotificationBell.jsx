import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function NotificationBell() {
  const { user, token } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!user || user.role !== 'parent') return
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token()}` } })
        if (res.ok) setNotifs(await res.json())
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = notifs.filter(n => !n.lu).length

  const markRead = async id => {
    await fetch(`/api/notifications/read/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: 1 } : n))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST', headers: { Authorization: `Bearer ${token()}` } })
    setNotifs(prev => prev.map(n => ({ ...n, lu: 1 })))
  }

  if (!user || user.role !== 'parent') return null

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">Tout marquer lu</button>
            )}
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune notification</p>
          ) : (
            notifs.map(n => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id) }}
                className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.lu ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.lu ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('fr-FR')} {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
