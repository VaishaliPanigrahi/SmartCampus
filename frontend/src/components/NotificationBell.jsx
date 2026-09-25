import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

function NotificationBell({ role }) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  async function fetchNotifications() {
    try {
      const response = await api.get('/notifications')
      setNotifications(response.data.notifications)
      setUnread(response.data.unread_count)
    } catch {
      /* silent: the bell is a passive widget and should not surface transient errors */
    }
  }

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markAllRead(event) {
    event.preventDefault()
    try {
      await api.post('/notifications/read-all')
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
      setUnread(0)
    } catch {
      /* keep the optimistic state */
    }
  }

  const viewAllHref = role === 'recruiter' ? '/recruiter/notifications' : '/student/notifications'
  const recent = notifications.slice(0, 6)

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="button-ghost relative px-2.5"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        type="button"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-teal px-1 font-mono text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-display text-sm font-bold text-navy">Notifications</p>
            {unread > 0 && (
              <button className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline" onClick={markAllRead} type="button">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</p>}
            {recent.map((notification) => (
              <a
                className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition hover:bg-canvas ${notification.is_read ? '' : 'bg-teal-50/40'}`}
                href={notification.link || viewAllHref}
                key={notification.id}
                onClick={() => setOpen(false)}
              >
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-teal'}`} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">{notification.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </span>
              </a>
            ))}
          </div>
          <a className="block px-4 py-3 text-center text-sm font-semibold text-teal hover:bg-canvas" href={viewAllHref} onClick={() => setOpen(false)}>
            View all notifications
          </a>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
