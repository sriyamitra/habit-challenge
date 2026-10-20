import { colorOf } from '../lib/colors'

// Blob centers (percent of the field) for up to 6 items
const SPOTS = [
  [62, 18], [33, 40], [66, 60], [34, 82], [68, 92], [50, 50],
]

// items: [{ key, label, sub, color, strength (0..1) }]
export default function Aura({ items, height = 400 }) {
  return (
    <div className="aura" style={{ height }}>
      {items.map((it, i) => {
        const [x, y] = SPOTS[i % SPOTS.length]
        const c = colorOf(it.color)
        const a = it.strength ?? 1
        return (
          <div
            key={it.key + '-blob'}
            className="aura-blob"
            aria-hidden="true"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: `radial-gradient(circle, rgba(${c.glow},${0.95 * a}) 0%, rgba(${c.glow},${0.55 * a}) 38%, rgba(${c.glow},0) 70%)`,
            }}
          />
        )
      })}
      {items.map((it, i) => {
        const [x, y] = SPOTS[i % SPOTS.length]
        return (
          <div key={it.key + '-label'} className="aura-label" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className="aura-title">{it.label}</div>
            {it.sub ? <div className="aura-sub">{it.sub}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
