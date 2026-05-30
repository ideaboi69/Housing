/* ════════════════════════════════════════════════════════
   Roommate Types, Constants & Compatibility Engine
   ════════════════════════════════════════════════════════ */

export interface LifestyleProfile {
  id: string;
  firstName: string;
  initial: string;
  year: string;
  program: string;
  budget: [number, number];
  moveIn: string;
  leaseLength: string;
  bio: string;
  tags: Record<string, string>;
  compatibility?: number;
  gender?: string;
  avatar?: string;
  isEarlyAdopter?: boolean;
  budgetLabel?: string;
  moveInLabel?: string;
 cardCategoryTags?: Array<{ category: string; label: string }>;
}

export interface GroupHousing {
  status: "linked" | "pending";
  linkedListingId?: number;
  linkedListingTitle?: string;
  linkedListingAddress?: string;
  linkedListingPrice?: number;
  linkedListingUtilitiesIncluded?: boolean;
  linkedListingScore?: number;
  linkedListingImage?: string;
  selfReportedAddress?: string;
  selfReportedRent?: number;
  selfReportedUtilitiesIncluded?: boolean;
  selfReportedPhotos?: string[];
  landlordInviteUrl?: string;
}

export interface RoommateGroup {
  id: string;
  name: string;
  createdBy: string;
  members: LifestyleProfile[];
  groupSize: number;
  spotsNeeded: number;
  budgetMin: number;
  budgetMax: number;
  preferredArea: string | null;
  targetListingId: number | null;
  targetListingTitle: string | null;
  description: string;
  inviteCode: string;
  isVisible: boolean;
  genderPreference: string | null;
  moveIn: string;
  createdAt: string;
  housing?: GroupHousing;
  bannerGradient?: string;
  groupImage?: string;
}

