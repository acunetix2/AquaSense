import type { Observation, SignalType, ConsistencyFlag, AiTrail, ObservationComment, LikeState } from '../types/observation'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// ---------------------------------------------------------------------------
// API response → Observation adapter
// ---------------------------------------------------------------------------

function adaptApiObservation(item: Record<string, unknown>): Observation {
  const imageUrls = Array.isArray(item.image_urls) && item.image_urls.length > 0
    ? (item.image_urls as string[])
    : (item.image_url ? [item.image_url as string] : [])

  return {
    id: item.id as number,
    site_name: item.site_name as string,
    location_address: (item.location_address as string | null) ?? `${item.site_name as string}, NY`,
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    image_url: (item.image_url as string | null) ?? imageUrls[0] ?? '',
    image_urls: imageUrls,
    water_appearance: (item.water_appearance as string | null) ?? 'clear',
    odour: (item.odour as string | null) ?? 'none',
    waste_visible: (item.waste_visible as boolean | null) ?? false,
    flow_rate: (item.flow_rate as string | null) ?? 'normal',
    notes: (item.notes as string | null) ?? '',
    assessment_answers: (item.assessment_answers as Record<string, unknown>) ?? {},
    signal: (item.signal as string)?.toLowerCase() as SignalType ?? 'normal',
    confidence: (item.confidence as number) ?? 0.75,
    ai_summary: (item.ai_summary as string | null) ?? 'Observation logged.',
    key_evidence: (item.key_evidence as string[]) ?? [],
    suggested_steps: (item.suggested_steps as string[]) ?? [],
    consistency_flags: (item.consistency_flags as ConsistencyFlag[]) ?? [],
    ai_trail: (item.ai_trail as AiTrail) || undefined,
    created_at: (item.created_at as string) ?? new Date().toISOString(),
    updated_at: (item.updated_at as string) || undefined,
    status: ((item.status as 'pending' | 'verified' | 'flagged') || 'pending'),
    priority:
      item.signal === 'investigate' ? 'high' :
      item.signal === 'watch' ? 'medium' : 'low',
    reviewer_notes: (item.reviewer_notes as string) || undefined,
    reviewed_by: (item.reviewed_by as string) || undefined,
    reviewed_at: (item.reviewed_at as string) || undefined,
    review_history: [],
    // Observer / user profile fields
    user_id: (item.user_id as string) || undefined,
    observer_name: (item.observer_name as string) || undefined,
    observer_email: (item.observer_email as string) || undefined,
    observer_avatar: (item.observer_avatar as string) || undefined,
    observer_location: (item.observer_location as string) || undefined,
    observer_role: (item.observer_role as string) || undefined,
    like_count: (item.like_count as number) ?? 0,
    comment_count: (item.comment_count as number) ?? 0,
    views_count: (item.views_count as number) ?? 0,
    liked_by_me: (item.liked_by_me as boolean) ?? false,
  }
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

async function apiFetch(path: string, options?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await apiFetch('/health', undefined, 1500)
    return res.ok
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Observations cache — memory + sessionStorage (stale-while-revalidate)
// ---------------------------------------------------------------------------

const OBSERVATIONS_TTL_MS = 60_000
const OBSERVATIONS_CACHE_KEY = 'aquasense_obs_cache_v1'

interface ObservationsCacheEntry {
  key: string
  ts: number
  data: Observation[]
}

let observationsMemoryCache: ObservationsCacheEntry | null = null

function observationsCacheKey(userId?: string, viewerId?: string): string {
  return `${userId ?? '*'}|${viewerId ?? '-'}`
}

export function getCachedObservations(
  userId?: string,
  viewerId?: string
): Observation[] | null {
  const key = observationsCacheKey(userId, viewerId)
  if (observationsMemoryCache && observationsMemoryCache.key === key) {
    return observationsMemoryCache.data
  }
  try {
    const raw = sessionStorage.getItem(OBSERVATIONS_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ObservationsCacheEntry
      if (parsed && parsed.key === key && Array.isArray(parsed.data)) {
        observationsMemoryCache = parsed
        return parsed.data
      }
    }
  } catch {
    // corrupted cache — ignore
  }
  return null
}

export function isObservationsCacheFresh(userId?: string, viewerId?: string): boolean {
  const entry = observationsMemoryCache
  if (!entry || entry.key !== observationsCacheKey(userId, viewerId)) return false
  return Date.now() - entry.ts < OBSERVATIONS_TTL_MS
}

export function setObservationsCache(
  data: Observation[],
  userId?: string,
  viewerId?: string
): void {
  const entry: ObservationsCacheEntry = {
    key: observationsCacheKey(userId, viewerId),
    ts: Date.now(),
    data,
  }
  observationsMemoryCache = entry
  try {
    sessionStorage.setItem(OBSERVATIONS_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // storage full/unavailable — memory cache still works
  }
}

export async function fetchObservations(
  userId?: string,
  viewerId?: string,
  options?: { force?: boolean }
): Promise<Observation[]> {
  // Serve fresh cache without hitting the network unless a force is requested
  if (!options?.force && isObservationsCacheFresh(userId, viewerId)) {
    const cached = getCachedObservations(userId, viewerId)
    if (cached) return cached
  }

  try {
    const query = userId ? `/observations?limit=500&user_id=${encodeURIComponent(userId)}` : '/observations?limit=500'
    const headers: Record<string, string> = {}
    if (viewerId) headers['X-User-Id'] = viewerId
    const res = await apiFetch(query, { headers }, 10000)
    if (res.ok) {
      const apiData = await res.json()
      if (Array.isArray(apiData)) {
        const adapted = apiData.map(adaptApiObservation)
        setObservationsCache(adapted, userId, viewerId)
        return adapted
      }
    }
  } catch {
    // fall through to stale cache below
  }

  // Network failed or returned an error — fall back to any cached copy
  const stale = getCachedObservations(userId, viewerId)
  return stale ?? []
}

function sanitizeStoredImage(value?: string): string | undefined {
  if (!value || typeof value !== 'string') return undefined
  const cleaned = value.trim()
  if (!cleaned) return undefined
  if (cleaned.startsWith('data:') || cleaned.startsWith('blob:')) return undefined
  if (cleaned.length > 500) return undefined
  return cleaned
}

export async function createObservation(payload: {
  site_name: string
  latitude: number
  longitude: number
  location_address?: string
  image_url: string
  image_urls?: string[]
  image_data_list?: string[]
  water_appearance: string
  odour: string
  waste_visible: boolean
  flow_rate: string
  notes?: string
  assessment_answers: Record<string, unknown>
  // Fields only used for offline fallback (AI runs on server otherwise)
  signal?: SignalType
  confidence?: number
  ai_summary?: string
  key_evidence?: string[]
  suggested_steps?: string[]
  // User / observer profile (email is intentionally omitted from storage to protect privacy)
  user_id?: string
  observer_name?: string
  observer_avatar?: string
  observer_location?: string
  observer_role?: string
}): Promise<Observation> {
  const sanitizedImageUrls = (payload.image_urls || [])
    .map(sanitizeStoredImage)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
  const sanitizedPrimaryImage = sanitizeStoredImage(payload.image_url)
  const images = sanitizedImageUrls.length > 0
    ? sanitizedImageUrls
    : sanitizedPrimaryImage ? [sanitizedPrimaryImage] : []

  const res = await apiFetch('/observations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site_name: payload.site_name,
      location_address: payload.location_address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      image_url: images[0] || undefined,
      image_urls: images,
      image_data_list: payload.image_data_list || [],
      water_appearance: payload.water_appearance,
      odour: payload.odour,
      waste_visible: payload.waste_visible,
      flow_rate: payload.flow_rate,
      notes: payload.notes,
      assessment_answers: payload.assessment_answers,
      user_id: payload.user_id,
      observer_name: payload.observer_name,
      observer_avatar: payload.observer_avatar,
      observer_location: payload.observer_location,
      observer_role: payload.observer_role,
    }),
  }, 15000)

  if (!res.ok && res.status !== 201) {
    throw new Error('Failed to save the observation to the database.')
  }

  const created = await res.json()
  return adaptApiObservation(created)
}

