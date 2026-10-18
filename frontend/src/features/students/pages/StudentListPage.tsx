import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RefreshCw,
  Users,
  UserPlus,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { ApiError } from "../../../lib/api/api-error";
import { useInstitutions, useCampuses } from "../../organization/hooks/use-organization";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import { studentKeys, useInactiveStudents, useStudents } from "../hooks/use-students";
import { studentService } from "../api/student-service";
import type { Student, StudentSearchParams } from "../api/student-types";
import { StudentSearchPanel } from "./StudentSearchPanel";
import { StudentReactivationDialog } from "./StudentReactivationDialog";

import "./student-list-page.css";

const PAGE_SIZE = 20;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getStudentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session may have expired. Please sign in again.";
      case 403:
        return "You don't have permission to view students in this institution or campus.";
      case 404:
        return "The selected institution or campus could not be found.";
      case 422:
        return error.message || "The selected organization cannot be used for this search.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please try again."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server couldn't load students. Please try again later."
          : error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "An unexpected error occurred while loading students.";
}

function getActivationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "The activation request could not be processed.";
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "You do not have permission to reactivate this student or access this organization.";
      case 404:
        return "This student could not be found or may already be active.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please retry."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not reactivate the student. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while reactivating the student.";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function StudentListPage() {
  const location = useLocation();
  const navigationState = location.state as
    | {
        deactivatedStudentName?: unknown;
        reactivatedStudentName?: unknown;
      }
    | null;
  const deactivatedStudentName =
    typeof navigationState?.deactivatedStudentName === "string"
      ? navigationState.deactivatedStudentName
      : "";
  const reactivatedStudentName =
    typeof navigationState?.reactivatedStudentName === "string"
      ? navigationState.reactivatedStudentName
      : "";

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [organizationSelection] = useOrganizationSelection();
  const initialSelection = {
    clusterId: organizationSelection.cluster?.id ?? "",
    institutionId: organizationSelection.institution?.id ?? "",
    campusId: "",
  };

  const canReadInstitutions = hasPermission("INSTITUTION_READ");
  const canReadCampuses = hasPermission("CAMPUS_READ");
  const canActivateStudents = hasPermission("STUDENT_ACTIVATE");

  const [institutionId, setInstitutionId] = useState(
    initialSelection.institutionId,
  );
  const [campusId, setCampusId] = useState(initialSelection.campusId);
  const [searchText, setSearchText] = useState("");
  const [formError, setFormError] = useState("");
  const [studentStatus, setStudentStatus] = useState<"active" | "inactive">("active");
  const [studentToActivate, setStudentToActivate] = useState<Student | null>(null);
  const [activatingStudentId, setActivatingStudentId] = useState<string | null>(null);
  const [activationError, setActivationError] = useState("");
  const [activationSuccessMessage, setActivationSuccessMessage] = useState("");

  const institutionsQuery = useInstitutions(
    canReadInstitutions ? initialSelection.clusterId : "",
  );

  const campusesQuery = useCampuses(
    canReadCampuses ? institutionId : "",
  );

  const [filters, setFilters] = useState<StudentSearchParams | null>(() => {
    if (!UUID_PATTERN.test(initialSelection.institutionId)) return null;

    return {
      institutionId: initialSelection.institutionId,
      campusId: UUID_PATTERN.test(initialSelection.campusId)
        ? initialSelection.campusId
        : undefined,
      search: "",
      page: 0,
      size: PAGE_SIZE,
    };
  });

  useEffect(() => {
    setInstitutionId(initialSelection.institutionId);
    setCampusId(initialSelection.campusId);
    setSearchText("");
    setFormError("");
    setFilters(
      UUID_PATTERN.test(initialSelection.institutionId)
        ? {
            institutionId: initialSelection.institutionId,
            campusId: UUID_PATTERN.test(initialSelection.campusId)
              ? initialSelection.campusId
              : undefined,
            search: "",
            page: 0,
            size: PAGE_SIZE,
          }
        : null,
    );
  }, [initialSelection.clusterId, initialSelection.institutionId, initialSelection.campusId]);

  const studentCampusesQuery = useCampuses(
    canReadCampuses ? filters?.institutionId ?? "" : "",
  );

  const activeStudentsQuery = useStudents(filters, studentStatus === "active");
  const inactiveStudentsQuery = useInactiveStudents(
    filters,
    studentStatus === "inactive",
  );
  const studentsQuery =
    studentStatus === "active" ? activeStudentsQuery : inactiveStudentsQuery;
  const page = studentsQuery.data;
  const students = page?.content ?? [];
  const showActivationAction =
    studentStatus === "inactive" && canActivateStudents;

  function changeStudentStatus(nextStatus: "active" | "inactive") {
    setStudentStatus(nextStatus);
    setActivationError("");
    setActivationSuccessMessage("");
    setFormError("");
    setFilters((current) => current ? { ...current, page: 0 } : current);
  }

  async function handleReactivateStudent() {
    const target = studentToActivate;
    if (!target) return;

    if (!hasPermission("STUDENT_ACTIVATE")) {
      setActivationError("Your account does not have STUDENT_ACTIVATE permission.");
      return;
    }

    setActivatingStudentId(target.id);
    setActivationError("");

    try {
      await studentService.activateStudent(target.id);

      setStudentToActivate(null);
      setActivationSuccessMessage(
        `${target.firstName} ${target.lastName ?? ""}`.trim()
        + " was reactivated successfully.",
      );

      // Refresh active/inactive searches so the student leaves the inactive list.
      await queryClient.invalidateQueries({ queryKey: studentKeys.all });
    } catch (error) {
      setActivationError(getActivationErrorMessage(error));
    } finally {
      setActivatingStudentId(null);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!UUID_PATTERN.test(institutionId)) {
      setFormError("Select a valid institution.");
      return;
    }

    if (campusId && !UUID_PATTERN.test(campusId)) {
      setFormError("Select a valid campus or choose All campuses.");
      return;
    }

    setFormError("");
    setFilters({
      institutionId,
      campusId: campusId || undefined,
      search: searchText.trim(),
      page: 0,
      size: PAGE_SIZE,
    });
  }

  function handleInstitutionChange(nextInstitutionId: string) {
    setInstitutionId(nextInstitutionId);
    setCampusId("");
    setFormError("");
  }

  function changePage(nextPage: number) {
    if (!filters || nextPage < 0) return;
    setFilters({ ...filters, page: nextPage });
  }

  return (
    <main className="student-page">
      <header className="student-page__header">
        <div>
          <p className="student-page__eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Students</h1>
          <p className="student-page__subtitle">
            Search and view student records for an institution or campus.
          </p>
        </div>

        {hasPermission("STUDENT_CREATE") && (
          <Link to="/students/new" className="student-primary-button student-create-link">
            <UserPlus size={16} />
            Add student
          </Link>
        )}

        <div className="student-page__header-icon" aria-hidden="true">
          <GraduationCap size={27} />
        </div>
      </header>

      {reactivatedStudentName && (
        <div className="student-update-success" role="status">
          <CheckCircle2 size={17} />
          {reactivatedStudentName} has been reactivated successfully.
        </div>
      )}

      {deactivatedStudentName && (
        <div className="student-update-success" role="status">
          <CheckCircle2 size={17} />
          {deactivatedStudentName} has been deactivated and removed from active
          student searches.
        </div>
      )}

      <StudentSearchPanel
        clusterId={initialSelection.clusterId}
        institutionId={institutionId}
        campusId={campusId}
        searchText={searchText}
        formError={formError}
        canReadInstitutions={canReadInstitutions}
        canReadCampuses={canReadCampuses}
        canReadOrganization={hasPermission("ENTERPRISE_READ")}
        institutions={institutionsQuery.data ?? []}
        campuses={campusesQuery.data ?? []}
        institutionsPending={institutionsQuery.isPending}
        institutionsError={institutionsQuery.isError}
        campusesPending={campusesQuery.isPending}
        campusesError={campusesQuery.isError}
        studentsFetching={studentsQuery.isFetching}
        onInstitutionChange={handleInstitutionChange}
        onCampusChange={(nextCampusId) => {
          setCampusId(nextCampusId);
          setFormError("");
        }}
        onSearchTextChange={setSearchText}
        onSubmit={handleSearch}
      />

      {activationSuccessMessage && (
        <div className="student-update-success" role="status">
          {activationSuccessMessage}
        </div>
      )}

      <section className="student-panel student-results">
        <div className="student-panel__header student-results__header">
          <div className="student-panel__heading-icon" aria-hidden="true">
            <Users size={19} />
          </div>

          <div>
            <h2>Student records</h2>
            <p>
              {page
                ? `${page.totalElements} student${page.totalElements === 1 ? "" : "s"} found`
                : "Search to view student records."}
            </p>
          </div>

          {filters && (
            <span className="student-results__page-size">
              {PAGE_SIZE} per page
            </span>
          )}
        </div>

        <div className="student-status-tabs" role="tablist" aria-label="Student status">
          <button
            type="button"
            role="tab"
            aria-selected={studentStatus === "active"}
            className={`student-status-tab ${
              studentStatus === "active" ? "student-status-tab--selected" : ""
            }`}
            onClick={() => changeStudentStatus("active")}
          >
            Active students
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studentStatus === "inactive"}
            className={`student-status-tab ${
              studentStatus === "inactive" ? "student-status-tab--selected" : ""
            }`}
            onClick={() => changeStudentStatus("inactive")}
          >
            Inactive students
          </button>
        </div>

        {!filters && (
          <div className="student-state">
            <GraduationCap size={30} />
            <h3>Select an institution</h3>
            <p>
              Select a cluster in Organization first, then choose an institution
              from the dropdown. You can optionally filter by campus.
            </p>
          </div>
        )}

        {filters && studentsQuery.isPending && (
          <div className="student-state" role="status">
            <span className="student-spinner" />
            <p>Loading student records...</p>
          </div>
        )}

        {filters && studentsQuery.isError && (
          <div className="student-state student-state--error" role="alert">
            <AlertCircle size={28} />
            <h3>Unable to load students</h3>
            <p>{getStudentErrorMessage(studentsQuery.error)}</p>

            <button
              type="button"
              className="student-secondary-button"
              onClick={() => void studentsQuery.refetch()}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {filters && studentsQuery.isSuccess && (
          <>
            <div className="student-table-wrap">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Admission number</th>
                    <th>Student</th>
                    <th>Institution</th>
                    <th>Campus</th>
                    <th>Date of birth</th>
                    <th>Status</th>
                    {showActivationAction && <th>Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="student-table__admission">
                        {student.admissionNumber}
                      </td>

                      <td>
                        <Link to={`/students/${student.id}`} className="student-table__name student-table__name-link">{student.firstName} {student.lastName ?? ""}</Link>
                      </td>

                      <td>
                        {institutionsQuery.data?.find(
                          (institution) => institution.id === student.institutionId,
                        )?.name ??
                          (institutionsQuery.isPending
                            ? "Loading institution..."
                            : "Institution name unavailable")}
                      </td>

                      <td>
                        {!student.campusId
                          ? "Institution-wide"
                          : !canReadCampuses
                            ? "Campus name unavailable"
                            : studentCampusesQuery.data?.find(
                                (campus) => campus.id === student.campusId,
                              )?.name ??
                              (studentCampusesQuery.isPending
                                ? "Loading campus..."
                                : "Campus name unavailable")}
                      </td>

                      <td>{formatDate(student.dateOfBirth)}</td>

                      <td>
                        <span
                          className={`student-status ${
                            student.active
                              ? "student-status--active"
                              : "student-status--inactive"
                          }`}
                        >
                          {student.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {showActivationAction && (
                        <td className="student-table__action-cell">
                          <button
                            type="button"
                            className="student-reactivate-button"
                            disabled={activatingStudentId === student.id}
                            onClick={() => {
                              setActivationError("");
                              setStudentToActivate(student);
                            }}
                          >
                            {activatingStudentId === student.id
                              ? "Reactivating..."
                              : "Reactivate"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="student-empty-results">
                          <Users size={25} />
                          <strong>No students found</strong>
                          <span>
                            No records match the selected organization and
                            search criteria.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="student-pagination">
              <span>
                Page {page!.number + 1} of {Math.max(page!.totalPages, 1)}
              </span>

              <div className="student-pagination__actions">
                <button
                  type="button"
                  className="student-secondary-button"
                  disabled={page!.first || studentsQuery.isFetching}
                  onClick={() => changePage(page!.number - 1)}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  className="student-secondary-button"
                  disabled={page!.last || studentsQuery.isFetching}
                  onClick={() => changePage(page!.number + 1)}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
      {studentToActivate && (
        <StudentReactivationDialog
          student={studentToActivate}
          error={activationError}
          busy={activatingStudentId !== null}
          onCancel={() => {
            setStudentToActivate(null);
            setActivationError("");
          }}
          onConfirm={() => void handleReactivateStudent()}
        />
      )}

    </main>
  );
}
