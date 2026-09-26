import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export interface AuthUserProfile {
  id: string
  email: string
  name: string
  avatar_url: string
  role: string          // e.g. 'citizen' | 'reviewer' | 'limnologist' | 'inspector' …
  provider: 'google' | 'demo' | 'email'
  bio?: string
  location?: string
  website?: string
  observations_count?: number
  verified_count?: number
}

// Why the full-screen loader is showing (drives the context-aware AppLoader)
export type AuthLoadingReason = 'boot' | 'signin' | 'signup' | 'oauth' | 'signout' | 'reset' | 'password'

interface AuthContextType {
  user: AuthUserProfile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  loadingReason: AuthLoadingReason
  authError: string | null
  emailNeedsVerification: boolean
  verificationEmail: string | null
  isPasswordRecovery: boolean
  setIsPasswordRecovery: (val: boolean) => void
  clearAuthError: () => void
  clearVerificationNotice: () => void
  resendVerificationEmail: () => Promise<void>
  sendPasswordResetEmail: (email: string) => Promise<void>
  updateUserPassword: (password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string, role?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithDemo: (role?: string) => void
  signOut: () => Promise<void>
  setUserRole: (role: string) => void
  updateUserProfile: (updates: Partial<Pick<AuthUserProfile, 'name' | 'avatar_url' | 'bio' | 'location' | 'website'>>) => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER_STORAGE_KEY = 'aquasense_demo_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingReason, setLoadingReason] = useState<AuthLoadingReason>('boot')
  const [authError, setAuthError] = useState<string | null>(null)
  const [emailNeedsVerification, setEmailNeedsVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('reset-password')
      )
    }
    return false
  })

  // Fetch or upsert profile in the PostgreSQL database
  const syncProfileWithDb = async (baseProfile: AuthUserProfile): Promise<AuthUserProfile> => {
    // Demo users also get a backend profile so role checks (e.g. reviewer
    // permissions) and observation FK ownership work during live demos.
    try {
      // 1. Try fetching existing saved profile from backend DB
      const meRes = await fetch(`${API_BASE_URL}/profiles/me`, {
        headers: { 'X-User-Id': baseProfile.id },
      })

      if (meRes.ok) {
        const dbData = await meRes.json()
        return {
          ...baseProfile,
          name: dbData.full_name || baseProfile.name,
          avatar_url: dbData.avatar_url || baseProfile.avatar_url,
          bio: dbData.bio ?? baseProfile.bio,
          location: dbData.location ?? baseProfile.location,
          website: dbData.website ?? baseProfile.website,
          role: dbData.role || baseProfile.role,
          observations_count: dbData.observations_count,
          verified_count: dbData.verified_count,
        }
      }

      // 2. If not found in DB, upsert initial record
      const upsertRes = await fetch(`${API_BASE_URL}/profiles/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: baseProfile.id,
          email: baseProfile.email,
          full_name: baseProfile.name,
          avatar_url: baseProfile.avatar_url,
          role: baseProfile.role,
          bio: baseProfile.bio || null,
          location: baseProfile.location || null,
          website: baseProfile.website || null,
        }),
      })

      if (upsertRes.ok) {
        const dbData = await upsertRes.json()
        return {
          ...baseProfile,
          name: dbData.full_name || baseProfile.name,
          avatar_url: dbData.avatar_url || baseProfile.avatar_url,
          bio: dbData.bio ?? baseProfile.bio,
          location: dbData.location ?? baseProfile.location,
          website: dbData.website ?? baseProfile.website,
          role: dbData.role || baseProfile.role,
          observations_count: dbData.observations_count,
          verified_count: dbData.verified_count,
        }
      }
    } catch (err) {
      console.warn('Backend profile sync notice:', err)
    }

    return baseProfile
  }

  // Transform Supabase user into AuthUserProfile
  const buildProfileFromSupabaseUser = (
    sbUser: SupabaseUser,
    forcedRole?: string
  ): AuthUserProfile => {
    const meta = sbUser.user_metadata || {}
    const email = (sbUser.email || meta.email || '').trim().toLowerCase() || 'user@example.com'
    const name = (meta.full_name || meta.name || email.split('@')[0] || 'AquaSense User').trim()
    const avatar =
      meta.avatar_url ||
      meta.picture ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

    const storedRole = localStorage.getItem('aquasense_user_role') || 'citizen'
    const role = forcedRole || meta.role || storedRole
    const provider = (sbUser.app_metadata?.provider === 'google' ? 'google' : 'email') as 'google' | 'email' | 'demo'

    return {
      id: sbUser.id,
      email,
      name,
      avatar_url: avatar,
      role,
      provider,
      bio: meta.bio,
      location: meta.location,
      website: meta.website,
    }
  }

  useEffect(() => {
    let isMounted = true

    // Check existing Supabase session
    const initAuth = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Supabase getSession notice:', error.message)
        }

        if (existingSession?.user) {
          const rawProfile = buildProfileFromSupabaseUser(existingSession.user)
          if (isMounted) {
            setSession(existingSession)
            setUser(rawProfile)
          }

          // Hydrate with DB persisted fields in background
          const hydrated = await syncProfileWithDb(rawProfile)
          if (isMounted) {
            setUser(hydrated)
            setIsLoading(false)
          }
          return
        }

        // Check for stored demo user
        const storedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY)
        if (storedDemo) {
          try {
            const parsed = JSON.parse(storedDemo)
            if (isMounted) {
              setUser(parsed)
              setIsLoading(false)
            }
            // Ensure the demo profile exists on the backend (role checks + FK ownership)
            const synced = await syncProfileWithDb(parsed)
            if (isMounted) setUser(synced)
            return
          } catch {
            localStorage.removeItem(DEMO_USER_STORAGE_KEY)
          }
        }
      } catch (err: any) {
        console.warn('Auth init fallback:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initAuth()

    // Listen for OAuth redirects / state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!isMounted) return
        if (_event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true)
        }
        setSession(currentSession)
        if (currentSession?.user) {
          const raw = buildProfileFromSupabaseUser(currentSession.user)
          setUser(raw)
          localStorage.removeItem(DEMO_USER_STORAGE_KEY)

          // Persist & hydrate with DB after auth confirmation or login.
          const synced = await syncProfileWithDb(raw)
          if (isMounted) setUser(synced)
        } else if (!localStorage.getItem(DEMO_USER_STORAGE_KEY)) {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Refresh profile on demand
  const refreshUserProfile = async () => {
    if (!user) return
    const refreshed = await syncProfileWithDb(user)
    setUser(refreshed)
  }

  // Google OAuth sign-in
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setLoadingReason('oauth')
      setAuthError(null)

      const redirectUrl = window.location.origin

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err)
      setAuthError(
        err.message ||
        'Unable to complete Google Sign-In. You can still use the Quick Demo Login to continue.'
      )
      setIsLoading(false)
    }
  }

  // Email & Password Sign-Up
  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: string = 'citizen'
  ) => {
    try {
      setIsLoading(true)
      setLoadingReason('signup')
      setAuthError(null)

      const signupEmail = email.trim().toLowerCase()

      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password,
          full_name: name,
          role,
        }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload.detail || payload.message || 'Failed to create account.')
      }

      if (payload.needs_confirmation) {
        setEmailNeedsVerification(true)
        setVerificationEmail(signupEmail)
        setAuthError(null)
        setIsLoading(false)
        return
      }

      localStorage.setItem('aquasense_user_role', role)
      const profile: AuthUserProfile = {
        id: payload.user_id || `email-${Date.now()}`,
        email: payload.email || signupEmail,
        name: payload.full_name || name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.full_name || name || signupEmail)}`,
        role: payload.role || role,
        provider: 'email',
      }

      if (payload.session?.access_token && payload.session?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        })
        if (error) {
          console.warn('Supabase setSession notice:', error)
        }
      }

      setUser(profile)
      localStorage.removeItem(DEMO_USER_STORAGE_KEY)
      const synced = await syncProfileWithDb(profile)
      setUser(synced)
    } catch (err: any) {
      console.error('Email Sign-Up Error:', err)
      const msg = err.message || 'Failed to create account. Please check your credentials.'
      setAuthError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!verificationEmail) return
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      })
      if (error) throw error
    } catch (err: any) {
      console.error('Resend verification error:', err)
      setAuthError(err.message || 'Failed to resend confirmation email.')
      throw err
    }
  }

  // Email & Password Sign-In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setLoadingReason('signin')
      setAuthError(null)

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message = payload.detail || payload.message || 'Invalid email or password.'
        if (String(message).toLowerCase().includes('confirm') || String(message).toLowerCase().includes('verified')) {
          setEmailNeedsVerification(true)
          setVerificationEmail(email.trim().toLowerCase())
          setAuthError('Please verify your email address before logging in. Check your inbox for the confirmation link.')
          return
        }
        throw new Error(message)
      }

      if (payload.session?.access_token && payload.session?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        })
        if (error) {
          throw error
        }
      }

      const profile: AuthUserProfile = {
        id: payload.user_id || `email-${Date.now()}`,
        email: payload.email || email.trim().toLowerCase(),
        name: payload.full_name || payload.email?.split('@')[0] || 'AquaSense User',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.full_name || payload.email || email.trim())}`,
        role: payload.role || 'citizen',
        provider: 'email',
      }

      setUser(profile)
      if (payload.session) {
        setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: payload.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: profile.id,
            email: profile.email,
            user_metadata: { full_name: profile.name, role: profile.role },
            app_metadata: { provider: 'email' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        } as Session)
      }
      localStorage.removeItem(DEMO_USER_STORAGE_KEY)

      const synced = await syncProfileWithDb(profile)
      setUser(synced)
    } catch (err: any) {
      console.error('Email Sign-In Error:', err)
      const msg = err.message || 'Invalid email or password. Please verify your credentials.'
      setAuthError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  const clearVerificationNotice = () => {
    setEmailNeedsVerification(false)
    setVerificationEmail(null)
  }

  // Demo sign-in for fast access & testing
  const signInWithDemo = (role: string = 'citizen') => {
    const demoProfile: AuthUserProfile = {
      id: `demo-${role}-${Date.now()}`,
      email: 'demo@aquasense.org',
      name: 'Demo AquaSense User',
      avatar_url:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=aquasense-demo',
      role,
      provider: 'demo',
      observations_count: 5,
      verified_count: 4,
    }

    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoProfile))
    localStorage.setItem('aquasense_user_role', role)
    setUser(demoProfile)
    setSession(null)
    setAuthError(null)
    setIsLoading(false)

    // Create the matching backend profile so demo reviewers can review records
    syncProfileWithDb(demoProfile)
      .then((synced) => setUser(synced))
      .catch(() => {})
  }

  const signOut = async () => {
    setIsLoading(true)
    setLoadingReason('signout')
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out notice:', err)
    } finally {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY)
      setUser(null)
      setSession(null)
      setIsLoading(false)
    }
  }

  const setUserRole = async (role: string) => {
    localStorage.setItem('aquasense_user_role', role)
    if (user) {
      const updated = { ...user, role }
      setUser(updated)
      if (user.provider === 'demo') {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated))
      }
      // Persist the role to the backend profile so API role checks agree
      // with what the UI shows (both demo and real accounts).
      try {
        await fetch(`${API_BASE_URL}/profiles/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id,
          },
          body: JSON.stringify({ role }),
        })
      } catch (e) {
        console.warn('Failed to persist role to DB:', e)
      }
    }
  }

  // Crucial fix: Saves both to PostgreSQL database via backend API and Supabase Auth metadata
  const updateUserProfile = async (
    updates: Partial<Pick<AuthUserProfile, 'name' | 'avatar_url' | 'bio' | 'location' | 'website'>>
  ) => {
    if (!user) return
    const updated = { ...user, ...updates }
    setUser(updated)

    // Demo persistence
    if (user.provider === 'demo') {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated))
      return
    }

    // 1. Persist directly to backend database (PostgreSQL)
    try {
      const profilePayload = {
        full_name: updates.name ?? user.name,
        avatar_url: updates.avatar_url ?? user.avatar_url,
        bio: updates.bio ?? user.bio,
        location: updates.location ?? user.location,
        website: updates.website ?? user.website,
      }

      let res = await fetch(`${API_BASE_URL}/profiles/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
        body: JSON.stringify(profilePayload),
      })

      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE_URL}/profiles/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id,
          },
          body: JSON.stringify(profilePayload),
        })
      }

      if (!res.ok && (res.status === 404 || res.status === 400)) {
        await fetch(`${API_BASE_URL}/profiles/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email,
            full_name: profilePayload.full_name,
            avatar_url: profilePayload.avatar_url,
            role: user.role,
            bio: profilePayload.bio,
            location: profilePayload.location,
            website: profilePayload.website,
          }),
        })
      }
    } catch (err) {
      console.warn('Backend DB profile update notice:', err)
    }

    // 2. Also sync to Supabase user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.name || user.name,
          name: updates.name || user.name,
          avatar_url: updates.avatar_url || user.avatar_url,
          bio: updates.bio,
          location: updates.location,
          website: updates.website,
        },
      })
    } catch (err) {
      console.warn('Supabase auth metadata update notice:', err)
    }
  }

  // Send password reset email via Supabase
  const sendPasswordResetEmail = async (email: string) => {
    try {
      setIsLoading(true)
      setLoadingReason('reset')
      setAuthError(null)
      const redirectUrl = `${window.location.origin}/#type=recovery`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      })
      if (error) {
        setAuthError(error.message)
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update password for user following recovery or from settings
  const updateUserPassword = async (password: string) => {
    try {
      setIsLoading(true)
      setLoadingReason('password')
      setAuthError(null)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setAuthError(error.message)
        throw error
      }
      setIsPasswordRecovery(false)
      if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        loadingReason,
        authError,
        emailNeedsVerification,
        verificationEmail,
        isPasswordRecovery,
        setIsPasswordRecovery,
        clearAuthError,
        clearVerificationNotice,
        resendVerificationEmail,
        sendPasswordResetEmail,
        updateUserPassword,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signInWithDemo,
        signOut,
        setUserRole,
        updateUserProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
