# UI/UX Problem Map - Visual Guide

This document maps each problem to the specific components and files affected.

---

## 1. Design System Violations

### Problem: Colors Not Using Tokens

**Affected Files:**
- `src/components/common/Navbar.tsx` - Uses `#0284c7`, `#008f9b`, `#0369a1`, sky-50/100/200
- `src/components/common/BottomNav.tsx` - Mixed color variants
- `src/components/details/ObservationDetail.tsx` - Signal colors, button colors
- `src/components/capture/CaptureWizard.tsx` - Primary color hardcoded

**Current Usage Pattern:**
```jsx
bg-[#0284C7]           // Primary blue (navbar, buttons)
bg-[#008f9b]           // Secondary teal (logo)
bg-sky-50/100/200      // Sky variants (backgrounds)
text-[#0284c7]         // Text colors
hover:bg-[#0369a1]     // Hover state (derived)
```

**Should Be:**
```jsx
bg-primary             // From design tokens
text-primary           // Text color
hover:bg-primary-dark  // Hover state
bg-surface-secondary   // Background
```

**Impact:** Every color reference must be changed. Estimated 200+ occurrences.

---

### Problem: Spacing Mix (8px vs arbitrary)

**Affected Pattern:**
- Correct: `p-4 p-6 p-8 gap-4 gap-6` (multiples of 8px)
- Incorrect: `p-2.5 gap-2.5 gap-3.5 h-[76px] mt-[-0.5px]`

**Files with Issues:**
- `src/components/common/Navbar.tsx` - `gap-2 gap-3 lg:gap-3`
- `src/components/details/ObservationDetail.tsx` - `gap-2.5 gap-4 py-2.5 py-3.5`
- `src/components/reviewer/ReviewerQueue.tsx` - Various arbitrary spacing

**Fix Strategy:**
- Find all `gap-2.5`, `gap-3.5`, `p-2.5`, `py-2.5` etc.
- Replace with nearest 8px multiple
- Update Tailwind config to remove non-scale values

---

### Problem: Typography Not Semantic

**Current Usage:**
```jsx
font-black        // extra bold (h1 hero text)
font-extrabold    // very bold (headings)
font-bold         // bold (buttons, labels)
font-semibold     // medium bold (body text)
font-medium       // medium (secondary text)
font-normal       // regular (body)
```

**Should Map To:**
```jsx
// Semantic tokens instead of arbitrary weights
// Heading 1: 32px / 700
// Heading 2: 24px / 600
// Heading 3: 20px / 600
// Body: 16px / 400
// Small: 12-14px / 500
```

**Issues:**
- `font-black` used for both H1 and hero CTAs (should be different)
- `font-extrabold` used for headings but also hero text
- No distinction between display/heading/body font families

**Files Affected:** Nearly every component file

---

### Problem: Border Radius Inconsistency

**Current Usage:**
```jsx
rounded-xl    // 12px (rounded-[12px])
rounded-2xl   // 16px (rounded-[16px])
rounded-3xl   // 24px (rounded-[24px])
```

**Design System Says:**
```jsx
rounded-sm    // 8px
rounded-md    // 12px
rounded-lg    // 20px
rounded-full  // 999px
```

**Issues:**
- `rounded-3xl` (24px) used for cards, but design says 20px
- `rounded-2xl` (16px) doesn't exist in design tokens
- Image radius varies: `rounded-xl rounded-2xl rounded-3xl` on different images

**High-Impact Files:**
- `src/components/details/ObservationDetail.tsx` - Many cards use `rounded-3xl`
- `src/components/common/` - Modal backdrop radius

---

## 2. Navigation & View Protection Issues

### Problem: Two Navbar Components

**Files:**
- `src/components/common/Navbar.tsx` (200 lines) - Authenticated user nav
- `src/components/landing/LandingNavbar.tsx` (?) - Public/landing nav

**Issues:**
1. Duplicate logic (brand, theme toggle, etc.)
2. Different active state implementations
3. Hard to maintain consistent styling
4. Mobile nav hidden/shown with different logic

