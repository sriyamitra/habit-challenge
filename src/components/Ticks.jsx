// days: [{ status: 'done'|'missed'|'today'|'ahead' }]
export default function Ticks({ days, height = 28, spread = true, label }) {
  return (
    <div className={'ticks' + (spread ? ' spread' : '')} style={{ height }} role="img" aria-label={label}>
      {days.map((d, i) => (
        <span key={i} className={'tick ' + d.status} />
      ))}
    </div>
  )
}

export function TickLegend() {
  return (
    <div className="legend mono">
      <span><i className="tick done" />DONE</span>
      <span><i className="tick missed" />MISSED</span>
      <span><i className="tick today" />TODAY</span>
      <span><i className="tick ahead" />AHEAD</span>
    </div>
  )
}
