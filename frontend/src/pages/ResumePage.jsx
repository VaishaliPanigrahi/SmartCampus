import { ArrowLeft, BrainCircuit, Check, FileText, Lightbulb, LogOut, Sparkles, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

function ResumePage({ onBack, onLogout }) {
  const inputRef = useRef(null)
  const [resume, setResume] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/student/resume').then((response) => setResume(response.data.resume)).catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load resume status.')).finally(() => setLoading(false))
  }, [])

  function chooseFile(event) {
    const file = event.target.files?.[0]
    setError('')
    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null)
      setError('Please select a PDF resume.')
      return
    }
    setSelectedFile(file || null)
  }

  async function uploadResume(event) {
    event.preventDefault()
    if (!selectedFile) { setError('Choose a PDF resume before uploading.'); return }
    setUploading(true); setError('')
    const formData = new FormData(); formData.append('resume', selectedFile)
    try {
      const response = await api.post('/student/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResume(response.data.resume); setSelectedFile(null); if (inputRef.current) inputRef.current.value = ''
    } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to analyze this resume.') } finally { setUploading(false) }
  }

  function logout() { localStorage.removeItem('smart-campus-token'); localStorage.removeItem('smart-campus-user'); onLogout() }
  const analysis = resume?.analysis

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10"><header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div><button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button></header><section className="mx-auto max-w-6xl py-12"><button className="button-secondary mb-8 gap-2 px-3 py-2" onClick={onBack}><ArrowLeft size={15} /> Profile</button><p className="eyebrow">Resume analysis</p><h1 className="mt-4 font-display text-4xl font-bold">See how your resume reads.</h1><p className="mt-4 max-w-2xl leading-7 text-white/55">Upload a PDF to extract its text and run a transparent prototype ATS-style check against your profile.</p><div className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]"><form className="rounded-2xl border border-white/10 bg-panel p-6" onSubmit={uploadResume}><div className="grid h-44 place-items-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-center"><UploadCloud className="text-lime" size={30} /><div className="mt-3"><p className="font-semibold">Choose a PDF resume</p><p className="mt-1 text-xs text-white/40">Maximum file size: 5 MB</p></div><input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={chooseFile} /></div><button type="button" className="button-secondary mt-5 w-full py-3" onClick={() => inputRef.current?.click()}>{selectedFile ? selectedFile.name : 'Select PDF file'}</button><button className="button-primary mt-3 w-full py-3.5" disabled={uploading}>{uploading ? 'Analyzing resume...' : 'Upload and analyze'} <UploadCloud size={16} /></button>{error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}</form><section className="space-y-6">{loading && <p className="text-white/50">Loading resume status...</p>}{!loading && !resume?.uploaded && <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 text-center text-white/40"><div><FileText className="mx-auto mb-3 text-white/25" size={32} /><p>No resume uploaded yet.</p><p className="mt-1 text-sm">Upload a PDF to see analysis.</p></div></div>}{analysis && <AnalysisCard analysis={analysis} />}{resume?.uploaded && <div className="rounded-2xl border border-white/10 bg-panel p-6"><div className="flex items-center gap-3"><FileText className="text-lime" size={19} /><div><p className="font-semibold">Resume uploaded</p><p className="text-xs text-white/40">Text extracted and used by the matching engine</p></div></div></div>}</section></div></section></main>
}

function AnalysisCard({ analysis }) {
  const sectionNames = Object.entries(analysis.sections).map(([name, present]) => ({ name, present }))
  return <section className="rounded-2xl border border-lime/20 bg-lime/[0.06] p-6"><div className="flex flex-col justify-between gap-5 border-b border-lime/15 pb-5 sm:flex-row sm:items-center"><div><p className="eyebrow"><Sparkles size={14} /> AI / ML analysis</p><h2 className="mt-2 font-display text-2xl font-bold">Resume signal score</h2><p className="mt-1 text-xs text-white/40">{analysis.score_label}</p></div><div className="font-display text-5xl font-bold text-lime">{analysis.ats_score}<span className="text-xl text-white/40">/100</span></div></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Words extracted" value={analysis.word_count} /><Stat label="Profile alignment" value={`${analysis.profile_alignment}%`} /><Stat label="NLP text ready" value={analysis.nlp_ready ? 'Yes' : 'Limited'} /></div><div className="mt-6"><p className="flex items-center gap-2 text-sm font-semibold text-white/70"><BrainCircuit className="text-lime" size={16} /> AI/ML signals detected</p><div className="mt-3 flex flex-wrap gap-2">{analysis.ai_ml_signals.map((signal) => <span className="rounded-full bg-lime/15 px-3 py-1.5 text-xs font-semibold capitalize text-lime" key={signal}>{signal}</span>)}{analysis.ai_ml_signals.length === 0 && <span className="text-sm text-white/40">No AI/ML keywords detected yet.</span>}</div></div><div className="mt-6"><p className="text-sm font-semibold text-white/70">Resume sections</p><div className="mt-3 flex flex-wrap gap-2">{sectionNames.map(({ name, present }) => <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${present ? 'bg-lime/15 text-lime' : 'bg-white/10 text-white/40'}`} key={name}>{present ? <Check size={13} /> : null} {name}</span>)}</div></div><div className="mt-6"><p className="flex items-center gap-2 text-sm font-semibold text-white/70"><Lightbulb className="text-lime" size={16} /> Model suggestions</p><ul className="mt-3 space-y-2 text-sm leading-6 text-white/55">{analysis.suggestions.map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}</ul></div></section>
}
function Stat({ label, value }) { return <div className="rounded-lg bg-black/15 p-4"><p className="text-xs text-white/40">{label}</p><p className="mt-1 font-display text-xl font-bold text-white">{value}</p></div> }
export default ResumePage
