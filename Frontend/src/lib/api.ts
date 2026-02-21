import type {
  TokenResponse,
  UserCreate,
  UserLogin,
  UserResponse,
  UserUpdate,
  PasswordChange,
  RoleSwitch,
  ListingDetailResponse,
  ListingResponse,
  ListingCreate,
  ListingFilters,
  PropertyResponse,
  PropertyCreate,
  ReviewResponse,
  ReviewCreate,
  HealthScoreResponse,
  SavedListingDetailResponse,
  FlagCreate,
  FlagResponse,
  LandlordPublicResponse,
} from "@/types";

// ── Base ────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cribb_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(res.status, body.detail || "Request failed");
  }

  // Handle 204 No Content
  if (res.status === 204) return null as T;

  return res.json();
}

function toQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

// ── Auth / Users ────────────────────────────────────────

export const auth = {
  register: (data: UserCreate) =>
    request<TokenResponse | { message: string; user_id: number }>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: UserLogin) =>
    request<TokenResponse>("/api/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<UserResponse>("/api/users/me"),

  updateMe: (data: UserUpdate) =>
    request<UserResponse>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: PasswordChange) =>
    request<{ message: string }>("/api/users/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  switchRole: (data: RoleSwitch) =>
    request<UserResponse>("/api/users/me/role", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAccount: () =>
    request<null>("/api/users/me", { method: "DELETE" }),

  getUserById: (id: number) =>
    request<UserResponse>(`/api/users/${id}`),
};

// ── Listings ────────────────────────────────────────────

export const listings = {
  browse: (filters?: ListingFilters) =>
    request<ListingDetailResponse[]>(
      `/api/listings${toQueryString(filters || {})}`
    ),

  getById: (id: number) =>
    request<ListingDetailResponse>(`/api/listings/${id}`),

  create: (data: ListingCreate) =>
    request<ListingResponse>("/api/listings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ListingCreate>) =>
    request<ListingResponse>(`/api/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<null>(`/api/listings/${id}`, { method: "DELETE" }),

  getMyListings: () =>
    request<ListingResponse[]>("/api/listings/me/all"),

  convertToSublet: (
    id: number,
    data: { sublet_start_date: string; sublet_end_date: string; gender_preference?: string }
  ) =>
    request<ListingResponse>(`/api/listings/${id}/sublet`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Properties ──────────────────────────────────────────

export const properties = {
  getAll: () => request<PropertyResponse[]>("/api/properties"),

  getById: (id: number) =>
    request<PropertyResponse>(`/api/properties/${id}`),

  create: (data: PropertyCreate) =>
    request<PropertyResponse>("/api/properties", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<PropertyCreate>) =>
    request<PropertyResponse>(`/api/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<null>(`/api/properties/${id}`, { method: "DELETE" }),
};

// ── Reviews ─────────────────────────────────────────────

export const reviews = {
  browse: (params?: { property_id?: number; landlord_id?: number; skip?: number; limit?: number }) =>
    request<ReviewResponse[]>(
      `/api/reviews${toQueryString(params || {})}`
    ),

  getById: (id: number) =>
    request<ReviewResponse>(`/api/reviews/${id}`),

  create: (data: ReviewCreate) =>
    request<ReviewResponse>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ReviewCreate>) =>
    request<ReviewResponse>(`/api/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<null>(`/api/reviews/${id}`, { method: "DELETE" }),

  getMyReviews: () =>
    request<ReviewResponse[]>("/api/reviews/me/all"),
};

// ── Health Scores ───────────────────────────────────────

export const healthScores = {
  get: (listingId: number) =>
    request<HealthScoreResponse>(`/api/health-scores/${listingId}`),

  compute: (listingId: number) =>
    request<HealthScoreResponse>(`/api/health-scores/${listingId}/compute`, {
      method: "POST",
    }),
};

// ── Saved Listings ──────────────────────────────────────

export const saved = {
  getAll: () =>
    request<SavedListingDetailResponse[]>("/api/saved"),

  save: (listingId: number) =>
    request<{ id: number; student_id: number; listing_id: number; created_at: string }>(
      `/api/saved/${listingId}`,
      { method: "POST" }
    ),

  unsave: (listingId: number) =>
    request<null>(`/api/saved/${listingId}`, { method: "DELETE" }),

  check: (listingId: number) =>
    request<{ saved: boolean }>(`/api/saved/${listingId}/check`),
};

// ── Flags ───────────────────────────────────────────────

export const flags = {
  create: (data: FlagCreate) =>
    request<FlagResponse>("/api/flags", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Landlords ───────────────────────────────────────────

export const landlords = {
  getPublicProfile: (id: number) =>
    request<LandlordPublicResponse>(`/api/landlords/${id}`),

  getMyProfile: () =>
    request<{ id: number; user_id: number; identity_verified: boolean; company_name: string | null; phone: string | null }>("/api/landlords/me"),

  updateProfile: (data: { company_name?: string; phone?: string }) =>
    request<{ id: number; user_id: number; identity_verified: boolean; company_name: string | null; phone: string | null }>("/api/landlords/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  requestVerification: () =>
    request<{ message: string }>("/api/landlords/me/verify", {
      method: "POST",
    }),
};

// ── Export all as a single API object ───────────────────

export const api = {
  auth,
  listings,
  properties,
  reviews,
  healthScores,
  saved,
  flags,
  landlords,
};

export { ApiError };
