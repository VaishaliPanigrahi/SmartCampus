import { ArrowRight, BarChart3, Check, FileText, Filter, Menu, Network, Sparkles, Target, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Logo from './components/Logo'
import Applications from './pages/Applications'
import CandidateRanking from './pages/CandidateRanking'
import JobDetails from './pages/JobDetails'
import LoginPage from './pages/LoginPage'
import PostJob from './pages/PostJob'
import RecommendedJobs from './pages/RecommendedJobs'
import RegisterPage from './pages/RegisterPage'
import RecruiterDashboard from './pages/RecruiterDashboard'
import ResumePage from './pages/ResumePage'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'

const pipeline = [
  { icon: FileText, label: 'Student signals', detail: 'Profile, CGPA, resume text' },
  { icon: Filter, label: 'Eligibility filter', detail: 'Department, year, minimum CGPA' },
  { icon: Network, label: 'NLP scoring', detail: 'TF-IDF + semantic similarity' },
  { icon: Target, label: 'Ranked fit', detail: 'Explainable match percentages' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const handleNavigation = () => setRoute(window.location.pathname)
    const handleInternalLink = (event) => {
      const link = event.target.closest('a')
      if (!link || link.target === '_blank' || link.origin !== window.location.origin) return
      const url = new URL(link.href)
      if (url.hash && url.pathname === window.location.pathname) return
      event.preventDefault()
      goTo(url.pathname)
    }
    window.addEventListener('popstate', handleNavigation)
    document.addEventListener('click', handleInternalLink)
    return () => {
      window.removeEventListener('popstate', handleNavigation)
      document.removeEventListener('click', handleInternalLink)
    }
  }, [])

  function goTo(path) {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo(0, 0)
  }

  function goHome() { goTo('/') }

  function isAllowed(role) {
    const token = localStorage.getItem('smart-campus-token')
    let user = null
    try { user = JSON.parse(localStorage.getItem('smart-campus-user') || 'null') } catch { localStorage.removeItem('smart-campus-user') }
    return Boolean(token && user?.role === role)
  }

  const login = (user) => goTo(user.role === 'student' ? '/student/dashboard' : '/recruiter/dashboard')
  if (route === '/login') return <LoginPage onBack={goHome} onLogin={login} />
  if (route === '/register') return <RegisterPage onBack={goHome} onRegistered={login} />
  if (route.startsWith('/student/') && !isAllowed('student')) return <LoginPage onBack={goHome} onLogin={login} />
  if (route.startsWith('/recruiter/') && !isAllowed('recruiter')) return <LoginPage onBack={goHome} onLogin={login} />
  if (route === '/student/dashboard') return <StudentDashboard onLogout={goHome} />
  if (route === '/student/profile') return <StudentProfile onLogout={goHome} />
  if (route === '/student/resume') return <ResumePage onBack={() => goTo('/student/profile')} onLogout={goHome} />
  if (route === '/student/recommendations') return <RecommendedJobs onBack={() => goTo('/student/profile')} onLogout={goHome} />
  if (route === '/student/applications') return <Applications onBack={() => goTo('/student/profile')} onLogout={goHome} />
  if (route.startsWith('/student/job/')) return <JobDetails jobId={route.split('/').pop()} onBack={() => goTo('/student/recommendations')} onLogout={goHome} />
  if (route === '/recruiter/dashboard') return <RecruiterDashboard onLogout={goHome} />
  if (route === '/recruiter/post-job') return <PostJob onBack={() => goTo('/recruiter/dashboard')} onNavigate={goTo} onLogout={goHome} />
  if (route.startsWith('/recruiter/jobs/') && route.endsWith('/candidates')) return <CandidateRanking jobId={route.split('/')[3]} onBack={() => goTo('/recruiter/dashboard')} onLogout={goHome} />

  return <LandingPage menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
}

