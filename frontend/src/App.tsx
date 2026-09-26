import React, { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/common/Navbar'
import { LandingNavbar } from './components/landing/LandingNavbar'
import { ToastContainer } from './components/common/Toast'
import { AppLoader } from './components/common/AppLoader'
import { OnboardingTour } from './components/common/OnboardingTour'
import { LandingPage } from './components/landing/LandingPage'
import { AuthPage } from './components/auth/AuthPage'
import { HeroSection } from './components/home/HeroSection'
import { CaptureWizard } from './components/capture/CaptureWizard'
import { MapView } from './components/map/MapView'
import { ReviewerQueue } from './components/reviewer/ReviewerQueue'
import { DashboardView } from './components/dashboard/DashboardView'
import { WatershedAnalyticsView } from './components/analytics/WatershedAnalyticsView'
import { ObservationDetail } from './components/details/ObservationDetail'
import { MyObservationsView } from './components/observations/MyObservationsView'
import { FeedView } from './components/feed/FeedView'
import { SettingsView } from './components/settings/SettingsView'
import { ApiDocsView } from './components/docs/ApiDocsView'
import { AppFooter } from './components/common/AppFooter'
import { isReviewerRole } from './types/roles'

const MainContent: React.FC = () => {
  const { activeView, setActiveView, showToast } = useApp()
  const { isAuthenticated, isLoading, user } = useAuth()
  const isReviewer = isReviewerRole(user?.role)

  // Auto transition to home when user signs in from landing or auth
  useEffect(() => {
    if (isAuthenticated && (activeView === 'auth' || activeView === 'signup' || activeView === 'landing')) {
      setActiveView('home')
    }
  }, [isAuthenticated])

  // Guard protected views if user is unauthenticated
  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      if (
        activeView === 'capture' ||
        activeView === 'reviewer-queue' ||
        activeView === 'my-observations' ||
        activeView === 'dashboard' ||
        activeView === 'analytics' ||
        activeView === 'profile'
      ) {
        showToast(
          'Sign In Required',
          'Please sign in to access your profile settings and water reports.',
          'info'
        )
        setActiveView('auth')
      }
      return
    }

    // Reviewer queue is reserved for reviewer-level roles
    if (activeView === 'reviewer-queue' && !isReviewer) {
      showToast(
        'Reviewers Only',
        'The review queue is available to certified reviewers. Your observation is still visible to reviewers automatically.',
        'info'
      )
      setActiveView('home')
    }
  }, [isLoading, isAuthenticated, isReviewer, activeView, setActiveView, showToast])

  const isLanding = activeView === 'landing'
  const isAuth = activeView === 'auth' || activeView === 'signup'

  // Branded full-screen loader while auth state resolves
  if (isLoading) {
    return <AppLoader />
  }

  // Full-bleed edge-to-edge layout — login and signup are separate pages
  if (isAuth) {
    return (
      <div className="min-h-screen w-full">
        <AuthPage
          key={activeView}
          initialMode={activeView === 'signup' ? 'signup' : 'signin'}
        />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FC] dark:bg-[#0a0d13]">
      {/* Proper Navbar depending on public vs app state */}
      {isLanding ? <LandingNavbar /> : <Navbar />}

      {/* Main View Shell - Single clean container, no redundant sidebar tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'landing' && <LandingPage />}
        {activeView === 'home' && <HeroSection />}
        {activeView === 'feed' && <FeedView />}
        {activeView === 'capture' && <CaptureWizard />}
        {activeView === 'map' && <MapView />}
        {activeView === 'reviewer-queue' && <ReviewerQueue />}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'analytics' && <WatershedAnalyticsView />}
        {activeView === 'my-observations' && <MyObservationsView />}
        {activeView === 'profile' && <SettingsView />}
        {activeView === 'api-docs' && <ApiDocsView />}
        {activeView === 'detail' && <ObservationDetail />}
      </main>

      {/* Inside App Footer */}
      {!isLanding && <AppFooter />}

      {/* Global Toast Notification Container */}
      <ToastContainer />

      {/* Onboarding Tour — shown once for new authenticated users */}
      {isAuthenticated && localStorage.getItem('aquasense_tour_done') !== 'true' && <OnboardingTour />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  )
}
