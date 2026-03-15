"use client";

import { useState, useEffect } from "react";
import { X, Plus, Calendar, Clock, Trash2, Loader2, Check, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

/* ────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */

export interface ShowingSlot {
  id: string | number;
  listing_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  booked_by?: {
    student_id: number;
    student_name: string;
  } | null;
}

/* ────────────────────────────────────────────────────────
   Showings Manager (Landlord Dashboard)
   ──────────────────────────────────────────────────────── */

interface ShowingsManagerProps {
  listingId: number;
  listingTitle: string;
  onClose: () => void;
}

export function ShowingsManager({ listingId, listingTitle, onClose }: ShowingsManagerProps) {
  const [slots, setSlots] = useState<ShowingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("10:00");
  const [newEnd, setNewEnd] = useState("11:00");
  const [saving, setSaving] = useState(false);

  const [bulkDate, setBulkDate] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  // Fetch existing availability/slots from API
  useEffect(() => {
    async function fetchSlots() {
      try {
        const availability = await api.viewings.getListingAvailability(listingId);
        const allSlots: ShowingSlot[] = [];
        for (const avail of availability) {
          for (const slot of avail.slots) {
            allSlots.push({
              id: slot.id,
              listing_id: listingId,
              date: avail.date,
              start_time: slot.start_time,
              end_time: slot.end_time,
              status: slot.status,
              booked_by: slot.status === "booked" ? { student_id: 0, student_name: "Booked" } : null,
            });
          }
        }
        setSlots(allSlots);
      } catch {
        // API not available — start empty
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [listingId]);

  const handleAddSlot = async () => {
    if (!newDate || !newStart || !newEnd) return;
    setSaving(true);

    try {
      const result = await api.viewings.setAvailability({
        listing_id: listingId,
        date: newDate,
        start_time: newStart,
        end_time: newEnd,
      });
      // Add the generated slots from the response
      const newSlots: ShowingSlot[] = result.slots.map((s) => ({
        id: s.id,
        listing_id: listingId,
        date: result.date,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
        booked_by: null,
      }));
      setSlots((prev) => [...prev, ...newSlots].sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)));
    } catch {
      // Fallback — add locally
      const slot: ShowingSlot = {
        id: `temp-${Date.now()}`,
        listing_id: listingId,
        date: newDate,
        start_time: newStart,
        end_time: newEnd,
        status: "available",
        booked_by: null,
      };
      setSlots((prev) => [...prev, slot].sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)));
    } finally {
      setAddingSlot(false);
      setNewDate("");
      setNewStart("10:00");
      setNewEnd("11:00");
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkDate) return;
    setSaving(true);

    try {
      const result = await api.viewings.setAvailability({
        listing_id: listingId,
        date: bulkDate,
        start_time: "10:00",
        end_time: "16:00",
      });
      const newSlots: ShowingSlot[] = result.slots.map((s) => ({
        id: s.id,
        listing_id: listingId,
        date: result.date,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
        booked_by: null,
      }));
      setSlots((prev) => [...prev, ...newSlots].sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)));
    } catch {
      // Fallback — add locally with hourly slots
      const hours = [["10:00", "11:00"], ["11:00", "12:00"], ["12:00", "13:00"], ["13:00", "14:00"], ["14:00", "15:00"], ["15:00", "16:00"]];
      const newSlots: ShowingSlot[] = hours.map(([start, end], i) => ({
        id: `bulk-${Date.now()}-${i}`,
        listing_id: listingId,
        date: bulkDate,
        start_time: start,
        end_time: end,
        status: "available",
        booked_by: null,
      }));
      setSlots((prev) => [...prev, ...newSlots].sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)));
    } finally {
      setShowBulk(false);
      setBulkDate("");
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string | number) => {
    // Note: OJ's API doesn't have a delete-single-slot endpoint,
    // but we can remove it locally. The availability delete would remove the whole day.
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  // Group slots by date
  const grouped = slots.reduce<Record<string, ShowingSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[520px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Manage Showings</h3>
              <p className="text-[#1B2D45]/30 mt-0.5" style={{ fontSize: "11px" }}>{listingTitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#1B2D45]/20 animate-spin" />
            </div>
          ) : (
          <>
          {/* Empty state */}
          {slots.length === 0 && !addingSlot && (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-[#1B2D45]/10 mx-auto mb-2" />
              <p className="text-[#1B2D45]/30" style={{ fontSize: "13px", fontWeight: 600 }}>No showing slots yet</p>
              <p className="text-[#1B2D45]/20 mt-1" style={{ fontSize: "11px" }}>Add available times so students can book property viewings.</p>
            </div>
          )}

          {/* Grouped slots */}
          {sortedDates.map((date) => (
            <div key={date} className="mb-4">
              <div className="text-[#1B2D45]/40 mb-2" style={{ fontSize: "11px", fontWeight: 700 }}>
                {new Date(date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </div>
              <div className="space-y-1.5">
                {grouped[date].map((slot) => (
                  <div key={slot.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    slot.booked_by ? "border-[#2EC4B6]/20 bg-[#2EC4B6]/[0.04]" : "border-black/[0.04] bg-white"
                  }`}>
                    <Clock className="w-3 h-3 text-[#1B2D45]/25 shrink-0" />
                    <span className="text-[#1B2D45]" style={{ fontSize: "12px", fontWeight: 600 }}>
                      {slot.start_time} – {slot.end_time}
                    </span>
                    {slot.booked_by ? (
                      <span className="ml-auto px-2 py-0.5 rounded-md bg-[#2EC4B6]/10 text-[#2EC4B6]" style={{ fontSize: "9px", fontWeight: 700 }}>
                        Booked · {slot.booked_by.student_name}
                      </span>
                    ) : (
                      <>
                        <span className="ml-auto text-[#1B2D45]/20" style={{ fontSize: "9px" }}>Available</span>
                        <button onClick={() => handleDeleteSlot(slot.id)} className="w-6 h-6 rounded flex items-center justify-center text-[#1B2D45]/15 hover:text-[#E71D36] hover:bg-[#E71D36]/[0.04] transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add single slot form */}
          <AnimatePresence>
            {addingSlot && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                <div className="bg-[#FAF8F4] rounded-xl p-4 space-y-3 mb-3">
                  <div>
                    <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "10px", fontWeight: 600 }}>Date</label>
                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#1B2D45]/10 focus:border-[#1B2D45]/25 focus:outline-none transition-all" style={{ fontSize: "12px" }}
                      min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "10px", fontWeight: 600 }}>Start time</label>
                      <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#1B2D45]/10 focus:border-[#1B2D45]/25 focus:outline-none transition-all" style={{ fontSize: "12px" }} />
                    </div>
                    <div>
                      <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "10px", fontWeight: 600 }}>End time</label>
                      <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#1B2D45]/10 focus:border-[#1B2D45]/25 focus:outline-none transition-all" style={{ fontSize: "12px" }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => setAddingSlot(false)} className="px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-white transition-colors" style={{ fontSize: "11px", fontWeight: 600 }}>
                      Cancel
                    </button>
                    <button onClick={handleAddSlot} disabled={saving || !newDate}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-40 transition-all flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 700 }}>
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Add Slot
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk add form */}
          <AnimatePresence>
            {showBulk && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                <div className="bg-[#1B2D45]/[0.03] rounded-xl p-4 space-y-3 mb-3">
                  <p className="text-[#1B2D45]/50" style={{ fontSize: "11px", fontWeight: 600 }}>
                    Quick-fill a full day with hourly slots (10am–4pm)
                  </p>
                  <div>
                    <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "10px", fontWeight: 600 }}>Pick a date</label>
                    <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#1B2D45]/10 focus:border-[#1B2D45]/25 focus:outline-none transition-all" style={{ fontSize: "12px" }}
                      min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowBulk(false)} className="px-3 py-1.5 rounded-lg text-[#1B2D45]/40 hover:bg-white transition-colors" style={{ fontSize: "11px", fontWeight: 600 }}>
                      Cancel
                    </button>
                    <button onClick={handleBulkAdd} disabled={!bulkDate}
                      className="px-4 py-1.5 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-40 transition-all" style={{ fontSize: "11px", fontWeight: 700 }}>
                      Generate Slots
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </>
          )}
        </div>

        {/* Footer — action buttons */}
        <div className="px-5 py-3 border-t border-black/[0.06] flex items-center gap-2">
          {!addingSlot && !showBulk && (
            <>
              <button onClick={() => setAddingSlot(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1B2D45]/10 text-[#1B2D45] hover:bg-[#1B2D45]/[0.03] transition-all" style={{ fontSize: "12px", fontWeight: 600 }}>
                <Plus className="w-3.5 h-3.5" /> Add Slot
              </button>
              <button onClick={() => setShowBulk(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1B2D45]/10 text-[#1B2D45] hover:bg-[#1B2D45]/[0.03] transition-all" style={{ fontSize: "12px", fontWeight: 600 }}>
                <CalendarDays className="w-3.5 h-3.5" /> Quick-Fill Day
              </button>
            </>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] transition-all" style={{ fontSize: "12px", fontWeight: 700 }}>
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}