import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  fetchBookings,
  updateBookingStatus,
  approveBookingAPI,
  rejectBookingAPI,
} from "../../store/slices/bookingSlice";
import { fetchLocations } from "../../store/slices/locationSlice";
import { fetchFacilities } from "../../store/slices/facilitySlice";
import { Booking, Column, BookingStatus, BookingItem, BookingApproval } from "../../types";
import { formatDisplayDate } from "../../utils/helpers";
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Badge,
  Input,
} from "../../components";
import { Loader2, Calendar, Clock, MapPin, Users, CheckCircle, XCircle } from "lucide-react";

// ✅ HARDCODED ADMIN USER ID - Replace with proper auth later
const ADMIN_USER_ID = "e3af12c2-de09-47d1-9d0e-b25a214274f7";

// ✅ Define filter categories that map to actual backend statuses
type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";

// ✅ Map filter categories to actual backend statuses
const filterStatusMap: Record<FilterType, BookingStatus[]> = {
  ALL: [],
  PENDING: ["PENDING", "PENDING_APPROVAL", "SUBMITTED", "DRAFT"],
  APPROVED: ["APPROVED", "APPROVED_PENDING_PAYMENT", "CONFIRMED_FULL"],
  REJECTED: ["REJECTED"],
  PAID: ["PAID", "CONFIRMED_FULL"],
  CANCELLED: ["CANCELLED"],
};

