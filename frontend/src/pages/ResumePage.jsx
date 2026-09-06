import { ArrowLeft, BrainCircuit, Check, FileText, LogOut, UploadCloud } from 'lucide-react'
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
    async function loadResume() {
      try {
        const response = await api.get('/student/resume')
        setResume(response.data.resume)
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load resume status.')
      } finally {
        setLoading(false)
      }
    }
    loadResume()
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
    if (!selectedFile) {
      setError('Choose a PDF resume before uploading.')
      return
    }
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

  return <main className="min-h-screen bg-ink px-6 py-6 text-white lg:px-10">
    <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-ink"><BrainCircuit size={21} /></span><span className="font-display font-bold">Smart Campus</span></div><button className="button-secondary gap-2 px-3 py-2" onClick={logout}><LogOut size={15} /> Log out</button></header>
    <section className="mx-auto max-w-5xl py-12"><button className="button-secondary mb-8 gap-2 px-3 py-2" onClick={onBack}><ArrowLeft size={15} /> Profile</button><p className="eyebrow">Resume analysis</p><h1 className="mt-4 font-display text-4xl font-bold">Give your profile more context.</h1><p className="mt-4 max-w-2xl leading-7 text-white/55">Upload one PDF resume. The prototype extracts its text so the matching models can use it alongside your profile.</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form className="rounded-2xl border border-white/10 bg-panel p-6" onSubmit={uploadResume}><div className="grid h-44 place-items-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-center"><UploadCloud className="text-lime" size={30} /><div className="mt-3"><p className="font-semibold">Choose a PDF resume</p><p className="mt-1 text-xs text-white/40">Maximum file size: 5 MB</p></div><input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={chooseFile} /></div><button type="button" className="button-secondary mt-5 w-full py-3" onClick={() => inputRef.current?.click()}>{selectedFile ? selectedFile.name : 'Select PDF file'}</button><button className="button-primary mt-3 w-full py-3.5" disabled={uploading}>{uploading ? 'Analyzing resume...' : 'Upload and analyze'} <UploadCloud size={16} /></button>{error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}</form>
        <section className="rounded-2xl border border-white/10 bg-panel p-6"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs uppercase tracking-[0.18em] text-white/40">Analysis result</p><h2 className="mt-1 font-display text-xl font-bold">Resume text</h2></div>{resume?.uploaded && <span className="flex items-center gap-2 text-sm text-lime"><Check size={16} /> Uploaded</span>}</div>{loading ? <p className="py-12 text-white/45">Loading resume status...</p> : resume?.uploaded ? <><div className="mt-5 flex items-center gap-3 rounded-lg bg-white/[0.04] p-3"><FileText className="text-lime" size={19} /><div><p className="text-sm font-semibold">{resume.filename}</p><p className="text-xs text-white/40">{resume.character_count} characters extracted</p></div></div><pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-black/20 p-4 text-sm leading-6 text-white/65">{resume.text || 'No selectable text was found in this PDF.'}</pre></> : <div className="grid min-h-64 place-items-center text-center text-white/40"><div><FileText className="mx-auto mb-3 text-white/25" size={32} /><p>No resume uploaded yet.</p><p className="mt-1 text-sm">Your extracted text will appear here.</p></div></div>}</section>
      </div>
    </section>
  </main>
}

export default ResumePage
