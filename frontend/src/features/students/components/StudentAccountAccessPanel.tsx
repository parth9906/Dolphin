import { Link2, UserPlus } from "lucide-react";

import type { StudentAccountLinkDetails } from "../api/student-types";

interface StudentAccountAccessPanelProps {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: StudentAccountLinkDetails | undefined;
  onRetry: () => void;
  canCreateLogin: boolean;
  canLinkExisting: boolean;
  onCreateLogin: () => void;
  onFindExisting: () => void;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function StudentAccountAccessPanel({
  isPending,
  isError,
  isSuccess,
  data,
  onRetry,
  canCreateLogin,
  canLinkExisting,
  onCreateLogin,
  onFindExisting,
}: StudentAccountAccessPanelProps) {
  const linked = isSuccess && data?.linked === true;

  return (
    <section className="student-panel student-account-access-panel">
      <div className="student-panel__header student-account-access-panel__header">
        <div className="student-panel__heading-icon" aria-hidden="true">
          <Link2 size={19} />
        </div>
        <div>
          <h2>Account access</h2>
          <p>User account linked to this student.</p>
        </div>

        <span
          className={`student-status student-account-access-panel__status ${
            linked
              ? "student-status--active"
              : isError
                ? "student-status--inactive"
                : ""
          }`}
        >
          {isPending ? "Loading" : isError ? "Unavailable" : linked ? "Linked" : "Not linked"}
        </span>
      </div>

      {isPending && (
        <div className="student-state" role="status">
          <span className="student-spinner" />
          <p>Loading linked account details...</p>
        </div>
      )}

      {isError && (
        <div className="student-account-link-message" role="alert">
          <p>Unable to load account-link status.</p>
          <button type="button" className="student-secondary-button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {linked && data && (
        <div className="student-detail-grid">
          <div className="student-detail-field">
            <span>Username</span>
            <strong>{data.username || "Not provided"}</strong>
          </div>
          <div className="student-detail-field">
            <span>Email</span>
            <strong>{data.email || "Not provided"}</strong>
          </div>
          <div className="student-detail-field">
            <span>Linked on</span>
            <strong>{formatDateTime(data.createdAt)}</strong>
          </div>
        </div>
      )}

      {isSuccess && data && !data.linked && (
        <div className="student-account-link-message">
          <p>No user account is linked to this student.</p>

          <div className="student-account-link-actions">
            {canCreateLogin && (
              <button type="button" className="student-primary-button" onClick={onCreateLogin}>
                <UserPlus size={16} />
                Create student login
              </button>
            )}

            {canLinkExisting && (
              <button type="button" className="student-secondary-button" onClick={onFindExisting}>
                <Link2 size={16} />
                Find existing account
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
