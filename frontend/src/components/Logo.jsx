import { BrainCircuit } from 'lucide-react'

function Logo({ light = false, compact = false }) {
  return (
    <a className="flex items-center gap-3" href="/" aria-label="Smart Campus home">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${light ? 'bg-teal text-white' : 'bg-navy text-teal'}`}>
        <BrainCircuit size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className={`font-display text-[15px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
          Smart Campus
          <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-teal">
            Recruitment lab
          </span>
        </span>
      )}
    </a>
  )
}

export default Logo