export default function ApprovalsPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useDispatch();
  const { items: bookings, loading, error } = useSelector(
    (s: RootState) => s.bookings
  );
  const locations = useSelector((s: RootState) => s.locations.items);
  const facilities = useSelector((s: RootState) => s.facilities.items);
  const user = useSelector((s: RootState) => s.auth.user);

  const [detail, setDetail] = useState<Booking | null>(null);
  const [altOpen, setAltOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchBookings() as any);
    dispatch(fetchLocations() as any);
    dispatch(fetchFacilities() as any);
  }, [dispatch]);

  const locName = (id: string) =>
    locations.find((l) => l.id === id)?.name || id;
  const facName = (id: string) =>
    facilities.find((f) => f.id === id)?.name || id;

  // ✅ Fixed badge variant mapping with ALL backend status types
  const badgeVariant = (
    s: BookingStatus
  ): "pending" | "active" | "inactive" | "available" | "booked" | "blocked" => {
    const map: Record<BookingStatus, "pending" | "active" | "inactive" | "available" | "booked" | "blocked"> = {
      DRAFT: "pending",
      SUBMITTED: "pending",
      PENDING: "pending",
      PENDING_APPROVAL: "pending",
      APPROVED: "active",
      APPROVED_PENDING_PAYMENT: "active",
      CONFIRMED_FULL: "booked",
      REJECTED: "inactive",
      PAID: "booked",
      CANCELLED: "blocked",
    };
    return map[s] || "pending";
  };

  // ✅ Get display label for status
  const getStatusLabel = (s: BookingStatus): string => {
    const labels: Record<BookingStatus, string> = {
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
    return labels[s] || s;
  };

  // ✅ Check if booking needs approval action
  const needsApproval = (status: BookingStatus): boolean => {
    return ["PENDING", "PENDING_APPROVAL", "SUBMITTED"].includes(status);
  };

  // ✅ Helper function to get approved action time
  const getApprovedActionTime = (approvals?: BookingApproval[]): string | null => {
    if (!approvals) return null;
    const approvedEntry = approvals.find((a) => a.status === "APPROVED");
    return approvedEntry?.actionTime || null;
  };

  // ✅ Filter bookings based on selected filter
  const filtered = filter === "ALL" 
    ? bookings 
    : bookings.filter((b) => filterStatusMap[filter].includes(b.status));

  // ✅ Get count for each filter
  const getFilterCount = (filterType: FilterType): number => {
    if (filterType === "ALL") return bookings.length;
    return bookings.filter((b) => filterStatusMap[filterType].includes(b.status)).length;
  };

  // ✅ FIX: Use hardcoded admin ID
  const handleApprove = async (booking: Booking) => {
    // ✅ Use hardcoded admin ID directly
    const approverUserId = ADMIN_USER_ID;
    
    console.log("🔐 Approving with userId:", approverUserId);

    setActionLoading(true);
    try {
      await dispatch(
        approveBookingAPI({
          bookingId: booking.id,
          approverUserId: approverUserId,
        }) as any
      ).unwrap();

      alert("✅ Booking approved successfully!");
      setDetail(null);
      dispatch(fetchBookings() as any);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to approve booking");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ FIX: Use hardcoded admin ID
  const handleReject = async (booking: Booking) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    // ✅ Use hardcoded admin ID directly
    const approverUserId = ADMIN_USER_ID;
    
    console.log("🔐 Rejecting with userId:", approverUserId);

    setActionLoading(true);
    try {
      await dispatch(
        rejectBookingAPI({
          bookingId: booking.id,
          approverUserId: approverUserId,
          reason: rejectReason,
        }) as any
      ).unwrap();

      alert("✅ Booking rejected");
      setDetail(null);
      setRejectReason("");
      setAltOpen(false);
      dispatch(fetchBookings() as any);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to reject booking");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column[] = [
    {
      key: "bookingCode",
      label: "Booking ID",
      render: (v: string, row: Booking) => (
        <span className="font-mono text-xs font-bold text-rotary-royal">
          {v || row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "userName",
      label: "User",
      render: (v: string, row: Booking) => (
        <span className="font-medium">{v || row.userId?.slice(0, 8) || "N/A"}</span>
      ),
    },
    {
      key: "items",
      label: "Details",
      render: (items: BookingItem[]) => (
        <div className="text-sm">
          <div className="font-medium">
            {items[0]?.facilityName || facName(items[0]?.facilityId) || "N/A"}
          </div>
          <div className="text-xs text-rotary-darkgray flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {items[0]?.eventDate
              ? formatDisplayDate(items[0].eventDate)
              : "N/A"}
          </div>
          {items.length > 1 && (
            <Badge variant="pending">
              +{items.length - 1} more slots
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Amount",
      render: (v: number) => (
        <span className="font-bold text-rotary-royal">
          ₹{v?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: BookingStatus) => (
        <Badge variant={badgeVariant(v)}>{getStatusLabel(v)}</Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (v: string) => (
        <span className="text-sm text-rotary-darkgray">
          {v ? new Date(v).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Booking) => (
        <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>
          View Details
        </Button>
      ),
    },
  ];

  // ✅ Filter buttons configuration
  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "PAID", label: "Confirmed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  // ✅ Get approval time for display
  const approvedTime = detail ? getApprovedActionTime(detail.approvals) : null;

  const content = (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === key
                ? "bg-rotary-royal text-white"
                : "bg-white text-rotary-darkgray border border-gray-200 hover:border-rotary-royal"
            }`}
          >
            {label}
            <span className="ml-1 opacity-60">
              ({getFilterCount(key)})
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rotary-cranberry/10 border border-rotary-cranberry/30">
          <p className="text-sm text-rotary-cranberry">{error}</p>
        </div>
      )}

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={filtered}
            emptyMessage="No bookings found"
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => !actionLoading && setDetail(null)}
        title="Booking Details"
        size="lg"
      >
        {detail && (
          <div className="space-y-5">
            {/* Booking Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-rotary-darkgray">Booking Code</p>
                <p className="font-mono text-sm font-bold text-rotary-royal">
                  {detail.bookingCode || detail.id.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-xs text-rotary-darkgray">User ID</p>
                <p className="font-semibold text-sm">
                  {detail.userName || detail.userId?.slice(0, 12) || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-rotary-darkgray">Email</p>
                <p className="text-sm">{detail.userEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-rotary-darkgray">Phone</p>
                <p className="text-sm">{detail.userPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-rotary-darkgray">Total Amount</p>
                <p className="font-bold text-rotary-royal text-lg">
                  ₹{detail.totalAmount?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-rotary-darkgray">Status</p>
                <Badge variant={badgeVariant(detail.status)}>
                  {getStatusLabel(detail.status)}
                </Badge>
              </div>
            </div>

            {/* Approval Info */}
            {detail.approvals && detail.approvals.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-rotary-royal mb-3">
                  Approval History
                </h4>
                <div className="space-y-2">
                  {detail.approvals.map((approval, idx) => (
                    <div
                      key={approval.id || idx}
                      className={`p-3 rounded-lg ${
                        approval.status === "APPROVED"
                          ? "bg-green-50 border border-green-200"
                          : approval.status === "REJECTED"
                          ? "bg-red-50 border border-red-200"
                          : "bg-yellow-50 border border-yellow-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Level {approval.levelNumber}
                        </span>
                        <Badge
                          variant={
                            approval.status === "APPROVED"
                              ? "active"
                              : approval.status === "REJECTED"
                              ? "inactive"
                              : "pending"
                          }
                        >
                          {approval.status}
                        </Badge>
                      </div>
                      {approval.actionTime && (
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(approval.actionTime).toLocaleString()}
                        </p>
                      )}
                      {approval.remarks && (
                        <p className="text-xs text-gray-600 mt-1">
                          Remarks: {approval.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Details */}
            {detail.eventDetails && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-rotary-royal mb-3">
                  Event Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-rotary-darkgray">Purpose</p>
                    <p className="text-sm">{detail.eventDetails.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rotary-darkgray">
                      Expected Attendees
                    </p>
                    <p className="text-sm flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {detail.eventDetails.expectedAttendees}
                    </p>
                  </div>
                  {detail.eventDetails.specialRequirements && (
                    <div>
                      <p className="text-xs text-rotary-darkgray">
                        Special Requirements
                      </p>
                      <p className="text-sm">
                        {detail.eventDetails.specialRequirements}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booked Slots */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-rotary-royal mb-3">
                Booked Slots ({detail.items?.length || 0})
              </p>
              <div className="space-y-2">
                {detail.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-rotary-lightgray"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {item.facilityName || facName(item.facilityId)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-rotary-darkgray">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDisplayDate(item.eventDate)}
                        </span>
                        {item.startTime && item.endTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.startTime.slice(0, 5)} -{" "}
                            {item.endTime.slice(0, 5)}
                          </span>
                        )}
                      </div>
                      {item.status && (
                        <Badge variant={badgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rotary-royal">
                        ₹{item.price?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - Only show for pending bookings */}
            {needsApproval(detail.status) && (
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="success"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => handleApprove(detail)}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => {
                    setRejectReason("");
                    setAltOpen(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}

            {/* Status Messages */}
            {["APPROVED", "APPROVED_PENDING_PAYMENT", "CONFIRMED_FULL"].includes(detail.status) && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  ✓ This booking has been approved
                  {approvedTime && (
                    <span className="block text-xs mt-1">
                      on {new Date(approvedTime).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            )}

            {detail.status === "REJECTED" && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">
                  ✗ This booking has been rejected
                  {detail.rejectionReason && (
                    <span className="block text-xs mt-1">
                      Reason: {detail.rejectionReason}
                    </span>
                  )}
                </p>
              </div>
            )}

            {detail.status === "CANCELLED" && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-800">
                  ⊘ This booking has been cancelled
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={altOpen}
        onClose={() => !actionLoading && setAltOpen(false)}
        title="Reject Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-rotary-darkgray">
            Please provide a reason for rejecting this booking:
          </p>
          <Input
            label="Rejection Reason"
            placeholder="e.g. Time slot not available"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="danger"
              fullWidth
              disabled={actionLoading || !rejectReason.trim()}
              onClick={() => detail && handleReject(detail)}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setAltOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}