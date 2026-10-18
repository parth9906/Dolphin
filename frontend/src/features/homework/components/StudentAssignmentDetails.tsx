import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, MessageSquareText, Send } from "lucide-react";
import type { Assignment, AssignmentSubmission } from "../api/homework-types";

type Props = {
  assignment: Assignment;
  submission: AssignmentSubmission | null | undefined;
  isLoadingSubmission: boolean;
  submissionError: unknown;
  hasSubmissionError: boolean;
  canSubmit: boolean;
  responseText: string;
  feedback: string;
  isSubmitting: boolean;
  submitError: boolean;
  onResponseTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  formatDate: (value: string | null | undefined) => string;
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function Badge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const label = value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`hw-badge hw-badge--${normalized}`}>{label}</span>;
}

export function StudentAssignmentDetails({
  assignment, submission, isLoadingSubmission, submissionError, hasSubmissionError,
  canSubmit, responseText, feedback, isSubmitting, submitError,
  onResponseTextChange, onSubmit, onClose, formatDate,
}: Props) {
  return (
    <section className="hw-form-panel hw-student-submit-panel">
      <header className="hw-form-panel__header">
        <div>
          <span className="hw-eyebrow">ASSIGNMENT DETAILS</span>
          <h2>{assignment.title}</h2>
          <p>Due {formatDate(assignment.dueAt)} · Maximum {assignment.maxMarks} marks</p>
        </div>
        <button className="hw-close" type="button" onClick={onClose}>Close</button>
      </header>
      <div className="hw-instructions">{assignment.instructions}</div>
      {isLoadingSubmission && <div className="hw-loading" role="status"><LoaderCircle size={17} className="hw-spin" />Checking your current submission…</div>}
      {hasSubmissionError && <div className="hw-error" role="alert"><AlertCircle size={17} /><span>{errorText(submissionError)}</span></div>}
      {submission && (
        <div className="hw-existing-submission">
          <div className="hw-existing-submission__top">
            <strong>Your current submission</strong>
            <Badge value={submission.status} />
          </div>
          <p>Last submitted {formatDate(submission.submittedAt)}</p>
          {submission.status === "GRADED" && (
            <div className="hw-grade-result">Score: {submission.marksObtained} / {submission.maxMarks}</div>
          )}
          {submission.feedback && <p className="hw-feedback"><MessageSquareText size={14} /> {submission.feedback}</p>}
        </div>
      )}
      {canSubmit && submission?.status !== "GRADED" && !isLoadingSubmission && !hasSubmissionError && (
        <form className="hw-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="hw-submission-text">Your response</label>
          <textarea id="hw-submission-text" rows={8} maxLength={50000} value={responseText} onChange={(event) => onResponseTextChange(event.target.value)} placeholder="Write your answer here…" required />
          <div className="hw-submission-hint">{responseText.length.toLocaleString()} / 50,000 characters. Attachments are not supported by the current backend.</div>
          {feedback && (
            <div className={submitError ? "hw-error" : "hw-success"} role="status">
              {submitError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {feedback}
            </div>
          )}
          <div className="hw-form__actions">
            <button type="button" className="hw-secondary-button" onClick={onClose}>Close</button>
            <button className="hw-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle size={16} className="hw-spin" /> : <Send size={16} />}
              Submit work
            </button>
          </div>
        </form>
      )}
      {submission?.status === "GRADED" && (
        <div className="hw-notice"><CheckCircle2 size={18} /><div><strong>This submission has been graded</strong><p>The current backend does not allow resubmission after grading.</p></div></div>
      )}
      {!canSubmit && <div className="hw-notice"><AlertCircle size={18} /><div><strong>Submission permission unavailable</strong><p>Your account can view assignments but cannot submit them.</p></div></div>}
    </section>
  );
}
