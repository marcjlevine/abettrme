import Modal from "./Modal";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Delete", danger = true }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
