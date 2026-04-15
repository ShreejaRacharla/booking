import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
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
import customAxios from "../../utils/customAxios";

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

function getUserIdFromToken(): string | null {
  try {
    const token = Cookies.get("accessToken");

    if (!token) {
      console.warn("No accessToken found in cookies");
      return null;
    }

    const base64Url = token.split(".")[1];
    if (!base64Url) {
      console.error("Invalid token format");
      return null;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const decoded = JSON.parse(jsonPayload);
    const userId = decoded.id || decoded.userId || decoded.user_id || null;

    if (userId) {
      return userId;
    }

    console.error(
      "No userId field found in token. Available fields:",
      Object.keys(decoded)
    );
    return null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

function normaliseList(payload: any): Booking[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function normaliseSingle(payload: any): Booking {
  if (payload?.data && typeof payload.data === "object" && payload.data?.id)
    return payload.data;
  return payload;
}

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
      const userId = getUserIdFromToken();

      if (!userId) {
        console.error("Could not get userId from token");
        return rejectWithValue("Unable to get user ID from token");
      }

      const res = await getBookings();
      const allBookings = normaliseList(res.data);
      const userBookings = allBookings.filter(
        (booking: Booking) => booking.userId === userId
      );

      if (userBookings.length > 0) {
        userBookings.slice(0, 5).forEach((b: Booking) => {
        });
        if (userBookings.length > 5) {
        }
      }

      return userBookings;
    } catch (err: any) {
      console.error("Error in fetchMyBookings:", err);
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
        err?.response?.data?.message || err?.message || "Failed to submit booking"
      );
    }
  }
);

export const cancelBookingAPI = createAsyncThunk(
  "bookings/cancelBooking",
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await cancelBooking(id, reason);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel booking"
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
      return { ...res.data, _bookingId: data.bookingId };
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
      return { ...res.data, _bookingId: data.bookingId };
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
        err?.response?.data?.message || err?.message || "Failed to generate payment link"
      );
    }
  }
);

export const confirmBookingPayment = createAsyncThunk(
  "booking/confirmPayment",
  async (
    payload: {
      bookingId: string;
      razorpay_payment_id: string;
      razorpay_payment_link_id: string;
      razorpay_payment_link_reference_id: string;
      razorpay_payment_link_status: string;
      razorpay_signature: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await customAxios.post("/bookings/confirm-payment", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Payment confirmation failed");
    }
  }
);

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearCurrentBooking(state) {
      state.currentBooking = null;
    },
    clearMyBookings(state) {
      state.myBookings = [];
    },
    clearError(state) {
      state.error = null;
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

    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = action.payload as Booking[];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch bookings";
      });

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

    builder.addCase(fetchPendingApprovals.fulfilled, (state, action) => {
      state.pendingApprovals = normaliseList(action.payload);
    });

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

    builder.addCase(submitBookingAPI.fulfilled, (state, action) => {
      const updated = normaliseSingle(action.payload);
      if (updated?.id) {
        const idx = state.myBookings.findIndex((b) => b.id === updated.id);
        if (idx !== -1) state.myBookings[idx] = updated;
        if (state.currentBooking?.id === updated.id)
          state.currentBooking = updated;
      }
    });

    builder.addCase(cancelBookingAPI.fulfilled, (state, action) => {
      const updated = normaliseSingle(action.payload);
      if (updated?.id) {
        const idx = state.myBookings.findIndex((b) => b.id === updated.id);
        if (idx !== -1) state.myBookings[idx] = updated;
        if (state.currentBooking?.id === updated.id)
          state.currentBooking = updated;
      }
    });

    builder.addCase(approveBookingAPI.fulfilled, (state, action) => {
      const payload = action.payload as any;
      const bookingId = payload?._bookingId || normaliseSingle(payload)?.id;

      if (bookingId) {
        state.pendingApprovals = state.pendingApprovals.filter(
          (b) => b.id !== bookingId
        );

        const itemIdx = state.items.findIndex((b) => b.id === bookingId);
        if (itemIdx !== -1) {
          state.items[itemIdx] = {
            ...state.items[itemIdx],
            status: "APPROVED_PENDING_PAYMENT",
          };
        }

        const myIdx = state.myBookings.findIndex((b) => b.id === bookingId);
        if (myIdx !== -1) {
          state.myBookings[myIdx] = {
            ...state.myBookings[myIdx],
            status: "APPROVED_PENDING_PAYMENT",
          };
        }

        if (state.currentBooking !== null && state.currentBooking.id === bookingId) {
          state.currentBooking.status = "APPROVED_PENDING_PAYMENT";
        }
      }
    });

    builder.addCase(rejectBookingAPI.fulfilled, (state, action) => {
      const payload = action.payload as any;
      const bookingId = payload?._bookingId || normaliseSingle(payload)?.id;

      if (bookingId) {
        state.pendingApprovals = state.pendingApprovals.filter(
          (b) => b.id !== bookingId
        );

        const itemIdx = state.items.findIndex((b) => b.id === bookingId);
        if (itemIdx !== -1) {
          state.items[itemIdx] = {
            ...state.items[itemIdx],
            status: "REJECTED",
          };
        }

        const myIdx = state.myBookings.findIndex((b) => b.id === bookingId);
        if (myIdx !== -1) {
          state.myBookings[myIdx] = {
            ...state.myBookings[myIdx],
            status: "REJECTED",
          };
        }

        if (state.currentBooking !== null && state.currentBooking.id === bookingId) {
          state.currentBooking.status = "REJECTED";
        }
      }
    });

    builder.addCase(generatePaymentLinkAPI.fulfilled, (state, action) => {
      if (state.currentBooking) {
        const d = action.payload;
        state.currentBooking.paymentLink =
          d?.paymentLink ?? d?.link ?? d ?? undefined;
      }
    });
  },
});

export const {
  clearCurrentBooking,
  clearMyBookings,
  clearError,
  updateBookingStatus,
} = bookingSlice.actions;

export default bookingSlice.reducer;