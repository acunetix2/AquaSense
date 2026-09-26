export type SignalType = 'normal' | 'watch' | 'investigate'

export type WaterClarity = 'clear' | 'slightly_cloudy' | 'cloudy' | 'very_cloudy'
export type NoticeableOdor = 'no' | 'yes' | 'unsure'
export type UnusualColor = 'no' | 'yes' | 'unsure'
export type FlowRate = 'normal' | 'fast' | 'low' | 'stagnant'

export interface AssessmentAnswers {
  waterClarity?: WaterClarity
  noticeableOdor?: NoticeableOdor
  unusualColor?: UnusualColor
  wasteVisible?: boolean
  flowRate?: FlowRate
  additionalNotes?: string
  temperatureEstimate?: string
  weatherConditions?: string
  /** Raw AI analysis captured on Step 4 (reused on submit instead of re-analysing). */
  ai_result?: unknown
  /** Observer explicitly kept their answer despite an AI consistency flag (FR-07). */
  consistency_acknowledged?: boolean
}

export interface ReviewAction {
  id: string
  reviewerName: string
  action: 'verified' | 'flagged' | 'requested_info'
  notes: string
  timestamp: string
}

/**
 * Image-quality or answer-vs-photo issue detected after analysis (PRD FR-06/FR-07).
 * Never overrides the observer — they confirm their answer or correct it.
 */
export interface ConsistencyFlag {
  field: string
  type: 'consistency' | 'image_quality'
  reported?: string
  observed?: string
  message: string
  severity?: 'info' | 'warning'
}

/** Auditable record of how the AI produced a signal (AI decision trail). */
export interface AiTrail {
  source: string
  model: string
  prompt_version: string
  analysed_at?: string
  image_count: number
  reused_step4_analysis?: boolean
  inputs?: {
    site_name?: string
    water_appearance?: string
    odour?: string
    waste_visible?: boolean
    flow_rate?: string
  }
  output?: {
    signal?: string
    confidence?: number
    urgency?: string
  }
  consistency_rule_hits?: string[]
}

export interface Observation {
  id: number | string
  site_name: string
  latitude: number
  longitude: number
  location_address?: string
  image_url: string
  image_urls?: string[]
  water_appearance: string
  odour: string
  waste_visible: boolean
  flow_rate: string
  notes?: string
  assessment_answers: AssessmentAnswers
  signal: SignalType
  confidence: number
  ai_summary: string
  created_at: string
  updated_at?: string
  status?: 'pending' | 'verified' | 'flagged'
  priority?: 'high' | 'medium' | 'low'
  key_evidence?: string[]
  suggested_steps?: string[]
  consistency_flags?: ConsistencyFlag[]
  ai_trail?: AiTrail
  reviewer_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  review_history?: ReviewAction[]
  // Observer and user association
  user_id?: string
  observer_name?: string
  observer_email?: string
  observer_avatar?: string
  observer_location?: string
  observer_role?: string
  // Social engagement (computed by the backend per request)
  like_count?: number
  comment_count?: number
  views_count?: number
  liked_by_me?: boolean
}

export interface ObservationComment {
  id: string
  observation_id: string | number
  user_id: string
  author_name: string
  author_avatar?: string | null
  author_role?: string | null
  body: string
  created_at: string
}

export interface LikeState {
  liked: boolean
  like_count: number
}

export type ActiveView = 
  | 'landing'
  | 'auth'
  | 'home' 
  | 'map' 
  | 'my-observations' 
  | 'dashboard' 
  | 'reviewer-queue' 
  | 'capture' 
  | 'detail'
  | 'profile'
  | 'api-docs'

export type { UserRole } from './roles'
