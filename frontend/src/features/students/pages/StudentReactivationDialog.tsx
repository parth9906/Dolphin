import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { Student } from "../api/student-types";

interface StudentReactivationDialogProps {
  student: Student;
  error: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StudentReactivationDialog({
  student,
  error,
  busy,
  onCancel,
  onConfirm,
}: StudentReactivationDialogProps) {
  return (
    <div className="student-confirm-backdrop">
      <section
        className="student-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-reactivate-title"
        aria-describedby="student-reactivate-description"
      >
        <div className="student-confirm-dialog__icon" aria-hidden="true">
          <CheckCircle2 size={22} />
        </div>
        <h2 id="student-reactivate-title">Reactivate this student?</h2>
        <p id="student-reactivate-description">
          Reactivate <strong>{student.firstName} {student.lastName ?? ""}</strong>?
          The student will become active again and will no longer appear in the
          inactive-student list.
        </p>

        {error && (
          <p className="student-create-error" role="alert">
            <AlertCircle size={16} />
            {error}
          </p>
        )}

        <div className="student-confirm-dialog__actions">
          <button
            type="button"
            className="student-secondary-button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="student-primary-button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Reactivating..." : "Confirm reactivation"}
          </button>
        </div>
      </section>
    </div>
  );
}
