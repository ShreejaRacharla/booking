import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Booking, BookingStatus, BookingDraftRequest } from "../../types";
import {
  getBookings,
  getBookingById,
  createBookingDraft,
  submitBooking,
  approveBooking,
  rejectBooking,
} from "../../services/api";

interface BookingState {
  items: Booking[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  items: [],
  loading: false,
  error: null,
};

// ─── ASYNC THUNKS ─────────────────────────────────────────────────────────────

export const fetchBookings = createAsyncThunk("bookings/fetchAll", async () => {
  const response = await getBookings();
  return response.data;
});

export const fetchBookingById = createAsyncThunk(
  "bookings/fetchById",
  async (id: string) => {
    const response = await getBookingById(id);
    return response.data;
  }
);

export const createBookingDraftAPI = createAsyncThunk(
  "bookings/createDraft",
  async (data: BookingDraftRequest) => {
    const response = await createBookingDraft(data);
    return response.data;
  }
);

export const submitBookingAPI = createAsyncThunk(
  "bookings/submit",
  async (bookingId: string) => {
    const response = await submitBooking(bookingId);
    return response.data;
  }
);

export const approveBookingAPI = createAsyncThunk(
  "bookings/approve",
  async ({
    bookingId,
    approverUserId,
  }: {
    bookingId: string;
    approverUserId: string;
  }) => {
    const response = await approveBooking(bookingId, approverUserId);
    return response.data;
  }
);

export const rejectBookingAPI = createAsyncThunk(
  "bookings/reject",
  async ({
    bookingId,
    approverUserId,
    reason,
  }: {
    bookingId: string;
    approverUserId: string;
    reason?: string;
  }) => {
    const response = await rejectBooking(bookingId, approverUserId, reason);
    return response.data;
  }
);

// ─── SLICE ────────────────────────────────────────────────────────────────────

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    updateBookingStatus(
      state,
      action: PayloadAction<{ id: string; status: BookingStatus }>
    ) {
      const booking = state.items.find((b) => b.id === action.payload.id);
      if (booking) booking.status = action.payload.status;
    },
    addBooking(state, action: PayloadAction<Booking>) {
      state.items.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder.addCase(fetchBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.items = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
    });
    builder.addCase(fetchBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch bookings";
    });

    // Fetch By ID
    builder.addCase(fetchBookingById.fulfilled, (state, action) => {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
      else state.items.push(action.payload);
    });

    // Create Draft
    builder.addCase(createBookingDraftAPI.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    // Submit
    builder.addCase(submitBookingAPI.fulfilled, (state, action) => {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // Approve
    builder.addCase(approveBookingAPI.fulfilled, (state, action) => {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // Reject
    builder.addCase(rejectBookingAPI.fulfilled, (state, action) => {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
  },
});

export const { updateBookingStatus, addBooking } = bookingSlice.actions;
export default bookingSlice.reducer;