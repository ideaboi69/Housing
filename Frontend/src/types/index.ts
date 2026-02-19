// ═══════════════════════════════════════════════════════
// Types matching Backend Pydantic Schemas 1:1
// ═══════════════════════════════════════════════════════

// ── Enums ──────────────────────────────────────────────

export enum UserRole {
  STUDENT = "student",
  LANDLORD = "landlord",
  ADMIN = "admin",
}

export enum PropertyType {
  HOUSE = "house",
  APARTMENT = "apartment",
  TOWNHOUSE = "townhouse",
  ROOM = "room",
}

export enum LeaseType {
  EIGHT_MONTH = "8_month",
  TEN_MONTH = "10_month",
  TWELVE_MONTH = "12_month",
  FLEXIBLE = "flexible",
}

export enum GenderPreference {
  ANY = "any",
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum ListingStatus {
  ACTIVE = "active",
  RENTED = "rented",
  EXPIRED = "expired",
}

export enum FlagStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
}

// ── User ───────────────────────────────────────────────

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface RoleSwitch {
  role: UserRole;
  company_name?: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// ── Property ───────────────────────────────────────────

export interface PropertyResponse {
  id: number;
  landlord_id: number;
  title: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  property_type: PropertyType;
  total_rooms: number;
  bathrooms: number;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  estimated_utility_cost: number | null;
  distance_to_campus_km: number | null;
  walk_time_minutes: number | null;
  bus_time_minutes: number | null;
  nearest_bus_route: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  property_type: PropertyType;
  total_rooms: number;
  bathrooms: number;
  is_furnished?: boolean;
  has_parking?: boolean;
  has_laundry?: boolean;
  utilities_included?: boolean;
  estimated_utility_cost?: number;
  distance_to_campus_km?: number;
  walk_time_minutes?: number;
  bus_time_minutes?: number;
  nearest_bus_route?: string;
}

// ── Listing ────────────────────────────────────────────

export interface ListingResponse {
  id: number;
  property_id: number;
  rent_per_room: number;
  rent_total: number;
  lease_type: string;
  move_in_date: string;
  is_sublet: boolean;
  sublet_start_date: string | null;
  sublet_end_date: string | null;
  gender_preference: string | null;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingDetailResponse {
  id: number;
  rent_per_room: number;
  rent_total: number;
  lease_type: string;
  move_in_date: string;
  is_sublet: boolean;
  sublet_start_date: string | null;
  sublet_end_date: string | null;
  gender_preference: string | null;
  status: string;
  view_count: number;
  created_at: string;
  // property info
  property_id: number;
  title: string;
  address: string;
  property_type: string;
  total_rooms: number;
  bathrooms: number;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  estimated_utility_cost: number | null;
  distance_to_campus_km: number | null;
  walk_time_minutes: number | null;
  bus_time_minutes: number | null;
  // landlord info
  landlord_id: number;
  landlord_name: string;
  landlord_verified: boolean;
}

export interface ListingCreate {
  property_id: number;
  rent_per_room: number;
  rent_total: number;
  lease_type: LeaseType;
  move_in_date: string;
  is_sublet?: boolean;
  sublet_start_date?: string;
  sublet_end_date?: string;
  gender_preference?: GenderPreference;
}

export interface ListingFilters {
  price_min?: number;
  price_max?: number;
  property_type?: string;
  is_furnished?: boolean;
  has_parking?: boolean;
  has_laundry?: boolean;
  utilities_included?: boolean;
  distance_max?: number;
  lease_type?: string;
  is_sublet?: boolean;
  gender_preference?: string;
  move_in_before?: string;
  move_in_after?: string;
  status?: string;
  sort_by?: "rent_per_room" | "distance_to_campus_km" | "created_at";
  sort_order?: "asc" | "desc";
  skip?: number;
  limit?: number;
}

// ── Review ─────────────────────────────────────────────

export interface ReviewResponse {
  id: number;
  student_id: number;
  property_id: number;
  landlord_id: number;
  responsiveness: number;
  maintenance_speed: number;
  respect_privacy: number;
  fairness_of_charges: number;
  would_rent_again: boolean;
  comment: string | null;
  created_at: string;
}

export interface ReviewCreate {
  property_id: number;
  responsiveness: number;
  maintenance_speed: number;
  respect_privacy: number;
  fairness_of_charges: number;
  would_rent_again: boolean;
  comment?: string;
}

// ── Health Score ────────────────────────────────────────

export interface HealthScoreResponse {
  id: number;
  listing_id: number;
  price_vs_market_score: number | null;
  landlord_reputation_score: number | null;
  maintenance_score: number | null;
  lease_clarity_score: number | null;
  overall_score: number | null;
  created_at: string;
}

// ── Saved Listing ──────────────────────────────────────

export interface SavedListingResponse {
  id: number;
  student_id: number;
  listing_id: number;
  created_at: string;
}

export interface SavedListingDetailResponse {
  id: number;
  listing_id: number;
  saved_at: string;
  rent_per_room: number;
  rent_total: number;
  lease_type: string;
  move_in_date: string | null;
  is_sublet: boolean;
  status: string;
  title: string;
  address: string;
  property_type: string;
  is_furnished: boolean;
  has_parking: boolean;
  distance_to_campus_km: number | null;
}

// ── Flag ───────────────────────────────────────────────

export interface FlagCreate {
  listing_id?: number;
  review_id?: number;
  reason: string;
}

export interface FlagResponse {
  id: number;
  reporter_id: number;
  listing_id: number | null;
  review_id: number | null;
  reason: string;
  status: string;
  created_at: string;
}

// ── Landlord ───────────────────────────────────────────

export interface LandlordResponse {
  id: number;
  user_id: number;
  identity_verified: boolean;
  company_name: string | null;
  phone: string | null;
}

export interface LandlordPublicResponse {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string | null;
  identity_verified: boolean;
  avg_responsiveness: number | null;
  avg_maintenance_speed: number | null;
  avg_respect_privacy: number | null;
  avg_fairness_of_charges: number | null;
  would_rent_again_pct: number | null;
  total_reviews: number;
  total_properties: number;
}

// ── Listing Image ──────────────────────────────────────

export interface ListingImage {
  id: number;
  listing_id: number;
  image_url: string;
  display_order: number;
}
