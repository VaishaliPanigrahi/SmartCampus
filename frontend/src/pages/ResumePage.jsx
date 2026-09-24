import { BrainCircuit, Check, FileText, Lightbulb, Sparkles, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import api from '../services/api'

function ResumePage({ onLogout }) {
  const inputRef = useRef(null)
  const [resume, setResume] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/student/resume')
      .then((response) => setResume(response.data.resume))
      .catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load resume status.'))
      .finally(() => setLoading(false))
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
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('resume', selectedFile)
    try {
      const response = await api.post('/student/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResume(response.data.resume)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to analyze this resume.')
    } finally {
      setUploading(false)
    }
  }

  function logout() {
    localStorage.removeItem('smart-campus-token')
    localStorage.removeItem('smart-campus-user')
    onLogout()
  }

  const analysis = resume?.analysis

  return (
    <AppShell role="student" active="resume" onLogout={logout} subtitle="NLP preprocessing" title="Resume analysis">
      <p className="mb-8 max-w-2xl text-slate-500">Upload a PDF to extract text and run a transparent ATS-style check against your profile before matching.</p>
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <form className="card p-6" onSubmit={uploadResume}>
          <div className="grid h-44 place-items-center rounded-xl border border-dashed border-slate-300 bg-canvas text-center">
            <UploadCloud className="text-teal" size={28} />
            <div className="-mt-2">
              <p className="font-semibold text-navy">Choose a PDF resume</p>
              <p className="mt-1 text-xs text-slate-400">Maximum file size: 5 MB</p>
            </div>
            <input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={chooseFile} />
          </div>
          <button type="button" className="button-ghost mt-5 w-full py-3" onClick={() => inputRef.current?.click()}>
            {selectedFile ? selectedFile.name : 'Select PDF file'}
          </button>
          <button className="button-primary mt-3 w-full py-3.5" disabled={uploading}>
            {uploading ? 'Analyzing resume...' : 'Upload and analyze'} <UploadCloud size={16} />
          </button>
          {error && <p className="alert-error mt-4">{error}</p>}
        </form>
        <section className="space-y-6">
          {loading && <p className="text-slate-500">Loading resume status...</p>}
          {!loading && !resume?.uploaded && (
            <div className="card grid min-h-64 place-items-center border-dashed p-8 text-center text-slate-400">
              <div>
                <FileText className="mx-auto mb-3 text-slate-300" size={32} />
                <p>No resume uploaded yet.</p>
                <p className="mt-1 text-sm">Upload a PDF to see analysis.</p>
              </div>
            </div>
          )}
          {analysis && <AnalysisCard analysis={analysis} />}
          {resume?.uploaded && (
            <div className="card flex items-center gap-3 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><FileText size={18} /></span>
              <div>
                <p className="font-semibold text-navy">Resume uploaded</p>
                <p className="text-xs text-slate-400">Extracted text is used by the matching engine</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function AnalysisCard({ analysis }) {
  const sectionNames = Object.entries(analysis.sections).map(([name, present]) => ({ name, present }))
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col justify-between gap-5 border-b border-slate-100 bg-teal-50/50 px-6 py-5 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow"><Sparkles size={13} /> Prototype ATS score</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-navy">Resume signal</h2>
          <p className="mt-1 text-xs text-slate-500">{analysis.score_label}</p>
        </div>
        <div className="font-display text-5xl font-extrabold text-navy">{analysis.ats_score}<span className="text-xl text-slate-400">/100</span></div>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Words extracted" value={analysis.word_count} />
          <Stat label="Profile alignment" value={`${analysis.profile_alignment}%`} />
          <Stat label="NLP text ready" value={analysis.nlp_ready ? 'Yes' : 'Limited'} />
        </div>
        <div className="mt-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy"><BrainCircuit className="text-teal" size={16} /> AI/ML signals detected</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.ai_ml_signals.map((signal) => <span className="chip" key={signal}>{signal}</span>)}
            {analysis.ai_ml_signals.length === 0 && <span className="text-sm text-slate-400">No AI/ML keywords detected yet.</span>}
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm font-semibold text-navy">Resume sections</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sectionNames.map(({ name, present }) => (
              <span className={present ? 'chip' : 'chip-muted'} key={name}>{present ? <Check size={13} /> : null} {name}</span>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy"><Lightbulb className="text-teal" size={16} /> Model suggestions</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
            {analysis.suggestions.map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-canvas p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-navy">{value}</p>
    </div>
  )
}

export default ResumePage
