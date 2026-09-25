import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const TEAL = '#0F9D9A'
const NAVY = '#0A1628'
const STAGE_COLORS = {
  Applied: '#94A3B8',
  Shortlisted: '#0F9D9A',
  Interview: '#0EA5E9',
  Offer: '#10B981',
  Rejected: '#EF4444',
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(10,22,40,0.10)',
  fontSize: 12,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
}

const axisProps = {
  stroke: '#94A3B8',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  fontFamily: 'IBM Plex Mono, monospace',
}

export function ChartCard({ title, subtitle, children, empty }) {
  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {empty ? (
        <p className="grid h-56 place-items-center text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="mt-6 h-56">{children}</div>
      )}
    </section>
  )
}

export function FunnelChart({ data }) {
  const hasData = data.some((item) => item.count > 0)
  return (
    <ChartCard title="Application pipeline" subtitle="Candidates by current stage" empty={hasData ? null : 'No pipeline activity yet.'}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
          <XAxis dataKey="status" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F9' }} />
          <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]}>
            {data.map((entry) => <Cell fill={STAGE_COLORS[entry.status] || TEAL} key={entry.status} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function TrendChart({ data, title = 'Applications over time', subtitle = 'Daily submission volume', color = TEAL, label = 'Applications' }) {
  return (
    <ChartCard title={title} subtitle={subtitle} empty={data.length ? null : 'No history to plot yet.'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -18 }}>
          <defs>
            <linearGradient id={`trend-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#CBD5E1' }} />
          <Area type="monotone" dataKey="count" name={label} stroke={color} strokeWidth={2.5} fill={`url(#trend-${color.slice(1)})`} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function JobBarChart({ data }) {
  const hasData = data.some((item) => item.count > 0)
  return (
    <ChartCard title="Applicants per role" subtitle="Total applications on each posted job" empty={hasData ? null : 'No applicants on your roles yet.'}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F7" />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="job_title" width={130} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F9' }} />
          <Bar dataKey="count" name="Applicants" fill={NAVY} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
