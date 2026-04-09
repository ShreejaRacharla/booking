/**
 * src/services/api.ts
 *
 * All API calls. Base URL is handled by customAxios (src/utils/customAxios.ts).
 * The base URL should be set to something like: http://your-server/api
 * so every path here starts after /api.
 */
import customAxios from "../utils/customAxios";
import type {
  AvailabilityQueryParams,
  GenerateAvailabilityRequest,
  AddAvailabilitySlotRequest,
  UpdateAvailabilityRequest,
  BlockAvailabilityRequest,
  UnblockAvailabilityRequest,
  MasterDataRequest,
  BookingDraftRequest,
} from "../types";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const login = (data: { username: string; password: string }) =>
  customAxios.post("/auth/login", data);

export const refreshToken = (data: { refreshToken: string }) =>
  customAxios.post("/auth/refresh", data);

export const logout = (data?: { refreshToken?: string }) =>
  customAxios.post("/auth/logout", data ?? {});

// ─── USERS ────────────────────────────────────────────────────────────────────

/** GET /api/users  — paginated list */
export const getUsers = () => customAxios.get("/users");

/** GET /api/users/getAll  — all users (no pagination) */
export const getAllUsers = () => customAxios.get("/users/getAll");

export const getUserById = (id: string) => customAxios.get(`/users/${id}`);

export const createUser = (data: {
  username: string;
  email: string;
  name: string;
  role: string;
  password?: string;
}) => customAxios.post("/users", data);

export const updateUser = (
  id: string,
  data: {
    username?: string;
    email?: string;
    name?: string;
    role?: string;
    isActive?: boolean;
  }
) => customAxios.put(`/users/${id}`, data);

export const deleteUser = (id: string) => customAxios.delete(`/users/${id}`);

// ─── LOCATIONS ────────────────────────────────────────────────────────────────

export const getLocations = () => customAxios.get("/v1/locations");

export const createLocation = (data: {
  name: string;
  approverUserId: string;
}) => customAxios.post("/v1/locations", data);

export const updateLocation = (
  id: string,
  data: { name: string; approverUserId: string; isActive: boolean }
) => customAxios.put(`/v1/locations/${id}`, data);

export const deleteLocation = (id: string) =>
  customAxios.delete(`/v1/locations/${id}`);

// ─── CLUBS ────────────────────────────────────────────────────────────────────

export const getClubs = () => customAxios.get("/v1/clubs");

export const createClub = (data: { name: string; isActive?: boolean }) =>
  customAxios.post("/v1/clubs", data);

export const updateClub = (
  id: string,
  data: { name: string; isActive: boolean }
) => customAxios.put(`/v1/clubs/${id}`, data);

export const deleteClub = (id: string) =>
  customAxios.delete(`/v1/clubs/${id}`);

// ─── FACILITIES ───────────────────────────────────────────────────────────────

export const getFacilities = () => customAxios.get("/v1/facility");

export const createFacility = (data: {
  name: string;
  capacity: number;
  locationId: string;
  approverUserId: string;
  type?: string;
}) => customAxios.post("/v1/facility", data);

export const updateFacility = (
  id: string,
  data: {
    name: string;
    capacity: number;
    locationId: string;
    approverUserId: string;
    type?: string;
    isActive?: boolean;
  }
) => customAxios.put(`/v1/facility/${id}`, data);

export const deleteFacility = (id: string) =>
  customAxios.delete(`/v1/facility/${id}`);

// ─── TIMESLOTS ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/timeslots  — admin list of all timeslots
 * POST /api/v1/time-slots      — create a timeslot
 */
export const getTimeslots = () => customAxios.get("/v1/admin/timeslots");

export const createTimeslot = (data: {
  name: string;
  startTime: string;
  endTime: string;
  facilityId?: string;
  isActive: boolean;
}) => customAxios.post("/v1/time-slots", data);

export const updateTimeslot = (
  id: string,
  data: {
    name: string;
    startTime: string;
    endTime: string;
    facilityId?: string;
    isActive: boolean;
  }
) => customAxios.put(`/v1/time-slots/${id}`, data);

export const deleteTimeslot = (id: string) =>
  customAxios.delete(`/v1/time-slots/${id}`);

