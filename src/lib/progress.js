import { dayNumber, dateOfDay, todayISO } from './dates'

// Per-member progress across the whole challenge.
// status per day: 'done' | 'missed' | 'today' | 'ahead'
export function memberProgress(userId, challenge, habits, checkins, today = todayISO()) {
  const todayN = dayNumber(challenge.start_date, today)
  const habitIds = new Set(habits.map((h) => h.id))
  const byDay = new Map()
  for (const c of checkins) {
    if (c.user_id !== userId || !habitIds.has(c.habit_id)) continue
    if (!byDay.has(c.day)) byDay.set(c.day, new Set())
    byDay.get(c.day).add(c.habit_id)
  }
  const need = habits.length
  const days = []
  let completed = 0
  let missed = 0
  for (let n = 1; n <= challenge.days; n++) {
    const iso = dateOfDay(challenge.start_date, n)
    const count = byDay.get(iso)?.size || 0
    const complete = need > 0 && count >= need
    let status
    if (n < todayN) status = complete ? 'done' : 'missed'
    else if (n === todayN) status = complete ? 'done' : 'today'
    else status = 'ahead'
    if (status === 'done') completed++
    if (status === 'missed') missed++
    days.push({ n, iso, count, status })
  }
  // streak: consecutive completed days ending today (or yesterday if today still open)
  let streak = 0
  for (let i = Math.min(todayN, challenge.days) - 1; i >= 0; i--) {
    const d = days[i]
    if (!d) continue
    if (d.status === 'done') streak++
    else if (d.status === 'today') continue
    else break
  }
  const todayDone = todayN >= 1 && todayN <= challenge.days ? byDay.get(today)?.size || 0 : 0
  return { days, completed, missed, streak, todayDone, need, todayN }
}

export function challengePhase(challenge, today = todayISO()) {
  const n = dayNumber(challenge.start_date, today)
  if (n < 1) return { phase: 'upcoming', n }
  if (n > challenge.days) return { phase: 'finished', n }
  return { phase: 'active', n }
}