function LandingPage({ menuOpen, setMenuOpen }) {
  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="hero-grid relative overflow-hidden">
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <Logo light />
          <button className="rounded-lg border border-white/15 p-2 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className={`${menuOpen ? 'absolute left-6 right-6 top-20 flex' : 'hidden'} flex-col gap-4 rounded-2xl border border-white/10 bg-navy-800 p-5 shadow-lift md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
            <a className="nav-link" href="#pipeline">Pipeline</a>
            <a className="nav-link" href="#method">Method</a>
            <a className="nav-link" href="/login">Log in</a>
            <a className="button-primary" href="/register">Get started <ArrowRight size={16} /></a>
          </div>
        </nav>

        <section className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-16">
          <div>
            <p className="eyebrow-light"><Sparkles size={13} /> Third-year data science prototype</p>
            <h1 className="mt-5 max-w-xl font-display text-[clamp(2.4rem,5vw,4.4rem)] font-extrabold leading-[1.05] tracking-tight">
              Transparent student–job matching for campus recruitment.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Smart Campus ranks eligible students against posted roles using profile data, resume extraction, TF-IDF, and semantic similarity — with scores you can explain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="button-primary px-5 py-3" href="/register">Create an account <ArrowRight size={16} /></a>
              <a className="button-secondary px-5 py-3" href="#pipeline">View the pipeline</a>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <MiniStat value="70/30" label="Semantic / TF-IDF" />
              <MiniStat value="NLP" label="Resume + profile" />
              <MiniStat value="MySQL" label="Research backend" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lift backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">Matching pipeline</p>
                <h2 className="mt-1 font-display text-lg font-bold">From features to ranked fit</h2>
              </div>
              <span className="rounded-full bg-teal/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-teal-100">Live model</span>
            </div>
            <ol className="mt-5 space-y-3">
              {pipeline.map(({ icon: Icon, label, detail }, index) => (
                <li className="flex gap-4 rounded-xl bg-navy-800/70 p-3.5" key={label}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/15 text-teal">{<Icon size={18} />}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{index + 1}. {label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </header>

      <section id="pipeline" className="bg-canvas px-6 py-20 text-ink lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">How the system works</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="max-w-xl font-display text-3xl font-extrabold text-navy sm:text-4xl">Eligibility first. Then NLP ranking.</h2>
            <p className="max-w-sm text-sm leading-6 text-slate-500">Hard filters protect fairness. Soft scores surface the best remaining matches for students and recruiters.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <a className="group card p-8 transition hover:-translate-y-0.5 hover:shadow-lift" href="/register">
              <span className="font-mono text-xs font-semibold text-teal">01 · Students</span>
              <h3 className="mt-10 font-display text-2xl font-bold text-navy">Discover ranked opportunities</h3>
              <p className="mt-3 max-w-sm leading-7 text-slate-500">Build an academic profile, upload a resume, and inspect match scores with TF-IDF and semantic breakdowns.</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-teal">Enter student workspace <ArrowRight className="transition group-hover:translate-x-1" size={16} /></span>
            </a>
            <a className="group overflow-hidden rounded-2xl bg-navy p-8 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift" href="/register">
              <span className="font-mono text-xs font-semibold text-teal">02 · Recruiters</span>
              <h3 className="mt-10 font-display text-2xl font-bold">Rank eligible campus talent</h3>
              <p className="mt-3 max-w-sm leading-7 text-slate-300">Post a focused role, apply department and CGPA constraints, then shortlist candidates by transparent model scores.</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-teal">Enter recruiter workspace <ArrowRight className="transition group-hover:translate-x-1" size={16} /></span>
            </a>
          </div>
        </div>
      </section>

      <section id="method" className="border-t border-slate-200 bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Research method</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold text-navy sm:text-4xl">A matching engine you can defend in a viva.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Feature icon={<Users size={18} />} title="Structured student features" text="Skills, projects, CGPA, department, and preferred role become the primary matching context." />
            <Feature icon={<BarChart3 size={18} />} title="Two similarity lenses" text="Lexical TF-IDF captures keyword overlap. Semantic similarity captures meaning beyond exact terms." />
            <Feature icon={<Target size={18} />} title="Explainable output" text="Each recommendation shows a final score, matched skills, and the 70/30 model blend." />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-navy px-6 py-8 text-sm text-slate-400 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <span className="font-display font-bold text-white">Smart Campus Recruitment Lab</span>
          <span>Academic prototype · NLP ranking · MySQL backend</span>
        </div>
      </footer>
    </div>
  )
}

function MiniStat({ value, label }) {
  return (
    <div>
      <p className="font-display text-lg font-bold text-white sm:text-xl">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-400">{label}</p>
    </div>
  )
}

function Feature({ icon, title, text }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-canvas p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-teal shadow-sm">{icon}</span>
      <h3 className="mt-5 font-display font-bold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </article>
  )
}

export default App
