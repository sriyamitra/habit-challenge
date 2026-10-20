import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChallenge } from '../challenge'
import { challengePhase } from '../lib/progress'
import { todayISO, fmtTime } from '../lib/dates'
import { colorOf } from '../lib/colors'
import { submitCheckin } from '../lib/checkin'
import Photo from '../components/Photo'
import { IconCamera } from '../components/Icons'

export default function Checkin() {
  const { challenge, habits, checkins, me, reload } = useChallenge()
  const [params] = useSearchParams()
  const today = todayISO()
  const { phase, n } = challengePhase(challenge, today)
  const mine = checkins.filter((c) => c.user_id === me.id && c.day === today)
  const doneIds = new Set(mine.map((c) => c.habit_id))
  const pending = habits.filter((h) => !doneIds.has(h.id))
  const [share, setShare] = useState(true)
  const focusId = params.get('habit')

  return (
    <>
      <div className="aura-corner" aria-hidden="true" />
      <header className="pad top">
        <div className="eyebrow mono">CHECK-IN</div>
        <h1 className="h1">Today's<br />check-in</h1>
        <p className="muted">{phase === 'active' ? `Day ${n} of ${challenge.days} · ${doneIds.size} of ${habits.length} photos in` : phase === 'upcoming' ? 'The challenge hasn’t started yet.' : 'This challenge is finished.'}</p>
        <div className="segments" style={{ gridTemplateColumns: `repeat(${habits.length}, minmax(0,1fr))` }}>
          {habits.map((h) => <span key={h.id} style={{ background: doneIds.has(h.id) ? colorOf(h.color).solid : 'var(--line-strong)' }} />)}
        </div>
      </header>

      {phase === 'active' && (
        <div className="pad-x">
          <div className="section-head"><h2 className="h2">Pending</h2><span className="mono small muted">{pending.length} LEFT</span></div>
          {pending.length === 0 ? (
            <p className="notice">All {habits.length} in. Day {n} is locked.</p>
          ) : (
            <div className="stack">
              {pending.map((h) => (
                <PendingCard key={h.id} habit={h} autoFocus={h.id === focusId} onDone={reload}
                  submit={(file, caption) => submitCheckin({ challengeId: challenge.id, habit: h, userId: me.id, day: today, file, caption, shareToChat: share })} />
              ))}
            </div>
          )}
          <label className="toggle">
            <span>Post new photos to the group chat</span>
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          </label>
        </div>
      )}

      <div className="pad-x">
        <div className="section-head"><h2 className="h2">Submitted</h2><span className="mono small muted">{doneIds.size} OF {habits.length}</span></div>
        {mine.length === 0 ? <p className="muted small">Nothing yet today.</p> : (
          <div className="grid2">
            {mine.map((c) => {
              const h = habits.find((x) => x.id === c.habit_id)
              return (
                <div key={c.id}>
                  <Photo path={c.photo_path} color={h?.color} alt={`${h?.title} check-in`} className="thumb">
                    <span className="photo-tag mono">{fmtTime(c.created_at)}</span>
                  </Photo>
                  <div className="title small-title">{h?.title}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function PendingCard({ habit, submit, onDone, autoFocus }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(null)
  const inputId = 'file-' + habit.id

  useEffect(() => { if (autoFocus) ref.current?.scrollIntoView({ block: 'center' }) }, [autoFocus])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  function pick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function go() {
    setBusy(true)
    setError('')
    try {
      await submit(file, caption.trim())
      onDone()
    } catch (e) {
      setError(e.message || 'Upload failed')
      setBusy(false)
    }
  }

  return (
    <div className="card" ref={ref}>
      <div className="row gap">
        <span className="dot-blob" style={{ '--c': colorOf(habit.color).glow }} aria-hidden="true" />
        <div className="grow"><div className="title">{habit.title}</div><div className="muted small">Photo needed</div></div>
      </div>
      {preview ? (
        <div className="stack" style={{ marginTop: 12 }}>
          <img src={preview} alt="Selected" className="preview" />
          <label className="field"><span className="sr-only">Caption</span><input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption (optional)" maxLength={200} /></label>
          {error && <p className="error">{error}</p>}
          <div className="row gap">
            <button className="btn grow" type="button" onClick={() => { setFile(null); setPreview(null) }} disabled={busy}>Retake</button>
            <button className="btn primary grow" type="button" onClick={go} disabled={busy}>{busy ? 'Uploading…' : 'Check in'}</button>
          </div>
        </div>
      ) : (
        <>
          <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={pick} />
          <label htmlFor={inputId} className="dropzone mono"><IconCamera />TAKE OR UPLOAD PHOTO</label>
        </>
      )}
    </div>
  )
}
