import { ArrowLeft, BrainCircuit, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import api from '../services/api'

function LoginPage({ onBack, onLogin }) {
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.post('/login', { role, identifier, password })
      localStorage.setItem('smart-campus-token', response.data.token)
      localStorage.setItem('smart-campus-user', JSON.stringify(response.data.user))
      if (onLogin) onLogin(response.data.user)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to connect to the recruitment API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-8 text-white lg:px-10">
      <button className="button-secondary gap-2 px-4 py-2" onClick={onBack}><ArrowLeft size={16} /> Back home</button>
      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-16 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={24} /></span>
          <p className="eyebrow mt-8">Secure prototype access</p>
          <h1 className="mt-5 max-w-lg font-display text-4xl font-bold leading-tight sm:text-6xl">Bring your next opportunity into focus.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-white/55">Sign in to explore profile-based recommendations or rank candidates against a posted role.</p>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/45"><ShieldCheck className="text-lime" size={18} /> Simple academic prototype authentication</div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div><p className="text-sm text-white/45">Welcome back</p><h2 className="mt-1 font-display text-2xl font-bold">Log in to Smart Campus</h2></div>
          <div className="mt-7 grid grid-cols-2 rounded-lg bg-white/5 p-1">
            {['student', 'recruiter'].map((option) => <button className={`rounded-md px-3 py-2.5 text-sm font-semibold capitalize transition ${role === option ? 'bg-lime text-ink' : 'text-white/50 hover:text-white'}`} key={option} onClick={() => { setRole(option); setError(''); setSuccess('') }}>{option}</button>)}
          </div>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold"><span className="mb-2 block text-white/75">{role === 'student' ? 'Email or student ID' : 'Recruiter email'}</span><span className="relative block"><Mail className="absolute left-3 top-3.5 text-white/30" size={17} /><input className="field pl-10" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? 'Enter your email or student ID' : 'Enter your recruiter email'} /></span></label>
            <label className="block text-sm font-semibold"><span className="mb-2 block text-white/75">Password</span><span className="relative block"><LockKeyhole className="absolute left-3 top-3.5 text-white/30" size={17} /><input className="field pl-10" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></span></label>
            {error && <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            {success && <p className="rounded-lg border border-lime/20 bg-lime/10 px-4 py-3 text-sm text-lime">{success}</p>}
            <button className="button-primary w-full py-3.5" disabled={loading}>{loading ? 'Signing in...' : `Log in as ${role}`} <ArrowLeft className="rotate-180" size={16} /></button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-white/35">New here? <a className="text-lime hover:underline" href="/register">Create your account</a></p>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
