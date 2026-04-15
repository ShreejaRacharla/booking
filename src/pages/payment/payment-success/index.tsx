import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import customAxios from "../../../utils/customAxios"; 

interface PaymentSuccessState {
    status: "loading" | "success" | "failed" | "cancelled";
    bookingId: string | null;
    paymentId: string | null;
    errorMessage?: string;
}

interface SlotDetail {
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    facilityName: string;
}

interface ConfirmationData {
    bookingCode?: string;
    slots?: SlotDetail[];
    paymentStatus?: string;
    paidAt?: string;
    amount?: number;
}

interface BookingDetail {
    id?: string;
    locationName?: string;
    location?: {
        name?: string;
    };
}

const PaymentSuccessPage = () => {
    const router = useRouter();

    const [state, setState] = useState<PaymentSuccessState>({
        status: "loading",
        bookingId: null,
        paymentId: null,
    });

    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
    const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);

    const fetchBookingById = async (bookingId: string) => {
        try {
            const response = await customAxios.get(`/v1/booking/${bookingId}`);
            setBookingDetail(response.data);
        } catch (error) {
            console.error("Error fetching booking detail:", error);
        }
    };

    const fetchPaymentConfirmation = async (
        bookingId: string,
        paymentId: string
    ) => {
        try {
            const response = await customAxios.get(
                `/v1/payments/webhook/api/bookings/${bookingId}/payment/${paymentId}/confirmation`
            );
            setConfirmationData(response.data);
            await fetchBookingById(bookingId);
            setState({
                status: "success",
                bookingId: bookingId,
                paymentId: paymentId,
            });
        } catch (error) {
            console.error("Error fetching payment confirmation:", error);
            setState({
                status: "success",
                bookingId: bookingId,
                paymentId: paymentId,
            });
        }
    };

    useEffect(() => {
        if (!router.isReady) return;
        
        const {
            bookingId,
            razorpay_payment_id,
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
            fetchPaymentConfirmation(
                bookingId as string,
                razorpay_payment_id as string
            );
        } else {
            setState({
                status: "failed",
                bookingId: null,
                paymentId: null,
                errorMessage: "Missing payment parameters.",
            });
        }
    }, [router.isReady, router.query]);

    if (state.status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 text-sm">Verifying your payment…</p>
            </div>
        );
    }

    if (state.status === "success") {
        const locationName = bookingDetail?.locationName || bookingDetail?.location?.name;

        return (
            <div className="flex flex-col items-center justify-center px-4 py-8">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-10 h-10 text-green-600"
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
                        <h1 className="text-3xl font-bold text-green-600 mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Your booking has been confirmed.
                        </p>
                    </div>

                    {confirmationData?.bookingCode && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
                            <p className="text-sm text-gray-600 mb-1">Booking Code</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {confirmationData.bookingCode}
                            </p>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>

                        {confirmationData?.amount && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">Amount Paid</span>
                                <span className="font-bold text-green-600 text-lg">
                                    ₹{confirmationData.amount.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        )}

                        {confirmationData?.paymentStatus && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">Payment Status</span>
                                <span className="font-semibold text-green-600 uppercase">
                                    {confirmationData.paymentStatus}
                                </span>
                            </div>
                        )}

                        {confirmationData?.paidAt && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">Paid At</span>
                                <span className="font-semibold text-gray-800">
                                    {confirmationData.paidAt}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-gray-600">Booking ID</span>
                            <span className="font-mono text-xs font-semibold text-gray-800">
                                {state.bookingId}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Payment ID</span>
                            <span className="font-mono text-xs font-semibold text-gray-800">
                                {state.paymentId}
                            </span>
                        </div>
                    </div>

                    {confirmationData?.slots && confirmationData.slots.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-3">Booking Details</h3>

                            <div className="mb-3 pb-3 border-b border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Facility</p>
                                <p className="font-semibold text-gray-800 text-lg">
                                    {confirmationData.slots[0].facilityName}
                                </p>
                            </div>

                            {locationName && (
                                <div className="mb-3 pb-3 border-b border-gray-200">
                                    <p className="text-sm text-gray-600 mb-1">Location</p>
                                    <p className="font-semibold text-gray-800">
                                        {locationName}
                                    </p>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-600 mb-2">Booked Slots</p>
                                <div className="space-y-2">
                                    {confirmationData.slots.map((slot, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-lg p-3 border border-gray-200"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-800">
                                                    {new Date(slot.date + "T00:00:00").toLocaleDateString("en-IN", {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                                <span className="text-sm font-semibold text-blue-600">
                                                    {slot.startTime} - {slot.endTime}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {slot.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push(`/user/booking-detail?id=${state.bookingId}`)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
                        >
                            View Booking Details
                        </button>

                        <button
                            onClick={() => router.push("/user/booking-status")}
                            className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-medium transition-colors"
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
            <div className="flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-10 h-10 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-yellow-600 mb-2">
                            Payment Cancelled
                        </h1>
                        <p className="text-gray-500 text-sm">
                            You cancelled the payment process.
                        </p>
                    </div>

                    {state.bookingId && (
                        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Booking ID</span>
                                <span className="font-mono text-xs break-all font-semibold">
                                    {state.bookingId}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => router.push("/user/booking")}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl mb-3 font-medium transition-colors"
                    >
                        View My Bookings
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-10 h-10 text-red-600"
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
                    <h1 className="text-2xl font-bold text-red-600 mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {state.errorMessage || "Something went wrong with your payment."}
                    </p>
                </div>

                <button
                    onClick={() => router.push("/user/booking-status")}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl mb-3 font-medium transition-colors"
                >
                    Go to My Bookings
                </button>

                <button
                    onClick={() => router.push("/user/dashboard")}
                    className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-medium transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;