**Solution:**
Create unified `Navbar.tsx` component that:
- Accepts `isAuthenticated` and `userRole` props
- Conditionally renders nav items based on auth state
- Uses single active state styling pattern

---

### Problem: Complex View Guard Logic

**File:** `src/App.tsx` (MainContent component)

**Current Flow:**
```typescript
useEffect(() => {
  if (isLoading) return  // Wait for auth
  if (!isAuthenticated) {
    if (activeView === 'capture' || activeView === 'my-observations' ...) {
      showToast(...)
      setActiveView('auth')
    }
    return
  }
  if (activeView === 'reviewer-queue' && !isReviewer) {
    showToast(...)
    setActiveView('home')
  }
}, [isLoading, isAuthenticated, isReviewer, activeView, setActiveView, showToast])
```

**Problems:**
- Race condition: if activeView changes before useEffect runs, guard might not trigger
- isLoading, isAuthenticated, isReviewer all dependencies; multiple sources of truth
- Toast shown every time view changes (not just on first guard)
- No indication of why redirect happening

**Better Approach:**
1. Create `useViewGuard()` custom hook
2. Move logic to context (AppProvider)
3. Use single source of truth for protected views
4. Only toast on first guard, not every effect run

---

### Problem: Bottom Nav 76px Clearance

**File:** `src/App.tsx`

```jsx
{!isPublicSurface && <div className="h-[76px] md:hidden shrink-0" aria-hidden />}
```

**Issues:**
- Arbitrary pixel value suggests layout hack
- BottomNav assumed to be fixed at 76px height
- If BottomNav height changes, must update clearance

**Better Approach:**
- Use CSS custom property for BottomNav height
- Reference same variable for clearance
- Or use `pb-[var(--bottom-nav-height)]` on main content

---

## 3. Observation Detail View Issues

### Problem: Redundant Observer Sections

**Current Layout:**
```
Hero Section:
├─ Signal Badge
├─ Site Name + Created Date
├─ Confidence Bar
├─ Verification Status
└─ Analyst Attribution Card
    └─ Avatar | Name | Role | Date | Location

Observation Source Section:
├─ Observer avatar + engagement stats (followers, likes, comments, views)
└─ Photo uploaded + field coordinates
```

**Issue:** Observer info shown twice with different details/styling

**Solution:**
```
Single "Submitted By" Card:
├─ Avatar | Name | Role | Location
├─ Engagement Stats (inline or compact grid)
├─ Photo uploaded timestamp
└─ Field coordinates
```

**Files Affected:**
- `src/components/details/ObservationDetail.tsx` (find "Analyst Attribution" and "Observation Source")

---

### Problem: Social Section Overload

**Current Layout:**
```
Social Bar:
├─ Like button (with count)
├─ Comment button (with count)
├─ Share button
├─ Views count
└─ Follow button (observer only)

Observer Profile Stats Section:
├─ Followers (with icon)
├─ Profile Likes
├─ Comments
└─ Views
```

**Issue:** Too many engagement metrics in one area; confusing what each means

**Solution:**
```
Engagement Actions (sticky bar):
├─ Like [count]
├─ Comment [count]
├─ Share
└─ Follow (if not own observation)

Observer Stats Card (under profile info):
├─ Followers count
├─ Contributions count
├─ Community engagement
```

---

### Problem: Tab State Not Persisted

**File:** `src/components/details/ObservationDetail.tsx`

**Current:**
```jsx
const [activeTab, setActiveTab] = useState<'evidence' | 'location' | 'images' | ...>('evidence')
```

**Issue:** User navigates to another page and back → activeTab resets to 'evidence'

**Solution:**
```jsx
// Option A: URL query param
const [activeTab, setActiveTab] = useState(() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('tab') || 'evidence'
})

useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  params.set('tab', activeTab)
  window.history.replaceState({}, '', `?${params}`)
}, [activeTab])

// Option B: localStorage
useEffect(() => {
  localStorage.setItem(`obs-${obs.id}-tab`, activeTab)
}, [activeTab, obs.id])
```

