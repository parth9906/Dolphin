import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import type { StudentForEnrollment } from "../../academics/api/academic-types";
import type { DocumentTemplate } from "../api/certificate-types";
import { CertificateStudentPicker } from "./CertificateStudentPicker";

interface CertificateIssueFormProps {
  canReadStudents: boolean;
  institutionSelected: boolean;
  selectedStudent: StudentForEnrollment | null;
  studentSearch: string;
  students: StudentForEnrollment[];
  isSearchingStudents: boolean;
  hasStudentSearchResults: boolean;
  studentSearchError: string;
  formatStudentName: (student: StudentForEnrollment) => string;
  templates: DocumentTemplate[] | undefined;
  selectedTemplateId: string;
  documentTitle: string;
  issueError: string;
  isIssuing: boolean;
  issueSucceeded: boolean;
  onStudentSearchChange: (value: string) => void;
  onSelectStudent: (student: StudentForEnrollment) => void;
  onClearStudent: () => void;
  onTemplateChange: (templateId: string) => void;
  onDocumentTitleChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CertificateIssueForm({
  canReadStudents,
  institutionSelected,
  selectedStudent,
  studentSearch,
  students,
  isSearchingStudents,
  hasStudentSearchResults,
  studentSearchError,
  formatStudentName,
  templates,
  selectedTemplateId,
  documentTitle,
  issueError,
  isIssuing,
  issueSucceeded,
  onStudentSearchChange,
  onSelectStudent,
  onClearStudent,
  onTemplateChange,
  onDocumentTitleChange,
  onSubmit,
}: CertificateIssueFormProps) {
  return (
    <section className="cert-panel cert-issue-panel">
      <header className="cert-panel__header">
        <div>
          <span className="cert-eyebrow">ISSUANCE WORKFLOW</span>
          <h2>Issue a document</h2>
          <p>Choose an active student and an active template in the selected institution.</p>
        </div>
        <span className="cert-step">Create · Render · Issue</span>
      </header>

      {!canReadStudents && (
        <div className="cert-notice">
          <AlertCircle size={18} />
          <div>
            <strong>Student search permission required</strong>
            <p>The existing student-search endpoint requires STUDENT_READ. No separate document-specific student lookup endpoint is available.</p>
          </div>
        </div>
      )}

      {canReadStudents && (
        <div className="cert-form">
          <CertificateStudentPicker
            search={studentSearch}
            selectedStudent={selectedStudent}
            students={students}
            isFetching={isSearchingStudents}
            hasResults={hasStudentSearchResults}
            errorMessage={studentSearchError}
            formatStudentName={formatStudentName}
            onSearchChange={onStudentSearchChange}
            onSelectStudent={onSelectStudent}
            onClearSelection={onClearStudent}
          />

          <form className="cert-nested-form" onSubmit={onSubmit}>
            <div className="cert-form-grid">
              <div>
                <label htmlFor="cert-template-select">Template</label>
                <select
                  id="cert-template-select"
                  value={selectedTemplateId}
                  onChange={(event) => onTemplateChange(event.target.value)}
                  required
                  disabled={!templates?.length}
                >
                  <option value="">Choose an active template</option>
                  {(templates ?? []).map((template) => (
                    <option key={template.id} value={template.id}>{template.name} ({template.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cert-document-title">Issued document title</label>
                <input
                  id="cert-document-title"
                  value={documentTitle}
                  onChange={(event) => onDocumentTitleChange(event.target.value)}
                  maxLength={200}
                  placeholder="Title on the issued record"
                  required
                />
              </div>
            </div>
            {issueError && (
              <div className="cert-error" role="alert">
                <AlertCircle size={17} />
                <span>{issueError}</span>
              </div>
            )}
            {issueSucceeded && (
              <div className="cert-success" role="status">
                <CheckCircle2 size={17} />
                Document issued successfully. The issued record is shown below.
              </div>
            )}
            <div className="cert-form__actions">
              <button
                type="submit"
                className="cert-primary-button"
                disabled={
                  isIssuing ||
                  !institutionSelected ||
                  !selectedStudent ||
                  !selectedTemplateId ||
                  !documentTitle.trim() ||
                  !templates?.some((item) => item.id === selectedTemplateId)
                }
              >
                {isIssuing ? <LoaderCircle size={16} className="cert-spin" /> : <Send size={16} />}
                Issue document
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
