import { Check, ExternalLink, MapPin, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { EmptyState, ScoreBar } from '../components/ui'
import api from '../services/api'

function RecommendedJobs({ onLogout }) {
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

  return (
    <AppShell
      role="student"
      active="recommendations"
      onLogout={logout}
      subtitle="AI recommendations"
      title="Roles ranked to your signal"
      extra={<span className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><SlidersHorizontal size={14} /> 70% semantic · 30% TF-IDF</span>}
    >
      <p className="mb-8 max-w-2xl text-slate-500">Eligibility is checked first. Eligible roles are then ranked using the configured TF-IDF and semantic similarity blend.</p>
      {loading && <p className="text-slate-500">Analyzing available roles...</p>}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <EmptyState
          title="No eligible roles match your current profile"
          text={eligibility ? `Your eligibility: CGPA ${eligibility.cgpa}, ${eligibility.department}, graduation year ${eligibility.graduation_year}. A job must match these requirements before AI scoring.` : ''}
          action={
            <div className="mx-auto mt-6 max-w-2xl space-y-3 text-left">
              {excludedJobs.map((job) => (
                <div className="rounded-xl border border-slate-200 bg-canvas p-4" key={`${job.company}-${job.job_title}`}>
                  <p className="text-sm font-semibold text-navy">{job.job_title} · {job.company}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{job.reasons.join(' · ')}</p>
                </div>
              ))}
              <a className="button-ghost mx-auto mt-4 w-fit" href="/student/profile">Update profile</a>
            </div>
          }
        />
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {jobs.map((job) => (
          <article className="card p-6 transition hover:-translate-y-0.5 hover:shadow-lift" key={job.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">{job.company}</p>
                <h2 className="mt-2 font-display text-xl font-bold text-navy">{job.job_title}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15} /> {job.location}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Match</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-teal">{Math.round(job.final_score)}%</p>
              </div>
            </div>
            <div className="mt-5"><ScoreBar value={job.final_score} /></div>
            <div className="mt-5 flex flex-wrap gap-2">
              {job.matched_skills.map((skill) => <span className="chip" key={skill}><Check size={13} /> {skill}</span>)}
              {job.matched_skills.length === 0 && <span className="text-sm text-slate-400">No exact skill terms detected</span>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>TF-IDF <strong className="ml-1 text-navy">{Math.round(job.tfidf_score)}%</strong></span>
              <span>Semantic <strong className="ml-1 text-navy">{Math.round(job.semantic_score)}%</strong></span>
            </div>
            <a className="button-ghost mt-5 w-full py-3" href={`/student/job/${job.id}`}>View details <ExternalLink size={15} /></a>
          </article>
        ))}
      </div>
    </AppShell>
  )
}

export default RecommendedJobs
