# Design Reference - Clean Page Standards

**Reference Document:** Visual mockups showing target state for all 9 major pages

---

## Visual Standards Observed

### Key Principles from Reference Design:
1. **Minimal, purposeful layouts** - Every element has clear visual hierarchy
2. **Generous whitespace** - Content doesn't feel cramped or cluttered
3. **Consistent color themes** - Light theme vs Dark theme applied consistently
4. **Clear information zones** - Content organized into logical sections with visual separation
5. **Prominent CTAs** - Primary actions obvious and accessible
6. **Consistent typography** - Headings, body text, labels all predictable
7. **Icon + Text pairs** - Navigation and actions use combined icon/text for clarity
8. **Strategic use of color** - Signal colors (Normal/Watch/Investigate) applied with restraint
9. **Mobile-first spacing** - Padding/margins work on all screen sizes
10. **Readable contrast** - Dark themes maintain WCAG AA contrast

---

## Page-by-Page Standards

### 1. Landing Page (Light Theme)

**Layout:**
- Top navbar: Logo + nav items + search + Sign In button
- Hero section: Large hero image + headline + CTA + supporting text
- Recent observations grid: 4-column card layout with observer info
- Explore by region: Map section

**Cleanliness Markers:**
- ✅ Simple top-level navigation (Home, Map, Explore, Analytics, About)
- ✅ Single primary CTA ("Explore Waterways" button, prominent blue)
- ✅ Cards have clear hierarchy: image > title > observer > engagement
- ✅ No redundant information
- ✅ Generous padding around content sections
- ✅ Clear visual separation between regions (whitespace or light dividers)

**Current Issues Blocking This:**
- Navbar has too many nav items (Home, Feed, Map, Records, Data, Watershed, Reviews)
- Multiple CTAs compete for attention (Report button always visible)
- Footer/bottom nav create confusion on mobile

**Fixes Required:**
- Simplify public landing nav to: Home, Map, Explore, About, Sign In
- Hide "Report" button until user signs in
- Remove bottom nav from public surface

---

### 2. Login Page (Dark Theme)

**Layout:**
- Centered card with brand logo + heading + form fields + CTA
- Secondary links (forgot password, sign up) below

**Cleanliness Markers:**
- ✅ Single form with clear fields
- ✅ Prominent primary CTA (Sign In button, full-width blue)
- ✅ No navigation bar (distraction-free)
- ✅ Dark background with card contrast
- ✅ Minimal copy (no explanation, just fields)
- ✅ Alternative login obvious (Google button)

**Current Issues Blocking This:**
- AuthPage might have extra features or options
- Copy might be too verbose

**Fixes Required:**
- Verify AuthPage is minimal form only
- No background tabs or navigation
- Form fields clearly labeled
- Errors shown inline clearly

---

### 3. Capture Wizard (Light Theme)

**Layout:**
- Top progress bar: 4 steps with visual completion
- Left side: Location + Photo + Conditions tabs (or cards)
- Right side: Preview of current step with Next button
- Bottom: Back/Next buttons

**Cleanliness Markers:**
- ✅ Step indicator shows progress and completion
- ✅ Single column of input on left; preview on right (desktop)
- ✅ Clear primary CTA (Next button, blue)
- ✅ Form fields organized in logical groups
- ✅ Photo upload obvious with drag-drop indicator
- ✅ No extra navigation visible

**Current Issues Blocking This:**
- Multi-step forms may be showing all steps at once
- Back button might be unclear
- Image state complex (multiple thumbnails)
- Mobile version unclear

**Fixes Required:**
- Show only current step in focus
- Clear back/next navigation
- Photo upload centered with drop zone
- Mobile: Full-width step (no side-by-side preview)

---

### 4. Observation Detail (Dark Theme)

**Layout:**
- Top: Navbar with back button
- Hero: Large photo + signal badge + title + quick info
- Tabs below: Evidence, Location, Images, History
- Evidence tab (default): AI summary + key indicators + evidence items
- Right rail (desktop only): Suggested actions + share button
- Bottom: Comments section

**Cleanliness Markers:**
- ✅ Large hero image draws attention
- ✅ Signal badge immediately visible (colored, sized appropriately)
- ✅ Evidence scannable (bullet points, not dense paragraphs)
- ✅ Tabs clearly separated with underline indicator
- ✅ Comments nested below main content
- ✅ No redundant observer information visible at once
- ✅ Social actions (like/comment) in single bar, not scattered

