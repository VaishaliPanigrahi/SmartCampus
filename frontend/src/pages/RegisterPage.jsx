import { ArrowLeft, BrainCircuit, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import api from '../services/api'

function RegisterPage({ onBack, onRegistered }) {
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ name: '', email: '', password: '', student_id: '', department: '', cgpa: '', graduation_year: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); setError('') }
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const response = await api.post('/register', { ...form, role })
      localStorage.setItem('smart-campus-token', response.data.token)
      localStorage.setItem('smart-campus-user', JSON.stringify(response.data.user))
      onRegistered(response.data.user)
    } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to create your account.') } finally { setLoading(false) }
  }
  const input = (field, label, type = 'text', placeholder = '') => <label className="block text-sm font-semibold"><span className="mb-2 block text-white/70">{label}</span><input className="field" required value={form[field]} onChange={(event) => update(field, event.target.value)} type={type} placeholder={placeholder} /></label>
  return <main className="min-h-screen bg-ink px-6 py-8 text-white lg:px-10"><button className="button-secondary gap-2 px-4 py-2" onClick={onBack}><ArrowLeft size={16} /> Back</button><div className="mx-auto max-w-3xl py-12"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={24} /></span><div><p className="eyebrow">New account</p><h1 className="font-display text-3xl font-bold">Create your workspace.</h1></div></div><p className="mt-4 max-w-xl text-white/55">Your details will be stored in the configured MySQL database and used for matching.</p><div className="mt-8 grid grid-cols-2 rounded-lg bg-white/5 p-1">{['student', 'recruiter'].map((option) => <button className={`rounded-md px-3 py-2.5 text-sm font-semibold capitalize ${role === option ? 'bg-lime text-ink' : 'text-white/50'}`} key={option} onClick={() => { setRole(option); setError('') }}>{option}</button>)}</div><form className="mt-6 grid gap-5 rounded-2xl border border-white/10 bg-panel p-6 sm:grid-cols-2" onSubmit={submit}>{input('name', 'Full name', 'text', 'Your name')}{input('email', 'Email', 'email', 'you@example.com')}{input('password', 'Password', 'password', 'At least 6 characters')}{role === 'student' ? <>{input('student_id', 'Student ID', 'text', 'Your college ID')}{input('department', 'Department', 'text', 'Data Science')}{input('cgpa', 'CGPA', 'number', '0 - 10')}{input('graduation_year', 'Graduation year', 'number', '2026')}</> : input('company', 'Company name', 'text', 'Your company')}{error && <p className="sm:col-span-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button className="button-primary gap-2 py-3.5 sm:col-span-2" disabled={loading}>{loading ? 'Creating account...' : 'Create account'} <UserRound size={16} /></button></form><p className="mt-6 flex items-center gap-2 text-xs text-white/35"><ShieldCheck size={15} /> Passwords are stored as secure hashes, never plain text.</p></div></main>
}
export default RegisterPage
