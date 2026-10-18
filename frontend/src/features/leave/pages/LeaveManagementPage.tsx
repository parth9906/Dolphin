import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock3,
  FileClock,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { leaveService } from "../api/leave-service";
import type {
  CreateLeaveRequest,
  LeaveAction,
  LeaveAuditEntry,
  LeaveKind,
  LeaveRequest,
  LeaveStatus,
  LeaveTypeOption,
  StaffLookup,
  StudentLookup,
} from "../api/leave-types";
import { useSelectedInstitutionId } from "../../organization/hooks/organization-selection";
import { confirmAction } from "../../../lib/ui/dialogs";
import { LeaveRequestCreateForm } from "../components/LeaveRequestCreateForm";
import "./leave-management-page.css";

const STATUSES: LeaveStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const STATUS_OPTIONS = STATUSES.map((value) => ({ value, label: value }));


function readableDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function readableDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function personName(item: StaffLookup | StudentLookup): string {
  const name = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim();
  if ("employeeNumber" in item) {
    return `${name || "Staff member"}${item.employeeNumber ? ` · ${item.employeeNumber}` : ""}`;
  }
  return `${name || "Student"}${item.admissionNumber ? ` · ${item.admissionNumber}` : ""}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The request could not be completed. Check your permissions and try again.";
}

export function LeaveManagementPage() {
  const institutionId = useSelectedInstitutionId();
  const requestSequence = useRef(0);
  const auditSequence = useRef(0);
  const [kind, setKind] = useState<LeaveKind>("staff");
  const [status, setStatus] = useState<LeaveStatus>("PENDING");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [staff, setStaff] = useState<StaffLookup[]>([]);
  const [students, setStudents] = useState<StudentLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [personId, setPersonId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{
    request: LeaveRequest;
    action: LeaveAction;
  } | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [auditTarget, setAuditTarget] = useState<LeaveRequest | null>(null);
  const [auditEntries, setAuditEntries] = useState<LeaveAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    const sequence = ++requestSequence.current;
    if (!institutionId) {
      setRequests([]);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const page = await leaveService.list(kind, institutionId, status);
      if (sequence === requestSequence.current) {
        setRequests(page.content ?? []);
      }
    } catch (cause) {
      if (sequence === requestSequence.current) {
        setError(errorMessage(cause));
      }
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [institutionId, kind, status]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    auditSequence.current += 1;
    setRequests([]);
    setStaff([]);
    setStudents([]);
    setAuditTarget(null);
    setAuditEntries([]);
    setError("");
    setNotice("");
    setShowCreate(false);
    setReviewTarget(null);
  }, [institutionId]);

  useEffect(() => {
    let active = true;

    setLeaveTypeId("");
    setLeaveTypes([]);

    if (!institutionId) {
      setLeaveTypesLoading(false);
      return () => {
        active = false;
      };
    }

    setLeaveTypesLoading(true);
    leaveService.getLeaveTypes(kind, institutionId)
      .then((items) => {
        if (active) {
          setLeaveTypes(Array.isArray(items) ? items : []);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setLeaveTypes([]);
          setError(errorMessage(cause));
        }
      })
      .finally(() => {
        if (active) setLeaveTypesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [kind, institutionId]);


  useEffect(() => {
    if (!institutionId) return;
    let live = true;
    setPeopleLoading(true);
    Promise.allSettled([
      leaveService.staff(institutionId),
      leaveService.students(institutionId),
    ]).then(([staffResult, studentResult]) => {
      if (!live) return;
      if (staffResult.status === "fulfilled") {
        setStaff((staffResult.value.content ?? []).filter((item) => item.status === "ACTIVE"));
      }
      if (studentResult.status === "fulfilled") {
        setStudents((studentResult.value.content ?? []).filter((item) => item.active !== false));
      }
    }).finally(() => {
      if (live) setPeopleLoading(false);
    });
    return () => {
      live = false;
    };
  }, [institutionId]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((request) => [
      request.id,
      request.leaveTypeName,
      request.leaveTypeCode,
      request.reason,
      request.decisionComment,
      request.staffMemberId,
      request.studentId,
    ].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [requests, search]);

  const resetForm = () => {
    setLeaveTypeId("");
    setPersonId("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!institutionId) {
      setError("Choose an institution in the organization selector first.");
      return;
    }
    if (!personId || !leaveTypeId.trim() || !startDate || !endDate) {
      setError("Complete the person, leave type UUID, and date fields.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (reason.length > 1000) {
      setError("Reason must be 1,000 characters or fewer.");
      return;
    }

    const payload: CreateLeaveRequest = {
      institutionId,
      leaveTypeId: leaveTypeId.trim(),
      startDate,
      endDate,
      reason: reason.trim(),
      ...(kind === "staff" ? { staffMemberId: personId } : { studentId: personId }),
    };

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await leaveService.create(kind, payload);
      setNotice(`${kind === "staff" ? "Staff" : "Student"} leave request created.`);
      resetForm();
      setShowCreate(false);
      setStatus("PENDING");
      await loadRequests();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewTarget || !reviewComment.trim()) {
      setError("A review comment is required.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await leaveService.review(
        kind,
        reviewTarget.request.id,
        reviewTarget.action,
        reviewComment.trim(),
      );
      setNotice(`Leave request ${reviewTarget.action === "approve" ? "approved" : "rejected"}.`);
      setReviewTarget(null);
      setReviewComment("");
      await loadRequests();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const cancelRequest = async (request: LeaveRequest) => {
    if (!(await confirmAction({
      title: "Cancel leave request?",
      text: "Only a pending request can be cancelled.",
      confirmButtonText: "Cancel request",
      cancelButtonText: "Keep request",
    }))) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await leaveService.cancel(kind, request.id);
      setNotice("Leave request cancelled.");
      await loadRequests();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const showAudit = async (request: LeaveRequest) => {
    const sequence = ++auditSequence.current;
    setAuditTarget(request);
    setAuditEntries([]);
    setAuditLoading(true);
    setError("");
    try {
      const entries = await leaveService.audit(kind, request.id);
      if (sequence === auditSequence.current) {
        setAuditEntries(entries);
      }
    } catch (cause) {
      if (sequence === auditSequence.current) {
        setError(errorMessage(cause));
      }
    } finally {
      if (sequence === auditSequence.current) {
        setAuditLoading(false);
      }
    }
  };

  const people = kind === "staff" ? staff : students;
  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes.map((item) => ({
        value: item.id,
        label: item.code ? `${item.name} (${item.code})` : item.name,
      })),
    [leaveTypes],
  );
  const personOptions = useMemo(
    () =>
      people.map((person) => ({
        value: "employeeNumber" in person ? person.staffMemberId : person.id,
        label: personName(person),
      })),
    [people],
  );

  return (
    <main className="leave-page">
      <header className="leave-page__header">
        <div>
          <div className="leave-page__eyebrow"><CalendarDays size={15} /> PEOPLE OPERATIONS</div>
          <h1>Leave management</h1>
          <p>Manage requests, decisions, and the audit trail for your institution.</p>
        </div>
        <button className="leave-button leave-button--primary" onClick={() => {
          setError("");
          setShowCreate((value) => !value);
        }}>
          <Send size={16} /> {showCreate ? "Close form" : "New request"}
        </button>
      </header>

      {!institutionId && (
        <div className="leave-alert leave-alert--warning">
          <AlertCircle size={18} />
          Select an institution from the organization selector before managing leave.
        </div>
      )}
      {error && (
        <div className="leave-alert leave-alert--error">
          <AlertCircle size={18} /><span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}
      {notice && (
        <div className="leave-alert leave-alert--success">
          <Check size={18} /><span>{notice}</span>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16} /></button>
        </div>
      )}

      {showCreate && (
        <LeaveRequestCreateForm
          kind={kind}
          onKindChange={(nextKind) => {
            setKind(nextKind);
            setPersonId("");
          }}
          personOptions={personOptions}
          personId={personId}
          onPersonChange={setPersonId}
          peopleLoading={peopleLoading}
          peopleCount={people.length}
          leaveTypeOptions={leaveTypeOptions}
          leaveTypeId={leaveTypeId}
          onLeaveTypeChange={setLeaveTypeId}
          leaveTypesLoading={leaveTypesLoading}
          leaveTypesCount={leaveTypes.length}
          institutionId={institutionId}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          reason={reason}
          onReasonChange={setReason}
          saving={saving}
          onSubmit={submitCreate}
          onClose={() => setShowCreate(false)}
          onCancel={() => {
            setShowCreate(false);
            resetForm();
          }}
        />
      )}

      <section className="leave-metrics">
        <div className="leave-metric"><span className="leave-metric__icon"><Clock3 size={18} /></span><span><small>Pending shown</small><strong>{status === "PENDING" ? requests.length : "—"}</strong></span></div>
        <div className="leave-metric"><span className="leave-metric__icon"><ShieldCheck size={18} /></span><span><small>Approved shown</small><strong>{status === "APPROVED" ? requests.length : "—"}</strong></span></div>
        <div className="leave-metric"><span className="leave-metric__icon"><UsersRound size={18} /></span><span><small>Request type</small><strong>{kind === "staff" ? "Staff" : "Student"}</strong></span></div>
      </section>

      <section className="leave-panel">
        <div className="leave-toolbar">
          <div className="leave-tabs" role="tablist" aria-label="Leave request type">
            <button role="tab" aria-selected={kind === "staff"} className={kind === "staff" ? "is-active" : ""}
              onClick={() => setKind("staff")}><UserRound size={16} /> Staff leave</button>
            <button role="tab" aria-selected={kind === "student"} className={kind === "student" ? "is-active" : ""}
              onClick={() => setKind("student")}><UsersRound size={16} /> Student leave</button>
          </div>
          <div className="leave-toolbar__filters">
            <label className="leave-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests" /></label>
            <label className="leave-status-filter">
              <span>Status</span>
              <Select
                className="leave-status-select"
                classNamePrefix="leave-select"
                options={STATUS_OPTIONS}
                value={STATUS_OPTIONS.find((option) => option.value === status) ?? null}
                onChange={(option) => {
                  if (option) setStatus(option.value);
                }}
                isSearchable={false}
                isClearable={false}
              />
            </label>
            <button className="leave-icon-button" aria-label="Refresh requests" onClick={() => void loadRequests()} disabled={loading}>
              <RefreshCw size={16} className={loading ? "leave-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="leave-table-wrap">
          <table className="leave-table">
            <thead><tr>
              <th>Request</th><th>Leave type</th><th>Dates</th><th>Reason</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="leave-state"><LoaderCircle className="leave-spin" size={20} /> Loading requests…</div></td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan={6}><div className="leave-state"><FileClock size={24} /><strong>No requests found</strong><span>Try another status or create a request.</span></div></td></tr>
              ) : filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td><strong>{(request.leaveTypeName || (kind === "staff" ? "Staff leave" : "Student leave"))}</strong><small className="leave-id">{(kind === "staff" ? "Staff" : "Student")} ID: {(kind === "staff" ? request.staffMemberId : request.studentId) || "—"}</small></td>
                  <td><span className="leave-type">{request.leaveTypeCode || request.leaveTypeName || request.leaveTypeId}</span></td>
                  <td><strong>{readableDate(request.startDate)}</strong><small>to {readableDate(request.endDate)}</small></td>
                  <td className="leave-reason">{request.reason || "—"}{request.decisionComment && <small>Decision: {request.decisionComment}</small>}</td>
                  <td><span className={`leave-status leave-status--${request.status.toLowerCase()}`}>{request.status}</span></td>
                  <td><div className="leave-row-actions">
                    {request.status === "PENDING" && (
                      <>
                        <button className="leave-icon-button leave-icon-button--approve" title="Approve" aria-label="Approve request"
                          onClick={() => { setReviewTarget({ request, action: "approve" }); setReviewComment(""); }}>
                          <Check size={16} />
                        </button>
                        <button className="leave-icon-button leave-icon-button--reject" title="Reject" aria-label="Reject request"
                          onClick={() => { setReviewTarget({ request, action: "reject" }); setReviewComment(""); }}>
                          <XCircle size={16} />
                        </button>
                        <button className="leave-icon-button" title="Cancel" aria-label="Cancel request" disabled={saving}
                          onClick={() => void cancelRequest(request)}><X size={16} /></button>
                      </>
                    )}
                    <button className="leave-icon-button" title="Audit history" aria-label="View audit history"
                      onClick={() => void showAudit(request)}><FileClock size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="leave-panel__footer">
          <span>Showing {filteredRequests.length} of {requests.length} requests on this page</span>
          <span>Results are scoped to the selected institution.</span>
        </div>
      </section>

      {reviewTarget && (
        <div className="leave-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setReviewTarget(null);
        }}>
          <section className="leave-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-review-title">
            <div className="leave-panel__heading">
              <div><h2 id="leave-review-title">{reviewTarget.action === "approve" ? "Approve request" : "Reject request"}</h2>
                <p>Leave decisions require a comment for the audit trail.</p></div>
              <button className="leave-icon-button" aria-label="Close dialog" onClick={() => setReviewTarget(null)}><X size={18} /></button>
            </div>
            <form onSubmit={submitReview}>
              <label className="leave-dialog__label">Review comment
                <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)}
                  rows={4} maxLength={1000} required placeholder="Explain the decision…" autoFocus />
              </label>
              <div className="leave-form__actions">
                <button type="button" className="leave-button leave-button--quiet" onClick={() => setReviewTarget(null)}>Back</button>
                <button type="submit" className={`leave-button ${reviewTarget.action === "approve" ? "leave-button--primary" : "leave-button--danger"}`} disabled={saving || !reviewComment.trim()}>
                  {saving ? <LoaderCircle className="leave-spin" size={16} /> : reviewTarget.action === "approve" ? <Check size={16} /> : <XCircle size={16} />}
                  Confirm {reviewTarget.action}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {auditTarget && (
        <div className="leave-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAuditTarget(null);
        }}>
          <section className="leave-dialog leave-dialog--audit" role="dialog" aria-modal="true" aria-labelledby="leave-audit-title">
            <div className="leave-panel__heading">
              <div><h2 id="leave-audit-title">Audit history</h2><p>{auditTarget.id}</p></div>
              <button className="leave-icon-button" aria-label="Close audit history" onClick={() => setAuditTarget(null)}><X size={18} /></button>
            </div>
            {auditLoading ? <div className="leave-state"><LoaderCircle className="leave-spin" size={20} /> Loading audit trail…</div>
              : auditEntries.length === 0 ? <div className="leave-state"><FileClock size={22} /><strong>No audit entries returned</strong><span>Check audit-read permission if this is unexpected.</span></div>
              : <div className="leave-audit-list">{auditEntries.map((entry) => (
                <article className="leave-audit-item" key={entry.id}>
                  <div className="leave-audit-item__dot" />
                  <div><strong>{entry.previousStatus ?? "CREATED"} <span>→</span> {entry.newStatus}</strong>
                    <p>{entry.comment || "No comment recorded"}</p>
                    <small>{readableDateTime(entry.changedAt)} · Actor {entry.changedByUserId || "—"}</small>
                  </div>
                </article>
              ))}</div>}
            <div className="leave-form__actions"><button className="leave-button leave-button--quiet" onClick={() => setAuditTarget(null)}>Close</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
