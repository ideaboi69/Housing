# Dev Log — cribb Frontend

## February 19–20, 2026

### Session 1: Project Scaffold & Full Stack Wiring

---

**1. Project Setup**

Initialized Next.js 15 (App Router) with TypeScript, Tailwind CSS 4, and the cribb design system.

```
Frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Navbar
│   │   ├── globals.css             # Design tokens, cork-bg, scroll animations
│   │   ├── page.tsx                # Landing page (7 sections)
│   │   ├── browse/
│   │   │   ├── page.tsx            # Browse listings (Board/Grid/Map views)
│   │   │   └── [id]/page.tsx       # Listing detail page
│   │   ├── sublets/page.tsx        # Summer sublet marketplace
│   │   ├── roommates/page.tsx      # Placeholder
│   │   ├── demand-board/page.tsx   # Placeholder
│   │   └── (auth)/
│   │       ├── login/page.tsx      # Login form
│   │       └── signup/page.tsx     # Registration form
│   ├── components/
│   │   ├── Navbar.tsx              # Responsive nav with auth state
│   │   ├── AuthHydrator.tsx        # Zustand auth rehydration on mount
│   │   ├── browse/
│   │   │   ├── PolaroidCard.tsx    # Listing card with pushpins & tape
│   │   │   ├── SearchAndFilters.tsx # Sticky search bar + filter pills
│   │   │   ├── MapView.tsx         # Leaflet map integration
│   │   │   ├── MyPicksTray.tsx     # Desktop tray + mobile bottom sheet
│   │   │   └── MobileBottomTabs.tsx # Fixed bottom nav for mobile
│   │   └── ui/
│   │       ├── ScoreRing.tsx       # Animated SVG Cribb Score ring
│   │       └── BoardDecorations.tsx # Pushpin & tape strip SVGs
│   ├── hooks/index.ts              # useListing, useHealthScore, useReviews, useIsMobile
│   ├── lib/
│   │   ├── api.ts                  # Full API client (auth, listings, reviews, etc.)
│   │   ├── auth-store.ts           # Zustand auth store with JWT management
│   │   ├── mock-data.ts            # 6 mock listings + Cribb Scores for demo
│   │   └── utils.ts                # formatPrice, getScoreColor, date helpers
│   └── types/index.ts              # All TypeScript interfaces matching backend schemas
├── next.config.ts                   # Image domains for Unsplash
├── package.json                     # Next.js 15, React 19, Framer Motion, Leaflet, Zustand
└── tsconfig.json
```

**2. Design System**

Color palette:
- Primary orange: `#FF6B35`
- Off-white background: `#FAF8F4`
- Deep navy text: `#1B2D45`
- Success green: `#4ADE80`
- Alert red: `#E71D36`
- Teal accent: `#2EC4B6`
- Gold accent: `#FFB627`

Health score colors:
- 85+ → `#4ADE80` (green)
- 65–84 → `#FFB627` (amber)
- Below 65 → `#E71D36` (red)

**3. API Client — Complete**

Full typed API client in `lib/api.ts` matching every backend endpoint:

| Module | Methods |
|--------|---------|
| `api.auth` | `register()`, `login()`, `me()` |
| `api.listings` | `browse(filters)`, `detail(id)`, `create()`, `update()`, `delete()` |
| `api.reviews` | `list(filters)`, `create()`, `update()`, `delete()` |
| `api.healthScores` | `get(listingId)`, `compute(listingId)` |
| `api.saved` | `list()`, `save(id)`, `unsave(id)`, `check(id)` |
| `api.properties` | `list()`, `detail(id)`, `create()`, `update()`, `delete()` |

Key design decisions:
- Auto-attaches JWT from Zustand store to all authenticated requests
- Falls back to mock data when backend is unreachable
- All filter params properly typed matching backend's query params
- Response types match backend schemas exactly

**4. Auth System**

- Zustand store with `login()`, `logout()`, `setUser()`, `hydrate()` actions
- JWT stored in localStorage, attached via Authorization header
- `AuthHydrator` component calls `/api/users/me` on mount to rehydrate session
- Login/Signup pages with form validation and error handling
- Navbar shows auth state (Log in / Sign up vs user menu)

---

### Session 2: Landing Page (7 Sections)

Ported complete Figma mockup to `page.tsx`:

**Section 1 — Hero**
- Headline + subtext + dual CTA buttons
- 3-column scrolling photo mosaic (right side, desktop only)
- Column 1 scrolls up (25s), Column 2 down (28s), Column 3 up (32s)
- 6 real apartment photos per column from Unsplash
- Fade edges (top/bottom/left gradients)
- Two honest badge pills: "Built by UofG students" + "Cribb Score on every listing"
- No fake social proof metrics

