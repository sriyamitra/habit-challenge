import { supabase } from '../supabase'

// Resize to max 1280px and re-encode as JPEG to keep storage small.
export async function compressImage(file, max = 1280, quality = 0.8) {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return await new Promise((res) => canvas.toBlob((b) => res(b || file), 'image/jpeg', quality))
}

export async function uploadPhoto(challengeId, userId, file) {
  const blob = await compressImage(file)
  const path = `${challengeId}/${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

// Batched signed-URL lookups (photos bucket is private)
const cache = new Map()
let queue = new Map()
let timer = null

function flush() {
  const batch = queue
  queue = new Map()
  timer = null
  const paths = [...batch.keys()]
  supabase.storage
    .from('photos')
    .createSignedUrls(paths, 3600)
    .then(({ data, error }) => {
      if (error) throw error
      const expires = Date.now() + 3500 * 1000
      for (const row of data) {
        const waiters = batch.get(row.path) || []
        if (row.signedUrl) cache.set(row.path, { url: row.signedUrl, expires })
        waiters.forEach((w) => w(row.signedUrl || null))
      }
    })
    .catch(() => batch.forEach((ws) => ws.forEach((w) => w(null))))
}

export function signedUrl(path) {
  const hit = cache.get(path)
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.url)
  return new Promise((resolve) => {
    if (!queue.has(path)) queue.set(path, [])
    queue.get(path).push(resolve)
    if (!timer) timer = setTimeout(flush, 30)
  })
}
