import { ArrowLeft, ArrowRight, BrainCircuit, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import Logo from '../components/Logo'
import api from '../services/api'

const emptyRegister = { name: '', email: '', password: '', student_id: '', department: '', cgpa: '', graduation_year: '', company: '' }

function AuthPage({ mode = 'login', onBack, onAuth }) {
  const [view, setView] = useState(mode === 'register' ? 'register' : 'login')
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [form, setForm] = useState(emptyRegister)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = view === 'login'

  function switchView(next) {
    setView(next)
    setError('')
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function storeSession(data) {
    localStorage.setItem('smart-campus-token', data.token)
    localStorage.setItem('smart-campus-user', JSON.stringify(data.user))
    if (onAuth) onAuth(data.user)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = isLogin
        ? await api.post('/login', { role, identifier, password })
        : await api.post('/register', { ...form, role })
      storeSession(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.error || (isLogin ? 'Unable to connect to the recruitment API.' : 'Unable to create your account.'))
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, type = 'text', placeholder = '') => (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-2 block">{label}</span>
      <input className="field" required type={type} placeholder={placeholder} value={form[name]} onChange={(event) => update(name, event.target.value)} />
    </label>
  )

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_1.05fr]">
      <section className="hero-grid hidden bg-navy px-10 py-10 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-md">
          <p className="eyebrow-light"><BrainCircuit size={14} /> Campus recruitment lab</p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight">Transparent student–job matching.</h1>
          <p className="mt-5 leading-7 text-slate-300">Students review explainable job-fit scores. Recruiters rank eligible candidates with the same TF-IDF and semantic pipeline.</p>
          <p className="mt-10 flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="text-teal" size={16} /> Academic prototype authentication</p>
        </div>
      </section>

      <section className="flex flex-col px-6 py-8 sm:px-10">
        <button className="button-ghost w-fit" onClick={onBack} type="button"><ArrowLeft size={16} /> Back home</button>
        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="lg:hidden"><Logo /></div>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            {[['login', 'Log in'], ['register', 'Create account']].map(([key, label]) => (
              <button
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${view === key ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                key={key}
                onClick={() => switchView(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="mt-7 font-display text-2xl font-extrabold text-navy">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin ? 'Log in to your Smart Campus workspace.' : 'Student details feed the matching models; recruiters post and rank roles.'}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {['student', 'recruiter'].map((option) => (
              <button
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition ${role === option ? 'bg-navy text-white' : 'text-slate-500 hover:text-navy'}`}
                key={option}
                onClick={() => { setRole(option); setError('') }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-5" onSubmit={submit}>
            {isLogin ? (
              <>
                <label className="block text-sm font-semibold text-slate-700">
                  <span className="mb-2 block">{role === 'student' ? 'Email or student ID' : 'Recruiter email'}</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={17} />
                    <input className="field pl-10" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? 'Enter your email or student ID' : 'Enter your recruiter email'} />
                  </span>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  <span className="mb-2 block">Password</span>
                  <span className="relative block">
                    <LockKeyhole className="absolute left-3 top-3.5 text-slate-400" size={17} />
                    <input className="field pl-10" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
                  </span>
                </label>
              </>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {field('name', 'Full name', 'text', 'Your name')}
                {field('email', 'Email', 'email', 'you@example.com')}
                {field('password', 'Password', 'password', 'At least 6 characters')}
                {role === 'student' ? (
                  <>
                    {field('student_id', 'Student ID', 'text', 'Your college ID')}
                    {field('department', 'Department', 'text', 'Data Science')}
                    {field('cgpa', 'CGPA', 'number', '0 - 10')}
                    {field('graduation_year', 'Graduation year', 'number', '2026')}
                  </>
                ) : (
                  <span className="sm:col-span-2">{field('company', 'Company name', 'text', 'Your company')}</span>
                )}
              </div>
            )}

            {error && <p className="alert-error">{error}</p>}
            <button className="button-primary w-full py-3.5" disabled={loading} type="submit">
              {loading
                ? (isLogin ? 'Signing in...' : 'Creating account...')
                : (isLogin ? `Log in as ${role}` : 'Create account')}
              {isLogin ? <ArrowRight size={16} /> : <UserRound size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? (
              <>New here? <button className="font-semibold text-teal hover:underline" onClick={() => switchView('register')} type="button">Create your account</button></>
            ) : (
              <>Already registered? <button className="font-semibold text-teal hover:underline" onClick={() => switchView('login')} type="button">Log in</button></>
            )}
          </p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
