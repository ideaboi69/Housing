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
  // Landlord-specific (populated when role === "landlord")
  identity_verified?: boolean;
  company_name?: string | null;
  phone?: string | null;
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
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  property_type: PropertyType;
  total_rooms: number;
  bathrooms: number;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  estimated_utility_cost: number;
  distance_to_campus_km: number;
  walk_time_minutes: number;
  drive_time_minutes: number;
  bus_time_minutes: number;
  nearest_bus_route: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  title: string;
  address: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  property_type: PropertyType;
  total_rooms: number;
  bathrooms: number;
  is_furnished?: boolean;
  has_parking?: boolean;
  has_laundry?: boolean;
  utilities_included?: boolean;
  estimated_utility_cost: number;
  distance_to_campus_km: number;
  walk_time_minutes: number;
  drive_time_minutes: number;
  bus_time_minutes: number;
  nearest_bus_route: string;
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
  latitude?: number | null;
  longitude?: number | null;
  property_type: string;
  total_rooms: number;
  bathrooms: number;
  // ── Standard Amenities (consistent across listings & sublets) ──
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  pet_friendly?: boolean;
  has_air_conditioning?: boolean;
  has_wifi?: boolean;
  has_dishwasher?: boolean;
  has_gym?: boolean;
  has_elevator?: boolean;
  has_backyard?: boolean;
  has_balcony?: boolean;
  smoking_allowed?: boolean;
  wheelchair_accessible?: boolean;
  // ──────────────────────────────────────────────────────────────
  estimated_utility_cost: number | null;
  distance_to_campus_km: number | null;
  walk_time_minutes: number | null;
  bus_time_minutes: number | null;
  // landlord info
  landlord_id: number;
  landlord_name: string;
  landlord_verified: boolean;
  // engagement
  save_count?: number;
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
}

// ── Cribb Score ────────────────────────────────────────

export interface CribbScoreResponse {
  id: number;
  listing_id: number;
  price_vs_market_score: number | null;
  landlord_reputation_score: number | null;
  maintenance_score: number | null;
  lease_clarity_score: number | null;
  overall_score: number | null;
  created_at: string;
}

// Temporary compatibility alias while older imports are migrated.
export type HealthScoreResponse = CribbScoreResponse;

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
  sublet_id?: number | null;
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

// ── Sublet ─────────────────────────────────────────────

export enum SubletRoomType {
  SHARED = "shared",
  PRIVATE = "private",
}

export enum SubletStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  RENTED = "rented",
  EXPIRED = "expired",
  REMOVED = "removed",
}

export interface SubletImageResponse {
  id: number;
  image_url: string;
  is_primary: boolean;
}

export interface SubletCreate {
  title: string;
  address: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_to_campus_km: number;
  walk_time_minutes: number;
  drive_time_minutes: number;
  bus_time_minutes: number;
  nearest_bus_route: string;
  room_type: SubletRoomType | "private" | "shared";
  total_rooms: number;
  bathrooms: number;
  is_furnished?: boolean;
  has_parking?: boolean;
  has_laundry?: boolean;
  utilities_included?: boolean;
  estimated_utility_cost: number;
  rent_per_month: number;
  sublet_start_date: string;
  sublet_end_date: string;
  move_in_date: string;
  gender_preference?: GenderPreference | null;
  description?: string | null;
}

export interface SubletResponse {
  id: number;
  user_id: number;
  title: string;
  address: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_to_campus_km: number;
  walk_time_minutes: number;
  drive_time_minutes: number;
  bus_time_minutes: number;
  nearest_bus_route: string;
  room_type: SubletRoomType;
  total_rooms: number;
  bathrooms: number;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  utilities_included: boolean;
  estimated_utility_cost: number;
  rent_per_month: number;
  sublet_start_date: string;
  sublet_end_date: string;
  move_in_date: string;
  gender_preference?: GenderPreference | null;
  status: SubletStatus;
  view_count: number;
  description?: string | null;
  images: SubletImageResponse[];
  posted_by: string;
  created_at: string;
  updated_at: string;
}

export interface SubletListResponse {
  id: number;
  title: string;
  address: string;
  rent_per_month: number;
  sublet_start_date: string;
  sublet_end_date: string;
  room_type: SubletRoomType;
  total_rooms: number;
  is_furnished: boolean;
  distance_to_campus_km: number;
  walk_time_minutes: number;
  drive_time_minutes: number;
  bus_time_minutes: number;
  nearest_bus_route: string;
  status: SubletStatus;
  primary_image?: string | null;
  images: SubletImageResponse[];
  posted_by: string;
  created_at: string;
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
  email?: string | null;
  phone?: string | null;
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

// ── Writer ─────────────────────────────────────────────

export enum WriterStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  REVOKED = "revoked",
}

export interface WriterRegister {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_type?: string;
  website?: string;
  phone?: string;
  reason: string;
}

export interface WriterResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  business_name: string;
  business_type?: string;
  website?: string;
  phone?: string;
  status: WriterStatus;
  created_at: string;
}

export interface WriterTokenResponse {
  access_token: string;
  writer: WriterResponse;
}

