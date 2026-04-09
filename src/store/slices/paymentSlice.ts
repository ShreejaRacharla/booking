import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { verifyPayment, getFlaggedPayments } from "../../services/api";

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "FLAGGED" | "VERIFIED";
  paymentId?: string;
  paymentLink?: string;
  createdAt: string;
  verifiedAt?: string;
  notes?: string;
}

interface PaymentState {
  flaggedPayments: Payment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  flaggedPayments: [],
  loading: false,
  error: null,
};

export const fetchFlaggedPayments = createAsyncThunk(
  "payments/fetchFlagged",
  async () => {
    const response = await getFlaggedPayments();
    return response.data;
  }
);

export const verifyPaymentAPI = createAsyncThunk(
  "payments/verify",
  async (data: {
    bookingId: string;
    paymentId: string;
    status: "verified" | "flagged" | "rejected";
    notes?: string;
  }) => {
    const response = await verifyPayment(data);
    return response.data;
  }
);

const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchFlaggedPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFlaggedPayments.fulfilled, (state, action) => {
      state.loading = false;
      state.flaggedPayments = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
    });
    builder.addCase(fetchFlaggedPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch flagged payments";
    });

    builder.addCase(verifyPaymentAPI.fulfilled, (state, action) => {
      state.flaggedPayments = state.flaggedPayments.filter(
        (p) => p.id !== action.payload.id
      );
    });
  },
});

export default paymentSlice.reducer;