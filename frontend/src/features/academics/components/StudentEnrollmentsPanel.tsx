import type { FormEvent } from "react";
import Select from "react-select";
import { LoaderCircle, Plus, RefreshCw, Users } from "lucide-react";

import type { StudentEnrollment } from "../api/academic-types";
import { FormField, selectStyles, type Option } from "./academic-ui";
import { AcademicQueryError } from "./AcademicQueryError";

interface StudentEnrollmentsPanelProps {
  yearId: string;
  yearOptions: Option[];
  classId: string;
  classOptions: Option[];
  sectionId: string;
  sectionOptions: Option[];
  canReadYears: boolean;
  canReadClasses: boolean;
  canReadSections: boolean;
  canReadEnrollments: boolean;
  canEnrollStudents: boolean;
  enrollments: StudentEnrollment[];
  enrollmentsLoading: boolean;
  enrollmentsError: string;
  enrollmentsRetrying: boolean;
  onRetryEnrollments: () => void;
  studentsLoading: boolean;
  saving: boolean;
  studentSearch: string;
  onStudentSearchChange: (value: string) => void;
  studentOptions: Option[];
  studentId: string;
  onStudentChange: (studentId: string) => void;
  enrollmentStart: string;
  onEnrollmentStartChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onYearChange: (yearId: string) => void;
  onClassChange: (classId: string) => void;
  onSectionChange: (sectionId: string) => void;
  formatDate: (value: string | null | undefined) => string;
}

export function StudentEnrollmentsPanel({
  yearId,
  yearOptions,
  classId,
  classOptions,
  sectionId,
  sectionOptions,
  canReadYears,
  canReadClasses,
  canReadSections,
  canReadEnrollments,
  canEnrollStudents,
  enrollments,
  enrollmentsLoading,
  enrollmentsError,
  enrollmentsRetrying,
  onRetryEnrollments,
  studentsLoading,
  saving,
  studentSearch,
  onStudentSearchChange,
  studentOptions,
  studentId,
  onStudentChange,
  enrollmentStart,
  onEnrollmentStartChange,
  onSubmit,
  onYearChange,
  onClassChange,
  onSectionChange,
  formatDate,
}: StudentEnrollmentsPanelProps) {
  return (
    <div className="academic-workspace">
      <div className="academic-section-heading">
        <div>
          <h2>Student enrollments</h2>
          <p>Enroll existing students into a section and review its current roster.</p>
        </div>
        <span className="academic-result-count">
          {enrollments.length} enrollment{enrollments.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="academic-selector-row academic-selector-row--three">
        <FormField label="Academic year">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={yearOptions}
            value={yearOptions.find((item) => item.value === yearId) ?? null}
            onChange={(option) => onYearChange(option?.value ?? "")}
            isDisabled={!canReadYears}
            isSearchable
            placeholder="Select academic year"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
        <FormField label="Class">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={classOptions}
            value={classOptions.find((item) => item.value === classId) ?? null}
            onChange={(option) => onClassChange(option?.value ?? "")}
            isDisabled={!yearId || !canReadClasses}
            isSearchable
            placeholder="Select class"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
        <FormField label="Section">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={sectionOptions}
            value={sectionOptions.find((item) => item.value === sectionId) ?? null}
            onChange={(option) => onSectionChange(option?.value ?? "")}
            isDisabled={!classId || !canReadSections}
            isSearchable
            placeholder="Select section"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
      </div>

      {canEnrollStudents && sectionId && (
        <form className="academic-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> Enroll existing student</h3>
          <div className="academic-form-grid academic-form-grid--three">
            <FormField label="Find student">
              <input
                value={studentSearch}
                onChange={(event) => onStudentSearchChange(event.target.value)}
                placeholder="Type at least 2 characters"
                minLength={2}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Student">
              <Select<Option, false>
                classNamePrefix="academic-select"
                options={studentOptions}
                value={studentOptions.find((item) => item.value === studentId) ?? null}
                onChange={(option) => onStudentChange(option?.value ?? "")}
                isLoading={studentsLoading}
                isDisabled={studentSearch.trim().length < 2}
                isSearchable
                placeholder="Select matching student"
                noOptionsMessage={() => studentSearch.trim().length < 2
                  ? "Type at least 2 characters first"
                  : "No active students found"}
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </FormField>
            <FormField label="Enrollment start date">
              <input
                required
                type="date"
                value={enrollmentStart}
                onChange={(event) => onEnrollmentStartChange(event.target.value)}
              />
            </FormField>
          </div>
          <div className="academic-form-actions">
            <button className="academic-primary-button" type="submit" disabled={saving || !studentId}>
              {saving
                ? <LoaderCircle size={16} className="academic-spin" />
                : <Plus size={16} />}
              Enroll student
            </button>
          </div>
        </form>
      )}

      {!sectionId && (
        <div className="academic-inline-message">
          Select an academic year, class, and section to manage enrollments.
        </div>
      )}

      {sectionId && !canReadEnrollments && (
        <div className="academic-inline-message" role="status">
          Viewing the section roster requires ENROLLMENT_READ permission.
        </div>
      )}

      {enrollmentsLoading && (
        <div className="academic-loading" role="status" aria-live="polite">
          <RefreshCw size={19} className="academic-spin" /> Loading enrollments…
        </div>
      )}

      {sectionId && canReadEnrollments && enrollmentsError && (
        <AcademicQueryError
          message={enrollmentsError}
          retrying={enrollmentsRetrying}
          onRetry={onRetryEnrollments}
          retryLabel="student enrollments"
        />
      )}

      {sectionId && canReadEnrollments && !enrollmentsLoading && !enrollmentsError && enrollments.length === 0 && (
        <div className="academic-empty">
          <Users size={27} />
          <strong>No enrollments yet</strong>
          <p>Search for an active student above and enroll them into this section.</p>
        </div>
      )}

      {canReadEnrollments && enrollments.length > 0 && (
        <div className="academic-table-wrap">
          <table className="academic-table">
            <caption className="academic-sr-only">Student enrollments in the selected section</caption>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Admission number</th>
                <th scope="col">Section</th>
                <th scope="col">Start date</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.studentName}</strong></td>
                  <td>{item.admissionNumber || "—"}</td>
                  <td>{item.className} · {item.sectionName}</td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>
                    <span className={`academic-status academic-status--${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