// ── Post (The Bubble) ──────────────────────────────────

export enum PostStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum PostCategory {
  EVENT = "event",
  DEAL = "deal",
  NEWS = "news",
  LIFESTYLE = "lifestyle",
  FOOD = "food",
  OTHER = "other",
}

export interface PostCreate {
  title: string;
  content: string;
  preview?: string;
  category: PostCategory;
  event_date?: string;
  event_location?: string;
  event_link?: string;
  deal_expires?: string;
}

export interface PostUpdate {
  title?: string;
  content?: string;
  preview?: string;
  category?: PostCategory;
  status?: PostStatus;
  event_date?: string;
  event_location?: string;
  event_link?: string;
  deal_expires?: string;
}

export interface PostResponse {
  id: number;
  title: string;
  slug: string;
  content: string;
  preview?: string;
  cover_image_url?: string;
  category: PostCategory;
  author_name: string;
  author_type: string;
  status: PostStatus;
  view_count: number;
  event_date?: string;
  event_location?: string;
  event_link?: string;
  deal_expires?: string;
  created_at: string;
  updated_at: string;
}

export interface PostListResponse {
  id: number;
  title: string;
  slug: string;
  preview?: string;
  cover_image_url?: string;
  category: PostCategory;
  author_name: string;
  author_type: string;
  status: PostStatus;
  view_count: number;
  event_date?: string;
  deal_expires?: string;
  created_at: string;
}

// ── Messages / Conversations ───────────────────────────

export enum SenderType {
  STUDENT = "student",
  LANDLORD = "landlord",
}

export interface StartConversation {
  listing_id: number;
  content: string;
}

export interface MessageCreate {
  content: string;
}

