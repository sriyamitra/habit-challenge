import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
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
        {sent ? (
          <div className="card">
            <strong>Check your email.</strong>
            <p className="muted small">We sent a sign-in link to {email}. Open it on this device.</p>
            <button className="link-btn" onClick={() => setSent(false)}>Use a different email</button>
          </div>
        ) : (
          <form onSubmit={submit} className="stack">
            <label className="field">
              <span className="mono label">EMAIL</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
