# Implementation Checklist - Phase-by-Phase Tasks

Use this checklist to track progress through all 5 phases of implementation.

---

## Phase 0: Quick Wins (Week 1, 20 hours)

**Goal:** Build momentum with high-impact, low-effort changes

### 1. Fix Color Inconsistencies (2 hours)
- [ ] Search for all instances of `#008f9b` (secondary teal)
- [ ] Replace with `#0284C7` (primary blue)
- [ ] Search for `#0369a1` (hover state)
- [ ] Verify all button hovers use consistent darker shade
- [ ] Update Navbar.tsx brand icon color
- [ ] Test landing page, navbar, buttons
- [ ] Commit: "chore: standardize primary blue color"

### 2. Consolidate Observer Info (4 hours)
- [ ] Review ObservationDetail.tsx "Analyst Attribution Card" section
- [ ] Review "Observation Source" section
- [ ] Decide: Consolidate into single "Submitted By" card
- [ ] Design new card layout (avatar + name + role + engagement stats)
- [ ] Implement single card component
- [ ] Remove redundant section
- [ ] Update styling to match reference design
- [ ] Test on mobile and desktop
- [ ] Commit: "refactor: consolidate observer attribution into single card"

### 3. Add Focus Rings (3 hours)
- [ ] Search for all instances of `focus:outline-hidden`
- [ ] Replace with `focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2`
- [ ] Test keyboard navigation on key pages (navbar, modals, forms)
- [ ] Verify focus visible on light and dark backgrounds
- [ ] Test with browser's outline-only mode
- [ ] Commit: "a11y: add visible focus rings to all interactive elements"

### 4. Extract Button Component (6 hours)
- [ ] Create `src/components/common/Button.tsx`
- [ ] Define variants: primary, secondary, destructive
- [ ] Define sizes: sm, md, lg
- [ ] Implement component with Tailwind classes
- [ ] Create Storybook stories (optional)
- [ ] Find all duplicate button patterns (20+ files)
- [ ] Replace with `<Button>` component (do 5 files per 1h)
- [ ] Test all buttons still work
- [ ] Commit: "refactor: extract Button component"

### 5. Persist Tab State (3 hours)
- [ ] Open ObservationDetail.tsx
- [ ] Find activeTab state
- [ ] Add URL query param persistence
- [ ] On mount, read tab from URL; on change, update URL
- [ ] Test navigation away and back
- [ ] Test page refresh (tab should persist)
- [ ] Commit: "feat: persist observation detail tab state in URL"

### 6. Rate-Limit Toasts (2 hours)
- [ ] Create `src/lib/toastQueue.ts` utility
- [ ] Implement rate limiter (max 1 toast per 2 seconds)
- [ ] Replace showToast calls with rate-limited version
- [ ] Test: trigger multiple toasts, verify rate limiting
- [ ] Commit: "feat: add toast rate limiting"

**Total:** 20 hours, immediate UX/accessibility win

---

## Phase 1: Design System & Components (Week 2-3, 60 hours)

**Goal:** Define tokens, create component library, establish foundation

### Design System Setup (15 hours)
- [ ] Define CSS custom properties for all design tokens
  - [ ] Colors (primary, secondary, success, warning, danger)
  - [ ] Spacing scale (8px increments)
  - [ ] Typography (sizes, weights, families)
  - [ ] Radius (sm, md, lg, full)
  - [ ] Shadow scales
  - [ ] Border widths
- [ ] Update `tailwind.config.ts` to reference CSS variables
- [ ] Create `src/styles/tokens.css` with all definitions
- [ ] Document all tokens in Storybook or design doc
- [ ] Test: new components use tokens, not hardcoded values
- [ ] Commit: "chore: establish design token system"

### Component Library - Part A (20 hours)
- [ ] Create `src/components/common/Button.tsx` ✅ (done in Phase 0)
- [ ] Create `src/components/common/Card.tsx`
  - [ ] Variants: default, elevated, outlined
  - [ ] Padding options
  - [ ] Support for header/footer sections
- [ ] Create `src/components/common/Modal.tsx`
  - [ ] Backdrop with consistent styling
  - [ ] Close button
  - [ ] Focus trap
  - [ ] Escape key handling
  - [ ] Animations (fade + slide)
