import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

// Landing page + sign-in (shown to anyone who isn't signed in)

const PHOTOS = [
  { cls: 'lp-ph1', src: '/landing/meditate.jpg', alt: 'Meditating cross-legged beside a candle', label: 'MEDITATE 10 MIN', rot: '-7deg', depth: 18, delay: '0s' },
  { cls: 'lp-ph2', src: '/landing/alarm.jpg', alt: 'Phone alarms set for early morning', label: 'WAKE BY 6', rot: '5deg', depth: 10, delay: '-2s' },
  { cls: 'lp-ph3', src: '/landing/run.jpg', alt: 'Walking outdoors with headphones', label: 'WALK 10K STEPS', rot: '8deg', depth: 24, delay: '-4s' },
  { cls: 'lp-ph4', src: '/landing/books.jpg', alt: 'Books and a journal on a bed', label: 'READ 10 PAGES', rot: '9deg', depth: 14, delay: '-1s' },
  { cls: 'lp-ph5', src: '/landing/water.jpg', alt: 'A water bottle with hourly markers', label: 'DRINK 2L WATER', rot: '-9deg', depth: 20, delay: '-3s' },
]

const chain = (name, missed) => ({
  name,
  won: missed.length === 0,
  badge: missed.length === 0 ? 'WINNER' : `OUT · DAY ${missed[0]}`,
  days: Array.from({ length: 20 }, (_, i) => !missed.includes(i + 1)),
})
const CHAINS = [chain('Alex', []), chain('Maya', []), chain('Jordan', [9])]

// Supabase puts sign-in errors in the URL (e.g. an expired link). Read and clear them.
function readUrlError() {
  const raw = (window.location.hash || '').replace(/^#/, '') + '&' + (window.location.search || '').replace(/^\?/, '')
  const params = new URLSearchParams(raw)
  const msg = params.get('error_description') || (params.get('error') ? params.get('error') : '')
  if (msg) window.history.replaceState(null, '', window.location.pathname)
  return msg ? msg.replace(/\+/g, ' ') : ''
}

const scrollToId = (id) => (e) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Login() {
  const [shift, setShift] = useState({ x: 0, y: 0 })
  const raf = useRef(null)

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2
    if (raf.current) return
    raf.current = requestAnimationFrame(() => { raf.current = null; setShift({ x: -x, y: -y }) })
  }
  useEffect(() => () => raf.current && cancelAnimationFrame(raf.current), [])

  return (
    <div className="lp">
      <nav className="lp-nav">
        <a href="#top" onClick={scrollToId('top')} className="lp-brand">
          <span className="lp-logo" aria-hidden="true" />
          <span className="mono">DAILY STACK</span>
        </a>
        <a href="#start" onClick={scrollToId('start')} className="lp-btn outline small-btn">Sign in</a>
      </nav>

      <section id="top" className="lp-hero" onMouseMove={onMove} onMouseLeave={() => setShift({ x: 0, y: 0 })}>
        <div className="lp-hero-glow" aria-hidden="true" />
        {PHOTOS.map((p) => (
          <div key={p.cls} className={'lp-ph ' + p.cls} style={{ transform: `translate3d(${(shift.x * p.depth).toFixed(1)}px, ${(shift.y * p.depth).toFixed(1)}px, 0)` }}>
            <div className="lp-float" style={{ animationDelay: p.delay }}>
              <figure className="lp-card" style={{ '--r': p.rot }}>
                <img src={p.src} alt={p.alt} />
              </figure>
            </div>
            <div className="lp-cap mono">{p.label}</div>
          </div>
        ))}
        <div className="lp-hero-copy">
          <p className="lp-kicker">Group habit challenges, kept honest with photos.</p>
          <h1 className="lp-headline">Build habits<br />together.<br />Prove it daily.</h1>
          <p className="lp-lede">Pick your habits, invite your friends and post a photo for every one, every day. Miss a day and you lose the wager.</p>
          <div className="lp-ctas">
            <a href="#start" onClick={scrollToId('start')} className="lp-btn dark">Start a challenge</a>
            <a href="#how" onClick={scrollToId('how')} className="lp-btn outline">
              How it works
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="lp-how">
        <div className="lp-how-head">
          <div className="mono lp-eyebrow">HOW IT WORKS</div>
          <h2 className="lp-h2">Five steps.<br />One crew.</h2>
        </div>

        <Step i={0} c="232,98,44" title="Start a challenge" text="Choose up to six daily habits, how many days it runs and what's at stake.">
          <div className="lp-col">
            {[['Exercise 30 min', '#E8622C'], ['Walk 10,000 steps', '#EDB92E'], ['Read 10 pages', '#4A96D2']].map(([t, c]) => (
              <div key={t} className="lp-chip"><span className="lp-chip-dot" style={{ background: `radial-gradient(circle, ${c} 0%, ${c}4d 70%)` }} aria-hidden="true" />{t}</div>
            ))}
            <div className="lp-meta mono"><span>20 DAYS</span><span>WAGER · LOSERS BUY DINNER</span></div>
          </div>
        </Step>

        <Step i={1} c="237,185,46" title="Invite your crew" text="Share one link or a six-letter code. Everyone sees the same rules and the same finish line.">
          <div className="lp-col start">
            <div className="lp-code-box">
              <div className="mono lp-eyebrow">INVITE CODE</div>
              <div className="mono lp-code">4F9A2C</div>
            </div>
            <div className="lp-avatars">
              {[['M', '#E8622C'], ['S', '#4A96D2'], ['J', '#A09CD6'], ['+', '#1B1814']].map(([l, c]) => (
                <span key={l} className="mono" style={{ background: c, color: l === '+' ? '#EEE4D3' : undefined }}>{l}</span>
              ))}
              <em>3 friends joined</em>
            </div>
          </div>
        </Step>

        <Step i={2} c="74,150,210" title="Check in with a photo" text="Every habit needs a photo, every day. A day only counts when all of them are in.">
          <div className="lp-photos">
            <div className="lp-shot" style={{ width: 190, transform: 'rotate(-4deg)' }}>
              <img src="/landing/run.jpg" alt="Photo check-in: an evening walk" />
              <span className="mono">10K STEPS · 6:58 PM</span>
            </div>
            <div className="lp-shot" style={{ width: 160, transform: 'rotate(5deg) translateY(20px)' }}>
              <img src="/landing/books.jpg" alt="Photo check-in: books and a journal" />
              <span className="mono">READ · 8:20 AM</span>
            </div>
          </div>
        </Step>

        <Step i={3} c="160,156,214" title="Cheer each other on" text="Check-in photos land in your group chat, so everyone sees who showed up today.">
          <div className="lp-col">
            <div className="lp-msg">
              <span className="lp-av mono" style={{ background: '#E8622C' }}>M</span>
              <div>
                <div className="lp-msg-meta"><b>Maya</b> · 6:12 AM</div>
                <div className="lp-bubble">5k before work. Legs are done.</div>
              </div>
            </div>
            <div className="lp-msg mine">
              <div className="lp-msg-photo"><img src="/landing/water.jpg" alt="Photo check-in: a water bottle" /></div>
              <div className="lp-bubble dark">Two litres down.</div>
            </div>
            <div className="lp-cheer mono">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z" /></svg>
              3 CHEERS
            </div>
          </div>
        </Step>

        <Step i={4} c="91,174,124" title="Don't break the chain" text="Anyone who misses a single day is out. Everyone left standing on the last day wins the wager.">
          <div className="lp-col">
            {CHAINS.map((c) => (
              <div key={c.name} className="lp-chain">
                <div className="lp-chain-head">
                  <span>{c.name}</span>
                  <span className={'mono lp-badge' + (c.won ? ' dark' : '')}>{c.badge}</span>
                </div>
                <div className="lp-ticks" role="img" aria-label={`${c.name}: ${c.won ? 'all 20 days' : 'missed a day'}`}>
                  {c.days.map((ok, i) => <span key={i} className={ok ? 'ok' : 'miss'} />)}
                </div>
              </div>
            ))}
          </div>
        </Step>
      </section>

      <section id="start" className="lp-start">
        <div className="lp-start-glow a" aria-hidden="true" />
        <div className="lp-start-glow b" aria-hidden="true" />
        <div className="lp-start-glow c" aria-hidden="true" />
        <div className="lp-start-body">
          <h2 className="lp-h2 big">Your crew<br />is waiting.</h2>
          <SignInForm />
        </div>
      </section>

      <footer className="lp-foot mono">
        <span>DAILY STACK</span>
        <span>CONSISTENCY BEATS PERFECT</span>
      </footer>
    </div>
  )
}

