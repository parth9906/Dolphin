import Select from "react-select";
import { CalendarDays } from "lucide-react";

import {
  attendanceSelectStyles,
  type SelectOption,
} from "./attendance-page-utils";

interface AttendanceFiltersProps {
  attendanceMode: "daily" | "lesson";
  institutionId: string;
  institutionSelectOptions: SelectOption[];
  clusterId: string;
  canReadInstitutions: boolean;
  institutionsLoading: boolean;
  institutionOptionsCount: number;
  academicYearId: string;
  academicYearOptions: SelectOption[];
  academicYearsLoading: boolean;
  schoolClassId: string;
  classOptions: SelectOption[];
  classesLoading: boolean;
  sectionId: string;
  sectionOptions: SelectOption[];
  sectionsLoading: boolean;
  lessonDate: string;
  occurrenceOptions: SelectOption[];
  activeOccurrenceId: string;
  occurrencesLoading: boolean;
  occurrencesCount: number;
  onInstitutionChange: (institutionId: string) => void | Promise<void>;
  onAcademicYearChange: (academicYearId: string) => void | Promise<void>;
  onClassChange: (classId: string) => void | Promise<void>;
  onSectionChange: (sectionId: string) => void | Promise<void>;
  onDateChange: (date: string) => void | Promise<void>;
  onOccurrenceChange: (occurrenceId: string) => void | Promise<void>;
}

export function AttendanceFilters({
  attendanceMode,
  institutionId,
  institutionSelectOptions,
  clusterId,
  canReadInstitutions,
  institutionsLoading,
  institutionOptionsCount,
  academicYearId,
  academicYearOptions,
  academicYearsLoading,
  schoolClassId,
  classOptions,
  classesLoading,
  sectionId,
  sectionOptions,
  sectionsLoading,
  lessonDate,
  occurrenceOptions,
  activeOccurrenceId,
  occurrencesLoading,
  occurrencesCount,
  onInstitutionChange,
  onAcademicYearChange,
  onClassChange,
  onSectionChange,
  onDateChange,
  onOccurrenceChange,
}: AttendanceFiltersProps) {
  return (
    <div className="attendance-filters">
      <label className="attendance-field">
        <span>Institution</span>
        <Select<SelectOption, false>
          classNamePrefix="attendance-select"
          className="attendance-field__select"
          options={institutionSelectOptions}
          value={institutionSelectOptions.find((option) => option.value === institutionId) ?? null}
          onChange={(option) => void onInstitutionChange(option?.value ?? "")}
          isDisabled={!clusterId || !canReadInstitutions || institutionsLoading || institutionOptionsCount === 0}
          isLoading={institutionsLoading}
          isSearchable
          placeholder="Select institution"
          noOptionsMessage={() => "No institutions available"}
          styles={attendanceSelectStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </label>

      <label className="attendance-field">
        <span>Academic year</span>
        <Select<SelectOption, false>
          classNamePrefix="attendance-select"
          className="attendance-field__select"
          options={academicYearOptions}
          value={academicYearOptions.find((option) => option.value === academicYearId) ?? null}
          onChange={(option) => void onAcademicYearChange(option?.value ?? "")}
          isDisabled={!institutionId || academicYearsLoading}
          isLoading={academicYearsLoading}
          isSearchable
          placeholder="Select academic year"
          noOptionsMessage={() => "No academic years found"}
          styles={attendanceSelectStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </label>

      <label className="attendance-field">
        <span>Class</span>
        <Select<SelectOption, false>
          classNamePrefix="attendance-select"
          className="attendance-field__select"
          options={classOptions}
          value={classOptions.find((option) => option.value === schoolClassId) ?? null}
          onChange={(option) => void onClassChange(option?.value ?? "")}
          isDisabled={!academicYearId || classesLoading}
          isLoading={classesLoading}
          isSearchable
          placeholder="Select class"
          noOptionsMessage={() => "No classes found"}
          styles={attendanceSelectStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </label>

      <label className="attendance-field">
        <span>Section</span>
        <Select<SelectOption, false>
          classNamePrefix="attendance-select"
          className="attendance-field__select"
          options={sectionOptions}
          value={sectionOptions.find((option) => option.value === sectionId) ?? null}
          onChange={(option) => void onSectionChange(option?.value ?? "")}
          isDisabled={!schoolClassId || sectionsLoading}
          isLoading={sectionsLoading}
          isSearchable
          placeholder="Select section"
          noOptionsMessage={() => "No sections found"}
          styles={attendanceSelectStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </label>

      <label className="attendance-field attendance-field--date">
        <span>{attendanceMode === "daily" ? "Attendance date" : "Lesson date"}</span>
        <div className="attendance-date-control">
          <CalendarDays size={17} />
          <input
            type="date"
            value={lessonDate}
            onChange={(event) => void onDateChange(event.target.value)}
          />
        </div>
      </label>

      {attendanceMode === "lesson" && (
        <label className="attendance-field attendance-field--lesson">
          <span>Lesson occurrence</span>
          <Select<SelectOption, false>
            classNamePrefix="attendance-select"
            className="attendance-field__select"
            options={occurrenceOptions}
            value={occurrenceOptions.find((option) => option.value === activeOccurrenceId) ?? null}
            onChange={(option) => void onOccurrenceChange(option?.value ?? "")}
            isDisabled={!sectionId || occurrencesLoading || occurrencesCount === 0}
            isLoading={occurrencesLoading}
            isSearchable
            placeholder="Select lesson"
            noOptionsMessage={() => "No lesson occurrences found"}
            styles={attendanceSelectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </label>
      )}
    </div>
  );
}
