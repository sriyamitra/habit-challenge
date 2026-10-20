import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { useChallenge } from '../challenge'
import { COLOR_NAMES, colorOf } from '../lib/colors'
import { IconBack, IconClose, IconPlus } from '../components/Icons'

export default function Settings() {
  const { challenge } = useChallenge()
  const { user } = useAuth()
  const isCreator = challenge.created_by === user.id
  return (
    <div className="pad top">
      <div className="row between">
        <Link to={`/c/${challenge.id}`} className="icon-btn" aria-label="Back"><IconBack /></Link>
        <span className="mono small">CHALLENGE SETTINGS</span>
        <span style={{ width: 44 }} />
      </div>
      {isCreator ? <EditForm /> : <LeaveSection />}
    </div>
  )
}

function EditForm() {
  const { challenge, habits: original, checkins, reload } = useChallenge()
  const nav = useNavigate()
  const [name, setName] = useState(challenge.name)
  const [start, setStart] = useState(challenge.start_date)
  const [days, setDays] = useState(challenge.days)
  const [stake, setStake] = useState(challenge.stake || '')
  const [habits, setHabits] = useState(original.map((h) => ({ id: h.id, title: h.title, color: h.color })))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const setHabit = (i, patch) => { setSaved(false); setHabits(habits.map((h, j) => (j === i ? { ...h, ...patch } : h))) }
  const nextColor = () => COLOR_NAMES.find((c) => !habits.some((h) => h.color === c)) || 'orange'
  const removed = original.filter((o) => !habits.some((h) => h.id === o.id))
  const lostCheckins = checkins.filter((c) => removed.some((r) => r.id === c.habit_id)).length

  async function save(e) {
    e.preventDefault()
    const clean = habits.map((h) => ({ ...h, title: h.title.trim() })).filter((h) => h.title)
    if (!clean.length) return setError('Keep at least one habit.')
    setBusy(true); setError(''); setSaved(false)
    try {
      const up = await supabase.from('challenges')
        .update({ name: name.trim(), start_date: start, days: Number(days), stake: stake.trim() })
        .eq('id', challenge.id)
      if (up.error) throw up.error
      if (removed.length) {
        const r = await supabase.from('habits').delete().in('id', removed.map((h) => h.id))
        if (r.error) throw r.error
      }
      for (let i = 0; i < clean.length; i++) {
        const h = clean[i]
        const r = h.id
          ? await supabase.from('habits').update({ title: h.title, color: h.color, position: i }).eq('id', h.id)
          : await supabase.from('habits').insert({ challenge_id: challenge.id, title: h.title, color: h.color, position: i })
        if (r.error) throw r.error
      }
      await reload()
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save')
    }
    setBusy(false)
  }

  async function del() {
    setBusy(true)
    const { error } = await supabase.from('challenges').delete().eq('id', challenge.id)
    if (error) { setError(error.message); setBusy(false); return }
    nav('/', { replace: true })
  }

  return (
    <>
      <h1 className="h1" style={{ marginTop: 12 }}>Edit challenge</h1>
      <form onSubmit={save} className="stack" style={{ marginTop: 20 }}>
        <label className="field"><span className="mono label">NAME</span><input required maxLength={80} value={name} onChange={(e) => { setSaved(false); setName(e.target.value) }} /></label>
        <div className="date-row">
          <label className="field"><span className="mono label">STARTS</span><input type="date" required value={start} onChange={(e) => { setSaved(false); setStart(e.target.value) }} /></label>
          <label className="field"><span className="mono label">DAYS</span><input type="number" min={1} max={365} required value={days} onChange={(e) => { setSaved(false); setDays(e.target.value) }} /></label>
        </div>
        <label className="field"><span className="mono label">WAGER</span><input value={stake} onChange={(e) => { setSaved(false); setStake(e.target.value) }} placeholder="e.g. Losers buy dinner" maxLength={120} /></label>

        <div className="section-head"><h2 className="h2">Daily habits</h2><span className="mono small muted">{habits.length} / 6</span></div>
        {habits.map((h, i) => (
          <div key={h.id || 'new' + i} className="card habit-edit">
            <div className="row gap">
              <span className="dot-blob" style={{ '--c': colorOf(h.color).glow }} aria-hidden="true" />
              <label className="grow"><span className="sr-only">Habit {i + 1}</span><input value={h.title} onChange={(e) => setHabit(i, { title: e.target.value })} maxLength={60} placeholder="Habit" /></label>
              {habits.length > 1 && <button type="button" className="icon-btn" aria-label={`Remove ${h.title || 'habit'}`} onClick={() => { setSaved(false); setHabits(habits.filter((_, j) => j !== i)) }}><IconClose /></button>}
            </div>
            <div className="swatches" role="radiogroup" aria-label="Color">
              {COLOR_NAMES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={h.color === c} aria-label={c} className={'swatch' + (h.color === c ? ' on' : '')} style={{ background: colorOf(c).solid }} onClick={() => setHabit(i, { color: c })} />
              ))}
            </div>
          </div>
        ))}
        {habits.length < 6 && (
          <button type="button" className="btn row between" onClick={() => { setSaved(false); setHabits([...habits, { title: '', color: nextColor() }]) }}>Add a habit <IconPlus /></button>
        )}
        {removed.length > 0 && lostCheckins > 0 && (
          <p className="error">Removing {removed.map((r) => r.title).join(', ')} also deletes {lostCheckins} check-in{lostCheckins === 1 ? '' : 's'} already made for {removed.length === 1 ? 'it' : 'them'}.</p>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</button>
      </form>

      <div className="danger">
        <h2 className="h3">Delete challenge</h2>
        <p className="muted small">This removes the challenge for everyone, including all check-ins and chat messages. It can't be undone.</p>
        {confirmDelete ? (
          <div className="row gap">
            <button type="button" className="btn grow" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn danger-btn grow" onClick={del} disabled={busy}>{busy ? 'Deleting…' : 'Yes, delete it'}</button>
          </div>
        ) : (
          <button type="button" className="btn danger-btn" onClick={() => setConfirmDelete(true)}>Delete challenge</button>
        )}
      </div>
    </>
  )
}

function LeaveSection() {
  const { challenge, me } = useChallenge()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function leave() {
    setBusy(true)
    const { error } = await supabase.from('members').delete().match({ challenge_id: challenge.id, user_id: me.id })
    if (error) { setError(error.message); setBusy(false); return }
    nav('/', { replace: true })
  }

  return (
    <>
      <h1 className="h1" style={{ marginTop: 12 }}>{challenge.name}</h1>
      <p className="muted">Only the person who created this challenge can edit or delete it.</p>
      <div className="danger">
        <h2 className="h3">Leave challenge</h2>
        <p className="muted small">You'll be removed from the group and won't see the chat anymore.</p>
        {error && <p className="error">{error}</p>}
        {confirm ? (
          <div className="row gap">
            <button type="button" className="btn grow" onClick={() => setConfirm(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn danger-btn grow" onClick={leave} disabled={busy}>{busy ? 'Leaving…' : 'Yes, leave'}</button>
          </div>
        ) : (
          <button type="button" className="btn danger-btn" onClick={() => setConfirm(true)}>Leave challenge</button>
        )}
      </div>
    </>
  )
}
