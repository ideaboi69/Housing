/* ════════════════════════════════════════════════════════
   Skeleton Loading Components
   Shared across browse, sublets, roommates, messages,
   and landlord dashboard.
   ════════════════════════════════════════════════════════ */

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#1B2D45]/[0.06] ${className}`}
      style={style}
    />
  );
}

/* ── Browse / Sublets listing card skeleton ── */

export function ListingCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "2.5px solid rgba(27,45,69,0.06)", boxShadow: "5px 5px 0px rgba(27,45,69,0.04)" }}
    >
      {/* Image placeholder */}
      <Skeleton className="w-full rounded-none" style={{ height: 180 }} />
      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Browse page grid skeleton ── */

export function BrowseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Roommate group card skeleton ── */

export function RoommateGroupSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: "2.5px solid rgba(27,45,69,0.06)", boxShadow: "5px 5px 0px rgba(27,45,69,0.04)" }}
    >
      {/* Banner */}
      <Skeleton className="w-full rounded-none" style={{ height: 70 }} />
      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        <div className="flex items-center -space-x-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-10 h-10 rounded-full border-[3px] border-white" />
          ))}
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function RoommateGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <RoommateGroupSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Message conversation list skeleton ── */

export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-xl">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/* ── Detail page skeleton (browse/[id] or sublets/[id]) ── */

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Back link */}
        <Skeleton className="h-3 w-32 mb-5" />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* ─── Main column ─── */}
          <div className="min-w-0 space-y-6">
            {/* Image gallery */}
            <Skeleton className="w-full rounded-2xl" style={{ height: 380 }} />
            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="rounded-lg shrink-0" style={{ width: 72, height: 72 }} />
              ))}
            </div>

            {/* Title + meta row */}
            <div className="space-y-3">
              <Skeleton className="h-7 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            </div>

            {/* Facts grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-black/[0.04] p-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>

            {/* Amenities section */}
            <div className="bg-white rounded-2xl border border-black/[0.04] p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Health score block */}
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>

          {/* ─── Sidebar ─── */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-white rounded-xl border border-black/[0.04] p-5 space-y-4">
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
              </div>
            </div>

            {/* Landlord card */}
            <div className="bg-white rounded-xl border border-black/[0.04] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>

            {/* Map */}
            <Skeleton className="w-full rounded-xl" style={{ height: 200 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Landlord dashboard overview skeleton ── */

export function LandlordOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ border: "2px solid rgba(27,45,69,0.04)" }}>
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      {/* Property cards */}
      <Skeleton className="h-5 w-36 mb-2" />
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 mb-3" style={{ border: "2px solid rgba(27,45,69,0.04)" }}>
          <div className="flex items-start gap-4">
            <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard skeleton (mirrors /dashboard layout) ── */

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-[1120px] px-4 py-8 md:px-6 md:py-10">
        {/* Header: title block + profile completeness chip */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-3 w-[420px] max-w-full" />
            <Skeleton className="h-3 w-[360px] max-w-full" />
          </div>
          <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3 space-y-2 w-full md:w-[220px]">
            <Skeleton className="h-3 w-32" />
            <div className="flex items-end gap-3">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/[0.04] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>

        {/* Two-column body */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {/* Section: Core Flows */}
            {[1, 2].map((section) => (
              <div key={section}>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-56 mb-3" />
                <div className="grid gap-3 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-black/[0.04] p-4 space-y-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* Right rail card */}
            <div className="bg-white rounded-2xl border border-black/[0.04] p-5 space-y-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-full" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-[#FAF8F4] px-4 py-3 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Message thread skeleton (right pane of /messages) ── */

export function MessageThreadSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.04] bg-white px-4 py-3 md:px-5">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Message bubbles */}
      <div className="relative flex-1 overflow-hidden px-4 py-4 md:px-5" style={{ background: "#FAF8F4" }}>
        <div className="space-y-4">
          {/* Date divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.06]" />
            <Skeleton className="h-3 w-16" />
            <div className="h-px flex-1 bg-black/[0.06]" />
          </div>
          {/* Incoming bubble */}
          <div className="flex">
            <Skeleton className="rounded-2xl rounded-tl-sm" style={{ width: "60%", height: 56 }} />
          </div>
          {/* Outgoing bubble */}
          <div className="flex justify-end">
            <Skeleton className="rounded-2xl rounded-tr-sm" style={{ width: "45%", height: 40 }} />
          </div>
          {/* Incoming bubble */}
          <div className="flex">
            <Skeleton className="rounded-2xl rounded-tl-sm" style={{ width: "70%", height: 72 }} />
          </div>
          {/* Outgoing bubble */}
          <div className="flex justify-end">
            <Skeleton className="rounded-2xl rounded-tr-sm" style={{ width: "55%", height: 56 }} />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-black/[0.04] bg-white px-4 py-3 md:px-5">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Landlord property detail skeleton ── */

export function LandlordPropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Header card */}
        <div className="mb-5 rounded-[20px] border border-[#1B2D45]/[0.06] bg-white p-5 space-y-5">
          <Skeleton className="h-3 w-32" />
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
          {/* Stat trio */}
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-[#FAF8F4] p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Listings list */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[#1B2D45]/[0.06] bg-white p-4">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Bubble feed skeleton (for /the-bubble when wired to API) ── */

export function BubbleFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-black/[0.04] p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          {/* Title */}
          <Skeleton className="h-5 w-4/5" />
          {/* Body lines */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          {/* Cover image placeholder (every other card) */}
          {i % 2 === 0 && <Skeleton className="w-full rounded-xl" style={{ height: 200 }} />}
          {/* Actions row */}
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <div className="flex-1" />
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Full-page loading wrapper ── */

export function PageLoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-[3px] border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
        <p className="text-[#1B2D45]/50 mt-3" style={{ fontSize: "13px", fontWeight: 500 }}>{message}</p>
      </div>
    </div>
  );
}