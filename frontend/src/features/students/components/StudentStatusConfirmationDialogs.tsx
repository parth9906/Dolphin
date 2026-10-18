import { AlertCircle, CheckCircle2, UserX } from "lucide-react";

interface StudentStatusConfirmationDialogsProps {
  fullName: string;
  showActivateConfirm: boolean;
  showDeactivateConfirm: boolean;
  activationError: string;
  deactivationError: string;
  activating: boolean;
  deactivating: boolean;
  onCancelActivate: () => void;
  onConfirmActivate: () => void;
  onCancelDeactivate: () => void;
  onConfirmDeactivate: () => void;
}

export function StudentStatusConfirmationDialogs({
  fullName,
  showActivateConfirm,
  showDeactivateConfirm,
  activationError,
  deactivationError,
  activating,
  deactivating,
  onCancelActivate,
  onConfirmActivate,
  onCancelDeactivate,
  onConfirmDeactivate,
}: StudentStatusConfirmationDialogsProps) {
  return (
    <>
      {showActivateConfirm && (
        <div className="student-confirm-backdrop">
          <section
            className="student-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-activate-title"
            aria-describedby="student-activate-description"
          >
            <div className="student-confirm-dialog__icon" aria-hidden="true">
              <CheckCircle2 size={22} />
            </div>
            <h2 id="student-activate-title">Reactivate this student?</h2>
            <p id="student-activate-description">
              Reactivate <strong>{fullName}</strong>? The student will return
              to active status and appear in active student searches.
            </p>

            {activationError && (
              <p className="student-create-error" role="alert">
                <AlertCircle size={16} />
                {activationError}
              </p>
            )}

            <div className="student-confirm-dialog__actions">
              <button
                type="button"
                className="student-secondary-button"
                disabled={activating}
                onClick={onCancelActivate}
              >
                Cancel
              </button>
              <button
                type="button"
                className="student-primary-button"
                disabled={activating}
                onClick={onConfirmActivate}
              >
                <CheckCircle2 size={16} />
                {activating ? "Reactivating..." : "Confirm reactivation"}
              </button>
            </div>
          </section>
        </div>
      )}

      {showDeactivateConfirm && (
        <div className="student-confirm-backdrop">
          <section
            className="student-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-deactivate-title"
            aria-describedby="student-deactivate-description"
          >
            <div className="student-confirm-dialog__icon" aria-hidden="true">
              <AlertCircle size={22} />
            </div>

            <h2 id="student-deactivate-title">Deactivate this student?</h2>
            <p id="student-deactivate-description">
              You are about to deactivate <strong>{fullName}</strong>.
              The record will no longer appear in active student searches.
              This action does not delete the student's record.
            </p>

            {deactivationError && (
              <p className="student-create-error" role="alert">
                <AlertCircle size={16} />
                {deactivationError}
              </p>
            )}

            <div className="student-confirm-dialog__actions">
              <button
                type="button"
                className="student-secondary-button"
                disabled={deactivating}
                onClick={onCancelDeactivate}
              >
                Cancel
              </button>
              <button
                type="button"
                className="student-danger-button"
                disabled={deactivating}
                onClick={onConfirmDeactivate}
              >
                <UserX size={16} />
                {deactivating ? "Deactivating..." : "Confirm deactivation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
