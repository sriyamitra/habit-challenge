import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useChallenge } from '../challenge'
import { challengePhase } from '../lib/progress'
import { fmtTime, fmtLong, todayISO, toISO } from '../lib/dates'
import { colorOf } from '../lib/colors'
import { submitCheckin } from '../lib/checkin'
import { uploadPhoto } from '../lib/photos'
import Avatar from '../components/Avatar'
import Photo from '../components/Photo'
import { IconCamera, IconHeart, IconSend, IconClose } from '../components/Icons'

export default function Chat() {
  const { challenge, habits, members, checkins, me, reload } = useChallenge()
  const today = todayISO()
  const { phase } = challengePhase(challenge, today)
  const [messages, setMessages] = useState(null)
  const [cheers, setCheers] = useState([])
  const [draft, setDraft] = useState('')
  const [sheet, setSheet] = useState(null) // { file, preview }
  const listRef = useRef(null)
  const fileRef = useRef(null)
  const stick = useRef(true)

  const loadCheers = useCallback(async () => {
    const { data } = await supabase.from('cheers').select('message_id, user_id').eq('challenge_id', challenge.id)
    setCheers(data || [])
  }, [challenge.id])

  useEffect(() => {
    supabase.from('messages').select('*').eq('challenge_id', challenge.id)
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setMessages((data || []).reverse()))
    loadCheers()
    const ch = supabase
      .channel('chat-' + challenge.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `challenge_id=eq.${challenge.id}` },
        ({ new: m }) => setMessages((prev) => (prev && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        ({ old }) => setMessages((prev) => prev?.filter((x) => x.id !== old.id)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cheers', filter: `challenge_id=eq.${challenge.id}` }, loadCheers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [challenge.id, loadCheers])

  useLayoutEffect(() => {
    const el = listRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const onScroll = () => {
    const el = listRef.current
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  async function send(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft('')
    stick.current = true
    const { data, error } = await supabase.from('messages')
      .insert({ challenge_id: challenge.id, user_id: me.id, body }).select().single()
    if (error) { setDraft(body); alertError(error) ; return }
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]))
  }

  async function toggleCheer(msgId) {
    const mine = cheers.some((c) => c.message_id === msgId && c.user_id === me.id)
    if (mine) {
      setCheers((cs) => cs.filter((c) => !(c.message_id === msgId && c.user_id === me.id)))
      await supabase.from('cheers').delete().match({ message_id: msgId, user_id: me.id })
    } else {
      setCheers((cs) => [...cs, { message_id: msgId, user_id: me.id }])
      await supabase.from('cheers').insert({ message_id: msgId, user_id: me.id, challenge_id: challenge.id })
    }
  }

  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const habitById = Object.fromEntries(habits.map((h) => [h.id, h]))
  const todayCounts = (uid) => new Set(checkins.filter((c) => c.user_id === uid && c.day === today).map((c) => c.habit_id)).size
  const myDone = new Set(checkins.filter((c) => c.user_id === me.id && c.day === today).map((c) => c.habit_id))
  const pendingHabits = phase === 'active' ? habits.filter((h) => !myDone.has(h.id)) : []

  let lastDay = null
  return (
    <div className="chat">
      <div className="aura-corner blue" aria-hidden="true" />
      <header className="pad top chat-head">
        <h1 className="h3">{challenge.name}</h1>
        <div className="mono small muted">{members.length} MEMBERS</div>
        <div className="mono label" style={{ marginTop: 14 }}>TODAY'S PHOTO WALL</div>
        <div className="wall">
          {members.map((m) => (
            <div key={m.id} className="wall-item">
              <span className="wall-tile" style={{ '--c': hexToRgb(m.color), opacity: 0.35 + 0.65 * (todayCounts(m.id) / Math.max(habits.length, 1)) }} aria-hidden="true" />
              <div className="small title">{m.isMe ? 'You' : m.name}</div>
              <div className="mono label">{todayCounts(m.id)}/{habits.length}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="messages" ref={listRef} onScroll={onScroll} aria-live="polite">
        {messages === null && <p className="muted mono small center-text">LOADING…</p>}
        {messages?.length === 0 && <p className="muted small center-text">No messages yet. Post your first check-in photo.</p>}
        {messages?.map((m) => {
          const day = toISO(new Date(m.created_at))
          const divider = day !== lastDay ? (lastDay = day) : null
          const author = byId[m.user_id] || { name: 'Former member', color: '#ccc' }
          const habit = m.habit_id ? habitById[m.habit_id] : null
          const count = cheers.filter((c) => c.message_id === m.id).length
          const iCheered = cheers.some((c) => c.message_id === m.id && c.user_id === me.id)
          const mine = m.user_id === me.id
          return (
            <div key={m.id} className="msg-wrap">
              {divider && <div className="day-divider mono">{day === today ? 'TODAY' : fmtLong(day)}</div>}
              <div className={'msg' + (mine ? ' mine' : '')}>
                {!mine && <Avatar name={author.name} color={author.color} size={32} />}
                <div className="msg-body">
                  <div className="msg-meta"><b>{mine ? 'You' : author.name}</b> · {fmtTime(m.created_at)}</div>
                  {m.photo_path && (
                    <Photo path={m.photo_path} color={habit?.color} alt={`${mine ? 'Your' : author.name + '’s'} ${habit ? habit.title + ' check-in' : 'photo'}`} className="chat-photo">
                      {habit && <span className="photo-tag mono top-tag">{habit.title.toUpperCase()}</span>}
                    </Photo>
                  )}
                  {m.body && <div className="bubble">{m.body}</div>}
                  {m.photo_path && (
                    <button className={'cheer mono' + (iCheered ? ' on' : '')} onClick={() => toggleCheer(m.id)} aria-pressed={iCheered}>
                      <IconHeart /> {count} {count === 1 ? 'CHEER' : 'CHEERS'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form className="composer" onSubmit={send}>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="chat-photo"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setSheet({ file: f, preview: URL.createObjectURL(f) }); e.target.value = '' }} />
        <label htmlFor="chat-photo" className="round-btn outline" aria-label="Post a photo"><IconCamera size={22} /></label>
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message the group" maxLength={2000} autoComplete="off" />
        <button className="round-btn dark" aria-label="Send" disabled={!draft.trim()}><IconSend /></button>
      </form>

      {sheet && (
        <PhotoSheet sheet={sheet} habits={pendingHabits} onClose={() => { URL.revokeObjectURL(sheet.preview); setSheet(null) }}
          onPost={async ({ habit, caption }) => {
            stick.current = true
            if (habit) {
              await submitCheckin({ challengeId: challenge.id, habit, userId: me.id, day: today, file: sheet.file, caption, shareToChat: true })
              reload()
            } else {
              const path = await uploadPhoto(challenge.id, me.id, sheet.file)
              const { error } = await supabase.from('messages').insert({ challenge_id: challenge.id, user_id: me.id, body: caption, photo_path: path })
              if (error) throw error
            }
            URL.revokeObjectURL(sheet.preview)
            setSheet(null)
          }} />
      )}
    </div>
  )
}

function PhotoSheet({ sheet, habits, onClose, onPost }) {
  const [habitId, setHabitId] = useState(habits[0]?.id || '')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const habit = habits.find((h) => h.id === habitId) || null

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Post a photo">
      <div className="sheet">
        <div className="row between"><h2 className="h3">Post a photo</h2><button className="icon-btn" aria-label="Close" onClick={onClose}><IconClose /></button></div>
        <img src={sheet.preview} alt="Selected" className="preview" />
        {habits.length > 0 && (
          <fieldset className="choices">
            <legend className="mono label">COUNT IT AS A CHECK-IN?</legend>
            {habits.map((h) => (
              <label key={h.id} className={'choice' + (habitId === h.id ? ' on' : '')}>
                <input type="radio" name="habit" value={h.id} checked={habitId === h.id} onChange={() => setHabitId(h.id)} className="sr-only" />
                <span className="dot-blob small-dot" style={{ '--c': colorOf(h.color).glow }} aria-hidden="true" />{h.title}
              </label>
            ))}
            <label className={'choice' + (habitId === '' ? ' on' : '')}>
              <input type="radio" name="habit" value="" checked={habitId === ''} onChange={() => setHabitId('')} className="sr-only" />Just share it
            </label>
          </fieldset>
        )}
        <label className="field"><span className="sr-only">Caption</span><input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption" maxLength={500} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy} onClick={async () => {
          setBusy(true); setError('')
          try { await onPost({ habit, caption: caption.trim() }) } catch (e) { setError(e.message || 'Upload failed'); setBusy(false) }
        }}>{busy ? 'Posting…' : habit ? `Check in · ${habit.title}` : 'Post photo'}</button>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')
}
function alertError(e) { console.error(e) }
