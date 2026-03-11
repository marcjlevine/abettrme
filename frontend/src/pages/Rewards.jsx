import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Gift } from "lucide-react";
import { getRewards, createReward, updateReward, deleteReward, redeemReward, getProgressSummary } from "../lib/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

function RewardForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name ?? "");
  const [pointsRequired, setPointsRequired] = useState(initial.points_required ?? 10);
  const [notes, setNotes] = useState(initial.notes ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, points_required: Number(pointsRequired), notes: notes || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Points Required *</label>
        <input
          required
          type="number"
          min={1}
          value={pointsRequired}
          onChange={(e) => setPointsRequired(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Links, details, etc."
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

function RedeemDialog({ reward, currentPoints, onConfirm, onCancel }) {
  const [notes, setNotes] = useState("");
  const canAfford = currentPoints >= reward.points_required;

  return (
    <Modal title={`Redeem: ${reward.name}`} onClose={onCancel}>
      <div className="space-y-4">
        <div className={`rounded-lg p-3 text-sm ${canAfford ? "bg-brand-50 text-brand-800" : "bg-red-50 text-red-800"}`}>
          <p>Cost: <strong>{reward.points_required} pts</strong></p>
          <p>Your balance: <strong>{currentPoints} pts</strong></p>
          {!canAfford && <p className="mt-1 font-medium">You don't have enough points for this reward.</p>}
        </div>
        {notes !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes || null)}
            disabled={!canAfford}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Redeem
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Rewards() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [redeemTarget, setRedeemTarget] = useState(null);

  const { data: rewards = [], isLoading } = useQuery({ queryKey: ["rewards"], queryFn: getRewards });
  const { data: summary } = useQuery({ queryKey: ["progress-summary"], queryFn: getProgressSummary });

  const currentPoints = summary?.current_points ?? 0;

  const invalidateRewards = () => qc.invalidateQueries({ queryKey: ["rewards"] });
  const invalidateProgress = () => qc.invalidateQueries({ queryKey: ["progress-summary"] });

  const createMutation = useMutation({
    mutationFn: createReward,
    onSuccess: () => { invalidateRewards(); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateReward(id, data),
    onSuccess: () => { invalidateRewards(); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReward,
    onSuccess: () => { invalidateRewards(); setDeleteTarget(null); },
  });

  const redeemMutation = useMutation({
    mutationFn: ({ id, notes }) => redeemReward(id, { notes }),
    onSuccess: () => { invalidateProgress(); setRedeemTarget(null); },
  });

  const handleSubmit = (data) => {
    if (modal.mode === "create") createMutation.mutate(data);
    else updateMutation.mutate({ id: modal.reward.id, data });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> New Reward
        </button>
      </div>

      {summary && (
        <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-brand-800 text-sm">
          Current balance: <strong>{currentPoints} pts</strong>
        </div>
      )}

      {isLoading && <p className="text-gray-400">Loading...</p>}

      {!isLoading && rewards.length === 0 && (
        <p className="text-gray-400 text-center py-12">No rewards yet. Add something to work towards!</p>
      )}

      <ul className="space-y-2">
        {rewards.map((r) => {
          const canAfford = currentPoints >= r.points_required;
          return (
            <li key={r.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-4">
              <span className={`text-lg font-bold w-16 text-right tabular-nums shrink-0 ${canAfford ? "text-brand-600" : "text-gray-400"}`}>
                {r.points_required} pts
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{r.name}</p>
                {r.notes && <p className="text-sm text-gray-500 whitespace-pre-line mt-0.5">{r.notes}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setRedeemTarget(r)}
                  title="Redeem this reward"
                  className={`p-1.5 rounded transition-colors ${canAfford ? "text-brand-500 hover:text-brand-700" : "text-gray-300 cursor-not-allowed"}`}
                >
                  <Gift size={16} />
                </button>
                <button onClick={() => setModal({ mode: "edit", reward: r })} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
                  <Pencil size={16} />
                </button>
                <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {modal && (
        <Modal title={modal.mode === "create" ? "New Reward" : "Edit Reward"} onClose={() => setModal(null)}>
          <RewardForm initial={modal.reward} onSubmit={handleSubmit} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Reward"
          message={`Delete "${deleteTarget.name}"? Past redemptions will be preserved.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {redeemTarget && (
        <RedeemDialog
          reward={redeemTarget}
          currentPoints={currentPoints}
          onConfirm={(notes) => redeemMutation.mutate({ id: redeemTarget.id, notes })}
          onCancel={() => setRedeemTarget(null)}
        />
      )}
    </div>
  );
}
