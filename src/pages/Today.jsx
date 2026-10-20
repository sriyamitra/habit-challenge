import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useChallenge } from '../challenge'
import { memberProgress, challengePhase } from '../lib/progress'
import { fmtLong, fmtShort, todayISO, weekOf, fromISO } from '../lib/dates'
import { colorOf } from '../lib/colors'
import Aura from '../components/Aura'
import Ticks from '../components/Ticks'
import Avatar from '../components/Avatar'
import { IconArrow, IconCheck } from '../components/Icons'

export default function Today() {
  const { challenge, habits, checkins, me, members } = useChallenge()
  const today = todayISO()
  const { phase, n } = challengePhase(challenge, today)
  const p = memberProgress(me.id, challenge, habits, checkins, today)
  const mineToday = new Set(checkins.filter((c) => c.user_id === me.id && c.day === today).map((c) => c.habit_id))
  const [last, setLast] = useState(null)

  useEffect(() => {
    supabase.from('messages').select('user_id, body, photo_path').eq('challenge_id', challenge.id)
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setLast(data?.[0] || null))
  }, [challenge.id, checkins.length])

  const active = phase === 'active'
  const auraItems = habits.map((h) => {
    const done = mineToday.has(h.id)
    return { key: h.id, label: h.title.toUpperCase(), sub: active ? (done ? 'PHOTO IN · DONE' : 'PENDING') : '', color: h.color, strength: !active || done ? 1 : 0.5 }
  })
  const lastAuthor = last && members.find((m) => m.id === last.user_id)

  return (
    <>
      <header className="pad top">
        <div className="row between">
          <div className="eyebrow mono">{fmtLong(today)}</div>
          <Link to="/" aria-label="All challenges"><Avatar name={me.name} color="var(--ink)" size={40} /></Link>
        </div>
        <h1 className="h1">Make today<br />count, {me.name}.</h1>
      </header>

      <div className="week pad-x mono">
        {weekOf(today).map((iso) => {
          const d = fromISO(iso)
          return (
            <div key={iso} className={'week-day' + (iso === today ? ' on' : '')}>
              <span className="small">{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              <span className="num">{d.getDate()}</span>
            </div>
          )
        })}
      </div>

      <Aura items={auraItems} />

      <div className="pad-x">
        {phase === 'upcoming' && <p className="notice">Starts {fmtShort(challenge.start_date)}. Invite your friends from the Friends tab.</p>}
        {phase === 'finished' && <Link to="wager" className="notice row between">Challenge finished. See the results <IconArrow /></Link>}
        <div className="day-line">Day {Math.min(Math.max(n, 0), challenge.days)} <span className="muted">of {challenge.days}</span></div>
        <Ticks days={p.days} height={34} spread={challenge.days > 20} label={`${p.completed} of ${challenge.days} days completed`} />

        <div className="stats">
          <div><div className="stat">{p.completed}</div><div className="mono label">DAYS DONE</div></div>
          <div><div className="stat">{p.streak}</div><div className="mono label">DAY STREAK</div></div>
          <div><div className="stat">{active ? `${p.todayDone}/${habits.length}` : '–'}</div><div className="mono label">TODAY</div></div>
        </div>

        <div className="section-head"><h2 className="h2">Today's checklist</h2><span className="mono small muted">{mineToday.size} OF {habits.length}</span></div>
        <div className="stack">
          {habits.map((h) => {
            const done = mineToday.has(h.id)
            return (
              <div key={h.id} className="card row gap">
                <span className="dot-blob" style={{ '--c': colorOf(h.color).glow }} aria-hidden="true" />
                <div className="grow"><div className="title">{h.title}</div><div className="muted small">{done ? 'Photo submitted · Done' : 'Pending photo'}</div></div>
                {done ? <span className="check" aria-label="Done"><IconCheck /></span> : active ? <Link to={`checkin?habit=${h.id}`} className="pill mono">UPLOAD</Link> : null}
              </div>
            )
          })}
        </div>

        <Link to="chat" className="chat-card">
          <div className="avatars">
            {members.filter((m) => !m.isMe).slice(0, 3).map((m) => <Avatar key={m.id} name={m.name} color={m.color} size={30} />)}
          </div>
          <div className="grow">
            <div className="title">Group chat</div>
            <div className="small faded">{last ? `${lastAuthor?.isMe ? 'You' : lastAuthor?.name || 'Someone'}: ${last.photo_path && !last.body ? 'posted a photo' : last.body}` : 'Say hi to the group'}</div>
          </div>
          <IconArrow />
        </Link>
      </div>
    </>
  )
}
