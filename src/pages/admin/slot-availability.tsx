import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  fetchAvailability,
  fetchAvailabilityByFacility,
  generateslot,
  generateAvailabilityAPI,
  blockSlots,
  blockAvailabilityAPI,
  unblockSlots,
  unblockAvailabilityAPI,
  clearSlots,
} from "../../store/slices/slotSlice";
import { fetchLocations } from "../../store/slices/locationSlice";
import { fetchFacilities } from "../../store/slices/facilitySlice";
import { fetchTimeslots } from "../../store/slices/timeslotSlice";
import { SlotStatus } from "../../types";
import {
  generateId,
  getDatesInRange,
  formatDate,
  formatDisplayDate,
  getDayName,
  DAY_NAMES,
} from "../../utils/helpers";
import {
  Layout,
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Badge,
  Modal,
} from "../../components";
import { Loader2 } from "lucide-react";

const DAY_INDEX_TO_API: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const STATUS_COLORS: Record<SlotStatus, string> = {
  AVAILABLE: "bg-rotary-turquoise text-white",
  TEMP_HOLD: "bg-rotary-gold text-rotary-black",
  BOOKED: "bg-rotary-royal text-white",
  BLOCKED: "bg-rotary-cranberry text-white",
};

const STATUS_LABEL: Record<SlotStatus, string> = {
  AVAILABLE: "A",
  TEMP_HOLD: "H",
  BOOKED: "B",
  BLOCKED: "X",
};

