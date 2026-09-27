import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Droplets,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'

// ── Freshwater Showcase: curated local waterway images for the auth side panel ──
const SHOWCASE_RIVERS = [
  {
    image: '/images/river_nairobi.jpg',
    title: 'Nairobi River',
    location: 'Nairobi, Kenya',
    tag: 'Urban River Stewardship',
    signal: 'normal' as const,
    conditionType: 'clean',
    metric: 'Photo-led observation • Local context',
    status: 'Community Focus',
    highlight: 'Document visible change in a familiar urban waterway, then add the place and observation details that a reviewer needs.',
  },
  {
    image: '/images/lake_victoria.jpg',
    title: 'Lake Victoria Basin',
    location: 'Kenya / Uganda / Tanzania',
    tag: 'Shared Freshwater Basin',
    signal: 'normal' as const,
    conditionType: 'clean',
    metric: 'Repeat visits • Shared evidence',
    status: 'Basin Context',
    highlight: 'Repeat observations help communities and researchers compare visible shoreline, flow, and clarity changes across a shared basin.',
  },
  {
    image: '/images/river_mara.jpg',
    title: 'Mara River',
    location: 'Kenya / Tanzania',
    tag: 'River Corridor Watch',
    signal: 'watch' as const,
    conditionType: 'dirty',
    metric: 'Follow-up observation • Reviewer check',
    status: 'Observation Watch',
    highlight: 'When a place looks different after rain or seasonal change, add a follow-up observation so the evidence can be compared responsibly.',
  },
  {
    image: '/images/lake_tanganyika.jpg',
    title: 'Lake Tanganyika',
    location: 'Tanzania / DR Congo / Burundi',
    tag: 'Lakeside Evidence Collection',
    signal: 'normal' as const,
    conditionType: 'clean',
    metric: 'Shoreline photo • Field notes',
    status: 'Evidence Ready',
    highlight: 'A photo and plain-language field notes give reviewers enough context to assess what is visibly documented without overclaiming.',
  },
]

// ── Available Contributor Roles for the Custom Dropdown ──
const ROLE_OPTIONS = [
  { value: 'citizen', label: 'Citizen Scientist / Stream Scout', desc: 'Community river observer' },
  { value: 'reviewer', label: 'Certified Hydrologist / Water Engineer', desc: 'Professional water verification' },
  { value: 'limnologist', label: 'Limnologist / Freshwater Ecologist', desc: 'Aquatic ecosystem researcher' },
  { value: 'inspector', label: 'Municipal Water Inspector / Authority', desc: 'Public utility enforcement' },
  { value: 'researcher', label: 'Environmental Science Academic', desc: 'University / institute researcher' },
  { value: 'steward', label: 'Watershed Conservation Steward', desc: 'Regional river trust' },
  { value: 'officer', label: 'Environmental Officer / Health Agency', desc: 'Public health monitoring' },
  { value: 'volunteer', label: 'Community Volunteer / Student', desc: 'Youth & community action' },
]

