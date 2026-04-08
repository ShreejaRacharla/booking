import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  fetchBookings,
  updateBookingStatus,
  approveBookingAPI,
} from "../../store/slices/bookingSlice";
import { Booking, Column, BookingStatus } from "../../types";
import { formatDisplayDate } from "../../utils/helpers";
import { Layout, PageHeader, Card, Table, Button, Modal, Badge, Input } from "../../components";
import { Loader2 } from "lucide-react";

export default function ApprovalsPage() {
  const dispatch = useDispatch();
  const { items: bookings, loading, error } = useSelector((s: RootState) => s.bookings);
  const locations = useSelector((s: RootState) => s.locations.items);
  const facilities = useSelector((s: RootState) => s.facilities.items);
  const user = useSelector((s: RootState) => s.auth.user);

  const [detail, setDetail] = useState<Booking | null>(null);
  const [altOpen, setAltOpen] = useState(false);
  const [altText, setAltText] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchBookings() as any);
  }, [dispatch]);

  const locName = (id: string) => locations.find((l) => l.id === id)?.name || id;
  const facName = (id: string) => facilities.find((f) => f.id === id)?.name || id;

  const badgeV = (s: BookingStatus) =>
    ({ PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", PAID: "paid" } as const)[s];

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const changeStatus = async (booking: Booking, status: BookingStatus) => {
    setActionLoading(true);
    try {
      if (status === "APPROVED") {
        // POST /api/v1/approvals/:id/approve
        await dispatch(
          approveBookingAPI({
            bookingId: booking.id,
            approverUserId: user?.id ?? "",
          }) as any
        ).unwrap();
      } else {
        // For REJECTED — no dedicated API endpoint in collection; optimistic local update
        dispatch(updateBookingStatus({ id: booking.id, status }));
      }
      setDetail(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || `Failed to ${status.toLowerCase()} booking`);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column[] = [
    { key: "id", label: "ID" },
    { key: "userName", label: "User" },
    { key: "facilityId", label: "Facility", render: (v: string) => facName(v) },
    { key: "date", label: "Date", render: (v: string) => formatDisplayDate(v) },
    { key: "totalAmount", label: "Amount", render: (v: number) => `₹${v.toLocaleString()}` },
    {
      key: "status",
      label: "Status",
      render: (v: BookingStatus) => <Badge variant={badgeV(v)}>{v}</Badge>,
    },
    {
      key: "actions",
      label: "",
      render: (_: any, row: Booking) => (
        <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Button>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Booking Approvals" subtitle="Review and manage requests" />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rotary-cranberry/10 border border-rotary-cranberry/30">
          <p className="text-sm text-rotary-cranberry">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === s
                ? "bg-rotary-royal text-white"
                : "bg-white text-rotary-darkgray border border-gray-200 hover:border-rotary-royal"
            }`}
          >
            {s}
            <span className="ml-1 opacity-60">
              ({s === "ALL" ? bookings.length : bookings.filter((b) => b.status === s).length})
            </span>
          </button>
        ))}
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={filtered} emptyMessage="No bookings found" />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => !actionLoading && setDetail(null)} title="Booking Details" size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-rotary-darkgray">Booking ID</p><p className="font-bold text-rotary-royal">{detail.id}</p></div>
              <div><p className="text-xs text-rotary-darkgray">User</p><p className="font-semibold">{detail.userName}</p></div>
              <div><p className="text-xs text-rotary-darkgray">Location</p><p className="font-semibold">{locName(detail.locationId)}</p></div>
              <div><p className="text-xs text-rotary-darkgray">Facility</p><p className="font-semibold">{facName(detail.facilityId)}</p></div>
              <div><p className="text-xs text-rotary-darkgray">Date</p><p className="font-semibold">{formatDisplayDate(detail.date)}</p></div>
              <div>
                <p className="text-xs text-rotary-darkgray">Total</p>
                <p className="font-bold text-rotary-royal text-lg">₹{detail.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-rotary-darkgray mb-2">Requested Slots</p>
              <div className="space-y-2">
                {detail.slots.map((slot) => (
                  <div key={slot.timeslotId} className="flex items-center justify-between p-3 rounded-lg bg-rotary-lightgray">
                    <div>
                      <p className="text-sm font-semibold">{slot.timeslotName}</p>
                      <p className="text-xs text-rotary-darkgray">{slot.startTime} – {slot.endTime}</p>
                    </div>
                    <Badge variant={slot.status === "AVAILABLE" ? "available" : "conflict"}>
                      {slot.status === "AVAILABLE" ? "✓ Available" : "✗ Conflict"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-rotary-lightgray">
              <span className="text-sm font-medium text-rotary-darkgray">Status:</span>
              <Badge variant={badgeV(detail.status)}>{detail.status}</Badge>
            </div>

            {detail.status === "PENDING" && (
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="success"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => changeStatus(detail, "APPROVED")}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "✓ Approve"}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => changeStatus(detail, "REJECTED")}
                >
                  ✗ Reject
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={actionLoading}
                  onClick={() => { setAltText(""); setAltOpen(true); }}
                >
                  Suggest
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Alternative Modal */}
      <Modal isOpen={altOpen} onClose={() => setAltOpen(false)} title="Suggest Alternative" size="sm">
        <div className="space-y-4">
          <Input
            label="Suggestion"
            placeholder="e.g. Try Banquet Hall 2 on 06 Apr"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              fullWidth
              onClick={() => { alert(`Sent: "${altText}"`); setAltOpen(false); setDetail(null); }}
            >
              Send
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setAltOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}