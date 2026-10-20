import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Outlet, useParams, Link } from 'react-router-dom'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { memberColor } from './lib/colors'
import TabBar from './components/TabBar'

const ChallengeCtx = createContext(null)
export const useChallenge = () => useContext(ChallengeCtx)

export function ChallengeLayout() {
  const { id } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true })

  const load = useCallback(async () => {
    const [ch, hb, mb, ci] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).maybeSingle(),
      supabase.from('habits').select('*').eq('challenge_id', id).order('position'),
      supabase.from('members').select('user_id, joined_at').eq('challenge_id', id).order('joined_at'),
      supabase.from('checkins').select('*').eq('challenge_id', id),
    ])
    const err = ch.error || hb.error || mb.error || ci.error
    if (err) return setState({ loading: false, error: err.message })
    if (!ch.data) return setState({ loading: false, error: 'not-found' })
    const ids = mb.data.map((m) => m.user_id)
    const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids)
    const byId = Object.fromEntries((profs || []).map((p) => [p.id, p]))
    const members = mb.data.map((m, i) => ({
      id: m.user_id,
      name: byId[m.user_id]?.display_name || 'Someone',
      color: memberColor(i),
      isMe: m.user_id === user.id,
    }))
    setState({ loading: false, challenge: ch.data, habits: hb.data, members, checkins: ci.data })
  }, [id, user.id])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('challenge-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `challenge_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `challenge_id=eq.${id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, load])

  if (state.loading) return <div className="screen center"><p className="muted mono">LOADING…</p></div>
  if (state.error) {
    return (
      <div className="screen center pad">
        <p>{state.error === 'not-found' ? "This challenge doesn't exist or you're not a member." : state.error}</p>
        <Link className="btn" to="/">Back to your challenges</Link>
      </div>
    )
  }
  const me = state.members.find((m) => m.isMe)
  return (
    <ChallengeCtx.Provider value={{ ...state, me, reload: load }}>
      <div className="screen with-tabs">
        <Outlet />
      </div>
      <TabBar />
    </ChallengeCtx.Provider>
  )
}
