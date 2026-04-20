import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  createBookingDraftAPI,
  submitBookingAPI,
} from "../../store/slices/bookingSlice";
import { Layout, PageHeader } from "../../components";
import {
  Loader2,
  Search,
  MapPin,
  Users,
  Calendar,
  Clock,
  Trash2,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Building2,
  Check,
  ChevronLeft,
  X,
} from "lucide-react";
import Cookies from "js-cookie";
import customAxios from "@/utils/customAxios";

interface SlotAvailability {
  date: string;
  available: boolean;
  price: number;
  status?: "AVAILABLE" | "HOLD" | "UNAVAILABLE" | "RESERVED";
}

interface FacilitySlot {
  id: string;
  name: string;
  label: string;
  startTime: string;
  endTime: string;
  price: number;
  availability: SlotAvailability[];
}

interface FacilityResult {
  id: string;
  name: string;
  minCap: number;
  maxCap: number;
  isActive: boolean;
  slots: FacilitySlot[];
}

interface CartItem {
  facilityId: string;
  facilityName: string;
  slotId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  price: number;
  eventDate: string;
}

interface DecodedToken {
  id?: string;
  userId?: string;
  sub?: string;
  username?: string;
  user_id?: string;
  exp?: number;
}

interface Location {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
}

function decodeJWT(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
  } catch {
    return null;
  }
}

async function getUserIdFromToken(): Promise<string | null> {
  try {
    const token = Cookies.get("accessToken");
    if (!token) return null;
    const decoded = decodeJWT(token);
    if (!decoded) return null;
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    const directId =
      decoded.id || decoded.userId || decoded.sub || decoded.user_id;
    if (directId) return directId;
    if (!decoded.username) return null;
    const res = await customAxios.get(
      `/users/by-username/${decoded.username}`
    );
    return res.data?.id || res.data?.data?.id || res.data?.userId || null;
  } catch {
    return null;
  }
}

function parseDateFromAPI(val: any): string {
  if (!val) return "";
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const parts = val.split("-");
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  if (Array.isArray(val)) {
    const [y, mo, d] = val;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return String(val);
}

function extractFacilities(raw: any): FacilityResult[] {
  const list: any[] = Array.isArray(raw)
    ? raw
    : raw?.data || raw?.content || raw?.facilities || [];

  const facilityMap = new Map<string, any>();

  list.forEach((item: any) => {
    const facId = item.facilityId;
    
    if (!facilityMap.has(facId)) {
      facilityMap.set(facId, {
        id: facId,
        name: item.facilityName,
        minCap: item.minCapacity ?? 0,
        maxCap: item.maxCapacity ?? 0,
        isActive: true,
        slots: new Map<string, any>(),
      });
    }

    const facility = facilityMap.get(facId);
    const slotId = item.slotId;

    if (!facility.slots.has(slotId)) {
      facility.slots.set(slotId, {
        id: slotId,
        name: item.slotName,
        label: item.slotName,
        startTime: item.startTime || "00:00:00",
        endTime: item.endTime || "23:59:59",
        price: item.price ?? 0,
        availability: [],
      });
    }

    const slot = facility.slots.get(slotId);
    slot.availability.push({
      date: parseDateFromAPI(item.date),
      available: item.capacityCriteria !== false,
      price: item.price ?? 0,
      status: item.status || "AVAILABLE",
    });
  });

  const facilities = Array.from(facilityMap.values()).map((fac) => ({
    ...fac,
    slots: Array.from(fac.slots.values()),
  }));

  return facilities;
}

function extractLocations(raw: any): Location[] {
  const list: any[] = Array.isArray(raw)
    ? raw
    : raw?.data || raw?.content || raw?.locations || [];
  return list
    .filter((loc: any) => loc.isActive !== false)
    .map((loc: any) => ({
      id: loc.id,
      name: loc.name || loc.locationName,
      address: loc.address,
      isActive: loc.isActive !== false,
    }));
}

function fmtDisplayDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-");
    return `${y}/${m}/${d}`;
  } catch {
    return iso;
  }
}

function fmtShortDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}`;
  } catch {
    return iso;
  }
}

function getAllUniqueDates(facilities: FacilityResult[]): string[] {
  const dateSet = new Set<string>();
  facilities.forEach((fac) => {
    fac.slots.forEach((slot) => {
      slot.availability.forEach((av) => {
        dateSet.add(av.date);
      });
    });
  });
  return Array.from(dateSet).sort();
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function CreateBookingPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [pax, setPax] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [facilities, setFacilities] = useState<FacilityResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [dateOffset, setDateOffset] = useState(0);
  const DATES_PER_PAGE = 5;

  const allDates = useMemo(() => getAllUniqueDates(facilities), [facilities]);
  const visibleDates = useMemo(() => {
    return allDates.slice(dateOffset, dateOffset + DATES_PER_PAGE);
  }, [allDates, dateOffset]);

  const canGoBack = dateOffset > 0;
  const canGoForward = dateOffset + DATES_PER_PAGE < allDates.length;

  const totalAmount = useMemo(
    () => cart.reduce((s, c) => s + c.price, 0),
    [cart]
  );

  useEffect(() => {
    (async () => {
      const id = await getUserIdFromToken();
      if (!id) {
        alert("Unable to identify user. Please log in again.");
        router.push("/login");
        return;
      }
      setUserId(id);
      setLoadingUser(false);
    })();
  }, [router]);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const res = await customAxios.get("/v1/locations");
        const locs = extractLocations(res.data);
        setLocations(locs);
        if (locs.length > 0 && !selectedLocation) {
          setSelectedLocation(locs[0].name);
        }
      } catch (err: any) {
        console.error("Failed to fetch locations:", err);
        alert("Failed to load locations. Please refresh the page.");
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const handleSearch = async () => {
    setSearchError("");
    
    if (!selectedLocation.trim()) {
      setSearchError("Please select a location.");
      return;
    }
    
    if (!pax || parseInt(pax) <= 0) {
      setSearchError("Please enter valid number of persons.");
      return;
    }
    
    if (!selectedDate) {
      setSearchError("Please select a date.");
      return;
    }

    const paxNum = parseInt(pax);

    setLoadingSearch(true);
    setHasSearched(true);
    setFacilities([]);
    setShowCheckout(false);
    setDraftId(null);
    setCart([]);
    setDateOffset(0);

    try {
      const [year, month, day] = selectedDate.split("-");
      const dateForAPI = `${day}-${month}-${year}`;

      const response = await customAxios.get("/v1/availability/search", {
        params: {
          locationName: selectedLocation,
          pax: paxNum,
          date: dateForAPI,
        },
      });
      
      const extractedFacilities = extractFacilities(response.data);
      
      if (extractedFacilities.length === 0) {
        setSearchError(
          `No facilities available in ${selectedLocation} for ${paxNum} persons on ${year}/${month}/${day}.`
        );
      }
      
      setFacilities(extractedFacilities);
      
    } catch (e: any) {
      console.error("Search failed:", e);
      let errorMessage = "Failed to search availability. ";
      if (e?.response?.status === 400) {
        errorMessage += e?.response?.data?.message || "Invalid parameters.";
      } else if (e?.response?.status === 404) {
        errorMessage += "No data found.";
      } else {
        errorMessage += e?.message || "Please try again.";
      }
      setSearchError(errorMessage);
    } finally {
      setLoadingSearch(false);
    }
  };

  const toggleSlot = (
    fac: FacilityResult,
    slot: FacilitySlot,
    date: string,
    price: number
  ) => {
    const key = (c: CartItem) =>
      c.facilityId === fac.id && c.slotId === slot.id && c.eventDate === date;
    
    if (cart.some(key)) {
      setCart((prev) => prev.filter((c) => !key(c)));
    } else {
      setCart((prev) => [
        ...prev,
        {
          facilityId: fac.id,
          facilityName: fac.name,
          slotId: slot.id,
          slotName: slot.label || slot.name,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: price,
          eventDate: date,
        },
      ]);
    }
  };

  const removeFromCart = (idx: number) =>
    setCart((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cart.length) e.cart = "Add at least one slot.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const payload = {
        items: cart.map((c) => ({
          facilityId: c.facilityId,
          eventDate: c.eventDate,
          slotId: c.slotId,
          price: c.price,
          pax: parseInt(pax),
        })),
      };
      
      const response = await customAxios.post("/v1/booking/draft", payload);
      
      const id = response.data?.id || response.data?.data?.id || response.data?.bookingId;
      if (!id) throw new Error("No draft ID returned from server.");
      
      setDraftId(id);
      alert("Draft saved successfully!");
    } catch (e: any) {
      console.error("Save draft failed:", e);
      alert(
        e?.response?.data?.message || e?.message || "Failed to save draft."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!draftId) return;
    setSubmitting(true);
    try {
      await customAxios.post(`/v1/booking/${draftId}/submit`);
      alert("Booking submitted successfully!");
      setShowCheckout(false);
      router.push("/user/booking-status");
    } catch (e: any) {
      console.error("Submit failed:", e);
      alert(e?.response?.data?.message || e?.message || "Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!draftId) return;
    
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason || !reason.trim()) {
      alert("Cancellation reason is required.");
      return;
    }

    setCancelling(true);
    try {
      await customAxios.post(
        `/v1/booking/bookings/${draftId}/cancel?reason=${encodeURIComponent(reason.trim())}`
      );
      alert("Booking cancelled successfully!");
      setShowCheckout(false);
      setDraftId(null);
      setCart([]);
    } catch (e: any) {
      console.error("Cancel failed:", e);
      alert(e?.response?.data?.message || e?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  const renderCell = (
    fac: FacilityResult,
    slot: FacilitySlot,
    date: string
  ) => {
    const avEntry = slot.availability.find((av) => av.date === date);
    const isAdded = cart.some(
      (c) =>
        c.facilityId === fac.id &&
        c.slotId === slot.id &&
        c.eventDate === date
    );

    if (!avEntry) {
      return (
        <td key={date} className="px-2 py-3 text-center border-r border-gray-200">
          <div className="text-xs text-gray-400">-</div>
        </td>
      );
    }

    if (!avEntry.available) {
      return (
        <td key={date} className="px-2 py-3 text-center border-r border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-400">Not Available</div>
        </td>
      );
    }

    const statusColors = {
      AVAILABLE: "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100",
      HOLD: "bg-amber-50 border-amber-300 text-amber-700",
      RESERVED: "bg-blue-50 border-blue-300 text-blue-700",
      UNAVAILABLE: "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed",
    };

    const status = avEntry.status || "AVAILABLE";
    const isClickable = status === "AVAILABLE" || isAdded;

    return (
      <td key={date} className="px-2 py-3 text-center border-r border-gray-200">
        <button
          onClick={() => isClickable && toggleSlot(fac, slot, date, avEntry.price)}
          disabled={!isClickable}
          className={`
            w-full px-2 py-2 rounded-lg border text-xs font-medium transition-all
            ${isAdded ? "bg-blue-500 border-blue-600 text-white shadow-md" : statusColors[status]}
            ${!isClickable ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div className="flex flex-col items-center gap-1">
            {isAdded && <Check className="w-3.5 h-3.5" />}
            <span className="font-semibold">
              {status === "AVAILABLE" || isAdded ? "GET" : status}
            </span>
            {(status === "AVAILABLE" || isAdded) && (
              <span className="text-[10px] opacity-90">
                ₹{avEntry.price.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </button>
      </td>
    );
  };

  if (loadingUser || !userId || loadingLocations) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Create Booking"
        subtitle="Search available facilities and select time slots"
      />

      <div className="space-y-6">
        <SectionCard title="Search Availability">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Persons <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  placeholder="e.g. 60"
                  min="1"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {searchError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSearch}
              disabled={loadingSearch}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loadingSearch ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Facilities
                </>
              )}
            </button>
          </div>
        </SectionCard>

        {loadingSearch && (
          <SectionCard>
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-400">
                Searching available facilities...
              </span>
            </div>
          </SectionCard>
        )}

        {!loadingSearch && hasSearched && facilities.length === 0 && (
          <SectionCard>
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-base font-medium text-gray-600">
                No facilities found
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your search criteria
              </p>
            </div>
          </SectionCard>
        )}

        {!loadingSearch && facilities.length > 0 && (
          <SectionCard>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Available Slots
                </h3>
                {/* <span className="text-xs text-gray-500">
                  {allDates.length} days available
                </span> */}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDateOffset(Math.max(0, dateOffset - DATES_PER_PAGE))}
                  disabled={!canGoBack}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 min-w-[100px] text-center">
                  {fmtDisplayDate(visibleDates[0])} - {fmtDisplayDate(visibleDates[visibleDates.length - 1])}
                </span>
                <button
                  onClick={() => setDateOffset(dateOffset + DATES_PER_PAGE)}
                  disabled={!canGoForward}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-b border-gray-300 min-w-[200px]">
                      Facility / Slot
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-b border-gray-300 min-w-[100px]">
                      Min / Max Capacity
                    </th>
                    {visibleDates.map((date) => (
                      <th
                        key={date}
                        className="px-2 py-3 text-center text-xs font-semibold text-gray-700 border-r border-b border-gray-300 min-w-[100px]"
                      >
                        <div>{fmtShortDate(date)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facilities.map((fac) =>
                    fac.slots.map((slot, slotIdx) => (
                      <tr key={`${fac.id}-${slot.id}`} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-200">
                          <div className="space-y-1">
                            {slotIdx === 0 && (
                              <div className="font-semibold text-gray-900">
                                {fac.name}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slot.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center border-r border-gray-200">
                          <div className="text-xs text-gray-600">
                            {fac.minCap} / {fac.maxCap}
                          </div>
                        </td>

                        {visibleDates.map((date) => renderCell(fac, slot, date))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-300"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-gray-600">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-50 border border-amber-300"></div>
                <span className="text-gray-600">On Hold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                <span className="text-gray-600">Not Available</span>
              </div>
            </div>
          </SectionCard>
        )}

        {cart.length > 0 && (
          <SectionCard title="Booking Summary">
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.facilityName}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {fmtDisplayDate(item.eventDate)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.slotName} ({item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)})
                    </p>
                    <p className="text-sm font-semibold text-blue-600 mt-2">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 mb-4">
              <span className="text-sm font-medium text-gray-600">
                {cart.length} slot{cart.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xl font-bold text-blue-600">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            {errors.cart && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{errors.cart}</p>
              </div>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={saving || !!draftId}
              className={`
                w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm
                ${
                  draftId
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                }
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : draftId ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Draft Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Draft
                </>
              )}
            </button>

            {draftId && (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Review & Submit
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </SectionCard>
        )}

        {showCheckout && draftId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Checkout Summary</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedLocation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Number of Persons</p>
                      <p className="text-sm font-semibold text-gray-900">{pax}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                      <p className="text-sm font-semibold text-gray-900">{draftId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Draft
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Facility</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Slot</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Time</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.facilityName}</td>
                          <td className="px-4 py-3 text-gray-600">{fmtDisplayDate(item.eventDate)}</td>
                          <td className="px-4 py-3 text-gray-600">{item.slotName}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">
                            ₹{item.price.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-300">
                        <td colSpan={4} className="px-4 py-4 text-right font-semibold text-gray-900">
                          Total Amount:
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-xl text-blue-600">
                          ₹{totalAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Booking
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Cancel Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}