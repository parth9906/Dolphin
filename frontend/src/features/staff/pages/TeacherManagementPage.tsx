import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import { staffService } from "../api/staff-service";
import { TeacherOnboardingDialog, type TeacherForm } from "../components/TeacherOnboardingDialog";
import { TeacherAssignmentStatusDialog } from "../components/TeacherAssignmentStatusDialog";
import { TeacherAssignmentsTable } from "../components/TeacherAssignmentsTable";
import { TeacherManagementOverview } from "../components/TeacherManagementOverview";

import type {
  CampusOption,
  StaffAssignmentStatus,
  TeacherAssignment,
  TeacherOnboardingResponse,
} from "../api/staff-types";

import "./teacher-management-page.css";

interface SelectOption {
  value: string;
  label: string;
}

interface StatusOption {
  value: StaffAssignmentStatus;
  label: string;
}

interface SelectedInstitution {
  id: string;
  name: string;
  campusId?: string;
}

interface StatusDialogState {
  teacher: TeacherAssignment;
  status: StaffAssignmentStatus | "";
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "TERMINATED", label: "Terminated" },
];

function localToday(): string {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayStatus(status: StaffAssignmentStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "ON_LEAVE":
      return "On leave";
    case "INACTIVE":
      return "Inactive";
    case "TERMINATED":
      return "Terminated";
  }
}

