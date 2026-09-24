import { ArrowLeft, ArrowRight, BrainCircuit, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Logo from '../components/Logo'
import api from '../services/api'

function LoginPage({ onBack, onLogin }) {
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
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
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_1.05fr]">
      <section className="hero-grid hidden bg-navy px-10 py-10 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-md">
          <p className="eyebrow-light"><BrainCircuit size={14} /> Campus recruitment lab</p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight">Sign in to inspect ranked matches.</h1>
          <p className="mt-5 leading-7 text-slate-300">Students review job-fit scores. Recruiters rank eligible candidates with the same NLP pipeline.</p>
          <p className="mt-10 flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="text-teal" size={16} /> Academic prototype authentication</p>
        </div>
      </section>
      <section className="flex flex-col px-6 py-8 sm:px-10">
        <button className="button-ghost w-fit" onClick={onBack}><ArrowLeft size={16} /> Back home</button>
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <div className="lg:hidden"><Logo /></div>
          <p className="mt-6 text-sm text-slate-500">Welcome back</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold text-navy">Log in to Smart Campus</h2>
          <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            {['student', 'recruiter'].map((option) => (
              <button
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition ${role === option ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                key={option}
                onClick={() => { setRole(option); setError('') }}
              >
                {option}
              </button>
            ))}
          </div>
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-2 block">{role === 'student' ? 'Email or student ID' : 'Recruiter email'}</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={17} />
                <input className="field pl-10" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? 'Enter your email or student ID' : 'Enter your recruiter email'} />
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-2 block">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3 top-3.5 text-slate-400" size={17} />
                <input className="field pl-10" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
              </span>
            </label>
            {error && <p className="alert-error">{error}</p>}
            <button className="button-primary w-full py-3.5" disabled={loading}>
              {loading ? 'Signing in...' : `Log in as ${role}`} <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">New here? <a className="font-semibold text-teal hover:underline" href="/register">Create your account</a></p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
