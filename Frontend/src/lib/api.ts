import type {
  TokenResponse,
  NotificationPreferencesResponse,
  NotificationPreferencesUpdate,
  UserCreate,
  UserLogin,
  UserResponse,
  UserUpdate,
  UserDashboardResponse,
  PasswordChange,
  RoleSwitch,
  ListingDetailResponse,
  ListingResponse,
  ListingCreate,
  ListingUpdate,
  ListingFilters,
  PropertyResponse,
  PropertyCreate,
  ReviewResponse,
  ReviewCreate,
  HealthScoreResponse,
  SavedListingDetailResponse,
  SubletCreate,
  SubletImageResponse,
  SubletListResponse,
  SubletResponse,
  FlagCreate,
  FlagResponse,
  LandlordFlagResponse,
  LandlordPublicResponse,
  WriterRegister,
  WriterResponse,
  WriterTokenResponse,
  PostCreate,
  PostUpdate,
  PostResponse,
  PostListResponse,
  PostCategory,
  StartConversation,
  MessageCreate,
  MessageResponse,
  ConversationResponse,
  ConversationDetailResponse,
  // Roommates
  RoommateQuizSubmit,
  RoommateProfileResponse,
  ProfileCompletionCheck,
  ProfileCompletionSubmit,
  GroupCardResponse,
  GroupDetailResponse,
  GroupCreate,
  GroupUpdate,
  IndividualCardResponse,
  InviteCreate,
  InviteResponse,
  RoommateRequestCreate,
  RoommateRequestResponse,
  // Viewings
  ViewingAvailabilityResponse,
  ViewingAvailabilityCreate,
  ViewingSlotResponse,
  ViewingBookingResponse,
  ViewingBookingCreate,
  // Admin
  AdminStatsResponse,
  AdminUserResponse,
  AdminLandlordResponse,
  AdminListingResponse,
  AdminFlagResponse,
  // Marketplace
  MarketplaceItemResponse,
  MarketplaceItemListResponse,
  MarketplaceItemCreate,
  MarketplaceItemUpdate,
  MarketplaceImageResponse,
  MarketplaceConversationResponse,
  MarketplaceConversationDetailResponse,
  MarketplaceMessageResponse,
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
  return localStorage.getItem("cribb_token") || localStorage.getItem("cribb_writer_token");
}

function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("cribb_token", token);
  }
}