**Section 2 — Neighborhood Map**
- Dark navy SVG map with 5 colored neighborhood zones
- Grid lines, roads, campus landmark
- Pulsing University of Guelph marker
- Zone labels with listing counts and avg rents

**Section 3 — Cribb Score Explainer**
- Side-by-side layout: left explanation, right live demo card
- Animated score ring at 87 with 4 sub-score progress bars
- Score legend with color-coded meanings

**Section 4 — How It Works**
- 3 step cards with colored icons
- Dashed connector arrows between steps

**Section 5 — Built By Students**
- Founder photos (David, OJ) with UoG badge
- Personal story paragraph

**Section 6 — Demand Board Preview**
- 3 student request cards with budgets, tags, and urgency

**Section 7 — Popular Listings**
- 4 listing preview cards with images, Cribb Score mini-rings, save hearts

**Section 8 — Footer**
- 4-column link layout with Cribb Score legend

---

### Session 3: Browse Page — Full Build

**Board View (default)**
- Polaroid-style cards with pushpins, tape strips, slight random rotations
- Cards grouped by distance: "Near Campus", "Stone Road Area", "South End & Beyond"
- Staggered vertical offsets per row for organic corkboard feel
- Cork board CSS background texture

**Grid View**
- Clean 4-column responsive grid (1/2/3/4 cols at breakpoints)
- No rotations, flat layout

**Map View**
- Leaflet integration with custom markers
- Health score color-coded pins

**View Toggle**
- Board / Grid / Map buttons with animated layoutId sliding indicator
- Framer Motion AnimatePresence for smooth view transitions

**Search & Filters (Sticky Glassmorphism)**
- Sticky position with `backdrop-blur-xl` glass effect
- Search input with clear button
- 7 quick filter pills with animated layoutId background that slides between selections
- Filters button (modal TBD)

**Stat Cards**
- 3 insight cards: Avg rent, New this week, 8-mo leases
- Animated number tickers that count up from 0 using Framer Motion springs

**My Picks Tray**
- Desktop: horizontal orange-bordered strip showing pinned listings
- Shows thumbnail placeholder, title, price, Cribb Score dot, remove button
- "Compare all" action button
- Count badge bounces on update via spring animation
- Mobile: bottom sheet drawer that slides up over blurred backdrop
- Drag handle, header with count, horizontal scrolling pick cards
- Empty state when no picks

**Mobile Bottom Tabs**
- Fixed bottom navigation: Browse, Map, Sublets, Saved, Profile
- Map tab switches view mode without navigating
- Saved tab opens picks bottom sheet
- Red badge count on Saved when picks > 0
- Glassmorphism background
- Safe area inset padding for notched phones

---

### Session 4: Listing Detail Page

**Staggered Entrance**
- `staggerChildren` cascades hero image, title, quick facts, and sidebar sequentially

**Main Content**
- Image placeholder with subtle shimmer animation
- Title + address with MapPin icon
- ScoreRing (size 56) with animated draw-in
- Quick facts grid: Type, Rooms, Lease, Move-in (staggered fade-up)
- Amenities checklist with Check/X icons
- Getting to Campus: walk time, bus time, distance
- Cribb Score Breakdown: 4 horizontal bars with staggered fill animations + emoji labels
- Student Reviews section with rating breakdowns and would-rent-again badges

**Sidebar (Glassmorphism)**
- `backdrop-blur-xl` sticky sidebar
- Price display (per room + total)
- Verified Landlord badge with pulsing green glow animation
- Landlord name
- Magnetic CTA button: follows cursor slightly, continuous diagonal shimmer
- Save Listing button with whileTap feedback
- View count + listed date

**Navigation**
- Back arrow nudges left 4px on hover via spring animation
- Loading state with pulsing circle
- Error state with back link

---

### Session 5: Framer Motion Upgrade — "Living Product" Pass

Applied micro-interactions and motion across all components:

**ScoreRing**
- SVG arc draws from 0→score via spring `strokeDashoffset` when scrolled into view
- Number counts up in sync via `useSpring`
- `immediate` prop for cards already visible
- Adapts stroke width based on ring size (3/4/8px)

**PolaroidCard**
- Spring-driven hover: cards lift 12px, straighten to 0° rotation, scale to 1.02
- `stiffness: 300, damping: 24` for snappy feel
- Shadow transitions from flat to elevated on hover
- Image shimmer gradient sweeps across on hover
- Heart button pops on save with scale keyframe
- Popular badge springs in with delay
- Pin button has whileTap scale feedback
- Cards fade-up on mount

