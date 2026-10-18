import Select, { type StylesConfig } from "react-select";
import type { FormEvent } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { AcademicYear, ClassSection, SchoolClass } from "../../academics/api/academic-types";
import type { Assignment } from "../api/homework-types";

type HomeworkFilterOption = { value: string; label: string };

interface HomeworkAssignmentFormProps {
  editing: Assignment | null;
  canCreate: boolean;
  title: string;
  instructions: string;
  dueAt: string;
  maxMarks: string;
  yearId: string;
  classId: string;
  sectionId: string;
  formError: string;
  saving: boolean;
  years: AcademicYear[];
  classes: SchoolClass[];
  sections: ClassSection[];
  yearsLoading: boolean;
  classesLoading: boolean;
  sectionsLoading: boolean;
  yearsError?: unknown;
  classesError?: unknown;
  sectionsError?: unknown;
  selectStyles: StylesConfig<HomeworkFilterOption, false>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onDueAtChange: (value: string) => void;
  onMaxMarksChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onClassReset: () => void;
  onSectionReset: () => void;
}

function ErrorMessage({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return <div className="hw-error" role="alert"><span>{message}</span></div>;
}

function LoadingMessage({ text }: { text: string }) {
  return <div className="hw-loading" role="status"><LoaderCircle size={17} className="hw-spin" />{text}</div>;
}

export function HomeworkAssignmentForm(props: HomeworkAssignmentFormProps) {
  const {
    editing, canCreate, title, instructions, dueAt, maxMarks, yearId, classId,
    sectionId, formError, saving, years, classes, sections, yearsLoading,
    classesLoading, sectionsLoading, yearsError, classesError, sectionsError,
    selectStyles, onSubmit, onClose, onTitleChange, onInstructionsChange,
    onDueAtChange, onMaxMarksChange, onYearChange, onClassChange,
    onSectionChange, onClassReset, onSectionReset,
  } = props;

  const academicSelectStyles: StylesConfig<HomeworkFilterOption, false> = {
    ...selectStyles,
    container: (base) => ({ ...base, width: "100%", minWidth: 0 }),
  };

  return (
  <section className="hw-form-panel">
    <header className="hw-form-panel__header">
      <div>
        <span className="hw-eyebrow">{editing ? "DRAFT EDITOR" : "NEW WORK"}</span>
        <h2>{editing ? "Edit assignment draft" : "Create assignment"}</h2>
      </div>
      <button type="button" className="hw-close" onClick={() => { onClose(); }}>Close</button>
    </header>
    <form className="hw-form" onSubmit={onSubmit} noValidate>
      {!editing && canCreate && (
        <div className="hw-form__row hw-form__row--three">
          <div>
            <label htmlFor="hw-year">Academic year</label>
            <Select<HomeworkFilterOption, false>
              inputId="hw-year"
              classNamePrefix="hw-academic-select"
              styles={academicSelectStyles}
              options={years.map((year) => ({
                value: year.id,
                label: year.name,
              }))}
              value={years
                .map((year) => ({ value: year.id, label: year.name }))
                .find((option) => option.value === yearId) ?? null}
              isSearchable={false}
              isClearable={false}
              isLoading={yearsLoading}
              isDisabled={yearsLoading || years.length === 0}
              placeholder="Select year"
              onChange={(option) => {
                onYearChange(option?.value ?? "");
                onClassReset();
                onSectionReset();
              }}
            />
          </div>
          <div>
            <label htmlFor="hw-class">Class</label>
            <Select<HomeworkFilterOption, false>
              inputId="hw-class"
              classNamePrefix="hw-academic-select"
              styles={academicSelectStyles}
              options={classes.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.code})`,
              }))}
              value={classes
                .map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.code})`,
                }))
                .find((option) => option.value === classId) ?? null}
              isSearchable={false}
              isClearable={false}
              isLoading={classesLoading}
              isDisabled={!yearId || classesLoading}
              placeholder="Select class"
              onChange={(option) => {
                onClassChange(option?.value ?? "");
                onSectionReset();
              }}
            />
          </div>
          <div>
            <label htmlFor="hw-section">Section</label>
            <Select<HomeworkFilterOption, false>
              inputId="hw-section"
              classNamePrefix="hw-academic-select"
              styles={academicSelectStyles}
              options={sections
                .filter((item) => item.active)
                .map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              value={sections
                .filter((item) => item.active)
                .map((item) => ({
                  value: item.id,
                  label: item.name,
                }))
                .find((option) => option.value === sectionId) ?? null}
              isSearchable={false}
              isClearable={false}
              isLoading={sectionsLoading}
              isDisabled={!classId || sectionsLoading}
              placeholder="Select section"
              onChange={(option) => onSectionChange(option?.value ?? "")}
            />
          </div>
        </div>
      )}
      {yearsError !== undefined && !editing && <ErrorMessage error={yearsError} />}
      {classesError !== undefined && <ErrorMessage error={classesError} />}
      {sectionsError !== undefined && <ErrorMessage error={sectionsError} />}
      {(yearsLoading || classesLoading || sectionsLoading) && !editing && <LoadingMessage text="Loading academic structure…" />}
      <div>
        <label htmlFor="hw-title">Assignment title</label>
        <input id="hw-title" maxLength={200} value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="e.g. Algebra practice — Chapter 4" required />
      </div>
      <div>
        <label htmlFor="hw-instructions">Instructions</label>
        <textarea id="hw-instructions" maxLength={10000} rows={5} value={instructions} onChange={(event) => onInstructionsChange(event.target.value)} placeholder="Explain the task and what students should submit…" required />
      </div>
      <div className="hw-form__row hw-form__row--two">
        <div>
          <label htmlFor="hw-due">Due date and time</label>
          <input id="hw-due" type="datetime-local" value={dueAt} onChange={(event) => onDueAtChange(event.target.value)} required />
        </div>
        <div>
          <label htmlFor="hw-marks">Maximum marks</label>
          <input id="hw-marks" type="number" min="0.01" step="0.01" value={maxMarks} onChange={(event) => onMaxMarksChange(event.target.value)} required />
        </div>
      </div>
      {formError && <ErrorMessage error={formError} />}
      <div className="hw-form__actions">
        <button className="hw-secondary-button" type="button" onClick={() => { onClose(); }}>Cancel</button>
        <button className="hw-primary-button" type="submit" disabled={saving}>
          {saving ? <LoaderCircle size={16} className="hw-spin" /> : <CheckCircle2 size={16} />}
          {editing ? "Save draft" : "Create draft"}
        </button>
      </div>
    </form>
  </section>

  );
}
