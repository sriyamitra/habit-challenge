const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayISO = () => toISO(new Date())
export const addDays = (iso, n) => {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const diffDays = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000)

// 1-based challenge day for a date (can be <1 before start, >days after end)
export const dayNumber = (startISO, iso = todayISO()) => diffDays(startISO, iso) + 1
export const dateOfDay = (startISO, n) => addDays(startISO, n - 1)

export const fmtLong = (iso) =>
  fromISO(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()
export const fmtShort = (iso) => fromISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

// Monday-start week containing iso
export const weekOf = (iso) => {
  const d = fromISO(iso)
  const offset = (d.getDay() + 6) % 7
  const monday = addDays(iso, -offset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}