function Step({ i, c, title, text, children }) {
  return (
    <>
    <article className="lp-step" style={{ '--i': i, '--c': c }}>
      <div className="lp-step-glow" aria-hidden="true" />
      <div className="lp-step-copy">
        <div className="mono lp-step-num">0{i + 1} / 05</div>
        <div>
          <h3 className="lp-h3">{title}</h3>
          <p>{text}</p>
        </div>
      </div>
      <div className="lp-step-visual">{children}</div>
    </article>
    {/* spacer: sticky cards can't use margins, or they unstick early */}
    <div className="lp-gap" aria-hidden="true" />
    </>
  )
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const msg = readUrlError()
    if (msg) {
      setError(`That link didn't work (${msg}). Enter your email to get a new code.`)
      setTimeout(() => document.getElementById('start')?.scrollIntoView(), 50)
    }
  }, [])

  async function sendCode(e) {
    e?.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  async function verify(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const token = code.replace(/\s/g, '')
    let { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' })
    // A brand-new account's first email is a "confirm signup" email
    if (error) {
      const retry = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'signup' })
      error = retry.error ? error : null
    }
    setBusy(false)
    if (error) setError('That code is wrong or has expired. Check the newest email, or send a new code.')
  }

  return step === 'email' ? (
    <form onSubmit={sendCode} className="stack lp-form">
      <label className="field">
        <span className="mono label">EMAIL</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in code'}</button>
    </form>
  ) : (
    <form onSubmit={verify} className="stack lp-form">
      <p className="small" style={{ margin: 0 }}>We emailed a 6-digit code to <b>{email}</b>. Can't find it? Check your spam or junk folder.</p>
      <label className="field">
        <span className="mono label">CODE FROM THE EMAIL</span>
        <input
          inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6}
          value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="123456" style={{ fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: '0.3em' }} autoFocus
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Sign in'}</button>
      <div className="row between">
        <button type="button" className="link-btn small" onClick={() => { setStep('email'); setCode(''); setError('') }}>Change email</button>
        <button type="button" className="link-btn small" onClick={sendCode} disabled={busy}>Send a new code</button>
      </div>
    </form>
  )
}
