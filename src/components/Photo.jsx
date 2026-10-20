import { useEffect, useState } from 'react'
import { signedUrl } from '../lib/photos'
import { colorOf } from '../lib/colors'

export default function Photo({ path, alt, color, className = '', children }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    if (path) signedUrl(path).then((u) => alive && setUrl(u))
    return () => { alive = false }
  }, [path])
  const c = colorOf(color)
  return (
    <div className={'photo ' + className} style={{ background: c.tint }}>
      {url ? <img src={url} alt={alt} loading="lazy" /> : <div className="photo-glow" style={{ background: `radial-gradient(circle, ${c.solid} 0%, rgba(255,255,255,0) 70%)` }} />}
      {children}
    </div>
  )
}
