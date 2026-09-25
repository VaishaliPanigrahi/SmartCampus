import { ArrowLeft, CalendarDays, Check, FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { ScoreBar } from '../components/ui'
import api from '../services/api'

const emptySchedule = { scheduled_at: '', mode: 'Online', meeting_link: '', location: '', notes: '' }

const STATUS_OPTIONS = ['Shortlisted', 'Interview', 'Offer', 'Rejected']
const STATUS_STYLES = {
  Applied: 'bg-slate-100 text-slate-600',
  Shortlisted: 'bg-teal-50 text-teal-700',
  Interview: 'bg-sky-50 text-sky-700',
  Offer: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-600',
}

function formatInterview(value) {
  const date = new Date(value)
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

function CandidateRanking({ jobId, onBack, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [scheduling, setScheduling] = useState(null)
  const [schedule, setSchedule] = useState(emptySchedule)
  const [savingSchedule, setSavingSchedule] = useState(false)

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

  async function updateStatus(candidate, status) {
    if (status === candidate.application_status) return
    setActionId(candidate.student_id)
    setError('')
    setMessage('')
    try {
      await api.post(`/jobs/${jobId}/candidates/${candidate.student_id}/status`, { status })
      setData((current) => ({
        ...current,
        candidates: current.candidates.map((item) => item.student_id === candidate.student_id ? { ...item, application_status: status } : item),
      }))
      setMessage(`${candidate.name} moved to ${status}.`)
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to update this candidate's status.")
    } finally {
      setActionId(null)
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  function openScheduler(candidate) {
    setScheduling(candidate)
    setSchedule({
      ...emptySchedule,
      scheduled_at: candidate.interview_at ? candidate.interview_at.slice(0, 16) : '',
      mode: candidate.interview_mode || 'Online',
    })
    setError('')
    setMessage('')
  }

  function closeScheduler() {
    setScheduling(null)
    setSchedule(emptySchedule)
  }

  async function submitSchedule(event) {
    event.preventDefault()
    setSavingSchedule(true)
    setError('')
    setMessage('')
    try {
      const response = await api.post(`/jobs/${jobId}/candidates/${scheduling.student_id}/interview`, schedule)
      const interview = response.data.interview
      setData((current) => ({
        ...current,
        candidates: current.candidates.map((item) => item.student_id === scheduling.student_id
          ? { ...item, interview_at: interview.scheduled_at, interview_mode: interview.mode }
          : item),
      }))
      setMessage(`Interview scheduled for ${scheduling.name}.`)
      closeScheduler()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to schedule this interview.')
    } finally {
      setSavingSchedule(false)
    }
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
                      {candidate.application_status ? (
                        <div className="flex flex-col items-start gap-2">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[candidate.application_status] || 'bg-slate-100 text-slate-600'}`}>
                            {candidate.application_status}
                          </span>
                          <select
                            className="field w-40 py-1.5 text-xs"
                            value={candidate.application_status}
                            disabled={actionId === candidate.student_id}
                            onChange={(event) => updateStatus(candidate, event.target.value)}
                          >
                            {candidate.application_status === 'Applied' && <option value="Applied">Applied</option>}
                            {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                          {(candidate.application_status === 'Shortlisted' || candidate.application_status === 'Interview') && (
                            candidate.interview_at ? (
                              <>
                                <span className="chip-muted"><CalendarDays size={14} /> {formatInterview(candidate.interview_at)}</span>
                                <button className="button-ghost whitespace-nowrap px-3 py-1.5 text-xs" onClick={() => openScheduler(candidate)}>Reschedule</button>
                              </>
                            ) : (
                              <button className="button-ghost gap-2 whitespace-nowrap px-3 py-1.5 text-xs" onClick={() => openScheduler(candidate)}>
                                <CalendarDays size={14} /> Schedule interview
                              </button>
                            )
                          )}
                        </div>
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
      {scheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm" onClick={closeScheduler}>
          <form className="card w-full max-w-lg p-6" onClick={(event) => event.stopPropagation()} onSubmit={submitSchedule}>
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Schedule interview</p>
                <h2 className="mt-2 font-display text-xl font-bold text-navy">{scheduling.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{data?.job.job_title} · {data?.job.company}</p>
              </div>
              <button className="button-ghost px-2 py-2" onClick={closeScheduler} type="button" aria-label="Close"><X size={16} /></button>
            </div>
            {error && <p className="alert-error mt-4">{error}</p>}
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400" htmlFor="scheduled_at">Date & time</label>
                <input className="field" id="scheduled_at" type="datetime-local" required value={schedule.scheduled_at}
                  onChange={(event) => setSchedule((s) => ({ ...s, scheduled_at: event.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400" htmlFor="mode">Mode</label>
                <select className="field" id="mode" value={schedule.mode} onChange={(event) => setSchedule((s) => ({ ...s, mode: event.target.value }))}>
                  <option value="Online">Online</option>
                  <option value="Onsite">On-site</option>
                </select>
              </div>
              {schedule.mode === 'Online' ? (
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400" htmlFor="meeting_link">Meeting link</label>
                  <input className="field" id="meeting_link" type="url" placeholder="https://meet.google.com/..." required value={schedule.meeting_link}
                    onChange={(event) => setSchedule((s) => ({ ...s, meeting_link: event.target.value }))} />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400" htmlFor="location">Location</label>
                  <input className="field" id="location" type="text" placeholder="Campus interview room" required value={schedule.location}
                    onChange={(event) => setSchedule((s) => ({ ...s, location: event.target.value }))} />
                </div>
              )}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400" htmlFor="notes">Notes (optional)</label>
                <textarea className="field" id="notes" rows={3} placeholder="Interview rounds, preparation tips, contacts..." value={schedule.notes}
                  onChange={(event) => setSchedule((s) => ({ ...s, notes: event.target.value }))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="button-ghost" type="button" onClick={closeScheduler}>Cancel</button>
              <button className="button-primary" type="submit" disabled={savingSchedule}>
                {savingSchedule ? 'Scheduling...' : 'Schedule interview'} <CalendarDays size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}

export default CandidateRanking
