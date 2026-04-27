// "use client";

// import { useState, useEffect } from "react";
// import { X, MessageCircle, Check } from "lucide-react";
// import { api } from "@/lib/api";
// import type { LifestyleProfile } from "@/components/roommates/roommate-data";
// import { TAG_SHORT_LABELS } from "@/components/roommates/roommate-data";
// import type { IndividualDetailResponse } from "@/types";

// interface Props {
//   profile: LifestyleProfile;
//   canInvite: boolean;
//   inviteReason?: string;
//   invited: boolean;
//   onInvite: () => Promise<void> | void;
//   onClose: () => void;
// }

// /* ── Enum → display label maps (mirror backend enums) ── */

// const SLEEP_LABEL: Record<string, string> = {
//   early_bird: "Early bird (asleep by 10 PM)",
//   night_owl: "Night owl (up past midnight)",
//   flexible: "Flexible schedule",
// };
// const CLEANLINESS_LABEL: Record<string, string> = {
//   very_tidy: "Very tidy — likes order",
//   reasonably_clean: "Reasonably clean",
//   relaxed: "Relaxed about mess",
// };
// const NOISE_LABEL: Record<string, string> = {
//   quiet: "Needs quiet",
//   moderate: "Moderate — normal volume",
//   loud: "Lively — music, friends over",
// };
// const GUESTS_LABEL: Record<string, string> = {
//   rarely: "Rarely has guests",
//   sometimes: "Guests on weekends",
//   often: "Often has people over",
// };
// const STUDY_LABEL: Record<string, string> = {
//   at_home: "Studies at home",
//   library: "Studies on campus / library",
//   mix: "Mix of home and library",
// };
// const SMOKING_LABEL: Record<string, string> = {
//   no_smoking: "Doesn't smoke or vape",
//   outside_only: "Smokes / vapes outside only",
//   i_smoke: "Smokes / vapes",
// };
// const PETS_LABEL: Record<string, string> = {
//   no_pets: "Prefers no pets",
//   fine_with_pets: "Fine with pets",
//   i_have_a_pet: "Has a pet",
// };
// const KITCHEN_LABEL: Record<string, string> = {
//   cook_daily: "Cooks daily",
//   few_times_week: "Cooks a few times a week",
//   takeout: "Mostly takeout / meal plan",
// };
// const GENDER_PREF_LABEL: Record<string, string> = {
//   same_gender: "Prefers same-gender housing",
//   mixed_gender: "Open to mixed-gender",
//   no_preference: "No gender preference",
// };
// const SEARCH_TYPE_LABEL: Record<string, string> = {
//   on_my_own: "Looking solo for a place",
//   have_friends: "Has friends, needs more roommates",
//   have_place: "Has a place, needs roommates",
// };
// const BUDGET_LABEL: Record<string, string> = {
//   under_500: "Under $500/mo",
//   "500_650": "$500–$650/mo",
//   "650_800": "$650–$800/mo",
//   "800_plus": "$800+/mo",
// };
// const TIMING_LABEL: Record<string, string> = {
//   fall_2026: "Fall 2026",
//   winter_2027: "Winter 2027",
//   summer_2026: "Summer 2026",
//   flexible: "Flexible move-in",
// };

// /* Each lifestyle category we want to render, with its label map */
// const LIFESTYLE_FIELDS: Array<{
//   key: keyof Pick<
//     IndividualDetailResponse,
//     | "sleep_schedule"
//     | "cleanliness"
//     | "noise_level"
//     | "guests"
//     | "study_habits"
//     | "smoking"
//     | "pets"
//     | "kitchen_use"
//   >;
//   heading: string;
//   map: Record<string, string>;
// }> = [
//   { key: "sleep_schedule", heading: "Sleep", map: SLEEP_LABEL },
//   { key: "cleanliness", heading: "Cleanliness", map: CLEANLINESS_LABEL },
//   { key: "noise_level", heading: "Noise", map: NOISE_LABEL },
//   { key: "guests", heading: "Guests", map: GUESTS_LABEL },
//   { key: "study_habits", heading: "Studying", map: STUDY_LABEL },
//   { key: "smoking", heading: "Smoking", map: SMOKING_LABEL },
//   { key: "pets", heading: "Pets", map: PETS_LABEL },
//   { key: "kitchen_use", heading: "Kitchen", map: KITCHEN_LABEL },
// ];