function getAllowedStatusChanges(
  current: StaffAssignmentStatus,
): StaffAssignmentStatus[] {
  if (current === "ACTIVE") {
    return ["ON_LEAVE", "INACTIVE", "TERMINATED"];
  }

  if (current === "ON_LEAVE") {
    return ["ACTIVE", "INACTIVE", "TERMINATED"];
  }

  // The backend treats INACTIVE and TERMINATED as terminal states.
  return [];
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function resolveSelectedInstitution(
  selected: { id: string; name: string; campusId?: string } | null,
  scopes: { scopeType: string; scopeId: string }[],
): SelectedInstitution | null {
  if (selected?.id) return selected;

  const institutionScope = scopes.find(
    (scope) => scope.scopeType.toUpperCase() === "INSTITUTION" && Boolean(scope.scopeId),
  );

  return institutionScope
    ? { id: institutionScope.scopeId, name: "Accessible institution" }
    : null;
}

const emptyForm = (): TeacherForm => ({
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  employeeNumber: "",
  jobTitle: "",
  startDate: localToday(),
  phone: "",
  campusId: "",
});

function getOnboardingSummary(
  result: TeacherOnboardingResponse,
): string {
  const invitation = result.invitationStatus || "PENDING";
  const expiry = formatDateTime(result.invitationExpiresAt);

  return [
    result.message || "Teacher onboarding completed.",
    `Invitation status: ${invitation}.`,
    expiry ? `Invitation expires: ${expiry}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function TeacherManagementPage() {
  const { accessContext, hasPermission } = useAuth();
  const [organizationSelection] = useOrganizationSelection();

  const canReadStaff = hasPermission("STAFF_READ");
  const canCreateStaff = hasPermission("STAFF_CREATE");
  const canUpdateStaff = hasPermission("STAFF_UPDATE");
  const canReadCampuses = hasPermission("CAMPUS_READ");
  const canCreateInvitations = hasPermission("USER_INVITATION_CREATE");

  const canOnboardTeacher =
    canCreateStaff && canCreateInvitations;

  const institution = useMemo(
    () => resolveSelectedInstitution(
      organizationSelection.institution
        ? {
            id: organizationSelection.institution.id,
            name: organizationSelection.institution.name,
          }
        : null,
      accessContext?.scopes ?? [],
    ),
    [organizationSelection.institution, accessContext?.scopes],
  );

  const [assignments, setAssignments] =
    useState<TeacherAssignment[]>([]);

  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [campusLoadError, setCampusLoadError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StaffAssignmentStatus>("ACTIVE");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [form, setForm] = useState<TeacherForm>(emptyForm);

  const [statusDialog, setStatusDialog] =
    useState<StatusDialogState | null>(null);

  const [lastOnboarded, setLastOnboarded] =
    useState<TeacherOnboardingResponse | null>(null);

  const campusOptions = useMemo<SelectOption[]>(
    () => campuses.map((campus) => ({
      value: campus.id,
      label: campus.name,
    })),
    [campuses],
  );

  const selectedCampus = campusOptions.find(
    (option) => option.value === form.campusId,
  ) ?? null;

  const statusFilterOptions = useMemo(
    () => STATUS_OPTIONS,
    [],
  );

  const selectedStatus =
    statusFilterOptions.find(
      (option) => option.value === statusFilter,
    ) ?? null;

  const statusDialogOptions = useMemo<StatusOption[]>(() => {
    if (!statusDialog) {
      return [];
    }

    return getAllowedStatusChanges(statusDialog.teacher.status)
      .map((status) => ({
        value: status,
        label: displayStatus(status),
      }));
  }, [statusDialog]);


  useEffect(() => {
    let mounted = true;

    async function loadCampuses() {
      setCampuses([]);
      setCampusLoadError("");

      if (!institution?.id || !canReadCampuses) {
        return;
      }

      try {
        const response =
          await staffService.getCampuses(institution.id);

        if (!mounted) {
          return;
        }

        const activeCampuses = response.filter(
          (campus) => campus.active,
        );

        setCampuses(activeCampuses);

        const preferredCampus = institution.campusId
          ? activeCampuses.find(
              (campus) => campus.id === institution.campusId,
            )
          : undefined;

        if (preferredCampus) {
          setForm((current) => ({
            ...current,
            campusId: current.campusId || preferredCampus.id,
          }));
        }
      } catch (cause) {
        if (mounted) {
          setCampusLoadError(errorText(cause));
        }
      }
    }

    void loadCampuses();

    return () => {
      mounted = false;
    };
  }, [institution, canReadCampuses]);

  useEffect(() => {
    let mounted = true;

    async function loadAssignments() {
      if (!canReadStaff || !institution?.id) {
        setAssignments([]);
        setTotalElements(0);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await staffService.getAssignments(
          institution.id,
          statusFilter,
          page,
          PAGE_SIZE,
        );

        if (!mounted) {
          return;
        }

        setAssignments(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setTotalPages(response.totalPages ?? 0);
      } catch (cause) {
        if (mounted) {
          setAssignments([]);
          setTotalElements(0);
          setTotalPages(0);
          setError(errorText(cause));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadAssignments();

    return () => {
      mounted = false;
    };
  }, [
    institution,
    canReadStaff,
    statusFilter,
    page,
    refreshKey,
  ]);

  function openOnboarding() {
    setError("");
    setNotice("");

    setForm({
      ...emptyForm(),
      campusId: institution?.campusId ?? "",
    });

    setOnboardingOpen(true);
  }

  function closeOnboarding() {
    if (saving) {
      return;
    }

    setOnboardingOpen(false);
  }

  async function submitOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!institution?.id) {
      setError("Select an institution before onboarding a teacher.");
      return;
    }

    if (!canCreateStaff || !canCreateInvitations) {
      setError(
        "Teacher onboarding requires both STAFF_CREATE and USER_INVITATION_CREATE permissions.",
      );
      return;
    }

    if (form.startDate > localToday()) {
      setError("The start date cannot be in the future.");
      return;
    }

    const selectedCampusId = form.campusId || undefined;

    if (
      selectedCampusId
      && !campuses.some((campus) => campus.id === selectedCampusId)
    ) {
      setError("Choose an active campus from the selected institution.");
      return;
    }

    setSaving(true);

    try {
      const result = await staffService.onboardTeacher({
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        institutionId: institution.id,
        campusId: selectedCampusId,
        employeeNumber: form.employeeNumber.trim(),
        jobTitle: form.jobTitle.trim(),
        startDate: form.startDate,
        phone: form.phone.trim() || undefined,
      });

      setLastOnboarded(result);
      setNotice(getOnboardingSummary(result));
      setOnboardingOpen(false);
      setForm(emptyForm());
      setPage(0);
      setStatusFilter("ACTIVE");
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusDialog || !statusDialog.status) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const { teacher, status } = statusDialog;

    try {
      await staffService.updateAssignmentStatus(
        teacher.assignmentId,
        status,
      );

      setNotice(
        `${teacher.firstName} ${teacher.lastName}: status changed to ${displayStatus(status)}.`,
      );

      setStatusDialog(null);
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setError(errorText(cause));
      setStatusDialog(null);
    } finally {
      setSaving(false);
    }
  }

  function closeStatusDialog() {
    if (!saving) {
      setStatusDialog(null);
    }
  }

  return (
    <div className="tm-page">
      <header className="tm-page-header">
        <div>
          <div className="tm-eyebrow">PEOPLE & ACCESS</div>
          <h1>Teacher Management</h1>
          <p>
            Onboard teachers, send account invitations, and manage staff
            assignment status.
          </p>
        </div>

        <div className="tm-header-actions">
          {canReadStaff && (
            <button
              type="button"
              className="tm-button tm-button--secondary"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}

          {canOnboardTeacher && (
            <button
              type="button"
              className="tm-button tm-button--primary"
              onClick={openOnboarding}
              disabled={!institution?.id}
              title={
                !institution?.id
                  ? "Select an institution first"
                  : "Onboard a teacher"
              }
            >
              <UserPlus size={17} />
              Onboard teacher
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="tm-alert tm-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="tm-alert tm-alert--success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <TeacherManagementOverview
        institution={institution ? { name: institution.name } : null}
        canReadStaff={canReadStaff}
        matchingAssignments={totalElements}
        activeAssignmentsOnPage={
          canReadStaff
            ? assignments.filter((assignment) => assignment.status === "ACTIVE").length
            : null
        }
        assignmentStatusLabel={STATUS_OPTIONS.find(
          (option) => option.value === statusFilter,
        )?.label ?? "Active"}
        onboardingResult={lastOnboarded ? {
          username: lastOnboarded.username,
          roleCode: lastOnboarded.roleCode,
          staffStatusLabel: displayStatus(
            lastOnboarded.staffStatus as StaffAssignmentStatus,
          ),
          summary: getOnboardingSummary(lastOnboarded),
        } : null}
        onDismissOnboardingResult={() => setLastOnboarded(null)}
      />

      {institution && (
        canReadStaff ? (
          <TeacherAssignmentsTable
            assignments={assignments}
            campuses={campuses}
            loading={loading}
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            statusOptions={statusFilterOptions}
            selectedStatus={selectedStatus}
            canUpdateStaff={canUpdateStaff}
            canOnboardTeacher={canOnboardTeacher}
            formatDate={formatDate}
            displayStatus={displayStatus}
            getAllowedStatusChanges={getAllowedStatusChanges}
            onStatusFilterChange={(status) => {
              setStatusFilter(status);
              setPage(0);
            }}
            onOpenOnboarding={openOnboarding}
            onOpenStatusDialog={(teacher) => setStatusDialog({ teacher, status: "" })}
            onPreviousPage={() => setPage((current) => Math.max(0, current - 1))}
            onNextPage={() => setPage((current) => (
              totalPages > 0 ? Math.min(totalPages - 1, current + 1) : current
            ))}
          />
        ) : (
          <section className="tm-empty-state">
            <Users size={30} />
            <h2>Staff directory access is not enabled</h2>
            <p>
              You can onboard a teacher if you have both required creation
              permissions. Reading existing assignments requires STAFF_READ.
            </p>

            {canOnboardTeacher && (
              <button
                type="button"
                className="tm-button tm-button--primary"
                onClick={openOnboarding}
              >
                <UserPlus size={17} />
                Onboard teacher
              </button>
            )}
          </section>
        )
      )}

      <TeacherOnboardingDialog
        open={onboardingOpen}
        institution={institution}
        canReadCampuses={canReadCampuses}
        canOnboardTeacher={canOnboardTeacher}
        campusOptions={campusOptions}
        selectedCampus={selectedCampus}
        campusLoadError={campusLoadError}
        form={form}
        setForm={setForm}
        saving={saving}
        onClose={closeOnboarding}
        onSubmit={submitOnboarding}
        today={localToday}
      />

      {statusDialog && (
        <TeacherAssignmentStatusDialog
          teacher={statusDialog.teacher}
          status={statusDialog.status}
          options={statusDialogOptions}
          saving={saving}
          onStatusChange={(status) =>
            setStatusDialog((current) =>
              current ? { ...current, status } : current,
            )
          }
          onClose={closeStatusDialog}
          onConfirm={() => void confirmStatusChange()}
          displayStatus={displayStatus}
        />
      )}
    </div>
  );
}
