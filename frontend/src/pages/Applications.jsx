import { ArrowLeft, BrainCircuit, Clock3, FileCheck, LogOut, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'

function Applications({ onBack, onLogout }) {
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

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div><button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button></header>
    <section className="mx-auto max-w-5xl py-12"><button className="button-secondary mb-8 gap-2 px-3 py-2" onClick={onBack}><ArrowLeft size={15} /> Profile</button><p className="eyebrow">Student workspace</p><h1 className="mt-4 font-display text-4xl font-bold">Your applications.</h1><p className="mt-4 leading-7 text-white/55">Track the placement opportunities you have submitted.</p>{loading && <p className="mt-10 text-white/50">Loading applications...</p>}{error && <p className="mt-10 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}{!loading && !error && applications.length === 0 && <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center text-white/45">No applications yet. Your submitted roles will appear here.</div>}<div className="mt-10 space-y-4">{applications.map((application) => <article className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-panel p-6 sm:flex-row sm:items-center" key={application.id}><div><p className="text-xs uppercase tracking-[0.16em] text-white/40">{application.company}</p><h2 className="mt-2 font-display text-xl font-bold">{application.job_title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-white/45"><MapPin size={15} /> {application.location}</p></div><div className="flex items-center gap-4 text-sm"><span className="flex items-center gap-2 rounded-full bg-lime/10 px-3 py-1.5 font-semibold text-lime"><FileCheck size={15} /> {application.status}</span><span className="flex items-center gap-2 text-white/35"><Clock3 size={15} /> {new Date(application.applied_at).toLocaleDateString()}</span></div></article>)}</div></section>
  </main>
}

export default Applications
