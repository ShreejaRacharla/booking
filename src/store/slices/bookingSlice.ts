/**
 * src/store/slices/bookingSlice.ts
 */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Booking, BookingStatus } from "../../types";
import {
  getBookings,
  getBookingById,
  getMyBookings,
  createBookingDraft,
  submitBooking,
  cancelBooking,
  getPendingApprovals,
  approveBooking,
  rejectBooking,
  generatePaymentLink,
} from "../../services/api";

// ─── STATE ────────────────────────────────────────────────────────────────────

interface BookingState {
  items: Booking[];
  myBookings: Booking[];
  pendingApprovals: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  items: [],
  myBookings: [],
  pendingApprovals: [],
  currentBooking: null,
  loading: false,
  error: null,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Flatten any API response shape into a Booking array */
function normaliseList(payload: any): Booking[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

/** Flatten a single-booking response (may be wrapped in { data: ... }) */
function normaliseSingle(payload: any): Booking {
  if (payload?.data && typeof payload.data === "object" && payload.data?.id)
    return payload.data;
  return payload;
}

// ─── THUNKS ───────────────────────────────────────────────────────────────────

export const fetchBookings = createAsyncThunk(
  "bookings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getBookings();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to fetch bookings"
      );
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  "bookings/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMyBookings();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to fetch bookings"
      );
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  "bookings/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await getBookingById(id);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to fetch booking"
      );
    }
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  "bookings/fetchPendingApprovals",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getPendingApprovals();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to fetch approvals"
      );
    }
  }
);

export const createBookingDraftAPI = createAsyncThunk(
  "bookings/createDraft",
  async (
    data: {
      userId: string;
      items: {
        facilityId: string;
        eventDate: string;
        slotId: string;
        price: number;
      }[];
      eventDetails?: {
        purpose: string;
        expectedAttendees: number;
        specialRequirements?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await createBookingDraft(data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to create draft"
      );
    }
  }
);

export const submitBookingAPI = createAsyncThunk(
  "bookings/submit",
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const res = await submitBooking(bookingId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit booking"
      );
    }
  }
);

export const cancelBookingAPI = createAsyncThunk(
  "bookings/cancel",
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const res = await cancelBooking(bookingId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to cancel"
      );
    }
  }
);

export const approveBookingAPI = createAsyncThunk(
  "bookings/approve",
  async (
    data: { bookingId: string; approverUserId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await approveBooking(data.bookingId, data.approverUserId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to approve"
      );
    }
  }
);

export const rejectBookingAPI = createAsyncThunk(
  "bookings/reject",
  async (
    data: {
      bookingId: string;
      approverUserId: string;
      reason: string;
      alternatives?: {
        facilityId: string;
        eventDate: string;
        slotId: string;
        price: number;
      }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await rejectBooking(data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to reject"
      );
    }
  }
);

export const generatePaymentLinkAPI = createAsyncThunk(
  "bookings/generatePaymentLink",
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const res = await generatePaymentLink(bookingId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate payment link"
      );
    }
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearCurrentBooking(state) {
      state.currentBooking = null;
    },
    updateBookingStatus(
      state,
      action: PayloadAction<{ id: string; status: BookingStatus }>
    ) {
      const { id, status } = action.payload;
      const b = state.items.find((x) => x.id === id);
      if (b) b.status = status;
      const mb = state.myBookings.find((x) => x.id === id);
      if (mb) mb.status = status;
      if (state.currentBooking?.id === id) state.currentBooking.status = status;
    },
  },
  extraReducers: (builder) => {
    // fetchBookings
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = normaliseList(action.payload);
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch bookings";
      });

    // fetchMyBookings
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = normaliseList(action.payload);
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch bookings";
      });

    // fetchBookingById
    builder
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = normaliseSingle(action.payload);
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch booking";
      });

    // fetchPendingApprovals
    builder
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.pendingApprovals = normaliseList(action.payload);
      });

    // createBookingDraftAPI
    builder
      .addCase(createBookingDraftAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBookingDraftAPI.fulfilled, (state, action) => {
        state.loading = false;
        const booking = normaliseSingle(action.payload);
        state.currentBooking = booking;
        state.myBookings = [booking, ...state.myBookings];
      })
      .addCase(createBookingDraftAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create draft";
      });

    // submitBookingAPI
    builder.addCase(submitBookingAPI.fulfilled, (state, action) => {
      const updated = normaliseSingle(action.payload);
      if (updated?.id) {
        const idx = state.myBookings.findIndex((b) => b.id === updated.id);
        if (idx !== -1) state.myBookings[idx] = updated;
        if (state.currentBooking?.id === updated.id)
          state.currentBooking = updated;
      }
    });

    // cancelBookingAPI
    builder.addCase(cancelBookingAPI.fulfilled, (state, action) => {
      const updated = normaliseSingle(action.payload);
      if (updated?.id) {
        const idx = state.myBookings.findIndex((b) => b.id === updated.id);
        if (idx !== -1) state.myBookings[idx] = updated;
        if (state.currentBooking?.id === updated.id)
          state.currentBooking = updated;
      }
    });

    // approveBookingAPI
    builder.addCase(approveBookingAPI.fulfilled, (state, action) => {
      const updated = normaliseSingle(action.payload);
      if (updated?.id) {
        state.pendingApprovals = state.pendingApprovals.filter(
          (b) => b.id !== updated.id
        );
      }
    });

    // rejectBookingAPI
    builder.addCase(rejectBookingAPI.fulfilled, (state, action) => {
      const updated = normaliseSingle(action.payload);
      if (updated?.id) {
        state.pendingApprovals = state.pendingApprovals.filter(
          (b) => b.id !== updated.id
        );
      }
    });

    // generatePaymentLinkAPI
    builder.addCase(generatePaymentLinkAPI.fulfilled, (state, action) => {
      if (state.currentBooking) {
        const d = action.payload;
        state.currentBooking.paymentLink =
          d?.paymentLink ?? d?.link ?? d ?? undefined;
      }
    });
  },
});

export const { clearCurrentBooking, updateBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;