export async function updateObservation(
  id: number | string,
  updates: {
    site_name?: string
    location_address?: string
    latitude?: number
    longitude?: number
    notes?: string
    water_appearance?: string
    odour?: string
    waste_visible?: boolean
    flow_rate?: string
    image_url?: string
    image_urls?: string[]
  },
  userId: string
): Promise<Observation | null> {
  const res = await apiFetch(`/observations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify(updates),
  }, 5000)

  if (!res.ok) {
    throw new Error('Failed to update the observation in the database.')
  }

  const updated = await res.json()
  return adaptApiObservation(updated)
}

export async function reviewObservation(
  id: number | string,
  action: 'verified' | 'flagged',
  reviewerName: string,
  notes: string,
  userId?: string
): Promise<Observation | null> {
  let res: Response
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (userId) headers['X-User-Id'] = userId

    res = await apiFetch(`/observations/${id}/review`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        action,
        reviewer_name: reviewerName,
        notes,
      }),
    }, 5000)
  } catch {
    // Backend offline → caller falls back to local state
    return null
  }

  if (res.status === 401 || res.status === 403) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload.detail || 'Only certified reviewers can verify or flag records.')
  }

  if (res.ok) {
    const updated = await res.json()
    return adaptApiObservation(updated)
  }
  return null
}

export function updateObservationReview(
  _id: number | string,
  _action: 'verified' | 'flagged',
  _reviewerName: string,
  _notes: string
): Observation[] {
  return []
}

export async function deleteObservation(id: number | string, userId?: string): Promise<boolean> {
  const headers: Record<string, string> = {}
  if (userId) headers['X-User-Id'] = userId

  const res = await apiFetch(`/observations/${id}`, {
    method: 'DELETE',
    headers,
  }, 5000)

  return res.ok || res.status === 204
}

// ---------------------------------------------------------------------------
// Analytics & Metrics API
// ---------------------------------------------------------------------------

export interface LiveAnalytics {
  total_observations: number
  verified_count: number
  pending_count: number
  flagged_count: number
  signals: {
    normal: number
    watch: number
    investigate: number
  }
  active_observers: number
  monitored_sites: number
  average_confidence: number
  waste_reported_count: number
  water_health_index: number
}

export async function fetchLiveAnalytics(): Promise<LiveAnalytics | null> {
  try {
    const res = await apiFetch('/observations/analytics', undefined, 12000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Analytics fetch notice:', err)
  }
  return null
}

// ---------------------------------------------------------------------------
// Fetch a single observation by id (shared links / direct navigation)
// ---------------------------------------------------------------------------

export async function fetchObservationById(id: number | string): Promise<Observation | null> {
  try {
    const res = await apiFetch(`/observations/${id}`, undefined, 8000)
    if (res.ok) {
      return adaptApiObservation(await res.json())
    }
  } catch (err) {
    console.warn('Observation by-id fetch notice:', err)
  }
  return null
}

// ---------------------------------------------------------------------------
// Watershed Analytics API (per-location rollups, trusted sources, per-observation)
// ---------------------------------------------------------------------------

export interface LocationStat {
  site_name: string
  location_address: string | null
  latitude: number
  longitude: number
  total: number
  normal: number
  watch: number
  investigate: number
  verified: number
  pending: number
  flagged: number
  avg_confidence: number
  views: number
  likes: number
  comments: number
  last_observed: string | null
}

export interface TrustedSite {
  site_name: string
  basin_name: string
  latitude: number
  longitude: number
  description: string | null
  catchment_area_sq_km: number | null
  baseline_quality: string
}

export interface TrustedSiteSection {
  basin_name: string
  sites: TrustedSite[]
}

export interface BasinSnapshot {
  snapshot_date: string
  basin_name: string
  total_samples: number
  normal_count: number
  watch_count: number
  investigate_count: number
  verified_rate: number
  health_index_score: number
}

export interface RegionAnalytics {
  locations: LocationStat[]
  trusted_sections: TrustedSiteSection[]
  basin_snapshots: BasinSnapshot[]
}

export interface ObservationAnalytics {
  observation_id: string
  site_name: string
  signal: string
  status: string
  confidence: number
  consistency_flag_count: number
  engagement: { views: number; likes: number; comments: number }
  ai: Record<string, string | number | boolean | (string | number | boolean)[]>
  site_context: TrustedSite | null
  region: {
    site_name: string
    total_at_site: number
    avg_confidence: number
    normal: number
    watch: number
    investigate: number
    verified: number
    engagement_rank: number | null
    top_confidence: number
  } | null
}

export async function fetchRegionAnalytics(): Promise<RegionAnalytics | null> {
  try {
    const res = await apiFetch('/analytics/regions', undefined, 15000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Region analytics fetch notice:', err)
  }
  return null
}

export async function fetchObservationAnalytics(
  observationId: number | string
): Promise<ObservationAnalytics | null> {
  try {
    const res = await apiFetch(`/analytics/observations/${observationId}`, undefined, 10000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Observation analytics fetch notice:', err)
  }
  return null
}

// ---------------------------------------------------------------------------
// Image CORS Proxy helper
// ---------------------------------------------------------------------------

export function getImageProxyUrl(externalUrl: string): string {
  if (!externalUrl) return ''
  // If it's already a data URI or local blob/proxy, return as is
  if (externalUrl.startsWith('data:') || externalUrl.startsWith('blob:') || externalUrl.includes('/observations/proxy-image')) {
    return externalUrl
  }
  return `${API_BASE_URL}/observations/proxy-image?url=${encodeURIComponent(externalUrl)}`
}

// ---------------------------------------------------------------------------
// Profiles & Social API
// ---------------------------------------------------------------------------

export interface PublicProfileData {
  id: number
  user_id: string
  full_name: string
  avatar_url?: string
  role: string
  bio?: string
  organization?: string
  phone?: string
  location?: string
  website?: string
  observations_count: number
  verified_count: number
  followers_count: number
  following_count: number
  likes_received: number
  comments_received?: number
  views_received?: number
  is_following?: boolean
  liked_by_me?: boolean
  created_at: string
}

export async function fetchPublicProfile(userId: string, viewerId?: string): Promise<PublicProfileData | null> {
  try {
    const headers: Record<string, string> = {}
    if (viewerId) headers['X-User-Id'] = viewerId
    const res = await apiFetch(`/profiles/${encodeURIComponent(userId)}`, { headers })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Profile fetch notice:', err)
  }
  return null
}

export async function followUserProfile(targetUserId: string, currentUserId: string): Promise<PublicProfileData | null> {
  try {
    const res = await apiFetch(`/profiles/${encodeURIComponent(targetUserId)}/follow`, {
      method: 'POST',
      headers: { 'X-User-Id': currentUserId },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Follow profile notice:', err)
  }
  return null
}

export async function unfollowUserProfile(targetUserId: string, currentUserId: string): Promise<PublicProfileData | null> {
  try {
    const res = await apiFetch(`/profiles/${encodeURIComponent(targetUserId)}/follow`, {
      method: 'DELETE',
      headers: { 'X-User-Id': currentUserId },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Unfollow profile notice:', err)
  }
  return null
}

export async function likeUserProfile(targetUserId: string, currentUserId: string): Promise<PublicProfileData | null> {
  try {
    const res = await apiFetch(`/profiles/${encodeURIComponent(targetUserId)}/like`, {
      method: 'POST',
      headers: { 'X-User-Id': currentUserId },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Like profile notice:', err)
  }
  return null
}

export async function unlikeUserProfile(targetUserId: string, currentUserId: string): Promise<PublicProfileData | null> {
  try {
    const res = await apiFetch(`/profiles/${encodeURIComponent(targetUserId)}/like`, {
      method: 'DELETE',
      headers: { 'X-User-Id': currentUserId },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Unlike profile notice:', err)
  }
  return null
}

// ---------------------------------------------------------------------------
// Observation comments & likes
// ---------------------------------------------------------------------------

export async function fetchComments(observationId: number | string): Promise<ObservationComment[]> {
  try {
    const res = await apiFetch(`/observations/${observationId}/comments`, undefined, 5000)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Comments fetch notice:', err)
    return []
  }
}

export async function createComment(
  observationId: number | string,
  body: string,
  userId: string,
): Promise<ObservationComment | null> {
  try {
    const res = await apiFetch(`/observations/${observationId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ body }),
    }, 5000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Comment create notice:', err)
  }
  return null
}

