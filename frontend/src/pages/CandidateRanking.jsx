import { ArrowLeft, BrainCircuit, Check, FileText, LogOut, Trophy, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'

function CandidateRanking({ jobId, onBack, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadCandidates() {
    try {
      const response = await api.get(`/jobs/${jobId}/candidates`)
      setData(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load candidates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCandidates() }, [jobId])

  async function shortlist(candidate) {
    setActionId(candidate.student_id)
    setError('')
    setMessage('')
    try {
      await api.post(`/jobs/${jobId}/candidates/${candidate.student_id}/shortlist`)
      setData((current) => ({ ...current, candidates: current.candidates.map((item) => item.student_id === candidate.student_id ? { ...item, application_status: 'Shortlisted' } : item) }))
      setMessage(`${candidate.name} has been shortlisted.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to shortlist this candidate.')
    } finally {
      setActionId(null)
    }
  }

  function logout() { localStorage.removeItem('smart-campus-token'); localStorage.removeItem('smart-campus-user'); onLogout() }

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10"><header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div><button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button></header><section className="mx-auto max-w-7xl py-12"><button className="button-secondary mb-8 gap-2 px-3 py-2" onClick={onBack}><ArrowLeft size={15} /> Dashboard</button>{loading && <p className="text-white/50">Ranking eligible candidates...</p>}{error && !data && <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}{data && <><p className="eyebrow"><Trophy size={14} /> Candidate ranking</p><h1 className="mt-4 font-display text-4xl font-bold">{data.job.job_title}</h1><p className="mt-4 text-white/50">Eligibility filtering is complete. Candidates are ranked by AI match score.</p>{message && <p className="mt-6 rounded-lg border border-lime/20 bg-lime/10 px-4 py-3 text-sm text-lime">{message}</p>}{error && <p className="mt-6 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-panel"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-white/40"><tr><th className="px-6 py-4">Rank</th><th className="px-6 py-4">Candidate</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">CGPA</th><th className="px-6 py-4">Match</th><th className="px-6 py-4">Signals</th><th className="px-6 py-4">Action</th></tr></thead><tbody className="divide-y divide-white/10">{data.candidates.map((candidate, index) => <tr key={candidate.student_id}><td className="px-6 py-5 font-display text-lg font-bold text-lime">#{index + 1}</td><td className="px-6 py-5"><p className="font-semibold">{candidate.name}</p><p className="mt-1 text-xs text-white/40">{candidate.college_id}</p></td><td className="px-6 py-5 text-sm text-white/60">{candidate.department}</td><td className="px-6 py-5 text-sm text-white/60">{candidate.cgpa}</td><td className="px-6 py-5"><strong className="font-display text-xl text-lime">{Math.round(candidate.final_score)}%</strong><p className="mt-1 text-xs text-white/35">{Math.round(candidate.semantic_score)}% semantic</p></td><td className="px-6 py-5"><div className="flex flex-wrap gap-1">{candidate.matched_skills.slice(0, 3).map((skill) => <span className="flex items-center gap-1 text-xs text-lime" key={skill}><Check size={12} /> {skill}</span>)}{candidate.resume_uploaded && <span className="flex items-center gap-1 text-xs text-white/40"><FileText size={12} /> Resume</span>}</div></td><td className="px-6 py-5">{candidate.application_status === 'Shortlisted' ? <span className="flex items-center gap-1 text-xs font-semibold text-lime"><UserCheck size={15} /> Shortlisted</span> : candidate.application_status ? <button className="button-primary gap-2 whitespace-nowrap px-3 py-2 text-xs" disabled={actionId === candidate.student_id} onClick={() => shortlist(candidate)}>{actionId === candidate.student_id ? 'Saving...' : 'Shortlist'} <UserCheck size={14} /></button> : <span className="text-xs text-white/30">Not applied</span>}</td></tr>)}</tbody></table>{data.candidates.length === 0 && <p className="p-10 text-center text-white/45">No eligible candidates found for this role.</p>}</div></>}</section></main>
}
export default CandidateRanking
