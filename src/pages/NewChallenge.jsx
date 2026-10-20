import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { COLOR_NAMES, colorOf } from '../lib/colors'
import { addDays, todayISO } from '../lib/dates'
import { IconBack, IconClose, IconPlus } from '../components/Icons'

const DEFAULT_HABITS = [
  { title: 'Exercise 30 min', color: 'orange' },
  { title: 'Walk 10,000 steps', color: 'yellow' },
  { title: 'Read 10 pages', color: 'blue' },
  { title: 'Wake by 8 AM', color: 'lavender' },
]

export default function NewChallenge() {
  const nav = useNavigate()
  const [name, setName] = useState('20-day daily stack')
  const [start, setStart] = useState(addDays(todayISO(), 1))
  const [days, setDays] = useState(20)
  const [stake, setStake] = useState('')
  const [habits, setHabits] = useState(DEFAULT_HABITS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const setHabit = (i, patch) => setHabits(habits.map((h, j) => (j === i ? { ...h, ...patch } : h)))
  const nextColor = () => COLOR_NAMES.find((c) => !habits.some((h) => h.color === c)) || 'orange'

  async function submit(e) {
    e.preventDefault()
    const clean = habits.map((h) => ({ ...h, title: h.title.trim() })).filter((h) => h.title)
    if (!clean.length) return setError('Add at least one habit.')
    setBusy(true)
    const { data, error } = await supabase.rpc('create_challenge', {
      p_name: name.trim(), p_start: start, p_days: Number(days), p_stake: stake.trim(), p_habits: clean,
    })
    setBusy(false)
    if (error) return setError(error.message)
    nav(`/c/${data}/friends`, { replace: true })
  }

  return (
    <div className="screen pad top">
      <div className="row between"><Link to="/" className="icon-btn" aria-label="Back"><IconBack /></Link><span className="mono small">NEW CHALLENGE</span><span style={{ width: 44 }} /></div>
      <h1 className="h1" style={{ marginTop: 12 }}>Set the rules.</h1>
      <form onSubmit={submit} className="stack" style={{ marginTop: 20 }}>
        <label className="field"><span className="mono label">NAME</span><input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="date-row">
          <label className="field"><span className="mono label">STARTS</span><input type="date" required value={start} min={todayISO()} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="field"><span className="mono label">DAYS</span><input type="number" min={1} max={365} required value={days} onChange={(e) => setDays(e.target.value)} /></label>
        </div>
        <label className="field"><span className="mono label">WAGER (OPTIONAL)</span><input value={stake} onChange={(e) => setStake(e.target.value)} placeholder="e.g. Losers buy dinner" maxLength={120} /></label>

        <div className="section-head"><h2 className="h2">Daily habits</h2><span className="mono small muted">{habits.length} / 6</span></div>
        {habits.map((h, i) => (
          <div key={i} className="card habit-edit">
            <div className="row gap">
              <span className="dot-blob" style={{ '--c': colorOf(h.color).glow }} aria-hidden="true" />
              <label className="grow"><span className="sr-only">Habit {i + 1}</span><input value={h.title} onChange={(e) => setHabit(i, { title: e.target.value })} maxLength={60} placeholder="Habit" /></label>
              {habits.length > 1 && <button type="button" className="icon-btn" aria-label={`Remove ${h.title || 'habit'}`} onClick={() => setHabits(habits.filter((_, j) => j !== i))}><IconClose /></button>}
            </div>
            <div className="swatches" role="radiogroup" aria-label="Color">
              {COLOR_NAMES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={h.color === c} aria-label={c} className={'swatch' + (h.color === c ? ' on' : '')} style={{ background: colorOf(c).solid }} onClick={() => setHabit(i, { color: c })} />
              ))}
            </div>
          </div>
        ))}
        {habits.length < 6 && (
          <button type="button" className="btn row between" onClick={() => setHabits([...habits, { title: '', color: nextColor() }])}>Add a habit <IconPlus /></button>
        )}
        <p className="muted small">A day only counts when every habit has a photo check-in.</p>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create & invite friends'}</button>
      </form>
    </div>
  )
}