export default function AvailabilityPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useDispatch();
  const locations = useSelector((s: RootState) => s.locations.items);
  const facilities = useSelector((s: RootState) => s.facilities.items);
  const timeslots = useSelector((s: RootState) => s.timeslots.items);
  const { entries: slotEntries, loading } = useSelector(
    (s: RootState) => s.slot
  );

  const [genForm, setGenForm] = useState({
    locationId: "",
    facilityId: "",
    fromDate: "",
    toDate: "",
    selectedDays: [0, 1, 2, 3, 4, 5, 6] as number[],
    selectedSlots: [] as string[],
    price: "",
  });

  const [gridFilter, setGridFilter] = useState({
    locationId: "",
    facilityId: "",
    fromDate: "",
    toDate: "",
  });

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchLocations() as any);
    dispatch(fetchFacilities() as any);
    dispatch(fetchTimeslots() as any);
  }, [dispatch]);

  const filteredFacilities = facilities.filter(
    (f) => f.locationId === genForm.locationId && f.isActive
  );

  const toggleDay = (d: number) =>
    setGenForm((p) => ({
      ...p,
      selectedDays: p.selectedDays.includes(d)
        ? p.selectedDays.filter((x) => x !== d)
        : [...p.selectedDays, d],
    }));

  const toggleSlot = (id: string) =>
    setGenForm((p) => ({
      ...p,
      selectedSlots: p.selectedSlots.includes(id)
        ? p.selectedSlots.filter((x) => x !== id)
        : [...p.selectedSlots, id],
    }));

  const handleFetchAvailability = async () => {
    if (!gridFilter.facilityId || !gridFilter.fromDate || !gridFilter.toDate) {
      return;
    }

    try {
      await dispatch(
        fetchAvailabilityByFacility({
          facilityId: gridFilter.facilityId,
          fromDate: gridFilter.fromDate,
          toDate: gridFilter.toDate,
        }) as any
      ).unwrap();
      console.log("✅ Fetched availability from API");
    } catch (err: any) {
      console.error("❌ Failed to fetch availability:", err);
    }
  };

  useEffect(() => {
    if (gridFilter.facilityId && gridFilter.fromDate && gridFilter.toDate) {
      handleFetchAvailability();
    } else {
      dispatch(clearSlots());
    }
  }, [gridFilter.facilityId, gridFilter.fromDate, gridFilter.toDate]);

  const handleGenerate = async () => {
    if (
      !genForm.locationId ||
      !genForm.facilityId ||
      !genForm.fromDate ||
      !genForm.toDate ||
      !genForm.selectedSlots.length ||
      !genForm.price
    ) {
      alert("Please fill all fields");
      return;
    }

    const selectedLocation = locations.find((l) => l.id === genForm.locationId);
    const selectedFacility = facilities.find((f) => f.id === genForm.facilityId);

    if (!selectedLocation || !selectedFacility) {
      alert("Invalid location or facility");
      return;
    }

    setActionLoading(true);
    try {
      const result = await dispatch(
        generateAvailabilityAPI({
          locationName: selectedLocation.name,
          facilityName: selectedFacility.name,
          fromDate: genForm.fromDate,
          toDate: genForm.toDate,
          daysOfWeek: genForm.selectedDays.map((d) => DAY_INDEX_TO_API[d]),
          slotIds: genForm.selectedSlots,
          pricePerSlot: Number(genForm.price),
        }) as any
      ).unwrap();

      console.log("✅ Generated availability:", result);

      setGridFilter({
        locationId: genForm.locationId,
        facilityId: genForm.facilityId,
        fromDate: genForm.fromDate,
        toDate: genForm.toDate,
      });

      alert("✅ Availability generated successfully!");
    } catch (err: any) {
      console.error("❌ Generation failed:", err);
      alert(err?.message || "Failed to generate availability");
    } finally {
      setActionLoading(false);
    }
  };

  const gridEntries = useMemo(() => {
    if (!gridFilter.facilityId || !gridFilter.fromDate || !gridFilter.toDate)
      return [];
    return slotEntries.filter(
      (e) =>
        e.facilityId === gridFilter.facilityId &&
        e.date >= gridFilter.fromDate &&
        e.date <= gridFilter.toDate
    );
  }, [slotEntries, gridFilter]);

  const gridDates = useMemo(() => {
    if (!gridFilter.fromDate || !gridFilter.toDate) return [];
    return getDatesInRange(
      new Date(gridFilter.fromDate + "T00:00:00"),
      new Date(gridFilter.toDate + "T00:00:00")
    );
  }, [gridFilter]);

  const gridTimeslots = useMemo(() => {
    const ids = new Set(gridEntries.map((e) => e.timeslotId));
    return timeslots.filter((t) => ids.has(t.id));
  }, [gridEntries, timeslots]);

  const getEntry = (date: string, tsId: string) =>
    gridEntries.find((e) => e.date === date && e.timeslotId === tsId);

  const toggleCell = (id: string) =>
    setSelectedCells((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedEntries = gridEntries.filter((e) => selectedCells.has(e.id));
  const canBlock =
    selectedEntries.length > 0 &&
    selectedEntries.every((e) => e.status === "AVAILABLE");
  const canUnblock =
    selectedEntries.length > 0 &&
    selectedEntries.every((e) => e.status === "BLOCKED");

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      alert("Provide a reason");
      return;
    }

    const facilityId = gridFilter.facilityId;
    const slots = selectedEntries.map((e) => ({
      date: e.date,
      slotId: e.timeslotId,
    }));

    setActionLoading(true);
    try {
      await dispatch(
        blockAvailabilityAPI({ facilityId, slots, reason: blockReason }) as any
      ).unwrap();

      console.log("✅ Blocked successfully");

      dispatch(
        blockSlots({ ids: Array.from(selectedCells), reason: blockReason })
      );
      setSelectedCells(new Set());
      setBlockModalOpen(false);
      setBlockReason("");
    } catch (err: any) {
      console.error("❌ Block failed:", err);
      alert(err?.message || "Failed to block slots");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    const facilityId = gridFilter.facilityId;
    const slots = selectedEntries.map((e) => ({
      date: e.date,
      slotId: e.timeslotId,
    }));

    setActionLoading(true);
    try {
      await dispatch(
        unblockAvailabilityAPI({ facilityId, slots }) as any
      ).unwrap();

      console.log("✅ Unblocked successfully");

      dispatch(unblockSlots(Array.from(selectedCells)));
      setSelectedCells(new Set());
    } catch (err: any) {
      console.error("❌ Unblock failed:", err);
      alert(err?.message || "Failed to unblock slots");
    } finally {
      setActionLoading(false);
    }
  };

  const content = (
    <>
      <PageHeader
        title="Manage Availability"
        subtitle="Generate availability and manage slot statuses"
      />

      <Card className="mb-5">
        <h3 className="text-base font-bold text-rotary-royal mb-4">
          Generate Availability
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <Select
            label="Location"
            options={[
              { value: "", label: "Select Location" },
              ...locations
                .filter((l) => l.isActive)
                .map((l) => ({ value: l.id, label: l.name })),
            ]}
            value={genForm.locationId}
            onChange={(e) =>
              setGenForm({
                ...genForm,
                locationId: e.target.value,
                facilityId: "",
              })
            }
          />
          <Select
            label="Facility"
            options={[
              { value: "", label: "Select Facility" },
              ...filteredFacilities.map((f) => ({
                value: f.id,
                label: f.name,
              })),
            ]}
            value={genForm.facilityId}
            onChange={(e) =>
              setGenForm({ ...genForm, facilityId: e.target.value })
            }
            disabled={!genForm.locationId}
          />
          <Input
            label="Price per Slot (₹)"
            type="number"
            placeholder="e.g. 5000"
            value={genForm.price}
            onChange={(e) => setGenForm({ ...genForm, price: e.target.value })}
          />
          <Input
            label="From Date"
            type="date"
            value={genForm.fromDate}
            onChange={(e) =>
              setGenForm({ ...genForm, fromDate: e.target.value })
            }
          />
          <Input
            label="To Date"
            type="date"
            value={genForm.toDate}
            onChange={(e) =>
              setGenForm({ ...genForm, toDate: e.target.value })
            }
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-rotary-black mb-2">
            Days of Week
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((day, idx) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  genForm.selectedDays.includes(idx)
                    ? "bg-rotary-royal text-white border-rotary-royal"
                    : "bg-white text-rotary-darkgray border-gray-300 hover:border-rotary-royal"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-rotary-black mb-2">
            Time Slots
          </label>
          <div className="flex flex-wrap gap-2">
            {timeslots.filter((t) => t.isActive).length === 0 ? (
              <p className="text-sm text-rotary-darkgray">
                No active time slots available
              </p>
            ) : (
              timeslots
                .filter((t) => t.isActive)
                .map((ts) => (
                  <button
                    key={ts.id}
                    type="button"
                    onClick={() => toggleSlot(ts.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      genForm.selectedSlots.includes(ts.id)
                        ? "bg-rotary-turquoise text-white border-rotary-turquoise"
                        : "bg-white text-rotary-darkgray border-gray-300 hover:border-rotary-turquoise"
                    }`}
                  >
                    {ts.name} ({ts.startTime.slice(0, 5)} –{" "}
                    {ts.endTime.slice(0, 5)})
                  </button>
                ))
            )}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={actionLoading || loading}>
          {actionLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Availability"
          )}
        </Button>
      </Card>

      {gridDates.length > 0 && gridTimeslots.length > 0 && (
        <Card className="mb-5" padding={false}>
          <div className="p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h3 className="text-base font-bold text-rotary-royal">
                Availability Grid
                {loading && (
                  <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {(
                  Object.entries(STATUS_LABEL) as [SlotStatus, string][]
                ).map(([status, label]) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${STATUS_COLORS[status]}`}
                    >
                      {label}
                    </span>
                    <span className="text-rotary-darkgray hidden sm:inline">
                      {status}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-bold text-rotary-royal bg-rotary-lightgray rounded-tl-lg sticky left-0 z-10">
                    Slot
                  </th>
                  {gridDates.map((d) => (
                    <th
                      key={formatDate(d)}
                      className="px-2 py-2 text-center text-xs font-bold text-rotary-royal bg-rotary-lightgray min-w-[60px]"
                    >
                      <div>{getDayName(d)}</div>
                      <div className="text-rotary-darkgray font-normal">
                        {d.getDate()}/{d.getMonth() + 1}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridTimeslots.map((ts) => (
                  <tr key={ts.id}>
                    <td className="px-2 py-2 text-xs font-medium text-rotary-black border-b border-gray-100 whitespace-nowrap sticky left-0 bg-white z-10">
                      {ts.name}
                      <br />
                      <span className="text-[10px] text-rotary-darkgray">
                        {ts.startTime.slice(0, 5)}-{ts.endTime.slice(0, 5)}
                      </span>
                    </td>
                    {gridDates.map((d) => {
                      const dateStr = formatDate(d);
                      const entry = getEntry(dateStr, ts.id);
                      if (!entry)
                        return (
                          <td
                            key={dateStr}
                            className="px-2 py-2 text-center border-b border-gray-100"
                          >
                            <span className="w-7 h-7 inline-flex items-center justify-center rounded bg-gray-100 text-gray-400 text-[10px]">
                              –
                            </span>
                          </td>
                        );
                      const sel = selectedCells.has(entry.id);
                      return (
                        <td
                          key={dateStr}
                          className="px-2 py-2 text-center border-b border-gray-100"
                        >
                          <button
                            onClick={() => toggleCell(entry.id)}
                            className={`w-7 h-7 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              STATUS_COLORS[entry.status]
                            } ${
                              sel
                                ? "ring-2 ring-offset-1 ring-rotary-black scale-110"
                                : "hover:scale-105"
                            }`}
                            title={`${entry.status}${
                              entry.blockReason ? ` — ${entry.blockReason}` : ""
                            } | ₹${entry.price}`}
                          >
                            {STATUS_LABEL[entry.status]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedCells.size > 0 && (
        <Card>
          <h3 className="text-base font-bold text-rotary-royal mb-3">
            Selected ({selectedCells.size})
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {selectedEntries.slice(0, 20).map((e) => {
              const ts = timeslots.find((t) => t.id === e.timeslotId);
              return (
                <Badge
                  key={e.id}
                  variant={
                    e.status === "AVAILABLE"
                      ? "available"
                      : e.status === "BLOCKED"
                      ? "blocked"
                      : "tempHold"
                  }
                >
                  {formatDisplayDate(e.date)} {ts?.startTime.slice(0, 5)}–
                  {ts?.endTime.slice(0, 5)}
                </Badge>
              );
            })}
            {selectedEntries.length > 20 && (
              <Badge variant="pending">
                +{selectedEntries.length - 20} more
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canBlock && (
              <Button
                variant="danger"
                onClick={() => setBlockModalOpen(true)}
                disabled={actionLoading}
              >
                Block Selected
              </Button>
            )}
            {canUnblock && (
              <Button
                variant="success"
                onClick={handleUnblock}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unblocking...
                  </>
                ) : (
                  "Unblock Selected"
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setSelectedCells(new Set())}
              disabled={actionLoading}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={blockModalOpen}
        onClose={() => !actionLoading && setBlockModalOpen(false)}
        title="Block Slots"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-rotary-darkgray">
            Blocking {selectedCells.size} slot(s). Provide a reason:
          </p>
          <Select
            label="Reason"
            options={[
              { value: "", label: "Select a reason" },
              { value: "Maintenance", label: "Maintenance" },
              { value: "Private Event", label: "Private Event" },
              { value: "Manual Override", label: "Manual Override" },
              { value: "Other", label: "Other" },
            ]}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="danger"
              fullWidth
              onClick={handleBlock}
              disabled={actionLoading || !blockReason}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                "Confirm Block"
              )}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setBlockModalOpen(false)}
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