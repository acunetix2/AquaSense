import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Observation, ActiveView } from '../types/observation'
import { useAuth } from './AuthContext'
import { getRoleDefinition } from '../types/roles'
import {
  fetchObservations,
  createObservation,
  updateObservation as updateObservationApi,
  reviewObservation as reviewObservationApi,
  deleteObservation as deleteObservationApi,
} from '../services/api'

export interface ToastMessage {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

interface AppContextType {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  observations: Observation[]
  isLoading: boolean
  selectedObservation: Observation | null
  setSelectedObservation: (obs: Observation | null) => void
  openObservationDetail: (obs: Observation) => void
  filterDateRange: string
  setFilterDateRange: (val: string) => void
  filterLocation: string
  setFilterLocation: (val: string) => void
  filterSignal: string
  setFilterSignal: (val: string) => void
  addNewObservation: (payload: any) => Promise<Observation>
  editObservation: (
    id: number | string,
    updates: any,
    userId: string
  ) => Promise<Observation | null>
  reviewObservation: (
    id: number | string,
    action: 'verified' | 'flagged',
    notes: string
  ) => void
  deleteObservation: (id: number | string, userId?: string) => Promise<void>
  refreshObservations: () => Promise<void>
  toasts: ToastMessage[]
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const viewToPath: Record<ActiveView, string> = {
  landing: '/',
  auth: '/auth',
  home: '/feed',
  map: '/map',
  'my-observations': '/records',
  dashboard: '/data',
  'reviewer-queue': '/reviews',
  capture: '/capture',
  detail: '/detail',
  profile: '/profile',
  'api-docs': '/api-docs',
}

const pathToView = (pathname: string): ActiveView | null => {
  switch (pathname.toLowerCase()) {
    case '/':
      return 'landing'
    case '/auth':
      return 'auth'
    case '/feed':
    case '/home':
      return 'home'
    case '/map':
      return 'map'
    case '/records':
    case '/my-observations':
      return 'my-observations'
    case '/data':
    case '/dashboard':
      return 'dashboard'
    case '/reviews':
    case '/reviewer-queue':
      return 'reviewer-queue'
    case '/capture':
      return 'capture'
    case '/detail':
      return 'detail'
    case '/profile':
      return 'profile'
    case '/api-docs':
      return 'api-docs'
    default:
      return null
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const hasExistingSession = Boolean(
    localStorage.getItem('aquasense_demo_user') ||
    localStorage.getItem('sb-uqobyzjzmnvjjczclgoi-auth-token') ||
    document.cookie.includes('sb-')
  )
  const initialView = (() => {
    const mapped = pathToView(window.location.pathname)
    return mapped ?? (hasExistingSession ? 'home' : 'landing')
  })()
  const [activeView, setActiveViewState] = useState<ActiveView>(initialView)
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)

  // Filter states
  const [filterDateRange, setFilterDateRange] = useState<string>('30d')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [filterSignal, setFilterSignal] = useState<string>('all')

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const setActiveView = (view: ActiveView) => {
    const targetPath = viewToPath[view]
    const currentPath = window.location.pathname

    setActiveViewState(view)

    if (targetPath && currentPath !== targetPath) {
      window.history.pushState({}, '', targetPath)
    }
  }

  const showToast = (
    title: string,
    message: string,
    type: ToastMessage['type'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    setToasts((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      dismissToast(id)
    }, 4500)
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Load initial observations
  useEffect(() => {
    let isMounted = true
    async function load() {
      setIsLoading(true)
      const data = await fetchObservations()
      if (isMounted) {
        setObservations(data)
        setIsLoading(false)

        // Check if user navigated to a shared link
        const hash = window.location.hash
        const search = window.location.search
        const match = hash.match(/#observation[-/](\w+)/) || search.match(/[?&]obs=(\w+)/)
        if (match && match[1]) {
          const targetId = match[1]
          const found = data.find((o) => String(o.id) === targetId)
          if (found) {
            setSelectedObservation(found)
            setActiveView('detail')
          }
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  // Keep the URL in sync with the active app view and support direct browser navigation.
  useEffect(() => {
    const syncFromLocation = () => {
      const mapped = pathToView(window.location.pathname)
      if (mapped) {
        setActiveViewState(mapped)
      }
    }

    window.addEventListener('popstate', syncFromLocation)
    syncFromLocation()

    return () => window.removeEventListener('popstate', syncFromLocation)
  }, [])

  // Listen for hash changes while running
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      const search = window.location.search
      const match = hash.match(/#observation[-/](\w+)/) || search.match(/[?&]obs=(\w+)/)
      if (match && match[1]) {
        const targetId = match[1]
        const found = observations.find((o) => String(o.id) === targetId)
        if (found) {
          setSelectedObservation(found)
          setActiveView('detail')
        }
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [observations])

  const openObservationDetail = (obs: Observation) => {
    setSelectedObservation(obs)
    setActiveView('detail')
    try {
      window.location.hash = `#observation-${obs.id}`
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const refreshObservations = async () => {
    setIsLoading(true)
    const data = await fetchObservations()
    setObservations(data)
    setIsLoading(false)
  }

  const addNewObservation = async (payload: any): Promise<Observation> => {
    const created = await createObservation(payload)
    setObservations((prev) => [created, ...prev])
    setSelectedObservation(created)
    showToast('Observation Submitted', 'Your observation has been saved and added to the regional registry.')
    return created
  }

  const editObservation = async (
    id: number | string,
    updates: any,
    userId: string
  ): Promise<Observation | null> => {
    const updated = await updateObservationApi(id, updates, userId)
    if (updated) {
      setObservations((prev) => prev.map((o) => (o.id === id ? updated : o)))
      if (selectedObservation && selectedObservation.id === id) {
        setSelectedObservation(updated)
      }
      showToast('Observation Updated', 'Your changes have been saved successfully.')
      return updated
    } else {
      showToast('Update Failed', 'Could not save changes to this observation.', 'error')
      return null
    }
  }

  const reviewObservation = async (
    id: number | string,
    action: 'verified' | 'flagged',
    notes: string
  ) => {
    const reviewerName = user?.name
      ? `${user.name} (${getRoleDefinition(user.role).label})`
      : 'Community Reviewer'

    try {
      const updated = await reviewObservationApi(id, action, reviewerName, notes, user?.id)

      if (updated) {
        const refreshed = await fetchObservations()
        setObservations(refreshed)
        if (selectedObservation && String(selectedObservation.id) === String(id)) {
          const match = refreshed.find((o) => String(o.id) === String(id))
          if (match) setSelectedObservation(match)
        }
      }

      showToast(
        action === 'verified' ? 'Observation Verified' : 'Observation Flagged',
        action === 'verified'
          ? 'Verified and published into regional freshwater dataset.'
          : 'Flagged for environmental field inspection and follow-up.',
        action === 'verified' ? 'success' : 'warning'
      )
    } catch (err) {
      showToast(
        'Review Failed',
        err instanceof Error ? err.message : 'Could not update this observation in the database.',
        'error'
      )
    }
  }

  const deleteObservation = async (id: number | string, userId?: string) => {
    // Optimistically remove from local state
    setObservations((prev) => prev.filter((o) => o.id !== id))
    if (selectedObservation && selectedObservation.id === id) {
      setSelectedObservation(null)
      setActiveView('my-observations')
    }
    // Remove from local storage & API
    await deleteObservationApi(id, userId)
    showToast('Observation Deleted', 'The record has been removed from your account.', 'info')
  }

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        observations,
        isLoading,
        selectedObservation,
        setSelectedObservation,
        openObservationDetail,
        filterDateRange,
        setFilterDateRange,
        filterLocation,
        setFilterLocation,
        filterSignal,
        setFilterSignal,
        addNewObservation,
        editObservation,
        reviewObservation,
        deleteObservation,
        refreshObservations,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
