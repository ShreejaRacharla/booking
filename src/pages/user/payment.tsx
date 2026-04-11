// src/pages/user/payment.tsx  (or wherever your router maps /payment/payment-success)
// This page is reached after Razorpay redirects back to your frontend.
//
// URL shape:
//   /fe/payment/payment-success
//     ?bookingId=<uuid>
//     &razorpay_payment_id=pay_xxx
//     &razorpay_payment_link_id=plink_xxx
//     &razorpay_payment_link_reference_id=<uuid>
//     &razorpay_payment_link_status=paid | cancelled
//     &razorpay_signature=<hmac-sha256>

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { confirmBookingPayment } from "@/store/slices/bookingSlice"; // ← add this thunk (see below)

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentSuccessState {
  status: "loading" | "success" | "failed" | "cancelled";
  bookingId: string | null;
  paymentId: string | null;
  errorMessage?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [state, setState] = useState<PaymentSuccessState>({
    status: "loading",
    bookingId: null,
    paymentId: null,
  });

  useEffect(() => {
    // 1. Read every query param Razorpay sends back
    const bookingId = searchParams.get("bookingId");
    const razorpay_payment_id = searchParams.get("razorpay_payment_id");
    const razorpay_payment_link_id = searchParams.get("razorpay_payment_link_id");
    const razorpay_payment_link_reference_id = searchParams.get(
      "razorpay_payment_link_reference_id"
    );
    const razorpay_payment_link_status = searchParams.get(
      "razorpay_payment_link_status"
    );
    const razorpay_signature = searchParams.get("razorpay_signature");

    // 2. Guard: if status is not "paid", show cancelled/failed UI
    if (razorpay_payment_link_status !== "paid") {
      setState({
        status: "cancelled",
        bookingId,
        paymentId: razorpay_payment_id,
      });
      return;
    }

    // 3. Call your backend to verify signature + confirm booking
    if (bookingId && razorpay_payment_id && razorpay_signature) {
      dispatch(
        confirmBookingPayment({
          bookingId,
          razorpay_payment_id,
          razorpay_payment_link_id: razorpay_payment_link_id ?? "",
          razorpay_payment_link_reference_id:
            razorpay_payment_link_reference_id ?? "",
          razorpay_payment_link_status: razorpay_payment_link_status ?? "",
          razorpay_signature,
        })
      )
        .unwrap()
        .then(() => {
          setState({
            status: "success",
            bookingId,
            paymentId: razorpay_payment_id,
          });
        })
        .catch((err: unknown) => {
          setState({
            status: "failed",
            bookingId,
            paymentId: razorpay_payment_id,
            errorMessage:
              typeof err === "string" ? err : "Payment verification failed.",
          });
        });
    } else {
      setState({
        status: "failed",
        bookingId: null,
        paymentId: null,
        errorMessage: "Missing payment parameters.",
      });
    }
  }, [searchParams, dispatch]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">Verifying your payment…</p>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          {/* Success icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your booking has been confirmed.
          </p>

          {/* Booking details */}
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Booking ID</span>
              <span className="font-mono text-gray-700 text-xs break-all max-w-[60%] text-right">
                {state.bookingId}
              </span>
            </div>
            <div className="border-t border-gray-200" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment ID</span>
              <span className="font-mono text-gray-700 text-xs break-all max-w-[60%] text-right">
                {state.paymentId}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/user/booking-detail`)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              View Booking
            </button>
            <button
              onClick={() => navigate("/user/booking")}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "cancelled") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your payment was not completed. Your booking is still pending.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // status === "failed"
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Verification Failed
        </h1>
        <p className="text-gray-500 text-sm mb-2">
          {state.errorMessage ?? "Something went wrong verifying your payment."}
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Please contact support with your Booking ID:{" "}
          <span className="font-mono">{state.bookingId ?? "N/A"}</span>
        </p>
        <button
          onClick={() => navigate("/user/booking")}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition"
        >
          Go to Bookings
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;


// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS THUNK to src/store/slices/bookingSlice.ts
// ─────────────────────────────────────────────────────────────────────────────
//
// export const confirmBookingPayment = createAsyncThunk(
//   "booking/confirmPayment",
//   async (
//     payload: {
//       bookingId: string;
//       razorpay_payment_id: string;
//       razorpay_payment_link_id: string;
//       razorpay_payment_link_reference_id: string;
//       razorpay_payment_link_status: string;
//       razorpay_signature: string;
//     },
//     { rejectWithValue }
//   ) => {
//     try {
//       const res = await customAxios.post("/bookings/confirm-payment", payload);
//       return res.data;
//     } catch (err: any) {
//       return rejectWithValue(err?.response?.data?.message ?? "Payment confirmation failed");
//     }
//   }
// );


// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS ROUTE to src/app.tsx (or your router file)
// ─────────────────────────────────────────────────────────────────────────────
//
// {
//   path: "payment/payment-success",
//   element: <PaymentSuccessPage />,
// }
//
// Make sure it's inside your user/authenticated route group.