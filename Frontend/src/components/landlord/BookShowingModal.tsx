"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Check, Loader2, CalendarDays, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

/* ────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */

interface ShowingSlot {
  id: string | number;
  listing_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

/* ────────────────────────────────────────────────────────
   Mock data — fallback when backend is not connected
   ──────────────────────────────────────────────────────── */

function getMockSlots(listingId: number): ShowingSlot[] {
  const today = new Date();
  const slots: ShowingSlot[] = [];

  for (let d = 1; d <= 5; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0) continue;

    const dateStr = date.toISOString().split("T")[0];
    const times = d % 2 === 0
      ? [["10:00", "11:00"], ["11:00", "12:00"], ["14:00", "15:00"], ["15:00", "16:00"]]
      : [["11:00", "12:00"], ["13:00", "14:00"], ["15:00", "16:00"]];

    times.forEach(([start, end], i) => {
      slots.push({
        id: `mock-${d}-${i}`,
        listing_id: listingId,
        date: dateStr,
        start_time: start,
        end_time: end,
        status: (d === 2 && i === 0) ? "booked" : "available",
      });
    });
  }

  return slots;
}

/* ────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */

interface BookShowingModalProps {
  listingId: number;
  listingTitle: string;
  landlordName: string;
  onClose: () => void;
}

export function BookShowingModal({ listingId, listingTitle, landlordName, onClose }: BookShowingModalProps) {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<ShowingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | number | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await api.viewings.getAvailableSlots(listingId);
        setSlots(res.map((s) => ({ ...s, id: s.id, listing_id: listingId })));
      } catch {
        // Fallback to mock data
        await new Promise((r) => setTimeout(r, 400));
        setSlots(getMockSlots(listingId));
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [listingId]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);

    try {
      const slotId = Number(selectedSlot);
      if (!isNaN(slotId)) {
        await api.viewings.bookSlot({ slot_id: slotId });
      } else {
        // Mock slot (string id) — simulate booking
        await new Promise((r) => setTimeout(r, 600));
      }
      setBooked(true);
    } catch { /* fail */ }
    finally { setBooking(false); }
  };

  // Only show available (unbooked) slots
  const availableSlots = slots.filter((s) => s.status === "available");

  // Group by date
  const grouped = availableSlots.reduce<Record<string, ShowingSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Book a Showing</h3>
              <p className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "11px" }}>{listingTitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[55vh] overflow-y-auto">
          {/* Booked success state */}
          {booked ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-[#4ADE80]" />
              </div>
              <h4 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 700 }}>Showing Booked!</h4>
              <p className="text-[#1B2D45]/40 mt-1" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                {landlordName} will be expecting you. You&apos;ll receive a confirmation message.
              </p>
              {selectedSlot && (() => {
                const slot = slots.find(s => s.id === selectedSlot);
                if (!slot) return null;
                return (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF8F4]">
                    <Calendar className="w-3.5 h-3.5 text-[#1B2D45]/30" />
                    <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {new Date(slot.date + "T12:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <Clock className="w-3.5 h-3.5 text-[#1B2D45]/30" />
                    <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#1B2D45]/20 animate-spin" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-2" />
              <p className="text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>No available times</p>
              <p className="text-[#1B2D45]/20 mt-1 max-w-[280px] mx-auto" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                The landlord hasn&apos;t set up showing times yet. Try contacting them directly.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[#1B2D45]/30 mb-4" style={{ fontSize: "11px" }}>
                Pick a time that works for you. {landlordName} will confirm the showing.
              </p>

              {sortedDates.map((date) => (
                <div key={date} className="mb-4">
                  <div className="text-[#1B2D45]/40 mb-2 flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 700 }}>
                    <Calendar className="w-3 h-3" />
                    {new Date(date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grouped[date].map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`px-3 py-2 rounded-lg border transition-all ${
                          selectedSlot === slot.id
                            ? "border-[#FF6B35] bg-[#FF6B35]/[0.06] text-[#FF6B35]"
                            : "border-black/[0.06] text-[#1B2D45]/50 hover:border-[#1B2D45]/20 hover:text-[#1B2D45]"
                        }`}
                        style={{ fontSize: "12px", fontWeight: selectedSlot === slot.id ? 700 : 500 }}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        {slot.start_time} – {slot.end_time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {!booked && availableSlots.length > 0 && (
          <div className="px-5 py-3 border-t border-black/[0.06] flex items-center justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
              Cancel
            </button>
            <button onClick={handleBook} disabled={!selectedSlot || booking}
              className="px-5 py-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-40 transition-all flex items-center gap-1.5"
              style={{ fontSize: "13px", fontWeight: 700, boxShadow: selectedSlot ? "0 4px 16px rgba(255,107,53,0.25)" : undefined }}>
              {booking ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : "Confirm Showing"}
            </button>
          </div>
        )}

        {booked && (
          <div className="px-5 py-3 border-t border-black/[0.06] flex justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all" style={{ fontSize: "13px", fontWeight: 700 }}>
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}