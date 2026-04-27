// Shared display helpers for roommate lifestyle data.
// Single source of truth for: enum → human label, category → color, category → icon.

import type { LucideIcon } from "lucide-react";
import {
  Moon, Sparkles, Volume2, Users as UsersIcon, BookOpen,
  Cigarette, PawPrint, ChefHat, DollarSign, Calendar,
} from "lucide-react";

/* ── Enum → display label maps (mirror backend enums) ── */

export const SLEEP_LABEL: Record<string, string> = {
  early_bird: "Early bird (asleep by 10 PM)",
  night_owl: "Night owl (up past midnight)",
  flexible: "Flexible schedule",
};
export const CLEANLINESS_LABEL: Record<string, string> = {
  very_tidy: "Very tidy — likes order",
  reasonably_clean: "Reasonably clean",
  relaxed: "Relaxed about mess",
};
export const NOISE_LABEL: Record<string, string> = {
  quiet: "Needs quiet",
  moderate: "Moderate — normal volume",
  loud: "Lively — music, friends over",
};
export const GUESTS_LABEL: Record<string, string> = {
  rarely: "Rarely has guests",
  sometimes: "Guests on weekends",
  often: "Often has people over",
};
export const STUDY_LABEL: Record<string, string> = {
  at_home: "Studies at home",
  library: "Studies on campus / library",
  mix: "Mix of home and library",
};
export const SMOKING_LABEL: Record<string, string> = {
  no_smoking: "Doesn't smoke or vape",
  outside_only: "Smokes / vapes outside only",
  i_smoke: "Smokes / vapes",
};
export const PETS_LABEL: Record<string, string> = {
  no_pets: "Prefers no pets",
  fine_with_pets: "Fine with pets",
  i_have_a_pet: "Has a pet",
};
export const KITCHEN_LABEL: Record<string, string> = {
  cook_daily: "Cooks daily",
  few_times_week: "Cooks a few times a week",
  takeout: "Mostly takeout / meal plan",
};
export const GENDER_PREF_LABEL: Record<string, string> = {
  same_gender: "Prefers same-gender housing",
  mixed_gender: "Open to mixed-gender",
  no_preference: "No gender preference",
};
export const SEARCH_TYPE_LABEL: Record<string, string> = {
  on_my_own: "Looking solo for a place",
  have_friends: "Has friends, needs more roommates",
  have_place: "Has a place, needs roommates",
};
export const BUDGET_LABEL: Record<string, string> = {
  under_500: "Under $500/mo",
  "500_650": "$500–$650/mo",
  "650_800": "$650–$800/mo",
  "800_plus": "$800+/mo",
};
export const TIMING_LABEL: Record<string, string> = {
  fall_2026: "Fall 2026",
  winter_2027: "Winter 2027",
  summer_2026: "Summer 2026",
  flexible: "Flexible move-in",
};

/* ── Short labels for the small card pills ── */

export const SLEEP_SHORT: Record<string, string> = {
  early_bird: "Early bird",
  night_owl: "Night owl",
  flexible: "Flexible sleep",
};
export const CLEANLINESS_SHORT: Record<string, string> = {
  very_tidy: "Very tidy",
  reasonably_clean: "Tidy-ish",
  relaxed: "Relaxed",
};
export const NOISE_SHORT: Record<string, string> = {
  quiet: "Quiet",
  moderate: "Moderate",
  loud: "Lively",
};
export const SMOKING_SHORT: Record<string, string> = {
  no_smoking: "Non-smoker",
  outside_only: "Smokes outside",
  i_smoke: "Smoker",
};
export const PETS_SHORT: Record<string, string> = {
  no_pets: "No pets",
  fine_with_pets: "Pet-friendly",
  i_have_a_pet: "Has a pet",
};

/* ── Per-category visual identity ── */

export interface CategoryStyle {
  label: string;        // human heading
  icon: LucideIcon;
  // Soft tints for pills + accent borders
  bg: string;           // background color (low alpha)
  text: string;         // text color (full saturation)
  border: string;       // border color (mid alpha)
  accent: string;       // solid accent for left bar
}

