import { ArrowRight, BriefcaseBusiness, FileText, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { StatCard } from '../components/ui'
import api from '../services/api'

function StudentDashboard({ onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/student/dashboard')
      .then((response) => setDashboard(response.data))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load dashboard data.'))
  }, [])

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return (
    <AppShell role="student" active="dashboard" onLogout={logout} subtitle="Student workspace" title={dashboard ? `Welcome back, ${dashboard.student.name.split(' ')[0]}.` : 'Student overview'}>
      {error && <p className="alert-error">{error}</p>}
      {!dashboard && !error && <p className="text-slate-500">Loading dashboard...</p>}
      {dashboard && (
        <>
          <p className="mb-8 max-w-2xl text-slate-500">Your profile and resume are the features the ranking model uses. Keep them current to improve recommendations.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={<UserRound size={18} />} label="Profile completion" value={`${dashboard.profile_completion}%`} />
            <StatCard icon={<BriefcaseBusiness size={18} />} label="Eligible recommendations" value={dashboard.recommended_jobs} hint="After filters" />
            <StatCard icon={<FileText size={18} />} label="Applications" value={dashboard.applications} />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Action href="/student/profile" title="Update profile" text="Academic details, skills, and preferences." />
            <Action href="/student/recommendations" title="Explore recommendations" text="Roles ranked against your current signal." />
            <Action href="/student/resume" title="Analyze resume" text={dashboard.resume_uploaded ? 'Resume text is already available to the model.' : 'Upload a PDF resume to add NLP context.'} />
          </div>
        </>
      )}
    </AppShell>
  )
}

function Action({ href, title, text }) {
  return (
    <a className="group card p-6 transition hover:-translate-y-0.5 hover:shadow-lift" href={href}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
        <ArrowRight className="mt-0.5 shrink-0 text-teal transition group-hover:translate-x-1" size={18} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </a>
  )
}

export default StudentDashboard
