import { ArrowLeft, BrainCircuit, Check, LogOut, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'

const fields = [
  ['name', 'Full name'],
  ['student_id', 'Student ID'],
  ['email', 'Email'],
  ['department', 'Department'],
  ['cgpa', 'CGPA'],
  ['graduation_year', 'Graduation year'],
  ['skills', 'Skills'],
  ['programming_languages', 'Programming languages'],
  ['projects', 'Projects'],
  ['certifications', 'Certifications'],
  ['preferred_role', 'Preferred job role'],
  ['preferred_location', 'Preferred location'],
]

function StudentProfile({ onLogout }) {
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/student/profile')
        setProfile(response.data.profile)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load your profile.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setMessage('')
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    const updates = Object.fromEntries(fields.filter(([field]) => field !== 'student_id').map(([field]) => [field, profile[field] ?? '']))
    try {
      const response = await api.put('/student/profile', updates)
      setProfile(response.data.profile)
      setMessage('Profile saved successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div>
      <button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button>
    </header>
    <section className="mx-auto max-w-7xl py-12">
      <div className="mb-8 flex flex-wrap gap-3"><button className="button-secondary gap-2 px-3 py-2" onClick={() => { localStorage.removeItem('smart-campus-token'); localStorage.removeItem('smart-campus-user'); onLogout() }}><ArrowLeft size={15} /> Home</button><a className="button-secondary gap-2 px-3 py-2" href="/student/resume">Resume analysis</a><a className="button-secondary gap-2 px-3 py-2" href="/student/applications">Applications</a><a className="button-primary gap-2 px-3 py-2" href="/student/recommendations">Recommended jobs</a></div>
      <div className="max-w-2xl"><p className="eyebrow">Student workspace</p><h1 className="mt-4 font-display text-4xl font-bold">Build your profile.</h1><p className="mt-4 leading-7 text-white/55">Your profile gives the matching models useful context beyond a resume alone.</p></div>
      {loading ? <p className="mt-12 text-white/50">Loading profile...</p> : <form className="mt-10 max-w-5xl" onSubmit={saveProfile}>
        <div className="grid gap-5 sm:grid-cols-2">{fields.map(([field, label]) => <label className="text-sm font-semibold" key={field}><span className="mb-2 block text-white/70">{label}</span><input className="field disabled:cursor-not-allowed disabled:opacity-45" disabled={field === 'student_id'} value={profile[field] ?? ''} onChange={(event) => updateField(field, event.target.value)} /></label>)}</div>
        <div className="mt-7 flex flex-wrap items-center gap-4"><button className="button-primary px-5 py-3" disabled={saving}>{saving ? 'Saving...' : 'Save profile'} <Save size={16} /></button>{message && <span className="flex items-center gap-2 text-sm text-lime"><Check size={16} /> {message}</span>}{error && <span className="text-sm text-red-200">{error}</span>}</div>
      </form>}
    </section>
  </main>
}

export default StudentProfile
