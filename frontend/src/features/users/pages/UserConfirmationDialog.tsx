import { AlertCircle, LoaderCircle } from "lucide-react";

import type { PendingConfirmation } from "./user-management-utils";

interface UserConfirmationDialogProps {
  confirmation: PendingConfirmation;
  saving: boolean;
  onCancel: () => void;
}

export function UserConfirmationDialog({
  confirmation,
  saving,
  onCancel,
}: UserConfirmationDialogProps) {
  return (
    <div className="ua-confirm-backdrop" role="presentation">
      <section
        className="ua-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ua-confirm-title"
        aria-describedby="ua-confirm-description"
      >
        <div className="ua-confirm-main">
          <span className="ua-confirm-icon" aria-hidden="true">
            <AlertCircle size={23} />
          </span>

          <div className="ua-confirm-copy">
            <span className="ua-modal-kicker">CONFIRM ACTION</span>
            <h2 id="ua-confirm-title">{confirmation.title}</h2>
            <p id="ua-confirm-description">{confirmation.description}</p>
          </div>
        </div>

        <footer className="ua-confirm-actions">
          <button
            type="button"
            className="ua-button ua-button--secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="ua-button ua-button--danger"
            onClick={() => void confirmation.onConfirm()}
            disabled={saving}
          >
            {saving && <LoaderCircle size={16} className="ua-spin" />}
            {saving ? "Working…" : confirmation.confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