---

### Problem: Multi-Image Selection Complex

**Current Logic:**
```jsx
const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0)

// In JSX:
{obs.image_urls && obs.image_urls.length > 1 && (
  <div className="flex items-center gap-2 pt-1">
    {obs.image_urls.map((imgUrl, idx) => (
      <button
        onClick={() => setActiveHeroImageIndex(idx)}
        className={activeHeroImageIndex === idx ? 'border-[#0284C7] ring-2 ring-sky-200' : ...}
      >
```

**Issues:**
- Multiple image indexing, not clear which is "primary"
- Thumbnail switcher visual only; no semantic meaning

**Solution:**
- Mark first image as primary (use differently)
- Show "Primary Photo" + "Corroborating Angles" labels
- Or reorder to primary first in array

---

### Problem: Edit Modal Huge Form

**File:** `src/components/details/ObservationDetail.tsx`

**Current Form Fields:**
1. Site Name
2. Water Appearance (select)
3. Water Odour (select)
4. Flow Rate (select)
5. Visible Waste (checkbox)
6. Location Address
7. Coordinates (lat/lng split)
8. Image URLs
9. Field Notes
10. Buttons (Cancel / Save)

**Issues:**
- On mobile, form doesn't fit in viewport
- User must scroll through entire form
- Coordinate inputs side-by-side on small screens

**Solution A: Mobile-Specific Form**
```jsx
if (isMobile) {
  return <SimplifiedEditForm fields={essentialFields} />  // Just notes + appearance
} else {
  return <FullEditForm fields={allFields} />  // All fields
}
```

**Solution B: Step-by-Step Edit**
```jsx
// Step 1: Basic info (name, notes)
// Step 2: Sensory data (appearance, odour, flow, waste)
// Step 3: Location (address, coordinates)
// Step 4: Images
```

**Solution C: Full-Screen Modal on Mobile**
```jsx
className={isMobile ? 'fixed inset-0 rounded-t-3xl' : 'max-w-xl'}
```

---

## 4. Capture Wizard Issues

### Problem: Back Button Limited

**Current:** Can only go back 1 step

**Files:**
- `src/components/capture/Step1Location.tsx`
- `src/components/capture/Step2Photo.tsx`
- `src/components/capture/Step3Assessment.tsx`
- `src/components/capture/Step4Review.tsx`

**Issue:**
- User on Step 4 can't go back to Step 1 to fix location
- Only forward progression possible

**Solution:**
- In CaptureWizard, clicking any completed step number jumps to that step
- Or add explicit "Back to Step 1" button on each step

---

### Problem: Image State Complex

**File:** `src/components/capture/CaptureWizard.tsx`

**Current State:**
```jsx
const [imageUrls, setImageUrls] = useState<string[]>([])        // Display
const [imageDataList, setImageDataList] = useState<string[]>([]) // AI
const [imageMime, setImageMime] = useState<string>('image/jpeg')  // Type
```

**On Save:**
```jsx
const persistedUrls = await Promise.all(
  imageUrls.map((url, idx) => uploadDataUriToStorage(url, `capture-${idx + 1}.jpg`))
)
```