// export function IndividualDetailModal({
//   profile,
//   canInvite,
//   inviteReason,
//   invited,
//   onInvite,
//   onClose,
// }: Props) {
//   const [busy, setBusy] = useState(false);
//   const [detail, setDetail] = useState<IndividualDetailResponse | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch the rich profile when the modal opens
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       setLoading(true);
//       try {
//         const userId = parseInt(profile.id, 10);
//         if (!isNaN(userId)) {
//           const data = await api.roommates.getIndividual(userId);
//           if (!cancelled) setDetail(data);
//         }
//       } catch {
//         // 404 or 403 — fall back to the card-level data
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [profile.id]);

//   const handleInvite = async () => {
//     if (!canInvite || invited || busy) return;
//     setBusy(true);
//     try {
//       await onInvite();
//     } finally {
//       setBusy(false);
//     }
//   };

//   const tags = Object.entries(profile.tags).map(([_, v]) => TAG_SHORT_LABELS[v] || v);
//   const fallbackBudget =
//     profile.budget[1] >= 2000
//       ? `$${profile.budget[0]}+`
//       : `$${profile.budget[0]}–$${profile.budget[1]}`;

//   const budgetText = detail?.budget_range
//     ? BUDGET_LABEL[detail.budget_range] || fallbackBudget
//     : `${fallbackBudget}/mo`;
//   const timingText =
//     (detail?.roommate_timing && TIMING_LABEL[detail.roommate_timing]) ||
//     profile.moveIn ||
//     "Flexible";

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
//       <div className="relative w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#1B2D45]/45 hover:bg-[#1B2D45]/[0.05] transition-colors z-10"
//         >
//           <X className="w-4 h-4" />
//         </button>

//         {/* Header */}
//         <div className="flex items-center gap-3 mb-4">
//           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 overflow-hidden border border-[#1B2D45]/10 shrink-0">
//             {profile.avatar ? (
//               <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
//             ) : (
//               <div
//                 className="w-full h-full flex items-center justify-center"
//                 style={{ fontSize: "22px", fontWeight: 800, color: "#FF6B35" }}
//               >
//                 {profile.firstName[0]}
//               </div>
//             )}
//           </div>
//           <div className="min-w-0 flex-1">
//             <div className="flex items-center gap-2">
//               <h3 className="text-[#1B2D45]" style={{ fontSize: "18px", fontWeight: 800 }}>
//                 {profile.firstName} {profile.initial}
//               </h3>
//               {detail?.compatibility_score != null && (
//                 <span
//                   className="px-2 py-0.5 rounded-md"
//                   style={{
//                     fontSize: "10px",
//                     fontWeight: 800,
//                     background:
//                       detail.compatibility_score >= 80
//                         ? "rgba(74, 222, 128, 0.12)"
//                         : detail.compatibility_score >= 60
//                         ? "rgba(255, 182, 39, 0.14)"
//                         : "rgba(255, 107, 53, 0.12)",
//                     color:
//                       detail.compatibility_score >= 80
//                         ? "#16a34a"
//                         : detail.compatibility_score >= 60
//                         ? "#b27812"
//                         : "#FF6B35",
//                   }}
//                 >
//                   {detail.compatibility_score}% match
//                 </span>
//               )}
//             </div>
//             <p className="text-[#1B2D45]/45 mt-0.5" style={{ fontSize: "12px" }}>
//               {profile.year || detail?.year || "Student"}
//               {(profile.program || detail?.program) ? ` · ${profile.program || detail?.program}` : ""}
//             </p>
//           </div>
//         </div>