// ─── MASTER DATA ──────────────────────────────────────────────────────────────

export const createMasterData = (data: MasterDataRequest) =>
  customAxios.post("/v1/master-data", data);

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/availability?facilityId=...&fromDate=...&toDate=...
 */
export const getAvailability = (params?: AvailabilityQueryParams) => {
  const q = new URLSearchParams();
  if (params?.locationId) q.append("locationId", params.locationId);
  if (params?.facilityId) q.append("facilityId", params.facilityId);
  if (params?.fromDate) q.append("fromDate", params.fromDate);
  if (params?.toDate) q.append("toDate", params.toDate);
  const qs = q.toString();
  return customAxios.get(`/v1/availability${qs ? `?${qs}` : ""}`);
};

/** GET /api/v1/availability/getAll */
export const getAllAvailability = () =>
  customAxios.get("/v1/availability/getAll");

/** GET /api/v1/availability/:id */
export const getAvailabilityById = (id: string) =>
  customAxios.get(`/v1/availability/${id}`);

export const getAvailabilityByFacility = (
  facilityId: string,
  fromDate: string,
  toDate: string
) =>
  customAxios.get(`/v1/availability/facility/${facilityId}`, {
    params: { fromDate, toDate },
  });

export const generateAvailability = (data: GenerateAvailabilityRequest) =>
  customAxios.post("/v1/availability/generate", data);

export const addAvailabilitySlot = (data: AddAvailabilitySlotRequest) =>
  customAxios.post("/v1/availability/addSlot", data);

export const updateAvailability = (data: UpdateAvailabilityRequest) =>
  customAxios.put("/v1/availability/update", data);

export const blockAvailability = (data: BlockAvailabilityRequest) =>
  customAxios.post("/v1/availability/block", data);

export const unblockAvailability = (data: UnblockAvailabilityRequest) =>
  customAxios.post("/v1/availability/unblock", data);

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

/**
 * GET  /api/v1/booking           — all bookings (JWT-filtered by backend)
 * GET  /api/v1/booking/:id       — single booking
 * POST /api/v1/booking/draft     — create draft
 * POST /api/v1/booking/:id/submit
 * POST /api/v1/booking/:id/cancel
 *
 * NOTE: There is NO /my-bookings endpoint per the Postman collection.
 *       The backend filters by the authenticated user via JWT.
 */
export const getBookings = () => customAxios.get("/v1/booking");

export const getMyBookings = () => customAxios.get("/v1/booking");

export const getBookingById = (id: string) =>
  customAxios.get(`/v1/booking/${id}`);

export const createBookingDraft = (data: BookingDraftRequest) =>
  customAxios.post("/v1/booking/draft", data);

export const submitBooking = (bookingId: string) =>
  customAxios.post(`/v1/booking/${bookingId}/submit`);

export const cancelBooking = (bookingId: string) =>
  customAxios.post(`/v1/booking/${bookingId}/cancel`);

// ─── APPROVALS ────────────────────────────────────────────────────────────────

/**
 * GET  /api/v1/approvals              — list (all or pending)
 * POST /api/v1/approvals/:id/approve
 * POST /api/v1/approvals/:id/reject
 */
export const getPendingApprovals = () => customAxios.get("/v1/approvals");

export const approveBooking = (bookingId: string, approverUserId: string) =>
  customAxios.post(`/v1/approvals/${bookingId}/approve`, { approverUserId });

export const rejectBooking = (data: {
  bookingId: string;
  approverUserId: string;
  reason: string;
  alternatives?: {
    facilityId: string;
    eventDate: string;
    slotId: string;
    price: number;
  }[];
}) => customAxios.post(`/v1/approvals/${data.bookingId}/reject`, data);

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const generatePaymentLink = (bookingId: string) =>
  customAxios.post(`/v1/payments/${bookingId}/generate-link`);

export const verifyPayment = (data: {
  bookingId: string;
  paymentId: string;
  status: "verified" | "flagged" | "rejected";
  notes?: string;
}) => customAxios.post("/v1/payments/verify", data);

export const getFlaggedPayments = () => customAxios.get("/v1/payments/flagged");