**BrowsePage View Transitions**
- `AnimatePresence mode="wait"` wraps board/grid/map
- Fast 0.15s opacity transitions (no blur — was causing blank space)
- Sections animate in immediately (removed `whileInView` that caused blank content)
- Loading exit is 0.1s so mock data appears instantly

---

### Session 6: Sublets Page — Full Build

Ported complete Figma sublet marketplace:

**Summer Banner**
- Gradient strip: "Summer 2026 Sublet Season — Listings go fast"

**Hero**
- Title + description + "List Your Sublet" toggle button

**Insight Stats**
- 4-card grid: 24 available, 28% avg savings, 18 furnished, 16 verified

**List Your Sublet Form**
- Collapsible with AnimatePresence (spring height animation)
- Address input, price input with $ prefix
- "Available from" and "Available until" dropdowns
- Checkbox toggles: Furnished, Utilities, Parking, Roommates Staying
- Post Sublet CTA

**Date Range Selector**
- "I need a place" label with 5 clickable month pills (May–Sep)
- Orange fill spans selected range with rounded endpoints
- Shows duration count "(3 months)"
- Click to expand/contract range

**Filter Bar**
- 6 filter pills: Furnished, Negotiable, Verified, Private Room, Entire Place, Parking
- Live count of available listings updates as filters change

**Timeline Legend**
- Orange = available in your dates, gray = not available

**Sublet Cards (6 listings)**
- Polaroid style with pushpins and tape strips
- Health score ring + discount badge ("↓ 24% off" in teal)
- Landlord Approved / Student poster badges
- Neighborhood tag
- 5-month availability timeline bar (orange where dates overlap search selection)
- Sublet price with original crossed out
- Flexibility badges: Price Negotiable, Flexible Dates, Furnished
- Roommate info box with count and description
- Distance, walk time, beds available
- Amenity tags
- View/save counts + score label (Great Match / Good Option / Review First)
- Hover lift animation with spring physics

**Empty State**
- "No sublets match those dates" with suggestion to expand date range

**Bottom CTA**
- "Leaving Guelph for the summer?" with list button

**Filtering Logic**
- Filters by date overlap (any month in selected range must be available)
- Stacks with all filter pills (furnished, negotiable, verified, private/entire, parking)

---

### Bug Fixes

- **Blank browse page**: Removed `filter: "blur(4px)"` from view transitions and `whileInView` from sections — CSS blur on large containers caused visible white flash, and `whileInView` made sections wait to be scrolled before appearing
- **Runtime error on sublets**: Fixed framer-motion transform conflict — `style={{ transform: rotate() }}` conflicted with `whileHover`. Moved rotation to `initial`/`animate` props so framer-motion owns the transform lifecycle
- **Hero social proof**: Removed fake "Trusted by 2,400+ students" and avatar stack. Replaced with honest UofG badges
- **Hero silhouette**: Removed campus silhouette SVG, replaced with 3-column scrolling photo mosaic
- **Founders image**: Fixed broken reference after removing unused `avatarUrls` array
- **Next.js image domains**: Added Unsplash to `next.config.ts` allowed domains
- **Transition timing**: Cut view transition duration from 0.3s to 0.15s, loading exit from default to 0.1s

---

### Platform Status — Frontend

| Page | Status | Notes |
|------|--------|-------|
| Landing Page | ✅ Complete | 7 sections, photo mosaic, all Figma-matched |
| Browse Page | ✅ Complete | Board/Grid/Map, picks tray, mobile tabs, animations |
| Listing Detail | ✅ Complete | Staggered entrance, magnetic CTA, animated scores |
| Sublets | ✅ Complete | Date picker, filters, availability timelines, list form |
| Roommates | 🔲 Placeholder | Hinge-style profiles planned |
| Demand Board | 🔲 Placeholder | Student request cards planned |
| Auth (Login/Signup) | ✅ Complete | Forms + Zustand JWT flow |

### Up Next

- **Roommates Page** — Hinge-style profile cards with lifestyle compatibility matching
- **Demand Board Page** — Student housing request posts with budget/tags
- **Real listing images** — Replace placeholder emoji with ListingImage URLs from backend
- **Filter modal** — Expand "Filters" button to show price sliders, amenity checkboxes, lease type dropdown
- **Wire filters to API** — Connect SearchAndFilters quick pills to actual `api.listings.browse()` params
- **Landlord dashboard** — `/landlord` routes for property/listing management
- **Deploy** — Vercel for frontend, Railway for backend