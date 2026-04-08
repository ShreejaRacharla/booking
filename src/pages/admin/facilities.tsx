import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  fetchFacilities,
  createFacilityAPI,
  updateFacilityAPI,
  deleteFacilityAPI,
} from "../../store/slices/facilitySlice";
import { fetchLocations } from "../../store/slices/locationSlice"; 
import { Facility, FacilityType, Column } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Table,
  Button,
  Modal,
  Input,
  Select,
  Toggle,
  Badge,
} from "../../components";
import { Loader2 } from "lucide-react";

const TYPES: { value: FacilityType; label: string }[] = [
  { value: "BANQUET", label: "Banquet Hall" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "OUTDOOR", label: "Outdoor" },
];

const EMPTY = {
  name: "",
  locationId: "",
  type: "" as string,
  capacity: "",
  isActive: true,
};

export default function FacilitiesPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useDispatch();
  const { items: facilities, loading, error } = useSelector(
    (s: RootState) => s.facilities
  );
  const { items: locations, loading: locationsLoading } = useSelector(
    (s: RootState) => s.locations
  );
  const user = useSelector((s: RootState) => s.auth.user);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchFacilities() as any);
    dispatch(fetchLocations() as any);
  }, [dispatch]);

  const locName = (id: string) =>
    locations.find((l) => l.id === id)?.name || id;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (f: Facility) => {
    setEditing(f);
    setForm({
      name: f.name,
      locationId: f.locationId,
      type: f.type,
      capacity: String(f.capacity),
      isActive: f.isActive,
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.locationId) e.locationId = "Required";
    if (!form.type) e.type = "Required";
    if (!form.capacity || Number(form.capacity) <= 0)
      e.capacity = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await dispatch(
          updateFacilityAPI({
            id: editing.id,
            name: form.name,
            capacity: Number(form.capacity),
            locationId: form.locationId,
            approverUserId: user?.id ?? "",
            type: form.type as FacilityType,
            isActive: form.isActive,
          }) as any
        ).unwrap();
      } else {
        await dispatch(
          createFacilityAPI({
            name: form.name,
            capacity: Number(form.capacity),
            locationId: form.locationId,
            approverUserId: user?.id ?? "",
            type: form.type as FacilityType,
            isActive: form.isActive,
          }) as any
        ).unwrap();
      }
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to save facility");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: Facility) => {
    if (!confirm(`Are you sure you want to delete "${f.name}"?`)) return;

    try {
      await dispatch(deleteFacilityAPI(f.id) as any).unwrap();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  };

  const columns: Column[] = [
    { key: "name", label: "Facility" },
    {
      key: "locationId",
      label: "Location",
      render: (v: string) => locName(v),
    },
    {
      key: "type",
      label: "Type",
      render: (v: string) => (
        <Badge variant="booked">{v.replace("_", " ")}</Badge>
      ),
    },
    { key: "capacity", label: "Capacity" },
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
      render: (_: any, row: Facility) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row)}
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
        title="Facilities"
        subtitle="Manage halls, rooms and venues"
        action={
          <Button onClick={openCreate} disabled={loading}>
            + Add Facility
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
          <Table columns={columns} data={facilities} />
        )}
      </Card>

      <Modal
        isOpen={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Facility" : "New Facility"}
      >
        <div className="space-y-4">
          <Input
            label="Facility Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            disabled={saving}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Location"
              options={locations
                .filter((l) => l.isActive)
                .map((l) => ({ value: l.id, label: l.name }))}
              value={form.locationId}
              onChange={(e) =>
                setForm({ ...form, locationId: e.target.value })
              }
              error={errors.locationId}
              disabled={saving || locationsLoading}
              placeholder={locationsLoading ? "Loading locations..." : "Select location"}
            />
            <Select
              label="Type"
              options={TYPES}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              error={errors.type}
              disabled={saving}
              placeholder="Select type"
            />
          </div>

          <Input
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            error={errors.capacity}
            disabled={saving}
          />

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