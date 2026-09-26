import React, { useState, useRef } from 'react'
import {
  User,
  Mail,
  MapPin,
  Globe,
  Camera,
  Save,
  CheckCircle,
  Edit3,
  Shield,
  Droplets,
  LogOut,
  ArrowLeft,
  ChevronDown,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { ROLE_OPTIONS, getRoleDefinition } from '../../types/roles'
import { SignOutModal } from '../common/SignOutModal'
import { OnboardingTour } from '../common/OnboardingTour'

interface ProfileSettingsPageProps {
  /** Render without the page header (Back / Sign Out / title) — used inside SettingsView. */
  embedded?: boolean
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ embedded = false }) => {
  const { user, updateUserProfile, signOut, setUserRole } = useAuth()
  const { setActiveView, observations, showToast, refreshObservations } = useApp()

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    avatar_url: user?.avatar_url || '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar_url || '')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url')
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync form whenever user profile is hydrated from the database
  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        avatar_url: user.avatar_url || '',
      })
      setAvatarPreview(user.avatar_url || '')
    }
  }, [user?.id, user?.name, user?.bio, user?.location, user?.website, user?.avatar_url])

  const myObsCount = observations.filter(
    (o) => o.user_id === user?.id || o.observer_name === user?.name
  ).length

  const verifiedCount = observations.filter(
    (o) => (o.user_id === user?.id || o.observer_name === user?.name) && o.status === 'verified'
  ).length

  const currentRoleDef = getRoleDefinition(user?.role)

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setAvatarPreview(url)
      setForm((prev) => ({ ...prev, avatar_url: url }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Name Required', 'Please enter your display name.', 'warning')
      return
    }
    setIsSaving(true)
    try {
      await updateUserProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        avatar_url: form.avatar_url || avatarPreview,
      })
      setSaved(true)
      showToast('Profile Saved', 'Your changes have been saved to the database.', 'success')
      setTimeout(() => setSaved(false), 3000)
      // Re-pull observations so the updated name/avatar appear on past records
      refreshObservations().catch(() => {})
    } catch {
      showToast('Save Error', 'Failed to save changes. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmSignOut = async () => {
    await signOut()
    setActiveView('landing')
  }

  if (!user) return null

  return (
    <>
      {showSignOutModal && (
        <SignOutModal
          userName={user.name}
          onConfirm={handleConfirmSignOut}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}

      {/* Onboarding Tour — restartable from Profile Settings */}
      {showTour && (
        <OnboardingTour
          forceOpen
          onClose={() => setShowTour(false)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8 py-4">
        {/* Header — hidden when embedded in SettingsView */}
        {!embedded && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('home')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
            <button
              onClick={() => setShowSignOutModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}

        {!embedded && (
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your public identity on AquaSense</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Avatar + Stats + Role */}
          <div className="lg:col-span-4 space-y-5">
            {/* Avatar Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img
                    src={avatarPreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Camera size={22} className="text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                </div>

                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg">{form.name || user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentRoleDef.badgeColor}`}>
                    <Shield size={10} />
                    {currentRoleDef.label.split('/')[0].trim()}
                  </span>
                </div>

                {/* Avatar URL/Upload toggle */}
                <div className="w-full space-y-2">
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setAvatarMode('url')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${avatarMode === 'url' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      URL
                    </button>
                    <button
                      onClick={() => setAvatarMode('upload')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${avatarMode === 'upload' ? 'bg-[#0284C7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Upload
                    </button>
                  </div>
                  {avatarMode === 'url' ? (
                    <input
                      type="url"
                      placeholder="Paste image URL…"
                      value={form.avatar_url}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, avatar_url: e.target.value }))
                        setAvatarPreview(e.target.value)
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 text-xs rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      Click to upload photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Impact</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Observations', value: myObsCount, icon: Droplets, color: 'text-sky-600 bg-sky-50' },
                  { label: 'Verified', value: verifiedCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`rounded-2xl p-3 ${color.split(' ')[1]} border border-slate-100 text-center`}>
                    <Icon size={18} className={`mx-auto mb-1 ${color.split(' ')[0]}`} />
                    <p className="text-xl font-extrabold text-slate-900">{value}</p>
                    <p className="text-[11px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Full Role Dropdown */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Contributor Role</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl hover:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Briefcase size={13} className="text-[#0284C7] shrink-0" />
                      <span className="truncate font-medium text-slate-800">
                        {currentRoleDef.label.split('/')[0].trim()}
                      </span>
                    </span>
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                      {ROLE_OPTIONS.map((opt) => {
                        const isSelected = user.role === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setUserRole(opt.value)
                              setRoleDropdownOpen(false)
                              showToast('Role Updated', `Your role is now: ${opt.label.split('/')[0].trim()}`, 'success')
                            }}
                            className={`w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                              isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${isSelected ? 'text-[#0284C7]' : 'text-slate-800'}`}>
                                {opt.label}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.desc}</p>
                            </div>
                            {isSelected && <Shield size={13} className="text-[#0284C7] shrink-0 mt-0.5" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">{currentRoleDef.desc}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Edit Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit3 size={18} className="text-[#0284C7]" />
              Edit Profile Information
            </h2>

            <div className="space-y-5">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Email is managed by your sign-in provider</p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Nairobi, Kenya"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website / Social Link</label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Short Bio
                  <span className="text-slate-400 font-normal ml-1">(shown on your observations)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  rows={4}
                  maxLength={280}
                  placeholder="Tell the community about yourself and your environmental interests…"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7] resize-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-right">{form.bio.length}/280</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
                  saved
                    ? 'bg-emerald-600 text-white'
                    : isSaving
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-[#0284C7] hover:bg-[#0369A1] text-white hover:shadow-md'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving to Database…
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle size={16} />
                    Saved to Database!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>

              {/* Restart Onboarding Tour */}
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('aquasense_tour_done')
                  setShowTour(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                📅 Restart App Tour
              </button>

              <p className="text-xs text-slate-400">
                Changes are applied immediately and shown on your observations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



