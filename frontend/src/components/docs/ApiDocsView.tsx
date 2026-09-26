import React from 'react'
import { ArrowLeft, ExternalLink, BookOpen, KeyRound, Activity } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin
  } catch {
    return 'http://localhost:8000'
  }
})()

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface Endpoint {
  method: Method
  path: string
  desc: string
  headers?: string[]
  example?: string
}

interface EndpointGroup {
  title: string
  icon: React.ReactNode
  intro: string
  endpoints: Endpoint[]
}

const METHOD_STYLES: Record<Method, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-sky-100 text-sky-700 border-sky-200',
  PATCH: 'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-rose-100 text-rose-700 border-rose-200',
}

const GROUPS: EndpointGroup[] = [
  {
    title: 'Health',
    icon: <Activity size={15} className="text-emerald-500" />,
    intro: 'Service liveness checks.',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        desc: 'API health and service name.',
        example: 'GET ' + API_BASE + '/health\n→ { "status": "ok", "service": "aquasense-api" }',
      },
    ],
  },
  {
    title: 'Observations',
    icon: <BookOpen size={15} className="text-sky-500" />,
    intro: 'Create, query, analyse, and review citizen water observations.',
    endpoints: [
      {
        method: 'GET',
        path: '/observations',
        desc: 'List observations (observer emails redacted).',
        example:
          'GET ' +
          API_BASE +
          '/observations?signal=investigate&user_id=<id>&limit=50&offset=0\n\n' +
          'Query params: signal (normal|watch|investigate), status (pending|verified|flagged),\n' +
          'user_id, limit (1-500, default 200), offset',
      },
      {
        method: 'POST',
        path: '/observations',
        desc: 'Submit an observation. Vision analysis runs when image_data / image_data_list is included, or the Step-4 ai_result is reused.',
        example: `POST ${API_BASE}/observations
Content-Type: application/json

{
  "site_name": "Juja Channel",
  "latitude": -1.0946,
  "longitude": 37.0145,
  "water_appearance": "clear",
  "odour": "none",
  "waste_visible": false,
  "flow_rate": "normal",
  "notes": "",
  "user_id": "<observer-id>",
  "signal": "watch",
  "confidence": 0.91,
  "ai_summary": "...",
  "assessment_answers": { "waterClarity": "clear", "flowRate": "normal" }
}

→ 201 Created (Observation with consistency_flags + ai_trail)`,
      },
      {
        method: 'GET',
        path: '/observations/{id}',
        desc: 'Fetch one observation by UUID.',
      },
      {
        method: 'PATCH',
        path: '/observations/{id}',
        desc: 'Owner-only update (notes, site name, appearance…).',
        headers: ['X-User-Id: <owner-id>'],
      },
      {
        method: 'PATCH',
        path: '/observations/{id}/review',
        desc: 'Reviewer decision. Requires a reviewer-level profile (reviewer, limnologist, inspector, researcher, officer). 401/403 otherwise.',
        headers: ['X-User-Id: <reviewer-id>'],
        example: `PATCH ${API_BASE}/observations/<id>/review
X-User-Id: <reviewer-id>
Content-Type: application/json

{ "action": "verified", "reviewer_name": "Dr. A. Njeri", "notes": "Evidence consistent." }`,
      },
      {
        method: 'DELETE',
        path: '/observations/{id}',
        desc: 'Delete an observation. Allowed for the owner or a reviewer-level profile.',
        headers: ['X-User-Id: <owner-or-reviewer-id>'],
      },
      {
        method: 'POST',
        path: '/observations/analyze-image',
        desc: 'Analyse one photo with the Groq vision model. Response-only — nothing is persisted.',
        example: `POST ${API_BASE}/observations/analyze-image
Content-Type: application/json

{
  "image_data": "<base64>",
  "image_mime": "image/jpeg",
  "site_name": "Juja Channel",
  "water_appearance": "clear",
  "odour": "none",
  "waste_visible": false,
  "flow_rate": "normal",
  "assessment_answers": { "waterClarity": "clear" }
}

→ { signal, confidence, title, summary, consistency_flags[], analysis_meta{} }`,
      },
      {
        method: 'POST',
        path: '/observations/analyze-images',
        desc: 'Analyse up to 3 photos in one call (image_data_list). Response-only.',
      },
      {
        method: 'GET',
        path: '/observations/proxy-image',
        desc: 'CORS-safe proxy for external image URLs. Query: url=<encoded-url>.',
      },
      {
        method: 'GET',
        path: '/observations/analytics',
        desc: 'Live aggregate metrics (counts by signal, verification rates) for the dashboard.',
      },
    ],
  },
  {
    title: 'Profiles',
    icon: <KeyRound size={15} className="text-indigo-500" />,
    intro: 'Public identities, roles, and social actions.',
    endpoints: [
      {
        method: 'POST',
        path: '/profiles/upsert',
        desc: 'Create or update your profile (also used on first sign-in).',
        example: `POST ${API_BASE}/profiles/upsert
Content-Type: application/json

{ "user_id": "<id>", "email": "you@example.org", "full_name": "Iddy C.", "role": "citizen" }`,
      },
      {
        method: 'GET',
        path: '/profiles/me',
        desc: 'Your own profile, including email.',
        headers: ['X-User-Id: <id>'],
      },
      {
        method: 'PATCH',
        path: '/profiles/me',
        desc: 'Update your own profile fields.',
        headers: ['X-User-Id: <id>'],
      },
      {
        method: 'GET',
        path: '/profiles/{user_id}',
        desc: 'Any user’s public profile (email never included).',
      },
      {
        method: 'POST',
        path: '/profiles/{user_id}/follow',
        desc: 'Follow a user.',
        headers: ['X-User-Id: <follower-id>'],
      },
      {
        method: 'DELETE',
        path: '/profiles/{user_id}/follow',
        desc: 'Unfollow a user.',
        headers: ['X-User-Id: <follower-id>'],
      },
      {
        method: 'POST',
        path: '/profiles/{user_id}/like',
        desc: 'Like a user’s profile.',
      },
    ],
  },
  {
    title: 'Auth',
    icon: <KeyRound size={15} className="text-amber-500" />,
    intro: 'Lightweight email/password identity for the demo app (Supabase Auth is used by the web client).',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/signup',
        desc: 'Register a new user. Returns user_id, email, full_name, role.',
        example: `POST ${API_BASE}/auth/signup
Content-Type: application/json

{ "email": "you@example.org", "password": "secret123", "full_name": "Iddy C.", "role": "citizen" }`,
      },
      {
        method: 'POST',
        path: '/auth/login',
        desc: 'Sign in with email and password.',
        example: `POST ${API_BASE}/auth/login
Content-Type: application/json

{ "email": "you@example.org", "password": "secret123" }`,
      },
    ],
  },
]