- [ ] Create `src/components/common/Badge.tsx`
  - [ ] Variants: signal (Normal/Watch/Investigate), status, role
  - [ ] Sizes: sm, md, lg
- [ ] Create `src/components/common/EmptyState.tsx`
  - [ ] Icon + message + CTA
  - [ ] Variants: no-data, no-results, error
- [ ] Write tests for each component
- [ ] Commit: "feat: add reusable component library"

### Component Library - Part B (15 hours)
- [ ] Create `src/components/common/Loader.tsx`
  - [ ] Full-screen variant
  - [ ] Inline spinner variant
- [ ] Create `src/components/common/Select.tsx` (form input)
- [ ] Create `src/components/common/TextInput.tsx` (form input)
- [ ] Create `src/components/common/Checkbox.tsx`
- [ ] Create `src/components/common/Tabs.tsx`
  - [ ] Tab bar with active indicator
  - [ ] Tab content sections
- [ ] Create `src/components/common/SignalBadge.tsx` (specialized Badge)
- [ ] Create `src/components/common/ConfidenceBar.tsx`
- [ ] Create `src/components/common/SocialBar.tsx` (like/comment/share/follow)
- [ ] Write tests for each
- [ ] Commit: "feat: complete reusable component library"

### Tailwind Config Cleanup (10 hours)
- [ ] Remove arbitrary color values (e.g., `[#0284C7]` → use token)
- [ ] Remove arbitrary spacing values (e.g., `gap-2.5` → use token)
- [ ] Remove non-standard radius values
- [ ] Verify all values map to design tokens
- [ ] Create migration guide for developers
- [ ] Audit: Count remaining arbitrary values (goal: <5)
- [ ] Commit: "refactor: enforce design tokens in Tailwind config"

---

## Phase 2: Navigation & View Protection (Week 4-5, 50 hours)

**Goal:** Unify navigation, fix view guard logic, simplify router

### Navigation Consolidation (20 hours)
- [ ] Audit LandingNavbar.tsx and Navbar.tsx (find duplicates)
- [ ] Create unified `Navbar.tsx` component with:
  - [ ] `isAuthenticated` prop
  - [ ] `userRole` prop
  - [ ] Conditional rendering of nav items based on auth state
  - [ ] Consistent active state styling
- [ ] Update App.tsx to use single Navbar
- [ ] Remove LandingNavbar.tsx
- [ ] Test on landing (unauthenticated state)
- [ ] Test on home (authenticated state)
- [ ] Test on reviewer-queue (reviewer-only)
- [ ] Verify mobile nav (BottomNav) syncs with desktop nav
- [ ] Commit: "refactor: consolidate Navbar components"

### View Guard Logic Refactor (15 hours)
- [ ] Create `useViewGuard()` custom hook
  - [ ] Input: activeView, isAuthenticated, userRole, isLoading
  - [ ] Logic: Protect capture/profile/dashboard/reviewer-queue
  - [ ] Output: Should redirect? Where? Why? (toast message)
- [ ] Move guard logic from App.tsx to custom hook
- [ ] Test all protected views with different auth states
- [ ] Test lazy auth (session resolves slowly) - no flicker
- [ ] Test role transitions (guest → citizen → reviewer)
- [ ] Add error boundary for guard failures
- [ ] Commit: "refactor: extract view guard logic to custom hook"

### Public vs Authenticated Surfaces (10 hours)
- [ ] Define clear boundaries:
  - [ ] Public: landing, login, signup, public-map
  - [ ] Authenticated: home, capture, profile, dashboard, etc.
  - [ ] Reviewer-only: reviewer-queue
- [ ] Test redirects from protected to login
- [ ] Test redirects from login to home (on successful signin)
- [ ] Test role-based access (reviewer-queue requires reviewer role)
- [ ] Verify unauthenticated users can browse public-map without signing in
- [ ] Commit: "refactor: clarify public vs authenticated surface boundaries"

### Bottom Nav Cleanup (5 hours)
- [ ] Remove arbitrary `h-[76px]` clearance div
- [ ] Use CSS custom property for BottomNav height
- [ ] Apply same variable to content bottom padding
- [ ] Test: no overlap, proper spacing
- [ ] Test on mobile with various content heights
- [ ] Commit: "refactor: remove hardcoded bottom nav clearance"

