import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useChallenge } from '../challenge'
import { memberProgress, challengePhase } from '../lib/progress'
import { todayISO, fmtShort } from '../lib/dates'
import { COLOR_NAMES } from '../lib/colors'
import Aura from '../components/Aura'
import Ticks, { TickLegend } from '../components/Ticks'
import Avatar from '../components/Avatar'
import { IconArrow } from '../components/Icons'

export default function Friends() {
  const { challenge, habits, members, checkins } = useChallenge()
  const today = todayISO()
  const { phase } = challengePhase(challenge, today)
  const rows = members.map((m) => ({ m, p: memberProgress(m.id, challenge, habits, checkins, today) }))
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/join/${challenge.invite_code}`

  async function invite() {
    const text = `Join my challenge "${challenge.name}" on Daily Stack`
    if (navigator.share) {
      try { await navigator.share({ title: challenge.name, text, url: link }); return } catch { /* cancelled */ }
    }
    await navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const auraItems = rows.slice(0, 6).map(({ m, p }, i) => ({
    key: m.id, label: (m.isMe ? 'You' : m.name).toUpperCase(), color: COLOR_NAMES[i % COLOR_NAMES.length],
    strength: phase === 'upcoming' ? 0.8 : 0.45 + 0.55 * (p.completed / Math.max(1, Math.min(p.todayN, challenge.days))),
  }))
  const totals = rows.reduce((a, { p }) => ({ done: a.done + p.completed, missed: a.missed + p.missed }), { done: 0, missed: 0 })

  return (
    <>
      <header className="pad top">
        <div className="eyebrow mono">FRIENDS</div>
      </header>
      <Aura items={auraItems} height={300} />
      <div className="pad-x">
        <h1 className="h2 big">{challenge.name}</h1>
        <p className="muted">{habits.map((h) => h.title).join(', ')}. A day counts when every photo is in.</p>

        <div className="card invite">
          <div className="grow">
            <div className="mono label">INVITE CODE</div>
            <div className="code mono">{challenge.invite_code}</div>
          </div>
          <button className="btn primary" onClick={invite}>{copied ? 'Link copied' : 'Invite friends'}</button>
        </div>

        <div className="stats">
          <div><div className="stat">{members.length}</div><div className="mono label">MEMBERS</div></div>
          <div><div className="stat">{totals.done}</div><div className="mono label">DAYS DONE</div></div>
          <div><div className="stat">{totals.missed}</div><div className="mono label">MISSED</div></div>
        </div>

        <div className="section-head"><h2 className="h2">Comparison</h2><span className="mono small muted">{challenge.days} DAYS</span></div>
        {phase === 'upcoming' && <p className="muted small">Starts {fmtShort(challenge.start_date)}.</p>}
        <TickLegend />
        <div className="stack" style={{ marginTop: 12 }}>
          {rows.map(({ m, p }) => (
            <div key={m.id} className="card">
              <div className="row gap">
                <Avatar name={m.name} color={m.color} />
                <div className="grow"><div className="title">{m.name}</div><div className="muted small">{m.isMe ? 'You' : 'Friend'}</div></div>
                <span className="badge mono">{p.missed ? `${p.missed} MISSED` : phase === 'active' ? `${p.todayDone}/${habits.length} TODAY` : `${p.completed}/${challenge.days}`}</span>
              </div>
              <Ticks days={p.days} label={`${m.name}: ${p.completed} done, ${p.missed} missed`} />
            </div>
          ))}
        </div>

        <Link to={`/c/${challenge.id}/wager`} className="btn dark row between" style={{ marginTop: 18 }}>Open wager <IconArrow /></Link>
      </div>
    </>
  )
}
