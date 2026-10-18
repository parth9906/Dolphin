import { AlertCircle } from "lucide-react";
import Select from "react-select";

import type { Assessment } from "../api/assessment-types";
import { selectStyles, type Option } from "./assessment-management-utils";

type AssessmentAcademicScopeFieldsProps = {
  editingAssessment: Assessment | null;
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
};

export function AssessmentAcademicScopeFields({
  editingAssessment,
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
}: AssessmentAcademicScopeFieldsProps) {
  if (editingAssessment) {
    return (
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
    );
  }

  return (
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
  );
}