---

## Phase 3: Observation Detail Refactor (Week 6-7, 60 hours)

**Goal:** Split 1000+ line component into focused subcomponents, fix redundancy, clean up social

### Component Split (25 hours)
- [ ] Create `src/components/details/ObserverCard.tsx`
  - [ ] Avatar + name + role + location
  - [ ] Engagement stats (followers, contributions)
  - [ ] Follow button
- [ ] Create `src/components/details/SignalPanel.tsx`
  - [ ] Signal badge + confidence bar
  - [ ] Verification status
- [ ] Create `src/components/details/EvidenceTab.tsx`
  - [ ] AI summary (prominent)
  - [ ] Key indicators (bulleted, scannable)
  - [ ] Consistency flags (clear styling)
  - [ ] Observer notes (quoted)
- [ ] Create `src/components/details/LocationTab.tsx`
  - [ ] Map
  - [ ] Coordinates
  - [ ] Address
- [ ] Create `src/components/details/ImagesTab.tsx`
  - [ ] Hero image selector
  - [ ] Thumbnail grid
  - [ ] Image info (timestamp, angle)
- [ ] Create `src/components/details/HistoryTab.tsx`
  - [ ] Review timeline
- [ ] Create `src/components/details/CommentsTab.tsx`
  - [ ] Comment composer
  - [ ] Comment list
- [ ] Split main component by moving code to subcomponents
- [ ] Test all tabs work, state persists
- [ ] Commit: "refactor: split ObservationDetail into focused subcomponents"

### Social Section Reorganization (15 hours)
- [ ] Separate engagement stats from social actions
- [ ] Create `src/components/details/SocialBar.tsx`
  - [ ] Like button + count
  - [ ] Comment button + count
  - [ ] Share button
  - [ ] Follow button (if observer not current user)
- [ ] Create `src/components/details/EngagementStats.tsx`
  - [ ] Followers count
  - [ ] Contributions count
  - [ ] Views count
  - [ ] Likes received count
- [ ] Place SocialBar below main content (sticky?)
- [ ] Place EngagementStats in ObserverCard
- [ ] Remove redundant engagement displays
- [ ] Test on mobile and desktop
- [ ] Commit: "refactor: reorganize social section"

### Edit Modal Redesign (10 hours)
- [ ] Assess current edit modal (10+ fields)
- [ ] Decide: Full-screen on mobile, or modal + scroll?
- [ ] Option A: Mobile-specific simplified form
  - [ ] Create `EditObservationMobile.tsx` with essential fields only
  - [ ] Create `EditObservationDesktop.tsx` with all fields
  - [ ] Show based on viewport size
- [ ] Option B: Full-screen modal on mobile
  - [ ] Add breakpoint class to modal
  - [ ] Stack fields vertically on mobile
- [ ] Implement chosen approach
- [ ] Test form doesn't require external scroll (unless field count requires)
- [ ] Test on iPhone, iPad, desktop
- [ ] Commit: "refactor: redesign edit modal for mobile"

### Multi-Image Handling (5 hours)
- [ ] Review current image indexing (activeHeroImageIndex)
- [ ] Redesign: "Primary" vs "Supporting angles"
- [ ] Update hero image selector to mark primary
- [ ] Update thumbnail grid with angle labels
- [ ] Test image switching
- [ ] Commit: "refactor: clarify multi-image primary/supporting"

### Tab State Persistence (5 hours)
- [ ] Verify tab state persists from Phase 0 ✅
- [ ] Test switching tabs rapidly
- [ ] Test navigation away and back (tab persists)
- [ ] Test page refresh (tab persists)
- [ ] Commit: "test: verify tab state persistence works end-to-end"

---

## Phase 4: Mobile & Accessibility (Week 8-9, 45 hours)

**Goal:** Mobile-first responsive design, WCAG AA compliance

