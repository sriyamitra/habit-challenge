import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadProfile = useCallback(async () => {
    if (!session?.user) return setProfile(null)
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setProfile(data || { id: session.user.id, display_name: '' })
  }, [session?.user?.id])

  useEffect(() => { loadProfile() }, [loadProfile])

  const value = { session, user: session?.user || null, profile, reloadProfile: loadProfile }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
