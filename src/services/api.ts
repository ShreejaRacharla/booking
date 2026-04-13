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

export const login = (data: { username: string; password: string }) =>
  customAxios.post("/login", data);

export const refreshToken = (data: { refreshToken: string }) =>
  customAxios.post("/refresh", data);

export const logout = (data?: { refreshToken?: string }) =>
  customAxios.post("/logout", data ?? {});

export const getUsers = () => customAxios.get("/users");
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

export const getClubs = () => customAxios.get("/v1/clubs");

export const createClub = (data: { name: string; isActive?: boolean }) =>
  customAxios.post("/v1/clubs", data);

export const updateClub = (
  id: string,
  data: { name: string; isActive: boolean }
) => customAxios.put(`/v1/clubs/${id}`, data);

export const deleteClub = (id: string) =>
  customAxios.delete(`/v1/clubs/${id}`);

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

export const createMasterData = (data: MasterDataRequest) =>
  customAxios.post("/v1/master-data", data);

export const getAvailability = (params?: AvailabilityQueryParams) => {
  if (params?.facilityId && params?.fromDate && params?.toDate) {
    return customAxios.get(`/v1/availability`, {
      params: {
        facilityId: params.facilityId,
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
    });
  }
    return customAxios.get(`/v1/availability`);
};

export const getAllAvailability = () =>
  customAxios.get("/v1/availability/getAll");

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

export const generatePaymentLink = (bookingId: string) =>
  customAxios.post(`/v1/payments/${bookingId}/generate-link`);

export const verifyPayment = (data: {
  bookingId: string;
  paymentId: string;
  status: "verified" | "flagged" | "rejected";
  notes?: string;
}) => customAxios.post("/v1/payments/verify", data);

export const getFlaggedPayments = () => customAxios.get("/v1/payments/flagged");