### Responsive Design Audit (15 hours)
- [ ] Audit all pages on iPhone SE (375px)
- [ ] Audit all pages on iPad (768px)
- [ ] Audit all pages on desktop (1200px+)
- [ ] Check for horizontal scroll (should be none)
- [ ] Check typography scaling (readable at all sizes)
- [ ] Check image scaling (no squished/stretched)
- [ ] Check form layout (fields stack vertically on mobile)
- [ ] Fix: Image grids
  - [ ] Desktop: 3-4 columns
  - [ ] Tablet: 2 columns
  - [ ] Mobile: 1 column
- [ ] Fix: Card layouts (padding scales with viewport)
- [ ] Fix: Modal size (full-width on mobile with padding)
- [ ] Test: Landscape mode on mobile (rotate phone)
- [ ] Commit: "refactor: implement mobile-first responsive design"

### Touch Target Enforcement (10 hours)
- [ ] Audit all clickable elements
- [ ] Enforce minimum 44×44px (use `min-w-[44px] min-h-[44px]` or `h-11 w-11`)
- [ ] Fix buttons: increase padding/height
- [ ] Fix icon buttons (moon, bell, close)
- [ ] Fix small links and interactive text
- [ ] Test: all elements tappable on mobile without zooming
- [ ] Run Lighthouse accessibility audit
- [ ] Commit: "a11y: enforce 44×44px minimum touch targets"

### Accessibility Fixes (15 hours)
- [ ] Audit focus states (done in Phase 0, verify)
- [ ] Add aria-label to icon-only buttons (ThemeToggle, NotificationCenter, close, etc.)
- [ ] Audit color contrast (run axe DevTools)
  - [ ] Check all text on colored backgrounds
  - [ ] Check signal colors specifically
  - [ ] Fix any <4.5:1 ratio
- [ ] Fix form labels:
  - [ ] Link all inputs with htmlFor
  - [ ] Ensure labels visible and adjacent
- [ ] Add alt text / descriptions to visualizations
  - [ ] Maps: "Map of basin with observation markers"
  - [ ] Charts: "Line chart showing signal trend over time"
  - [ ] Images: "Photo of Nairobi River"
- [ ] Test keyboard navigation:
  - [ ] Tab through all pages
  - [ ] Enter/Space to activate buttons
  - [ ] Escape to close modals
  - [ ] Arrow keys in dropdowns/tabs
- [ ] Test with screen reader (NVDA on Windows or JAWS)
- [ ] Run axe DevTools audit (goal: 0 issues)
- [ ] Commit: "a11y: implement WCAG AA accessibility standards"

### Mobile Navigation Parity (5 hours)
- [ ] Ensure BottomNav shows same features as desktop Navbar
- [ ] Ensure active states consistent (both nav styles)
- [ ] Test: Switching between mobile and desktop views
- [ ] Test: All nav features accessible from mobile
- [ ] Consider: Merge mobile/desktop nav fully (or accept paradigm shift intentionally)
- [ ] Commit: "refactor: ensure mobile/desktop navigation parity"

---

## Phase 5: Polish & Testing (Week 10, 40 hours)

**Goal:** Performance, error handling, final QA

### Performance Optimization (10 hours)
- [ ] Lazy load images in observation grids
  - [ ] Use IntersectionObserver
  - [ ] Test: Images load as they appear
- [ ] Memoize expensive calculations
  - [ ] isReviewerRole checks → useMemo
  - [ ] Component callbacks → useCallback
- [ ] Check ObservationDetail render performance
  - [ ] Profile with React DevTools
  - [ ] Identify excess re-renders
  - [ ] Target: no more than 3 re-renders on initial load
- [ ] Lighthouse audit
  - [ ] Performance score: >80
  - [ ] Page load: <1s (ObservationDetail)
  - [ ] First Contentful Paint: <1.5s
- [ ] Commit: "perf: optimize render performance and lazy load images"

### Error Handling & Feedback (10 hours)
- [ ] Verify toast rate limiting (Phase 0) ✅
- [ ] Audit error messages across app
  - [ ] Replace generic "Failed" with specific, actionable messages
  - [ ] Example: "Failed to post comment" → "Your comment is too long (max 1000 chars)"
- [ ] Add retry buttons for failed API calls
  - [ ] Like/unlike failures
  - [ ] Comment failures
  - [ ] Image upload failures
- [ ] Add inline validation errors
  - [ ] Form fields show errors on blur/change (not submit)
  - [ ] Example: "Site name is required"
