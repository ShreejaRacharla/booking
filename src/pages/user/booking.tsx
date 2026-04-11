import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "../../store";
import {
  createBookingDraftAPI,
  submitBookingAPI,
} from "../../store/slices/bookingSlice";
import { fetchFacilities } from "../../store/slices/facilitySlice";
import { fetchTimeslots } from "../../store/slices/timeslotSlice";
import { getAvailability } from "../../services/api";
import {
  Layout,
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
} from "../../components";
import { Loader2, Calendar, Clock, Plus, Trash2, Check, Save } from "lucide-react";
import { BookingItem } from "../../types";
import Cookies from "js-cookie";
import axios from "axios";

interface AvailableSlot {
  id: string;
  date: string;
  timeslotId: string;
  timeslotName: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
}

interface DecodedToken {
  id?: string;
  userId?: string;
  sub?: string;
  username?: string;
  user_id?: string;
  exp?: number;
  iat?: number;
}

function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format");
      return null;
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

async function getUserIdFromToken(): Promise<string | null> {
  try {
    const token = Cookies.get("accessToken");

    if (!token) {
      console.warn("No access token found in cookies");
      return null;
    }

    const decoded = decodeJWT(token);

    if (!decoded) {
      console.error("Failed to decode token");
      return null;
    }

    console.log("🔑 Decoded token:", decoded);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.error("Token has expired");
      return null;
    }

    const directUserId = decoded.id || decoded.userId || decoded.sub || decoded.user_id;

    if (directUserId) {
      console.log("User ID found directly in token:", directUserId);
      return directUserId;
    }

    const username = decoded.username;

    if (!username) {
      console.error("No userId or username found in token. Token structure:", decoded);
      return null;
    }

    console.log("🔍 Fetching user ID for username:", username);

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/users/by-username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const userId = response.data?.id || response.data?.data?.id || response.data?.userId;

    if (!userId) {
      console.error("No user ID in API response:", response.data);
      return null;
    }

    console.log("User ID fetched from API:", userId);
    return userId;

  } catch (error: any) {
    console.error("Error extracting user ID:", error);

    if (error.response?.status === 401) {
      console.error("Unauthorized - token may be invalid");
    }

    return null;
  }
}

function parseAvailabilityResponse(
  rawData: any,
  targetDate: string,
  timeslots: any[]
): AvailableSlot[] {
  let list: any[] = [];

  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (Array.isArray(rawData?.content)) {
    list = rawData.content;
  } else if (Array.isArray(rawData?.items)) {
    list = rawData.items;
  } else if (Array.isArray(rawData?.data)) {
    list = rawData.data;
  }

  const slots: AvailableSlot[] = [];

  list.forEach((entry: any) => {
    if (entry.slotId && Array.isArray(entry.data)) {
      entry.data.forEach((day: any) => {
        let formattedDate: string;

        if (Array.isArray(day.date)) {
          const [year, month, dayNum] = day.date;
          formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        } else {
          formattedDate = day.date;
        }

        if (formattedDate === targetDate && day.status === "AVAILABLE") {
          const ts = timeslots.find((t) => t.id === entry.slotId);

          slots.push({
            id: `${entry.slotId}-${formattedDate}`,
            date: formattedDate,
            timeslotId: entry.slotId,
            timeslotName: entry.slotName || entry.displayName || ts?.name || "Unknown",
            startTime: ts?.startTime || "00:00:00",
            endTime: ts?.endTime || "23:59:59",
            price: day.price ?? 0,
            status: day.status,
          });
        }
      });
      return;
    }

    if (entry.date && entry.slotId && !Array.isArray(entry.data)) {
      if (entry.date === targetDate && entry.status === "AVAILABLE") {
        const ts = timeslots.find((t) => t.id === entry.slotId);
        slots.push({
          id: `${entry.slotId}-${entry.date}`,
          date: entry.date,
          timeslotId: entry.slotId,
          timeslotName: entry.slotName || ts?.name || "Unknown",
          startTime: entry.startTime || ts?.startTime || "00:00:00",
          endTime: entry.endTime || ts?.endTime || "23:59:59",
          price: entry.price ?? 0,
          status: entry.status,
        });
      }
    }
  });

  return slots.sort((a, b) =>
    a.startTime && b.startTime ? a.startTime.localeCompare(b.startTime) : 0
  );
}

