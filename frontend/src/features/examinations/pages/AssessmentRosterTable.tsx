import type { Dispatch, SetStateAction } from "react";
import { Pencil, Save } from "lucide-react";

import type { Assessment, AssessmentRosterItem, StudentMark } from "../api/assessment-types";
import { displayNumber, displayStudentName } from "./assessment-management-utils";

type AssessmentRosterTableProps = {
  assessment: Assessment;
  roster: AssessmentRosterItem[];
  resultByStudentId: Map<string, StudentMark>;
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
  setWorkspaceError: (value: string) => void;
};

export function AssessmentRosterTable({
  assessment,
  roster,
  resultByStudentId,
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
  setWorkspaceError,
}: AssessmentRosterTableProps) {
  return (
    <div className="asm-table-wrap asm-table-wrap--workspace">
      <table className="asm-table asm-table--marks">
        <caption className="asm-visually-hidden">
          Student marks register for {assessment.name}
        </caption>
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Admission no.</th>
            <th scope="col">Marks / {displayNumber(assessment.maxMarks)}</th>
            <th scope="col">Remarks</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((student) => {
            const existing = resultByStudentId.get(student.studentId);
            const isEditing = editingStudentId === student.studentId;
            const studentName = displayStudentName(student);
            const fieldsDisabled = existing
              ? !canUpdateMarks || !assessment.active || !isEditing || savingMarkId !== null
              : !canRecordMarks || editingStudentId !== null || savingMarks || savingMarkId !== null;

            return (
              <tr key={student.studentId}>
                <td><strong>{studentName}</strong></td>
                <td>{student.admissionNumber}</td>
                <td>
                  <input
                    className="asm-mark-input"
                    type="number"
                    min="0"
                    max={Number(assessment.maxMarks)}
                    step="0.01"
                    aria-label={`Marks for ${studentName}`}
                    value={marksDraft[student.studentId] ?? ""}
                    disabled={fieldsDisabled}
                    onChange={(event) => setMarksDraft((current) => ({
                      ...current,
                      [student.studentId]: event.target.value,
                    }))}
                  />
                </td>
                <td>
                  <input
                    className="asm-remarks-input"
                    maxLength={500}
                    aria-label={`Remarks for ${studentName}`}
                    placeholder="Optional"
                    value={remarksDraft[student.studentId] ?? ""}
                    disabled={fieldsDisabled}
                    onChange={(event) => setRemarksDraft((current) => ({
                      ...current,
                      [student.studentId]: event.target.value,
                    }))}
                  />
                </td>
                <td>
                  {existing ? (
                    <span className="asm-tag">Saved · {displayNumber(existing.marksObtained)}</span>
                  ) : (
                    <span className="asm-tag asm-tag--muted">Not saved</span>
                  )}
                </td>
                <td>
                  <div className="asm-mark-actions">
                    {existing && canUpdateMarks && (isEditing ? (
                      <>
                        <button
                          type="button"
                          className="asm-button asm-button--small asm-button--primary"
                          disabled={savingMarkId !== null}
                          onClick={() => void saveEditedMark(student, existing)}
                        >
                          <Save size={13} />
                          {savingMarkId === existing.markId ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          className="asm-button asm-button--small asm-button--secondary"
                          disabled={savingMarkId !== null}
                          onClick={() => {
                            setMarksDraft((current) => ({
                              ...current,
                              [student.studentId]: String(existing.marksObtained),
                            }));
                            setRemarksDraft((current) => ({
                              ...current,
                              [student.studentId]: existing.remarks ?? "",
                            }));
                            setEditingStudentId(null);
                            setWorkspaceError("");
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="asm-button asm-button--small asm-button--secondary"
                        disabled={!assessment.active || editingStudentId !== null || savingMarkId !== null || savingMarks}
                        onClick={() => {
                          setWorkspaceError("");
                          setEditingStudentId(student.studentId);
                        }}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    ))}
                    {existing && canReadAudit && (
                      <button
                        type="button"
                        className="asm-button asm-button--small asm-button--secondary"
                        aria-label={`View mark history for ${studentName}`}
                        onClick={() => setAuditMark(existing)}
                      >
                        History
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {roster.length === 0 && (
            <tr>
              <td colSpan={6} className="asm-no-rows">
                No students were returned for this section.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
