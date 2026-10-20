import { Link } from 'react-router-dom'
import { useChallenge } from '../challenge'
import { memberProgress, challengePhase } from '../lib/progress'
import { todayISO, fmtShort, dateOfDay } from '../lib/dates'
import { colorOf } from '../lib/colors'
import Ticks from '../components/Ticks'

export default function Wager() {
  const { challenge, habits, members, checkins } = useChallenge()
  const today = todayISO()
  const { phase, n } = challengePhase(challenge, today)
  const finished = phase === 'finished'
  const rows = members
    .map((m) => ({ m, p: memberProgress(m.id, challenge, habits, checkins, today) }))
    .sort((a, b) => a.p.missed - b.p.missed || b.p.completed - a.p.completed)
  const winners = rows.filter((r) => r.p.missed === 0)
  const names = (rs) => rs.map((r) => (r.m.isMe ? 'You' : r.m.name)).join(' and ')

  return (
    <>
      <div className="aura-corner yellow" aria-hidden="true" />
      <header className="pad top">
        <div className="eyebrow mono">{challenge.name.toUpperCase()} · {finished ? 'FINAL' : 'WAGER'}</div>
        <h1 className="h1">{finished ? <>Day {challenge.days}<br />complete.</> : phase === 'upcoming' ? <>Starts<br />{fmtShort(challenge.start_date)}.</> : <>Still in<br />the game?</>}</h1>
        <p className="muted">Winners check in every habit, every day. Miss one task on one day and the wager is lost.</p>
      </header>

      <div className="pad-x">
        <div className="card">
          <div className="row between"><h2 className="h3">Wager summary</h2><span className={'badge mono' + (finished ? ' dark' : '')}>{finished ? 'CLOSED' : 'OPEN'}</span></div>
          <ul className="rules">
            {habits.map((h) => <li key={h.id}><span className="dot" style={{ background: colorOf(h.color).solid }} />{h.title}</li>)}
            <li><span className="dot" style={{ background: 'var(--ink)' }} />Stake: {challenge.stake || 'Bragging rights'}</li>
            <li><span className="dot" style={{ background: 'var(--line-strong)' }} />Ends {fmtShort(dateOfDay(challenge.start_date, challenge.days))}</li>
          </ul>
        </div>

        <div className="mono label" style={{ margin: '26px 0 12px' }}>{finished ? 'FINAL STANDINGS' : 'STANDINGS SO FAR'}</div>
        <div className="stack">
          {rows.map(({ m, p }) => {
            const alive = p.missed === 0
            return (
              <div key={m.id} className="card standing">
                {alive && phase !== 'upcoming' && <span className="standing-glow" style={{ '--c': hexToRgb(m.color) }} aria-hidden="true" />}
                <div className="row between rel">
                  <div><div className="title big-title">{m.name}</div><div className="muted small">{m.isMe ? 'You' : 'Friend'}</div></div>
                  <span className={'badge mono' + (alive && phase !== 'upcoming' ? ' dark' : '')}>{phase === 'upcoming' ? 'READY' : alive ? (finished ? 'WINNER' : 'ON TRACK') : `MISSED ${p.missed}`}</span>
                </div>
                <Ticks days={p.days} label={`${p.completed} of ${challenge.days} days`} />
                <div className="row between small muted rel">
                  <span>{alive ? (finished ? `All ${challenge.days} days, every habit` : 'No missed days') : `Missed ${p.missed} ${p.missed === 1 ? 'day' : 'days'} · wager lost`}</span>
                  <span className="mono ink">{p.completed} / {challenge.days}</span>
                </div>
              </div>
            )
          })}
        </div>

        {finished && (
          <div className="outcome">
            <div className="mono label accent">FINAL OUTCOME</div>
            <p>{winners.length ? `${names(winners)} ${winners.length === 1 && !winners[0].m.isMe ? 'wins' : 'win'}${challenge.stake ? ` · ${challenge.stake}` : ''}.` : 'Nobody made it through every day this time.'} Standings are locked.</p>
            <Link to="/new" className="btn light">Start a new challenge</Link>
          </div>
        )}
        {phase === 'active' && <p className="muted small" style={{ marginTop: 16 }}>Day {n} of {challenge.days}. Results lock after the last day.</p>}
      </div>
    </>
  )
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')
}
