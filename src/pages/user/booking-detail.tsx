import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "../../store";
import {
  fetchBookingById,
  clearCurrentBooking,
  cancelBookingAPI,
} from "../../store/slices/bookingSlice";
import { fetchFacilities } from "../../store/slices/facilitySlice";
import { BookingStatus } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Button,
  Badge,
  Modal,
  Input,
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
  Loader,
  MapPin,
  IndianRupee,
  Hash,
  User,
  FileText,
  ChevronLeft,
} from "lucide-react";

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
  CONFIRMED: "bg-blue-500",
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
  CONFIRMED: CheckCircle,
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
  CONFIRMED: "Confirmed",
};

// ============ FIXED DATE PARSING FUNCTIONS ============

function parseEventDate(eventDate: any): string {
  if (!eventDate) return "N/A";

  try {
    let date: Date;

    // Handle string format: "2026-04-27"
    if (typeof eventDate === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        const [year, month, day] = eventDate.split("-");
        return `${year}/${month}/${day}`;
      }
      // Handle other string formats
      date = new Date(eventDate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
      }
    }

    // Handle array format: [2026, 4, 27]
    if (Array.isArray(eventDate)) {
      if (eventDate.length >= 3) {
        const year = eventDate[0];
        const month = String(eventDate[1]).padStart(2, "0");
        const day = String(eventDate[2]).padStart(2, "0");
        return `${year}/${month}/${day}`;
      }
    }

    // Handle number (timestamp)
    if (typeof eventDate === "number") {
      date = new Date(eventDate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
      }
    }

    return "N/A";
  } catch (error) {
    console.error("Date parsing error:", error, eventDate);
    return "N/A";
  }
}

function parseCreatedAt(createdAt: any): string {
  if (!createdAt) return "N/A";

  try {
    let date: Date;

    // Handle string format: "2026-04-17 16:01 PM"
    if (typeof createdAt === "string") {
      // Remove "AM/PM" and clean up the string
      const cleanedString = createdAt
        .replace(/\s?(AM|PM)/i, "")
        .trim();

      // Try parsing as is
      date = new Date(cleanedString);
      
      if (!isNaN(date.getTime())) {
        return formatDate(date);
      }

      // Try alternative parsing with regex
      const match = createdAt.match(
        /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/
      );
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        return formatDate(date);
      }
    }

    // Handle array format: [2026, 4, 17, 16, 1, 0]
    if (Array.isArray(createdAt)) {
      if (createdAt.length >= 6) {
        const [year, month, day, hour, minute, second] = createdAt;
        date = new Date(year, month - 1, day, hour, minute, second);
        return formatDate(date);
      } else if (createdAt.length >= 3) {
        const [year, month, day] = createdAt;
        date = new Date(year, month - 1, day);
        return formatDate(date);
      }
    }

    // Handle number (timestamp)
    if (typeof createdAt === "number") {
      date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        return formatDate(date);
      }
    }

    return "N/A";
  } catch (error) {
    console.error("DateTime parsing error:", error, createdAt);
    return "N/A";
  }
}

