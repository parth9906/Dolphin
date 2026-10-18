import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Users,
} from "lucide-react";

import { ApiError } from "../../../lib/api/api-error";
import { useAuth } from "../../../lib/auth/use-auth";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import { academicService } from "../api/academic-service";
import type { AcademicYear } from "../api/academic-types";
import { useAcademicSetupQueries } from "../hooks/use-academic-setup-queries";
import { useAcademicSelectionReconciliation } from "../hooks/use-academic-selection-reconciliation";

import { AcademicOrganizationScopePanel } from "../components/AcademicOrganizationScopePanel";
import { AcademicYearsPanel } from "../components/AcademicYearsPanel";
import { AcademicClassesPanel } from "../components/AcademicClassesPanel";
import { AcademicSectionsPanel } from "../components/AcademicSectionsPanel";
import { StudentEnrollmentsPanel } from "../components/StudentEnrollmentsPanel";

import "./academic-setup-page.css";

type SetupTab = "years" | "classes" | "sections" | "enrollments";

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 403) return "You do not have permission to perform this action.";
    if (error.status === 0) return "The server could not be reached. Check your connection.";
    return error.message;
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export function AcademicSetupPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [organizationSelection, setOrganizationSelection] = useOrganizationSelection();
  const clusterId = organizationSelection.cluster?.id ?? "";
  const institutionId = organizationSelection.institution?.id ?? "";
  const [tab, setTab] = useState<SetupTab>("years");
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [campusId, setCampusId] = useState("");

  const [yearName, setYearName] = useState("");
  const [yearStart, setYearStart] = useState("2026-04-01");
  const [yearEnd, setYearEnd] = useState("2027-03-31");
  const [className, setClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classCode, setClassCode] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [sectionName, setSectionName] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [enrollmentStart, setEnrollmentStart] = useState(today());

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canReadInstitution = hasPermission("INSTITUTION_READ");
  const canReadYears = hasPermission("ACADEMIC_YEAR_READ");
  const canCreateYear = hasPermission("ACADEMIC_YEAR_CREATE");
  const canActivateYear = hasPermission("ACADEMIC_YEAR_ACTIVATE");
  const canCloseYear = hasPermission("ACADEMIC_YEAR_CLOSE");
  const canReadClasses = hasPermission("CLASS_READ");
  const canCreateClass = hasPermission("CLASS_CREATE");
  const canUpdateClass = hasPermission("CLASS_UPDATE");
  const canReadSections = hasPermission("SECTION_READ");
  const canCreateSection = hasPermission("SECTION_CREATE");
  const canReadEnrollments = hasPermission("ENROLLMENT_READ");
  const canEnrollStudents = hasPermission("STUDENT_ENROLL");

  const {
    institutionListQuery,
    singleInstitutionQuery,
    institutionOptions,
    institutionSelectOptions,
    yearsQuery,
    years,
    yearOptions,
    classesQuery,
    classes,
    classOptions,
    sectionsQuery,
    sections,
    sectionOptions,
    campusesQuery,
    campusOptions,
    enrollmentsQuery,
    enrollments,
    studentsQuery,
    studentOptions,
  } = useAcademicSetupQueries({
    clusterId,
    institutionId,
    yearId,
    classId,
    sectionId,
    studentSearch,
    canReadInstitution,
    canReadYears,
    canReadClasses,
    canReadSections,
    canReadEnrollments,
    canEnrollStudents,
  });

  const selectedYear = years.find((item) => item.id === yearId);
  const selectedClass = classes.find((item) => item.id === classId);
  const selectedSection = sections.find((item) => item.id === sectionId);

  useEffect(() => {
    setYearId("");
    setClassId("");
    setSectionId("");
    setCampusId("");
    setStudentId("");
    setStudentSearch("");
    setEditingClassId(null);
    setClassName("");
    setClassCode("");
    setSortOrder("0");
    setErrorMessage("");
    setSuccessMessage("");
  }, [institutionId]);

  useAcademicSelectionReconciliation({
    years,
    yearId,
    setYearId,
    classes,
    classId,
    setClassId,
    sections,
    sectionId,
    setSectionId,
  });

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function resetClassEditor() {
    setEditingClassId(null);
    setClassName("");
    setClassCode("");
    setSortOrder("0");
  }

  function reportMutationError(error: unknown) {
    const message = getErrorMessage(error);
    setErrorMessage(message);

    // A 422 is a business-rule rejection. Explain it in a dialog as well
    // as keeping the persistent inline error banner visible.
    if (error instanceof ApiError && error.status === 422) {
      void Swal.fire({
        icon: "error",
        title: "Action could not be completed",
        text: error.message || "The request conflicts with an academic business rule.",
        confirmButtonText: "Understood",
        confirmButtonColor: "#3157d5",
        customClass: {
          popup: "academic-swal-popup",
          confirmButton: "academic-swal-confirm",
        },
      });
    }
  }

  function changeInstitution(next: string) {
    const institution =
      institutionOptions.find((item) => item.id === next) ??
      (organizationSelection.institution?.id === next
        ? organizationSelection.institution
        : null);
    setOrganizationSelection((current) => ({
      ...current,
      institution,
    }));
    setYearId("");
    setClassId("");
    setSectionId("");
    setCampusId("");
    setStudentId("");
    setStudentSearch("");
    resetClassEditor();
    clearMessages();
  }

  function changeYear(next: string) {
    setYearId(next);
    setClassId("");
    setSectionId("");
    resetClassEditor();
    clearMessages();
  }

  function changeClass(next: string) {
    setClassId(next);
    setSectionId("");
    clearMessages();
  }

  async function submitForm(
    event: FormEvent<HTMLFormElement>,
    action: () => Promise<unknown>,
    success: string,
    refreshKeys: readonly (readonly unknown[])[],
  ) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    clearMessages();
    try {
      await action();
      setSuccessMessage(success);
      await Promise.all(
        refreshKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    } catch (error) {
      reportMutationError(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateYear(event: FormEvent<HTMLFormElement>) {
    await submitForm(
      event,
      async () => {
        if (!canCreateYear) throw new Error("ACADEMIC_YEAR_CREATE permission is required.");
        if (!institutionId) throw new Error("Select an institution first.");
        if (yearEnd <= yearStart) throw new Error("End date must be after start date.");

        await academicService.createAcademicYear({
          institutionId,
          name: yearName.trim(),
          startDate: yearStart,
          endDate: yearEnd,
        });
        setYearName("");
      },
      "Academic year created successfully.",
      [["academics", "years", institutionId]],
    );
  }

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    const isEditing = Boolean(editingClassId);

    await submitForm(
      event,
      async () => {
        if (!yearId) throw new Error("Select an academic year first.");

        const details = {
          name: className.trim(),
          code: classCode.trim(),
          sortOrder: Number(sortOrder),
        };

        if (editingClassId) {
          if (!canUpdateClass) {
            throw new Error("CLASS_UPDATE permission is required.");
          }

          await academicService.updateClass(editingClassId, details);
        } else {
          if (!canCreateClass) {
            throw new Error("CLASS_CREATE permission is required.");
          }

          await academicService.createClass({
            academicYearId: yearId,
            ...details,
          });
        }

        setClassName("");
        setClassCode("");
        setSortOrder("0");
        setEditingClassId(null);
      },
      isEditing ? "Class updated successfully." : "Class created successfully.",
      [["academics", "classes", yearId]],
    );
  }

  async function handleCreateSection(event: FormEvent<HTMLFormElement>) {
    await submitForm(
      event,
      async () => {
        if (!canCreateSection) throw new Error("SECTION_CREATE permission is required.");
        if (!classId) throw new Error("Select a class first.");

        await academicService.createSection({
          schoolClassId: classId,
          campusId: campusId || null,
          name: sectionName.trim(),
          capacity: capacity.trim() ? Number(capacity) : null,
        });
        setSectionName("");
        setCapacity("40");
      },
      "Section created successfully.",
      [["academics", "sections", classId]],
    );
  }

  async function handleEnrollStudent(event: FormEvent<HTMLFormElement>) {
    await submitForm(
      event,
      async () => {
        if (!canEnrollStudents) throw new Error("STUDENT_ENROLL permission is required.");
        if (!sectionId) throw new Error("Select a section first.");
        if (!studentId) throw new Error("Search for and select a student.");

        await academicService.enrollStudent({
          studentId,
          sectionId,
          startDate: enrollmentStart,
        });
        setStudentId("");
        setStudentSearch("");
      },
      "Student enrolled successfully.",
      [
        ["academics", "section-enrollments", sectionId],
        ["academics", "sections", classId],
      ],
    );
  }

  async function handleYearAction(
    year: AcademicYear,
    action: "activate" | "close",
  ) {
    if (saving) return;

    const permission = action === "activate" ? canActivateYear : canCloseYear;
    if (!permission) {
      setErrorMessage(
        action === "activate"
          ? "ACADEMIC_YEAR_ACTIVATE permission is required."
          : "ACADEMIC_YEAR_CLOSE permission is required.",
      );
      return;
    }

    const confirmation = await Swal.fire({
      title: action === "activate" ? "Activate academic year?" : "Close academic year?",
      text: action === "activate"
        ? `Activate ${year.name}? The year will become available for academic setup.`
        : `Close ${year.name}? A closed year may prevent further academic setup changes.`,
      icon: action === "activate" ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: action === "activate" ? "Activate year" : "Close year",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: action === "activate" ? "#3157d5" : "#b42318",
      cancelButtonColor: "#667085",
      customClass: {
        popup: "academic-swal-popup",
        confirmButton: "academic-swal-confirm",
        cancelButton: "academic-swal-cancel",
      },
    });

    if (!confirmation.isConfirmed) return;

    setSaving(true);
    clearMessages();
    try {
      if (action === "activate") await academicService.activateAcademicYear(year.id);
      else await academicService.closeAcademicYear(year.id);

      setSuccessMessage(
        action === "activate"
          ? `${year.name} activated successfully.`
          : `${year.name} closed successfully.`,
      );

      await queryClient.invalidateQueries({
        queryKey: ["academics", "years", institutionId],
      });
    } catch (error) {
      reportMutationError(error);
    } finally {
      setSaving(false);
    }
  }

  const tabs = useMemo(() => [
    {
      id: "years" as const,
      label: "Academic years",
      icon: CalendarDays,
      visible: canReadYears || canCreateYear,
    },
    {
      id: "classes" as const,
      label: "Classes",
      icon: BookOpen,
      visible: canReadClasses || canCreateClass || canUpdateClass,
    },
    {
      id: "sections" as const,
      label: "Sections",
      icon: Layers3,
      visible: canReadSections || canCreateSection,
    },
    {
      id: "enrollments" as const,
      label: "Enrollments",
      icon: Users,
      visible: canReadEnrollments || canEnrollStudents,
    },
  ].filter((item) => item.visible), [
    canReadYears, canCreateYear, canReadClasses, canCreateClass, canUpdateClass,
    canReadSections, canCreateSection, canReadEnrollments, canEnrollStudents,
  ]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((item) => item.id === tab)) {
      setTab(tabs[0].id);
    }
  }, [tabs, tab]);

  const selectedInstitution = institutionOptions.find((item) => item.id === institutionId);

  return (
    <main className="academic-page">
      <header className="academic-page__header">
        <div>
          <p className="academic-eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Academic Setup</h1>
          <p className="academic-subtitle">
            Configure academic years, classes, sections, and student enrollments.
          </p>
        </div>
        <div className="academic-page__icon"><GraduationCap size={25} /></div>
      </header>

      {errorMessage && (
        <div className="academic-alert academic-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {successMessage && (
        <div className="academic-alert academic-alert--success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      <AcademicOrganizationScopePanel
        institutionId={institutionId}
        institutionOptions={institutionSelectOptions}
        institutionName={selectedInstitution?.name ?? singleInstitutionQuery.data?.name ?? "Selected institution"}
        isLoading={institutionListQuery.isLoading || singleInstitutionQuery.isLoading}
        isDisabled={!clusterId || !canReadInstitution || institutionOptions.length === 0}
        institutionError={
          clusterId && institutionListQuery.isError
            ? getErrorMessage(institutionListQuery.error)
            : !clusterId && singleInstitutionQuery.isError
              ? getErrorMessage(singleInstitutionQuery.error)
              : ""
        }
        institutionRetrying={clusterId ? institutionListQuery.isFetching : singleInstitutionQuery.isFetching}
        onRetryInstitution={() => {
          void (clusterId ? institutionListQuery.refetch() : singleInstitutionQuery.refetch());
        }}
        hasCluster={Boolean(clusterId)}
        canReadInstitution={canReadInstitution}
        onInstitutionChange={changeInstitution}
      />

      <section className="academic-panel">
        <div className="academic-tabs" role="tablist" aria-label="Academic setup sections">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`academic-tab${tab === item.id ? " academic-tab--active" : ""}`}
                onClick={() => { setTab(item.id); clearMessages(); }}
              >
                <Icon size={17} />
                {item.label}
                <ChevronRight size={15} className="academic-tab__arrow" />
              </button>
            );
          })}
        </div>

        {tab === "years" && (
          <AcademicYearsPanel
            institutionId={institutionId}
            years={years}
            yearId={yearId}
            canCreateYear={canCreateYear}
            canReadYears={canReadYears}
            canActivateYear={canActivateYear}
            canCloseYear={canCloseYear}
            loading={yearsQuery.isLoading}
            queryError={yearsQuery.isError ? getErrorMessage(yearsQuery.error) : ""}
            retrying={yearsQuery.isFetching}
            onRetry={() => { void yearsQuery.refetch(); }}
            saving={saving}
            yearName={yearName}
            onYearNameChange={setYearName}
            yearStart={yearStart}
            onYearStartChange={setYearStart}
            yearEnd={yearEnd}
            onYearEndChange={setYearEnd}
            onCreateYear={handleCreateYear}
            onSelectYear={(nextYearId) => {
              changeYear(nextYearId);
              setTab("classes");
            }}
            onYearAction={(year, action) => { void handleYearAction(year, action); }}
            formatDate={formatDate}
          />
        )}

        {tab === "classes" && (
          <AcademicClassesPanel
            institutionId={institutionId}
            yearId={yearId}
            yearOptions={yearOptions}
            classes={classes}
            canReadYears={canReadYears}
            canReadClasses={canReadClasses}
            canCreateClass={canCreateClass}
            canUpdateClass={canUpdateClass}
            loading={classesQuery.isLoading}
            queryError={classesQuery.isError ? getErrorMessage(classesQuery.error) : ""}
            retrying={classesQuery.isFetching}
            onRetry={() => { void classesQuery.refetch(); }}
            saving={saving}
            className={className}
            onClassNameChange={setClassName}
            classCode={classCode}
            onClassCodeChange={setClassCode}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            editingClassId={editingClassId}
            onSubmit={handleCreateClass}
            onYearChange={changeYear}
            onCancelEdit={() => {
              setEditingClassId(null);
              setClassName("");
              setClassCode("");
              setSortOrder("0");
              clearMessages();
            }}
            onEditClass={(item) => {
              setEditingClassId(item.id);
              setClassName(item.name);
              setClassCode(item.code);
              setSortOrder(String(item.sortOrder));
              clearMessages();
            }}
            onViewSections={(item) => {
              setClassId(item.id);
              setTab("sections");
              clearMessages();
            }}
          />
        )}

        {tab === "sections" && (
          <AcademicSectionsPanel
            yearId={yearId}
            yearOptions={yearOptions}
            classId={classId}
            classOptions={classOptions}
            sections={sections}
            campuses={campusOptions}
            canReadYears={canReadYears}
            canReadClasses={canReadClasses}
            canReadSections={canReadSections}
            canCreateSection={canCreateSection}
            yearsLoading={yearsQuery.isLoading}
            classesLoading={classesQuery.isLoading}
            sectionsLoading={sectionsQuery.isLoading}
            sectionsError={sectionsQuery.isError ? getErrorMessage(sectionsQuery.error) : ""}
            sectionsRetrying={sectionsQuery.isFetching}
            onRetrySections={() => { void sectionsQuery.refetch(); }}
            campusesLoading={campusesQuery.isLoading}
            campusesError={campusesQuery.isError ? getErrorMessage(campusesQuery.error) : ""}
            campusesRetrying={campusesQuery.isFetching}
            onRetryCampuses={() => { void campusesQuery.refetch(); }}
            saving={saving}
            sectionName={sectionName}
            onSectionNameChange={setSectionName}
            campusId={campusId}
            onCampusChange={setCampusId}
            capacity={capacity}
            onCapacityChange={setCapacity}
            onSubmit={handleCreateSection}
            onYearChange={changeYear}
            onClassChange={changeClass}
            onManageEnrollment={(item) => {
              setSectionId(item.id);
              setTab("enrollments");
              clearMessages();
            }}
          />
        )}

        {tab === "enrollments" && (
          <StudentEnrollmentsPanel
            yearId={yearId}
            yearOptions={yearOptions}
            classId={classId}
            classOptions={classOptions}
            sectionId={sectionId}
            sectionOptions={sectionOptions}
            canReadYears={canReadYears}
            canReadClasses={canReadClasses}
            canReadSections={canReadSections}
            canReadEnrollments={canReadEnrollments}
            canEnrollStudents={canEnrollStudents}
            enrollments={enrollments}
            enrollmentsLoading={enrollmentsQuery.isLoading}
            enrollmentsError={enrollmentsQuery.isError ? getErrorMessage(enrollmentsQuery.error) : ""}
            enrollmentsRetrying={enrollmentsQuery.isFetching}
            onRetryEnrollments={() => { void enrollmentsQuery.refetch(); }}
            studentsLoading={studentsQuery.isLoading}
            saving={saving}
            studentSearch={studentSearch}
            onStudentSearchChange={(value) => {
              setStudentSearch(value);
              setStudentId("");
            }}
            studentOptions={studentOptions}
            studentId={studentId}
            onStudentChange={setStudentId}
            enrollmentStart={enrollmentStart}
            onEnrollmentStartChange={setEnrollmentStart}
            onSubmit={handleEnrollStudent}
            onYearChange={changeYear}
            onClassChange={changeClass}
            onSectionChange={(nextSectionId) => {
              setSectionId(nextSectionId);
              setStudentId("");
              clearMessages();
            }}
            formatDate={formatDate}
          />
        )}
      </section>

      {studentsQuery.isError && (
        <div className="academic-alert academic-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>
            {getErrorMessage(
              studentsQuery.error,
            )}
          </span>
        </div>
      )}

      {saving && (
        <div className="academic-saving-indicator" role="status">
          <LoaderCircle size={15} className="academic-spin" /> Saving changes…
        </div>
      )}

      {selectedYear && selectedClass && selectedSection && (
        <div className="academic-breadcrumb" aria-label="Selected academic structure">
          <span>{selectedYear.name}</span>
          <ChevronRight size={14} />
          <span>{selectedClass.name}</span>
          <ChevronRight size={14} />
          <span>{selectedSection.name}</span>
        </div>
      )}
    </main>
  );
}