/** Try to refresh the access token silently. Returns true if successful. */
async function tryRefreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/api/users/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access_token) {
      setToken(data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
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

  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 and we have a token, try refreshing once
  if (res.status === 401 && token && !endpoint.includes("/login") && !endpoint.includes("/refresh")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request with the new token
      const newToken = getToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(res.status, body.detail || "Request failed");
  }

  // Handle 204 No Content
  if (res.status === 204) return null as T;

  return res.json();
}

function toQueryString(params: object): string {
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
    request<TokenResponse>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: UserLogin) =>
    request<TokenResponse>("/api/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<UserResponse>("/api/users/me"),

  getDashboard: () => request<UserDashboardResponse>("/api/users/me/dashboard"),

  getNotificationPreferences: () =>
    request<NotificationPreferencesResponse>("/api/users/me/notifications"),

  updateNotificationPreferences: (data: NotificationPreferencesUpdate) =>
    request<NotificationPreferencesResponse>("/api/users/me/notifications", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadProfilePhoto: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/users/me/profile-photo`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new ApiError(res.status, body.detail || "Request failed");
    }

    return res.json() as Promise<{ profile_photo_url: string }>;
  },

  deleteProfilePhoto: () =>
    request<{ message: string }>("/api/users/me/profile-photo", {
      method: "DELETE",
    }),

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

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/users/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>("/api/users/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),

  refreshToken: () =>
    request<{ access_token: string; token_type: string }>("/api/users/refresh", {
      method: "POST",
    }),

  requestWriteAccess: async (reason: string) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("reason", reason);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/users/request-write-access`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new ApiError(res.status, body.detail || "Request failed");
    }

    return res.json() as Promise<{ message: string }>;
  },
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

  update: (id: number, data: ListingUpdate) =>
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

// ── Sublets ────────────────────────────────────────────

export const sublets = {
  browse: (params?: {
    min_rent?: number;
    max_rent?: number;
    room_type?: string;
    is_furnished?: boolean;
    utilities_included?: boolean;
    distance_to_campus_km?: number;
    gender_preference?: string;
    available_from?: string;
    available_until?: string;
  }) =>
    request<SubletListResponse[]>(
      `/api/sublets${toQueryString(params || {})}`
    ),

  getById: (id: number) =>
    request<SubletResponse>(`/api/sublets/${id}`),

  create: (data: SubletCreate) =>
    request<SubletResponse>("/api/sublets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadImages: async (subletId: number, files: File[]) => {
    const token = getToken();
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/sublets/${subletId}/images`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new ApiError(res.status, body.detail || "Request failed");
    }

    return res.json() as Promise<SubletImageResponse[]>;
  },
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

// ── Cribb Scores ───────────────────────────────────────

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
    request<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      no_of_property: string;
      company_name: string | null;
      identity_verified: boolean;
    }>("/api/landlords/me"),

  updateProfile: (data: { company_name?: string; phone?: string }) =>
    request<{ id: number; user_id: number; identity_verified: boolean; company_name: string | null; phone: string | null }>("/api/landlords/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getMyFlags: () =>
    request<LandlordFlagResponse[]>("/api/landlords/me/flags"),

  requestVerification: () =>
    request<{ message: string }>("/api/landlords/me/verify", {
      method: "POST",
    }),
};

// ── Writers ─────────────────────────────────────────────

export const writers = {
  register: (data: WriterRegister) =>
    request<WriterResponse>("/api/writers/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append("username", data.username);
    formData.append("password", data.password);
    return request<WriterTokenResponse>("/api/writers/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
  },
};

// ── Posts (The Bubble) ──────────────────────────────────

export const posts = {
  getAll: (category?: PostCategory) =>
    request<PostListResponse[]>(
      `/api/posts${category ? `?category=${category}` : ""}`
    ),

  getBySlug: (slug: string) =>
    request<PostResponse>(`/api/posts/${slug}`),

  getMyPosts: () =>
    request<PostListResponse[]>("/api/posts/my/posts"),

  getMyPublished: () =>
    request<PostListResponse[]>("/api/posts/my/published"),

  getMyArchived: () =>
    request<PostListResponse[]>("/api/posts/my/archived"),

  getMyStats: () =>
    request<{ total_posts: number; published: number; drafts: number; archived: number; total_views: number; avg_views: number }>("/api/posts/my/stats"),

  search: (q: string, category?: PostCategory) =>
    request<PostListResponse[]>(
      `/api/posts/search/posts?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ""}`
    ),

  create: (data: PostCreate) =>
    request<PostResponse>("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: PostUpdate) =>
    request<PostResponse>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<null>(`/api/posts/${id}`, { method: "DELETE" }),

  publish: (id: number) =>
    request<PostResponse>(`/api/posts/${id}/publish`, { method: "PATCH" }),

  unpublish: (id: number) =>
    request<PostResponse>(`/api/posts/${id}/unpublish`, { method: "PATCH" }),

  archive: (id: number) =>
    request<PostResponse>(`/api/posts/${id}/archive`, { method: "PATCH" }),

  unarchive: (id: number) =>
    request<PostResponse>(`/api/posts/${id}/unarchive`, { method: "PATCH" }),

  uploadCoverImage: async (postId: number, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/posts/${postId}/cover-image`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(res.status, body.detail || "Upload failed");
    }
    return res.json() as Promise<PostResponse>;
  },

  upvote: (postId: number) =>
    request<{ post_id: number; upvote_count: number; user_has_upvoted: boolean }>(
      `/api/posts/${postId}/upvote`, { method: "POST" }
    ),
 
  removeUpvote: (postId: number) =>
    request<{ post_id: number; upvote_count: number; user_has_upvoted: boolean }>(
      `/api/posts/${postId}/upvote`, { method: "DELETE" }
    ),
};

// ── Messages / Conversations ────────────────────────────

