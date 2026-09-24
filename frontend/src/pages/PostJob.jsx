import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import AppShell from '../components/AppShell'
import api from '../services/api'

const initialForm = { job_title: '', company: '', description: '', required_skills: '', minimum_cgpa: '7', department: 'All', graduation_year: '', location: '' }

function PostJob({ onBack, onNavigate, onLogout }) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post('/jobs', form)
      onNavigate(`/recruiter/jobs/${response.data.job.id}/candidates`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to post this job.')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return (
    <AppShell
      role="recruiter"
      active="post-job"
      onLogout={logout}
      subtitle="Recruiter workspace"
      title="Post a focused opportunity"
      extra={<button className="button-ghost" onClick={onBack}><ArrowLeft size={15} /> Job board</button>}
    >
      <p className="mb-8 max-w-2xl text-slate-500">Clear requirements help the eligibility filter and matching model produce useful rankings.</p>
      <form className="card grid gap-5 p-6 sm:grid-cols-2" onSubmit={submit}>
        {[['job_title', 'Job title'], ['company', 'Company name'], ['required_skills', 'Required skills (comma separated)'], ['location', 'Location']].map(([field, label]) => (
          <label className="text-sm font-semibold text-slate-700" key={field}>
            <span className="mb-2 block">{label}</span>
            <input className="field" value={form[field]} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-2 block">Minimum CGPA</span>
          <input className="field" type="number" min="0" max="10" step="0.1" value={form.minimum_cgpa} onChange={(event) => update('minimum_cgpa', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-2 block">Eligible department</span>
          <select className="field" value={form.department} onChange={(event) => update('department', event.target.value)}>
            <option>All</option>
            <option>Data Science</option>
            <option>Computer Science</option>
            <option>Information Technology</option>
            <option>Electronics</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-2 block">Graduation year</span>
          <input className="field" type="number" min="2020" max="2100" value={form.graduation_year} onChange={(event) => update('graduation_year', event.target.value)} placeholder="Optional" />
        </label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          <span className="mb-2 block">Job description</span>
          <textarea className="field min-h-32 resize-y" value={form.description} onChange={(event) => update('description', event.target.value)} />
        </label>
        {error && <p className="alert-error sm:col-span-2">{error}</p>}
        <button className="button-primary gap-2 px-5 py-3 sm:col-span-2 sm:w-fit" disabled={saving}>
          {saving ? 'Posting...' : 'Post job'} <Send size={16} />
        </button>
      </form>
    </AppShell>
  )
}

export default PostJob
