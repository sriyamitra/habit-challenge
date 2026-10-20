export default function Avatar({ name, color, size = 34 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span className="avatar" aria-hidden="true" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initial}
    </span>
  )
}
