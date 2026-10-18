import type { ChangeEvent, ReactNode } from "react";
import { LoaderCircle, ShieldCheck, X } from "lucide-react";

import type { AdmissionApplication, AdmissionApplicationStatus } from "../api/admissions-types";

interface AdmissionsReviewPanelProps {
  application: AdmissionApplication;
  reviewStatus: AdmissionApplicationStatus;
  reviewableStatuses: AdmissionApplicationStatus[];
  statusLabels: Record<AdmissionApplicationStatus, string>;
  busy: boolean;
  statusClass: (status: AdmissionApplicationStatus) => string;
  displayDate: (value: string | null | undefined) => string;
  onStatusChange: (status: AdmissionApplicationStatus) => void;
  onSave: () => void;
  onClose: () => void;
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="admissions-field">
      <span>{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

export function AdmissionsReviewPanel({
  application,
  reviewStatus,
  reviewableStatuses,
  statusLabels,
  busy,
  statusClass,
  displayDate,
  onStatusChange,
  onSave,
  onClose,
}: AdmissionsReviewPanelProps) {
  return (
    <section className="admissions-panel admissions-review-panel" aria-labelledby="admissions-review-title">
      <header className="admissions-panel__header">
        <div>
          <h2 id="admissions-review-title">Review application</h2>
          <p>{application.applicantFirstName} {application.applicantLastName} · {application.className}</p>
        </div>
        <button
          type="button"
          className="admissions-icon-button"
          aria-label="Close review panel"
          onClick={onClose}
          disabled={busy}
        >
          <X size={18} />
        </button>
      </header>

      <div className="admissions-review-content">
        <div className="admissions-review-details">
          <div>
            <span>Current status</span>
            <strong className={statusClass(application.status)}>{statusLabels[application.status]}</strong>
          </div>
          <div>
            <span>Application date</span>
            <strong>{displayDate(application.applicationDate)}</strong>
          </div>
          <div>
            <span>Parent / guardian</span>
            <strong>{application.parentName || "—"}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{application.parentPhone || "—"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{application.parentEmail || "—"}</strong>
          </div>
          <div className="admissions-review-notes">
            <span>Notes</span>
            <p>{application.notes || "No notes provided."}</p>
          </div>
        </div>

        <div className="admissions-review-actions">
          <FormField label="Decision / status" required>
            <select
              aria-label="Decision / status"
              value={reviewStatus}
              disabled={busy}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onStatusChange(event.target.value as AdmissionApplicationStatus)}
            >
              {reviewableStatuses.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </FormField>
          <div className="admissions-form-actions">
            <button
              type="button"
              className="admissions-primary-button"
              disabled={busy || reviewStatus === application.status}
              onClick={onSave}
            >
              {busy ? <LoaderCircle size={16} className="admissions-spin" /> : <ShieldCheck size={16} />}
              Save status
            </button>
            <button
              type="button"
              className="admissions-secondary-button"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
          <p className="admissions-help">Enrollment is a separate action available after the application is accepted.</p>
        </div>
      </div>
    </section>
  );
}