**Current Issues Blocking This:**
- Analyst Attribution Card + Observation Source duplicate observer info
- Social bar has too many elements (like/comment/share/views/follow)
- Evidence section too dense (no clear hierarchy)
- Multiple images thumbnails might not be clear
- Tab state resets on navigation

**Fixes Required:**
- Consolidate observer info into single "Submitted By" card
- Separate engagement stats from social actions
- Reorganize evidence with hierarchy (key findings first)
- Clear image selection (primary + supporting angles)
- Persist tab state in URL
- Remove redundant sections

---

### 5. Community Feed (Light Theme)

**Layout:**
- Top: Navbar with search + filters + notifications
- Filter buttons: "All You" + Trending + Nearby
- Tag filter row: Categories (all, Normal, Watch, etc.)
- Feed: Card-based list of observations
- Each card: Thumbnail + title + signal + observer + engagement (like/comment/share)
- Bottom nav: Home, Map, Explore, Profile (mobile only)

**Cleanliness Markers:**
- ✅ Search prominent at top
- ✅ Filters simple and scannable (buttons, not dropdowns)
- ✅ Cards have clear image > content hierarchy
- ✅ Engagement metrics shown (not forced; not overwhelming)
- ✅ Each card is self-contained and not crowded
- ✅ No redundant information between cards

**Current Issues Blocking This:**
- Filters might be unclear (dropdown vs buttons)
- Card density might be too high
- Engagement metrics might be wrong or duplicated

**Fixes Required:**
- Simplify filter UI (button-based, not dropdowns)
- Space cards appropriately on mobile/desktop
- Show engagement counts clearly (like 25, comment 3, view 42)
- No duplicate observer/engagement info

---

### 6. Basin Map (Dark Theme)

**Layout:**
- Left sidebar: Filter controls (signal, watershed type, date range, tags)
- Main: Interactive map with observation markers (color-coded by signal)
- Map legend: Signal colors (Normal/Watch/Investigate) with counts
- Markers: Icon + label on hover
- Bottom-right: Observation details card when marker selected
- Mobile: Map full-screen with filters in drawer

**Cleanliness Markers:**
- ✅ Filter controls easy to access (sidebar, not overlay)
- ✅ Map uncluttered (markers color-coded, not overly dense)
- ✅ Legend clear and visible
- ✅ Selected observation card shows just essential info
- ✅ No navigation bar over map (only top navbar)

**Current Issues Blocking This:**
- Map might have redundant information
- Marker selection might trigger detail page (context lost)
- Filters might be unclear

**Fixes Required:**
- Sidebar filters simple and visible
- Map markers clustered appropriately
- Selected marker shows inline card (not full detail page)
- Maintain map state when scrolling

---

### 7. Watershed Analytics (Light Theme)

**Layout:**
- Top: Navbar + breadcrumb (Lake Victoria Basin > Health Index)
- Left sidebar: Metric cards (72% Health, Signal Trend, Key Metrics)
- Main: Charts (line graph, signal distribution, top locations)
- Right: Signal trend sparkline + Key Findings text

**Cleanliness Markers:**
- ✅ Sidebar metrics scannable at a glance
- ✅ Charts large and readable
- ✅ Legend visible and color-coded
- ✅ Whitespace between chart elements
- ✅ No overlapping labels or crowding

**Current Issues Blocking This:**
- Analytics might have too many charts
- Layout might not adapt to mobile

**Fixes Required:**
- Prioritize charts by importance
- Stack vertically on mobile (no side-by-side)
- Clear chart titles and labels

---

### 8. Reviewer Queue (Dark Theme)

**Layout:**
- Top: Navbar + Filter button
- Main: List of pending observations (3-column: photo, info, actions)
- Each row: Thumbnail | Signal + title + observer + AI summary | Verify/Flag/More buttons
- Status badge: "Pending" or signal type

**Cleanliness Markers:**
- ✅ Rows not cramped (good padding)
- ✅ Action buttons clear and obvious (Verify green, Flag amber)
- ✅ Observer and AI reasoning visible but not overwhelming
- ✅ Each row is self-contained

**Current Issues Blocking This:**
- Queue might show too much information per row
- Buttons might be unclear or small

**Fixes Required:**
- Ensure photo is clear thumbnail
- Signal badge prominent
- Action buttons clearly styled (not lost in text)
- Verify button green, Flag button amber (match design system)

---

### 9. Impact Dashboard (Green Palette)

