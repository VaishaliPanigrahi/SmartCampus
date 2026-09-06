import { ArrowLeft, BrainCircuit, Check, FileCheck, LogOut, MapPin, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'

function JobDetails({ jobId, onBack, onLogout }) {
  const [job, setJob] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadJob() {
      try {
        const response = await api.get(`/jobs/${jobId}`)
        setJob(response.data.job)
        setStatus(response.data.application_status)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load this job.')
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [jobId])

  async function apply() {
    setApplying(true)
    setError('')
    try {
      const response = await api.post(`/jobs/${jobId}/apply`)
      setStatus(response.data.status)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to submit your application.')
    } finally {
      setApplying(false)
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div><button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button></header>
    <section className="mx-auto max-w-5xl py-12"><button className="button-secondary mb-8 gap-2 px-3 py-2" onClick={onBack}><ArrowLeft size={15} /> Recommendations</button>{loading && <p className="text-white/50">Loading job details...</p>}{error && !job && <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}{job && <><div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-10 sm:flex-row sm:items-end"><div><p className="eyebrow">{job.company}</p><h1 className="mt-4 font-display text-4xl font-bold">{job.job_title}</h1><p className="mt-4 flex items-center gap-2 text-white/50"><MapPin size={16} /> {job.location}</p></div><div className="text-left sm:text-right"><p className="text-xs uppercase tracking-[0.16em] text-white/40">Your match</p><p className="mt-1 font-display text-5xl font-bold text-lime">{Math.round(job.final_score)}%</p></div></div><div className="grid gap-6 py-10 lg:grid-cols-[1.2fr_0.8fr]"><div><p className="eyebrow">Role overview</p><p className="mt-5 leading-8 text-white/65">{job.description}</p><h2 className="mt-10 font-display text-xl font-bold">Required skills</h2><div className="mt-4 flex flex-wrap gap-2">{job.required_skills.split(',').map((skill) => <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/65" key={skill}>{skill.trim()}</span>)}</div><p className="mt-8 text-sm text-white/45">Minimum CGPA: <strong className="text-white/75">{job.minimum_cgpa}</strong> · Eligible department: <strong className="text-white/75">{job.department}</strong></p></div><aside className="rounded-2xl border border-lime/20 bg-lime/[0.06] p-6"><p className="eyebrow">Why this matches you</p><div className="mt-5 space-y-4">{job.matched_skills.map((skill) => <p className="flex items-start gap-3 text-sm text-white/70" key={skill}><Check className="mt-0.5 shrink-0 text-lime" size={17} /> {skill} matches your profile</p>)}<p className="flex items-start gap-3 text-sm text-white/70"><Check className="mt-0.5 shrink-0 text-lime" size={17} /> Your CGPA satisfies the requirement</p>{job.matched_skills.length === 0 && <p className="text-sm text-white/55">The score is based on the combined profile and text similarity.</p>}<p className="flex items-start gap-3 text-sm text-white/70"><FileCheck className="mt-0.5 shrink-0 text-lime" size={17} /> Eligibility checks passed</p></div></aside></div><div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-7"><button className="button-primary px-6 py-3.5" onClick={apply} disabled={applying || Boolean(status)}>{status ? `Application ${status}` : applying ? 'Submitting...' : 'Apply for this job'} {!status && <Send size={16} />}</button>{error && <p className="text-sm text-red-200">{error}</p>}</div></>}</section>
  </main>
}

export default JobDetails