/** Public API reference page — hand-written docs + link to the live Swagger UI. */
export const ApiDocsView: React.FC = () => {
  const { setActiveView } = useApp()

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Home
        </button>
        <a
          href={`${API_ORIGIN}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F4C81] hover:bg-[#0c3c66] shadow-sm transition-all cursor-pointer"
        >
          <ExternalLink size={14} />
          Open live Swagger UI
        </a>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AquaSense API Documentation
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          REST API for citizen-science observations, AI vision analysis, human review, and
          public profiles. All responses are JSON. This page is the human-readable summary —
          the interactive Swagger UI has the full request/response schemas.
        </p>
      </div>

      {/* Base URL + Auth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base URL</h3>
          <code className="block text-xs font-mono bg-slate-900 text-emerald-400 rounded-xl px-3 py-2.5 break-all">
            {API_BASE}
          </code>
          <p className="text-[11px] text-slate-500">
            Configured via <code className="font-mono">VITE_API_URL</code>; defaults to
            localhost:8000 in development.
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authentication</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Read endpoints are open. Mutating endpoints require the{' '}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">X-User-Id</code> header
            identifying the caller — review actions additionally require a reviewer-level
            profile (403 otherwise). Emails are never returned in public responses.
          </p>
        </div>
      </div>

      {/* Endpoint groups */}
      {GROUPS.map((group) => (
        <div key={group.title} className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              {group.icon}
            </span>
            <div>
              <h2 className="font-bold text-slate-900 text-base">{group.title}</h2>
              <p className="text-xs text-slate-500">{group.intro}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {group.endpoints.map((ep) => (
              <div key={ep.method + ep.path} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-1 rounded-md border tracking-wide ${METHOD_STYLES[ep.method]}`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-slate-800 break-all">{ep.path}</code>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ep.desc}</p>

                {ep.headers && (
                  <div className="flex flex-wrap gap-1.5">
                    {ep.headers.map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {ep.example && (
                  <details className="group">
                    <summary className="text-[11px] font-semibold text-[#0F4C81] hover:underline cursor-pointer select-none">
                      Example
                    </summary>
                    <pre className="mt-2 text-[11px] font-mono bg-slate-900 text-slate-300 rounded-xl p-3.5 overflow-x-auto whitespace-pre-wrap break-words">
                      {ep.example}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[11px] text-slate-400 text-center pb-4">
        Automated assistance and API outputs are informational — final verification always
        comes from a certified reviewer.
      </p>
    </div>
  )
}

export default ApiDocsView
