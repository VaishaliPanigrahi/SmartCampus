import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import Logo from '../components/Logo'
import api from '../services/api'

function RegisterPage({ onBack, onRegistered }) {
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ name: '', email: '', password: '', student_id: '', department: '', cgpa: '', graduation_year: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/register', { ...form, role })
      localStorage.setItem('smart-campus-token', response.data.token)
      localStorage.setItem('smart-campus-user', JSON.stringify(response.data.user))
      onRegistered(response.data.user)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  const input = (field, label, type = 'text', placeholder = '') => (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-2 block">{label}</span>
      <input className="field" required value={form[field]} onChange={(event) => update(field, event.target.value)} type={type} placeholder={placeholder} />
    </label>
  )

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 lg:px-10">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Logo />
        <button className="button-ghost" onClick={onBack}><ArrowLeft size={16} /> Home</button>
      </div>
      <div className="mx-auto max-w-3xl py-10">
        <p className="eyebrow">New workspace</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-navy sm:text-4xl">Create your Smart Campus account.</h1>
        <p className="mt-3 max-w-xl text-slate-500">Student details feed the matching models. Recruiter accounts can post roles and rank eligible talent.</p>
        <div className="mt-8 grid grid-cols-2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {['student', 'recruiter'].map((option) => (
            <button
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize ${role === option ? 'bg-navy text-white' : 'text-slate-500'}`}
              key={option}
              onClick={() => { setRole(option); setError('') }}
            >
              {option}
            </button>
          ))}
        </div>
        <form className="card mt-6 grid gap-5 p-6 sm:grid-cols-2" onSubmit={submit}>
          {input('name', 'Full name', 'text', 'Your name')}
          {input('email', 'Email', 'email', 'you@example.com')}
          {input('password', 'Password', 'password', 'At least 6 characters')}
          {role === 'student' ? (
            <>
              {input('student_id', 'Student ID', 'text', 'Your college ID')}
              {input('department', 'Department', 'text', 'Data Science')}
              {input('cgpa', 'CGPA', 'number', '0 - 10')}
              {input('graduation_year', 'Graduation year', 'number', '2026')}
            </>
          ) : input('company', 'Company name', 'text', 'Your company')}
          {error && <p className="alert-error sm:col-span-2">{error}</p>}
          <button className="button-primary gap-2 py-3.5 sm:col-span-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'} <UserRound size={16} />
          </button>
        </form>
        <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={15} /> Passwords are stored as secure hashes, never plain text. Already registered? <a className="font-semibold text-teal hover:underline" href="/login">Log in</a>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage
