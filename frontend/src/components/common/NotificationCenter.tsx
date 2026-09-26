import React, { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ShieldCheck,
  MessageSquare,
  Heart,
  UserPlus,
  Sparkles,
  CheckCheck,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../../services/api'

const typeMeta: Record<
  string,
  { icon: React.FC<{ size?: number; className?: string }>; chip: string }
> = {
  review: { icon: ShieldCheck, chip: 'bg-emerald-50 text-emerald-600' },
  comment: { icon: MessageSquare, chip: 'bg-sky-50 text-sky-600' },
  like: { icon: Heart, chip: 'bg-rose-50 text-rose-600' },
  follow: { icon: UserPlus, chip: 'bg-violet-50 text-violet-600' },
  system: { icon: Sparkles, chip: 'bg-slate-100 text-slate-600' },
}

const timeAgo = (iso: string): string => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Notification engine UI: bell + unread badge + dropdown.
 * Polls the notifications API every 45s while visible; refreshes on open.
 */
export const NotificationCenter: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { observations, openObservationDetail, setActiveView, showToast } = useApp()
  const { user } = useAuth()

  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const applyResult = (result: { items: AppNotification[]; unread_count: number } | null) => {
    if (result) {
      setItems(result.items)
      setUnread(result.unread_count)
    }
  }

  // Used from event handlers (open / manual refresh).
  const load = async () => {
    if (!user?.id) return
    applyResult(await fetchNotifications(user.id))
  }

  // Initial load + 45s poll (skips when this instance is display:none —
  // both desktop and mobile copies may be mounted, only one is visible).
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const sync = async () => {
      const result = await fetchNotifications(user.id)
      if (!cancelled) applyResult(result)
    }
    void sync()
    const timer = window.setInterval(() => {
      if (rootRef.current && rootRef.current.offsetParent === null) return
      void sync()
    }, 45_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) void load()
  }

  const handleClick = async (item: AppNotification) => {
    if (!item.read && user?.id) {
      const updated = await markNotificationRead(item.id, user.id)
      if (updated) {
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
        setUnread((u) => Math.max(0, u - 1))
      }
    }
    setOpen(false)
    if (item.observation_id) {
      const obs = observations.find((o) => String(o.id) === String(item.observation_id))
      if (obs) {
        openObservationDetail(obs)
      } else {
        showToast('Observation Unavailable', 'This observation is no longer in your feed.', 'info')
      }
    } else if (item.type === 'follow') {
      setActiveView('profile')
    }
  }

  const handleMarkAll = async () => {
    if (!user?.id) return
    const ok = await markAllNotificationsRead(user.id)
    if (ok) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
      showToast('All Caught Up', 'Every notification has been marked as read.', 'success')
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        data-tour="notifications"
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-extrabold text-slate-900">
                Notifications
                {unread > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold align-middle">
                    {unread} new
                  </span>
                )}
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F4C81] hover:underline cursor-pointer"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Bell size={26} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600 mt-2">No notifications yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Review decisions, comments, likes, and new followers will show up here.
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const meta = typeMeta[item.type] ?? typeMeta.system
                  const Icon = meta.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleClick(item)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${
                        item.read ? 'bg-white' : 'bg-sky-50/50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.chip}`}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate flex-1">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                            {timeAgo(item.created_at)}
                          </span>
                        </span>
                        {item.body && (
                          <span className="block text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {item.body}
                          </span>
                        )}
                      </span>
                      {!item.read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0284c7] shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter
