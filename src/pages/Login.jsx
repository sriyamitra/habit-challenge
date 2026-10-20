import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

// Supabase puts sign-in errors in the URL (e.g. an expired link). Read and clear them.
function readUrlError() {
  const raw = (window.location.hash || '').replace(/^#/, '') + '&' + (window.location.search || '').replace(/^\?/, '')
  const params = new URLSearchParams(raw)
  const msg = params.get('error_description') || params.get('error')
  if (msg) window.history.replaceState(null, '', window.location.pathname)
  return msg ? msg.replace(/\+/g, ' ') : ''
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const msg = readUrlError()
    if (msg) setError(`That link didn't work (${msg}). Enter your email to get a new code.`)
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

  return (
    <div className="screen login">
      <div className="aura-bg" aria-hidden="true">
        <span style={{ left: '70%', top: '18%', '--c': '232,98,44' }} />
        <span style={{ left: '20%', top: '40%', '--c': '237,185,46' }} />
        <span style={{ left: '72%', top: '62%', '--c': '74,150,210' }} />
        <span style={{ left: '30%', top: '84%', '--c': '160,156,214' }} />
      </div>
      <div className="login-body">
        <div className="eyebrow mono">DAILY STACK</div>
        <h1 className="h1">Build habits<br />together.</h1>
        <p className="muted">Group challenges with daily photo check-ins. Miss a day and you lose the wager.</p>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="stack">
            <label className="field">
              <span className="mono label">EMAIL</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in code'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="stack">
            <p className="small" style={{ margin: 0 }}>We emailed a 6-digit code to <b>{email}</b>.</p>
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
        )}
      </div>
    </div>
  )
}
