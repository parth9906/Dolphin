import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { apiClient } from "../../../lib/api/api-client";
import { useAuth } from "../../../lib/auth/use-auth";
import { organizationService } from "../../organization/api/organization-service";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import type { Institution } from "../../organization/api/organization-types";
import type {
  AdmissionApplication,
  AdmissionApplicationStatus,
  AdmissionApplicationSummary,
  AdmissionAcademicYear,
  AdmissionCampus,
  AdmissionSection,
  AdmissionSchoolClass,
  CreateAdmissionApplicationRequest,
  UpdateAdmissionApplicationRequest,
} from "../api/admissions-types";
import { admissionsService } from "../api/admissions-service";
import { AdmissionsApplicationFormPanel, type AdmissionApplicationFormState } from "../components/AdmissionsApplicationFormPanel";
import { AdmissionsReviewPanel } from "../components/AdmissionsReviewPanel";
import { AdmissionsEnrollmentPanel } from "../components/AdmissionsEnrollmentPanel";
import { AdmissionsApplicationRegister } from "../components/AdmissionsApplicationRegister";

import "./admissions-page.css";

const statusLabels: Record<AdmissionApplicationStatus, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WAITLISTED: "Waitlisted",
  ENROLLED: "Enrolled",
};

const reviewableStatuses: AdmissionApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "WAITLISTED",
];

interface ClassBundle {
  academicYearId: string;
  classes: AdmissionSchoolClass[];
}

