import { ArrowLeft, Check, FileCheck, MapPin, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
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

  return (
    <AppShell
      role="student"
      active="recommendations"
      onLogout={logout}
      subtitle={job?.company || 'Role details'}
      title={job?.job_title || 'Job details'}
      extra={<button className="button-ghost" onClick={onBack}><ArrowLeft size={15} /> Recommendations</button>}
    >
      {loading && <p className="text-slate-500">Loading job details...</p>}
      {error && !job && <p className="alert-error">{error}</p>}
      {job && (
        <>
          <div className="card flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end">
            <p className="flex items-center gap-2 text-slate-500"><MapPin size={16} /> {job.location}</p>
            <div className="sm:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Your match</p>
              <p className="mt-1 font-display text-5xl font-extrabold text-teal">{Math.round(job.final_score)}%</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="card p-6">
              <p className="eyebrow">Role overview</p>
              <p className="mt-5 leading-8 text-slate-600">{job.description}</p>
              <h2 className="mt-8 font-display text-lg font-bold text-navy">Required skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.required_skills.split(',').map((skill) => <span className="chip-muted" key={skill}>{skill.trim()}</span>)}
              </div>
              <p className="mt-8 text-sm text-slate-500">
                Minimum CGPA: <strong className="text-navy">{job.minimum_cgpa}</strong> · Eligible department: <strong className="text-navy">{job.department}</strong>
              </p>
            </div>
            <aside className="card bg-teal-50/40 p-6">
              <p className="eyebrow">Why this matches you</p>
              <div className="mt-5 space-y-4">
                {job.matched_skills.map((skill) => (
                  <p className="flex items-start gap-3 text-sm text-slate-600" key={skill}><Check className="mt-0.5 shrink-0 text-teal" size={17} /> {skill} matches your profile</p>
                ))}
                <p className="flex items-start gap-3 text-sm text-slate-600"><Check className="mt-0.5 shrink-0 text-teal" size={17} /> Your CGPA satisfies the requirement</p>
                {job.matched_skills.length === 0 && <p className="text-sm text-slate-500">The score is based on combined profile and text similarity.</p>}
                <p className="flex items-start gap-3 text-sm text-slate-600"><FileCheck className="mt-0.5 shrink-0 text-teal" size={17} /> Eligibility checks passed</p>
              </div>
            </aside>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button className="button-primary px-6 py-3.5" onClick={apply} disabled={applying || Boolean(status)}>
              {status ? `Application ${status}` : applying ? 'Submitting...' : 'Apply for this job'} {!status && <Send size={16} />}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </>
      )}
    </AppShell>
  )
}

export default JobDetails
