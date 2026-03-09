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
    <div className="max-w-[900px] mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Skeleton className="h-3 w-40 mb-4" />
      {/* Image gallery */}
      <Skeleton className="w-full rounded-2xl mb-6" style={{ height: 340 }} />
      {/* Title + price */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {/* Amenities */}
      <Skeleton className="h-5 w-32 mb-3" />
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
      {/* Health score */}
      <Skeleton className="h-40 w-full rounded-2xl" />
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