const EMPTY_CLASS_BUNDLES: ClassBundle[] = [];

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function firstOfMonth(): string {
  const date = new Date();
  date.setDate(1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parts = value.slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function displayCount(value: number | undefined): string {
  return Number(value ?? 0).toLocaleString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function statusClass(status: AdmissionApplicationStatus): string {
  return `admissions-status admissions-status--${status.toLowerCase().replaceAll("_", "-")}`;
}

function emptyForm(defaultYearId = ""): AdmissionApplicationFormState {
  return {
    applicantFirstName: "",
    applicantLastName: "",
    applicantDateOfBirth: "",
    applicationDate: today(),
    campusId: "",
    academicYearId: defaultYearId,
    applyingClassId: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    notes: "",
  };
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

function Message({
  children,
  kind = "info",
}: {
  children: ReactNode;
  kind?: "info" | "error" | "success";
}) {
  const Icon = kind === "error" ? AlertCircle : kind === "success" ? CheckCircle2 : ClipboardList;
  return (
    <div className={`admissions-message admissions-message--${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon size={17} />
      <span>{children}</span>
    </div>
  );
}

export function AdmissionsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [organizationSelection] = useOrganizationSelection();
  const savedSelection = {
    clusterId: organizationSelection.cluster?.id ?? "",
    institutionId: organizationSelection.institution?.id ?? "",
  };

  const canRead = hasPermission("ADMISSION_APPLICATION_READ");
  const canCreate = hasPermission("ADMISSION_APPLICATION_CREATE");
  const canUpdate = hasPermission("ADMISSION_APPLICATION_UPDATE");
  const canEnroll = hasPermission("ADMISSION_APPLICATION_ENROLL");
  const canWork = canRead || canCreate || canUpdate || canEnroll;
  const canReadInstitutions = hasPermission("INSTITUTION_READ");

  const [institutionId, setInstitutionId] = useState(savedSelection.institutionId);
  const [filterCampusId, setFilterCampusId] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdmissionApplicationStatus | "">("");
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<AdmissionApplication | null>(null);
  const [form, setForm] = useState<AdmissionApplicationFormState>(() => emptyForm());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [reviewingApplication, setReviewingApplication] = useState<AdmissionApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<AdmissionApplicationStatus>("UNDER_REVIEW");

  const [enrollingApplication, setEnrollingApplication] = useState<AdmissionApplication | null>(null);
  const [enrollmentSectionId, setEnrollmentSectionId] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState(today);

  const validDateRange = !fromDate || !toDate || fromDate <= toDate;

  useEffect(() => {
    setInstitutionId(savedSelection.institutionId);
    setFilterCampusId("");
    setPage(0);
    setForm(emptyForm());
    setFormOpen(false);
    setEditingApplication(null);
    setReviewingApplication(null);
    setEnrollingApplication(null);
    setEnrollmentSectionId("");
    setAdmissionNumber("");
    setError("");
    setNotice("");
  }, [savedSelection.clusterId, savedSelection.institutionId]);

  const institutionsQuery = useQuery({
    queryKey: ["organization", "institutions", savedSelection.clusterId],
    queryFn: () => organizationService.getInstitutions(savedSelection.clusterId),
    enabled: Boolean(savedSelection.clusterId && canReadInstitutions),
    staleTime: 60_000,
  });

  const fallbackInstitutionQuery = useQuery({
    queryKey: ["organization", "institution", institutionId],
    queryFn: () => organizationService.getInstitution(institutionId),
    enabled: Boolean(institutionId && !savedSelection.clusterId),
    staleTime: 60_000,
  });

  const institutions: Institution[] =
    institutionsQuery.data ??
    (fallbackInstitutionQuery.data ? [fallbackInstitutionQuery.data] : []);

  useEffect(() => {
    if (institutions.length > 0 && !institutions.some((item) => item.id === institutionId)) {
      setInstitutionId(institutions[0].id);
    }
  }, [institutions, institutionId]);

  const campusesQuery = useQuery({
    queryKey: ["admissions", "campuses", institutionId],
    queryFn: () => apiClient.get<AdmissionCampus[]>(
      `campuses/by-institution/${encodeURIComponent(institutionId)}`,
    ),
    enabled: Boolean(institutionId && canWork),
    staleTime: 60_000,
  });

  const campuses = (campusesQuery.data ?? []).filter((campus) => campus.active !== false);

  const yearsQuery = useQuery({
    queryKey: ["admissions", "academic-years", institutionId],
    queryFn: () => apiClient.get<AdmissionAcademicYear[]>(
      `academic/years?institutionId=${encodeURIComponent(institutionId)}`,
    ),
    enabled: Boolean(institutionId && canWork),
    staleTime: 60_000,
  });

  const academicYears = yearsQuery.data ?? [];

  const classesByYearQuery = useQuery({
    queryKey: [
      "admissions",
      "classes-by-year",
      institutionId,
      academicYears.map((year) => year.id).join(","),
    ],
    queryFn: async () => Promise.all(
      academicYears.map(async (year) => ({
        academicYearId: year.id,
        classes: await apiClient.get<AdmissionSchoolClass[]>(
          `academic/years/${encodeURIComponent(year.id)}/classes`,
        ),
      })),
    ),
    enabled: Boolean(institutionId && canWork && academicYears.length > 0),
    staleTime: 30_000,
  });

  const classBundles = classesByYearQuery.data ?? EMPTY_CLASS_BUNDLES;

  const allClasses = useMemo(
    () => classBundles.flatMap((bundle) =>
      bundle.classes.map((item) => ({
        ...item,
        academicYearId: bundle.academicYearId,
      })),
    ),
    [classBundles],
  );

  const classesForFormYear = useMemo(
    () => allClasses.filter(
      (item) => item.academicYearId === form.academicYearId && item.active,
    ),
    [allClasses, form.academicYearId],
  );

  const applicationsQuery = useQuery({
    queryKey: [
      "admissions", "applications", institutionId, filterCampusId,
      statusFilter, fromDate, toDate, page,
    ],
    queryFn: () => admissionsService.search({
      institutionId,
      campusId: filterCampusId || undefined,
      status: statusFilter,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      size: 20,
    }),
    enabled: Boolean(institutionId && canRead && validDateRange),
    staleTime: 15_000,
  });

  const summaryQuery = useQuery({
    queryKey: ["admissions", "summary", institutionId, filterCampusId, fromDate, toDate],
    queryFn: () => admissionsService.summary({
      institutionId,
      campusId: filterCampusId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    enabled: Boolean(institutionId && canRead && validDateRange),
    staleTime: 15_000,
  });

  const enrollmentSectionsQuery = useQuery({
    queryKey: ["admissions", "enrollment-sections", enrollingApplication?.applyingClassId ?? ""],
    queryFn: () => apiClient.get<AdmissionSection[]>(
      `academic/classes/${encodeURIComponent(enrollingApplication!.applyingClassId)}/sections`,
    ),
    enabled: Boolean(enrollingApplication && canEnroll),
    staleTime: 15_000,
  });

  const enrollmentSections = (enrollmentSectionsQuery.data ?? []).filter((section) => section.active);

  useEffect(() => {
    if (formOpen && !form.academicYearId && academicYears.length > 0) {
      const preferred = academicYears.find((year) => year.status.toUpperCase() === "ACTIVE");
      setForm((current) => ({
        ...current,
        academicYearId: (preferred ?? academicYears[0]).id,
      }));
    }
  }, [formOpen, form.academicYearId, academicYears]);

  useEffect(() => {
    if (!formOpen || !form.academicYearId || classesByYearQuery.isLoading) return;

    const currentlyValid = classesForFormYear.some((item) => item.id === form.applyingClassId);
    if (currentlyValid) return;

    const firstClassId = classesForFormYear[0]?.id ?? "";
    if (firstClassId !== form.applyingClassId) {
      setForm((current) => ({
        ...current,
        applyingClassId: firstClassId,
      }));
    }
  }, [
    formOpen,
    form.academicYearId,
    form.applyingClassId,
    classesByYearQuery.isLoading,
    classesForFormYear,
  ]);

  useEffect(() => {
    if (enrollmentSections.length > 0 &&
        !enrollmentSections.some((section) => section.id === enrollmentSectionId)) {
      setEnrollmentSectionId(enrollmentSections[0].id);
    } else if (enrollmentSections.length === 0 && enrollmentSectionId) {
      setEnrollmentSectionId("");
    }
  }, [enrollmentSections, enrollmentSectionId]);

  const response = applicationsQuery.data;
  const applications = response?.content ?? [];

  const visibleApplications = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return applications;
    return applications.filter((application) => [
      application.applicantFirstName,
      application.applicantLastName,
      application.parentName ?? "",
      application.parentPhone ?? "",
      application.parentEmail ?? "",
      application.className,
      application.classCode,
    ].some((value) => value.toLowerCase().includes(term)));
  }, [applications, searchText]);

  const summary: AdmissionApplicationSummary | undefined = summaryQuery.data;

  function clearMessages() {
    setNotice("");
    setError("");
  }

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string,
    afterSuccess?: () => void,
  ) {
    setBusy(true);
    clearMessages();
    try {
      await action();
      afterSuccess?.();
      setNotice(successMessage);
      await queryClient.invalidateQueries({ queryKey: ["admissions"] });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    const defaultYear = academicYears.find((year) => year.status.toUpperCase() === "ACTIVE")
      ?? academicYears[0];
    setEditingApplication(null);
    setForm(emptyForm(defaultYear?.id ?? ""));
  }

  function startCreate() {
    if (!canCreate || !institutionId) return;
    clearMessages();
    setReviewingApplication(null);
    setEnrollingApplication(null);
    resetForm();
    setFormOpen(true);
  }

  function startEdit(application: AdmissionApplication) {
    if (!canUpdate || classesByYearQuery.isLoading) return;
    const schoolClass = allClasses.find((item) => item.id === application.applyingClassId);
    clearMessages();
    setReviewingApplication(null);
    setEnrollingApplication(null);
    setEditingApplication(application);
    setForm({
      applicantFirstName: application.applicantFirstName,
      applicantLastName: application.applicantLastName,
      applicantDateOfBirth: application.applicantDateOfBirth,
      applicationDate: application.applicationDate,
      campusId: application.campusId ?? "",
      academicYearId: schoolClass?.academicYearId ?? "",
      applyingClassId: application.applyingClassId,
      parentName: application.parentName ?? "",
      parentPhone: application.parentPhone ?? "",
      parentEmail: application.parentEmail ?? "",
      notes: application.notes ?? "",
    });
    setFormOpen(true);
  }

  function handleSaveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!institutionId) {
      setError("Select an institution before creating an application.");
      return;
    }
    if (!form.applyingClassId) {
      setError("Select an academic class first.");
      return;
    }

    if (editingApplication) {
      if (!canUpdate) {
        setError("ADMISSION_APPLICATION_UPDATE permission is required.");
        return;
      }

      const request: UpdateAdmissionApplicationRequest = {
        campusId: form.campusId || null,
        applyingClassId: form.applyingClassId,
        parentName: form.parentName.trim() || null,
        parentPhone: form.parentPhone.trim() || null,
        parentEmail: form.parentEmail.trim() || null,
        notes: form.notes.trim() || null,
      };

      void runAction(
        () => admissionsService.update(editingApplication.id, request),
        "Application updated successfully.",
        () => {
          setFormOpen(false);
          resetForm();
        },
      );
      return;
    }

    if (!canCreate) {
      setError("ADMISSION_APPLICATION_CREATE permission is required.");
      return;
    }

    const request: CreateAdmissionApplicationRequest = {
      institutionId,
      campusId: form.campusId || null,
      applyingClassId: form.applyingClassId,
      applicantFirstName: form.applicantFirstName.trim(),
      applicantLastName: form.applicantLastName.trim(),
      applicantDateOfBirth: form.applicantDateOfBirth,
      parentName: form.parentName.trim() || null,
      parentPhone: form.parentPhone.trim() || null,
      parentEmail: form.parentEmail.trim() || null,
      notes: form.notes.trim() || null,
      applicationDate: form.applicationDate || today(),
    };

    void runAction(
      () => admissionsService.create(request),
      "Admission application created successfully.",
      () => {
        setFormOpen(false);
        resetForm();
        setPage(0);
      },
    );
  }

  function startReview(application: AdmissionApplication) {
    if (!canUpdate || application.status === "ENROLLED") return;
    clearMessages();
    setFormOpen(false);
    setEnrollingApplication(null);
    setReviewingApplication(application);
    setReviewStatus(application.status);
  }

  function saveReviewStatus() {
    if (!reviewingApplication || !canUpdate || reviewStatus === "ENROLLED") return;

    void runAction(
      () => admissionsService.updateStatus(reviewingApplication.id, reviewStatus),
      "Application status updated successfully.",
      () => setReviewingApplication(null),
    );
  }

  function startEnrollment(application: AdmissionApplication) {
    if (!canEnroll || application.status !== "ACCEPTED") return;
    clearMessages();
    setFormOpen(false);
    setReviewingApplication(null);
    setEnrollingApplication(application);
    setEnrollmentSectionId("");
    setAdmissionNumber("");
    setEnrollmentStartDate(today());
  }

  function saveEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollingApplication || !canEnroll) return;

    if (!enrollmentSectionId) {
      setError("Select a section before enrolling the applicant.");
      return;
    }

    void runAction(
      () => admissionsService.enroll(enrollingApplication.id, {
        sectionId: enrollmentSectionId,
        admissionNumber: admissionNumber.trim(),
        startDate: enrollmentStartDate,
      }),
      "Applicant enrolled successfully. A student record has been linked to this application.",
      () => {
        setEnrollingApplication(null);
        setEnrollmentSectionId("");
        setAdmissionNumber("");
      },
    );
  }

  function changeInstitution(nextId: string) {
    setInstitutionId(nextId);
    setFilterCampusId("");
    setPage(0);
    clearMessages();
  }

  const activeErrors = [
    campusesQuery.isError ? campusesQuery.error : null,
    yearsQuery.isError ? yearsQuery.error : null,
    classesByYearQuery.isError ? classesByYearQuery.error : null,
  ].filter(Boolean);

  return (
    <main className="admissions-page">
      <header className="admissions-hero">
        <div>
          <p className="admissions-eyebrow">STUDENT INTAKE</p>
          <h1>Admissions Management</h1>
          <p>Track applications from submission through review, acceptance, and enrollment.</p>
        </div>
        <span className="admissions-hero__icon"><GraduationCap size={27} /></span>
      </header>

      {notice && <Message kind="success">{notice}</Message>}
      {error && <Message kind="error">{error}</Message>}

      {!canRead && (
        <Message kind="info">
          Your account can perform only the admission actions allowed by its permissions. Application listings require ADMISSION_APPLICATION_READ.
        </Message>
      )}

      {canRead && (
        <section className="admissions-summary" aria-label="Admission application summary">
          <article className="admissions-summary-card">
            <span className="admissions-summary-card__icon"><ClipboardList size={19} /></span>
            <span className="admissions-summary-card__label">Applied</span>
            <strong>{summaryQuery.isLoading ? "—" : displayCount(summary?.appliedCount)}</strong>
          </article>
          <article className="admissions-summary-card">
            <span className="admissions-summary-card__icon"><Search size={19} /></span>
            <span className="admissions-summary-card__label">Under review</span>
            <strong>{summaryQuery.isLoading ? "—" : displayCount(summary?.underReviewCount)}</strong>
          </article>
          <article className="admissions-summary-card">
            <span className="admissions-summary-card__icon"><CheckCircle2 size={19} /></span>
            <span className="admissions-summary-card__label">Accepted</span>
            <strong>{summaryQuery.isLoading ? "—" : displayCount(summary?.acceptedCount)}</strong>
          </article>
          <article className="admissions-summary-card">
            <span className="admissions-summary-card__icon"><ShieldCheck size={19} /></span>
            <span className="admissions-summary-card__label">Rejected</span>
            <strong>{summaryQuery.isLoading ? "—" : displayCount(summary?.rejectedCount)}</strong>
          </article>
          <article className="admissions-summary-card">
            <span className="admissions-summary-card__icon"><Users size={19} /></span>
            <span className="admissions-summary-card__label">Waitlisted</span>
            <strong>{summaryQuery.isLoading ? "—" : displayCount(summary?.waitlistedCount)}</strong>
          </article>
          <article className="admissions-summary-card">
            <span className="admissions-summary-card__icon"><UserCheck size={19} /></span>
            <span className="admissions-summary-card__label">Enrolled</span>
            <strong>{summaryQuery.isLoading ? "—" : displayCount(summary?.enrolledCount)}</strong>
          </article>
        </section>
      )}

      {summaryQuery.isError && Boolean(summaryQuery.error) && (
        <Message kind="error">{errorMessage(summaryQuery.error)}</Message>
      )}

      <section className="admissions-panel">
        <header className="admissions-panel__header">
          <div>
            <h2>Applications</h2>
            <p>Filter the register and open an application to review it.</p>
          </div>
          {canCreate && (
            <button type="button" className="admissions-primary-button" onClick={startCreate} disabled={!institutionId}>
              <Plus size={16} /> New application
            </button>
          )}
        </header>

        <div className="admissions-filters">
          <FormField label="Institution" required>
            <select
              value={institutionId}
              onChange={(event) => changeInstitution(event.target.value)}
              disabled={!canReadInstitutions && institutions.length <= 1}
            >
              {institutionId && !institutions.some((item) => item.id === institutionId) && (
                <option value={institutionId}>Current institution</option>
              )}
              {institutions.map((item) => (
                <option value={item.id} key={item.id}>{item.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Campus">
            <select
              value={filterCampusId}
              onChange={(event) => { setFilterCampusId(event.target.value); setPage(0); }}
              disabled={!institutionId}
            >
              <option value="">All campuses</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>{campus.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as AdmissionApplicationStatus | "");
                setPage(0);
              }}
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="From date">
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => { setFromDate(event.target.value); setPage(0); }}
            />
          </FormField>

          <FormField label="To date">
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => { setToDate(event.target.value); setPage(0); }}
            />
          </FormField>

          <FormField label="Search current page">
            <div className="admissions-search-input">
              <Search size={15} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Applicant, parent, phone, class…"
              />
            </div>
          </FormField>
        </div>

        {!validDateRange && (
          <div className="admissions-inline-error">The end date must be on or after the start date.</div>
        )}

        {applicationsQuery.isLoading && (
          <div className="admissions-loading">
            <RefreshCw size={18} className="admissions-spin" /> Loading applications…
          </div>
        )}

        {applicationsQuery.isError && Boolean(applicationsQuery.error) && (
          <Message kind="error">{errorMessage(applicationsQuery.error)}</Message>
        )}

        {canRead && !applicationsQuery.isLoading && !applicationsQuery.isError && applications.length === 0 && (
          <div className="admissions-empty">
            <GraduationCap size={27} />
            <strong>No applications found</strong>
            <p>Try changing the filters or create the first application.</p>
          </div>
        )}

        {canRead && applications.length > 0 && (
          <AdmissionsApplicationRegister
            applications={applications}
            visibleApplications={visibleApplications}
            canUpdate={canUpdate}
            canEnroll={canEnroll}
            busy={busy}
            pageNumber={response?.number ?? page}
            totalPages={response?.totalPages ?? 1}
            totalElements={response?.totalElements ?? 0}
            isLastPage={response?.last ?? ((response?.number ?? page) >= (response?.totalPages ?? 1) - 1)}
            isFetching={applicationsQuery.isFetching}
            statusLabels={statusLabels}
            statusClass={statusClass}
            displayDate={displayDate}
            onEdit={startEdit}
            onReview={startReview}
            onEnroll={startEnrollment}
            onPageChange={setPage}
          />
        )}
      </section>

      {formOpen && (
        <AdmissionsApplicationFormPanel
          editingApplication={editingApplication}
          form={form}
          setForm={setForm}
          academicYears={academicYears}
          campuses={campuses}
          classesForFormYear={classesForFormYear}
          classesLoading={classesByYearQuery.isLoading}
          institutionId={institutionId}
          busy={busy}
          maxBirthDate={today()}
          onSubmit={handleSaveApplication}
          onClose={() => { setFormOpen(false); resetForm(); clearMessages(); }}
        />
      )}

      {reviewingApplication && (
        <AdmissionsReviewPanel
          application={reviewingApplication}
          reviewStatus={reviewStatus}
          reviewableStatuses={reviewableStatuses}
          statusLabels={statusLabels}
          busy={busy}
          statusClass={statusClass}
          displayDate={displayDate}
          onStatusChange={setReviewStatus}
          onSave={saveReviewStatus}
          onClose={() => setReviewingApplication(null)}
        />
      )}

      {enrollingApplication && (
        <AdmissionsEnrollmentPanel
          application={enrollingApplication}
          sections={enrollmentSections}
          selectedSectionId={enrollmentSectionId}
          admissionNumber={admissionNumber}
          startDate={enrollmentStartDate}
          busy={busy}
          sectionsLoading={enrollmentSectionsQuery.isLoading}
          sectionsError={enrollmentSectionsQuery.isError ? errorMessage(enrollmentSectionsQuery.error) : ""}
          onSectionChange={setEnrollmentSectionId}
          onAdmissionNumberChange={setAdmissionNumber}
          onStartDateChange={setEnrollmentStartDate}
          onSubmit={saveEnrollment}
          onClose={() => setEnrollingApplication(null)}
        />
      )}

      {activeErrors.map((item, index) => (
        <Message kind="error" key={index}>{errorMessage(item)}</Message>
      ))}
    </main>
  );
}
