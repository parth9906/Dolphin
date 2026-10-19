import type { FormEvent } from "react";
import Select from "react-select";
import { AlertCircle, X } from "lucide-react";

import type { Assessment } from "../api/assessment-types";
import { selectStyles, type Option } from "./assessment-management-utils";

type AssessmentCreateDialogProps = {
  editingAssessment: Assessment | null;
  savingAssessment: boolean;
  institutionId: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  assessmentName: string;
  setAssessmentName: (value: string) => void;
  subjectName: string;
  setSubjectName: (value: string) => void;
  assessmentDate: string;
  setAssessmentDate: (value: string) => void;
  maxMarks: string;
  setMaxMarks: (value: string) => void;
  yearOptions: Option[];
  selectedYearId: string;
  loadingYears: boolean;
  canReadYears: boolean;
  changeYear: (option: Option | null) => Promise<void>;
  classOptions: Option[];
  selectedClassId: string;
  loadingClasses: boolean;
  canReadClasses: boolean;
  changeClass: (option: Option | null) => Promise<void>;
  sectionOptions: Option[];
  selectedSectionId: string;
  loadingSections: boolean;
  canReadSections: boolean;
  setSelectedSectionId: (value: string) => void;
  academicError: string;
  createError: string;
};

export function AssessmentCreateDialog({
  editingAssessment,
  savingAssessment,
  institutionId,
  onClose,
  onSubmit,
  assessmentName,
  setAssessmentName,
  subjectName,
  setSubjectName,
  assessmentDate,
  setAssessmentDate,
  maxMarks,
  setMaxMarks,
  yearOptions,
  selectedYearId,
  loadingYears,
  canReadYears,
  changeYear,
  classOptions,
  selectedClassId,
  loadingClasses,
  canReadClasses,
  changeClass,
  sectionOptions,
  selectedSectionId,
  loadingSections,
  canReadSections,
  setSelectedSectionId,
  academicError,
  createError,
}: AssessmentCreateDialogProps) {
  return (
        <div
          className="asm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingAssessment) {
              onClose();
            }
          }}
        >
          <section
            className="asm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asm-create-title"
          >
            <header className="asm-dialog__header">
              <div>
                <span className="asm-eyebrow">ASSESSMENT SETUP</span>
                <h2 id="asm-create-title">
                  {editingAssessment ? "Edit assessment" : "Create assessment"}
                </h2>
                <p>
                  {editingAssessment
                    ? "Update the assessment details. Its scope and date will remain unchanged."
                    : "Set assessment details and optionally choose a section."}
                </p>
              </div>
              <button
                type="button"
                className="asm-icon-button"
                aria-label="Close dialog"
                disabled={savingAssessment}
                onClick={onClose}
              >
                <X size={19} />
              </button>
            </header>

            <form className="asm-form" onSubmit={onSubmit}>
              <label className="asm-field">
                <span>Assessment name <b>*</b></span>
                <input
                  required
                  autoFocus
                  maxLength={150}
                  value={assessmentName}
                  onChange={(event) => setAssessmentName(event.target.value)}
                  placeholder="e.g. Mid-term examination"
                />
              </label>
              <label className="asm-field">
                <span>Subject <b>*</b></span>
                <input
                  required
                  maxLength={100}
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="e.g. Mathematics"
                />
              </label>
              <div className="asm-form-grid">
                <label className="asm-field">
                  <span>Assessment date <b>*</b></span>
                  <input
                    required
                    type="date"
                    value={assessmentDate}
                    disabled={Boolean(editingAssessment)}
                    onChange={(event) => setAssessmentDate(event.target.value)}
                  />
                </label>
                <label className="asm-field">
                  <span>Maximum marks <b>*</b></span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={maxMarks}
                    onChange={(event) => setMaxMarks(event.target.value)}
                  />
                </label>
              </div>

              {!editingAssessment && (
                <div className="asm-form-section">
                <div>
                  <h3>Academic section</h3>
                  <p>A section is needed for roster-based marks entry.</p>
                </div>
                <label className="asm-field">
                  <span>Academic year</span>
                  <Select<Option, false>
                    classNamePrefix="asm-select"
                    styles={selectStyles}
                    options={yearOptions}
                    value={yearOptions.find((option) => option.value === selectedYearId) ?? null}
                    isClearable
                    isLoading={loadingYears}
                    isDisabled={!canReadYears || loadingYears}
                    placeholder={canReadYears ? "Choose academic year" : "Requires ACADEMIC_YEAR_READ"}
                    noOptionsMessage={() => "No academic years available"}
                    onChange={(option) => void changeYear(option)}
                  />
                </label>
                <label className="asm-field">
                  <span>Class</span>
                  <Select<Option, false>
                    classNamePrefix="asm-select"
                    styles={selectStyles}
                    options={classOptions}
                    value={classOptions.find((option) => option.value === selectedClassId) ?? null}
                    isClearable
                    isLoading={loadingClasses}
                    isDisabled={!selectedYearId || !canReadClasses || loadingClasses}
                    placeholder={canReadClasses ? "Choose class" : "Requires CLASS_READ"}
                    noOptionsMessage={() => "Select an academic year first"}
                    onChange={(option) => void changeClass(option)}
                  />
                </label>
                <label className="asm-field">
                  <span>Section</span>
                  <Select<Option, false>
                    classNamePrefix="asm-select"
                    styles={selectStyles}
                    options={sectionOptions}
                    value={sectionOptions.find((option) => option.value === selectedSectionId) ?? null}
                    isClearable
                    isLoading={loadingSections}
                    isDisabled={!selectedClassId || !canReadSections || loadingSections}
                    placeholder={canReadSections ? "Choose section" : "Requires SECTION_READ"}
                    noOptionsMessage={() => "Select a class first"}
                    onChange={(option) => setSelectedSectionId(option?.value ?? "")}
                  />
                </label>
                {academicError && (
                  <div className="asm-inline-error" role="alert">
                    <AlertCircle size={15} />
                    {academicError}
                  </div>
                )}
                </div>
              )}
              {editingAssessment && (
                <div className="asm-form-section">
                  <div>
                    <h3>Academic scope</h3>
                    <p>Scope and assessment date are kept unchanged while editing.</p>
                  </div>
                  <span className="asm-tag">
                    {editingAssessment.scopeType === "SECTION"
                      ? "Section assessment"
                      : editingAssessment.scopeType === "CLASS"
                        ? "Class assessment"
                        : "Institution-wide"}
                  </span>
                </div>
              )}

              {createError && (
                <div className="asm-alert asm-alert--error" role="alert">
                  <AlertCircle size={17} />
                  <span>{createError}</span>
                </div>
              )}

              <footer className="asm-dialog__footer">
                <button
                  type="button"
                  className="asm-button asm-button--secondary"
                  disabled={savingAssessment}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="asm-button asm-button--primary"
                  disabled={savingAssessment || !institutionId}
                >
                  {savingAssessment
                    ? editingAssessment ? "Saving…" : "Creating…"
                    : editingAssessment ? "Save changes" : "Create assessment"}
                </button>
              </footer>
            </form>
          </section>
        </div>
  );
}
