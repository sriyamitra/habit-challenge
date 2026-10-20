import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { isConfigured } from './supabase'
import { ChallengeLayout } from './challenge'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import NewChallenge from './pages/NewChallenge'
import Join from './pages/Join'
import Today from './pages/Today'
import Checkin from './pages/Checkin'
import Chat from './pages/Chat'
import Friends from './pages/Friends'
import Wager from './pages/Wager'

export default function App() {
  const { session, profile } = useAuth() || {}
  if (!isConfigured) {
    return (
      <div className="screen center pad">
        <h1 className="h2">Almost there</h1>
        <p className="muted">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README.md), then restart.</p>
      </div>
    )
  }
  if (session === undefined || (session && !profile)) {
    return <div className="screen center"><p className="muted mono">LOADING…</p></div>
  }
  if (!session) return <Login />
  if (!profile.display_name) return <Onboarding />
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new" element={<NewChallenge />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/c/:id" element={<ChallengeLayout />}>
        <Route index element={<Today />} />
        <Route path="checkin" element={<Checkin />} />
        <Route path="chat" element={<Chat />} />
        <Route path="friends" element={<Friends />} />
        <Route path="wager" element={<Wager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
