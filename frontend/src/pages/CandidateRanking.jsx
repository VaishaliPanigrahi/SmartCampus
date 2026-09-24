import { ArrowLeft, Check, FileText, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { ScoreBar } from '../components/ui'
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
      setData((current) => ({
        ...current,
        candidates: current.candidates.map((item) => item.student_id === candidate.student_id ? { ...item, application_status: 'Shortlisted' } : item),
      }))
      setMessage(`${candidate.name} has been shortlisted.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to shortlist this candidate.')
    } finally {
      setActionId(null)
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  return (
    <AppShell
      role="recruiter"
      active="candidates"
      onLogout={logout}
      subtitle="Candidate ranking"
      title={data?.job.job_title || 'Ranked candidates'}
      extra={<button className="button-ghost" onClick={onBack}><ArrowLeft size={15} /> Job board</button>}
    >
      {loading && <p className="text-slate-500">Ranking eligible candidates...</p>}
      {error && !data && <p className="alert-error">{error}</p>}
      {data && (
        <>
          <p className="mb-6 text-slate-500">Eligibility filtering is complete. Candidates are ranked by AI match score.</p>
          {message && <p className="alert-ok mb-4">{message}</p>}
          {error && <p className="alert-error mb-4">{error}</p>}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-100 bg-canvas font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">CGPA</th>
                  <th className="px-6 py-4">Match</th>
                  <th className="px-6 py-4">Signals</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.candidates.map((candidate, index) => (
                  <tr className="align-top" key={candidate.student_id}>
                    <td className="px-6 py-5 font-display text-lg font-extrabold text-teal">#{index + 1}</td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-navy">{candidate.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{candidate.college_id}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">{candidate.department}</td>
                    <td className="px-6 py-5 text-sm text-slate-600">{candidate.cgpa}</td>
                    <td className="px-6 py-5 min-w-[140px]">
                      <strong className="font-display text-xl text-navy">{Math.round(candidate.final_score)}%</strong>
                      <p className="mt-1 text-xs text-slate-400">{Math.round(candidate.semantic_score)}% semantic</p>
                      <div className="mt-2 w-28"><ScoreBar value={candidate.final_score} /></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {candidate.matched_skills.slice(0, 3).map((skill) => (
                          <span className="chip" key={skill}><Check size={12} /> {skill}</span>
                        ))}
                        {candidate.resume_uploaded && <span className="chip-muted"><FileText size={12} /> Resume</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {candidate.application_status === 'Shortlisted' ? (
                        <span className="chip"><UserCheck size={15} /> Shortlisted</span>
                      ) : candidate.application_status ? (
                        <button className="button-primary gap-2 whitespace-nowrap px-3 py-2 text-xs" disabled={actionId === candidate.student_id} onClick={() => shortlist(candidate)}>
                          {actionId === candidate.student_id ? 'Saving...' : 'Shortlist'} <UserCheck size={14} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Not applied</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.candidates.length === 0 && <p className="p-10 text-center text-slate-400">No eligible candidates found for this role.</p>}
          </div>
        </>
      )}
    </AppShell>
  )
}

export default CandidateRanking
