import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { getLogs, createLog, updateLog, deleteLog, getActivities } from "../lib/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function LogForm({ initial = {}, activities, onSubmit, onCancel }) {
  const [activityId, setActivityId] = useState(initial.activity_id ?? (activities[0]?.id ?? ""));
  const [date, setDate] = useState(initial.date ?? today());
  const [notes, setNotes] = useState(initial.notes ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ activity_id: Number(activityId), date, notes: notes || null });
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
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

      <ul className="space-y-2">
        {logs.map((entry) => (
          <li key={entry.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4">
            <span
              className={`text-lg font-bold w-16 text-right tabular-nums shrink-0 ${
                entry.points_snapshot >= 0 ? "text-brand-600" : "text-red-500"
              }`}
            >
              {entry.points_snapshot > 0 ? "+" : ""}{entry.points_snapshot}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{entry.activity?.name ?? `Activity #${entry.activity_id}`}</p>
              <p className="text-xs text-gray-400">{entry.date}</p>
              {entry.notes && <p className="text-sm text-gray-500 mt-0.5">{entry.notes}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setModal({ mode: "edit", log: entry })} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
                <Pencil size={16} />
              </button>
              <button onClick={() => setDeleteTarget(entry)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {modal && (
        <Modal title={modal.mode === "create" ? "Log Activity" : "Edit Entry"} onClose={() => setModal(null)}>
          <LogForm
            initial={modal.log}
            activities={activities}
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
