import {
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react'
import Logo from './Logo'

const studentNav = [
  { href: '/student/dashboard', id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/student/profile', id: 'profile', label: 'Profile', icon: UserRound },
  { href: '/student/resume', id: 'resume', label: 'Resume analysis', icon: FileText },
  { href: '/student/recommendations', id: 'recommendations', label: 'Recommendations', icon: Sparkles },
  { href: '/student/applications', id: 'applications', label: 'Applications', icon: BriefcaseBusiness },
]

const recruiterNav = [
  { href: '/recruiter/dashboard', id: 'jobs', label: 'Job board', icon: BriefcaseBusiness },
  { href: '/recruiter/post-job', id: 'post-job', label: 'Post a role', icon: Plus },
]

function AppShell({ role = 'student', active, onLogout, title, subtitle, children, extra }) {
  const nav = role === 'recruiter' ? recruiterNav : studentNav
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('smart-campus-user') || 'null') } catch { return null }
  })()

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-navy text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Logo light />
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4 lg:pb-0">
          {nav.map(({ href, id, label, icon: Icon }) => (
            <a className={`sidebar-link shrink-0 ${active === id ? 'active' : ''}`} href={href} key={id}>
              <Icon size={17} /> {label}
            </a>
          ))}
          {role === 'recruiter' && active === 'candidates' && (
            <span className="sidebar-link active shrink-0">
              <Trophy size={17} /> Candidate ranking
            </span>
          )}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate text-sm font-semibold">{user?.name || 'Signed in'}</p>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-teal">{role}</p>
          <button className="button-secondary mt-4 w-full py-2 text-xs" onClick={onLogout}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
          <div>
            {subtitle && <p className="eyebrow">{subtitle}</p>}
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {extra}
            <button className="button-ghost lg:hidden" onClick={onLogout}><LogOut size={15} /> Log out</button>
          </div>
        </header>
        <main className="px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

export default AppShell
