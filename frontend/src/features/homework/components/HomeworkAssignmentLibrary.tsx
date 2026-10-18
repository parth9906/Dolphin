import { BookOpen, CheckCircle2, Clock3, FileText, Send, SquarePen, Users } from "lucide-react";
import type { Assignment, PageResponse } from "../api/homework-types";

type Props = {
  page: PageResponse<Assignment>;
  canEditDraft: (assignment: Assignment) => boolean;
  canPublish: boolean;
  canReadSubmissions: boolean;
  isPublishing: boolean;
  formatDate: (value: string | null | undefined) => string;
  onEdit: (assignment: Assignment) => void;
  onPublish: (assignment: Assignment) => void;
  onOpenSubmissions: (assignment: Assignment) => void;
  onPageChange: (update: (current: number) => number) => void;
};

function statusName(value: string): string {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function statusClass(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function Badge({ value }: { value: string }) {
  return <span className={`hw-badge hw-badge--${statusClass(value)}`}>{statusName(value)}</span>;
}

function deadlineIndicator(value: string): { label: string; urgency: "today" | "soon" | "passed" } | null {
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return null;
  const now = new Date();
  if (dueDate.getTime() <= now.getTime()) return { label: "Deadline passed", urgency: "passed" };
  if (dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth() && dueDate.getDate() === now.getDate()) {
    return { label: "Due today", urgency: "today" };
  }
  if (dueDate.getTime() - now.getTime() <= 48 * 60 * 60 * 1000) return { label: "Due soon", urgency: "soon" };
  return null;
}

export function HomeworkAssignmentLibrary({
  page, canEditDraft, canPublish, canReadSubmissions, isPublishing, formatDate,
  onEdit, onPublish, onOpenSubmissions, onPageChange,
}: Props) {
  return (
    <>
      <div className="hw-result-count">
        <span>{page.totalElements} assignments</span>
        <span>Sorted by most recently created</span>
      </div>
      {page.content.length === 0 ? (
        <div className="hw-empty"><div className="hw-empty__icon"><BookOpen size={23} /></div><strong>No assignments found</strong><p>Create a draft to get started, or change the status filter.</p></div>
      ) : (
        <div className="hw-assignment-list">
          {page.content.map((assignment) => {
            const deadline = deadlineIndicator(assignment.dueAt);
            return (
              <article className="hw-assignment-card" key={assignment.id}>
                <div className="hw-assignment-card__main">
                  <div className="hw-assignment-card__topline">
                    <span className="hw-card-icon"><FileText size={19} /></span>
                    <Badge value={assignment.status} />
                    {deadline && <span className={`hw-badge ${deadline.urgency === "passed" ? "hw-badge--late" : "hw-badge--draft"}`} aria-label={`Deadline: ${deadline.label}`} title="Deadline timing only; this does not indicate submission status.">{deadline.label}</span>}
                  </div>
                  <h3>{assignment.title}</h3>
                  <p className="hw-assignment-card__instructions">{assignment.instructions}</p>
                  <div className="hw-meta">
                    <span><Clock3 size={14} /> Due {formatDate(assignment.dueAt)}</span>
                    <span><CheckCircle2 size={14} /> {assignment.maxMarks} marks</span>
                  </div>
                </div>
                <div className="hw-assignment-card__actions">
                  {canEditDraft(assignment) && <button className="hw-secondary-button" type="button" onClick={() => onEdit(assignment)}><SquarePen size={15} /> Edit</button>}
                  {assignment.status === "DRAFT" && canPublish && <button className="hw-primary-button" type="button" disabled={isPublishing} onClick={() => onPublish(assignment)}><Send size={15} /> Publish</button>}
                  {canReadSubmissions && <button className="hw-secondary-button" type="button" onClick={() => onOpenSubmissions(assignment)}><Users size={15} /> Submissions</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {page.totalPages > 1 && (
        <div className="hw-pagination">
          <span>Page {page.number + 1} of {page.totalPages}</span>
          <button type="button" className="hw-secondary-button" disabled={page.number <= 0} onClick={() => onPageChange((current) => Math.max(0, current - 1))}>Previous</button>
          <button type="button" className="hw-secondary-button" disabled={page.number + 1 >= page.totalPages} onClick={() => onPageChange((current) => Math.min(page.totalPages - 1, current + 1))}>Load next page</button>
        </div>
      )}
    </>
  );
}
