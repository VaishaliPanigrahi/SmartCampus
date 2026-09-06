import { ArrowLeft, BrainCircuit, Check, ExternalLink, LogOut, MapPin, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'

function RecommendedJobs({ onBack, onLogout }) {
  const [jobs, setJobs] = useState([])
  const [excludedJobs, setExcludedJobs] = useState([])
  const [eligibility, setEligibility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const response = await api.get('/student/recommendations')
        setJobs(response.data.recommendations)
        setExcludedJobs(response.data.excluded_jobs || [])
        setEligibility(response.data.student_eligibility)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load recommendations.')
      } finally {
        setLoading(false)
      }
    }
    loadRecommendations()
  }, [])

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div><button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button></header>
    <section className="mx-auto max-w-7xl py-12"><button className="button-secondary mb-8 gap-2 px-3 py-2" onClick={onBack}><ArrowLeft size={15} /> Profile</button><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow"><Sparkles size={14} /> AI recommendations</p><h1 className="mt-4 font-display text-4xl font-bold">Roles that fit your signal.</h1><p className="mt-4 max-w-2xl leading-7 text-white/55">Eligibility is checked first. Eligible roles are then ranked using the configured TF-IDF and semantic similarity blend.</p></div><div className="flex items-center gap-2 text-sm text-white/40"><SlidersHorizontal size={16} /> 70% semantic · 30% TF-IDF</div></div>
      {loading && <p className="mt-12 text-white/50">Analyzing available roles...</p>}
      {error && <p className="mt-10 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {!loading && !error && jobs.length === 0 && <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8"><p className="text-center font-display text-xl font-bold text-white">No eligible roles match your current profile.</p>{eligibility && <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-white/45">Your eligibility: CGPA {eligibility.cgpa}, {eligibility.department}, graduation year {eligibility.graduation_year}. A job must match these requirements before AI scoring.</p>}<div className="mx-auto mt-7 max-w-2xl space-y-3">{excludedJobs.map((job) => <div className="rounded-lg border border-white/10 bg-panel p-4 text-left" key={`${job.company}-${job.job_title}`}><p className="text-sm font-semibold text-white/70">{job.job_title} · {job.company}</p><p className="mt-2 text-xs leading-5 text-white/40">{job.reasons.join(' · ')}</p></div>)}</div><a className="button-secondary mx-auto mt-7 w-fit px-4 py-2" href="/student/profile">Update profile</a></div>}
      <div className="mt-10 grid gap-5 lg:grid-cols-2">{jobs.map((job) => <article className="rounded-2xl border border-white/10 bg-panel p-6 transition hover:border-lime/30" key={job.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-white/40">{job.company}</p><h2 className="mt-2 font-display text-xl font-bold">{job.job_title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-white/45"><MapPin size={15} /> {job.location}</p></div><div className="text-right"><p className="text-xs uppercase tracking-[0.16em] text-white/40">Match</p><p className="mt-1 font-display text-3xl font-bold text-lime">{Math.round(job.final_score)}%</p></div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime" style={{ width: `${job.final_score}%` }} /></div><div className="mt-6 flex flex-wrap gap-2">{job.matched_skills.map((skill) => <span className="flex items-center gap-1 rounded-full bg-lime/10 px-3 py-1.5 text-xs font-semibold text-lime" key={skill}><Check size={13} /> {skill}</span>)}{job.matched_skills.length === 0 && <span className="text-sm text-white/40">No exact skill terms detected</span>}</div><div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs text-white/45"><span>TF-IDF <strong className="ml-1 text-white/75">{Math.round(job.tfidf_score)}%</strong></span><span>Semantic <strong className="ml-1 text-white/75">{Math.round(job.semantic_score)}%</strong></span></div><a className="button-secondary mt-5 w-full gap-2 py-3" href={`/student/job/${job.id}`}>View details <ExternalLink size={15} /></a></article>)}</div>
    </section>
  </main>
}

export default RecommendedJobs
