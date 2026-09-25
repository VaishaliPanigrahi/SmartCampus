import { CalendarDays, Clock3, MapPin, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { EmptyState } from '../components/ui'
import api from '../services/api'

function formatWhen(value) {
  const date = new Date(value)
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

function RecruiterInterviews({ onLogout }) {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/recruiter/interviews')
        setInterviews(response.data.interviews)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load scheduled interviews.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return (
    <AppShell role="recruiter" active="interviews" onLogout={logout} subtitle="Recruiter workspace" title="Scheduled interviews">
      <p className="mb-8 max-w-2xl text-slate-500">Interviews you have scheduled with shortlisted candidates.</p>
      {loading && <p className="text-slate-500">Loading interviews...</p>}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && interviews.length === 0 && (
        <EmptyState title="No interviews scheduled" text="Open a role's candidate ranking and schedule an interview for a shortlisted candidate." />
      )}
      <div className="space-y-4">
        {interviews.map((interview) => {
          const when = formatWhen(interview.scheduled_at)
          const online = (interview.mode || '').toLowerCase() === 'online'
          return (
            <article className="card p-6" key={interview.id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">{interview.job_title}</p>
                  <h2 className="mt-2 font-display text-xl font-bold text-navy">{interview.student_name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{interview.college_id} · {interview.student_email}</p>
                </div>
                <span className={`chip ${online ? '' : 'chip-muted'}`}>{online ? <Video size={14} /> : <MapPin size={14} />} {interview.mode}</span>
              </div>
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <p className="flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={16} className="text-teal" /> {when.date}</p>
                <p className="flex items-center gap-2 text-sm text-slate-600"><Clock3 size={16} className="text-teal" /> {when.time}</p>
                {online && interview.meeting_link && (
                  <p className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2"><Video size={16} className="text-teal" /> {interview.meeting_link}</p>
                )}
                {!online && interview.location && (
                  <p className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2"><MapPin size={16} className="text-teal" /> {interview.location}</p>
                )}
              </div>
              {interview.notes && (
                <p className="mt-4 rounded-lg bg-canvas px-4 py-3 text-sm leading-6 text-slate-600">{interview.notes}</p>
              )}
            </article>
          )
        })}
      </div>
    </AppShell>
  )
}

export default RecruiterInterviews
