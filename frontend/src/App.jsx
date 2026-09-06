import { ArrowRight, BarChart3, BrainCircuit, Check, ChevronRight, FileText, Menu, Network, Search, Sparkles, Target, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
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

const stages = [
  { icon: FileText, label: 'Student data', detail: 'Profile + resume' },
  { icon: Network, label: 'NLP models', detail: 'TF-IDF + semantic' },
  { icon: Target, label: 'Clear matches', detail: 'Ranked + explainable' },
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
  return <main className="min-h-screen overflow-hidden bg-paper text-ink">
    <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" />
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
      <a className="flex items-center gap-3" href="#top" aria-label="Smart Campus home"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-lime shadow-lg shadow-ink/15"><BrainCircuit size={21} strokeWidth={2.5} /></span><span className="font-display text-lg font-bold tracking-tight">Smart Campus<span className="text-coral">.</span></span></a>
      <button className="rounded-lg border border-ink/15 p-2 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <div className={`${menuOpen ? 'absolute left-6 right-6 top-20 flex' : 'hidden'} flex-col gap-5 rounded-2xl border border-ink/10 bg-paper p-5 shadow-xl md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}><a className="nav-link-light" href="#method">The method</a><a className="nav-link-light" href="#flow">How it works</a><a className="nav-link-light" href="/login">Log in</a><a className="button-dark" href="/register">Get started <ArrowRight size={16} /></a></div>
    </nav>

    <section id="top" className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
      <div className="relative z-10"><div className="eyebrow-dark"><span className="pulse-dot" /> Academic research prototype</div><h1 className="mt-7 max-w-3xl font-display text-[clamp(3.5rem,7vw,6.8rem)] font-bold leading-[0.9] tracking-[-0.04em]">Find the <span className="marker">right fit.</span><br />Make it <span className="text-coral">visible.</span></h1><p className="mt-8 max-w-xl text-lg leading-8 text-ink/60">A transparent student-job matching system for smarter campus recruitment, powered by profile data, resume signals, and NLP.</p><div className="mt-10 flex flex-wrap items-center gap-4"><a className="button-dark px-6 py-3.5" href="/register">Create your profile <ArrowRight size={17} /></a><a className="button-outline px-6 py-3.5" href="#method">See the method</a></div><div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-ink/15 pt-5 text-sm text-ink/50"><span className="flex items-center gap-2"><Check className="text-coral" size={15} /> Explainable scores</span><span className="flex items-center gap-2"><Check className="text-coral" size={15} /> Eligibility first</span><span className="flex items-center gap-2"><Check className="text-coral" size={15} /> Research-ready</span></div></div>
      <div className="relative mx-auto w-full max-w-xl lg:pt-8"><div className="absolute -right-16 -top-10 h-40 w-40 rounded-full border border-coral/25" /><div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-lime/45" /><div className="relative rotate-1 border-2 border-ink bg-ink p-3 shadow-[14px_14px_0_#ff7869] sm:p-5"><div className="border border-white/15 bg-ink-deep p-5 sm:p-7"><div className="flex items-start justify-between border-b border-white/10 pb-5"><div><p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Matching workspace</p><h2 className="mt-2 font-display text-xl font-bold text-white">From input to insight</h2></div><span className="rounded-full border border-lime/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-lime">System ready</span></div><div className="space-y-3 py-7">{stages.map(({ icon: Icon, label, detail }, index) => <div className="flex items-center gap-4" key={label}><span className={`grid h-12 w-12 shrink-0 place-items-center ${index === 1 ? 'bg-lime text-ink' : 'bg-white/10 text-white/60'}`}><Icon size={20} /></span><div className="flex-1"><p className="font-display text-sm font-bold text-white">{label}</p><p className="mt-1 text-xs text-white/40">{detail}</p></div>{index < stages.length - 1 && <ChevronRight className="text-white/25" size={18} />}</div>)}</div><div className="flex items-center justify-between border-t border-white/10 pt-5"><span className="text-xs text-white/40">A clearer signal for every opportunity</span><Search className="text-lime" size={18} /></div></div></div><p className="mt-7 text-center font-display text-xs uppercase tracking-[0.2em] text-ink/40">Student data <span className="mx-2 text-coral">→</span> NLP models <span className="mx-2 text-coral">→</span> Job fit</p></div>
    </section>

    <section id="method" className="relative border-y border-ink/10 bg-ink px-6 py-20 text-white lg:px-10"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end"><div><p className="eyebrow"><Sparkles size={14} /> Why this exists</p><h2 className="mt-5 max-w-md font-display text-3xl font-bold leading-tight sm:text-4xl">Better matches begin with better context.</h2></div><div className="grid gap-8 sm:grid-cols-3"><Feature icon={<Users size={20} />} number="01" title="Student first" text="Profiles turn skills, goals, and projects into usable context." /><Feature icon={<BarChart3 size={20} />} number="02" title="Two lenses" text="Compare lexical TF-IDF with semantic similarity." /><Feature icon={<Target size={20} />} number="03" title="Clear reasons" text="Recommendations show the signals behind the score." /></div></div></section>

    <section id="flow" className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><div className="flex flex-col justify-between gap-5 border-b border-ink/15 pb-8 sm:flex-row sm:items-end"><div><p className="eyebrow-dark">The workflow</p><h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">One system. Two perspectives.</h2></div><p className="max-w-sm text-sm leading-6 text-ink/50">Students discover their fit. Recruiters see the eligible talent behind each match.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2"><a className="role-panel group" href="/register"><span className="role-number">01</span><h3 className="mt-16 font-display text-2xl font-bold">For students</h3><p className="mt-3 max-w-sm leading-7 text-ink/55">Build your profile, upload a resume, and discover opportunities ranked around your actual strengths.</p><span className="mt-8 inline-flex items-center gap-2 text-sm font-bold">Explore as a student <ArrowRight className="transition group-hover:translate-x-1" size={16} /></span></a><a className="role-panel role-panel-coral group" href="/register"><span className="role-number">02</span><h3 className="mt-16 font-display text-2xl font-bold">For recruiters</h3><p className="mt-3 max-w-sm leading-7 text-ink/55">Post a focused role and rank eligible candidates with transparent matching signals.</p><span className="mt-8 inline-flex items-center gap-2 text-sm font-bold">Explore as a recruiter <ArrowRight className="transition group-hover:translate-x-1" size={16} /></span></a></div></section>
    <footer className="border-t border-ink/15 px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-ink/45 sm:flex-row"><span className="font-display font-bold text-ink">Smart Campus<span className="text-coral">.</span></span><span>AI matching research prototype · MySQL-backed</span></div></footer>
  </main>
}

function Feature({ icon, number, title, text }) { return <div><span className="flex items-center gap-3 text-lime"><span className="grid h-9 w-9 place-items-center border border-lime/30">{icon}</span><small className="font-display">{number}</small></span><h3 className="mt-5 font-display font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div> }

export default App
