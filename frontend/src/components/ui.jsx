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
