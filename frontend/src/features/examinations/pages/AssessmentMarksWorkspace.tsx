import type { Dispatch, SetStateAction } from "react";
import { AlertCircle, ClipboardCheck, Save, X } from "lucide-react";

import type { Assessment, AssessmentRosterItem, StudentMark } from "../api/assessment-types";
import { displayNumber, formatDate } from "./assessment-management-utils";
import { AssessmentRosterTable } from "./AssessmentRosterTable";

type AssessmentMarksWorkspaceProps = {
  activeAssessment: Assessment;
  setActiveAssessment: (assessment: Assessment | null) => void;
  workspaceNotice: string;
  setWorkspaceNotice: (value: string) => void;
  workspaceError: string;
  setWorkspaceError: (value: string) => void;
  canRead: boolean;
  openMarksWorkspace: (assessment: Assessment) => Promise<void>;
  workspaceLoading: boolean;
  roster: AssessmentRosterItem[];
  results: StudentMark[];
  marksDraft: Record<string, string>;
  setMarksDraft: Dispatch<SetStateAction<Record<string, string>>>;
  remarksDraft: Record<string, string>;
  setRemarksDraft: Dispatch<SetStateAction<Record<string, string>>>;
  canRecordMarks: boolean;
  canUpdateMarks: boolean;
  canReadAudit: boolean;
  savingMarks: boolean;
  savingMarkId: string | null;
  editingStudentId: string | null;
  setEditingStudentId: (studentId: string | null) => void;
  saveEditedMark: (student: AssessmentRosterItem, existing: StudentMark) => Promise<void>;
  setAuditMark: (mark: StudentMark | null) => void;
  saveNewMarks: () => Promise<void>;
};

export function AssessmentMarksWorkspace({
  activeAssessment,
  setActiveAssessment,
  workspaceNotice,
  setWorkspaceNotice,
  workspaceError,
  setWorkspaceError,
  canRead,
  openMarksWorkspace,
  workspaceLoading,
  roster,
  results,
  marksDraft,
  setMarksDraft,
  remarksDraft,
  setRemarksDraft,
  canRecordMarks,
  canUpdateMarks,
  canReadAudit,
  savingMarks,
  savingMarkId,
  editingStudentId,
  setEditingStudentId,
  saveEditedMark,
  setAuditMark,
  saveNewMarks,
}: AssessmentMarksWorkspaceProps) {
  const resultByStudentId = new Map(results.map((result) => [result.studentId, result]));

  return (
        <div className="asm-overlay" role="presentation">
          <section
            className="asm-dialog asm-dialog--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asm-marks-title"
          >
            <header className="asm-dialog__header">
              <div>
                <span className="asm-eyebrow">MARKS REGISTER</span>
                <h2 id="asm-marks-title">{activeAssessment.name}</h2>
                <p>
                  {activeAssessment.subjectName} · {formatDate(activeAssessment.assessmentDate)}
                  {" · "}Maximum {displayNumber(activeAssessment.maxMarks)}
                </p>
              </div>
              <button
                type="button"
                className="asm-icon-button"
                aria-label="Close marks register"
                onClick={() => setActiveAssessment(null)}
              >
                <X size={19} />
              </button>
            </header>

            {workspaceNotice && (
              <div className="asm-alert asm-alert--success" role="status">
                <ClipboardCheck size={17} />
                <span>{workspaceNotice}</span>
                <button type="button" aria-label="Dismiss" onClick={() => setWorkspaceNotice("")}>
                  <X size={16} />
                </button>
              </div>
            )}

            {workspaceError && (
              <div className="asm-alert asm-alert--error" role="alert">
                <AlertCircle size={17} />
                <span>{workspaceError}</span>
                {canRead && (
                  <button
                    type="button"
                    className="asm-text-button"
                    onClick={() => void openMarksWorkspace(activeAssessment)}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {workspaceLoading ? (
              <div className="asm-loading">
                <span className="asm-spinner" />
                Loading students and existing marks…
              </div>
            ) : !canRead ? (
              <div className="asm-empty">
                <AlertCircle size={28} />
                <h3>Marks register unavailable</h3>
                <p>
                  This roster requires MARKS_READ permission. Dolphin returns only the eligible students your account is authorized to access.
                </p>
              </div>
            ) : (
              <>
                <div className="asm-roster-summary">
                  <div>
                    <strong>{roster.length}</strong>
                    <span>Students in roster</span>
                  </div>
                  <div>
                    <strong>{results.length}</strong>
                    <span>Existing results</span>
                  </div>
                  <div>
                    <strong>{Math.max(0, roster.length - results.length)}</strong>
                    <span>Awaiting marks</span>
                  </div>
                </div>

                <AssessmentRosterTable
                  assessment={activeAssessment}
                  roster={roster}
                  resultByStudentId={resultByStudentId}
                  marksDraft={marksDraft}
                  setMarksDraft={setMarksDraft}
                  remarksDraft={remarksDraft}
                  setRemarksDraft={setRemarksDraft}
                  canRecordMarks={canRecordMarks}
                  canUpdateMarks={canUpdateMarks}
                  canReadAudit={canReadAudit}
                  savingMarks={savingMarks}
                  savingMarkId={savingMarkId}
                  editingStudentId={editingStudentId}
                  setEditingStudentId={setEditingStudentId}
                  saveEditedMark={saveEditedMark}
                  setAuditMark={setAuditMark}
                  setWorkspaceError={setWorkspaceError}
                />

                <footer className="asm-workspace-footer">
                  <p>
                    New marks can be recorded here. Existing marks can be corrected when your account has permission; changes are tracked in the mark audit history.
                  </p>
                  {canRecordMarks && (
                    <button
                      type="button"
                      className="asm-button asm-button--primary"
                      disabled={savingMarks || savingMarkId !== null || editingStudentId !== null || workspaceLoading || roster.length === 0}
                      onClick={() => void saveNewMarks()}
                    >
                      <Save size={16} />
                      {savingMarks ? "Saving marks…" : "Save new marks"}
                    </button>
                  )}
                </footer>
              </>
            )}
          </section>
        </div>
  );
}
