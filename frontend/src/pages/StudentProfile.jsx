import { Check, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
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

  return (
    <AppShell role="student" active="profile" onLogout={logout} subtitle="Student features" title="Academic profile">
      <p className="mb-8 max-w-2xl text-slate-500">These fields become structured features for eligibility checks and NLP matching — beyond resume text alone.</p>
      {loading ? (
        <p className="text-slate-500">Loading profile...</p>
      ) : (
        <form className="card p-6" onSubmit={saveProfile}>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map(([field, label]) => (
              <label className="text-sm font-semibold text-slate-700" key={field}>
                <span className="mb-2 block">{label}</span>
                <input
                  className="field disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  disabled={field === 'student_id'}
                  value={profile[field] ?? ''}
                  onChange={(event) => updateField(field, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button className="button-primary px-5 py-3" disabled={saving}>{saving ? 'Saving...' : 'Save profile'} <Save size={16} /></button>
            {message && <span className="flex items-center gap-2 text-sm text-teal-700"><Check size={16} /> {message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      )}
    </AppShell>
  )
}

export default StudentProfile
