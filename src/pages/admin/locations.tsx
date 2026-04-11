import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";

import {
  fetchLocations,
  createLocationAPI,
  updateLocationAPI,
  deleteLocationAPI,
} from "../../store/slices/locationSlice";

import { fetchUsers } from "../../store/slices/userSlice";

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

const EMPTY = {
  name: "",
  approverUserId: "",
  isActive: true,
};

export default function LocationsPage({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useDispatch<AppDispatch>();

  const locations = useSelector((s: RootState) => s.locations.items);
  const users = useSelector((s: RootState) => s.users.items);
  const loading = useSelector((s: RootState) => s.locations.loading);
  const error = useSelector((s: RootState) => s.locations.error);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchLocations());
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = users.filter((u: any) => !u.system);

  const getUserName = (id: string) =>
    // filteredUsers.find((u: any) => u.id === id)?.username || id;
    filteredUsers.find((u: any) => u.id === id)?.name || id;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name,
      approverUserId: row.approverUserId || "",
      isActive: row.isActive,
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.approverUserId) e.approverUserId = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      if (editing) {
        await dispatch(
          updateLocationAPI({
            id: editing.id,
            ...form,
          })
        ).unwrap();
      } else {
        await dispatch(createLocationAPI(form)).unwrap();
      }

      setOpen(false);
    } catch (err: any) {
      alert(err || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location?")) return;

    try {
      await dispatch(deleteLocationAPI(id)).unwrap();
    } catch (err: any) {
      alert(err || "Failed to delete");
    }
  };

  const columns = [
    { key: "name", label: "Location" },
    {
      key: "approverUserId",
      label: "Approver",
      render: (v: string) => getUserName(v),
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
      render: (_: any, row: any) => (
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
        title="Locations"
        subtitle="Manage booking locations"
        action={
          <Button onClick={openCreate} disabled={loading}>
            + Add Location
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
          <Table columns={columns} data={locations} />
        )}
      </Card>

      <Modal
        isOpen={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Location" : "New Location"}
      >
        <div className="space-y-4">
          <Input
            label="Location Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            disabled={saving}
          />

          <Select
            label="Approver"
            options={
              filteredUsers.length === 0
                ? [{ value: "", label: "Loading..." }]
                : filteredUsers.map((u: any) => ({
                  value: u.id,
                  label: u.username,
                }))
            }
            value={form.approverUserId}
            onChange={(e) =>
              setForm({ ...form, approverUserId: e.target.value })
            }
            error={errors.approverUserId}
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