import { ReactNode } from "react";

export type BadgeVariant =
  | "available"
  | "tempHold"
  | "booked"
  | "blocked"
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "conflict"
  | "cancelled"
  | "submitted"
  | "confirmed";

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  facilityId?: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  approverUserId: string;
  isActive: boolean;
}

export interface Club {
  id: string;
  name: string;
  isActive: boolean;
}

export type FacilityType =
  | "BANQUET"
  | "MEETING"
  | "MEETING_ROOM"
  | "AUDITORIUM"
  | "OUTDOOR";

export interface Facility {
  id: string;
  name: string;
  locationId: string;
  type: FacilityType;
  capacity: number;
  approverUserId?: string;
  isActive: boolean;
}

export type SlotStatus = "AVAILABLE" | "TEMP_HOLD" | "BOOKED" | "BLOCKED";

export interface SlotEntry {
  id: string;
  locationId: string;
  facilityId: string;
  date: string;
  timeslotId: string;
  price: number;
  status: SlotStatus;
  blockReason?: string;
}

export interface BookingSlot {
  id?: string;
  timeslotId: string;
  timeslotName: string;
  startTime: string;
  endTime: string;
  price?: number;
  status?: "AVAILABLE" | "CONFLICT";
}

export type BookingStatus = 
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "APPROVED_PENDING_PAYMENT"
  | "CONFIRMED_FULL"
  | "REJECTED"
  | "PAID"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "FLAGGED"
  | "VERIFIED";

export interface BookingItem {
  id?: string;
  facilityId: string;
  facilityName?: string;
  eventDate: string | string[] | number[];
  slotId: string;
  slotName?: string;
  startTime?: string;
  endTime?: string;
  price: number;
  pax?: number;
  status?: BookingStatus;
  isActive?: boolean;
  alternatives?: string[];
}

export interface BookingApproval {
  id: string;
  approverUserId: string;
  levelNumber: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  actionTime: string | string[] | number[] | null;
  remarks: string | null;
  isActive: boolean;
}

export interface EventDetails {
  purpose?: string;
  expectedAttendees?: number;
  specialRequirements?: string;
  location?: string;
  description?: string;
  organizerName?: string;
  organizerPhone?: string;
  organizerEmail?: string;
}

export interface Booking {
  id: string;
  bookingCode?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  items: BookingItem[];
  totalAmount: number;
  status: BookingStatus;
  approvals?: BookingApproval[];
  previousBookingId?: string | null;
  eventDetails?: EventDetails;
  rejectionReason?: string;
  cancellationReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  approvedBy?: string;
  createdAt: string | string[] | number[];
  updatedAt?: string | string[] | number[];
  isActive: boolean;
  paymentLink?: string;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
}

export interface BookingDraftItem {
  facilityId: string;
  eventDate: string;
  slotId: string;
  price: number;
  pax?: number;
}

export interface BookingDraftRequest {
  userId: string;
  items: BookingDraftItem[];
  eventDetails?: EventDetails;
}

export type UserRole = "admin" | "member" | "approver" | "super_admin";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  system?: boolean;
  isActive?: boolean;
  club?: string;
  phone?: string;
  userId?: string;
  roles?: UserRole[];
  approvalLevel?: number;
  assignedLocations?: string[];
}

export interface ApprovalAction {
  bookingId: string;
  action: "approve" | "reject";
  approverUserId: string;
  reason?: string;
  alternatives?: BookingItem[];
}

export interface PaymentVerification {
  bookingId: string;
  paymentId: string;
  status: "verified" | "flagged" | "rejected";
  notes?: string;
}

export interface AvailabilityQueryParams {
  locationId?: string;
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  status?: SlotStatus;
}

export interface GenerateAvailabilityRequest {
  locationName: string;
  facilityName: string;
  fromDate: string;
  toDate: string;
  daysOfWeek: string[];
  slotIds: string[];
  pricePerSlot: number;
}

export interface AddAvailabilitySlotRequest {
  facilityId: string;
  date: string;
  slotId: string;
  price: number;
}

export interface UpdateAvailabilityRequest {
  facilityId: string;
  fromDate: string;
  toDate: string;
  slotIds: string[];
  price: number;
}

export interface BlockAvailabilityRequest {
  facilityId: string;
  slots: { date: string; slotId: string }[];
  reason: string;
}

export interface UnblockAvailabilityRequest {
  facilityId: string;
  slots: { date: string; slotId: string }[];
}

export interface MasterDataRequest {
  clubs: { name: string }[];
  locations: {
    name: string;
    approverUserName: string;
    facilities: {
      name: string;
      type: FacilityType;
      capacity: number;
    }[];
  }[];
}

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any, index?: number) => ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface BookingFilter {
  status?: BookingStatus;
  userId?: string;
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingApprovals: number;
  awaitingPayment: number;
  confirmed: number;
  cancelled: number;
  totalRevenue: number;
}