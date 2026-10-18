import { useEffect, useState } from "react";
import { AlertCircle, History, X } from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { userAdministrationService } from "../../users/api/user-administration-service";
import type { UserAccount } from "../../users/api/user-administration-types";
import { assessmentService } from "../api/assessment-service";
import type { StudentMark, StudentMarkAudit } from "../api/assessment-types";

import "./AssessmentMarkAuditDialog.css";

interface AssessmentMarkAuditDialogProps {
  mark: StudentMark;
  onClose: () => void;
}

function displayValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function displayTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function actorName(user: UserAccount): string {
  return [user.firstName, user.lastName]
    .filter((part) => Boolean(part?.trim()))
    .join(" ") || user.username;
}

function ActorDetails({
  user,
  canReadUser,
  loading,
}: {
  user: UserAccount | null | undefined;
  canReadUser: boolean;
  loading: boolean;
}) {
  if (!canReadUser) {
    return (
      <span className="amaudit-actor-unavailable">
        Actor details unavailable — USER_READ permission required
      </span>
    );
  }

  if (loading) {
    return <span className="amaudit-actor-unavailable">Loading user details…</span>;
  }

  if (!user) {
    return (
      <span className="amaudit-actor-unavailable">
        Actor details unavailable
      </span>
    );
  }

  return (
    <>
      <span className="amaudit-actor-name">{actorName(user)}</span>
      <span className="amaudit-actor-email">{user.email}</span>
    </>
  );
}

export function AssessmentMarkAuditDialog({
  mark,
  onClose,
}: AssessmentMarkAuditDialogProps) {
  const { hasPermission } = useAuth();
  const canReadUser = hasPermission("USER_READ");

  const [entries, setEntries] = useState<StudentMarkAudit[]>([]);
  const [actors, setActors] = useState<Record<string, UserAccount | null>>({});
  const [loading, setLoading] = useState(true);
  const [actorsLoading, setActorsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setActorsLoading(false);
      setError("");
      setEntries([]);
      setActors({});

      try {
        const response = await assessmentService.getMarkAudit(mark.markId);
        const auditEntries = response ?? [];

        if (cancelled) return;
        setEntries(auditEntries);

        if (!canReadUser || auditEntries.length === 0) return;

        const uniqueActorIds = [
          ...new Set(auditEntries.map((entry) => entry.changedByUserId)),
        ];

        setActorsLoading(true);

        const actorResults = await Promise.all(
          uniqueActorIds.map(async (userId) => {
            try {
              const user = await userAdministrationService.getUserById(userId);
              return [userId, user] as const;
            } catch {
              // The actor may not be visible to this user under server-side scope rules.
              return [userId, null] as const;
            }
          }),
        );

        if (!cancelled) {
          setActors(Object.fromEntries(actorResults));
        }
      } catch (reason: unknown) {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load the mark audit history.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setActorsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [mark.markId, retryCount, canReadUser]);

  const studentName = [mark.firstName, mark.lastName]
    .filter((part) => Boolean(part?.trim()))
    .join(" ");

  return (
    <div
      className="asm-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="asm-dialog asm-dialog--wide amaudit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asm-audit-title"
      >
        <header className="asm-dialog__header">
          <div>
            <span className="asm-eyebrow">MARKS AUDIT HISTORY</span>
            <h2 id="asm-audit-title">{studentName || mark.admissionNumber}</h2>
            <p>
              {mark.admissionNumber}
              {" · "}Current mark: {displayValue(mark.marksObtained)}
            </p>
          </div>

          <button
            type="button"
            className="asm-icon-button"
            aria-label="Close audit history"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="amaudit-dialog__content">
          {loading ? (
            <div className="asm-loading" role="status">
              <span className="asm-spinner" />
              Loading mark history…
            </div>
          ) : error ? (
            <div className="asm-alert asm-alert--error" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
              <button
                type="button"
                className="asm-text-button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Retry
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="asm-empty">
              <History size={26} />
              <h3>No corrections recorded</h3>
              <p>This mark has no audit entries yet.</p>
            </div>
          ) : (
            <>
              <div className="amaudit-table-view">
                <table className="asm-table amaudit-table">
                  <thead>
                    <tr>
                      <th>Changed at</th>
                      <th>Previous mark</th>
                      <th>New mark</th>
                      <th>Previous remarks</th>
                      <th>New remarks</th>
                      <th>Changed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{displayTimestamp(entry.changedAt)}</td>
                        <td>{displayValue(entry.previousMarks)}</td>
                        <td>{displayValue(entry.newMarks)}</td>
                        <td>{entry.previousRemarks || "—"}</td>
                        <td>{entry.newRemarks || "—"}</td>
                        <td>
                          <ActorDetails
                            user={actors[entry.changedByUserId]}
                            canReadUser={canReadUser}
                            loading={actorsLoading}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="amaudit-cards">
                {entries.map((entry) => (
                  <article className="amaudit-card" key={entry.id}>
                    <div className="amaudit-card__date">
                      {displayTimestamp(entry.changedAt)}
                    </div>

                    <div className="amaudit-card__marks">
                      <div className="amaudit-card__mark">
                        <span className="amaudit-card__label">Previous mark</span>
                        <strong className="amaudit-card__value">
                          {displayValue(entry.previousMarks)}
                        </strong>
                      </div>
                      <div className="amaudit-card__mark">
                        <span className="amaudit-card__label">New mark</span>
                        <strong className="amaudit-card__value">
                          {displayValue(entry.newMarks)}
                        </strong>
                      </div>
                    </div>

                    <div className="amaudit-card__details">
                      <div className="amaudit-card__detail">
                        <span className="amaudit-card__label">Previous remarks</span>
                        <p>{entry.previousRemarks || "—"}</p>
                      </div>
                      <div className="amaudit-card__detail">
                        <span className="amaudit-card__label">New remarks</span>
                        <p>{entry.newRemarks || "—"}</p>
                      </div>
                    </div>

                    <div className="amaudit-card__actor">
                      <span className="amaudit-card__label">Changed by</span>
                      <ActorDetails
                        user={actors[entry.changedByUserId]}
                        canReadUser={canReadUser}
                        loading={actorsLoading}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <footer className="asm-dialog__footer">
          <button
            type="button"
            className="asm-button asm-button--secondary"
            onClick={onClose}
          >
            Close history
          </button>
        </footer>
      </section>
    </div>
  );
}
