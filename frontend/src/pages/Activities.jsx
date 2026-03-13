import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, SlidersHorizontal } from "lucide-react";
import {
  getActivities, createActivity, updateActivity, deleteActivity,
  getFields, createField, updateField, deleteField,
} from "../lib/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

// ─── Activity form ────────────────────────────────────────────────────────────

function ActivityForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [points, setPoints] = useState(initial.points ?? 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description: description || null, points: Number(points) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Points <span className="text-gray-400 font-normal">(positive = good, negative = bad)</span>
        </label>
        <input
          required
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
          Save
        </button>
      </div>
    </form>
  );
}

// ─── Field form (create / edit) ───────────────────────────────────────────────

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "duration", label: "Duration (MM:SS)" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select (choose from list)" },
];

function FieldForm({ initial = null, onSubmit, onCancel }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [fieldType, setFieldType] = useState(initial?.field_type ?? "text");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  // For select options — existing options are shown non-removable; user can add new ones
  const [existingOptions] = useState(initial?.options ?? []);
  const [newOption, setNewOption] = useState("");
  const [pendingOptions, setPendingOptions] = useState([]);

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    const all = [...existingOptions, ...pendingOptions];
    if (!all.includes(trimmed)) {
      setPendingOptions((prev) => [...prev, trimmed]);
    }
    setNewOption("");
  };

  const removeOption = (opt) => {
    setPendingOptions((prev) => prev.filter((o) => o !== opt));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { name };
    if (!isEdit) {
      data.field_type = fieldType;
    }
    if (fieldType === "number" || (!isEdit && fieldType === "number")) {
      data.unit = unit || null;
    }
    // For number fields (create or edit), include unit
    if (initial?.field_type === "number" || (!isEdit && fieldType === "number")) {
      data.unit = unit || null;
    }
    // For select fields, send merged options (backend will union with existing)
    if (initial?.field_type === "select" || (!isEdit && fieldType === "select")) {
      data.options = [...existingOptions, ...pendingOptions];
    }
    onSubmit(data);
  };

  const effectiveType = isEdit ? initial.field_type : fieldType;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type {isEdit && <span className="text-gray-400 font-normal">(cannot be changed)</span>}
        </label>
        {isEdit ? (
          <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            {FIELD_TYPES.find((t) => t.value === initial.field_type)?.label ?? initial.field_type}
          </p>
        ) : (
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        )}
      </div>

      {effectiveType === "number" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit <span className="text-gray-400 font-normal">(optional, e.g. miles, lbs)</span>
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="miles"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {effectiveType === "select" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
          <ul className="space-y-1 mb-2">
            {existingOptions.map((opt) => (
              <li key={opt} className="flex items-center gap-2 text-sm text-gray-700 px-2 py-1 bg-gray-50 rounded">
                <span className="flex-1">{opt}</span>
                <span className="text-xs text-gray-400">saved</span>
              </li>
            ))}
            {pendingOptions.map((opt) => (
              <li key={opt} className="flex items-center gap-2 text-sm text-gray-700 px-2 py-1 bg-brand-50 rounded">
                <span className="flex-1">{opt}</span>
                <button
                  type="button"
                  onClick={() => removeOption(opt)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
              placeholder="New option"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={addOption}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
          Save
        </button>
      </div>
    </form>
  );
}

// ─── Fields manager modal ─────────────────────────────────────────────────────

function FieldsModal({ activity, onClose }) {
  const qc = useQueryClient();
  const [fieldModal, setFieldModal] = useState(null); // { mode: "create"|"edit", field?: {} }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields", activity.id],
    queryFn: () => getFields(activity.id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["fields", activity.id] });
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => createField(activity.id, data),
    onSuccess: () => { invalidate(); setFieldModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateField(activity.id, id, data),
    onSuccess: () => { invalidate(); setFieldModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteField(activity.id, id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const handleSubmit = (data) => {
    if (fieldModal.mode === "create") createMutation.mutate(data);
    else updateMutation.mutate({ id: fieldModal.field.id, data });
  };

  const TYPE_LABELS = { text: "Text", duration: "Duration", number: "Number", select: "Select" };

  return (
    <>
      <Modal title={`Fields — ${activity.name}`} onClose={onClose}>
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setFieldModal({ mode: "create" })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              <Plus size={14} /> Add Field
            </button>
          </div>

          {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

          {!isLoading && fields.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No custom fields yet.</p>
          )}

          <ul className="space-y-2">
            {fields.map((f) => (
              <li key={f.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABELS[f.field_type]}
                    {f.unit && ` · ${f.unit}`}
                    {f.field_type === "select" && f.options?.length > 0 && ` · ${f.options.join(", ")}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setFieldModal({ mode: "edit", field: f })}
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(f)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      {fieldModal && (
        <Modal
          title={fieldModal.mode === "create" ? "Add Field" : "Edit Field"}
          onClose={() => setFieldModal(null)}
        >
          <FieldForm
            initial={fieldModal.field}
            onSubmit={handleSubmit}
            onCancel={() => setFieldModal(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Field"
          message={`Delete the "${deleteTarget.name}" field? Existing logged values will be preserved but shown as deleted.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ─── Activities page ──────────────────────────────────────────────────────────

export default function Activities() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // { mode: "create"|"edit", activity?: {} }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [fieldsActivity, setFieldsActivity] = useState(null); // activity whose fields we're managing

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["activities"] });

  const createMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateActivity(id, data),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const handleSubmit = (data) => {
    if (modal.mode === "create") createMutation.mutate(data);
    else updateMutation.mutate({ id: modal.activity.id, data });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Activities</h1>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> New Activity
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      {!isLoading && activities.length === 0 && (
        <p className="text-gray-400 text-center py-12">No activities yet. Add one to get started!</p>
      )}

      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
            <span
              className={`text-lg font-bold w-16 text-right tabular-nums ${
                a.points >= 0 ? "text-brand-600" : "text-red-500"
              }`}
            >
              {a.points > 0 ? "+" : ""}{a.points}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{a.name}</p>
              {a.description && <p className="text-sm text-gray-500 truncate">{a.description}</p>}
              {a.fields?.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.fields.length} custom field{a.fields.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setFieldsActivity(a)}
                title="Manage custom fields"
                className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
              >
                <SlidersHorizontal size={16} />
              </button>
              <button
                onClick={() => setModal({ mode: "edit", activity: a })}
                className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(a)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {modal && (
        <Modal
          title={modal.mode === "create" ? "New Activity" : "Edit Activity"}
          onClose={() => setModal(null)}
        >
          <ActivityForm
            initial={modal.activity}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Activity"
          message={`Delete "${deleteTarget.name}"? Past log entries will be preserved.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {fieldsActivity && (
        <FieldsModal
          activity={fieldsActivity}
          onClose={() => setFieldsActivity(null)}
        />
      )}
    </div>
  );
}
