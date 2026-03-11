import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { getActivities, createActivity, updateActivity, deleteActivity } from "../lib/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

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

export default function Activities() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // { mode: "create"|"edit", activity?: {} }
  const [deleteTarget, setDeleteTarget] = useState(null);

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
            </div>
            <div className="flex gap-2 shrink-0">
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
    </div>
  );
}
