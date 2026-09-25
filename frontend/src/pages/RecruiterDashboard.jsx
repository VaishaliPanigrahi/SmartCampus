import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { FunnelChart, JobBarChart, TrendChart } from '../components/AnalyticsCharts'
import { EmptyState, StatCard } from '../components/ui'
import api from '../services/api'

function RecruiterDashboard({ onLogout }) {
  const [jobs, setJobs] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/recruiter/jobs')
      .then((response) => setJobs(response.data.jobs))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load jobs.'))
      .finally(() => setLoading(false))
    api.get('/recruiter/analytics')
      .then((response) => setAnalytics(response.data))
      .catch(() => { /* analytics are supplementary; the dashboard still renders without them */ })
  }, [])

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return (
    <AppShell
      role="recruiter"
      active="jobs"
      onLogout={logout}
      subtitle="Recruiter workspace"
      title="Campus job board"
      extra={<a className="button-primary hidden sm:inline-flex" href="/recruiter/post-job"><Plus size={16} /> Post a role</a>}
    >
      <p className="mb-8 max-w-2xl text-slate-500">Post focused roles. The model filters by eligibility, then ranks students using the 70/30 semantic and TF-IDF blend.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BriefcaseBusiness size={18} />} label="Jobs posted" value={jobs.length} />
        <StatCard icon={<Users size={18} />} label="Total applicants" value={jobs.reduce((total, job) => total + job.applicant_count, 0)} />
        <StatCard icon={<CalendarDays size={18} />} label="Interviews scheduled" value={analytics?.interviews_total ?? 0} />
        <StatCard icon={<BarChart3 size={18} />} label="Ranking blend" value="70 / 30" hint="Semantic / TF-IDF" />
      </div>
      {analytics && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <FunnelChart data={analytics.funnel} />
          <TrendChart data={analytics.timeline} title="Applications over time" subtitle="When students applied to your roles" color="#0A1628" label="Applications" />
          <div className="lg:col-span-2">
            <JobBarChart data={analytics.per_job} />
          </div>
        </div>
      )}
      {error && <p className="alert-error mt-6">{error}</p>}
      {loading ? (
        <p className="mt-8 text-slate-500">Loading your jobs...</p>
      ) : jobs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No jobs posted yet" text="Create a role with clear skills and eligibility so ranking stays meaningful." action={<a className="button-primary mx-auto mt-6 w-fit" href="/recruiter/post-job">Post a role</a>} />
        </div>
      ) : (
        <div className="card mt-8 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-navy">Your roles</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center" key={job.id}>
                <div>
                  <h3 className="font-display font-semibold text-navy">{job.job_title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{job.company} · {job.location} · {job.applicant_count} applicants</p>
                </div>
                <a className="button-ghost" href={`/recruiter/jobs/${job.id}/candidates`}>Rank candidates <ArrowRight size={15} /></a>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default RecruiterDashboard
