"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Phone, Mail, Building2, Check, Star, Users, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import type { LandlordPublicResponse } from "@/types";

/* ── Mock landlord profiles for demo ───────────── */

const MOCK_LANDLORDS: Record<number, {
  company_name: string | null;
  phone: string;
  email: string;
  total_reviews: number;
  total_properties: number;
  avg_rating: number;
  would_rent_again_pct: number;
}> = {
  1: {
    company_name: "Mitchell Property Management",
    phone: "(519) 555-0147",
    email: "sarah@mitchellpm.ca",
    total_reviews: 23,
    total_properties: 4,
    avg_rating: 4.2,
    would_rent_again_pct: 83,
  },
  2: {
    company_name: null,
    phone: "(519) 555-0281",
    email: "david.chen@gmail.com",
    total_reviews: 11,
    total_properties: 2,
    avg_rating: 3.8,
    would_rent_again_pct: 72,
  },
  3: {
    company_name: "Guelph Student Housing Co.",
    phone: "(519) 555-0399",
    email: "info@guelphstudenthomes.ca",
    total_reviews: 37,
    total_properties: 8,
    avg_rating: 4.5,
    would_rent_again_pct: 91,
  },
  4: {
    company_name: null,
    phone: "(519) 555-0412",
    email: "patel.rentals@outlook.com",
    total_reviews: 6,
    total_properties: 1,
    avg_rating: 3.5,
    would_rent_again_pct: 67,
  },
};

/* ── Component ─────────────────────────────────── */

interface LandlordContactCardProps {
  landlordId: number;
  landlordName: string;
  landlordVerified: boolean;
}

export function LandlordContactCard({
  landlordId,
  landlordName,
  landlordVerified,
}: LandlordContactCardProps) {
  const [profile, setProfile] = useState<LandlordPublicResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const data = await api.landlords.getPublicProfile(landlordId);
        if (!cancelled) setProfile(data);
      } catch {
        // API not available — we'll use mock/prop data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProfile();
    return () => { cancelled = true; };
  }, [landlordId]);

  // Use API data if available, fall back to mock data, then to props
  const mock = MOCK_LANDLORDS[landlordId];

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : landlordName;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isVerified = profile?.identity_verified ?? landlordVerified;
  const companyName = profile?.company_name ?? mock?.company_name ?? null;
  const phone = profile?.phone ?? mock?.phone ?? null;
  const email = profile?.email ?? mock?.email ?? null;

  const totalReviews = profile?.total_reviews ?? mock?.total_reviews ?? 0;
  const totalProperties = profile?.total_properties ?? mock?.total_properties ?? 0;

  const avgRating = profile && totalReviews > 0
    ? (
        ((profile.avg_responsiveness ?? 0) +
          (profile.avg_maintenance_speed ?? 0) +
          (profile.avg_respect_privacy ?? 0) +
          (profile.avg_fairness_of_charges ?? 0)) / 4
      ).toFixed(1)
    : mock?.avg_rating
      ? mock.avg_rating.toFixed(1)
      : null;

  const wouldRentAgain = profile?.would_rent_again_pct ?? mock?.would_rent_again_pct ?? null;

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-black/[0.04] p-5 animate-pulse"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1B2D45]/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[#1B2D45]/[0.06] rounded w-28" />
            <div className="h-2.5 bg-[#1B2D45]/[0.04] rounded w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white/90 backdrop-blur-xl rounded-xl border border-black/[0.04] p-5"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
    >
      {/* Section label */}
      <p className="text-[#1B2D45]/30 mb-3" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>
        LISTED BY
      </p>

      {/* Header — Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 flex items-center justify-center">
            <span className="text-[#FF6B35]" style={{ fontSize: "15px", fontWeight: 800 }}>
              {initials}
            </span>
          </div>
          {isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#4ADE80] flex items-center justify-center border-2 border-white">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[#1B2D45] truncate" style={{ fontSize: "14px", fontWeight: 700 }}>
            {displayName}
          </p>
          {companyName ? (
            <p className="text-[#1B2D45]/40 truncate flex items-center gap-1" style={{ fontSize: "11px" }}>
              <Building2 className="w-3 h-3 shrink-0" />
              {companyName}
            </p>
          ) : isVerified ? (
            <p className="text-[#4ADE80]" style={{ fontSize: "11px", fontWeight: 600 }}>
              Verified Landlord
            </p>
          ) : null}
        </div>
      </div>

      {/* Stats row */}
      {(totalReviews > 0 || totalProperties > 0) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-[#1B2D45]/[0.04]">
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#FFB627] text-[#FFB627]" />
              <span className="text-[#1B2D45]" style={{ fontSize: "13px", fontWeight: 700 }}>{avgRating}</span>
              <span className="text-[#1B2D45]/30" style={{ fontSize: "11px" }}>
                ({totalReviews})
              </span>
            </div>
          )}
          {totalProperties > 0 && (
            <div className="flex items-center gap-1 text-[#1B2D45]/40">
              <Users className="w-3 h-3" />
              <span style={{ fontSize: "11px" }}>
                {totalProperties} propert{totalProperties !== 1 ? "ies" : "y"}
              </span>
            </div>
          )}
          {wouldRentAgain !== null && wouldRentAgain !== undefined && totalReviews > 0 && (
            <div className={`flex items-center gap-1 ${wouldRentAgain >= 70 ? "text-[#4ADE80]" : "text-[#1B2D45]/40"}`}>
              <span style={{ fontSize: "11px", fontWeight: 600 }}>
                {Math.round(wouldRentAgain)}% would rent again
              </span>
            </div>
          )}
        </div>
      )}

      {/* Contact info */}
      {(phone || email) && (
        <div className="mt-3 pt-3 border-t border-[#1B2D45]/[0.04] space-y-2">
          {phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1B2D45]/[0.02] hover:bg-[#1B2D45]/[0.05] transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-[#2EC4B6]" />
              </div>
              <span className="text-[#1B2D45]/70 group-hover:text-[#1B2D45] transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {phone}
              </span>
              <ExternalLink className="w-3 h-3 text-[#1B2D45]/20 ml-auto shrink-0" />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1B2D45]/[0.02] hover:bg-[#1B2D45]/[0.05] transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-[#FF6B35]" />
              </div>
              <span className="text-[#1B2D45]/70 group-hover:text-[#1B2D45] transition-colors truncate" style={{ fontSize: "13px", fontWeight: 500 }}>
                {email}
              </span>
              <ExternalLink className="w-3 h-3 text-[#1B2D45]/20 ml-auto shrink-0" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}