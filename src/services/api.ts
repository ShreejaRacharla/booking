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

// ─── TIME SLOTS ───────────────────────────────────────────────────────────────

export const getTimeslots = () => customAxios.get("/v1/time-slots");

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

// ─── CLUBS ────────────────────────────────────────────────────────────────────

export const getClubs = () => customAxios.get("/v1/clubs");

export const createClub = (data: { name: string }) =>
  customAxios.post("/v1/clubs", data);

export const updateClub = (id: string, data: { name: string; isActive: boolean }) =>
  customAxios.put(`/v1/clubs/${id}`, data);

export const deleteClub = (id: string) => customAxios.delete(`/v1/clubs/${id}`);

// ─── MASTER DATA ──────────────────────────────────────────────────────────────

export const createMasterData = (data: MasterDataRequest) =>
  customAxios.post("/v1/master-data", data);

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export const getAvailability = (params?: AvailabilityQueryParams) => {
  const queryParams = new URLSearchParams();
  if (params?.locationId) queryParams.append("locationId", params.locationId);
  if (params?.facilityId) queryParams.append("facilityId", params.facilityId);
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);

  const queryString = queryParams.toString();
  return customAxios.get(
    `/v1/availability${queryString ? `?${queryString}` : ""}`
  );
};

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

export const getBookings = () => customAxios.get("/v1/booking");

export const getBookingById = (id: string) =>
  customAxios.get(`/v1/booking/${id}`);

export const createBookingDraft = (data: BookingDraftRequest) =>
  customAxios.post("/v1/booking/draft", data);

export const submitBooking = (bookingId: string) =>
  customAxios.post(`/v1/booking/${bookingId}/submit`);

export const approveBooking = (bookingId: string, approverUserId: string) =>
  customAxios.post(`/v1/approvals/${bookingId}/approve`, { approverUserId });

export const rejectBooking = (bookingId: string, approverUserId: string, reason?: string) =>
  customAxios.post(`/v1/approvals/${bookingId}/reject`, { approverUserId, reason });

// ─── USERS ────────────────────────────────────────────────────────────────────

export const getUsers = () => customAxios.get("/v1/users");

export const getUserById = (id: string) => customAxios.get(`/v1/users/${id}`);

export const createUser = (data: {
  username: string;
  email: string;
  name: string;
  role: string;
  password?: string;
}) => customAxios.post("/v1/users", data);

export const updateUser = (
  id: string,
  data: {
    username?: string;
    email?: string;
    name?: string;
    role?: string;
    isActive?: boolean;
  }
) => customAxios.put(`/v1/users/${id}`, data);

export const deleteUser = (id: string) => customAxios.delete(`/v1/users/${id}`);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const login = (data: { username: string; password: string }) =>
  customAxios.post("/auth/login", data);

export const refreshToken = (data: { refreshToken: string }) =>
  customAxios.post("/auth/refresh", data);

export const logout = () => customAxios.post("/logout");