//         {/* Bio */}
//         {(profile.bio || detail?.bio) && (
//           <div className="mb-4">
//             <p
//               className="text-[#1B2D45]/35 mb-1"
//               style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}
//             >
//               About
//             </p>
//             <p className="text-[#1B2D45]/70" style={{ fontSize: "13px", lineHeight: 1.6 }}>
//               {profile.bio || detail?.bio}
//             </p>
//           </div>
//         )}

//         {/* Quick stats */}
//         <div className="grid grid-cols-2 gap-3 mb-4">
//           <div className="rounded-xl bg-[#FAF8F4] p-3">
//             <p
//               className="text-[#1B2D45]/35"
//               style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
//             >
//               Budget
//             </p>
//             <p className="text-[#1B2D45] mt-0.5" style={{ fontSize: "13px", fontWeight: 700 }}>
//               {budgetText}
//             </p>
//           </div>
//           <div className="rounded-xl bg-[#FAF8F4] p-3">
//             <p
//               className="text-[#1B2D45]/35"
//               style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
//             >
//               Move-in
//             </p>
//             <p className="text-[#1B2D45] mt-0.5" style={{ fontSize: "13px", fontWeight: 700 }}>
//               {timingText}
//             </p>
//           </div>
//         </div>

//         {/* Looking for / Gender pref */}
//         {detail && (detail.search_type || detail.gender_housing_pref) && (
//           <div className="mb-4 rounded-xl border border-black/[0.05] bg-white p-3">
//             <p
//               className="text-[#1B2D45]/35 mb-1.5"
//               style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}
//             >
//               Looking for
//             </p>
//             {detail.search_type && (
//               <p className="text-[#1B2D45]/75" style={{ fontSize: "12px", lineHeight: 1.55 }}>
//                 {SEARCH_TYPE_LABEL[detail.search_type] || detail.search_type}
//               </p>
//             )}
//             {detail.gender_housing_pref && (
//               <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "12px", lineHeight: 1.55 }}>
//                 {GENDER_PREF_LABEL[detail.gender_housing_pref] || detail.gender_housing_pref}
//               </p>
//             )}
//           </div>
//         )}

