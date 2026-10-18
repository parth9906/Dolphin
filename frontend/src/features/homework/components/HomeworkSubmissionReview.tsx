import type { FormEvent } from "react";
import { AlertCircle, LoaderCircle, MessageSquareText } from "lucide-react";
import type { Assignment, AssignmentSubmission } from "../api/homework-types";

type Props = {
  assignment: Assignment; submissions: AssignmentSubmission[]; totalPages: number; currentPage: number;
  isLoading: boolean; isFetching: boolean; error: unknown; hasError: boolean; canGrade: boolean;
  selectedSubmission: AssignmentSubmission | null; gradeMarks: string; gradeFeedback: string;
  isSavingGrade: boolean; gradeError: unknown; hasGradeError: boolean;
  onClose: () => void; onSelectSubmission: (submission: AssignmentSubmission) => void;
  onGradeMarksChange: (value: string) => void; onGradeFeedbackChange: (value: string) => void;
  onGrade: (event: FormEvent<HTMLFormElement>) => void;
  onPageChange: (update: (current: number) => number) => void;
  formatDate: (value: string | null | undefined) => string;
};

function errorText(error: unknown): string { return error instanceof Error ? error.message : "Something went wrong."; }
function statusName(value: string): string { return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase()); }
function statusClass(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function Badge({ value }: { value: string }) { return <span className={`hw-badge hw-badge--${statusClass(value)}`}>{statusName(value)}</span>; }

export function HomeworkSubmissionReview({
  assignment, submissions, totalPages, currentPage, isLoading, isFetching, error, hasError,
  canGrade, selectedSubmission, gradeMarks, gradeFeedback, isSavingGrade, gradeError,
  hasGradeError, onClose, onSelectSubmission, onGradeMarksChange, onGradeFeedbackChange,
  onGrade, onPageChange, formatDate,
}: Props) {
  return (
    <section className="hw-form-panel hw-submissions-panel">
      <header className="hw-form-panel__header">
        <div><span className="hw-eyebrow">SUBMISSION REVIEW</span><h2>{assignment.title}</h2><p>Submissions are shown for this assignment. Grading uses the current version.</p></div>
        <button className="hw-close" type="button" onClick={onClose}>Close</button>
      </header>
      {isLoading && <div className="hw-loading" role="status"><LoaderCircle size={17} className="hw-spin" />Loading submissions…</div>}
      {hasError && <div className="hw-error" role="alert"><AlertCircle size={17} /><span>{errorText(error)}</span></div>}
      {!isLoading && !hasError && submissions.length === 0 && <div className="hw-empty"><strong>No submissions yet</strong><p>Student submissions will appear here when received.</p></div>}
      {submissions.map((submission) => (
        <article className="hw-submission-row" key={submission.id}>
          <div className="hw-submission-row__identity">
            <strong>{submission.studentFirstName} {submission.studentLastName}</strong><span>{submission.studentAdmissionNumber}</span>
            <span>Submitted {formatDate(submission.submittedAt)}</span><Badge value={submission.status} />
            <p className="hw-submission-text">{submission.submissionText}</p>
            {submission.feedback && <p className="hw-feedback"><MessageSquareText size={14} /> {submission.feedback}</p>}
            {submission.status === "GRADED" && <p className="hw-grade-result">Marks: {submission.marksObtained} / {submission.maxMarks}</p>}
          </div>
          {canGrade && submission.status !== "GRADED" && <button className="hw-secondary-button" type="button" onClick={() => onSelectSubmission(submission)}>Grade submission</button>}
          {canGrade && selectedSubmission?.id === submission.id && (
            <form className="hw-grade-form" onSubmit={onGrade} noValidate>
              <label htmlFor="hw-grade-marks">Marks (out of {submission.maxMarks})</label>
              <input id="hw-grade-marks" type="number" min="0" max={submission.maxMarks} step="0.01" value={gradeMarks} onChange={(event) => onGradeMarksChange(event.target.value)} required />
              <label htmlFor="hw-grade-feedback">Feedback</label>
              <textarea id="hw-grade-feedback" rows={3} maxLength={2000} value={gradeFeedback} onChange={(event) => onGradeFeedbackChange(event.target.value)} />
              {hasGradeError && <div className="hw-error" role="alert"><AlertCircle size={17} /><span>{errorText(gradeError)}</span></div>}
              <button className="hw-primary-button" type="submit" disabled={isSavingGrade}>{isSavingGrade ? "Saving…" : "Save grade"}</button>
            </form>
          )}
        </article>
      ))}
      {totalPages > 1 && <div className="hw-pagination" aria-label="Submission pages">
        <button type="button" className="hw-secondary-button" disabled={currentPage <= 0 || isFetching} onClick={() => onPageChange((current) => Math.max(0, current - 1))}>Previous</button>
        <span>Page {currentPage + 1} of {totalPages}</span>
        <button type="button" className="hw-secondary-button" disabled={currentPage + 1 >= totalPages || isFetching} onClick={() => onPageChange((current) => Math.min(totalPages - 1, current + 1))}>Next page</button>
      </div>}
    </section>
  );
}
