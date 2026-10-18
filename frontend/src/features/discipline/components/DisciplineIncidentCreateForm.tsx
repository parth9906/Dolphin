import type { FormEvent } from "react";
import Select from "react-select";
import { LoaderCircle, Plus, X } from "lucide-react";
import type {
  DisciplineCategory,
  DisciplineSeverity,
} from "../api/discipline-types";

type Option<T extends string> = { value: T; label: string };
type StudentOption = Option<string>;

interface DisciplineIncidentCreateFormProps {
  studentOptions: StudentOption[];
  categoryOptions: Option<DisciplineCategory>[];
  severityOptions: Option<DisciplineSeverity>[];
  newStudentId: string;
  category: DisciplineCategory;
  severity: DisciplineSeverity;
  incidentDate: string;
  maxIncidentDate: string;
  description: string;
  studentsLoading: boolean;
  canReadStudents: boolean;
  saving: boolean;
  institutionSelected: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onClose: () => void;
  onCancel: () => void;
  onStudentChange: (studentId: string) => void;
  onCategoryChange: (category: DisciplineCategory) => void;
  onSeverityChange: (severity: DisciplineSeverity) => void;
  onIncidentDateChange: (date: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function DisciplineIncidentCreateForm({
  studentOptions,
  categoryOptions,
  severityOptions,
  newStudentId,
  category,
  severity,
  incidentDate,
  maxIncidentDate,
  description,
  studentsLoading,
  canReadStudents,
  saving,
  institutionSelected,
  onSubmit,
  onClose,
  onCancel,
  onStudentChange,
  onCategoryChange,
  onSeverityChange,
  onIncidentDateChange,
  onDescriptionChange,
}: DisciplineIncidentCreateFormProps) {
  return (
    <section className="discipline-panel">
      <div className="discipline-panel-heading">
        <div>
          <h2>Record a new incident</h2>
          <p>
            New incidents begin in Open status. Choose the student and record
            the incident details.
          </p>
        </div>
        <button className="discipline-icon-button" aria-label="Close form" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form className="discipline-form" onSubmit={onSubmit}>
        <label>
          Student
          <Select
            className="discipline-select"
            classNamePrefix="discipline-select"
            inputId="discipline-new-student"
            options={studentOptions}
            value={studentOptions.find((option) => option.value === newStudentId) ?? null}
            onChange={(option) => onStudentChange(option?.value ?? "")}
            isSearchable
            isClearable
            isLoading={studentsLoading}
            isDisabled={studentsLoading || !canReadStudents}
            placeholder={studentsLoading ? "Loading students…" : "Search by student name or admission number"}
            noOptionsMessage={() => studentsLoading ? "Loading students…" : "No students found"}
          />
          <small>
            Only active students returned by the existing student API are shown.
          </small>
        </label>

        <label>
          Incident category
          <Select
            className="discipline-select"
            classNamePrefix="discipline-select"
            inputId="discipline-category"
            options={categoryOptions}
            value={categoryOptions.find((option) => option.value === category) ?? null}
            onChange={(option) => { if (option) onCategoryChange(option.value); }}
            isSearchable
            isClearable={false}
          />
        </label>

        <label>
          Severity
          <Select
            className="discipline-select"
            classNamePrefix="discipline-select"
            inputId="discipline-severity"
            options={severityOptions}
            value={severityOptions.find((option) => option.value === severity) ?? null}
            onChange={(option) => { if (option) onSeverityChange(option.value); }}
            isSearchable={false}
            isClearable={false}
          />
        </label>

        <label>
          Incident date
          <input
            type="date"
            max={maxIncidentDate}
            value={incidentDate}
            onChange={(event) => onIncidentDateChange(event.target.value)}
            required
          />
        </label>

        <label className="discipline-form-wide">
          Description
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
            maxLength={2000}
            required
            placeholder="Describe what happened factually and clearly…"
          />
          <small>{description.length}/2000 characters</small>
        </label>

        <div className="discipline-form-actions discipline-form-wide">
          <button type="button" className="discipline-button discipline-button--quiet" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="discipline-button discipline-button--primary"
            disabled={saving || !institutionSelected}
          >
            {saving ? <LoaderCircle className="discipline-spin" size={16} /> : <Plus size={16} />}
            Save incident
          </button>
        </div>
      </form>
    </section>
  );
}