**Layout:**
- Top: Navbar with "Platform Impact" title
- Main metrics: Platform Impact (2,348 observations), Health (1,204), Signals (320), Communities (74,100)
- Charts: Signal trend line + breakdown pie chart
- Text: "Your Contributions" with observer stats
- Bottom: "Together for cleaner, healthier waters" green banner

**Cleanliness Markers:**
- ✅ Metrics prominent and scannable (large numbers)
- ✅ Charts clear with legend
- ✅ Your Contributions section separate but related
- ✅ Green color palette consistent but not overwhelming
- ✅ Call-to-action banner at bottom

**Current Issues Blocking This:**
- Might have redundant metrics
- Layout might not adapt to mobile

**Fixes Required:**
- Metrics displayed in clear grid (2x2 or 1x4 mobile)
- Charts stacked on mobile
- Green accent color used consistently

---

## Color Palette Reference

From the mockups, three theme options are shown:

### Light Theme Primary
- Primary Blue: #0284C7 (bright, used for CTAs and highlights)
- Sky variants: #E0F2FE, #BAE6FD, #0EA5E9 (backgrounds, subtle accents)
- Neutral: Black text on white backgrounds

### Dark Theme Primary
- Primary Blue: #0284C7 (same, stands out on dark)
- Dark Background: #0F172A or similar (dark slate)
- Text: White/light gray on dark
- Accents: Teal/cyan for highlights

### Green Theme (Impact Dashboard)
- Primary Green: #16A34A or similar (vibrant but not neon)
- Light Green: #DCFCE7, #BBEF63 (backgrounds, accents)
- Neutral text on white background

### Signal Colors
- Normal (Green): #4CAF50 or similar
- Watch (Amber/Yellow): #F59E0B or #E9B44C
- Investigate (Coral/Red): #E76F51 or #EF4444

---

## Typography Hierarchy (from reference)

### Headings
- H1 (Page title): Large, bold, dark color
- H2 (Section title): Medium, bold
- H3 (Sub-section): Smaller, semi-bold
- Labels: Small, uppercase, muted color

### Body Text
- Regular: Standard size, dark gray/black on light, white/light gray on dark
- Small: Metadata (dates, counts, attribution)
- Captions: Image captions, subtle gray

### Interactive Text
- Links: Colored (match primary color), underline on hover
- Buttons: White text on colored background, no underline
- Labels on icons: Small text below or to the right

---

## Spacing Standards (from reference)

### Sections
- Page padding: 16px (mobile), 24-32px (desktop)
- Section gap: 24-32px (visible whitespace between sections)
- Content max-width: ~1200px (desktop), full width (mobile)

### Cards/Components
- Card padding: 16px (mobile), 24px (desktop)
- Gap between card items: 12-16px

### Forms
- Field gap: 16px between inputs
- Label-to-input: 8px

### Lists
- Item padding: 12-16px
- Item gap: 8-12px

---

## Key Takeaways for Refactoring

**Must-Do:**
1. ✅ Landing page: Simplify nav, hide Report CTA when logged out
2. ✅ Observation Detail: Remove redundant observer info, consolidate into single card
3. ✅ Social actions: Separate engagement stats from actions
4. ✅ Capture wizard: Show only current step, clear preview
5. ✅ Feed: Make filters button-based, not dropdowns
6. ✅ Map: Sidebar filters, inline selection card (not detail page)
7. ✅ Reviewer queue: Clear action buttons (colors match signal)
8. ✅ Analytics: Stack charts on mobile, clear titles
9. ✅ Dashboard: Large metrics, green accent color

**Design System Impact:**
- Colors must be consistent across themes (Light, Dark, Green)
- Spacing must follow 8px scale (no arbitrary padding)
- Typography must be semantic (H1/H2/H3, not font-size:32px)
- Components must adapt to mobile (not hide/show different features)

---

## Verification Checklist

For each page, verify:
- [ ] Single, clear primary CTA
- [ ] No redundant information visible at once
- [ ] Generous whitespace (not cramped)
- [ ] Consistent typography hierarchy
- [ ] Consistent color palette
- [ ] Adaptive layout (mobile/desktop use same content, not different features)
- [ ] All interactive elements clearly marked
- [ ] Metadata (dates, counts, labels) in muted color/small text
- [ ] No floating elements or overlays (except modals)
- [ ] Footer/nav consistent across pages

---

**Next Step:** Use this reference to guide component redesign and layout refactoring.
