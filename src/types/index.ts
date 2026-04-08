import { ReactNode } from "react";

// ─── TIME SLOTS ───────────────────────────────────────────────────────────────

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  facilityId?: string;
  isActive: boolean;
}

// ─── LOCATIONS ────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  approverUserId: string;
  isActive: boolean;
}

// ─── CLUBS ────────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  isActive: boolean;
}

// ─── FACILITIES ───────────────────────────────────────────────────────────────

export type FacilityType =
  | "BANQUET"
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

// ─── AVAILABILITY SLOTS ───────────────────────────────────────────────────────

export type SlotStatus = "AVAILABLE" | "TEMP_HOLD" | "BOOKED" | "BLOCKED";

export interface slotEntry {
  id: string;
  locationId: string;
  facilityId: string;
  date: string;
  timeslotId: string;
  price: number;
  status: SlotStatus;
  blockReason?: string;
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export interface BookingSlot {
  timeslotId: string;
  timeslotName: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "CONFLICT";
}

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface Booking {
  id: string;
  userName: string;
  userId?: string;
  locationId: string;
  facilityId: string;
  date: string;
  slots: BookingSlot[];
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
}

// ─── BOOKING DRAFT (for API) ──────────────────────────────────────────────────

export interface BookingDraftItem {
  facilityId: string;
  eventDate: string;
  slotId: string;
  price: number;
}

export interface BookingDraftRequest {
  userId: string;
  items: BookingDraftItem[];
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "member";

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
  userId?: string; // API compatibility
  roles?: any[]; // API compatibility
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export interface AvailabilityQueryParams {
  locationId?: string;
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
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

// ─── MASTER DATA ──────────────────────────────────────────────────────────────

export interface MasterDataRequest {
  clubs: { name: string }[];
  locations: {
    name: string;
    approverUserName: string;
    facilities: { name: string; type: string; capacity: number }[];
  }[];
}

// ─── TABLE & FORM COMPONENTS ──────────────────────────────────────────────────

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any, index: number) => ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
}