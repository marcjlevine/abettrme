import { useState, useEffect, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { getLogs, createLog, updateLog, deleteLog, getActivities } from "../lib/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Custom field input ───────────────────────────────────────────────────────

function FieldInput({ field, value, onChange }) {
  if (field.field_type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      >
        <option value="">— optional —</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.field_type === "duration") {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="MM:SS or H:MM:SS"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    );
  }

  if (field.field_type === "number") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {field.unit && <span className="text-sm text-gray-500 shrink-0">{field.unit}</span>}
      </div>
    );
  }

  // text (default)
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  );
}

// ─── Log form ─────────────────────────────────────────────────────────────────

function LogForm({ initial = {}, activities, isEdit = false, onSubmit, onCancel }) {
  const [activityId, setActivityId] = useState(
    String(initial.activity_id ?? (activities[0]?.id ?? ""))
  );
  const [date, setDate] = useState(initial.date ?? today());
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [fieldValues, setFieldValues] = useState({});

  // The selected activity object
  const selectedActivity = activities.find((a) => String(a.id) === String(activityId));
  const activeFields = selectedActivity?.fields ?? [];

  // When editing an existing log, pre-fill field values from existing data
  useEffect(() => {
    const prefill = {};
    if (initial.field_values) {
      for (const fv of initial.field_values) {
        // Only prefill for fields that are still active
        if (activeFields.some((f) => f.id === fv.field_id)) {
          prefill[fv.field_id] = fv.value;
        }
      }
    }
    setFieldValues(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const setFieldValue = (fieldId, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const field_values = activeFields
      .filter((f) => fieldValues[f.id] !== undefined && fieldValues[f.id] !== "")
      .map((f) => ({ field_id: f.id, value: String(fieldValues[f.id]) }));

    const payload = {
      activity_id: Number(activityId),
      notes: notes || null,
      field_values: field_values.length > 0 ? field_values : null,
    };
    if (!isEdit) payload.date = date;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Activity *</label>
        <select
          required
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.points > 0 ? "+" : ""}{a.points} pts)
            </option>
          ))}
        </select>
      </div>
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {activeFields.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          {activeFields.map((f) => (
            <div key={f.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.name}
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <FieldInput
                field={f}
                value={fieldValues[f.id] ?? ""}
                onChange={(val) => setFieldValue(f.id, val)}
              />
            </div>
          ))}
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

// ─── Log page ─────────────────────────────────────────────────────────────────

export default function Log() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: logs = [], isLoading } = useQuery({ queryKey: ["logs"], queryFn: getLogs });
  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: getActivities });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["logs"] });
    qc.invalidateQueries({ queryKey: ["progress-summary"] });
  };

  const createMutation = useMutation({
    mutationFn: createLog,
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLog(id, data),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLog,
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const handleSubmit = (data) => {
    if (modal.mode === "create") createMutation.mutate(data);
    else updateMutation.mutate({ id: modal.log.id, data });
  };

  const noActivities = activities.length === 0;

  const listRef = useRef(null);
  const virtualizer = useWindowVirtualizer({
    count: logs.length,
    estimateSize: () => 72,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <button
          onClick={() => !noActivities && setModal({ mode: "create" })}
          disabled={noActivities}
          title={noActivities ? "Create an activity first" : undefined}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Log Activity
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      {!isLoading && logs.length === 0 && (
        <p className="text-gray-400 text-center py-12">No entries yet. Start logging your activities!</p>
      )}

      <div ref={listRef}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const entry = logs[virtualItem.index];
            return (
              <div
                key={entry.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-4 mb-2">
                  <span
                    className={`text-lg font-bold w-16 text-right tabular-nums shrink-0 mt-0.5 ${
                      entry.points_snapshot >= 0 ? "text-brand-600" : "text-red-500"
                    }`}
                  >
                    {entry.points_snapshot > 0 ? "+" : ""}{entry.points_snapshot}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{entry.activity?.name ?? `Activity #${entry.activity_id}`}</p>
                    <p className="text-xs text-gray-400">{entry.date}</p>
                    {entry.notes && <p className="text-sm text-gray-500 mt-0.5">{entry.notes}</p>}
                    {entry.field_values?.length > 0 && (
                      <dl className="mt-1.5 space-y-0.5">
                        {entry.field_values.map((fv) => (
                          <div key={fv.id} className="flex gap-1.5 text-sm">
                            <dt className="text-gray-400 shrink-0">
                              {fv.field?.name ?? "Unknown field"}
                              {fv.field?.deleted_at && (
                                <span className="text-xs text-gray-300 ml-1">(deleted)</span>
                              )}
                              :
                            </dt>
                            <dd className="text-gray-700">
                              {fv.value}
                              {fv.field?.unit && <span className="text-gray-400 ml-1">{fv.field.unit}</span>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setModal({ mode: "edit", log: entry })} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(entry)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <Modal title={modal.mode === "create" ? "Log Activity" : "Edit Entry"} onClose={() => setModal(null)}>
          <LogForm
            initial={modal.log}
            activities={activities}
            isEdit={modal.mode === "edit"}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Entry"
          message={`Remove this log entry for "${deleteTarget.activity?.name}"?`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
