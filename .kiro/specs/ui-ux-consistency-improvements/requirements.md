# UI/UX Consistency Improvements - Requirements

**Feature Name:** ui-ux-consistency-improvements  
**Created:** September 27, 2026  
**Status:** Requirements Phase  

---

## 1. Executive Summary

AquaSense has a solid architectural foundation but suffers from fragmented UI/UX patterns, design system violations, and inconsistent state management. This spec systematically addresses 12 major problem areas identified across navigation, forms, components, responsive design, accessibility, and performance.

**Goals:**
- Enforce design system consistency across all screens
- Unify navigation and view protection patterns
- Extract and standardize reusable component library
- Improve mobile-first responsive design
- Achieve WCAG AA accessibility compliance
- Optimize state management and rendering
- Implement consistent error handling and feedback

**Expected Outcomes:**
- All UI elements follow design tokens from Design_System.md
- Navigation state and view protection are predictable and safe
- 90%+ component reusability across screens
- Mobile and desktop experiences are equally polished
- Accessibility audit passes WCAG AA standards
- Rendering performance improved (fewer re-renders, lazy loading)

---

## 2. Problem Analysis & Scope

### 2.1 Design System Violations (Category A - High Priority)

**Problem Statement:**
The Design_System.md defines clear tokens (colors, spacing, typography, radius), but implementation uses ad-hoc Tailwind classes, resulting in visual inconsistency, maintenance burden, and diluted brand identity.