// Helper function to format date consistently
function formatDate(date: Date): string {
  if (isNaN(date.getTime())) return "N/A";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export default function BookingDetailPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isReady, query } = router;
  const rawId = query.id ?? query.bookingId;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { currentBooking, loading, error } = useSelector(
    (s: RootState) => s.bookings
  );
  const user = useSelector((s: RootState) => s.auth.user);
  const facilities = useSelector((s: RootState) => s.facilities.items);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [facilityNames, setFacilityNames] = useState<Record<string, string>>({});

  // Fetch facilities if not already loaded
  useEffect(() => {
    if (!facilities.length) {
      dispatch(fetchFacilities() as any);
    }
  }, [dispatch, facilities.length]);

  // Fetch booking details
  useEffect(() => {
    if (isReady && id) {
      dispatch(fetchBookingById(id) as any);
    }
    return () => {
      dispatch(clearCurrentBooking());
    };
  }, [isReady, id, dispatch]);

  // Map facility IDs to names
  useEffect(() => {
    if (currentBooking?.items && facilities.length > 0) {
      const names: Record<string, string> = {};
      currentBooking.items.forEach((item) => {
        const facility = facilities.find((f) => f.id === item.facilityId);
        if (facility) {
          names[item.facilityId] = facility.name;
        }
      });
      setFacilityNames(names);
    }
  }, [currentBooking, facilities]);

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

  if (!id) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <AlertCircle className="w-12 h-12 text-rotary-darkgray" />
          <p className="text-rotary-darkgray">No booking ID provided</p>
          <Button onClick={() => router.push("/user/booking-status")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to My Bookings
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={() => router.push("/user/booking-status")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to My Bookings
          </Button>
        </div>
      </Layout>
    );
  }

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
          <Button
            variant="ghost"
            onClick={() => router.push("/user/booking-status")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to My Bookings
          </Button>
        </div>
      </Layout>
    );
  }

  const status = (currentBooking.status || "DRAFT") as BookingStatus | "CONFIRMED";
  const StatusIcon = STATUS_ICONS[status] ?? AlertCircle;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const approvedApproval = currentBooking.approvals?.find(
    (a) => a.status === "APPROVED"
  );
  const rejectedApproval = currentBooking.approvals?.find(
    (a) => a.status === "REJECTED"
  );

  const handleCancel = async () => {
    if (!id) return;
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }
    setCancelling(true);
    try {
      await dispatch(
        cancelBookingAPI({ id, reason: cancelReason.trim() }) as any
      ).unwrap();
      alert("Booking cancelled successfully");
      setCancelModalOpen(false);
      setCancelReason("");
      dispatch(fetchBookingById(id) as any);
    } catch (err: any) {
      alert(err?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = [
    "DRAFT",
    "PENDING",
    "SUBMITTED",
    "PENDING_APPROVAL",
  ].includes(status);
  const canPay = ["APPROVED", "APPROVED_PENDING_PAYMENT"].includes(status);

  // Calculate date range
  const getDateRange = () => {
    if (!currentBooking.items || currentBooking.items.length === 0)
      return "N/A";

    const sortedItems = [...currentBooking.items].sort(
      (a, b) => {
        const dateA = new Date(
          typeof a.eventDate === "string"
            ? a.eventDate
            : Array.isArray(a.eventDate)
            ? `${a.eventDate[0]}-${String(a.eventDate[1]).padStart(
                2,
                "0"
              )}-${String(a.eventDate[2]).padStart(2, "0")}`
            : ""
        ).getTime();
        const dateB = new Date(
          typeof b.eventDate === "string"
            ? b.eventDate
            : Array.isArray(b.eventDate)
            ? `${b.eventDate[0]}-${String(b.eventDate[1]).padStart(
                2,
                "0"
              )}-${String(b.eventDate[2]).padStart(2, "0")}`
            : ""
        ).getTime();
        return dateA - dateB;
      }
    );

    const startDate = parseEventDate(sortedItems[0].eventDate);
    if (sortedItems.length === 1) return startDate;

    const endDate = parseEventDate(
      sortedItems[sortedItems.length - 1].eventDate
    );
    return `${startDate} to ${endDate}`;
  };

  // Calculate total pax
  const getTotalPax = () => {
    if (!currentBooking.items) return 0;
    return currentBooking.items.reduce((sum, item) => sum + (item.pax || 0), 0);
  };

  return (
    <Layout>
      <PageHeader
        title={`Booking ${
          currentBooking.bookingCode || `#${currentBooking.id?.slice(0, 8)}`
        }`}
        subtitle="View booking details and status"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Booking Status Timeline */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-rotary-royal flex items-center gap-2">
                <FileText className="w-4 h-4" />
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

            <div className="space-y-3">
              {currentBooking.createdAt && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-rotary-royal" />}
                  color="bg-rotary-royal/10"
                  label="Created"
                  time={parseCreatedAt(currentBooking.createdAt)}
                />
              )}

              {approvedApproval && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                  color="bg-green-500/10"
                  label="Approved"
                  time={parseCreatedAt(approvedApproval.actionTime)}
                  // sub={
                  //   approvedApproval.approverUserId
                  //     // ? `Approver: ${approvedApproval.approverUserId.slice(0, 8)}`
                  //     ? `Approver`
                  //     : undefined
                  // }
                />
              )}

              {rejectedApproval && (
                <TimelineStep
                  icon={<XCircle className="w-4 h-4 text-red-500" />}
                  color="bg-red-500/10"
                  label="Rejected"
                  time={parseCreatedAt(rejectedApproval.actionTime)}
                  sub={rejectedApproval.remarks || "No reason provided"}
                  subClass="text-red-600"
                />
              )}

              {status === "CONFIRMED_FULL" && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
                  color="bg-blue-500/10"
                  label="Confirmed & Paid"
                  time={parseCreatedAt(currentBooking.createdAt)}
                />
              )}

              {status === "PAID" && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
                  color="bg-blue-500/10"
                  label="Payment Received"
                  time={parseCreatedAt(currentBooking.createdAt)}
                />
              )}

              {status === "CONFIRMED" && (
                <TimelineStep
                  icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
                  color="bg-blue-500/10"
                  label="Confirmed"
                  time={parseCreatedAt(currentBooking.createdAt)}
                />
              )}
            </div>
          </Card>

          {/* Approval History */}
          {currentBooking.approvals && currentBooking.approvals.length > 0 && (
            <Card>
              <h3 className="text-base font-bold text-rotary-royal mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approval History
              </h3>
              <div className="space-y-3">
                {currentBooking.approvals.map((approval, idx) => (
                  <div
                    key={approval.id ?? idx}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        Level {approval.levelNumber} Approval
                      </span>
                      <Badge
                        variant={
                          approval.status === "APPROVED" ? "active" : "inactive"
                        }
                      >
                        {approval.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-rotary-darkgray space-y-1">
                      {/* <p>
                        Approver:{" "}
                        <span className="font-medium">
                          {approval.approverUserId?.slice(0, 8) || "N/A"}
                        </span>
                      </p> */}
                      <p>
                        Time:{" "}
                        <span className="font-medium">
                          {parseCreatedAt(approval.actionTime)}
                        </span>
                      </p>
                      {approval.remarks && (
                        <p>
                          Remarks:{" "}
                          <span className="font-medium">{approval.remarks}</span>
                        </p>
                      )}
                      {!approval.remarks && approval.status === "REJECTED" && (
                        <p className="text-red-600">No remarks provided</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Booked Slots */}
          <Card>
            <h3 className="text-base font-bold text-rotary-royal mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booked Slots ({currentBooking.items?.length || 0})
            </h3>
            {!currentBooking.items?.length ? (
              <div className="text-center py-8 text-rotary-darkgray">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No slots booked yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentBooking.items.map((item, idx) => {
                  const facilityName =
                    facilityNames[item.facilityId] ||
                    item.facilityName ||
                    `Facility ${item.facilityId?.slice(0, 8)}`;

                  return (
                    <div
                      key={item.id ?? idx}
                      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-rotary-black text-sm mb-1">
                            {facilityName}
                          </div>
                          {item.status && (
                            <Badge
                              variant={
                                item.status === "APPROVED" ||
                                item.status === "CONFIRMED_FULL"
                                  ? "active"
                                  : item.status === "PENDING" ||
                                    item.status === "PENDING_APPROVAL"
                                  ? "pending"
                                  : "inactive"
                              }
                            >
                              {item.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-base font-bold text-rotary-royal bg-blue-50 px-3 py-1.5 rounded-lg">
                          <IndianRupee className="w-4 h-4" />
                          {item.price != null
                            ? item.price.toLocaleString("en-IN")
                            : "—"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-rotary-darkgray">
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {parseEventDate(item.eventDate)}
                        </span>

                        {(item.startTime || item.endTime) && (
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-purple-500" />
                            {item.startTime?.slice(0, 5) ?? "N/A"} -{" "}
                            {item.endTime?.slice(0, 5) ?? "N/A"}
                          </span>
                        )}

                        {item.pax && (
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 text-green-500" />
                            {item.pax} Pax
                          </span>
                        )}

                        {item.slotName && (
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 whitespace-nowrap">
                            <Hash className="w-3.5 h-3.5 text-gray-400" />
                            {item.slotName}
                          </span>
                        )}
                      </div>

                      {item.alternatives && item.alternatives.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs font-medium text-yellow-800 mb-1">
                            Alternatives Available:
                          </p>
                          <div className="text-xs text-yellow-700">
                            {item.alternatives.map((alt, altIdx) => (
                              <div key={altIdx} className="flex items-center gap-1">
                                <span>•</span>
                                <span>{alt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Event Details */}
          {currentBooking.eventDetails && (
            <Card>
              <h3 className="text-base font-bold text-rotary-royal mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Event Details
              </h3>
              <div className="space-y-3">
                {currentBooking.eventDetails.purpose && (
                  <DetailRow
                    label="Purpose"
                    value={currentBooking.eventDetails.purpose}
                  />
                )}
                {currentBooking.eventDetails.expectedAttendees && (
                  <DetailRow
                    label="Expected Attendees"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        {currentBooking.eventDetails.expectedAttendees}
                      </span>
                    }
                  />
                )}
                {currentBooking.eventDetails.specialRequirements && (
                  <DetailRow
                    label="Special Requirements"
                    value={
                      <p className="text-sm text-rotary-black whitespace-pre-wrap">
                        {currentBooking.eventDetails.specialRequirements}
                      </p>
                    }
                  />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-5">
            <h3 className="text-base font-bold text-rotary-royal mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Summary
            </h3>

            <div className="space-y-3 mb-4">
              <SummaryRow
                icon={<Hash className="w-3.5 h-3.5 text-gray-400" />}
                label="Booking Code"
                value={currentBooking.bookingCode || "N/A"}
              />

              <SummaryRow
                icon={<User className="w-3.5 h-3.5 text-gray-400" />}
                label="User"
                value={
                  currentBooking.userName ||
                  user?.username ||
                  currentBooking.userId?.slice(0, 8) ||
                  "—"
                }
              />

              <SummaryRow
                icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
                label="Created"
                value={parseCreatedAt(currentBooking.createdAt)}
              />

              {currentBooking.items && currentBooking.items.length > 0 && (
                <SummaryRow
                  icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
                  label="Event Dates"
                  value={getDateRange()}
                />
              )}

              <SummaryRow
                icon={<Clock className="w-3.5 h-3.5 text-gray-400" />}
                label="Slots"
                value={String(currentBooking.items?.length ?? 0)}
              />

              {getTotalPax() > 0 && (
                <SummaryRow
                  icon={<Users className="w-3.5 h-3.5 text-gray-400" />}
                  label="Total Pax"
                  value={String(getTotalPax())}
                />
              )}

              <SummaryRow
                icon={<AlertCircle className="w-3.5 h-3.5 text-gray-400" />}
                label="Status"
                value={<Badge variant="pending">{statusLabel}</Badge>}
              />

              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-gray-500" />
                  Total
                </span>
                <span className="text-xl font-bold text-rotary-royal">
                  ₹
                  {currentBooking.totalAmount != null
                    ? currentBooking.totalAmount.toLocaleString("en-IN")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Payment Link Alert */}
            {currentBooking.paymentLink && (
              <div className="mb-4 p-3 bg-rotary-turquoise/10 border border-rotary-turquoise rounded-lg">
                <div className="text-sm font-medium text-rotary-royal mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
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

            {/* Action Buttons */}
            <div className="space-y-2">
              {canPay && !currentBooking.paymentLink && (
                <Button
                  fullWidth
                  disabled={generatingPayment}
                  title="Check your email for the payment link"
                >
                  {generatingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Check Email for Payment Link"
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
                  onClick={() => {
                    setCancelReason("");
                    setCancelModalOpen(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}

              <Button
                fullWidth
                variant="ghost"
                onClick={() => router.push("/user/booking-status")}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to My Bookings
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => !cancelling && setCancelModalOpen(false)}
        title="Cancel Booking"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-rotary-darkgray">
            Please provide a reason for cancelling this booking.
          </p>

          <Input
            label="Cancellation Reason"
            placeholder="e.g., Plans changed, Found another venue"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={cancelling}
          />

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="danger"
              fullWidth
              onClick={handleCancel}
              disabled={cancelling || !cancelReason.trim()}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Cancellation
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setCancelModalOpen(false);
                setCancelReason("");
              }}
              disabled={cancelling}
            >
              Keep Booking
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

// ============ Helper Components ============

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
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        {time && time !== "N/A" && (
          <div className="text-xs text-rotary-darkgray mt-0.5">{time}</div>
        )}
        {sub && (
          <div className={`text-xs mt-0.5 ${subClass}`}>{sub}</div>
        )}
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
      <div className="text-xs font-medium text-rotary-darkgray mb-1">
        {label}
      </div>
      <div className="text-sm text-rotary-black">{value}</div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-rotary-darkgray flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}