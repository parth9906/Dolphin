import { CalendarDays, GraduationCap, UserRound } from "lucide-react";

import type { Student } from "../api/student-types";

interface StudentProfileSectionsProps {
  student: Student;
  canReadInstitutions: boolean;
  canReadCampuses: boolean;
  institutionName?: string;
  institutionLoading: boolean;
  campusName?: string;
  campusLoading: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "Not provided";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function StudentProfileSections({
  student,
  canReadInstitutions,
  canReadCampuses,
  institutionName,
  institutionLoading,
  campusName,
  campusLoading,
}: StudentProfileSectionsProps) {
  return (
    <>
      <section className="student-panel">
        <div className="student-panel__header">
          <div className="student-panel__heading-icon" aria-hidden="true">
            <UserRound size={19} />
          </div>
          <div>
            <h2>Personal information</h2>
            <p>Student identity and personal details.</p>
          </div>
          <span
            className={`student-status ${
              student.active
                ? "student-status--active"
                : "student-status--inactive"
            }`}
          >
            {student.active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="student-detail-grid">
          <div className="student-detail-field">
            <span>Admission number</span>
            <strong>{student.admissionNumber}</strong>
          </div>
          <div className="student-detail-field">
            <span>First name</span>
            <strong>{student.firstName}</strong>
          </div>
          <div className="student-detail-field">
            <span>Last name</span>
            <strong>{student.lastName || "Not provided"}</strong>
          </div>
          <div className="student-detail-field">
            <span><CalendarDays size={14} /> Date of birth</span>
            <strong>{formatDate(student.dateOfBirth)}</strong>
          </div>
          <div className="student-detail-field">
            <span>Student ID</span>
            <strong className="student-detail-field__id">{student.id}</strong>
          </div>
        </div>
      </section>

      <section className="student-panel">
        <div className="student-panel__header">
          <div className="student-panel__heading-icon" aria-hidden="true">
            <GraduationCap size={19} />
          </div>
          <div>
            <h2>Organization</h2>
            <p>Institution and campus associated with this student.</p>
          </div>
        </div>

        <div className="student-detail-grid">
          <div className="student-detail-field">
            <span>Institution</span>
            <strong>
              {!canReadInstitutions
                ? "Name unavailable (read permission required)"
                : institutionName ??
                  (institutionLoading
                    ? "Loading institution name..."
                    : "Institution name unavailable")}
            </strong>
          </div>
          <div className="student-detail-field">
            <span>Campus</span>
            <strong>
              {!student.campusId
                ? "Institution-wide"
                : !canReadCampuses
                  ? "Name unavailable (read permission required)"
                  : campusName ??
                    (campusLoading
                      ? "Loading campus name..."
                      : "Campus name unavailable")}
            </strong>
          </div>
        </div>
      </section>
    </>
  );
}