export const messages = {
  // Student starts a conversation
  startConversation: (data: StartConversation) =>
    request<ConversationDetailResponse>("/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Send message in existing conversation (student)
  sendMessage: (conversationId: number, data: MessageCreate) =>
    request<MessageResponse>(`/api/messages/conversations/${conversationId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Landlord replies
  landlordReply: (conversationId: number, data: MessageCreate) =>
    request<MessageResponse>(`/api/messages/landlord/conversations/${conversationId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get all conversations (student)
  getConversations: () =>
    request<ConversationResponse[]>("/api/messages/conversations"),

  // Get all conversations (landlord)
  getLandlordConversations: () =>
    request<ConversationResponse[]>("/api/messages/landlord/conversations"),

  // Get single conversation with messages
  getConversation: (id: number) =>
    request<ConversationDetailResponse>(`/api/messages/conversations/${id}`),

  // Unread count (student)
  getUnreadCount: () =>
    request<{ unread_count: number }>("/api/messages/unread-count"),

  // Unread count (landlord)
  getLandlordUnreadCount: () =>
    request<{ unread_count: number }>("/api/messages/landlord/unread-count"),

  // Delete message
  deleteMessage: (conversationId: number, messageId: number) =>
    request<null>(`/api/messages/conversations/${conversationId}/messages/${messageId}`, {
      method: "DELETE",
    }),

  // Delete conversation (student)
  deleteConversation: (id: number) =>
    request<null>(`/api/messages/conversations/${id}`, { method: "DELETE" }),

  // Delete conversation (landlord)
  landlordDeleteConversation: (id: number) =>
    request<null>(`/api/messages/landlord/conversations/${id}`, { method: "DELETE" }),
};

// ── Roommates ──────────────────────────────────────────

export const roommates = {
  // Profile
  checkProfile: () =>
    request<ProfileCompletionCheck>("/api/roommates/profile-check"),

  completeProfile: (data: ProfileCompletionSubmit) =>
    request<ProfileCompletionCheck>("/api/roommates/complete-profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Quiz
  submitQuiz: (data: RoommateQuizSubmit) =>
    request<RoommateProfileResponse>("/api/roommates/quiz", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyQuiz: () =>
    request<RoommateProfileResponse>("/api/roommates/quiz/me"),

  toggleVisibility: () =>
    request<{ is_visible: boolean }>("/api/roommates/visibility", {
      method: "PATCH",
    }),

  // Groups
  createGroup: (data: GroupCreate) =>
    request<GroupDetailResponse>("/api/roommates/groups", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateGroup: (groupId: number, data: GroupUpdate) =>
    request<GroupDetailResponse>(`/api/roommates/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteGroup: (groupId: number) =>
    request<null>(`/api/roommates/groups/${groupId}`, { method: "DELETE" }),

  getMyGroup: () =>
    request<GroupDetailResponse>("/api/roommates/groups/my/group"),

  browseGroups: (filters?: { gender?: string; timing?: string; max_rent?: number; has_place?: boolean }) =>
    request<GroupCardResponse[]>(`/api/roommates/groups/browse${toQueryString(filters || {})}`),

  getGroup: (groupId: number) =>
    request<GroupDetailResponse>(`/api/roommates/groups/${groupId}`),

  // Individuals
  browseIndividuals: () =>
    request<IndividualCardResponse[]>("/api/roommates/individuals"),

  searchIndividuals: (filters?: Record<string, string>) =>
    request<IndividualCardResponse[]>(`/api/roommates/individuals/search${toQueryString(filters || {})}`),

  // Invites
  sendInvite: (data: InviteCreate) =>
    request<InviteResponse>("/api/roommates/invites", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  acceptInvite: (inviteId: number) =>
    request<InviteResponse>(`/api/roommates/invites/${inviteId}/accept`, {
      method: "PATCH",
    }),

  declineInvite: (inviteId: number) =>
    request<InviteResponse>(`/api/roommates/invites/${inviteId}/decline`, {
      method: "PATCH",
    }),

  getReceivedInvites: () =>
    request<InviteResponse[]>("/api/roommates/invites/received"),

  getSentInvites: () =>
    request<InviteResponse[]>("/api/roommates/invites/sent"),

  // Requests
  sendRequest: (data: RoommateRequestCreate) =>
    request<RoommateRequestResponse>("/api/roommates/requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  acceptRequest: (requestId: number) =>
    request<RoommateRequestResponse>(`/api/roommates/requests/${requestId}/accept`, {
      method: "PATCH",
    }),

  declineRequest: (requestId: number) =>
    request<RoommateRequestResponse>(`/api/roommates/requests/${requestId}/decline`, {
      method: "PATCH",
    }),

  getReceivedRequests: () =>
    request<RoommateRequestResponse[]>("/api/roommates/requests/received"),

  getSentRequests: () =>
    request<RoommateRequestResponse[]>("/api/roommates/requests/sent"),

  // Member management
  removeMember: (groupId: number, userId: number) =>
    request<null>(`/api/roommates/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),

  leaveGroup: (groupId: number) =>
    request<null>(`/api/roommates/groups/${groupId}/leave`, {
      method: "DELETE",
    }),
};

// ── Viewings / Showings ────────────────────────────────

export const viewings = {
  // Landlord: set availability
  setAvailability: (data: ViewingAvailabilityCreate) =>
    request<ViewingAvailabilityResponse>("/api/viewings/availability", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  setBulkAvailability: (data: { listing_id: number; dates: ViewingAvailabilityCreate[] }) =>
    request<ViewingAvailabilityResponse[]>("/api/viewings/availability/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get availability for a listing
  getListingAvailability: (listingId: number, fromDate?: string) =>
    request<ViewingAvailabilityResponse[]>(
      `/api/viewings/availability/listing/${listingId}${fromDate ? `?from_date=${fromDate}` : ""}`
    ),

  // Get available slots
  getAvailableSlots: (listingId: number, fromDate?: string) =>
    request<ViewingSlotResponse[]>(
      `/api/viewings/slots/listing/${listingId}${fromDate ? `?from_date=${fromDate}` : ""}`
    ),

  // Student: book a slot
  bookSlot: (data: ViewingBookingCreate) =>
    request<ViewingBookingResponse>("/api/viewings/book", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Cancel booking
  studentCancel: (bookingId: number) =>
    request<ViewingBookingResponse>(`/api/viewings/bookings/${bookingId}/cancel`, {
      method: "PATCH",
    }),

  landlordCancel: (bookingId: number) =>
    request<ViewingBookingResponse>(`/api/viewings/bookings/${bookingId}/landlord-cancel`, {
      method: "PATCH",
    }),

  // Get bookings
  getMyBookings: () =>
    request<ViewingBookingResponse[]>("/api/viewings/bookings/my"),

  getMyUpcoming: () =>
    request<ViewingBookingResponse[]>("/api/viewings/bookings/my/upcoming"),

  getLandlordBookings: (listingId?: number) =>
    request<ViewingBookingResponse[]>(
      `/api/viewings/bookings/landlord${listingId ? `?listing_id=${listingId}` : ""}`
    ),

  getLandlordUpcoming: () =>
    request<ViewingBookingResponse[]>("/api/viewings/bookings/landlord/upcoming"),
};

// ── Admin ──────────────────────────────────────────────

export const admin = {
  login: (data: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append("username", data.username);
    formData.append("password", data.password);
    return request<{ access_token: string; token_type: string; admin: { id: number; email: string; first_name: string; last_name: string; is_active: boolean } }>("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
  },

  getStats: () => request<AdminStatsResponse>("/api/admin/stats"),

  // Users
  getUsers: () => request<AdminUserResponse[]>("/api/admin/users"),
  getUser: (id: number) => request<AdminUserResponse>(`/api/admin/users/${id}`),
  verifyUser: (id: number) => request<{ message: string }>(`/api/admin/users/${id}/verify`, { method: "PATCH" }),
  deleteUser: (id: number) => request<null>(`/api/admin/users/${id}`, { method: "DELETE" }),
  grantWrite: (id: number) => request<{ message: string }>(`/api/admin/users/${id}/grant-write`, { method: "PATCH" }),
  rejectWrite: (id: number) => request<{ message: string }>(`/api/admin/users/${id}/reject-write`, { method: "PATCH" }),
  revokeWrite: (id: number) => request<{ message: string }>(`/api/admin/users/${id}/revoke-write`, { method: "PATCH" }),
  getPendingWriters: () => request<AdminUserResponse[]>("/api/admin/users/pending-writers"),
  grantOG: (id: number) => request<{ message: string }>(`/api/admin/users/${id}/grant-og`, { method: "PATCH" }),
  revokeOG: (id: number) => request<{ message: string }>(`/api/admin/users/${id}/revoke-og`, { method: "PATCH" }),

  // Landlords
  getLandlords: () => request<AdminLandlordResponse[]>("/api/admin/landlords"),
  getLandlord: (id: number) => request<AdminLandlordResponse>(`/api/admin/landlords/${id}`),
  verifyLandlord: (id: number) => request<{ message: string }>(`/api/admin/landlords/${id}/verify`, { method: "PATCH" }),
  unverifyLandlord: (id: number) => request<{ message: string }>(`/api/admin/landlords/${id}/unverify`, { method: "PATCH" }),
  deleteLandlord: (id: number) => request<null>(`/api/admin/landlords/${id}`, { method: "DELETE" }),

  // Listings
  getListings: () => request<AdminListingResponse[]>("/api/admin/listings"),
  deleteListing: (id: number) => request<null>(`/api/admin/listings/${id}`, { method: "DELETE" }),

  // Reviews
  deleteReview: (id: number) => request<null>(`/api/admin/reviews/${id}`, { method: "DELETE" }),

  // Flags
  getFlags: () => request<AdminFlagResponse[]>("/api/admin/flags"),
  resolveFlag: (id: number) => request<{ message: string }>(`/api/admin/flags/${id}/resolve`, { method: "PATCH" }),
  dismissFlag: (id: number) => request<{ message: string }>(`/api/admin/flags/${id}/dismiss`, { method: "PATCH" }),

  // Writers
  getWriters: () => request<WriterResponse[]>("/api/admin/writers"),
  getPendingWriterApps: () => request<WriterResponse[]>("/api/admin/writers/pending"),
  approveWriter: (id: number) => request<{ message: string }>(`/api/admin/writers/${id}/approve`, { method: "PATCH" }),
  rejectWriter: (id: number) => request<{ message: string }>(`/api/admin/writers/${id}/reject`, { method: "PATCH" }),
  revokeWriter: (id: number) => request<{ message: string }>(`/api/admin/writers/${id}/revoke`, { method: "PATCH" }),
  deleteWriter: (id: number) => request<null>(`/api/admin/writers/${id}`, { method: "DELETE" }),

  // Posts
  getPosts: () => request<PostListResponse[]>("/api/admin/posts"),
  deletePost: (id: number) => request<null>(`/api/admin/posts/${id}`, { method: "DELETE" }),
};

// ── Marketplace ────────────────────────────────────────

export const marketplace = {
  getItems: (filters?: { category?: string; condition?: string; pricing_type?: string; min_price?: number; max_price?: number; search?: string }) =>
    request<MarketplaceItemListResponse[]>(`/api/marketplace/items${toQueryString(filters || {})}`),

  getItem: (id: number) =>
    request<MarketplaceItemResponse>(`/api/marketplace/items/${id}`),

  createItem: (data: MarketplaceItemCreate) =>
    request<MarketplaceItemResponse>("/api/marketplace/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateItem: (id: number, data: MarketplaceItemUpdate) =>
    request<MarketplaceItemResponse>(`/api/marketplace/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteItem: (id: number) =>
    request<null>(`/api/marketplace/items/${id}`, { method: "DELETE" }),

  markSold: (id: number) =>
    request<MarketplaceItemResponse>(`/api/marketplace/items/${id}/sold`, { method: "PATCH" }),

  publishItem: (id: number) =>
    request<MarketplaceItemResponse>(`/api/marketplace/items/${id}/publish`, { method: "PATCH" }),

  unpublishItem: (id: number) =>
    request<MarketplaceItemResponse>(`/api/marketplace/items/${id}/unpublish`, { method: "PATCH" }),

  getMyItems: () =>
    request<MarketplaceItemListResponse[]>("/api/marketplace/my/items"),

  getMyDrafts: () =>
    request<MarketplaceItemListResponse[]>("/api/marketplace/drafts/my"),

  uploadImages: async (itemId: number, files: File[]) => {
    const token = getToken();
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await fetch(
      `${API_URL}/api/marketplace/items/${itemId}/images`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(res.status, body.detail || "Upload failed");
    }
    return res.json() as Promise<MarketplaceImageResponse[]>;
  },

  deleteImage: (itemId: number, imageId: number) =>
    request<null>(`/api/marketplace/items/${itemId}/images/${imageId}`, { method: "DELETE" }),

  // Conversations
  startConversation: (data: { item_id: number; content: string }) =>
    request<MarketplaceMessageResponse>("/api/marketplace/conversations/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendMessage: (conversationId: number, data: { content: string }) =>
    request<MarketplaceMessageResponse>(`/api/marketplace/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getConversations: () =>
    request<MarketplaceConversationResponse[]>("/api/marketplace/conversations"),

  getConversation: (conversationId: number) =>
    request<MarketplaceConversationDetailResponse>(`/api/marketplace/conversations/${conversationId}`),

  getUnreadCount: () =>
    request<{ unread_count: number }>("/api/marketplace/unread-count"),
};

// ── Export all as a single API object ───────────────────

export const api = {
  auth,
  listings,
  sublets,
  properties,
  reviews,
  healthScores,
  saved,
  flags,
  landlords,
  writers,
  posts,
  messages,
  roommates,
  viewings,
  admin,
  marketplace,
};

export { ApiError };
