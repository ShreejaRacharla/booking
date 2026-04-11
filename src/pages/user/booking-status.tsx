// pages/user/booking-status.tsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState, AppDispatch } from "../../store";
import { fetchMyBookings, clearError } from "../../store/slices/bookingSlice";
import { hydrate } from "../../store/slices/authSlice";
import { Booking, BadgeVariant } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Table,
  Button,
  Badge,
} from "../../components";
import { 
  Loader2, 
  Eye, 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hourglass,
  RefreshCw,
  Filter,
  User
} from "lucide-react";

// Utility to decode JWT
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get user ID from cookies
const getUserIdFromToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const accessTokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
  
  if (!accessTokenCookie) return null;
  
  const token = accessTokenCookie.split('=')[1];
  const decoded = decodeToken(token);
  
  return decoded?.id || decoded?.userId || decoded?.sub || null;
};

// Column type for Table
interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

// Status configuration
const STATUS_CONFIG: Record<string, { 
  variant: BadgeVariant; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string 
}> = {
  PENDING_APPROVAL: { 
    variant: "pending", 
    label: "Pending Approval", 
    icon: Hourglass,
    color: "text-amber-500"
  },
  PENDING: { 
    variant: "pending", 
    label: "Pending", 
    icon: Hourglass,
    color: "text-amber-500"
  },
  SUBMITTED: { 
    variant: "pending", 
    label: "Submitted", 
    icon: Hourglass,
    color: "text-amber-500"
  },
  APPROVED_PENDING_PAYMENT: { 
    variant: "pending", 
    label: "Awaiting Payment", 
    icon: CreditCard,
    color: "text-orange-500"
  },
  APPROVED: { 
    variant: "active", 
    label: "Approved", 
    icon: CheckCircle2,
    color: "text-emerald-500"
  },
  CONFIRMED_FULL: { 
    variant: "active", 
    label: "Confirmed", 
    icon: CheckCircle2,
    color: "text-emerald-500"
  },
  PAID: { 
    variant: "booked", 
    label: "Paid", 
    icon: CheckCircle2,
    color: "text-blue-500"
  },
  CANCELLED: { 
    variant: "blocked", 
    label: "Cancelled", 
    icon: XCircle,
    color: "text-red-500"
  },
  REJECTED: { 
    variant: "inactive", 
    label: "Rejected", 
    icon: AlertCircle,
    color: "text-gray-500"
  },
  DRAFT: { 
    variant: "inactive", 
    label: "Draft", 
    icon: AlertCircle,
    color: "text-gray-400"
  },
};

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status] || {
    variant: "default" as BadgeVariant,
    label: status,
    icon: AlertCircle,
    color: "text-gray-500"
  };
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "APPROVED_PENDING_PAYMENT", label: "Awaiting Payment" },
  { value: "CONFIRMED_FULL", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MyBookingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const { user, hydrated, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { myBookings, loading, error } = useSelector((s: RootState) => s.bookings);
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from token
  useEffect(() => {
    const id = getUserIdFromToken();
    setUserId(id);
    console.log('User ID from token:', id);
  }, []);

  // Hydrate auth state
  useEffect(() => {
    dispatch(hydrate());
  }, [dispatch]);

  // Redirect if not authenticated
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // Fetch bookings
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      dispatch(fetchMyBookings());
    }
  }, [dispatch, hydrated, isAuthenticated]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyBookings());
    setRefreshing(false);
  };

  // Filter bookings by status
  const filteredBookings = statusFilter === "all" 
    ? myBookings 
    : myBookings.filter((b: Booking) => b.status === statusFilter);

  // Sort by createdAt (newest first)
  const sortedBookings = [...filteredBookings].sort(
    (a: Booking, b: Booking) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate stats
  const stats = {
    total: myBookings.length,
    pending: myBookings.filter((b: Booking) => 
      b.status === "PENDING_APPROVAL" || b.status === "PENDING"
    ).length,
    awaitingPayment: myBookings.filter((b: Booking) => 
      b.status === "APPROVED_PENDING_PAYMENT"
    ).length,
    confirmed: myBookings.filter((b: Booking) => 
      b.status === "CONFIRMED_FULL" || b.status === "PAID"
    ).length,
    cancelled: myBookings.filter((b: Booking) => 
      b.status === "CANCELLED"
    ).length,
    totalSpent: myBookings
      .filter((b: Booking) => b.status === "CONFIRMED_FULL" || b.status === "PAID")
      .reduce((sum: number, b: Booking) => sum + (b.totalAmount || 0), 0),
    pendingPayment: myBookings
      .filter((b: Booking) => b.status === "APPROVED_PENDING_PAYMENT")
      .reduce((sum: number, b: Booking) => sum + (b.totalAmount || 0), 0),
  };

  // Table columns
  const columns: Column[] = [
    {
      key: "bookingCode",
      label: "Booking ID",
      render: (v: string, row: Booking) => (
        <div>
          <span className="font-bold text-sm text-rotary-royal">
            {v || row.id?.slice(0, 8)}
          </span>
          <div className="text-xs text-gray-400 mt-0.5">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Event Details",
      render: (items: Booking["items"]) => {
        const first = items?.[0];
        if (!first) return <span className="text-gray-400">No items</span>;
        
        return (
          <div className="text-sm">
            <div className="font-medium text-foreground">
              {first.facilityName || "Facility"}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {first.eventDate || "N/A"}
              </span>
            </div>
            {items.length > 1 && (
              <div className="text-xs text-rotary-azure mt-1">
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
        <span className="font-bold text-emerald-500">
          ₹{v != null ? v.toLocaleString("en-IN") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: string) => {
        const config = getStatusConfig(v);
        const Icon = config.icon;
        
        return (
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.color}`} />
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Booking) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/user/booking-detail?id=${row.id}`)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {row.status === "APPROVED_PENDING_PAYMENT" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push(`/payment/payment-success?bookingId=${row.id}`)}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="My Bookings"
        subtitle={`Showing ${filteredBookings.length} of ${myBookings.length} bookings`}
        action={
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push("/user/booking")}>
              + New Booking
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-black uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-black mt-1">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-amber-500 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-orange-400 uppercase tracking-wide">Awaiting Payment</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{stats.awaitingPayment}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-emerald-500 uppercase tracking-wide">Confirmed</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-red-500 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* User Info Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-black">{user?.name || "User"}</p>
            {/* <p className="text-xs text-gray-400 font-mono">
              {userId || user?.id || "Loading..."}
            </p> */}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-black">Pending Payment</p>
            <p className="text-sm font-bold text-orange-400">
              ₹{stats.pendingPayment.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-black">Total Spent</p>
            <p className="text-sm font-bold text-emerald-400">
              ₹{stats.totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(filter => {
            const count = filter.value === "all" 
              ? myBookings.length 
              : myBookings.filter((b: Booking) => b.status === filter.value).length;
            
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === filter.value
                    ? "bg-rotary-royal text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {filter.label}
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearError())}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Bookings Table */}
      <Card padding={false}>
        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-rotary-royal animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading your bookings...</p>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {statusFilter === "all" 
                ? "You haven't made any bookings yet" 
                : `No ${getStatusConfig(statusFilter).label.toLowerCase()} bookings`}
            </p>
            {statusFilter === "all" ? (
              <Button onClick={() => router.push("/user/booking")}>
                Create Your First Booking
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setStatusFilter("all")}>
                View All Bookings
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table columns={columns} data={sortedBookings} />
            
            {/* Summary Footer */}
            <div className="border-t border-white/10 px-6 py-4 bg-white/5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {sortedBookings.length} booking{sortedBookings.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Pending Payment</p>
                    <p className="text-sm font-bold text-orange-400">
                      ₹{stats.pendingPayment.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Confirmed Value</p>
                    <p className="text-lg font-bold text-emerald-400">
                      ₹{stats.totalSpent.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </Layout>
  );
}