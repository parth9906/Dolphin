import { Dropdown, type Option } from "./TimetableControls";

interface TimetableOrganizationScopeProps {
  institutionId: string;
  institutionOptions: Option[];
  institutionCount: number;
  onInstitutionChange: (value: string) => void;
  clusterId: string;
  canInstitutionRead: boolean;
  institutionsLoading: boolean;
  yearId: string;
  yearOptions: Option[];
  canYearRead: boolean;
  yearsLoading: boolean;
  hasAcademicYears: boolean;
  classId: string;
  classOptions: Option[];
  canClassRead: boolean;
  classesLoading: boolean;
  sectionId: string;
  sectionOptions: Option[];
  canSectionRead: boolean;
  sectionsLoading: boolean;
  onYearChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
}

export function TimetableOrganizationScope({
  institutionId,
  institutionOptions,
  institutionCount,
  onInstitutionChange,
  clusterId,
  canInstitutionRead,
  institutionsLoading,
  yearId,
  yearOptions,
  canYearRead,
  yearsLoading,
  hasAcademicYears,
  classId,
  classOptions,
  canClassRead,
  classesLoading,
  sectionId,
  sectionOptions,
  canSectionRead,
  sectionsLoading,
  onYearChange,
  onClassChange,
  onSectionChange,
}: TimetableOrganizationScopeProps) {
  return (
    <section className="timetable-panel timetable-scope">
      <div className="timetable-section-heading">
        <div>
          <h2>Organization and class</h2>
          <p>Select the institution and class you are configuring.</p>
        </div>
      </div>
      <div className="timetable-scope-grid">
        <Dropdown
          label="Institution"
          options={institutionOptions}
          value={institutionId}
          onChange={onInstitutionChange}
          disabled={!clusterId || !canInstitutionRead || institutionCount === 0}
          loading={institutionsLoading}
          placeholder="Select institution"
        />
        <Dropdown
          label="Academic year"
          options={yearOptions}
          value={yearId}
          onChange={onYearChange}
          disabled={!institutionId || !canYearRead}
          loading={yearsLoading}
          placeholder="Select academic year"
        />
        <Dropdown
          label="Class"
          options={classOptions}
          value={classId}
          onChange={onClassChange}
          disabled={!yearId || !canClassRead}
          loading={classesLoading}
          placeholder="Select class"
        />
        <Dropdown
          label="Section"
          options={sectionOptions}
          value={sectionId}
          onChange={onSectionChange}
          disabled={!classId || !canSectionRead}
          loading={sectionsLoading}
          placeholder="Select section"
        />
      </div>
      {!institutionId && (
        <div className="timetable-inline-message">
          Select an institution in Organization first, then return here.
        </div>
      )}
      {institutionId && !hasAcademicYears && !yearsLoading && canYearRead && (
        <div className="timetable-inline-message">
          No academic year is available for this institution. Create one in Academic Setup first.
        </div>
      )}
    </section>
  );
}
