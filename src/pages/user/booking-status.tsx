import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState, AppDispatch } from "../../store";
import { fetchMyBookings, clearError } from "../../store/slices/bookingSlice";
import { hydrate } from "../../store/slices/authSlice";
import { Booking, BadgeVariant } from "../../types";
import Loader from "../../components/loader";
import {
  Layout,
  PageHeader,
  Card,
  Table,
  Button,
  Badge,
} from "../../components";
import {
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
  User,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import customAxios from "../../utils/customAxios";

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
    return null;
  }
};

const getUserIdFromToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const accessTokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
  if (!accessTokenCookie) return null;
  const token = accessTokenCookie.split('=')[1];
  const decoded = decodeToken(token);
  return decoded?.id || decoded?.userId || decoded?.sub || null;
};

function parseEventDate(eventDate: any): string {
  if (!eventDate) return "N/A";
  try {
    let year: number, month: number, day: number;
    if (Array.isArray(eventDate)) {
      [year, month, day] = eventDate;
    } else if (typeof eventDate === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        const [y, m, d] = eventDate.split("-");
        year = parseInt(y);
        month = parseInt(m);
        day = parseInt(d);
      } else {
        const date = new Date(eventDate);
        if (isNaN(date.getTime())) return "N/A";
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
      }
    } else {
      return "N/A";
    }
    return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  } catch {
    return "N/A";
  }
}

function formatCreatedDate(dateString: any): string {
  if (!dateString) return "—";
  try {
    if (typeof dateString === "string") {
      const cleanDate = dateString.replace(" AM", "").replace(" PM", "").trim();
      const parts = cleanDate.split(" ");
      const datePart = parts[0];
      if (datePart.includes("-")) {
        const segments = datePart.split("-");
        if (segments[0].length === 4) {
          const [year, month, day] = segments;
          return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
        } else {
          const [day, month, year] = segments;
          return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
        }
      }
    }
    if (Array.isArray(dateString)) {
      const [year, month, day] = dateString;
      return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }
    if (typeof dateString === "number") {
      const date = new Date(dateString);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    }
    return "—";
  } catch {
    return "—";
  }
}

interface FacilityMap {
  [key: string]: string;
}

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

const STATUS_CONFIG: Record<string, {
  variant: BadgeVariant;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  PENDING_APPROVAL: {
    variant: "pending",
    label: "Pending Approval",
    icon: Hourglass,
    color: "text-amber-500",
  },
  PENDING: {
    variant: "pending",
    label: "Pending",
    icon: Hourglass,
    color: "text-amber-500",
  },
  SUBMITTED: {
    variant: "pending",
    label: "Submitted",
    icon: Hourglass,
    color: "text-amber-500",
  },
  APPROVED_PENDING_PAYMENT: {
    variant: "pending",
    label: "Awaiting Payment",
    icon: CreditCard,
    color: "text-orange-500",
  },
  APPROVED: {
    variant: "active",
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  CONFIRMED_FULL: {
    variant: "active",
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  CONFIRMED: {
    variant: "active",
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  PAID: {
    variant: "booked",
    label: "Paid",
    icon: CheckCircle2,
    color: "text-blue-500",
  },
  CANCELLED: {
    variant: "blocked",
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
  },
  REJECTED: {
    variant: "inactive",
    label: "Rejected",
    icon: AlertCircle,
    color: "text-gray-500",
  },
  DRAFT: {
    variant: "inactive",
    label: "Draft",
    icon: AlertCircle,
    color: "text-gray-400",
  },
  AWAITING_USER_ACTION: {
    variant: "pending",
    label: "Action Required",
    icon: AlertCircle,
    color: "text-orange-500",
  },
};

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status] || {
    variant: "default" as BadgeVariant,
    label: status,
    icon: AlertCircle,
    color: "text-gray-500",
  };
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "APPROVED_PENDING_PAYMENT", label: "Awaiting Payment" },
  { value: "CONFIRMED_FULL", label: "Confirmed" },
  { value: "AWAITING_USER_ACTION", label: "Action Required" },
  { value: "CANCELLED", label: "Cancelled" },
];

