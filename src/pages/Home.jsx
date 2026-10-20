import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { challengePhase } from '../lib/progress'
import { fmtShort, todayISO } from '../lib/dates'
import { IconArrow, IconPlus } from '../components/Icons'

export default function Home() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const [list, setList] = useState(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    supabase
      .from('members')
      .select('challenge:challenges(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const items = (data || []).map((r) => r.challenge).filter(Boolean)
        items.sort((a, b) => (a.start_date < b.start_date ? 1 : -1))
        setList(items)
      })
  }, [user.id])

  return (
    <div className="screen pad top">
      <div className="row between">
        <div className="eyebrow mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</div>
        <button className="link-btn mono small" onClick={() => supabase.auth.signOut()}>SIGN OUT</button>
      </div>
      <h1 className="h1">Hi, {profile.display_name}.</h1>

      <div className="section-head"><h2 className="h2">Your challenges</h2></div>
      {list === null ? (
        <p className="muted mono small">LOADING…</p>
      ) : list.length === 0 ? (
        <p className="muted">No challenges yet. Start one and invite your friends, or join with a code.</p>
      ) : (
        <div className="stack">
          {list.map((c) => {
            const { phase, n } = challengePhase(c, todayISO())
            const sub = phase === 'upcoming' ? `Starts ${fmtShort(c.start_date)}` : phase === 'finished' ? 'Finished · see results' : `Day ${n} of ${c.days}`
            return (
              <Link key={c.id} to={`/c/${c.id}`} className="card row gap">
                <div className="grow"><div className="title">{c.name}</div><div className="muted small">{sub}</div></div>
                <IconArrow />
              </Link>
            )
          })}
        </div>
      )}

      <Link to="/new" className="btn primary row between" style={{ marginTop: 20 }}>
        Start a new challenge <IconPlus />
      </Link>

      <form className="card stack" style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); if (code.trim()) nav(`/join/${code.trim().toUpperCase()}`) }}>
        <label className="field">
          <span className="mono label">HAVE AN INVITE CODE?</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 4F9A2C" maxLength={6} autoCapitalize="characters" />
        </label>
        <button className="btn" disabled={!code.trim()}>Join</button>
      </form>
    </div>
  )
}