//         {/* Lifestyle breakdown */}
//         {loading ? (
//           <div className="mb-5 flex items-center justify-center py-6">
//             <div className="w-5 h-5 border-2 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
//           </div>
//         ) : detail && LIFESTYLE_FIELDS.some((f) => detail[f.key]) ? (
//           <div className="mb-5">
//             <p
//               className="text-[#1B2D45]/35 mb-2"
//               style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}
//             >
//               Lifestyle
//             </p>
//             <div className="space-y-1.5">
//               {LIFESTYLE_FIELDS.map((field) => {
//                 const value = detail[field.key];
//                 if (!value) return null;
//                 const label = field.map[value] || value;
//                 return (
//                   <div
//                     key={field.key}
//                     className="flex items-start justify-between gap-3 rounded-lg bg-[#FCFAF7] px-3 py-2"
//                   >
//                     <span className="text-[#1B2D45]/45 shrink-0" style={{ fontSize: "11px", fontWeight: 700 }}>
//                       {field.heading}
//                     </span>
//                     <span className="text-[#1B2D45]/80 text-right" style={{ fontSize: "12px", fontWeight: 600 }}>
//                       {label}
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         ) : tags.length > 0 ? (
//           <div className="mb-5">
//             <p
//               className="text-[#1B2D45]/35 mb-2"
//               style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}
//             >
//               Lifestyle
//             </p>
//             <div className="flex flex-wrap gap-1.5">
//               {tags.map((t) => (
//                 <span
//                   key={t}
//                   className="px-2.5 py-1 rounded-lg bg-[#FF6B35]/[0.06] text-[#FF6B35]/70 border border-[#FF6B35]/10"
//                   style={{ fontSize: "10px", fontWeight: 600 }}
//                 >
//                   {t}
//                 </span>
//               ))}
//             </div>
//           </div>
//         ) : null}

//         {/* Invite button */}
//         <button
//           onClick={handleInvite}
//           disabled={!canInvite || invited || busy}
//           title={!canInvite ? inviteReason : undefined}
//           className={`w-full py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
//             invited
//               ? "bg-[#4ADE80]/10 text-[#4ADE80] cursor-default"
//               : !canInvite || busy
//               ? "bg-[#1B2D45]/[0.06] text-[#1B2D45]/35 cursor-not-allowed"
//               : "bg-[#FF6B35] text-white hover:bg-[#e55e2e]"
//           }`}
//           style={{
//             fontSize: "13px",
//             fontWeight: 700,
//             boxShadow: !canInvite || invited || busy ? "none" : "0 2px 12px rgba(255,107,53,0.24)",
//           }}
//         >
//           {invited ? (
//             <>
//               <Check className="w-3.5 h-3.5" /> Invited
//             </>
//           ) : busy ? (
//             <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
//           ) : (
//             <>
//               <MessageCircle className="w-3.5 h-3.5" /> Invite to Group
//             </>
//           )}
//         </button>
//         {!canInvite && inviteReason && !invited && (
//           <p className="text-[#1B2D45]/35 text-center mt-2" style={{ fontSize: "11px" }}>
//             {inviteReason}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle, Check } from "lucide-react";
import { api } from "@/lib/api";
import type { LifestyleProfile } from "@/components/roommates/roommate-data";
import type { IndividualDetailResponse } from "@/types";
import {
  CATEGORY_STYLE,
  MATCH_STYLE,
  fullLabelFor,
  BUDGET_LABEL,
  TIMING_LABEL,
  GENDER_PREF_LABEL,
  SEARCH_TYPE_LABEL,
  type MatchStatus,
} from "@/lib/lifestyle-display";

interface Props {
  profile: LifestyleProfile;
  canInvite: boolean;
  inviteReason?: string;
  invited: boolean;
  onInvite: () => Promise<void> | void;
  onClose: () => void;
}

// Order in which lifestyle rows appear in the modal
const LIFESTYLE_FIELDS: Array<keyof Pick<
  IndividualDetailResponse,
  | "sleep_schedule" | "cleanliness" | "noise_level" | "guests"
  | "study_habits" | "smoking" | "pets" | "kitchen_use"
>> = [
  "sleep_schedule", "cleanliness", "noise_level", "guests",
  "study_habits", "smoking", "pets", "kitchen_use",
];

export function IndividualDetailModal({
  profile,
  canInvite,
  inviteReason,
  invited,
  onInvite,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<IndividualDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const userId = parseInt(profile.id, 10);
        if (!isNaN(userId)) {
          const data = await api.roommates.getIndividual(userId);
          if (!cancelled) setDetail(data);
        }
      } catch {
        // 404 / 403 — keep showing card-level data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile.id]);

  const handleInvite = async () => {
    if (!canInvite || invited || busy) return;
    setBusy(true);
    try {
      await onInvite();
    } finally {
      setBusy(false);
    }
  };

  const fallbackBudget =
    profile.budget[1] >= 2000
      ? `$${profile.budget[0]}+/mo`
      : `$${profile.budget[0]}–$${profile.budget[1]}/mo`;

  const budgetText =
    profile.budgetLabel ||
    (detail?.budget_range ? BUDGET_LABEL[detail.budget_range] : null) ||
    fallbackBudget;

  const timingText =
    profile.moveInLabel ||
    (detail?.roommate_timing && TIMING_LABEL[detail.roommate_timing]) ||
    profile.moveIn ||
    "Flexible";

  // How many lifestyle fields actually have values? Used to gate the section.
  const lifestyleRows = detail
    ? LIFESTYLE_FIELDS.filter((f) => detail[f]).map((f) => ({
        category: f as string,
        value: detail[f] as string,
        match: (detail.compatibility_breakdown?.[f] as MatchStatus | undefined) ?? null,
      }))
    : [];

  // Compatibility summary line: "You match on 5 of 8 lifestyle traits"
  let breakdownSummary: string | null = null;
  if (detail?.compatibility_breakdown) {
    const entries = Object.values(detail.compatibility_breakdown);
    const matches = entries.filter((s) => s === "match").length;
    const total = entries.length;
    if (total > 0) breakdownSummary = `You match on ${matches} of ${total} traits`;
  }

  const compatColor =
    detail?.compatibility_score == null
      ? null
      : detail.compatibility_score >= 80
      ? { bg: "rgba(74, 222, 128, 0.12)", text: "#16a34a" }
      : detail.compatibility_score >= 60
      ? { bg: "rgba(255, 182, 39, 0.14)", text: "#b27812" }
      : { bg: "rgba(255, 107, 53, 0.12)", text: "#FF6B35" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-0 shadow-2xl">
        {/* Header band — gradient background ties to brand without being loud */}
        <div
          className="relative px-6 pt-6 pb-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 107, 53, 0.06) 0%, rgba(99, 102, 241, 0.05) 100%)",
            borderBottom: "1px solid rgba(27,45,69,0.05)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#1B2D45]/45 hover:bg-white/70 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFB627]/20 overflow-hidden border-2 border-white shrink-0" style={{ boxShadow: "0 6px 18px rgba(27,45,69,0.10)" }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ fontSize: "22px", fontWeight: 800, color: "#FF6B35" }}>
                  {profile.firstName[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[#1B2D45]" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.01em" }}>
                {profile.firstName} {profile.initial}
              </h3>
              <p className="text-[#1B2D45]/55 mt-0.5" style={{ fontSize: "12px" }}>
                {profile.year || detail?.year || "Student"}
                {(profile.program || detail?.program) ? ` · ${profile.program || detail?.program}` : ""}
              </p>
              {detail?.compatibility_score != null && compatColor && (
                <div className="mt-2 inline-flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded-md"
                    style={{ fontSize: "10px", fontWeight: 800, background: compatColor.bg, color: compatColor.text }}
                  >
                    {detail.compatibility_score}% match
                  </span>
                  {breakdownSummary && (
                    <span className="text-[#1B2D45]/45" style={{ fontSize: "10px", fontWeight: 600 }}>
                      · {breakdownSummary}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Bio */}
          {(profile.bio || detail?.bio) && (
            <div className="mb-4">
              <p className="text-[#1B2D45]/35 mb-1" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                About
              </p>
              <p className="text-[#1B2D45]/70" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                {profile.bio || detail?.bio}
              </p>
            </div>
          )}

          {/* Quick stats — colored stripe accents on the left */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-white p-3 flex items-center gap-3" style={{ border: "1px solid rgba(27,45,69,0.06)", boxShadow: "0 4px 12px rgba(27,45,69,0.03)" }}>
              <div className="w-1 self-stretch rounded-full" style={{ background: CATEGORY_STYLE.budget_range.accent }} />
              <div className="min-w-0">
                <p className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Budget
                </p>
                <p className="text-[#1B2D45] mt-0.5" style={{ fontSize: "13px", fontWeight: 700 }}>{budgetText}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 flex items-center gap-3" style={{ border: "1px solid rgba(27,45,69,0.06)", boxShadow: "0 4px 12px rgba(27,45,69,0.03)" }}>
              <div className="w-1 self-stretch rounded-full" style={{ background: CATEGORY_STYLE.roommate_timing.accent }} />
              <div className="min-w-0">
                <p className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Move-in
                </p>
                <p className="text-[#1B2D45] mt-0.5" style={{ fontSize: "13px", fontWeight: 700 }}>{timingText}</p>
              </div>
            </div>
          </div>

          {/* Looking for / Gender pref */}
          {detail && (detail.search_type || detail.gender_housing_pref) && (
            <div className="mb-4 rounded-xl border border-black/[0.05] bg-[#FCFAF7] p-3">
              <p className="text-[#1B2D45]/35 mb-1.5" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Looking for
              </p>
              {detail.search_type && (
                <p className="text-[#1B2D45]/75" style={{ fontSize: "12px", lineHeight: 1.55 }}>
                  {SEARCH_TYPE_LABEL[detail.search_type] || detail.search_type}
                </p>
              )}
              {detail.gender_housing_pref && (
                <p className="text-[#1B2D45]/55 mt-1" style={{ fontSize: "12px", lineHeight: 1.55 }}>
                  {GENDER_PREF_LABEL[detail.gender_housing_pref] || detail.gender_housing_pref}
                </p>
              )}
            </div>
          )}

          {/* Lifestyle breakdown — colored accents + icons + match indicator */}
          {loading ? (
            <div className="mb-5 flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin" />
            </div>
          ) : lifestyleRows.length > 0 ? (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#1B2D45]/35" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Lifestyle
                </p>
                {detail?.compatibility_breakdown && (
                  <div className="flex items-center gap-2.5">
                    <LegendDot status="match" />
                    <LegendDot status="partial" />
                    <LegendDot status="differ" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                {lifestyleRows.map((row) => {
                  const style = CATEGORY_STYLE[row.category];
                  const Icon = style?.icon;
                  const matchStyle = row.match ? MATCH_STYLE[row.match] : null;
                  return (
                    <div
                      key={row.category}
                      className="relative rounded-xl bg-white pl-3 pr-3 py-2.5 overflow-hidden"
                      style={{ border: `1px solid ${style?.border ?? "rgba(27,45,69,0.05)"}` }}
                    >
                      {/* Left accent bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ background: style?.accent ?? "#1B2D45" }}
                      />
                      <div className="pl-2 flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: style?.bg ?? "rgba(27,45,69,0.05)", color: style?.text ?? "#1B2D45" }}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[#1B2D45]/45" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            {style?.label ?? row.category}
                          </p>
                          <p className="text-[#1B2D45] mt-0.5" style={{ fontSize: "12px", fontWeight: 600 }}>
                            {fullLabelFor(row.category, row.value)}
                          </p>
                        </div>
                        {matchStyle && (
                          <div
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: matchStyle.ring }}
                            title={matchStyle.label}
                          >
                            <span className="block w-2 h-2 rounded-full" style={{ background: matchStyle.dot }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Invite button */}
          <button
            onClick={handleInvite}
            disabled={!canInvite || invited || busy}
            title={!canInvite ? inviteReason : undefined}
            className={`w-full py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              invited
                ? "bg-[#4ADE80]/10 text-[#4ADE80] cursor-default"
                : !canInvite || busy
                ? "bg-[#1B2D45]/[0.06] text-[#1B2D45]/35 cursor-not-allowed"
                : "bg-[#FF6B35] text-white hover:bg-[#e55e2e]"
            }`}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: !canInvite || invited || busy ? "none" : "0 2px 12px rgba(255,107,53,0.24)",
            }}
          >
            {invited ? (
              <><Check className="w-3.5 h-3.5" /> Invited</>
            ) : busy ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <><MessageCircle className="w-3.5 h-3.5" /> Invite to Group</>
            )}
          </button>
          {!canInvite && inviteReason && !invited && (
            <p className="text-[#1B2D45]/35 text-center mt-2" style={{ fontSize: "11px" }}>
              {inviteReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Tiny legend used at the top of the lifestyle section
function LegendDot({ status }: { status: MatchStatus }) {
  const s = MATCH_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1" title={s.label}>
      <span className="block w-2 h-2 rounded-full" style={{ background: s.dot }} />
      <span className="text-[#1B2D45]/40" style={{ fontSize: "9px", fontWeight: 700 }}>
        {status === "match" ? "Match" : status === "partial" ? "Close" : "Differs"}
      </span>
    </span>
  );
}
