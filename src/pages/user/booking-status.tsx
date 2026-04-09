import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "../../store";
import { fetchMyBookings } from "../../store/slices/bookingSlice";
import { Booking, Column, BadgeVariant } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Table,
  Button,
  Badge,
} from "../../components";
import { Loader2, Eye, Calendar } from "lucide-react";

const STATUS_VARIANTS: Record<Booking["status"], BadgeVariant> = {
  DRAFT:     "default",
  PENDING:   "pending",
  SUBMITTED: "pending",
  APPROVED:  "active",
  REJECTED:  "inactive",
  PAID:      "booked",
  CANCELLED: "blocked",
};

export default function MyBookingsPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { myBookings, loading } = useSelector((s: RootState) => s.bookings);

  useEffect(() => {
    dispatch(fetchMyBookings() as any);
  }, [dispatch]);

  const columns: Column[] = [
    {
      key: "id",
      label: "Booking ID",
      render: (v: string) => (
        <span className="font-mono text-xs">{v?.slice(0, 8) ?? "—"}</span>
      ),
    },
    {
      key: "items",
      label: "Details",
      render: (items: Booking["items"]) => {
        const first = items?.[0];
        return (
          <div className="text-sm">
            <div className="font-medium">{first?.facilityName || "N/A"}</div>
            <div className="text-xs text-rotary-darkgray flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {first?.eventDate
                ? new Date(first.eventDate + "T00:00:00").toLocaleDateString()
                : "N/A"}
            </div>
            {items?.length > 1 && (
              <div className="text-xs text-rotary-azure">
                +{items.length - 1} more slot{items.length > 2 ? "s" : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "totalAmount",
      label: "Amount",
      render: (v: number) => (
        <span className="font-bold text-rotary-royal">
          ₹{v != null ? v.toLocaleString("en-IN") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: Booking["status"]) => (
        <Badge variant={STATUS_VARIANTS[v] ?? "default"}>{v}</Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (v: string) => (
        <span className="text-sm text-rotary-darkgray">
          {v ? new Date(v).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Booking) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/user/booking-detail?id=${row.id}`)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="My Bookings"
        subtitle="View and track your facility bookings"
        action={
          <Button onClick={() => router.push("/management/booking")}>
            + New Booking
          </Button>
        }
      />

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          </div>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-rotary-darkgray mb-4">No bookings yet</p>
            <Button onClick={() => router.push("/management/booking")}>
              Create Your First Booking
            </Button>
          </div>
        ) : (
          <Table columns={columns} data={myBookings} />
        )}
      </Card>
    </Layout>
  );
}