"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ViewingBookingResponse } from "@/types";

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/**
 * Landlord's confirmed upcoming showings across all listings. Hides itself when
 * there are none, so it only appears when there's something to act on.
 */
export function UpcomingShowings() {
  const [bookings, setBookings] = useState<ViewingBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.viewings
      .getLandlordUpcoming()
      .then((b) => { if (!cancelled) setBookings(b); })
      .catch(() => { if (!cancelled) setBookings([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this showing? The student will be notified.")) return;
    setCancelling(id);
    try {
      await api.viewings.landlordCancel(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      /* leave it in place on failure */
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-[#1B2D45]/[0.08] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#FF6B35]" />
        <h2 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 600 }}>Upcoming showings</h2>
        {bookings.length > 0 && (
          <span className="rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-[#FF6B35]" style={{ fontSize: "11px", fontWeight: 600 }}>{bookings.length}</span>
        )}
      </div>
      {bookings.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#1B2D45]/12 px-4 py-6 text-center">
          <p className="text-[#1B2D45]/60" style={{ fontSize: "13px", fontWeight: 600 }}>No upcoming showings</p>
          <p className="mt-1 text-[#1B2D45]/40" style={{ fontSize: "12px" }}>
            When a student books a confirmed viewing on one of your listings, it&apos;ll appear here.
          </p>
        </div>
      )}
      <div className="space-y-2">
        {bookings.map((b) => (
          <div key={b.id} className="flex flex-col gap-2 rounded-xl border border-[#1B2D45]/[0.06] bg-[#FAF8F4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[#1B2D45]" style={{ fontSize: "14px", fontWeight: 600 }}>{b.student_name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[#1B2D45]/55" style={{ fontSize: "12px" }}>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(b.date)}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtTime(b.start_time)}–{fmtTime(b.end_time)}</span>
                <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{b.listing_title}</span></span>
              </div>
            </div>
            <button
              onClick={() => handleCancel(b.id)}
              disabled={cancelling === b.id}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E71D36]/20 px-2.5 py-1.5 text-[#E71D36]/80 transition-all hover:bg-[#E71D36]/5 disabled:opacity-50"
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              {cancelling === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Cancel
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
