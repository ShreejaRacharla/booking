import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { confirmBookingPayment } from "@/store/slices/bookingSlice";

interface PaymentSuccessState {
    status: "loading" | "success" | "failed" | "cancelled";
    bookingId: string | null;
    paymentId: string | null;
    errorMessage?: string;
}

const PaymentSuccessPage = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const [state, setState] = useState<PaymentSuccessState>({
        status: "loading",
        bookingId: null,
        paymentId: null,
    });

    useEffect(() => {
        if (!router.isReady) return;

        console.log("QUERY:", router.query);


        const {
            bookingId,
            razorpay_payment_id,
            razorpay_payment_link_id,
            razorpay_payment_link_reference_id,
            razorpay_payment_link_status,
            razorpay_signature,
        } = router.query;

        if (razorpay_payment_link_status !== "paid") {
            setState({
                status: "cancelled",
                bookingId: bookingId as string,
                paymentId: razorpay_payment_id as string,
            });
            return;
        }

        if (bookingId && razorpay_payment_id && razorpay_signature) {
            dispatch(
                confirmBookingPayment({
                    bookingId: bookingId as string,
                    razorpay_payment_id: razorpay_payment_id as string,
                    razorpay_payment_link_id:
                        (razorpay_payment_link_id as string) ?? "",
                    razorpay_payment_link_reference_id:
                        (razorpay_payment_link_reference_id as string) ?? "",
                    razorpay_payment_link_status:
                        (razorpay_payment_link_status as string) ?? "",
                    razorpay_signature: razorpay_signature as string,
                })
            )
                .unwrap()
                .then(() => {
                    setState({
                        status: "success",
                        bookingId: bookingId as string,
                        paymentId: razorpay_payment_id as string,
                    });
                })
                .catch(() => {
                    if (razorpay_payment_id) {
                        setState({
                            status: "success",
                            bookingId: bookingId as string,
                            paymentId: razorpay_payment_id as string,
                        });
                    } else {
                        setState({
                            status: "failed", bookingId: null, paymentId: null
                        });
                    }
                });
        } else {
            setState({
                status: "failed",
                bookingId: null,
                paymentId: null,
                errorMessage: "Missing payment parameters.",
            });
        }
    }, [router.isReady, router.query, dispatch]);

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
                    <h1 className="text-2xl font-bold text-green-600 mb-2">
                        Payment Successful 🎉
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Your booking has been confirmed.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>Booking ID</span>
                            <span className="font-mono text-xs break-all">
                                {state.bookingId}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span>Payment ID</span>
                            <span className="font-mono text-xs break-all">
                                {state.paymentId}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            router.push(`/user/booking-detail`)
                        }
                        className="w-full bg-blue-600 text-white py-3 rounded-xl mb-3"
                    >
                        View Booking
                    </button>

                    <button
                        onClick={() => router.push("/user/booking")}
                        className="w-full border py-3 rounded-xl"
                    >
                        My Bookings
                    </button>
                </div>
            </div>
        );
    }

    if (state.status === "cancelled") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-yellow-600">
                        Payment Cancelled ⚠️
                    </h1>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-xl font-bold text-red-600">
                    Payment Failed
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    {state.errorMessage}
                </p>

                <button
                    onClick={() => router.push("/user/booking")}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
                >
                    Go to Bookings
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;