**Issues:**
- Three separate state variables for one logical concept
- Data URI uploaded only on save (what if component unmounts?)
- Unclear which URL format is valid (data: vs blob: vs http://)

**Solution:**
Create unified image state:
```jsx
interface ImageUpload {
  id: string
  localUrl: string        // data: or blob:
  persistedUrl?: string   // http:// after upload
  status: 'local' | 'uploading' | 'uploaded'
}

const [images, setImages] = useState<ImageUpload[]>([])
```

---

## 5. Component Reusability Issues

### Problem: Button Duplication

**Pattern Count:** 20+ occurrences

**Primary Button:**
```jsx
px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1]
```

**Files Affected:**
- Nearly every component file

**Solution:** Create Button component:
```jsx
export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    destructive: 'bg-rose-600 hover:bg-rose-700 text-white',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button className={`rounded-xl font-semibold ${variants[variant]} ${sizes[size]}`} {...props} />
  )
}
```

---

### Problem: Card Pattern Repetition

**Pattern Count:** 15+ occurrences

**Pattern:**
```jsx
rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8
```

**Files Affected:**
- ObservationDetail tabs
- Dashboard cards
- Analytics cards

**Solution:** Create Card component:
```jsx
export const Card: React.FC<CardProps> = ({ 
  children,
  variant = 'default',
  padding = 'lg',
  ...props 
}) => {
  return (
    <div className={`rounded-lg border border-slate-200/90 shadow-xs p-${padding}`} {...props}>
      {children}
    </div>
  )
}
```

---

## 6. Responsive Design Issues

### Problem: Mobile vs Desktop Navigation Paradigm Shift

**Desktop:** Navbar at top with horizontal nav items

**Mobile:** BottomNav at bottom with icon+label (or just icons)

**Issue:** Same features, completely different UX

**Solution:** Unified navigation:
```jsx
// Desktop: Horizontal nav bar
// Mobile: Same items, vertical in drawer or horizontal in bottom nav
// Both show same menu structure and active states
```

---

### Problem: Touch Targets Too Small

**Audit Results:**
- Some buttons: `py-2` = 16px height (should be 44px)
- Some links: inline with small `px-2 py-1`
- Icon buttons: `w-9 h-9` = 36px (below WCAG 44px minimum)

**Solution:**
- Enforce 44×44px minimum for all clickable elements
- Use Tailwind: `min-w-[44px] min-h-[44px]`
- Or use h-11 w-11 (44px)

---

## 7. Accessibility Issues

### Problem: Focus States Missing

**Current:** `focus:outline-hidden` without replacement

**Files:** Many

**Issue:** Keyboard users can't see which element is focused

**Solution:**
```jsx
// Replace:
focus:outline-hidden

// With:
focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2
```

---

### Problem: Icon-Only Buttons Missing Labels

**Examples:**
- ThemeToggle (moon/sun icon)
- NotificationCenter (bell icon)
- Close buttons (X icon)

**Solution:**
```jsx
<button aria-label="Toggle dark mode" ...>
  <Moon size={20} />
</button>
```

---

### Problem: Color Contrast Unknown

**Files:** Need audit

**Signal Colors:** Gold, Amber, Coral on light backgrounds

**Solution:** Run axe DevTools audit, adjust colors if needed

---

## 8. Performance Issues

### Problem: ObservationDetail Re-Renders

**File:** `src/components/details/ObservationDetail.tsx`

**State Variables:** 15+

**Issue:** Each state update triggers full component re-render

**Solution:**
1. Split into smaller components (ObserverCard, SocialBar, EvidenceTab)
2. Use useMemo for expensive calculations
3. Use useCallback for event handlers

---

### Problem: Image Lazy Loading Missing

**Files:**
- ObservationDetail (gallery)
- Feed (observation cards)
- Dashboard (thumbnails)

**Solution:**
```jsx
import { useInView } from 'react-intersection-observer'

const Image = ({ src, alt }) => {
  const { ref, inView } = useInView({ triggerOnce: true })
  return (
    <img ref={ref} src={inView ? src : ''} alt={alt} />
  )
}
```

---

## Summary Table

| Problem | Files | Effort | Impact |
|---------|-------|--------|--------|
| Design Tokens | 50+ | 40h | High |
| Navigation Consolidation | 3 | 30h | High |
| Detail View Refactor | 1 | 60h | High |
| Accessibility | 50+ | 50h | High |
| Component Extraction | 50+ | 50h | Medium |
| Responsive Design | 30+ | 45h | Medium |
| Performance | 5 | 35h | Medium |
| Error Handling | 20+ | 30h | Low |

---

**Use this map to:**
1. Identify which files to tackle first
2. Estimate effort per problem category
3. Plan refactoring in phases
4. Assign team members by specialty
