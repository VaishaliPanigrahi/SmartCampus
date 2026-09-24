import { Clock3, FileCheck, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { EmptyState } from '../components/ui'
import api from '../services/api'

function Applications({ onLogout }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadApplications() {
      try {
        const response = await api.get('/student/applications')
        setApplications(response.data.applications)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load applications.')
      } finally {
        setLoading(false)
      }
    }
    loadApplications()
  }, [])

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return (
    <AppShell role="student" active="applications" onLogout={logout} subtitle="Student workspace" title="Your applications">
      <p className="mb-8 max-w-2xl text-slate-500">Track placement opportunities you have already submitted.</p>
      {loading && <p className="text-slate-500">Loading applications...</p>}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <EmptyState title="No applications yet" text="Roles you apply to from recommendations will appear here." />
      )}
      <div className="space-y-4">
        {applications.map((application) => (
          <article className="card flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center" key={application.id}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">{application.company}</p>
              <h2 className="mt-2 font-display text-xl font-bold text-navy">{application.job_title}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15} /> {application.location}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="chip"><FileCheck size={15} /> {application.status}</span>
              <span className="flex items-center gap-2 text-slate-400"><Clock3 size={15} /> {new Date(application.applied_at).toLocaleDateString()}</span>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  )
}

export default Applications