interface AuthPageProps {
  initialMode?: 'signin' | 'signup'
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset-password'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<string>('citizen')
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeSlide, setActiveSlide] = useState(0)

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    authError,
    clearAuthError,
    emailNeedsVerification,
    verificationEmail,
    resendVerificationEmail,
    clearVerificationNotice,
    sendPasswordResetEmail,
    updateUserPassword,
    isPasswordRecovery,
  } = useAuth()
  const { setActiveView, showToast } = useApp()

  // Login and signup are separate pages — navigating between them changes
  // the route (the view key remounts this component with a fresh mode).
  const showSignIn = () => {
    setMode('signin')
    setErrors({})
    clearAuthError()
    if (initialMode === 'signup') setActiveView('auth')
  }

  // Auto-switch to reset-password if user arrived with password recovery link
  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('reset-password')
    }
  }, [isPasswordRecovery])

  // Auto-scroll showcase river images every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SHOWCASE_RIVERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (mode === 'signup' && !fullName.trim()) {
      errs.name = 'Full name is required'
    }

    if (!email.trim()) {
      errs.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address'
    }

    if (!password) {
      errs.password = 'Password is required'
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAuthError()
    if (!validate()) return

    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password)
        showToast('Welcome back!', 'Successfully signed in to AquaSense.', 'success')
        setActiveView('home')
      } else {
        const canonicalRole = role === 'reviewer' || role === 'limnologist' || role === 'inspector' ? 'reviewer' : 'citizen'
        await signUpWithEmail(email.trim(), password, fullName.trim(), canonicalRole)
        // If emailNeedsVerification was set, AuthContext handled it — don't navigate
        if (!emailNeedsVerification) {
          showToast('Account Created', `Welcome to AquaSense, ${fullName}!`, 'success')
          setActiveView('home')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      const msg = error.message || 'Authentication failed. Please check your credentials.'
      // Detect identity conflict (account already exists with different provider)
      const isConflict =
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('user_already_exists') ||
        msg.toLowerCase().includes('email already')
      if (isConflict) {
        setErrors({ form: 'An account with this email already exists. Try signing in with Google instead.' })
      } else {
        setErrors({ form: msg })
      }
      showToast('Authentication Error', msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAuthError()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setForgotLoading(true)
    try {
      await sendPasswordResetEmail(email.trim())
      setForgotSent(true)
      showToast('Reset Link Sent', `Password recovery email sent to ${email.trim()}`, 'success')
    } catch (err: any) {
      console.error('Password reset error:', err)
      const msg = err.message || 'Could not send reset link. Please verify your email.'
      setErrors({ form: msg })
      showToast('Reset Failed', msg, 'error')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAuthError()
    const errs: Record<string, string> = {}
    if (!newPassword || newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters'
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setResetLoading(true)
    try {
      await updateUserPassword(newPassword)
      showToast('Password Updated', 'Your password has been reset successfully. Welcome back!', 'success')
      setMode('signin')
      setActiveView('home')
    } catch (err: any) {
      console.error('Update password error:', err)
      setErrors({ form: err.message || 'Failed to update password.' })
      showToast('Error', err.message || 'Failed to update password.', 'error')
    } finally {
      setResetLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    clearAuthError()
    setOauthLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error('Google Sign In error:', err)
      showToast('Google Sign In', err.message || 'Google sign in failed.', 'warning')
    } finally {
      setOauthLoading(false)
    }
  }

  const currentRiver = SHOWCASE_RIVERS[activeSlide]
  const currentRoleObj = ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[0]

  // ── Email Verification Screen ──
  if (emailNeedsVerification) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 sm:p-12 max-w-md w-full text-center space-y-6">
          {/* Animated mail icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0284C7] to-[#1FB8A6] flex items-center justify-center shadow-xl shadow-sky-900/15">
              <Mail size={36} className="text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Check Your Email
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              We sent a confirmation link to{' '}
              <span className="font-bold text-[#0284C7]">{verificationEmail}</span>.
              Click the link in the email to activate your account.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-left space-y-2">
            <p className="text-xs font-bold text-slate-700">What to do next:</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Open your inbox for <span className="font-semibold">{verificationEmail}</span></li>
              <li>Click the AquaSense confirmation link</li>
              <li>Return here and sign in</li>
            </ol>
          </div>

          {resendSent ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-semibold">
              <ShieldCheck size={18} />
              <span>Resent! Check your inbox again.</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={resendLoading}
              onClick={async () => {
                setResendLoading(true)
                try {
                  await resendVerificationEmail()
                  setResendSent(true)
                  showToast('Email Resent', 'Confirmation link sent again. Check your inbox.', 'success')
                } catch {
                  showToast('Resend Failed', 'Could not resend email. Please try again later.', 'error')
                } finally {
                  setResendLoading(false)
                }
              }}
              className="w-full py-3 rounded-xl text-sm font-bold text-[#0284C7] border border-[#0284C7]/30 hover:bg-sky-50 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {resendLoading ? (
                <><div className="w-4 h-4 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin" /><span>Sending…</span></>
              ) : (
                'Resend Confirmation Email'
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              clearVerificationNotice()
              showSignIn()
            }}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md transition-colors cursor-pointer"
          >
            Back to Sign In
          </button>

          <p className="text-[11px] text-slate-400">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-900 selection:bg-[#0284C7] selection:text-white">
      
      {/* ══════════════ LEFT SIDE: FULL-PAGE FORM PANEL ══════════════ */}
      <div className="w-full lg:w-[48%] xl:w-[44%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10 bg-white border-r border-slate-200/80 shadow-[10px_0_30px_rgba(15,23,42,0.03)] text-left">
        
        {/* Top: Brand Logo & Back to Home */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveView('landing')}
            className="inline-flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#1FB8A6] flex items-center justify-center text-white shadow-md shadow-sky-900/15 group-hover:scale-105 transition-transform duration-200">
              <Droplets size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#0284C7] block leading-none">
                AquaSense
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                Freshwater Intelligence
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('landing')}
            className="text-xs font-semibold text-slate-500 hover:text-[#0284C7] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Center: Auth Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          
          {/* Header titles */}
          <div className="mb-8">
            <div className="inline-flex px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0284C7]/10 to-emerald-600/10 text-[#0284C7] text-xs font-semibold mb-4 border border-[#0284C7]/20">
              <span>
                {mode === 'forgot'
                  ? 'Account Recovery'
                  : mode === 'reset-password'
                  ? 'Security Update'
                  : 'Freshwater Watershed Network'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {mode === 'signin'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Create an Account'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Set New Password'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2.5 font-normal leading-relaxed">
              {mode === 'signin'
                ? 'Sign in to access real-time river health data, basin maps, and monitoring reports.'
                : mode === 'signup'
                ? 'Join community observers and certified hydrologists monitoring our rivers and streams.'
                : mode === 'forgot'
                ? 'Enter your registered email address and we will send you a password recovery link.'
                : 'Enter and confirm your new AquaSense password below.'}
            </p>
          </div>

          {/* Error Banner */}
          {(errors.form || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={14} className="text-red-600" />
              </div>
              <span className="font-medium">{errors.form || authError}</span>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot' ? (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span>Password Reset Link Sent</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    We sent password recovery instructions to <strong className="font-semibold">{email}</strong>. Please check your inbox and follow the link to set a new password.
                  </p>
                  <p className="text-[11px] text-emerald-700/80">
                    Did not receive it? Check your spam folder or wait 60 seconds before trying again.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotSent(false)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors cursor-pointer"
                    >
                      Resend Link or Try Another Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showSignIn()
                        setForgotSent(false)
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft size={13} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="Enter your registered email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all bg-slate-50/80 text-slate-900 placeholder-slate-400 border-slate-300 focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 ${
                          errors.email ? 'border-red-500 focus:ring-red-500/20' : ''
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle size={11} /> {errors.email}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all shadow-md shadow-sky-900/10 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {forgotLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending recovery link…</span>
                      </div>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={showSignIn}
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              )}
            </div>
          ) : mode === 'reset-password' ? (
            /* RESET PASSWORD MODE (Password recovery) */
            <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }))
                    }}
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all bg-slate-50/80 text-slate-900 placeholder-slate-400 border-slate-300 focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 ${
                      errors.newPassword ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={11} /> {errors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all bg-slate-50/80 text-slate-900 placeholder-slate-400 border-slate-300 focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 ${
                      errors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={11} /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all shadow-md shadow-sky-900/10 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {resetLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating password…</span>
                  </div>
                ) : (
                  <>
                    <span>Set New Password & Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={showSignIn}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Cancel & Back to Sign In</span>
              </button>
            </form>
          ) : (
            /* SIGN IN / SIGN UP MODES */
            <>
              {/* Google OAuth Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={oauthLoading}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{oauthLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span className="px-3 bg-white">or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name Field (Sign Up only) */}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value)
                          if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                        }}
                        className={`w-full pl-11 pr-4 py-3 rounded-lg border text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 placeholder-slate-400 border-slate-200 hover:border-slate-300 focus:bg-sky-50/30 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 ${
                          errors.name ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : ''
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                        <AlertCircle size={11} /> {errors.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Dropdown Role Selector (Sign Up only) */}
                {mode === 'signup' && (
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-slate-700 block">
                      Watershed Contributor Role
                    </label>
                    <button
                      type="button"
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="w-full py-3 px-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left flex items-center justify-between transition-all cursor-pointer text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
                    >
                      <div className="truncate min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">{currentRoleObj.label}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{currentRoleObj.desc}</span>
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {roleDropdownOpen && (
                      <div
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-56 overflow-y-auto"
                        onMouseLeave={() => setRoleDropdownOpen(false)}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setRole(opt.value)
                              setRoleDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-100 last:border-b-0 ${
                              role === opt.value ? 'bg-blue-50 font-bold text-[#0284C7]' : 'text-slate-700'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold">{opt.label}</p>
                              <p className="text-[10px] text-slate-500">{opt.desc}</p>
                            </div>
                            {role === opt.value && <ShieldCheck size={14} className="text-[#0284C7] flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-lg border text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 placeholder-slate-400 border-slate-200 hover:border-slate-300 focus:bg-sky-50/30 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 ${
                        errors.email ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : ''
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                      <AlertCircle size={11} /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password (min 6 characters)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                      }}
                      className={`w-full pl-11 pr-11 py-3 rounded-lg border text-xs sm:text-sm outline-none transition-all bg-white text-slate-900 placeholder-slate-400 border-slate-200 hover:border-slate-300 focus:bg-sky-50/30 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 ${
                        errors.password ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                      <AlertCircle size={11} /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7] cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Remember me</span>
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setForgotSent(false)
                        setErrors({})
                        clearAuthError()
                      }}
                      className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 h-12 rounded-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#024B8C] transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:ring-2 focus:ring-[#0284C7]/40 focus:ring-offset-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
                    </div>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In to AquaSense' : 'Create AquaSense Account'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Privacy hint */}
          <p className="mt-6 text-center text-[11px] text-slate-500">
            By continuing you agree to our{' '}
            <span className="underline cursor-pointer hover:text-slate-700 font-medium">Terms</span> and{' '}
            <span className="underline cursor-pointer hover:text-slate-700 font-medium">Privacy Policy</span>.
          </p>

          {/* Cross-page links — login and signup are separate pages */}
          {mode === 'signin' && (
            <p className="mt-6 text-center text-sm text-slate-600">
              New to AquaSense?{' '}
              <button
                type="button"
                onClick={() => setActiveView('signup')}
                className="font-bold text-[#0284C7] hover:text-[#0369A1] transition-colors cursor-pointer"
              >
                Create an account
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveView('auth')}
                className="font-bold text-[#0284C7] hover:text-[#0369A1] transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Bottom Legal / Copyright */}
        <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200">
          <span>© {new Date().getFullYear()} AquaSense Freshwater Intelligence</span>
          <div className="flex gap-3">
            <span className="hover:text-slate-600 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms</span>
            <span className="hover:text-slate-600 cursor-pointer">Watershed Ethics</span>
          </div>
        </div>

      </div>

      {/* ══════════════ RIGHT SIDE: FULL-PAGE SCROLLING SHOWCASE ══════════════ */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] min-h-screen relative overflow-hidden bg-slate-950 text-left">
        
        {/* Dynamic Full-Bleed Slideshow Images */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: `url('${currentRiver.image}')`,
            }}
          />
        </AnimatePresence>

        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/75 pointer-events-none" />

        {/* Content Container spanning the entire height */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-10 xl:p-14">
          
          {/* Top Bar: Tagline & Carousel Arrows */}
          <div className="flex items-center justify-between">
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-xl">
              <Droplets size={15} className="text-teal-300" />
              <span className="tracking-wide text-sky-100">
                {currentRiver.tag}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-xl">
              <button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev - 1 + SHOWCASE_RIVERS.length) % SHOWCASE_RIVERS.length)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                title="Previous River"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev + 1) % SHOWCASE_RIVERS.length)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                title="Next River"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Center Quote / Heading */}
          <div className="max-w-xl my-auto">
            <span className="inline-flex px-3.5 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-semibold mb-4 border border-teal-300/30 backdrop-blur-xs">
              Freshwater Watershed Intelligence Network
            </span>
            <h2 className="text-3xl xl:text-5xl font-extrabold text-white leading-tight drop-shadow-2xl">
              Protecting rivers, streams and lakes through community observations.
            </h2>
            <p className="text-slate-200 text-sm xl:text-base mt-4 leading-relaxed font-normal drop-shadow">
              Connecting field photos with automated computer vision checks, calibrated water quality signals, and community records — so meaningful changes are surfaced early and routed to expert review.
            </p>
          </div>

          {/* Bottom Showcase Card with Active River Details & Indicators */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35 }}
                className="p-5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/20 text-white flex items-center justify-between shadow-2xl"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                    <MapPin size={14} className="text-teal-400 shrink-0" />
                    <span>{currentRiver.location}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {currentRiver.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                    <span className={`font-semibold ${currentRiver.conditionType === 'dirty' ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {currentRiver.metric}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{currentRiver.highlight}</span>
                  </p>
                </div>

                <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 ml-4 border ${
                  currentRiver.conditionType === 'dirty'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-teal-400/20 border-teal-400/40 text-teal-300'
                }`}>
                  <ShieldCheck size={14} />
                  <span>{currentRiver.status}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide Indicators */}
            <div className="flex items-center justify-center gap-2">
              {SHOWCASE_RIVERS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === index ? 'w-10 bg-teal-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default AuthPage
