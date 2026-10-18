import { BookOpen, Clock3 } from "lucide-react";
import type { Assignment, PageResponse } from "../api/homework-types";

type DeadlineIndicator = {
  label: string;
  urgency: "today" | "soon" | "passed";
} | null;

type Props = {
  page: PageResponse<Assignment> | undefined;
  isFetching: boolean;
  selectedAssignmentId: string | null;
  formatDate: (value: string | null | undefined) => string;
  deadlineIndicator: (value: string) => DeadlineIndicator;
  onOpenAssignment: (assignment: Assignment) => void;
  onPageChange: (update: (current: number) => number) => void;
};

function Badge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const label = value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`hw-badge hw-badge--${normalized}`}>{label}</span>;
}

export function StudentAssignmentLibrary({
  page,
  isFetching,
  selectedAssignmentId,
  formatDate,
  deadlineIndicator,
  onOpenAssignment,
  onPageChange,
}: Props) {
  if (!page) return null;

  return (
    <>
      {page.content.length === 0 && (
        <div className="hw-empty">
          <div className="hw-empty__icon"><BookOpen size={23} /></div>
          <strong>You’re all caught up</strong>
          <p>No published assignments are currently available for your active sections.</p>
        </div>
      )}
      <div className="hw-student-grid">
        {page.content.map((assignment) => (
          <article
            className={`hw-student-card${selectedAssignmentId === assignment.id ? " hw-student-card--selected" : ""}`}
            key={assignment.id}
          >
            <div className="hw-assignment-card__topline">
              <span className="hw-card-icon"><BookOpen size={19} /></span>
              <Badge value={assignment.status} />
            </div>
            <h3>{assignment.title}</h3>
            <p>{assignment.instructions}</p>
            <div className="hw-meta">
              <span><Clock3 size={14} /> Due {formatDate(assignment.dueAt)}</span>
              <span>{assignment.maxMarks} marks</span>
              {(() => {
                const deadline = deadlineIndicator(assignment.dueAt);
                if (!deadline) return null;

                return (
                  <span
                    className={`hw-badge ${
                      deadline.urgency === "passed" ? "hw-badge--late" : "hw-badge--draft"
                    }`}
                    aria-label={`Deadline: ${deadline.label}`}
                    title="Deadline timing only; this does not indicate submission status."
                  >
                    {deadline.label}
                  </span>
                );
              })()}
            </div>
            <button
              className="hw-primary-button"
              type="button"
              onClick={() => onOpenAssignment(assignment)}
            >
              Open assignment
            </button>
          </article>
        ))}
      </div>

      {page.totalPages > 1 && (
        <div className="hw-pagination" aria-label="My assignment pages">
          <button
            type="button"
            className="hw-secondary-button"
            disabled={page.number <= 0 || isFetching}
            onClick={() => onPageChange((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span>Page {page.number + 1} of {page.totalPages}</span>
          <button
            type="button"
            className="hw-secondary-button"
            disabled={page.number + 1 >= page.totalPages || isFetching}
            onClick={() => onPageChange((current) => Math.min(page.totalPages - 1, current + 1))}
          >
            Next page
          </button>
        </div>
      )}
    </>
  );
}
