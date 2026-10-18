import { CheckCircle2 } from "lucide-react";
import type {
  AdmissionApplication,
  AdmissionApplicationStatus,
} from "../api/admissions-types";

interface AdmissionsApplicationRegisterProps {
  applications: AdmissionApplication[];
  visibleApplications: AdmissionApplication[];
  canUpdate: boolean;
  canEnroll: boolean;
  busy: boolean;
  pageNumber: number;
  totalPages: number;
  totalElements: number;
  isLastPage: boolean;
  isFetching: boolean;
  statusLabels: Record<AdmissionApplicationStatus, string>;
  statusClass: (status: AdmissionApplicationStatus) => string;
  displayDate: (value: string | null | undefined) => string;
  onEdit: (application: AdmissionApplication) => void;
  onReview: (application: AdmissionApplication) => void;
  onEnroll: (application: AdmissionApplication) => void;
  onPageChange: (page: number) => void;
}

export function AdmissionsApplicationRegister({
  applications,
  visibleApplications,
  canUpdate,
  canEnroll,
  busy,
  pageNumber,
  totalPages,
  totalElements,
  isLastPage,
  isFetching,
  statusLabels,
  statusClass,
  displayDate,
  onEdit,
  onReview,
  onEnroll,
  onPageChange,
}: AdmissionsApplicationRegisterProps) {
  if (applications.length === 0) return null;

  return (
    <>
      <div className="admissions-table-wrap">
        <table className="admissions-table">
          <thead>
            <tr>
              <th scope="col">Applicant</th>
              <th scope="col">Applying for</th>
              <th scope="col">Application date</th>
              <th scope="col">Parent / guardian</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleApplications.map((application) => (
              <tr key={application.id}>
                <td>
                  <strong>{application.applicantFirstName} {application.applicantLastName}</strong>
                  <span className="admissions-cell-subtitle">DOB: {displayDate(application.applicantDateOfBirth)}</span>
                </td>
                <td>
                  <strong>{application.className}</strong>
                  <span className="admissions-cell-subtitle">{application.classCode}</span>
                </td>
                <td>{displayDate(application.applicationDate)}</td>
                <td>
                  <strong>{application.parentName || "—"}</strong>
                  <span className="admissions-cell-subtitle">
                    {application.parentPhone || application.parentEmail || "No contact details"}
                  </span>
                </td>
                <td>
                  <span className={statusClass(application.status)}>{statusLabels[application.status]}</span>
                </td>
                <td>
                  <div className="admissions-row-actions">
                    {canUpdate && application.status !== "ENROLLED" && (
                      <>
                        <button
                          type="button"
                          className="admissions-secondary-button"
                          disabled={busy}
                          onClick={() => onEdit(application)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admissions-secondary-button"
                          disabled={busy}
                          onClick={() => onReview(application)}
                        >
                          Review
                        </button>
                      </>
                    )}

                    {canEnroll && application.status === "ACCEPTED" && (
                      <button
                        type="button"
                        className="admissions-primary-button admissions-primary-button--small"
                        disabled={busy}
                        onClick={() => onEnroll(application)}
                      >
                        Enroll
                      </button>
                    )}

                    {application.status === "ENROLLED" && (
                      <span className="admissions-enrolled-link" title={application.enrolledStudentId ?? ""}>
                        <CheckCircle2 size={14} /> Student linked
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {visibleApplications.length === 0 && (
              <tr>
                <td className="admissions-no-filter-results" colSpan={6}>
                  No applications match this search on the current page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="admissions-pagination" aria-label="Application pages">
        <span>
          Page {pageNumber + 1} of {Math.max(1, totalPages)}
          {" · "}{totalElements.toLocaleString()} applications
        </span>
        <div>
          <button
            type="button"
            className="admissions-secondary-button"
            disabled={pageNumber <= 0 || isFetching}
            onClick={() => onPageChange(Math.max(0, pageNumber - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="admissions-secondary-button"
            disabled={isLastPage || isFetching}
            onClick={() => onPageChange(pageNumber + 1)}
          >
            Next
          </button>
        </div>
      </footer>
    </>
  );
}
