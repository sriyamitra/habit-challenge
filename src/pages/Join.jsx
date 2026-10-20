import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Join() {
  const { code } = useParams()
  const nav = useNavigate()
  const [error, setError] = useState('')
  useEffect(() => {
    supabase.rpc('join_challenge', { p_code: code }).then(({ data, error }) => {
      if (error) setError(error.message)
      else nav(`/c/${data}`, { replace: true })
    })
  }, [code, nav])
  return (
    <div className="screen center pad">
      {error ? (
        <>
          <p>{error}</p>
          <Link className="btn" to="/">Back</Link>
        </>
      ) : (
        <p className="muted mono">JOINING…</p>
      )}
    </div>
  )
}
