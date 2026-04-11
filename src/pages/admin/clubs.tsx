import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  fetchClubs,
  createClubAPI,
  updateClubAPI,
  deleteClubAPI,
} from "../../store/slices/clubSlice";
import { Club, Column } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Table,
  Button,
  Modal,
  Input,
  Toggle,
  Badge,
} from "../../components";
import { Loader2, AlertCircle } from "lucide-react";

const EMPTY = { name: "", isActive: true };

export default function ClubsPage() {
  const dispatch = useDispatch();
  const { items: clubs, loading, error } = useSelector(
    (s: RootState) => s.clubs
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchClubs() as any);
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (c: Club) => {
    setEditing(c);
    setForm({ name: c.name, isActive: c.isActive });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Club name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      if (editing) {
        await dispatch(
          updateClubAPI({
            id: editing.id,
            name: form.name.trim(),
            isActive: form.isActive,
          }) as any
        ).unwrap();
      } else {
        await dispatch(
          createClubAPI({
            name: form.name.trim(),
            isActive: form.isActive,
          }) as any
        ).unwrap();
      }
      setOpen(false);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err?.message || "Failed to save club");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Club) => {
    if (!confirm(`Are you sure you want to delete "${c.name}"?`)) return;

    try {
      await dispatch(deleteClubAPI(c.id) as any).unwrap();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err?.message || "Failed to delete club");
    }
  };

  const columns: Column[] = [
    { key: "name", label: "Club Name" },
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
      render: (_: any, row: Club) => (
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

  return (
    <Layout>
      <PageHeader
        title="Clubs"
        subtitle="Manage Rotary clubs"
        action={
          <Button onClick={openCreate} disabled={loading}>
            + Add Club
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rotary-cranberry/10 border border-rotary-cranberry/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rotary-cranberry shrink-0 mt-0.5" />
            <p className="text-sm text-rotary-cranberry flex-1">{error}</p>
          </div>
        </div>
      )}

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={clubs} />
        )}
      </Card>

      <Modal
        isOpen={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit Club" : "New Club"}
      >
        <div className="space-y-4">
          <Input
            label="Club Name"
            placeholder="e.g. Rotary Club of Mumbai"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
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
    </Layout>
  );
}