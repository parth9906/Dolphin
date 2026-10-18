import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSelectedInstitutionId } from "../../organization/hooks/organization-selection";
import {
  AlertCircle,
  Check,
  Clock3,
  FileSearch,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { studentService } from "../../students/api/student-service";
import type { Student } from "../../students/api/student-types";
import { useAuth } from "../../../lib/auth/use-auth";
import { disciplineService } from "../api/discipline-service";
import type {
  CreateDisciplineIncidentRequest,
  DisciplineCategory,
  DisciplineIncident,
  DisciplinePage as DisciplinePageResult,
  DisciplineSeverity,
  DisciplineStatus,
} from "../api/discipline-types";
import { DisciplineIncidentRegister } from "../components/DisciplineIncidentRegister";
import { DisciplineIncidentDialogs } from "../components/DisciplineIncidentDialogs";
import { DisciplineIncidentCreateForm } from "../components/DisciplineIncidentCreateForm";
import "./discipline-page.css";

type Option<T extends string> = { value: T; label: string };
type FilterStatus = DisciplineStatus | "ALL";
type FilterSeverity = DisciplineSeverity | "ALL";

const CATEGORY_OPTIONS: Option<DisciplineCategory>[] = [
  { value: "BULLYING", label: "Bullying" },
  { value: "PHYSICAL_AGGRESSION", label: "Physical aggression" },
  { value: "DISRUPTION", label: "Classroom disruption" },
  { value: "DISRESPECT", label: "Disrespect" },
  { value: "ACADEMIC_DISHONESTY", label: "Academic dishonesty" },
  { value: "PROPERTY_DAMAGE", label: "Property damage" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "OTHER", label: "Other" },
];

const SEVERITY_OPTIONS: Option<DisciplineSeverity>[] = [
  { value: "MINOR", label: "Minor" },
  { value: "MODERATE", label: "Moderate" },
  { value: "MAJOR", label: "Major" },
];

const STATUS_OPTIONS: Option<FilterStatus>[] = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const SEVERITY_FILTER_OPTIONS: Option<FilterSeverity>[] = [
  { value: "ALL", label: "All severities" },
  ...SEVERITY_OPTIONS,
];

const ALLOWED_NEXT_STATUSES: Record<DisciplineStatus, DisciplineStatus[]> = {
  OPEN: ["UNDER_REVIEW", "RESOLVED", "CLOSED"],
  UNDER_REVIEW: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};


function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function pretty(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "The request could not be completed. Check your permissions and try again.";
}

function studentLabel(student: Student): string {
  const name = `${student.firstName} ${student.lastName ?? ""}`.trim();
  return `${name} · ${student.admissionNumber}`;
}

export function DisciplinePage() {
  const { hasPermission } = useAuth();
  const institutionId = useSelectedInstitutionId();

  const canRead = hasPermission("DISCIPLINE_INCIDENT_READ");
  const canCreate = hasPermission("DISCIPLINE_INCIDENT_CREATE");
  const canUpdate = hasPermission("DISCIPLINE_INCIDENT_UPDATE");
  const canReadStudents = hasPermission("STUDENT_READ") || canCreate;

  const [incidents, setIncidents] = useState<DisciplineIncident[]>([]);
  const [pageData, setPageData] =
    useState<DisciplinePageResult<DisciplineIncident> | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("ALL");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchText, setSearchText] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
  const [category, setCategory] = useState<DisciplineCategory>("OTHER");
  const [severity, setSeverity] = useState<DisciplineSeverity>("MINOR");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(todayLocal());

  const [detail, setDetail] = useState<DisciplineIncident | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<DisciplineIncident | null>(null);
  const [nextStatus, setNextStatus] = useState<DisciplineStatus | "">("");

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: studentLabel(student),
      })),
    [students],
  );

  const filteredIncidents = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return incidents;
    return incidents.filter((incident) =>
      [
        incident.admissionNumber,
        incident.description,
        incident.category,
        incident.severity,
        incident.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [incidents, searchText]);

  const loadIncidents = useCallback(async () => {
    if (!institutionId || !canRead) {
      setIncidents([]);
      setPageData(null);
      setLoading(false);
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setError("The start of the date range must not be after the end date.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await disciplineService.search({
        institutionId,
        ...(filterStudentId ? { studentId: filterStudentId } : {}),
        ...(filterStatus !== "ALL" ? { status: filterStatus } : {}),
        ...(filterSeverity !== "ALL" ? { severity: filterSeverity } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
        page,
        size: 20,
      });
      setPageData(result);
      setIncidents(result.content ?? []);
    } catch (cause) {
      setError(errorMessage(cause));
      setIncidents([]);
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [
    institutionId,
    canRead,
    filterStudentId,
    filterStatus,
    filterSeverity,
    fromDate,
    toDate,
    page,
  ]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    if (!institutionId || !canReadStudents) {
      setStudents([]);
      return;
    }

    let active = true;
    setStudentsLoading(true);

    studentService
      .searchStudents({
        institutionId,
        page: 0,
        size: 100,
      })
      .then((result) => {
        if (active) {
          setStudents((result.content ?? []).filter((student) => student.active));
        }
      })
      .catch(() => {
        if (active) setStudents([]);
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [institutionId, canReadStudents]);

  const resetCreateForm = () => {
    setNewStudentId("");
    setCategory("OTHER");
    setSeverity("MINOR");
    setDescription("");
    setIncidentDate(todayLocal());
  };

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!institutionId) {
      setError("Select an institution in the organization selector first.");
      return;
    }
    if (!newStudentId) {
      setError("Select a student.");
      return;
    }
    if (!description.trim()) {
      setError("Enter a description for the incident.");
      return;
    }
    if (description.trim().length > 2000) {
      setError("The description must be 2,000 characters or fewer.");
      return;
    }
    if (!incidentDate || incidentDate > todayLocal()) {
      setError("The incident date must be today or earlier.");
      return;
    }

    const request: CreateDisciplineIncidentRequest = {
      institutionId,
      studentId: newStudentId,
      category,
      severity,
      description: description.trim(),
      incidentDate,
    };

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await disciplineService.create(request);
      setNotice("Discipline incident recorded successfully.");
      resetCreateForm();
      setShowCreate(false);
      setFilterStatus("ALL");
      setFilterSeverity("ALL");
      setFilterStudentId("");
      setFromDate("");
      setToDate("");
      setSearchText("");
      setPage(0);
      const refreshed = await disciplineService.search({
        institutionId,
        page: 0,
        size: 20,
      });
      setPageData(refreshed);
      setIncidents(refreshed.content ?? []);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (incident: DisciplineIncident) => {
    setDetailLoading(true);
    setDetail(null);
    setError("");
    try {
      setDetail(await disciplineService.getById(incident.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDetailLoading(false);
    }
  };

  const submitStatusChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!statusTarget || !nextStatus) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const updated = await disciplineService.updateStatus(
        statusTarget.id,
        nextStatus,
      );
      setNotice(`Incident status changed to ${pretty(updated.status)}.`);
      setStatusTarget(null);
      setNextStatus("");
      setDetail((current) =>
        current?.id === updated.id ? updated : current,
      );
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === updated.id ? updated : incident,
        ),
      );
      await loadIncidents();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="discipline-page">
      <header className="discipline-header">
        <div>
          <div className="discipline-eyebrow">
            <ShieldCheck size={15} /> STUDENT WELLBEING
          </div>
          <h1>Discipline &amp; Behavior</h1>
          <p>
            Record incidents, review their progress, and maintain a clear
            institution-scoped record.
          </p>
        </div>
        {canCreate && (
          <button
            className="discipline-button discipline-button--primary"
            onClick={() => {
              setError("");
              setShowCreate((value) => !value);
            }}
          >
            <Plus size={17} />
            {showCreate ? "Close form" : "Record incident"}
          </button>
        )}
      </header>

      {!institutionId && (
        <div className="discipline-alert discipline-alert--warning">
          <AlertCircle size={18} />
          Select an institution from the organization selector before using
          Discipline Management.
        </div>
      )}

      {!canRead && !canCreate && !canUpdate && (
        <div className="discipline-alert discipline-alert--warning">
          <AlertCircle size={18} />
          Your account does not have permission to read, create, or update
          discipline incidents.
        </div>
      )}

      {error && (
        <div className="discipline-alert discipline-alert--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="discipline-alert discipline-alert--success">
          <Check size={18} />
          <span>{notice}</span>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {showCreate && canCreate && (
        <DisciplineIncidentCreateForm
          studentOptions={studentOptions}
          categoryOptions={CATEGORY_OPTIONS}
          severityOptions={SEVERITY_OPTIONS}
          newStudentId={newStudentId}
          category={category}
          severity={severity}
          incidentDate={incidentDate}
          maxIncidentDate={todayLocal()}
          description={description}
          studentsLoading={studentsLoading}
          canReadStudents={canReadStudents}
          saving={saving}
          institutionSelected={Boolean(institutionId)}
          onSubmit={submitCreate}
          onClose={() => setShowCreate(false)}
          onCancel={() => {
            setShowCreate(false);
            resetCreateForm();
          }}
          onStudentChange={setNewStudentId}
          onCategoryChange={setCategory}
          onSeverityChange={setSeverity}
          onIncidentDateChange={setIncidentDate}
          onDescriptionChange={setDescription}
        />
      )}

      <section className="discipline-summary">
        <div className="discipline-summary-card">
          <span className="discipline-summary-icon discipline-summary-icon--blue">
            <FileSearch size={18} />
          </span>
          <div>
            <small>Incidents on page</small>
            <strong>{canRead ? incidents.length : "—"}</strong>
          </div>
        </div>
        <div className="discipline-summary-card">
          <span className="discipline-summary-icon discipline-summary-icon--amber">
            <Clock3 size={18} />
          </span>
          <div>
            <small>Open on page</small>
            <strong>
              {canRead
                ? incidents.filter((item) => item.status === "OPEN").length
                : "—"}
            </strong>
          </div>
        </div>
        <div className="discipline-summary-card">
          <span className="discipline-summary-icon discipline-summary-icon--violet">
            <Users size={18} />
          </span>
          <div>
            <small>Total matching</small>
            <strong>
              {canRead ? (pageData?.totalElements ?? 0) : "—"}
            </strong>
          </div>
        </div>
      </section>

      {canRead && (
        <DisciplineIncidentRegister
          incidents={incidents}
          pageData={pageData}
          page={page}
          loading={loading}
          canUpdate={canUpdate}
          filterStatus={filterStatus}
          filterSeverity={filterSeverity}
          filterStudentId={filterStudentId}
          fromDate={fromDate}
          toDate={toDate}
          searchText={searchText}
          studentsLoading={studentsLoading}
          studentOptions={studentOptions}
          statusOptions={STATUS_OPTIONS}
          severityOptions={SEVERITY_FILTER_OPTIONS}
          onRefresh={() => void loadIncidents()}
          onFilterStatusChange={(value) => { setFilterStatus(value); setPage(0); }}
          onFilterSeverityChange={(value) => { setFilterSeverity(value); setPage(0); }}
          onFilterStudentChange={(value) => { setFilterStudentId(value); setPage(0); }}
          onFromDateChange={(value) => { setFromDate(value); setPage(0); }}
          onToDateChange={(value) => { setToDate(value); setPage(0); }}
          onSearchChange={setSearchText}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => current + 1)}
          onDetails={(incident) => void openDetail(incident)}
          onUpdateStatus={(incident) => { setStatusTarget(incident); setNextStatus(""); }}
          formatDate={formatDate}
          pretty={pretty}
        />
      )}

      <DisciplineIncidentDialogs
        detail={detail}
        detailLoading={detailLoading}
        statusTarget={statusTarget}
        nextStatus={nextStatus}
        saving={saving}
        onCloseDetail={() => setDetail(null)}
        onCloseStatus={() => setStatusTarget(null)}
        onNextStatusChange={setNextStatus}
        onSubmitStatusChange={submitStatusChange}
        allowedNextStatuses={ALLOWED_NEXT_STATUSES}
        pretty={pretty}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
      />
    </main>
  );
}
