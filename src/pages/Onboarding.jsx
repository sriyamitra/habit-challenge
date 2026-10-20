import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

export default function Onboarding() {
  const { user, reloadProfile } = useAuth()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id)
    setBusy(false)
    if (error) return setError(error.message)
    reloadProfile()
  }

  return (
    <div className="screen pad top">
      <div className="eyebrow mono">WELCOME</div>
      <h1 className="h1">What should<br />friends call you?</h1>
      <form onSubmit={submit} className="stack" style={{ marginTop: 24 }}>
        <label className="field">
          <span className="mono label">YOUR NAME</span>
          <input required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" autoFocus />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy || !name.trim()}>Continue</button>
      </form>
    </div>
  )
}
