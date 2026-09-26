export type UserRole =
  | 'citizen'
  | 'reviewer'
  | 'limnologist'
  | 'inspector'
  | 'researcher'
  | 'steward'
  | 'officer'
  | 'volunteer'
  | (string & {})

export interface RoleOption {
  value: string
  label: string
  desc: string
  badgeColor: string
  isReviewerLevel: boolean
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'citizen',
    label: 'Citizen Scientist / Stream Scout',
    desc: 'Community river observer & watershed monitor',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    isReviewerLevel: false,
  },
  {
    value: 'reviewer',
    label: 'Certified Hydrologist / Water Engineer',
    desc: 'Professional water verification & hydrologic analysis',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    isReviewerLevel: true,
  },
  {
    value: 'limnologist',
    label: 'Limnologist / Freshwater Ecologist',
    desc: 'Aquatic ecosystem & inland water researcher',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    isReviewerLevel: true,
  },
  {
    value: 'inspector',
    label: 'Municipal Water Inspector / Authority',
    desc: 'Public utility enforcement & compliance monitoring',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    isReviewerLevel: true,
  },
  {
    value: 'researcher',
    label: 'Environmental Science Academic',
    desc: 'University / institute researcher & data modeler',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    isReviewerLevel: true,
  },
  {
    value: 'steward',
    label: 'Watershed Conservation Steward',
    desc: 'Regional river trust & riparian restoration leader',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    isReviewerLevel: false,
  },
  {
    value: 'officer',
    label: 'Environmental Officer / Health Agency',
    desc: 'Public health & safe drinking water protection',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    isReviewerLevel: true,
  },
  {
    value: 'volunteer',
    label: 'Community Volunteer / Student',
    desc: 'Youth, school & community environmental action',
    badgeColor: 'bg-lime-100 text-lime-800 border-lime-200',
    isReviewerLevel: false,
  },
]

export const getRoleDefinition = (role?: string): RoleOption => {
  if (!role) return ROLE_OPTIONS[0]
  const match = ROLE_OPTIONS.find((r) => r.value.toLowerCase() === role.toLowerCase())
  if (match) return match
  return {
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
    desc: 'Water community contributor',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    isReviewerLevel: false,
  }
}

/**
 * True when the role grants expert review permission (verify / flag records).
 * Must stay in sync with the backend REVIEWER_ROLES set in app/core/permissions.py.
 */
export const isReviewerRole = (role?: string): boolean =>
  getRoleDefinition(role).isReviewerLevel
