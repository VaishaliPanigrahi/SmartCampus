export function StatCard({ icon, label, value, hint }) {
  return (
    <article className="card p-5">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal">{icon}</span>
        {hint && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">{hint}</span>}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-navy">{value}</p>
    </article>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="card border-dashed p-10 text-center">
      <p className="font-display text-lg font-bold text-navy">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{text}</p>}
      {action}
    </div>
  )
}

export function ScoreBar({ value }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="score-track">
      <div className="score-fill" style={{ width: `${width}%` }} />
    </div>
  )
}

const PIPELINE_STAGES = ['Applied', 'Shortlisted', 'Interview', 'Offer']

export function StatusStepper({ status }) {
  if (status === 'Rejected') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" /> Application rejected
      </div>
    )
  }

  const currentIndex = PIPELINE_STAGES.indexOf(status)
  return (
    <div className="flex items-center">
      {PIPELINE_STAGES.map((stage, index) => {
        const reached = index <= currentIndex
        const isLast = index === PIPELINE_STAGES.length - 1
        return (
          <div className={`flex items-center ${isLast ? '' : 'flex-1'}`} key={stage}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold transition ${reached ? 'bg-teal text-white' : 'bg-slate-200 text-slate-400'}`}>
                {index + 1}
              </span>
              <span className={`whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.1em] ${reached ? 'text-teal-700' : 'text-slate-400'}`}>{stage}</span>
            </div>
            {!isLast && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${index < currentIndex ? 'bg-teal' : 'bg-slate-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