- [ ] Distinguish network errors from API errors
  - [ ] "Network error: Check your connection"
  - [ ] "Server error: Try again in a moment"
- [ ] Test: Error flows on slow/offline network
- [ ] Commit: "feat: improve error handling and user feedback"

### Comprehensive Testing (15 hours)
- [ ] Manual testing: All 9 page flows
  - [ ] Landing → Login → Home
  - [ ] Capture Wizard (all 4 steps)
  - [ ] Observation Detail (all tabs)
  - [ ] Feed filtering
  - [ ] Map interaction
  - [ ] Reviewer Queue
  - [ ] Analytics
  - [ ] Dashboard
  - [ ] Settings
- [ ] Mobile testing on real devices
  - [ ] iPhone (iOS)
  - [ ] Android phone
  - [ ] Tablet
  - [ ] Landscape mode
- [ ] Browser testing
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
- [ ] Accessibility testing
  - [ ] Keyboard navigation (Tab/Enter/Escape)
  - [ ] Screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
  - [ ] Zoom (200%)
- [ ] Performance testing
  - [ ] Lighthouse audit (all pages)
  - [ ] Network throttling (slow 3G)
- [ ] Bug reports: Create issues for any failures
- [ ] Commit: "test: comprehensive manual testing complete"

### Design System Documentation (5 hours)
- [ ] Create design token documentation (colors, spacing, typography, radius)
- [ ] Create component library documentation (how to use each component)
- [ ] Create style guide (do's and don'ts)
- [ ] Create migration guide (how to update existing components)
- [ ] Add to project README or create DESIGN_GUIDE.md
- [ ] Commit: "docs: add design system and component library documentation"

---

## Final Sign-Off (1 hour)

- [ ] All AC (acceptance criteria) met
  - [ ] AC-1: Design System Enforcement ✅
  - [ ] AC-2: Navigation & View Protection ✅
  - [ ] AC-3: Capture Wizard ✅
  - [ ] AC-4: Observation Detail ✅
  - [ ] AC-5: Consistency & Evidence Display ✅
  - [ ] AC-6: Modal Consistency ✅
  - [ ] AC-7: Component Reusability ✅
  - [ ] AC-8: Responsive Design ✅
  - [ ] AC-9: Accessibility ✅
  - [ ] AC-10: Performance ✅
  - [ ] AC-11: Error Handling ✅
  - [ ] AC-12: Auth & Authorization ✅
- [ ] All success metrics met
  - [ ] 100% design token compliance ✅
  - [ ] 80%+ component reusability ✅
  - [ ] 90%+ accessibility score ✅
  - [ ] <1s page load time ✅
  - [ ] 0 console errors/warnings ✅
- [ ] User feedback positive
- [ ] Create release notes
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] QA sign-off on staging
- [ ] Deploy to production
- [ ] Monitor for regressions (1 week)

---

## Progress Tracking

Use this table to track overall progress:

| Phase | Name | Estimated | Actual | Status |
|-------|------|-----------|--------|--------|
| 0 | Quick Wins | 20h | — | ⬜ |
| 1 | Design System & Components | 60h | — | ⬜ |
| 2 | Navigation & View Protection | 50h | — | ⬜ |
| 3 | Observation Detail | 60h | — | ⬜ |
| 4 | Mobile & Accessibility | 45h | — | ⬜ |
| 5 | Polish & Testing | 40h | — | ⬜ |
| **Total** | | **275h** | — | — |

---

## Commit Message Template

Use this template for each commit:

```
[category] [scope]: [description]

[category]: chore, feat, refactor, fix, test, docs, a11y, perf
[scope]: Component name, file name, or area affected
[description]: What changed and why

Example:
refactor(ObservationDetail): split into focused subcomponents

- Extract EvidenceTab subcomponent
- Extract CommentsTab subcomponent  
- Remove redundant observer info display
- Reduce main component from 1000 to 300 lines
- Maintain all functionality and test coverage

Fixes #123 (if applicable)
```

---

**Use this checklist to:**
- Assign tasks to team members
- Track progress through all phases
- Ensure quality gates are met before moving to next phase
- Communicate status to stakeholders

**Start with Phase 0 (Quick Wins) to build momentum!**