export interface GroupRequest {
  id: string;
  groupId: string;
  userId: string;
  profile: LifestyleProfile;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

/* ── Lifestyle categories for the quiz ── */

export const LIFESTYLE_CATEGORIES = [
  { key: "sleep", label: "Sleep Schedule", emoji: "🌙", options: ["Early Bird (before 10pm)", "Night Owl (after midnight)", "Flexible"] },
  { key: "cleanliness", label: "Cleanliness", emoji: "✨", options: ["Very Tidy", "Reasonably Clean", "Relaxed"] },
  { key: "noise", label: "Noise Level", emoji: "🔊", options: ["Quiet — I need silence", "Moderate — music at a normal volume", "Loud — I play music / have people over"] },
  { key: "guests", label: "Guests", emoji: "👥", options: ["Rarely / Never", "Sometimes (weekends)", "Often — I'm social"] },
  { key: "study", label: "Study Habits", emoji: "📚", options: ["Study at home", "Library / campus mostly", "Mix of both"] },
  { key: "smoking", label: "Smoking / Vaping", emoji: "🚭", options: ["No smoking at all", "Outside only", "I smoke / vape"] },
  { key: "pets", label: "Pets", emoji: "🐾", options: ["No pets please", "I'm fine with pets", "I have a pet"] },
  { key: "cooking", label: "Kitchen Use", emoji: "🍳", options: ["I cook daily", "A few times a week", "Mostly takeout / meal plan"] },
];

export const TAG_SHORT_LABELS: Record<string, string> = {
  "Early Bird (before 10pm)": "Early Bird",
  "Night Owl (after midnight)": "Night Owl",
  "Flexible": "Flexible",
  "Very Tidy": "Very Clean",
  "Reasonably Clean": "Relaxed Clean",
  "Relaxed": "Easy Going",
  "Quiet — I need silence": "Quiet",
  "Moderate — music at a normal volume": "Moderate Noise",
  "Loud — I play music / have people over": "Social",
  "Rarely / Never": "Quiet Space",
  "Sometimes (weekends)": "Social",
  "Often — I'm social": "Very Social",
  "Study at home": "Studious",
  "Library / campus mostly": "Campus Studier",
  "Mix of both": "Flexible",
  "No smoking at all": "Non-Smoker",
  "Outside only": "Outside Smoker",
  "I smoke / vape": "Smoker",
  "No pets please": "No Pets",
  "I'm fine with pets": "Pet Friendly",
  "I have a pet": "Has Pet",
  "I cook daily": "Cooks Often",
  "A few times a week": "Cooks Sometimes",
  "Mostly takeout / meal plan": "Takeout",
};

export const BUDGET_OPTIONS = [
  { label: "Under $500", range: [0, 500] as [number, number] },
  { label: "$500–$650", range: [500, 650] as [number, number] },
  { label: "$650–$800", range: [650, 800] as [number, number] },
  { label: "$800+", range: [800, 2000] as [number, number] },
];

export const MOVE_IN_OPTIONS = ["Fall 2026", "Winter 2027", "Summer 2026", "Flexible"];
export const GENDER_HOUSING_OPTIONS = ["Mixed gender fine", "Same gender preferred", "No preference"];

/* ── Compatibility Engine ── */

export function computeCompatibility(
  myTags: Record<string, string>,
  theirTags: Record<string, string>,
  myBudget: [number, number],
  theirBudget: [number, number]
): number {
  let score = 0;
  let total = 0;
  const weights: Record<string, number> = { sleep: 3, cleanliness: 3, noise: 2, guests: 2, smoking: 3, study: 1, pets: 2, cooking: 1 };

  for (const key of Object.keys(weights)) {
    const w = weights[key];
    total += w;
    if (myTags[key] === theirTags[key]) {
      score += w;
    } else {
      const cat = LIFESTYLE_CATEGORIES.find((c) => c.key === key);
      if (cat) {
        const myIdx = cat.options.indexOf(myTags[key]);
        const theirIdx = cat.options.indexOf(theirTags[key]);
        if (myIdx >= 0 && theirIdx >= 0 && Math.abs(myIdx - theirIdx) === 1) score += w * 0.5;
      }
    }
  }

  total += 2;
  const overlap = Math.min(myBudget[1], theirBudget[1]) - Math.max(myBudget[0], theirBudget[0]);
  if (overlap > 0) score += 2;
  else if (Math.abs(myBudget[0] - theirBudget[0]) <= 100) score += 1;

  return Math.round((score / total) * 100);
}

/* Group compatibility = average across all members */
export function computeGroupCompatibility(
  myTags: Record<string, string>,
  myBudget: [number, number],
  members: LifestyleProfile[]
): number {
  if (members.length === 0) return 0;
  const scores = members.map((m) => computeCompatibility(myTags, m.tags, myBudget, m.budget));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/* ── Mock Profiles ── */

export const MOCK_PROFILES: LifestyleProfile[] = [
  { id: "r1", firstName: "Alex", initial: "T.", year: "3rd year", program: "Computer Science", budget: [500, 650], moveIn: "Fall 2026", leaseLength: "8-month", bio: "Looking for a chill roommate for a 2BR near campus. I'm pretty quiet during the week but love going out on weekends.", tags: { sleep: "Night Owl (after midnight)", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Sometimes (weekends)", study: "Mix of both", smoking: "No smoking at all", pets: "I'm fine with pets", cooking: "I cook daily" }, gender: "male", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", isEarlyAdopter: true },
  { id: "r2", firstName: "Jordan", initial: "K.", year: "2nd year", program: "Business Administration", budget: [650, 800], moveIn: "Fall 2026", leaseLength: "12-month", bio: "Transfer student looking for a clean, organized living situation. I keep to myself mostly but enjoy the occasional movie night.", tags: { sleep: "Early Bird (before 10pm)", cleanliness: "Very Tidy", noise: "Quiet — I need silence", guests: "Rarely / Never", study: "Library / campus mostly", smoking: "No smoking at all", pets: "No pets please", cooking: "A few times a week" }, gender: "male", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
  { id: "r3", firstName: "Sam", initial: "W.", year: "4th year", program: "Engineering", budget: [500, 650], moveIn: "Fall 2026", leaseLength: "8-month", bio: "Social butterfly who loves hosting. Looking for roommates who are cool with people coming over. I'll cook for the house!", tags: { sleep: "Night Owl (after midnight)", cleanliness: "Reasonably Clean", noise: "Moderate — music at a normal volume", guests: "Often — I'm social", study: "Study at home", smoking: "Outside only", pets: "I'm fine with pets", cooking: "Mostly takeout / meal plan" }, gender: "male", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face", isEarlyAdopter: true },
];

/* ── Mock Groups ── */

export const MOCK_GROUPS: RoommateGroup[] = [
  {
    id: "g1", name: "CompSci Boys", createdBy: "r4",
    members: [MOCK_PROFILES[0], MOCK_PROFILES[1], MOCK_PROFILES[2]],
    groupSize: 4, spotsNeeded: 1,
    budgetMin: 550, budgetMax: 750,
    preferredArea: "South End", targetListingId: 3, targetListingTitle: "4BR House on Edinburgh Rd",
    description: "3 girls looking for 1 more to fill our 4-bedroom on Edinburgh. We're all pretty tidy, quiet during the week but love a movie night on weekends. Cat-friendly!",
    inviteCode: "EDIN2026", isVisible: true, genderPreference: "Same gender preferred", moveIn: "Fall 2026",
    createdAt: "2026-02-15",
    housing: {
      status: "linked",
      linkedListingId: 3,
      linkedListingTitle: "4BR House on Edinburgh Rd",
      linkedListingAddress: "87 Edinburgh Rd S, Guelph, ON",
      linkedListingPrice: 690,
      linkedListingUtilitiesIncluded: false,
      linkedListingScore: 86,
      linkedListingImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
    bannerGradient: "linear-gradient(135deg, #FF6B35 0%, #FFB627 100%)", groupImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop",
  },
];

const ROOMMATE_GROUPS_STORAGE_KEY = "cribb_roommate_groups";

function canUseLocalStorage() {
  return typeof window !== "undefined";
}

function isRoommateGroup(value: unknown): value is RoommateGroup {
  if (!value || typeof value !== "object") return false;
  const group = value as Partial<RoommateGroup>;
  return typeof group.id === "string" && typeof group.name === "string" && typeof group.inviteCode === "string";
}

export function loadStoredRoommateGroups(): RoommateGroup[] {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = localStorage.getItem(ROOMMATE_GROUPS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isRoommateGroup);
  } catch {
    return [];
  }
}

function saveStoredRoommateGroups(groups: RoommateGroup[]) {
  if (!canUseLocalStorage()) return;

  try {
    localStorage.setItem(ROOMMATE_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    /* ignore quota/storage errors */
  }
}

export function upsertStoredRoommateGroup(group: RoommateGroup) {
  const existing = loadStoredRoommateGroups();
  const next = [group, ...existing.filter((item) => item.id !== group.id)];
  saveStoredRoommateGroups(next);
}

export function removeStoredRoommateGroup(id: string) {
  const existing = loadStoredRoommateGroups();
  const next = existing.filter((item) => item.id !== id);

  if (next.length === existing.length) return false;

  saveStoredRoommateGroups(next);
  return true;
}

export function getStoredRoommateGroupByOwner(ownerId: string) {
  return loadStoredRoommateGroups().find((group) => group.createdBy === ownerId);
}

export function getAllRoommateGroups() {
  return [...loadStoredRoommateGroups(), ...MOCK_GROUPS];
}

export function getVisibleRoommateGroups() {
  return getAllRoommateGroups().filter((group) => group.isVisible);
}

export function getRoommateGroupById(id: string) {
  return getAllRoommateGroups().find((group) => group.id === id);
}

export function getRoommateGroupByInviteCode(code: string) {
  return getAllRoommateGroups().find((group) => group.inviteCode === code);
}