import Select from "react-select";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

import type {
  StaffAssignmentStatus,
  TeacherAssignment,
} from "../api/staff-types";

interface StatusOption {
  value: StaffAssignmentStatus;
  label: string;
}

interface TeacherAssignmentStatusDialogProps {
  teacher: TeacherAssignment;
  status: StaffAssignmentStatus | "";
  options: StatusOption[];
  saving: boolean;
  onStatusChange: (status: StaffAssignmentStatus | "") => void;
  onClose: () => void;
  onConfirm: () => void;
  displayStatus: (status: StaffAssignmentStatus) => string;
}

export function TeacherAssignmentStatusDialog({
  teacher,
  status,
  options,
  saving,
  onStatusChange,
  onClose,
  onConfirm,
  displayStatus,
}: TeacherAssignmentStatusDialogProps) {
  const selectedOption = options.find((option) => option.value === status) ?? null;

  return (
    <div className="tm-modal-backdrop" role="presentation">
      <section
        className="tm-modal tm-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tm-status-title"
        aria-describedby="tm-status-description"
      >
        <header className="tm-modal-header">
          <div>
            <span className="tm-eyebrow">ASSIGNMENT LIFECYCLE</span>
            <h2 id="tm-status-title">Change assignment status</h2>
            <p id="tm-status-description">
              {teacher.firstName} {teacher.lastName} · {teacher.employeeNumber}
            </p>
          </div>

          <button
            type="button"
            className="tm-close-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close status dialog"
          >
            <X size={19} />
          </button>
        </header>

        <div className="tm-status-dialog-body">
          <div className="tm-current-status">
            <span>Current status</span>
            <strong>{displayStatus(teacher.status)}</strong>
          </div>

          <div className="tm-field">
            <label htmlFor="tm-next-status">New status *</label>
            <Select<StatusOption, false>
              inputId="tm-next-status"
              value={selectedOption}
              options={options}
              onChange={(option) => onStatusChange(option?.value ?? "")}
              isSearchable={false}
              classNamePrefix="tm-select"
              placeholder="Choose a new status"
              isDisabled={saving}
            />
          </div>

          {(status === "INACTIVE" || status === "TERMINATED") && (
            <div className="tm-field-note tm-field-note--warning" role="status">
              <AlertCircle size={16} aria-hidden="true" />
              {status === "TERMINATED"
                ? "Termination is a terminal state. The backend sets the end date when it is not already set."
                : "Inactive assignments cannot be reactivated through this endpoint."}
            </div>
          )}

          <footer className="tm-modal-footer">
            <button
              type="button"
              className="tm-button tm-button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="tm-button tm-button--primary"
              onClick={onConfirm}
              disabled={saving || !status}
            >
              {saving
                ? <LoaderCircle size={16} className="tm-spin" aria-hidden="true" />
                : <CheckCircle2 size={16} aria-hidden="true" />}
              Save status
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