function FacilityCell({
  items,
  facilityMap,
}: {
  items: Booking["items"];
  facilityMap: FacilityMap;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <span className="text-gray-400 text-xs">No items</span>;
  }

  const first = items[0];
  const rest = items.slice(1);
  const firstName = facilityMap[first.facilityId] || first.facilityName || first.facilityId?.slice(0, 8);

  const getItemStatusColor = (status: string) => {
    if (["CONFIRMED", "APPROVED", "CONFIRMED_FULL"].includes(status)) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (["PENDING"].includes(status)) return "text-amber-600 bg-amber-50 border-amber-200";
    if (["CANCELLED", "REJECTED"].includes(status)) return "text-red-600 bg-red-50 border-red-200";
    if (["PROPOSED_ALTERNATIVE"].includes(status)) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className="text-sm min-w-[200px]">
      <div className="flex items-start gap-2">
        <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-foreground leading-tight">{firstName}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{parseEventDate(first.eventDate)}</span>
            {/* {first.status && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getItemStatusColor(first.status)}`}>
                {first.status}
              </span>
            )} */}
          </div>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide slots
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                +{rest.length} more slot{rest.length > 1 ? "s" : ""}
              </>
            )}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2 border-l-2 border-blue-100 pl-3">
              {rest.map((item, idx) => {
                const name = facilityMap[item.facilityId] || item.facilityName || item.facilityId?.slice(0, 8);
                return (
                  <div key={item.id || idx} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-xs font-medium text-gray-700 leading-tight">{name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {parseEventDate(item.eventDate)}
                      </span>
                      {item.status && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getItemStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    {item.price != null && (
                      <div className="text-[11px] font-semibold text-emerald-600 mt-1">
                        ₹{item.price.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, hydrated, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { myBookings, loading, error } = useSelector((s: RootState) => s.bookings);
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [facilityMap, setFacilityMap] = useState<FacilityMap>({});
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  useEffect(() => {
    const id = getUserIdFromToken();
    setUserId(id);
  }, []);

  useEffect(() => {
    dispatch(hydrate());
  }, [dispatch]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      dispatch(fetchMyBookings());
    }
  }, [dispatch, hydrated, isAuthenticated]);

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoadingFacilities(true);
      try {
        const res = await customAxios.get("/v1/facility");
        const list: any[] = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.content || res.data?.facilities || [];
        const map: FacilityMap = {};
        list.forEach((f: any) => {
          if (f.id) map[f.id] = f.name || f.facilityName || f.id;
        });
        setFacilityMap(map);
      } catch {
      } finally {
        setLoadingFacilities(false);
      }
    };
    fetchFacilities();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyBookings());
    setRefreshing(false);
  };

  const filteredBookings = statusFilter === "all"
    ? myBookings
    : myBookings.filter((b: Booking) => b.status === statusFilter);

  const sortedBookings = [...filteredBookings].sort((a: Booking, b: Booking) => {
    const parseForSort = (d: any): number => {
      if (!d) return 0;
      try {
        if (typeof d === "string") {
          const clean = d.replace(" AM", "").replace(" PM", "").trim();
          const parts = clean.split(" ");
          const datePart = parts[0];
          const timePart = parts[1] || "00:00";
          const [year, month, day] = datePart.split("-");
          return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
        }
        if (typeof d === "number") return d;
        return 0;
      } catch {
        return 0;
      }
    };
    return parseForSort(b.createdAt) - parseForSort(a.createdAt);
  });

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
            {formatCreatedDate(row.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Facility Name",
      render: (items: Booking["items"]) => (
        <FacilityCell items={items} facilityMap={facilityMap} />
      ),
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
        </div>
      ),
    },
  ];

  if (!hydrated) return null;

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

      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-black">{user?.name || "User"}</p>
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearError())}>
            Dismiss
          </Button>
        </div>
      )}

      <Card padding={false}>
        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader />
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