**Specific Issues:**
- **Colors**: Primary blue used as #0284C7 (navbar, buttons) vs #008f9b (brand icon), sky-50/100/200 variants don't map to design tokens
- **Spacing**: Mix of consistent 8px scale (p-4 = 16px, p-6 = 24px) and arbitrary pixels (h-[76px], gap-2.5)
- **Typography**: Font weights scattered (font-black, font-extrabold, font-bold, font-semibold) without semantic meaning
- **Radius**: Three radius tiers defined (8px/12px/20px/999px) but classes use rounded-xl/2xl/3xl without mapping
- **Signal Colors**: Design specifies Gold (#E9B44C), Amber (#F59E0B), Coral (#E76F51) for Normal/Watch/Investigate, but implementation may drift

**Impact:**
- Brand looks fragmented across pages
- New components require guess-work on styling
- Hard to maintain or theme (dark mode partially implemented)
- Accessibility contrast issues if colors drift

---

### 2.2 Navigation & View Protection Logic (Category B - High Priority)

**Problem Statement:**
Two separate navbar components (LandingNavbar, Navbar), inconsistent active states, complex guard logic in useEffect, and unclear public/authenticated boundaries create confusion and potential bugs.

**Specific Issues:**
- **Navbar Duplication**: LandingNavbar and Navbar serve similar purposes; logic split across files
- **Active State Inconsistency**: Nav links use `border-[#0284c7] bg-[#e8f3fc]` vs tabs use `border-[#0284C7] text-[#0284C7]` vs buttons use inline comparisons
- **View Guard Complexity**: App.tsx has nested useEffect checks for isLoading, isAuthenticated, activeView, isReviewer with potential race conditions
- **Bottom Nav Overlap**: Fixed `<div className="h-[76px]"` clearance for mobile nav suggests layout assumptions
- **Public Surface Boundaries**: isPublicSurface = isLanding || activeView === 'public-map' doesn't cover all public flows (auth, landing)

**Impact:**
- Hard to tell current page visually
- Protected views might render before auth check completes
- Mobile and desktop nav don't sync well
- Onboarding tour depends on localStorage instead of user profile state

---

### 2.3 Capture Wizard Issues (Category B - Medium Priority)

**Problem Statement:**
The 4-step capture wizard has inconsistent step progression, complex image state management, and unclear validation feedback.

**Specific Issues:**
- **Step Navigation**: Can only go forward; back buttons limited to current step
- **Image State Complexity**: Tracks imageUrls (display), imageDataList (AI), imageMime; uploadDataUriToStorage logic embedded in save handler
- **Validation Feedback**: No red error messages during form entry; only AI summary on Step 4
- **Progress Indicator**: Shows step number but not validation state (missing required field, empty image, etc.)
- **Mobile Experience**: Multi-column layouts on steps 1-4 don't scale to mobile breakpoints

**Impact:**
- Users can't correct mistakes on earlier steps
- Image handling is error-prone (data URIs not persisted)
- Form errors discovered at final step frustrate users
- Mobile users may abandon capture flow

---

### 2.4 Observation Detail View Issues (Category B - High Priority)

**Problem Statement:**
The ObservationDetail component is over 1000 lines with 15+ state variables, redundant sections, poor tab state management, and massive edit modal.

**Specific Issues:**
- **Tab State Not Persisted**: activeTab resets on navigation; context lost when returning to detail view
- **Redundant Attribution**: "Analyst Attribution Card" + "Observation Source" sections both show observer info
- **Social Feature Overload**: Like/comment/share/follow cramped into single social bar with engagement stats
- **Multi-Image Complexity**: activeHeroImageIndex tracking, thumbnail switcher, unclear which image is "primary"
- **Edit Modal Size**: 10+ form fields in single modal; poor mobile UX; coordinate inputs require separate fields
- **Engagement Metrics**: observerProfile stats + social bar stats = duplicate/confusing information
- **Comments Loading**: Optional commentsLoaded flag means counts may be stale (obs.comment_count vs comments.length)

**Impact:**
- Component is hard to maintain and test
- Tab context lost reduces perceived functionality
- Social section cluttered and unclear
- Mobile edit form breaks into multiple fields
- Engagement metrics confusing to users

---

### 2.5 Consistency & Evidence Display (Category C - Medium Priority)

**Problem Statement:**
AI evidence, confidence, and consistency flag presentations lack hierarchy, progressive disclosure, and clear visual patterns.

**Specific Issues:**
- **Evidence Hierarchy**: Key indicators shown as checkmarks (✓ item) with no distinction between critical and minor
- **AI Summary**: Dense paragraph block with no callouts or progressive disclosure
- **Confidence Visualization**: ConfidenceBar component name mentioned but implementation unclear
- **Signal Badge Sizing**: Inconsistent sizes (size="md" prop exists but different classes used)
- **Consistency Flags**: Amber/sky panels but severity (warning vs info) visually similar
- **Observer Consistency Response**: If observer acknowledged flag, shown as small green text - easy to miss

**Impact:**
- Reviewers can't quickly scan evidence
- Key findings buried in text
- Confidence scores not immediately understood
- Consistency acknowledgment not obvious

---

### 2.6 Modal & Dialog Inconsistencies (Category C - Low Priority)

**Problem Statement:**
Multiple modal implementations with inconsistent backdrop handling, close behaviors, sizes, and animations.

**Specific Issues:**
- **Backdrop Implementations**: Some use `bg-slate-900/50 backdrop-blur-sm`, others use different opacity/blur combinations
- **Close on Click**: Some modals close on backdrop click, EditModal only closes if !isSavingEdit
- **Modal Sizes**: max-w-md (FhirExportModal), max-w-xl (EditModal), max-w-5xl (ObservationDetail) without clear pattern
- **Animations**: FhirExportModal uses `animate-in fade-in slide-in-from-top-2`, others don't animate
- **Focus Trap**: No indication modals trap focus or how to escape

**Impact:**
- Inconsistent UX when opening multiple modals
- Users unsure if backdrop click closes modal
- Layout unpredictable on large screens

---

### 2.7 Component Reusability Issues (Category C - Medium Priority)

**Problem Statement:**
Button styles, card layouts, empty states, and loaders are implemented inline across files instead of reusable components.

**Specific Issues:**
- **Button Duplication**: Primary button pattern `px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1]` appears 20+ times
- **Card Pattern**: Similar `rounded-3xl border border-slate-200/90 shadow-xs p-6` structure repeated across detail, analytics, evidence cards
- **Empty States**: Inconsistent messaging ("No observation selected" vs "No comments yet" vs dashed borders)
- **Loader Implementations**: AppLoader for full-screen context, Loader2 icon for actions, no skeleton screens
- **Status Pills**: Signal badges, verification status, role badges all custom-styled without component

**Impact:**
- Changes to button style require updating 20+ files
- Inconsistent empty states confuse users
- No single source of truth for common UI patterns

---

### 2.8 Responsive Design Issues (Category B - Medium Priority)

**Problem Statement:**
Mobile-first design intention not fully realized; desktop nav hidden on mobile, typography scaling inconsistent, touch targets may be too small.

**Specific Issues:**
- **Navigation Paradigm Shift**: Desktop nav (Navbar) replaced with BottomNav on mobile; different information architecture
- **Typography Scaling**: Some text sm:text-sm sm:text-base, others text-xs sm:text-sm; inconsistent breakpoint usage
- **Touch Targets**: Some buttons 32px height (py-2 = 8px), others 40px (py-2.5 = 10px); WCAG recommends 44×44px minimum
- **Container Max-Width**: max-w-7xl mx-auto may cause unnecessary horizontal scroll on tablets
- **Overflow Handling**: Long observer names, site names may overflow containers (e.g., "truncate" used inconsistently)
- **Mobile Modals**: EditModal max-h-[90vh] overflow-y-auto works but scrollable form uncomfortable
- **Image Grids**: Multi-column layouts on detail view, feed, and analytics don't adapt well to mobile

**Impact:**
- Different navigation structure confuses users switching devices
- Text too large or small on different screens
- Small buttons hard to tap on mobile
- Content may overflow or scroll unnecessarily

---

### 2.9 Accessibility Issues (Category B - High Priority)

**Problem Statement:**
Focus states incomplete, ARIA labels missing on icon buttons, color contrast unverified, keyboard navigation unclear.

**Specific Issues:**
- **Focus States**: Many interactive elements use `focus:outline-hidden` without replacement (focus ring, visible underline)
- **ARIA Labels**: Icon-only buttons (ThemeToggle, NotificationCenter) missing `aria-label` attributes
- **Color Contrast**: No verification that all color combinations (especially signal colors) meet WCAG AA 4.5:1 ratio
- **Keyboard Navigation**: Modals unclear if they trap focus or allow Tab to escape; Escape key handling inconsistent
- **Screen Reader Support**: Complex charts (WatershedAnalyticsView), maps, and social engagement cards need descriptions
- **Form Labels**: Edit modal form fields use labels but not explicitly linked with htmlFor
- **Error Messages**: Validation errors not announced to screen readers

**Impact:**
- Users with keyboard-only input can't navigate all features
- Users with low vision can't read small text or low-contrast colors
- Screen reader users miss important context
- Legal/compliance risk if WCAG AA not met

---

### 2.10 Performance & State Management Issues (Category C - Medium Priority)

**Problem Statement:**
Multiple useEffect hooks, local state sync with server, no lazy loading for images, optimistic updates without clear error handling.

**Specific Issues:**
- **Re-render Optimization**: ObservationDetail has 15+ state updates, each may trigger renders; no useMemo/useCallback
- **State Synchronization**: Social state (liked, likeCount) managed locally but server-authoritative; stale data possible
- **Image Lazy Loading**: Observation grids load all image URLs without IntersectionObserver
- **Optimistic Updates**: Like button updates UI immediately but error handling (result === null?) unclear
- **Effect Dependencies**: Multiple useEffect hooks with [obs?.id, user?.id] dependencies may miss updates
- **Memoization**: isReviewerRole(user?.role) called on every render without memoization

**Impact:**
- Slow rendering on detail page with many comments/reviews
- Stale engagement counts if server updates during view
- Page slow on slow networks (all images loading)
- Optimistic failures silently fail or show generic errors

---

### 2.11 Error Handling & User Feedback (Category C - Medium Priority)

**Problem Statement:**
Toast notifications lack rate limiting, error messages are generic, no retry logic for failed API calls, validation errors not shown inline.

**Specific Issues:**
- **Toast Spam**: showToast called frequently (on nav clicks, auth checks, etc.) without rate limiting
- **Generic Messages**: "Sign in required" vs "Please sign in to like this observation" - missing context
- **No Retry Logic**: Failed API calls (createComment, likeObservation) don't retry or offer manual retry
- **Inline Validation**: Form validation errors (empty siteName, invalid coordinates) not shown until submit
- **Network Errors**: No indication of network failure vs API error vs timeout
- **Progress Indication**: Some async actions (isSavingEdit, isPostingComment) show loading, others don't

**Impact:**
- Toast storms distract users
- Users don't know what went wrong or how to fix it
- Network issues feel like app failures
- Form submission surprises users with errors

---

### 2.12 Authentication & Authorization Issues (Category C - Low Priority)

**Problem Statement:**
Session restoration shows full-screen loader, role checks not memoized, dropdown interactions inconsistent.

**Specific Issues:**
- **Session Loader**: AppLoader shown during auth resolution with context parameter; could be jarring UI
- **Role Memoization**: isReviewerRole(user?.role) called 5+ times per render without memoization
- **Protected View Guards**: useEffect checks could miss auth state changes if dependencies incomplete
- **Dropdown Behavior**: User dropdown opens/closes on click but closes on onMouseLeave (inconsistent UX)
- **Role Change Handling**: If user role changes, might not trigger UI update for reviewer-queue access

**Impact:**
- Session restoration looks like a bug/freeze
- Unnecessary re-renders due to role checks
- Edge cases in auth state transitions
- Desktop users can't hover, mobile users need click; inconsistent

---

## 3. User Stories

### 3.1 Design System Enforcement
**US-101: Designer can audit design system compliance**
- As a designer, I want to see which Tailwind classes are used across the app, so I can identify drift from design tokens
- Acceptance: Audit report generated showing token usage vs defined tokens

**US-102: Developer can build new components using design tokens**
- As a developer, I want clear design token values (colors, spacing, radius), so I don't have to guess styling
- Acceptance: Design tokens defined in CSS custom properties or Tailwind config

**US-103: App theme applies consistently across all screens**
- As a user, I want all screens to look visually cohesive, so the app feels polished
- Acceptance: All primary colors are #0284C7, spacing follows 8px scale, typography scales predictably

---

### 3.2 Navigation & View Protection
**US-201: User knows which page they're on**
- As a user, I want the current page highlighted in navigation, so I know where I am
- Acceptance: Active nav item has consistent visual treatment across all pages

**US-202: Protected views load without flashing auth screen**
- As an authenticated user, I want to navigate to capture/profile without seeing a loading spinner, so the experience is smooth
- Acceptance: View protection logic completes before rendering content

**US-203: Reviewer can access review queue, citizen cannot**
- As a citizen, I want the review queue hidden from my navigation, so I'm not confused
- Acceptance: Only users with reviewer role see "Reviews" nav item

---

### 3.3 Capture Wizard
**US-301: User can correct previous step**
- As a user, I want to go back and fix a typo in the site name, so I don't have to restart
- Acceptance: Back button on any step allows revisiting prior steps

**US-302: User sees validation errors before final review**
- As a user, I want to know if my image is too blurry or site name is empty, so I can fix it immediately
- Acceptance: Inline validation errors shown on each step with clear next action

**US-303: Multi-image upload persists correctly**
- As a user uploading multiple photos, I want them all saved to the observation, so reviewers see all angles
- Acceptance: All uploaded images persisted; no data URIs lost during upload

---

### 3.4 Observation Detail
**US-401: User can quickly scan evidence and signal**
- As a reviewer, I want evidence prioritized and easy to scan, so I can make a decision fast
- Acceptance: Evidence sorted by importance; key findings highlighted

**US-402: Tab context persists when returning to detail**
- As a user viewing comments, I want the comments tab to stay active when I navigate back, so I don't lose context
- Acceptance: activeTab persisted in URL or localStorage

**US-403: Edit modal works on mobile**
- As a mobile user, I want to edit observation fields without scrolling excessively, so the UX is smooth
- Acceptance: Form fields stack vertically; no horizontal scroll; 44px+ touch targets

**US-404: User understands observer credentials**
- As a reader, I want to know if the observer is a citizen or certified reviewer, so I can weigh the observation
- Acceptance: Single, clear observer credential display (not duplicated)

---

### 3.5 Consistency & Evidence Display
**US-501: Reviewer understands AI reasoning**
- As a reviewer, I want to see why the AI assigned a "watch" signal, so I can verify or override
- Acceptance: Evidence presented with hierarchy; most important items first

**US-502: Confidence score is understandable**
- As a user, I want to know how confident the AI is (e.g., "90% confident"), so I know how much to trust it
- Acceptance: Confidence displayed with clear label and visual bar

**US-503: Consistency flags are noticed**
- As an observer, I want to know if the AI thinks my photo contradicts my answers, so I can respond
- Acceptance: Consistency flag visual treatment ensures it's noticed (not buried in text)

---

### 3.6 Responsive Design
**US-601: Mobile and desktop navigation are aligned**
- As a mobile user, I want the same features available as on desktop, so I can do my tasks on any device
- Acceptance: Mobile and desktop nav show same features (with mobile-optimized layout)

**US-602: Buttons are tappable on mobile**
- As a mobile user, I want buttons at least 44×44px, so I can tap them reliably
- Acceptance: All interactive elements meet minimum touch target size

**US-603: Text is readable on all screen sizes**
- As a user on a small screen, I want text sized appropriately, so I don't have to zoom
- Acceptance: Typography scales with viewport; no horizontal scroll needed

---

### 3.7 Accessibility
**US-701: Keyboard user can navigate entire app**
- As a keyboard-only user, I want to access all features using Tab/Enter/Escape, so I'm not excluded
- Acceptance: All interactive elements focusable; focus visible; modals trap focus with Escape escape

**US-702: Screen reader user understands page content**
- As a screen reader user, I want proper headings, lists, and ARIA labels, so the content is understandable
- Acceptance: ARIA labels on icon buttons; proper heading hierarchy; form fields linked to labels

**US-703: All color changes have text/icon backup**
- As a colorblind user, I want to understand signals without relying on color alone, so I'm not confused
- Acceptance: Signal badges use color + text + icon; no color-only status indicators

---

### 3.8 State Management & Performance
**US-801: Detail view renders without lag**
- As a user viewing an observation with 50+ comments, I want the page to load fast, so I'm not frustrated
- Acceptance: Page renders in <1s; comments lazy-load below fold

**US-802: Like button works reliably**
- As a user liking an observation, I want the count to update correctly, so I know my action worked
- Acceptance: Local UI updated optimistically; server count synced; errors handled gracefully

**US-803: Images load progressively**
- As a user on a slow network, I want images to load as they appear on screen, so the page loads faster
- Acceptance: Images use lazy loading; blur-up placeholder while loading

---

### 3.9 Error Handling & Feedback
**US-901: User knows why an action failed**
- As a user whose comment failed to post, I want to know why (network error? input too long?) so I can fix it
- Acceptance: Error messages are specific and actionable

**US-902: User can retry failed actions**
- As a user whose like button failed due to network error, I want a retry option, so I don't have to refresh
- Acceptance: Failed async actions show retry button or automatic retry

**US-903: Form errors are caught early**
- As a user capturing an observation, I want validation errors shown before I click submit, so I know immediately
- Acceptance: Inline validation on all required fields; errors shown on blur/change

---

## 4. Acceptance Criteria (by Category)

### AC-1: Design System Enforcement
- [ ] Tailwind config includes custom CSS variables for design tokens (colors, spacing, radius, typography)
- [ ] All color classes replaced with token references (e.g., `bg-primary` not `bg-[#0284C7]`)
- [ ] Spacing only uses predefined scale (p-2/4/6/8 etc., no arbitrary p-2.5)
- [ ] Border radius consistent (rounded-sm/md/lg/full, no -2xl/-3xl)
- [ ] Typography uses semantic font sizes (text-sm/base/lg, no arbitrary font-black)
- [ ] Signal colors (Normal/Watch/Investigate) mapped to design tokens
- [ ] Audit report shows 100% token compliance

### AC-2: Navigation & View Protection
- [ ] Single unified Navbar component used for all authenticated views
- [ ] Active nav state uses consistent visual treatment across all pages
- [ ] View protection logic prevents render-then-redirect flicker
- [ ] Public/authenticated surfaces clearly defined and respected
- [ ] Bottom nav shows on mobile; desktop nav hidden; features match
- [ ] No race conditions in view guard logic (test with slow auth)

### AC-3: Capture Wizard
- [ ] Back button works on all steps (1-4)
- [ ] Inline validation errors shown on each step
- [ ] Multi-image state persisted correctly (no lost data URIs)
- [ ] Progress indicator shows validation status
- [ ] Mobile layout adapts without horizontal scroll
- [ ] Step transitions smooth; no page reloads

### AC-4: Observation Detail
- [ ] Tab state persisted on navigation (activeTab in URL or localStorage)
- [ ] Single observer credential display (not duplicated)
- [ ] Social section reorganized (like/comment/share separated from engagement stats)
- [ ] Edit modal mobile-optimized (form scrolls vertically only)
- [ ] Multi-image selection clear (primary image highlighted)
- [ ] Comments count synced between local state and server

### AC-5: Consistency & Evidence Display
- [ ] Evidence items ordered by importance
- [ ] Key findings highlighted with callout styling
- [ ] Confidence score displayed with visual bar and label
- [ ] Consistency flags visually distinct from regular notes
- [ ] Observer consistency acknowledgment prominent

### AC-6: Modal & Dialog Consistency
- [ ] All modals use consistent backdrop (rgba(15, 23, 42, 0.5) + blur)
- [ ] Backdrop click closes modal (unless action in progress)
- [ ] All modals use max-w-md/lg/xl pattern
- [ ] All modals animate in/out with fade + slide
- [ ] Focus trap implemented; Escape key closes modal

### AC-7: Component Reusability
- [ ] Reusable Button component (primary, secondary, destructive variants)
- [ ] Reusable Card component (rounded-3xl border shadow p-6 pattern)
- [ ] Reusable EmptyState component (with icon, message, CTA)
- [ ] Reusable Modal component (with backdrop, close button, animations)
- [ ] Reusable Badge components (signal, status, role)
- [ ] Reusable Loader component (full-screen and inline)
- [ ] Inline Tailwind classes reduced 80%+

### AC-8: Responsive Design
- [ ] Mobile and desktop nav feature parity
- [ ] Touch targets 44×44px minimum
- [ ] Typography scales with viewport
- [ ] No horizontal scroll on any view
- [ ] Image grids adapt to mobile (1 column on small screens)
- [ ] Modals on mobile don't require external scroll

### AC-9: Accessibility
- [ ] All interactive elements have visible focus state (4px ring)
- [ ] Icon-only buttons have aria-label attributes
- [ ] Color contrast meets WCAG AA 4.5:1 (verified with axe or similar)
- [ ] Modals trap keyboard focus; Escape key closes
- [ ] Form fields linked to labels with htmlFor
- [ ] Headings follow h1 > h2 > h3 hierarchy
- [ ] Complex visualizations have alt text / descriptions

### AC-10: Performance & State Management
- [ ] ObservationDetail re-renders optimized (useMemo/useCallback for callbacks)
- [ ] Images use lazy loading (IntersectionObserver)
- [ ] Social state sync resolved (server-authoritative with local optimistic UI)
- [ ] isReviewerRole memoized (useCallback or useMemo)
- [ ] Detail page loads in <1s with 50+ comments
- [ ] No console warnings about missing dependencies

### AC-11: Error Handling & User Feedback
- [ ] Toast messages rate-limited (max 1 per 2 seconds)
- [ ] Error messages specific and actionable
- [ ] Failed API calls show retry button or auto-retry
- [ ] Inline validation errors shown immediately
- [ ] Network errors distinguished from API errors
- [ ] All async actions show loading state

### AC-12: Authentication & Authorization
- [ ] Session restoration uses subtle indicator (not full-screen loader unless first load)
- [ ] Role-based view access tested with different user roles
- [ ] Dropdown behavior consistent (click to open/close, or always close on blur)
- [ ] Auth state transitions don't miss updates

---

## 5. Correctness Properties

These properties must be true for the implementation to be correct:

1. **Design Token Compliance**: For all UI elements with color, spacing, or radius, there must exist a design token reference (no arbitrary Tailwind values).

2. **Navigation Invariant**: activeView must be protected before rendering corresponding component; no protected view renders before auth check.

3. **Tab State Persistence**: For pages with tabs (ObservationDetail, Dashboard), activeTab must survive navigation and refresh.

4. **Social State Consistency**: Like count and liked status must not diverge from server; optimistic updates must revert on error.

5. **Image Persistence**: All user-uploaded images must be persisted to storage before observation created; no data URIs in database.

6. **Touch Target Enforcement**: All clickable elements (buttons, links, interactive areas) must be ≥44×44px.

7. **Focus Trap**: When modal open, Tab key must cycle through modal elements only; Escape key must close modal.

8. **Accessibility**: All color-based status indicators must have text/icon backup; no information conveyed by color alone.

9. **Error Recovery**: All failed async operations must offer user a clear recovery path (retry, contact support, etc.).

10. **Performance Baseline**: ObservationDetail with 50+ comments must render in <1s on standard mobile device; no layout shift.

---

## 6. Out of Scope

The following are intentionally excluded from this spec:

- Backend API changes or data model modifications
- New features (likes, comments, follows) - assume these exist and focus on UI/UX
- Analytics or dashboards - treat as existing features
- Internationalization / translation
- Dark mode implementation (may be in future phase)
- Advanced image editing or filters
- Real-time updates / WebSocket connections
- Email notifications or digest features
- PWA offline capabilities

---

## 7. Success Metrics

**Quantitative:**
- 100% of design token compliance (audit report)
- 80%+ component reusability (classes extracted to components)
- 90%+ accessibility score (axe DevTools audit)
- <1s page load time for ObservationDetail (Lighthouse)
- 0 console errors/warnings on main flows

**Qualitative:**
- Designer feedback: "App looks cohesive"
- Mobile user feedback: "Easy to use on phone"
- Accessibility user: "Can navigate with keyboard"
- Reviewer feedback: "Evidence is easy to scan"

---

## 8. Next Steps

1. **Design Phase**: Create design token definitions and component library specs
2. **Implementation Phase A**: Extract reusable components (Button, Card, Modal, Badge, EmptyState)
3. **Implementation Phase B**: Fix navigation and view protection logic
4. **Implementation Phase C**: Refactor detail view (tabs, modal, redundant sections)
5. **Implementation Phase D**: Responsive and accessibility fixes
6. **QA & Testing**: Accessibility audit, responsive testing, performance benchmarks
7. **Deployment**: Staged rollout with monitoring

---

**Document prepared:** September 27, 2026  
**Next review:** After requirements approval and design phase
