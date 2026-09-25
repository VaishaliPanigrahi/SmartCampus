import { ArrowRight, Bell, CheckCheck, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { EmptyState } from '../components/ui'
import api from '../services/api'

function Notifications({ role, onNavigate, onLogout }) {
  const [notifications, setNotifications] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      const response = await api.get('/notifications')
      setNotifications(response.data.notifications)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all')
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update notifications.')
    }
  }

  async function toggle(notification) {
    const opening = expandedId !== notification.id
    setExpandedId(opening ? notification.id : null)
    if (opening && !notification.is_read) {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item))
      try {
        await api.post(`/notifications/${notification.id}/read`)
      } catch { /* the optimistic read state stays even if the receipt fails */ }
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  const unread = notifications.filter((item) => !item.is_read).length

  return (
    <AppShell
      role={role}
      active="notifications"
      onLogout={logout}
      subtitle={role === 'recruiter' ? 'Recruiter workspace' : 'Student workspace'}
      title="Notifications"
      extra={unread > 0 ? <button className="button-ghost" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button> : null}
    >
      <p className="mb-8 max-w-2xl text-slate-500">Updates about your applications, shortlists, and interviews. Select a notification to read the full detail.</p>
      {loading && <p className="text-slate-500">Loading notifications...</p>}
      {error && <p className="alert-error mb-4">{error}</p>}
      {!loading && notifications.length === 0 && (
        <EmptyState title="No notifications yet" text="Updates about your applications, shortlists, and interviews will appear here." />
      )}
      <div className="space-y-3">
        {notifications.map((notification) => {
          const expanded = expandedId === notification.id
          return (
            <article className={`card overflow-hidden transition ${notification.is_read ? '' : 'ring-1 ring-teal/20'}`} key={notification.id}>
              <button className="flex w-full items-start gap-4 p-5 text-left" onClick={() => toggle(notification)} type="button">
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${notification.is_read ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal'}`}>
                  <Bell size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display font-bold text-navy">{notification.title}</span>
                    {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </span>
                <ChevronDown className={`mt-1 shrink-0 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`} size={18} />
              </button>
              {expanded && (
                <div className="border-t border-slate-100 bg-canvas/60 px-5 py-4 pl-[4.5rem]">
                  <p className="text-sm leading-6 text-slate-600">{notification.message}</p>
                  {notification.link && (
                    <button className="button-primary mt-4 px-4 py-2 text-xs" onClick={() => onNavigate(notification.link)} type="button">
                      Open <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </AppShell>
  )
}

export default Notifications
