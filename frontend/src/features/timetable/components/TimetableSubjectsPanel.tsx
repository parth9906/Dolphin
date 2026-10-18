import type { FormEventHandler, Dispatch, SetStateAction } from "react";
import { LoaderCircle, Plus, RefreshCw } from "lucide-react";

import type { AcademicSubject } from "../api/timetable-types";
import { Empty, Field } from "./TimetableControls";

interface TimetableSubjectsPanelProps {
  institutionId: string;
  subjects: AcademicSubject[];
  subjectsLoading: boolean;
  canSubjectRead: boolean;
  canSubjectCreate: boolean;
  canSubjectUpdate: boolean;
  saving: boolean;
  editingSubjectId: string | null;
  subjectName: string;
  setSubjectName: Dispatch<SetStateAction<string>>;
  subjectCode: string;
  setSubjectCode: Dispatch<SetStateAction<string>>;
  subjectDescription: string;
  setSubjectDescription: Dispatch<SetStateAction<string>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onEdit: (subject: AcademicSubject) => void;
  onCancelEdit: () => void;
}

export function TimetableSubjectsPanel({
  institutionId,
  subjects,
  subjectsLoading,
  canSubjectRead,
  canSubjectCreate,
  canSubjectUpdate,
  saving,
  editingSubjectId,
  subjectName,
  setSubjectName,
  subjectCode,
  setSubjectCode,
  subjectDescription,
  setSubjectDescription,
  onSubmit,
  onEdit,
  onCancelEdit,
}: TimetableSubjectsPanelProps) {
  return (
    <div className="timetable-workspace">
      <div className="timetable-section-heading">
        <div><h2>Subjects</h2><p>Manage the subjects available at this institution.</p></div>
        <span className="timetable-count">{subjects.length} subject{subjects.length === 1 ? "" : "s"}</span>
      </div>

      {(canSubjectCreate || (Boolean(editingSubjectId) && canSubjectUpdate)) && institutionId && (
        <form className="timetable-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> {editingSubjectId ? "Edit subject" : "Create subject"}</h3>
          <div className="timetable-form-grid timetable-form-grid--three">
            <Field label="Subject name">
              <input required maxLength={120} value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Subject code">
              <input required maxLength={30} value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} placeholder="e.g. MATH" />
            </Field>
            <Field label="Description (optional)">
              <input maxLength={500} value={subjectDescription} onChange={(event) => setSubjectDescription(event.target.value)} placeholder="Brief description" />
            </Field>
          </div>
          <div className="timetable-form-actions">
            <button className="timetable-primary-button" type="submit" disabled={saving}>
              {saving ? <LoaderCircle size={16} className="timetable-spin" /> : !editingSubjectId ? <Plus size={16} /> : null}
              {editingSubjectId ? "Save changes" : "Create subject"}
            </button>
            {editingSubjectId && (
              <button type="button" className="timetable-secondary-button" disabled={saving} onClick={onCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {subjectsLoading && <div className="timetable-loading" role="status"><RefreshCw size={18} className="timetable-spin" /> Loading subjects…</div>}
      {canSubjectRead && !subjectsLoading && subjects.length === 0 && (
        <Empty title="No subjects yet" description="Create a subject here before assigning it to a teacher." />
      )}
      {canSubjectRead && subjects.length > 0 && (
        <div className="timetable-table-wrap">
          <table className="timetable-table">
            <caption className="timetable-sr-only">Subjects configured for the selected institution</caption>
            <thead><tr><th scope="col">Subject</th><th scope="col">Code</th><th scope="col">Description</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td><strong>{subject.name}</strong></td>
                  <td>{subject.code}</td>
                  <td>{subject.description || "—"}</td>
                  <td><span className={`timetable-status ${subject.active ? "timetable-status--active" : ""}`}>{subject.active ? "Active" : "Inactive"}</span></td>
                  <td>
                    {canSubjectUpdate && (
                      <button type="button" className="timetable-secondary-button" onClick={() => onEdit(subject)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
