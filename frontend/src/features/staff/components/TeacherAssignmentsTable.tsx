import Select from "react-select";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Users,
} from "lucide-react";

import type {
  CampusOption,
  StaffAssignmentStatus,
  TeacherAssignment,
} from "../api/staff-types";

interface SelectOption {
  value: string;
  label: string;
}

interface TeacherAssignmentsTableProps {
  assignments: TeacherAssignment[];
  campuses: CampusOption[];
  loading: boolean;
  totalElements: number;
  totalPages: number;
  page: number;
  statusOptions: SelectOption[];
  selectedStatus: SelectOption | null;
  canUpdateStaff: boolean;
  canOnboardTeacher: boolean;
  formatDate: (value: string | null | undefined) => string;
  displayStatus: (status: StaffAssignmentStatus) => string;
  getAllowedStatusChanges: (status: StaffAssignmentStatus) => StaffAssignmentStatus[];
  onStatusFilterChange: (status: StaffAssignmentStatus) => void;
  onOpenOnboarding: () => void;
  onOpenStatusDialog: (teacher: TeacherAssignment) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function TeacherAssignmentsTable({
  assignments,
  campuses,
  loading,
  totalElements,
  totalPages,
  page,
  statusOptions,
  selectedStatus,
  canUpdateStaff,
  canOnboardTeacher,
  formatDate,
  displayStatus,
  getAllowedStatusChanges,
  onStatusFilterChange,
  onOpenOnboarding,
  onOpenStatusDialog,
  onPreviousPage,
  onNextPage,
}: TeacherAssignmentsTableProps) {
  return (
    <section className="tm-table-card">
      <div className="tm-table-toolbar">
        <div>
          <h2>Staff assignments</h2>
          <p>View teacher profiles and manage assignment statuses.</p>
        </div>

        <div className="tm-status-filter">
          <label htmlFor="tm-status-filter">Status</label>
          <Select<SelectOption, false>
            inputId="tm-status-filter"
            value={selectedStatus}
            options={statusOptions}
            onChange={(option) => {
              if (option) {
                onStatusFilterChange(option.value as StaffAssignmentStatus);
              }
            }}
            isSearchable={false}
            classNamePrefix="tm-select"
          />
        </div>
      </div>

      <div className="tm-table-wrap">
        <table className="tm-table">
          <caption className="tm-sr-only">Teacher staff assignments</caption>
          <thead>
            <tr>
              <th scope="col">Teacher</th>
              <th scope="col">Employee no.</th>
              <th scope="col">Campus</th>
              <th scope="col">Start date</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {assignments.map((teacher) => {
              const allowed = getAllowedStatusChanges(teacher.status);
              const campus = campuses.find((item) => item.id === teacher.campusId);

              return (
                <tr key={teacher.assignmentId}>
                  <td>
                    <div className="tm-teacher-cell">
                      <span className="tm-avatar">
                        {(teacher.firstName || teacher.employeeNumber).charAt(0).toUpperCase()}
                      </span>
                      <div className="tm-teacher-copy">
                        <strong>
                          {[teacher.firstName, teacher.lastName].filter(Boolean).join(" ")}
                        </strong>
                        <span>{teacher.jobTitle}</span>
                        <span className="tm-teacher-email">
                          {teacher.email || "No email provided"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="tm-employee-number">{teacher.employeeNumber}</td>
                  <td>{campus?.name ?? (teacher.campusId ? "Campus" : "All campuses")}</td>
                  <td>{formatDate(teacher.startDate)}</td>
                  <td>
                    <span
                      className={`tm-status-badge tm-status-badge--${teacher.status.toLowerCase().replace("_", "-")}`}
                    >
                      <span />
                      {displayStatus(teacher.status)}
                    </span>
                  </td>
                  <td>
                    {canUpdateStaff && allowed.length > 0 ? (
                      <button
                        type="button"
                        className="tm-action-button"
                        onClick={() => onOpenStatusDialog(teacher)}
                      >
                        Change status
                        <ArrowUpRight size={14} />
                      </button>
                    ) : (
                      <span className="tm-no-action">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && assignments.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="tm-table-empty">
                    <Users size={28} />
                    <strong>No assignments found</strong>
                    <span>
                      No staff assignments match this status filter for the selected institution.
                    </span>
                    {canOnboardTeacher && (
                      <button
                        type="button"
                        className="tm-button tm-button--primary"
                        onClick={onOpenOnboarding}
                      >
                        <Plus size={16} />
                        Onboard first teacher
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="tm-pagination" aria-label="Staff assignment pagination">
        <span>
          {totalElements} assignment{totalElements === 1 ? "" : "s"}
          {" · "}Page {Math.min(page + 1, Math.max(totalPages, 1))}
          {" of "}{Math.max(totalPages, 1)}
        </span>

        <div>
          <button
            type="button"
            className="tm-page-button"
            onClick={onPreviousPage}
            disabled={loading || page === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            type="button"
            className="tm-page-button"
            onClick={onNextPage}
            disabled={loading || totalPages <= 1 || page >= totalPages - 1}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {loading && (
        <div className="tm-loading-overlay" role="status" aria-live="polite">
          <LoaderCircle size={20} className="tm-spin" />
          <span>Loading assignments…</span>
        </div>
      )}
    </section>
  );
}