export async function deleteComment(
  observationId: number | string,
  commentId: string,
  userId: string,
): Promise<boolean> {
  try {
    const res = await apiFetch(`/observations/${observationId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    }, 5000)
    return res.ok || res.status === 204
  } catch (err) {
    console.warn('Comment delete notice:', err)
    return false
  }
}

export async function likeObservation(
  observationId: number | string,
  userId: string,
): Promise<LikeState | null> {
  try {
    const res = await apiFetch(`/observations/${observationId}/like`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
    }, 5000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Observation like notice:', err)
  }
  return null
}

export async function unlikeObservation(
  observationId: number | string,
  userId: string,
): Promise<LikeState | null> {
  try {
    const res = await apiFetch(`/observations/${observationId}/like`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    }, 5000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Observation unlike notice:', err)
  }
  return null
}


// ---------------------------------------------------------------------------
// Observation views & own profile (engagement)
// ---------------------------------------------------------------------------

export async function recordObservationView(
  observationId: number | string,
  viewerId: string,
): Promise<number | null> {
  try {
    const res = await apiFetch(`/observations/${observationId}/view`, {
      method: 'POST',
      headers: { 'X-User-Id': viewerId },
    }, 5000)
    if (res.ok) {
      const data = (await res.json()) as { view_count?: number }
      return data.view_count ?? null
    }
  } catch {
    // view tracking is best-effort; never block the detail page
  }
  return null
}

export async function fetchMyProfile(userId: string): Promise<PublicProfileData | null> {
  try {
    const res = await apiFetch(`/profiles/me`, {
      headers: { 'X-User-Id': userId },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('My profile fetch notice:', err)
  }
  return null
}
// ---------------------------------------------------------------------------
// Notification engine (in-app notifications)
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  observation_id: string | null
  actor_name: string | null
  read: boolean
  created_at: string
}

export interface NotificationListResponse {
  items: AppNotification[]
  unread_count: number
}

export async function fetchNotifications(userId: string): Promise<NotificationListResponse | null> {
  try {
    const res = await apiFetch('/notifications', {
      headers: { 'X-User-Id': userId },
    }, 8000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Notifications fetch notice:', err)
  }
  return null
}

export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<AppNotification | null> {
  try {
    const res = await apiFetch(`/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
    }, 5000)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Notification read notice:', err)
  }
  return null
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  try {
    const res = await apiFetch('/notifications/read-all', {
      method: 'POST',
      headers: { 'X-User-Id': userId },
    }, 5000)
    if (res.ok) {
      return true
    }
  } catch (err) {
    console.warn('Notifications read-all notice:', err)
  }
  return false
}