export const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  sleep_schedule: {
    label: "Sleep",
    icon: Moon,
    bg: "rgba(99, 102, 241, 0.08)",
    text: "#4F46E5",
    border: "rgba(99, 102, 241, 0.18)",
    accent: "#6366F1",
  },
  cleanliness: {
    label: "Cleanliness",
    icon: Sparkles,
    bg: "rgba(46, 196, 182, 0.08)",
    text: "#0D9488",
    border: "rgba(46, 196, 182, 0.20)",
    accent: "#2EC4B6",
  },
  noise_level: {
    label: "Noise",
    icon: Volume2,
    bg: "rgba(255, 182, 39, 0.10)",
    text: "#B27812",
    border: "rgba(255, 182, 39, 0.22)",
    accent: "#FFB627",
  },
  guests: {
    label: "Guests",
    icon: UsersIcon,
    bg: "rgba(255, 182, 39, 0.10)",
    text: "#B27812",
    border: "rgba(255, 182, 39, 0.22)",
    accent: "#FFB627",
  },
  study_habits: {
    label: "Studying",
    icon: BookOpen,
    bg: "rgba(99, 102, 241, 0.08)",
    text: "#4F46E5",
    border: "rgba(99, 102, 241, 0.18)",
    accent: "#6366F1",
  },
  smoking: {
    label: "Smoking",
    icon: Cigarette,
    bg: "rgba(231, 29, 54, 0.07)",
    text: "#C2185B",
    border: "rgba(231, 29, 54, 0.18)",
    accent: "#E71D36",
  },
  pets: {
    label: "Pets",
    icon: PawPrint,
    bg: "rgba(255, 107, 53, 0.08)",
    text: "#D54E1A",
    border: "rgba(255, 107, 53, 0.18)",
    accent: "#FF6B35",
  },
  kitchen_use: {
    label: "Kitchen",
    icon: ChefHat,
    bg: "rgba(46, 196, 182, 0.08)",
    text: "#0D9488",
    border: "rgba(46, 196, 182, 0.20)",
    accent: "#2EC4B6",
  },
  budget_range: {
    label: "Budget",
    icon: DollarSign,
    bg: "rgba(27, 45, 69, 0.05)",
    text: "#1B2D45",
    border: "rgba(27, 45, 69, 0.10)",
    accent: "#1B2D45",
  },
  roommate_timing: {
    label: "Move-in",
    icon: Calendar,
    bg: "rgba(27, 45, 69, 0.05)",
    text: "#1B2D45",
    border: "rgba(27, 45, 69, 0.10)",
    accent: "#1B2D45",
  },
};

/* ── Match-status visuals (compatibility breakdown) ── */

export type MatchStatus = "match" | "partial" | "differ";

export const MATCH_STYLE: Record<MatchStatus, { dot: string; ring: string; label: string }> = {
  match: { dot: "#16A34A", ring: "rgba(22, 163, 74, 0.16)", label: "You match" },
  partial: { dot: "#FFB627", ring: "rgba(255, 182, 39, 0.20)", label: "Close enough" },
  differ: { dot: "#94A3B0", ring: "rgba(148, 163, 176, 0.20)", label: "Different styles" },
};

/* ── Convenience: decode a per-category enum value to its short label ── */

export function shortLabelFor(category: string, value: string): string {
  switch (category) {
    case "sleep_schedule": return SLEEP_SHORT[value] || value;
    case "cleanliness": return CLEANLINESS_SHORT[value] || value;
    case "noise_level": return NOISE_SHORT[value] || value;
    case "smoking": return SMOKING_SHORT[value] || value;
    case "pets": return PETS_SHORT[value] || value;
    default: return value;
  }
}

export function fullLabelFor(category: string, value: string): string {
  switch (category) {
    case "sleep_schedule": return SLEEP_LABEL[value] || value;
    case "cleanliness": return CLEANLINESS_LABEL[value] || value;
    case "noise_level": return NOISE_LABEL[value] || value;
    case "guests": return GUESTS_LABEL[value] || value;
    case "study_habits": return STUDY_LABEL[value] || value;
    case "smoking": return SMOKING_LABEL[value] || value;
    case "pets": return PETS_LABEL[value] || value;
    case "kitchen_use": return KITCHEN_LABEL[value] || value;
    case "budget_range": return BUDGET_LABEL[value] || value;
    case "roommate_timing": return TIMING_LABEL[value] || value;
    case "gender_housing_pref": return GENDER_PREF_LABEL[value] || value;
    case "search_type": return SEARCH_TYPE_LABEL[value] || value;
    default: return value;
  }
}
