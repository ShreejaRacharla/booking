import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { fetchTimeslots, createTimeslotAPI, updateTimeslotAPI, deleteTimeslotAPI } from "../../store/slices/timeslotSlice";
import { fetchFacilities } from "../../store/slices/facilitySlice";
import { TimeSlot, Column } from "../../types";
import { Layout, PageHeader, Card, Table, Button, Modal, Input, Select, Toggle, Badge } from "../../components";
import { Loader2 } from "lucide-react";

const EMPTY = {
  name: "",
  startTime: "",
  endTime: "",
  facilityId: "",
  isActive: true,
};

const formatTimeForAPI = (time: string) =>
  time.length === 5 ? `${time}:00` : time;

const formatTimeForUI = (time: string) => time?.slice(0, 5) || "";

export default function TimeslotsPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useDispatch();

  const { items: timeslots, loading, error } = useSelector(
    (s: RootState) => s.timeslots
  );

  const facilities = useSelector((s: RootState) => s.facilities.items);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimeSlot | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchTimeslots() as any);
    dispatch(fetchFacilities() as any);
  }, [dispatch]);

  const getFacilityName = (id: string) => {
    return facilities.find((f) => f.id === id)?.name || id;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (ts: TimeSlot & { facilityId?: string }) => {
    setEditing(ts);
    setForm({
      name: ts.name,
      startTime: formatTimeForUI(ts.startTime),
      endTime: formatTimeForUI(ts.endTime),
      facilityId: ts.facilityId || "",
      isActive: ts.isActive,
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.startTime) e.startTime = "Required";
    if (!form.endTime) e.endTime = "Required";
    if (!form.facilityId) e.facilityId = "Required";
    if (form.startTime >= form.endTime)
      e.endTime = "End must be after start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        startTime: formatTimeForAPI(form.startTime),
        endTime: formatTimeForAPI(form.endTime),
        facilityId: form.facilityId,
        isActive: form.isActive,
      };

      if (editing) {
        await dispatch(
          updateTimeslotAPI({
            id: editing.id,
            ...payload,
          }) as any
        ).unwrap();
      } else {
        await dispatch(createTimeslotAPI(payload) as any).unwrap();
      }

      setOpen(false);
    } catch (err: any) {
      alert(err?.message || "Failed to save timeslot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this timeslot?")) return;

    try {
      await dispatch(deleteTimeslotAPI(id) as any).unwrap();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  };

  const columns: Column[] = [
    { key: "name", label: "Slot Name" },
    {
      key: "facilityId",
      label: "Facility",
      render: (v: string) => (
        <span className="text-sm text-gray-700">
          {v ? getFacilityName(v) : "N/A"}
        </span>
      ),
    },
    {
      key: "startTime",
      label: "Start",
      render: (v: string) => formatTimeForUI(v),
    },
    {
      key: "endTime",
      label: "End",
      render: (v: string) => formatTimeForUI(v),
    },
    {
      key: "isActive",
      label: "Status",
      render: (v: boolean) => (
        <Badge variant={v ? "active" : "inactive"}>
          {v ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: TimeSlot) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const content = (
    <>
      <PageHeader
        title="Time Slots"
        subtitle="Manage reusable time blocks"
        action={
          <Button onClick={openCreate} disabled={loading}>
            + Add Slot
          </Button>
        }
      />

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
          <Table columns={columns} data={timeslots} />
        )}
      </Card>

      <Modal
        isOpen={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Slot" : "New Slot"}
      >
        <div className="space-y-4">
          <Input
            label="Slot Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            disabled={saving}
          />

          <Select
            label="Facility"
            options={
              facilities.length === 0
                ? [{ value: "", label: "Loading facilities..." }]
                : [
                  { value: "", label: "Select a facility" },
                  ...facilities
                    .filter((f) => f.isActive)
                    .map((f) => ({
                      value: f.id,
                      label: f.name,
                    })),
                ]
            }
            value={form.facilityId}
            onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
            error={errors.facilityId}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) =>
                setForm({ ...form, startTime: e.target.value })
              }
              error={errors.startTime}
              disabled={saving}
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              error={errors.endTime}
              disabled={saving}
            />
          </div>

          <Toggle
            label="Active"
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            disabled={saving}
          />

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button onClick={save} fullWidth disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editing ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>{editing ? "Update" : "Save"}</>
              )}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setOpen(false)}
              disabled={saving}
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