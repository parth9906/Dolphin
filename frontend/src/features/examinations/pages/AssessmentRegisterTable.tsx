import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";

import type { Assessment } from "../api/assessment-types";
import { displayNumber, formatDate } from "./assessment-management-utils";

type AssessmentRegisterTableProps = {
  assessments: Assessment[];
  totalElements: number;
  totalPages: number;
  page: number;
  loading: boolean;
  canRead: boolean;
  canUpdateAssessment: boolean;
  onEdit: (assessment: Assessment) => void;
  onOpenMarks: (assessment: Assessment) => void;
  onPageChange: (page: number) => void;
};

function getScopeLabel(scopeType: Assessment["scopeType"]): string {
  if (scopeType === "SECTION") return "Section assessment";
  if (scopeType === "CLASS") return "Class assessment";
  return "Institution-wide";
}

export function AssessmentRegisterTable({
  assessments,
  totalElements,
  totalPages,
  page,
  loading,
  canRead,
  canUpdateAssessment,
  onEdit,
  onOpenMarks,
  onPageChange,
}: AssessmentRegisterTableProps) {
  return (
    <>
      <div className="asm-table-wrap asm-table-wrap--register">
        <table className="asm-table">
          <caption className="asm-visually-hidden">Assessment register</caption>
          <thead>
            <tr>
              <th scope="col">Assessment</th>
              <th scope="col">Subject</th>
              <th scope="col">Date</th>
              <th scope="col">Maximum marks</th>
              <th scope="col">Scope</th>
              <th scope="col" className="asm-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <span className="asm-cell-subtitle">
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{item.subjectName}</td>
                <td>{formatDate(item.assessmentDate)}</td>
                <td>{displayNumber(item.maxMarks)}</td>
                <td>
                  <span className="asm-tag">{getScopeLabel(item.scopeType)}</span>
                </td>
                <td className="asm-table__actions">
                  {canUpdateAssessment && (
                    <button
                      type="button"
                      className="asm-button asm-button--small asm-button--secondary"
                      disabled={!item.active}
                      onClick={() => onEdit(item)}
                      title={
                        item.active
                          ? "Edit assessment details"
                          : "Inactive assessments cannot be edited"
                      }
                      aria-label={`Edit assessment ${item.name}`}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="asm-button asm-button--small asm-button--secondary"
                    disabled={!canRead || !item.active}
                    title={
                      !canRead
                        ? "Requires MARKS_READ"
                        : !item.active
                          ? "Inactive assessments do not expose a roster"
                          : "Open marks register"
                    }
                    aria-label={`View marks for assessment ${item.name}`}
                    onClick={() => onOpenMarks(item)}
                  >
                    View marks
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="asm-assessment-cards" aria-label="Assessment register">
        {assessments.map((item) => (
          <article className="asm-assessment-card" key={item.id}>
            <div className="asm-assessment-card__heading">
              <div className="asm-assessment-card__title-group">
                <h3>{item.name}</h3>
                <span
                  className={`asm-assessment-card__status${item.active ? " asm-assessment-card__status--active" : " asm-assessment-card__status--inactive"}`}
                >
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
              <span className="asm-tag">{getScopeLabel(item.scopeType)}</span>
            </div>

            <dl className="asm-assessment-card__details">
              <div>
                <dt>Subject</dt>
                <dd>{item.subjectName}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatDate(item.assessmentDate)}</dd>
              </div>
              <div>
                <dt>Maximum marks</dt>
                <dd>{displayNumber(item.maxMarks)}</dd>
              </div>
            </dl>

            <div className="asm-assessment-card__actions">
              {canUpdateAssessment && (
                <button
                  type="button"
                  className="asm-button asm-button--secondary"
                  disabled={!item.active}
                  onClick={() => onEdit(item)}
                  aria-label={`Edit assessment ${item.name}`}
                  title={
                    item.active
                      ? "Edit assessment details"
                      : "Inactive assessments cannot be edited"
                  }
                >
                  <Pencil size={15} aria-hidden="true" />
                  Edit
                </button>
              )}
              <button
                type="button"
                className="asm-button asm-button--primary"
                disabled={!canRead || !item.active}
                onClick={() => onOpenMarks(item)}
                aria-label={`View marks for assessment ${item.name}`}
                title={
                  !canRead
                    ? "Requires MARKS_READ"
                    : !item.active
                      ? "Inactive assessments do not expose a roster"
                      : "Open marks register"
                }
              >
                View marks
              </button>
            </div>
          </article>
        ))}
      </div>

      <footer className="asm-pagination">
        <span>Showing {assessments.length} of {totalElements}</span>
        <div>
          <button
            type="button"
            className="asm-icon-button"
            aria-label="Previous page"
            disabled={page <= 0 || loading}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
          <button
            type="button"
            className="asm-icon-button"
            aria-label="Next page"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </>
  );
}
