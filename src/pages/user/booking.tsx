/**
 * src/pages/management/booking.tsx
 * Create Booking page
 */
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
import { Loader2, Calendar, Clock, Plus, Trash2, Check } from "lucide-react";
import { BookingItem } from "../../types";

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

// Hardcoded test user ID — replace with real auth user ID in production
const TEST_USER_ID = "ed8d2207-176e-49aa-8905-ec9fc1049ffb";

// ─── AVAILABILITY PARSER ──────────────────────────────────────────────────────

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
    if (entry.date && entry.slotId && !Array.isArray(entry.data)) {
      if (entry.date === targetDate && entry.status === "AVAILABLE") {
        const ts = timeslots.find((t) => t.id === entry.slotId);
        slots.push({
          id: `${entry.slotId}-${entry.date}`,
          date: entry.date,
          timeslotId: entry.slotId,
          timeslotName: entry.slotName || ts?.name || "Unknown",
          startTime: entry.startTime || ts?.startTime || "",
          endTime: entry.endTime || ts?.endTime || "",
          price: entry.price ?? 0,
          status: entry.status,
        });
      }
      return;
    }

    if (entry.slotId && Array.isArray(entry.data)) {
      entry.data.forEach((day: any) => {
        if (day.date === targetDate && day.status === "AVAILABLE") {
          const ts = timeslots.find((t) => t.id === entry.slotId);
          slots.push({
            id: `${entry.slotId}-${day.date}`,
            date: day.date,
            timeslotId: entry.slotId,
            timeslotName: entry.slotName || ts?.name || "Unknown",
            startTime: day.startTime || ts?.startTime || "",
            endTime: day.endTime || ts?.endTime || "",
            price: day.price ?? 0,
            status: day.status,
          });
        }
      });
    }
  });

  return slots.sort((a, b) =>
    a.startTime && b.startTime ? a.startTime.localeCompare(b.startTime) : 0
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

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
  const [specialRequirements, setSpecialRequirements] = useState("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      console.log("Availability API Response:", response.data);
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

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const draftPayload = {
        userId: TEST_USER_ID,
        items: bookingItems.map((item) => ({
          facilityId: item.facilityId,
          eventDate: item.eventDate,
          slotId: item.slotId,
          price: item.price,
        })),
        eventDetails: {
          purpose: eventPurpose,
          expectedAttendees: Number(expectedAttendees),
          ...(specialRequirements.trim() && { specialRequirements }),
        },
      };

      console.log("📤 Draft payload:", JSON.stringify(draftPayload, null, 2));

      const draft = await dispatch(
        createBookingDraftAPI(draftPayload) as any
      ).unwrap();

      console.log("✅ Draft created:", draft);

      const draftId = draft?.id ?? draft?.data?.id;
      if (!draftId) throw new Error("Draft created but no ID returned");

      console.log("📤 Submitting booking:", draftId);
      await dispatch(submitBookingAPI(draftId) as any).unwrap();

      console.log("✅ Booking submitted");
      alert("✅ Booking submitted successfully!");
      router.push("/user/booking");
    } catch (err: any) {
      console.error("❌ Booking error:", err);
      alert(
        `Error: ${err?.response?.data?.message || err?.message || "Failed to create booking"}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Create Booking"
        subtitle="Select facility, date and time slots"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Facility & Date selector */}
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

          {/* Available slots */}
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
                        className={`border rounded-lg p-4 transition-all ${
                          isAdded
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
                          {/* ✅ FIX: Use correct variants */}
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

          {/* Event Details */}
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
              <Input
                label="Special Requirements (Optional)"
                placeholder="e.g. Projector, Audio System"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Summary ── */}
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

            <Button
              fullWidth
              onClick={handleSubmit}
              disabled={saving || bookingItems.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>Submit Booking{bookingItems.length > 0 && ` (${bookingItems.length})`}</>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}