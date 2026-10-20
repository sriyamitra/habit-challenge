import { supabase } from '../supabase'
import { uploadPhoto } from './photos'

export async function submitCheckin({ challengeId, habit, userId, day, file, caption, shareToChat }) {
  const path = await uploadPhoto(challengeId, userId, file)
  const { error } = await supabase
    .from('checkins')
    .insert({ challenge_id: challengeId, habit_id: habit.id, user_id: userId, day, photo_path: path })
  if (error) throw error
  if (shareToChat) {
    const { error: mErr } = await supabase
      .from('messages')
      .insert({ challenge_id: challengeId, user_id: userId, body: caption || '', photo_path: path, habit_id: habit.id })
    if (mErr) throw mErr
  }
  return path
}
