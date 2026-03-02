"use client";

import { useState } from "react";
import { X, Calendar, DollarSign, Loader2, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { ListingResponse } from "@/types";

interface EditListingModalProps {
  listing: ListingResponse;
  onClose: () => void;
  onSaved: (updated: ListingResponse) => void;
}

export function EditListingModal({ listing, onClose, onSaved }: EditListingModalProps) {
  const [rent, setRent] = useState(listing.rent_per_room.toString());
  const [rentTotal, setRentTotal] = useState(listing.rent_total.toString());
  const [moveInDate, setMoveInDate] = useState(listing.move_in_date?.split("T")[0] ?? "");
  const [leaseType, setLeaseType] = useState(listing.lease_type);
  const [status, setStatus] = useState(listing.status);
  const [genderPref, setGenderPref] = useState(listing.gender_preference ?? "any");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await api.listings.update(listing.id, {
        rent_per_room: parseFloat(rent),
        rent_total: parseFloat(rentTotal),
        move_in_date: moveInDate || undefined,
        lease_type: leaseType,
        status: status as "active" | "inactive",
        gender_preference: genderPref === "any" ? null : genderPref,
      });
      setSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-[#f3f3f5] border border-transparent focus:border-[#1B2D45]/20 focus:bg-white focus:outline-none transition-all";

  function PillGroup({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt.key} type="button" onClick={() => onChange(opt.key)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              value === opt.key
                ? "border-[#1B2D45]/25 bg-[#1B2D45]/[0.06] text-[#1B2D45]"
                : "border-black/[0.06] text-[#1B2D45]/35 hover:border-[#1B2D45]/15"
            }`}
            style={{ fontSize: "11px", fontWeight: value === opt.key ? 600 : 500 }}>
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[460px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h3 className="text-[#1B2D45]" style={{ fontSize: "16px", fontWeight: 800 }}>Edit Listing</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1B2D45]/30 hover:text-[#1B2D45] hover:bg-[#1B2D45]/[0.04] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Rent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
                <DollarSign className="w-3 h-3 inline mr-0.5" />Rent per room
              </label>
              <input type="number" value={rent} onChange={(e) => setRent(e.target.value)} className={inputCls} style={{ fontSize: "13px" }} />
            </div>
            <div>
              <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>Total rent</label>
              <input type="number" value={rentTotal} onChange={(e) => setRentTotal(e.target.value)} className={inputCls} style={{ fontSize: "13px" }} />
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <label className="text-[#1B2D45]/40 block mb-1" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Calendar className="w-3 h-3 inline mr-0.5" />Preferred move-in date
            </label>
            <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className={inputCls} style={{ fontSize: "13px" }} />
          </div>

          {/* Lease Type */}
          <div>
            <label className="text-[#1B2D45]/40 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Lease type</label>
            <PillGroup
              value={leaseType}
              onChange={setLeaseType}
              options={[
                { key: "12_months", label: "12 months" },
                { key: "8_months", label: "8 months" },
                { key: "4_months", label: "4 months" },
                { key: "month_to_month", label: "Month-to-month" },
              ]}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[#1B2D45]/40 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Status</label>
            <PillGroup
              value={status}
              onChange={setStatus}
              options={[
                { key: "active", label: "🟢 Active" },
                { key: "inactive", label: "⏸️ Inactive" },
                { key: "leased", label: "✅ Leased" },
              ]}
            />
          </div>

          {/* Gender Preference */}
          <div>
            <label className="text-[#1B2D45]/40 block mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>Gender preference</label>
            <PillGroup
              value={genderPref}
              onChange={setGenderPref}
              options={[
                { key: "any", label: "Any" },
                { key: "female", label: "Female only" },
                { key: "male", label: "Male only" },
              ]}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-[#E71D36]" style={{ fontSize: "12px" }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[#1B2D45]/40 hover:bg-[#1B2D45]/[0.04] transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || success}
            className="px-5 py-2 rounded-lg bg-[#1B2D45] text-white hover:bg-[#152438] disabled:opacity-50 transition-all flex items-center gap-1.5"
            style={{ fontSize: "13px", fontWeight: 700 }}>
            {success ? <><Check className="w-4 h-4" /> Saved</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}