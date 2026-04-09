import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "../../store";
import {
  fetchBookingById,
  clearCurrentBooking,
  cancelBookingAPI,
  generatePaymentLinkAPI,
} from "../../store/slices/bookingSlice";
import { BookingStatus } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Button,
  Badge,
  Modal,
} from "../../components";
import {
  Loader2,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// ─── STATUS MAPS ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-yellow-500",
  PENDING: "bg-yellow-500",
  PENDING_APPROVAL: "bg-yellow-500",
  APPROVED: "bg-green-500",
  APPROVED_PENDING_PAYMENT: "bg-green-500",
  CONFIRMED_FULL: "bg-blue-500",
  REJECTED: "bg-red-500",
  PAID: "bg-blue-500",
  CANCELLED: "bg-gray-600",
};

const STATUS_ICONS: Record<string, any> = {
  DRAFT: AlertCircle,
  SUBMITTED: Clock,
  PENDING: Clock,
  PENDING_APPROVAL: Clock,
  APPROVED: CheckCircle,
  APPROVED_PENDING_PAYMENT: CheckCircle,
  CONFIRMED_FULL: CheckCircle,
  REJECTED: XCircle,
  PAID: CheckCircle,
  CANCELLED: XCircle,
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  APPROVED_PENDING_PAYMENT: "Awaiting Payment",
  CONFIRMED_FULL: "Confirmed",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  // ✅ FIX: Wait for router to be ready
  const { isReady, query } = router;
  
  const rawId = query.id ?? query.bookingId;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { currentBooking, loading, error } = useSelector(
    (s: RootState) => s.bookings
  );
  const user = useSelector((s: RootState) => s.auth.user);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [generatingPayment, setGeneratingPayment] = useState(false);

  // ✅ FIX: Only fetch when router is ready AND id exists
  useEffect(() => {
    if (isReady && id) {
      console.log("🔍 Fetching booking:", id);
      dispatch(fetchBookingById(id) as any);
    }
    
    return () => {
      dispatch(clearCurrentBooking());
    };
  }, [isReady, id, dispatch]);

  // ✅ Debug logs
  useEffect(() => {
    console.log("=== DEBUG ===");
    console.log("Router ready:", isReady);
    console.log("Query:", query);
    console.log("ID:", id);
    console.log("Loading:", loading);
    console.log("Error:", error);
    console.log("Current Booking:", currentBooking);
  }, [isReady, query, id, loading, error, currentBooking]);

  // ── Router not ready yet ───────────────────────────────────────────────────
  if (!isReady) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          <p className="text-sm text-rotary-darkgray">Initializing...</p>
        </div>
      </Layout>
    );
  }

  // ── No ID provided ───────────────────────────────────────────────────────
  if (!id) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <AlertCircle className="w-12 h-12 text-rotary-darkgray" />
          <p className="text-rotary-darkgray">No booking ID provided</p>
          <Button onClick={() => router.push("/user/booking")}>
            ← Back to My Bookings
          </Button>
        </div>
      </Layout>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          <p className="text-sm text-rotary-darkgray">Loading booking details...</p>
        </div>
      </Layout>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={() => router.push("/user/booking")}>
            ← Back to My Bookings
          </Button>
        </div>
      </Layout>
    );
  }

  // ── No booking found ───────────────────────────────────────────────────────
  if (!currentBooking) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <AlertCircle className="w-12 h-12 text-rotary-darkgray" />
          <p className="text-rotary-darkgray">Booking not found</p>
          <p className="text-sm text-gray-400">ID: {id}</p>
          <Button onClick={() => dispatch(fetchBookingById(id) as any)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button variant="ghost" onClick={() => router.push("/user/booking")}>
            ← Back to My Bookings
          </Button>
        </div>
      </Layout>
    );
  }

  // ✅ Get status safely
  const status = (currentBooking.status || "DRAFT") as BookingStatus;
  const StatusIcon = STATUS_ICONS[status] ?? AlertCircle;
  const statusLabel = STATUS_LABELS[status] ?? status;

  // ✅ Get approval info
  const approvedApproval = currentBooking.approvals?.find(
    (a) => a.status === "APPROVED"
  );
  const rejectedApproval = currentBooking.approvals?.find(
    (a) => a.status === "REJECTED"
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await dispatch(cancelBookingAPI(id) as any).unwrap();
      alert("✅ Booking cancelled successfully");
      setCancelModalOpen(false);
      dispatch(fetchBookingById(id) as any);
    } catch (err: any) {
      alert(err?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!id) return;
    setGeneratingPayment(true);
    try {
      await dispatch(generatePaymentLinkAPI(id) as any).unwrap();
      alert("✅ Payment link generated!");
      dispatch(fetchBookingById(id) as any);
    } catch (err: any) {
      alert(err?.message || "Failed to generate payment link");
    } finally {
      setGeneratingPayment(false);
    }
  };

  // ✅ Action availability
  const canCancel = ["DRAFT", "PENDING", "SUBMITTED", "PENDING_APPROVAL"].includes(status);
  const canPay = ["APPROVED", "APPROVED_PENDING_PAYMENT"].includes(status);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <PageHeader
        title={`Booking ${currentBooking.bookingCode || `#${currentBooking.id?.slice(0, 8)}`}`}
        subtitle="View booking details and status"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-rotary-royal">
                Booking Status
              </h3>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium ${
                  STATUS_COLORS[status] ?? "bg-gray-500"
                }`}
              >
                <StatusIcon className="w-4 h-4" />
                {statusLabel}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {/* Created */}
              {currentBooking.createdAt && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-rotary-royal" />}
                  color="bg-rotary-royal/10"
                  label="Created"
                  time={currentBooking.createdAt}
                />
              )}

              {/* Approved */}
              {approvedApproval && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                  color="bg-green-500/10"
                  label="Approved"
                  time={approvedApproval.actionTime || undefined}
                  sub={
                    approvedApproval.approverUserId
                      ? `Approver: ${approvedApproval.approverUserId.slice(0, 8)}`
                      : undefined
                  }
                />
              )}

              {/* Rejected */}
              {rejectedApproval && (
                <TimelineStep
                  icon={<XCircle className="w-4 h-4 text-red-500" />}
                  color="bg-red-500/10"
                  label="Rejected"
                  time={rejectedApproval.actionTime || undefined}
                  sub={rejectedApproval.remarks || "No reason provided"}
                  subClass="text-red-600"
                />
              )}

              {/* Confirmed/Paid */}
              {status === "CONFIRMED_FULL" && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
                  color="bg-blue-500/10"
                  label="Confirmed & Paid"
                />
              )}
            </div>
          </Card>

          {/* Booked Slots */}
          <Card>
            <h3 className="text-base font-bold text-rotary-royal mb-4">
              Booked Slots ({currentBooking.items?.length || 0})
            </h3>
            {!currentBooking.items?.length ? (
              <p className="text-sm text-rotary-darkgray">No slots found.</p>
            ) : (
              <div className="space-y-3">
                {currentBooking.items.map((item, idx) => (
                  <div
                    key={item.id ?? idx}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-rotary-black">
                          {item.facilityName || `Facility ${item.facilityId?.slice(0, 8)}`}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-rotary-darkgray">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {item.eventDate
                              ? new Date(item.eventDate + "T00:00:00").toLocaleDateString()
                              : "N/A"}
                          </span>
                          {(item.startTime || item.endTime) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {item.startTime?.slice(0, 5) ?? "?"} –{" "}
                              {item.endTime?.slice(0, 5) ?? "?"}
                            </span>
                          )}
                          {item.slotName && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {item.slotName}
                            </span>
                          )}
                        </div>
                        {/* Item status */}
                        {item.status && (
                          <div className="mt-2">
                            <Badge
                              variant={
                                item.status === "APPROVED" || item.status === "CONFIRMED_FULL"
                                  ? "active"
                                  : item.status === "PENDING" || item.status === "PENDING_APPROVAL"
                                  ? "pending"
                                  : "inactive"
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold text-rotary-royal ml-4">
                        ₹{item.price != null ? item.price.toLocaleString("en-IN") : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Event Details */}
          {currentBooking.eventDetails && (
            <Card>
              <h3 className="text-base font-bold text-rotary-royal mb-4">
                Event Details
              </h3>
              <div className="space-y-3">
                <DetailRow
                  label="Purpose"
                  value={currentBooking.eventDetails.purpose}
                />
                <DetailRow
                  label="Expected Attendees"
                  value={
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {currentBooking.eventDetails.expectedAttendees}
                    </span>
                  }
                />
                {currentBooking.eventDetails.specialRequirements && (
                  <DetailRow
                    label="Special Requirements"
                    value={currentBooking.eventDetails.specialRequirements}
                  />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT: Summary & Actions ── */}
        <div className="lg:col-span-1">
          <Card className="sticky top-5">
            <h3 className="text-base font-bold text-rotary-royal mb-4">
              Summary
            </h3>

            <div className="space-y-3 mb-4">
              <SummaryRow
                label="Booking Code"
                value={currentBooking.bookingCode || "N/A"}
              />
              <SummaryRow
                label="User"
                value={
                  currentBooking.userName ||
                  user?.username ||
                  currentBooking.userId?.slice(0, 8) ||
                  "—"
                }
              />
              <SummaryRow
                label="Slots"
                value={String(currentBooking.items?.length ?? 0)}
              />
              <SummaryRow
                label="Status"
                value={<Badge variant="pending">{statusLabel}</Badge>}
              />
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-rotary-royal">
                  ₹
                  {currentBooking.totalAmount != null
                    ? currentBooking.totalAmount.toLocaleString("en-IN")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Payment link */}
            {currentBooking.paymentLink && (
              <div className="mb-4 p-3 bg-rotary-turquoise/10 border border-rotary-turquoise rounded-lg">
                <div className="text-sm font-medium text-rotary-royal mb-2">
                  Payment Link Available
                </div>
                <a
                  href={currentBooking.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-rotary-azure hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Click here to pay
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              {canPay && !currentBooking.paymentLink && (
                <Button
                  fullWidth
                  onClick={handleGeneratePaymentLink}
                  disabled={generatingPayment}
                >
                  {generatingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate Payment Link"
                  )}
                </Button>
              )}

              {currentBooking.paymentLink && canPay && (
                <Button
                  fullWidth
                  onClick={() =>
                    window.open(currentBooking.paymentLink!, "_blank")
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              )}

              {canCancel && (
                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Booking
                </Button>
              )}

              <Button
                fullWidth
                variant="ghost"
                onClick={() => router.push("/user/booking")}
              >
                ← Back to My Bookings
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => !cancelling && setCancelModalOpen(false)}
        title="Cancel Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-rotary-darkgray">
            Are you sure you want to cancel this booking? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="danger"
              fullWidth
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Yes, Cancel Booking"
              )}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelling}
            >
              No, Keep It
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function TimelineStep({
  icon,
  color,
  label,
  time,
  sub,
  subClass = "text-rotary-darkgray",
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  time?: string;
  sub?: string;
  subClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <div className="font-medium text-sm">{label}</div>
        {time && (
          <div className="text-xs text-rotary-darkgray">
            {new Date(time).toLocaleString()}
          </div>
        )}
        {sub && <div className={`text-xs mt-0.5 ${subClass}`}>{sub}</div>}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-rotary-darkgray">{label}</div>
      <div className="text-rotary-black mt-0.5">{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-rotary-darkgray">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}