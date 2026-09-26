import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uqobyzjzmnvjjczclgoi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2J5emp6bW52ampjemNsZ29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDkxOTUsImV4cCI6MjEwNTEyNTE5NX0.bYTYsy5ctBr9ku_yPWJB24w41hE2rmhHgnNU8wQwhGc'

export const STORAGE_BUCKET = 'aquasense-observations'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export async function ensureObservationStorageBucket(): Promise<void> {
  const { error } = await supabase.storage.getBucket(STORAGE_BUCKET)

  if (!error) return

  if (error.status === 404) {
    const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: '50MB',
    })

    if (createError) {
      throw new Error(
        'The upload bucket is missing. Create a public Supabase Storage bucket named "aquasense-observations" in the project dashboard.'
      )
    }
    return
  }

  throw new Error('Supabase Storage is not configured for observation uploads.')
}

export async function uploadObservationFiles(files: File[]): Promise<string[]> {
  await ensureObservationStorageBucket()

  const uploadedUrls = await Promise.all(
    files.map(async (file, index) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `observation-${index + 1}.jpg`
      const path = `observations/${Date.now()}-${index}-${safeName}`

      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      })

      if (error) {
        throw new Error(`Image upload failed: ${error.message}`)
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      return data.publicUrl
    })
  )

  return uploadedUrls
}

/**
 * Persist a data: URI image to the storage bucket before an observation is
 * saved. Sample/URL captures arrive as data: URIs, which the API sanitizer
 * strips — this guarantees they become real bucket URLs instead.
 * Returns the original value unchanged for non-data URLs, or null if upload fails.
 */
export async function uploadDataUriToStorage(dataUri: string, name = 'capture.jpg'): Promise<string | null> {
  if (!dataUri.startsWith('data:')) return dataUri
  try {
    const blob = await (await fetch(dataUri)).blob()
    if (!blob.size) return null
    const ext = (blob.type.split('/')[1] || 'jpeg').replace('jpg', 'jpg')
    const file = new File([blob], name.replace(/\.jpg$/, `.${ext}`), { type: blob.type || 'image/jpeg' })
    const [url] = await uploadObservationFiles([file])
    return url || null
  } catch {
    return null
  }
}