export default function CreateBookingPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const facilities = useSelector((s: RootState) => s.facilities.items);
  const timeslots = useSelector((s: RootState) => s.timeslots.items);

  const [selectedFacility, setSelectedFacility] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [eventPurpose, setEventPurpose] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  // const [specialRequirements, setSpecialRequirements] = useState("");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [draftBookingId, setDraftBookingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      setLoadingUser(true);
      const id = await getUserIdFromToken();

      if (!id) {
        alert("Unable to identify user. Please log in again.");
        router.push("/login");
        return;
      }

      setUserId(id);
      setLoadingUser(false);
    };

    fetchUserId();
  }, [router]);

  useEffect(() => {
    dispatch(fetchFacilities() as any);
    dispatch(fetchTimeslots() as any);
  }, [dispatch]);

  const fetchAvailableSlots = async () => {
    if (!selectedFacility || !selectedDate) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    try {
      const response = await getAvailability({
        facilityId: selectedFacility,
        fromDate: selectedDate,
        toDate: selectedDate,
      });

      if (!response) {
        console.error("No response from availability API");
        setAvailableSlots([]);
        return;
      }

      console.log("Availability API Response:", response.data);
      console.log("Timeslots in store:", timeslots);
      console.log("Target date:", selectedDate);

      const parsed = parseAvailabilityResponse(
        response.data,
        selectedDate,
        timeslots
      );

      console.log("Parsed slots:", parsed);
      setAvailableSlots(parsed);
    } catch (err: any) {
      console.error("Availability fetch error:", err);
      alert(
        err?.response?.data?.message || "Failed to fetch available slots"
      );
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedFacility && selectedDate && timeslots.length > 0) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedFacility, selectedDate, timeslots]);

  const addSlot = (slot: AvailableSlot) => {
    const alreadyAdded = bookingItems.some(
      (item) =>
        item.facilityId === selectedFacility &&
        item.eventDate === selectedDate &&
        item.slotId === slot.timeslotId
    );
    if (alreadyAdded) {
      alert("This slot is already added!");
      return;
    }

    const facility = facilities.find((f) => f.id === selectedFacility);
    setBookingItems([
      ...bookingItems,
      {
        facilityId: selectedFacility,
        facilityName: facility?.name || "Unknown Facility",
        eventDate: selectedDate,
        slotId: slot.timeslotId,
        slotName: slot.timeslotName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        price: slot.price,
      },
    ]);
  };

  const removeItem = (index: number) =>
    setBookingItems(bookingItems.filter((_, i) => i !== index));

  const totalAmount = useMemo(
    () => bookingItems.reduce((sum, item) => sum + item.price, 0),
    [bookingItems]
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (bookingItems.length === 0) errs.items = "Add at least one slot";
    if (!eventPurpose.trim()) errs.purpose = "Required";
    if (!expectedAttendees || Number(expectedAttendees) <= 0)
      errs.attendees = "Must be > 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!userId) {
      alert("User not authenticated. Please log in again.");
      router.push("/login");
      return;
    }

    if (!validate()) return;

    setSaving(true);
    try {
      const draftPayload = {
        userId: userId,
        items: bookingItems.map((item) => ({
          facilityId: item.facilityId,
          eventDate: item.eventDate,
          slotId: item.slotId,
          price: item.price,
        })),
      };

      console.log("Saving draft:", JSON.stringify(draftPayload, null, 2));

      const draft = await dispatch(
        createBookingDraftAPI(draftPayload) as any
      ).unwrap();

      console.log("Draft saved:", draft);

      const draftId = draft?.id ?? draft?.data?.id;
      if (!draftId) throw new Error("Draft created but no ID returned");

      setDraftBookingId(draftId);
      alert(`Draft saved successfully! Booking ID: ${draftId}`);
    } catch (err: any) {
      console.error("Save draft error:", err);
      alert(
        `Error: ${err?.response?.data?.message || err?.message || "Failed to save draft"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!draftBookingId) {
      alert("Please save draft first");
      return;
    }

    setSubmitting(true);
    try {
      console.log("📤 Submitting booking:", draftBookingId);
      await dispatch(submitBookingAPI(draftBookingId) as any).unwrap();

      console.log("Booking submitted");
      alert("Booking submitted successfully!");
      router.push("/user/booking");
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(
        `Error: ${err?.response?.data?.message || err?.message || "Failed to submit booking"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser || !userId) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          <span className="ml-3 text-rotary-darkgray">Authenticating...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Create Booking"
        subtitle="Select facility, date and time slots"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <h3 className="text-base font-bold text-rotary-royal mb-4">
              Select Facility &amp; Date
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Facility"
                options={[
                  { value: "", label: "Select Facility" },
                  ...facilities
                    .filter((f) => f.isActive)
                    .map((f) => ({ value: f.id, label: f.name })),
                ]}
                value={selectedFacility}
                onChange={(e) => {
                  setSelectedFacility(e.target.value);
                  setAvailableSlots([]);
                }}
              />
              <Input
                label="Event Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            {selectedFacility && selectedDate && (
              <p className="mt-3 text-sm text-rotary-darkgray">
                Showing slots for{" "}
                <strong>
                  {facilities.find((f) => f.id === selectedFacility)?.name}
                </strong>{" "}
                on{" "}
                <strong>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                  )}
                </strong>
              </p>
            )}
          </Card>

          {selectedFacility && selectedDate && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-rotary-royal">
                  Available Time Slots
                  {availableSlots.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-rotary-darkgray">
                      ({availableSlots.length} available)
                    </span>
                  )}
                </h3>
                {loadingSlots && (
                  <Loader2 className="w-4 h-4 text-rotary-royal animate-spin" />
                )}
              </div>

              {loadingSlots ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-rotary-royal animate-spin" />
                  <p className="text-rotary-darkgray">Loading available slots…</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-rotary-darkgray font-medium">
                    No available slots for this date
                  </p>
                  <p className="text-sm text-rotary-darkgray mt-1">
                    Try a different date or facility
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSlots.map((slot) => {
                    const isAdded = bookingItems.some(
                      (item) =>
                        item.eventDate === selectedDate &&
                        item.slotId === slot.timeslotId
                    );
                    return (
                      <div
                        key={slot.id}
                        className={`border rounded-lg p-4 transition-all ${isAdded
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-rotary-royal hover:shadow-sm"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-rotary-royal" />
                            <span className="font-semibold text-sm">
                              {slot.startTime?.slice(0, 5) || "N/A"} –{" "}
                              {slot.endTime?.slice(0, 5) || "N/A"}
                            </span>
                          </div>
                          <Badge variant={isAdded ? "active" : "available"}>
                            {isAdded ? "Added" : "Available"}
                          </Badge>
                        </div>
                        <div className="text-xs text-rotary-darkgray mb-3">
                          {slot.timeslotName}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-rotary-royal">
                            ₹{slot.price.toLocaleString("en-IN")}
                          </span>
                          {isAdded ? (
                            <Button size="sm" variant="success" disabled>
                              <Check className="w-3 h-3 mr-1" />
                              Added
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => addSlot(slot)}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          <Card>
            <h3 className="text-base font-bold text-rotary-royal mb-4">
              Event Details
            </h3>
            <div className="space-y-4">
              <Input
                label="Event Purpose"
                placeholder="e.g. Annual General Meeting"
                value={eventPurpose}
                onChange={(e) => setEventPurpose(e.target.value)}
                error={errors.purpose}
                required
              />
              <Input
                label="Expected Attendees"
                type="number"
                placeholder="e.g. 50"
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(e.target.value)}
                error={errors.attendees}
                min="1"
                required
              />
              {/* <Input
                label="Special Requirements (Optional)"
                placeholder="e.g. Projector, Audio System"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
              /> */}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-5">
            <h3 className="text-base font-bold text-rotary-royal mb-4">
              Booking Summary
            </h3>

            {bookingItems.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-rotary-darkgray text-sm">No slots added yet</p>
                <p className="text-xs text-rotary-darkgray mt-1">
                  Select a facility, date and add time slots
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {bookingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 hover:border-rotary-royal transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <div className="font-medium text-sm text-rotary-black">
                          {item.facilityName}
                        </div>
                        <div className="text-xs text-rotary-darkgray flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.eventDate + "T00:00:00").toLocaleDateString("en-IN")}
                        </div>
                        <div className="text-xs text-rotary-darkgray flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.startTime?.slice(0, 5)} – {item.endTime?.slice(0, 5)}
                        </div>
                        <div className="text-xs text-rotary-darkgray mt-1">
                          {item.slotName}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-rotary-cranberry hover:bg-rotary-cranberry/10 p-1 rounded transition-colors"
                        title="Remove slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right font-bold text-rotary-royal">
                      ₹{item.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-rotary-darkgray">
                  {bookingItems.length} Slot{bookingItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-rotary-royal">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {errors.items && (
              <p className="text-sm text-rotary-cranberry mb-3 bg-red-50 p-2 rounded">
                {errors.items}
              </p>
            )}

            {draftBookingId && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                {/* <p className="text-green-700 font-medium">Draft Saved</p> */}
                {/* <p className="text-green-600 mt-1 font-mono break-all">{draftBookingId}</p> */}
              </div>
            )}

            <div className="space-y-2">
              <Button
                fullWidth
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={saving || bookingItems.length === 0 || !!draftBookingId}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Draft…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {draftBookingId ? "Draft Saved" : "Save Draft"}
                  </>
                )}
              </Button>

              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={!draftBookingId || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>Submit Booking</>
                )}
              </Button>
            </div>

            {!draftBookingId && (
              <p className="text-xs text-rotary-darkgray mt-2 text-center">
                Save draft first, then submit
              </p>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}