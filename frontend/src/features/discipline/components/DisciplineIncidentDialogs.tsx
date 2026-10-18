import type { FormEvent } from "react";
import Select from "react-select";
import { Check, LoaderCircle, X } from "lucide-react";
import type {
  DisciplineIncident,
  DisciplineStatus,
} from "../api/discipline-types";

type StatusTransitions = Record<DisciplineStatus, DisciplineStatus[]>;

interface DisciplineIncidentDialogsProps {
  detail: DisciplineIncident | null;
  detailLoading: boolean;
  statusTarget: DisciplineIncident | null;
  nextStatus: DisciplineStatus | "";
  saving: boolean;
  allowedNextStatuses: StatusTransitions;
  onCloseDetail: () => void;
  onCloseStatus: () => void;
  onNextStatusChange: (status: DisciplineStatus | "") => void;
  onSubmitStatusChange: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  pretty: (value: string) => string;
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
}

export function DisciplineIncidentDialogs({
  detail,
  detailLoading,
  statusTarget,
  nextStatus,
  saving,
  allowedNextStatuses,
  onCloseDetail,
  onCloseStatus,
  onNextStatusChange,
  onSubmitStatusChange,
  pretty,
  formatDate,
  formatDateTime,
}: DisciplineIncidentDialogsProps) {
  return (
    <>
      {detail && (
        <div
          className="discipline-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseDetail();
          }}
        >
          <section className="discipline-dialog" role="dialog" aria-modal="true" aria-labelledby="discipline-detail-title">
            <div className="discipline-panel-heading">
              <div>
                <h2 id="discipline-detail-title">Incident details</h2>
                <p>{detail.admissionNumber || detail.studentId}</p>
              </div>
              <button className="discipline-icon-button" aria-label="Close details" onClick={onCloseDetail}>
                <X size={18} />
              </button>
            </div>
            {detailLoading ? (
              <div className="discipline-state">
                <LoaderCircle className="discipline-spin" size={22} />
                Loading details…
              </div>
            ) : (
              <div className="discipline-detail-body">
                <div className="discipline-detail-grid">
                  <div><small>Category</small><strong>{pretty(detail.category)}</strong></div>
                  <div><small>Severity</small><strong>{pretty(detail.severity)}</strong></div>
                  <div><small>Status</small><strong>{pretty(detail.status)}</strong></div>
                  <div><small>Incident date</small><strong>{formatDate(detail.incidentDate)}</strong></div>
                  <div><small>Campus ID</small><strong>{detail.campusId || "Default student campus"}</strong></div>
                  <div><small>Reported at</small><strong>{formatDateTime(detail.createdAt)}</strong></div>
                </div>
                <div className="discipline-description-block">
                  <small>Description</small>
                  <p>{detail.description}</p>
                </div>
                <div className="discipline-detail-meta"><span>Incident ID</span><code>{detail.id}</code></div>
                <div className="discipline-detail-meta"><span>Reported by user ID</span><code>{detail.reportedByUserId}</code></div>
              </div>
            )}
            <div className="discipline-form-actions">
              <button className="discipline-button discipline-button--quiet" onClick={onCloseDetail}>Close</button>
            </div>
          </section>
        </div>
      )}

      {statusTarget && (
        <div
          className="discipline-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseStatus();
          }}
        >
          <section className="discipline-dialog" role="dialog" aria-modal="true" aria-labelledby="discipline-status-title">
            <div className="discipline-panel-heading">
              <div>
                <h2 id="discipline-status-title">Update incident status</h2>
                <p>Current status: <strong>{pretty(statusTarget.status)}</strong></p>
              </div>
              <button className="discipline-icon-button" aria-label="Close status dialog" onClick={onCloseStatus}>
                <X size={18} />
              </button>
            </div>
            <form className="discipline-dialog-form" onSubmit={onSubmitStatusChange}>
              <label>
                New status
                <Select
                  className="discipline-select"
                  classNamePrefix="discipline-select"
                  options={allowedNextStatuses[statusTarget.status].map((value) => ({ value, label: pretty(value) }))}
                  value={nextStatus ? { value: nextStatus, label: pretty(nextStatus) } : null}
                  onChange={(option) => onNextStatusChange(option?.value ?? "")}
                  isSearchable={false}
                  isClearable
                  placeholder="Select next status"
                />
              </label>
              <p className="discipline-help-text">Status transitions follow the backend workflow. Closed incidents cannot be reopened.</p>
              <div className="discipline-form-actions">
                <button type="button" className="discipline-button discipline-button--quiet" onClick={onCloseStatus}>Cancel</button>
                <button type="submit" className="discipline-button discipline-button--primary" disabled={saving || !nextStatus}>
                  {saving ? <LoaderCircle className="discipline-spin" size={16} /> : <Check size={16} />}
                  Update status
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
