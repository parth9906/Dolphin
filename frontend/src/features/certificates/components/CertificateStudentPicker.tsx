import { AlertCircle, CheckCircle2, LoaderCircle, Search, UserRound } from "lucide-react";
import type { StudentForEnrollment } from "../../academics/api/academic-types";

interface CertificateStudentPickerProps {
  search: string;
  selectedStudent: StudentForEnrollment | null;
  students: StudentForEnrollment[];
  isFetching: boolean;
  hasResults: boolean;
  errorMessage: string;
  onSearchChange: (value: string) => void;
  onSelectStudent: (student: StudentForEnrollment) => void;
  onClearSelection: () => void;
  formatStudentName: (student: StudentForEnrollment) => string;
}

export function CertificateStudentPicker({
  search,
  selectedStudent,
  students,
  isFetching,
  hasResults,
  errorMessage,
  onSearchChange,
  onSelectStudent,
  onClearSelection,
  formatStudentName,
}: CertificateStudentPickerProps) {
  const activeStudents = students.filter((student) => student.active);

  return (
    <div>
      <label htmlFor="cert-student-search">Find student</label>
      <div className="cert-search">
        <Search size={17} />
        <input
          id="cert-student-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or admission number…"
        />
      </div>
      <div className="cert-hint">Enter at least two characters to search students in this institution.</div>
      {search.trim().length >= 2 && isFetching && (
        <div className="cert-loading" role="status"><LoaderCircle size={17} className="cert-spin" />Searching students…</div>
      )}
      {errorMessage && (
        <div className="cert-error" role="alert"><AlertCircle size={17} /><span>{errorMessage}</span></div>
      )}
      {search.trim().length >= 2 && hasResults && (
        <div className="cert-student-results">
          {activeStudents.map((student) => (
            <button
              type="button"
              key={student.id}
              className={`cert-student-result${selectedStudent?.id === student.id ? " is-selected" : ""}`}
              onClick={() => onSelectStudent(student)}
            >
              <span className="cert-student-result__avatar"><UserRound size={17} /></span>
              <span className="cert-student-result__main">
                <strong>{formatStudentName(student)}</strong>
                <small>Admission no. {student.admissionNumber}</small>
              </span>
              {selectedStudent?.id === student.id && <CheckCircle2 size={17} />}
            </button>
          ))}
          {!isFetching && !errorMessage && activeStudents.length === 0 && (
            <p className="cert-inline-empty">No active students matched this search.</p>
          )}
        </div>
      )}
      {selectedStudent && (
        <div className="cert-selected-student">
          <div className="cert-selected-student__icon"><UserRound size={19} /></div>
          <div>
            <strong>{formatStudentName(selectedStudent)}</strong>
            <span>Admission number · {selectedStudent.admissionNumber}</span>
          </div>
          <button type="button" className="cert-text-button" onClick={onClearSelection}>Change</button>
        </div>
      )}
    </div>
  );
}