export interface MessageResponse {
  id: number;
  conversation_id: number;
  sender_type: SenderType;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationResponse {
  id: number;
  listing_id: number;
  listing_title: string;
  user_id: number;
  user_name?: string;
  landlord_id: number;
  landlord_name: string;
  created_at: string;
  updated_at: string;
  last_message?: MessageResponse;
  unread_count: number;
}

export interface ConversationDetailResponse {
  id: number;
  listing_id: number;
  listing_title: string;
  user_id: number;
  user_name: string;
  landlord_id: number;
  landlord_name: string;
  messages: MessageResponse[];
}

// ── Showings / Calendar Booking ────────────────────────

export enum ShowingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export interface ShowingSlot {
  id: number;
  listing_id: number;
  date: string; // "2026-03-15"
  start_time: string; // "14:00"
  end_time: string; // "14:30"
  is_booked: boolean;
}

export interface ShowingRequest {
  listing_id: number;
  slot_id: number;
  message?: string;
}

export interface ShowingResponse {
  id: number;
  listing_id: number;
  listing_title: string;
  student_id: number;
  student_name: string;
  landlord_id: number;
  landlord_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: ShowingStatus;
  message?: string;
  created_at: string;
}

export interface ShowingSlotCreate {
  listing_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface ShowingSlotBulkCreate {
  listing_id: number;
  dates: string[];
  time_slots: { start_time: string; end_time: string }[];
}

// ── Viewing Types (aligned with backend) ──────────────

export interface ViewingSlotResponse {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "cancelled";
}

export interface ViewingAvailabilityResponse {
  id: number;
  listing_id: number;
  date: string;
  start_time: string;
  end_time: string;
  slots: ViewingSlotResponse[];
  created_at: string;
}

export interface ViewingBookingResponse {
  id: number;
  slot_id: number;
  listing_id: number;
  student_id: number;
  student_name: string;
  landlord_id: number;
  landlord_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled_by_student" | "cancelled_by_landlord" | "completed";
  notes?: string;
  listing_title: string;
  listing_address: string;
  created_at: string;
}

export interface ViewingAvailabilityCreate {
  listing_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface ViewingBookingCreate {
  slot_id: number;
  notes?: string;
}

// ── Roommate Types (aligned with backend) ─────────────

export interface RoommateQuizSubmit {
  sleep_schedule: string;
  cleanliness: string;
  noise_level: string;
  guests: string;
  study_habits: string;
  smoking: string;
  pets: string;
  kitchen_use: string;
  budget_range: string;
  roommate_timing: string;
  gender_housing_pref: string;
  search_type: string;
  roommates_needed?: number;
}

export interface RoommateProfileResponse {
  id: number;
  user_id: number;
  is_visible: boolean;
  sleep_schedule?: string;
  cleanliness?: string;
  noise_level?: string;
  guests?: string;
  study_habits?: string;
  smoking?: string;
  pets?: string;
  kitchen_use?: string;
  budget_range?: string;
  roommate_timing?: string;
  gender_housing_pref?: string;
  search_type?: string;
  roommates_needed?: number;
  lifestyle_tags: string[];
  quiz_completed: boolean;
  created_at: string;
}

export interface ProfileCompletionCheck {
  is_complete: boolean;
  fields: Record<string, string | null>;
  missing_fields: string[];
}

export interface ProfileCompletionSubmit {
  first_name?: string;
  last_name?: string;
  program?: string;
  year?: string;
  bio?: string;
}

export interface GroupMemberResponse {
  user_id: number;
  first_name: string;
  last_initial: string;
  role: string;
  profile_photo_url?: string;
  joined_at: string;
}

export interface GroupCardResponse {
  id: number;
  name: string;
  description?: string;
  current_size: number;
  total_capacity: number;
  spots_remaining: number;
  rent_per_person?: number;
  utilities_included: boolean;
  move_in_timing?: string;
  gender_preference?: string;
  has_place: boolean;
  address?: string;
  is_verified: boolean;
  members: GroupMemberResponse[];
  compatibility_score: number;
  created_at: string;
}

export interface GroupDetailResponse extends GroupCardResponse {
  owner_id: number;
  is_active: boolean;
}

export interface GroupCreate {
  name: string;
  description?: string;
  current_size: number;
  spots_needed: number;
  rent_per_person?: number;
  utilities_included?: boolean;
  move_in_timing?: string;
  gender_preference?: string;
  has_place?: boolean;
  address?: string;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  spots_needed?: number;
  rent_per_person?: number;
  utilities_included?: boolean;
  move_in_timing?: string;
  gender_preference?: string;
  has_place?: boolean;
  address?: string;
}

export interface IndividualCardResponse {
  user_id: number;
  first_name: string;
  last_initial: string;
  year?: string;
  program?: string;
  bio?: string;
  budget_range?: string;
  roommate_timing?: string;
  lifestyle_tags: string[];
  compatibility_score: number;
  profile_photo_url?: string;
}

export interface InviteCreate {
  invited_user_id: number;
  message?: string;
}

export interface InviteResponse {
  id: number;
  group_id: number;
  group_name: string;
  invited_user_id: number;
  invited_user_name: string;
  invited_by_id: number;
  message?: string;
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
}

export interface RoommateRequestCreate {
  group_id: number;
  message?: string;
}

export interface RoommateRequestResponse {
  id: number;
  group_id: number;
  group_name: string;
  user_id: number;
  user_name: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  lifestyle_tags: string[];
  compatibility_score: number;
  created_at: string;
}

// ── Admin Types ───────────────────────────────────────

export interface AdminStatsResponse {
  total_users: number;
  total_landlords: number;
  total_properties: number;
  total_listings: number;
  total_reviews: number;
  total_flags_pending: number;
}

export interface AdminUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: boolean;
  is_writable?: boolean;
  write_access_requested?: boolean;
  is_early_adopter?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLandlordResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  identity_verified: boolean;
}

export interface AdminListingResponse {
  id: number;
  property_id: number;
  rent_per_room: number;
  rent_total: number;
  lease_type: string;
  status: string;
  is_sublet: boolean;
  created_at: string;
}

export interface AdminFlagResponse {
  id: number;
  reporter_id: number;
  listing_id?: number;
  review_id?: number;
  reason: string;
  status: string;
  created_at: string;
}

// ── Marketplace Types ─────────────────────────────────

export type MarketplaceCategory = "furniture" | "appliances" | "kitchenware" | "electronics" | "decor" | "cleaning" | "storage" | "lighting" | "bedding" | "bathroom" | "other";
export type ItemCondition = "new" | "like_new" | "good" | "fair" | "poor";
export type ItemStatus = "draft" | "available" | "sold" | "reserved" | "removed";
export type PricingType = "free" | "fixed" | "negotiable";

export interface MarketplaceImageResponse {
  id: number;
  image_url: string;
  is_primary: boolean;
}

export interface MarketplaceItemResponse {
  id: number;
  seller_id: number;
  seller_name: string;
  title: string;
  description?: string;
  category: MarketplaceCategory;
  condition: ItemCondition;
  pricing_type: PricingType;
  price?: number;
  pickup_location: string;
  pickup_notes?: string;
  status: ItemStatus;
  view_count: number;
  images: MarketplaceImageResponse[];
  primary_image?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceItemListResponse {
  id: number;
  title: string;
  category: MarketplaceCategory;
  condition: ItemCondition;
  pricing_type: PricingType;
  price?: number;
  status: ItemStatus;
  seller_name: string;
  primary_image?: string;
  view_count: number;
  created_at: string;
}

export interface MarketplaceItemCreate {
  title: string;
  description?: string;
  category: MarketplaceCategory;
  condition: ItemCondition;
  pricing_type: PricingType;
  price?: number;
  pickup_location: string;
  pickup_notes?: string;
}

export interface MarketplaceItemUpdate {
  title?: string;
  description?: string;
  category?: MarketplaceCategory;
  condition?: ItemCondition;
  pricing_type?: PricingType;
  price?: number;
  pickup_location?: string;
  pickup_notes?: string;
  status?: ItemStatus;
}

export interface MarketplaceConversationResponse {
  id: number;
  item_id: number;
  item_title: string;
  buyer_id: number;
  buyer_name: string;
  seller_id: number;
  seller_name: string;
  last_message?: { id: number; content: string; sender_id: number; is_read: boolean; created_at: string };
  unread_count: number;
  created_at: string;
  updated_at: string;
}
