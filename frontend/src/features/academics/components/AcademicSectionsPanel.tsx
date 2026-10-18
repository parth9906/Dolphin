import type { FormEvent } from "react";
import Select from "react-select";
import { Layers3, LoaderCircle, Plus, RefreshCw } from "lucide-react";

import type { ClassSection } from "../api/academic-types";
import { AcademicQueryError } from "./AcademicQueryError";
import { FormField, selectStyles, type Option } from "./academic-ui";

interface AcademicSectionsPanelProps {
  yearId: string;
  yearOptions: Option[];
  classId: string;
  classOptions: Option[];
  sections: ClassSection[];
  campuses: Option[];
  canReadYears: boolean;
  canReadClasses: boolean;
  canReadSections: boolean;
  canCreateSection: boolean;
  yearsLoading: boolean;
  classesLoading: boolean;
  sectionsLoading: boolean;
  sectionsError: string;
  sectionsRetrying: boolean;
  onRetrySections: () => void;
  campusesLoading: boolean;
  campusesError: string;
  campusesRetrying: boolean;
  onRetryCampuses: () => void;
  saving: boolean;
  sectionName: string;
  onSectionNameChange: (value: string) => void;
  campusId: string;
  onCampusChange: (value: string) => void;
  capacity: string;
  onCapacityChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onYearChange: (yearId: string) => void;
  onClassChange: (classId: string) => void;
  onManageEnrollment: (section: ClassSection) => void;
}

export function AcademicSectionsPanel({
  yearId,
  yearOptions,
  classId,
  classOptions,
  sections,
  campuses,
  canReadYears,
  canReadClasses,
  canReadSections,
  canCreateSection,
  yearsLoading,
  classesLoading,
  sectionsLoading,
  sectionsError,
  sectionsRetrying,
  onRetrySections,
  campusesLoading,
  campusesError,
  campusesRetrying,
  onRetryCampuses,
  saving,
  sectionName,
  onSectionNameChange,
  campusId,
  onCampusChange,
  capacity,
  onCapacityChange,
  onSubmit,
  onYearChange,
  onClassChange,
  onManageEnrollment,
}: AcademicSectionsPanelProps) {
  return (
    <div className="academic-workspace">
      <div className="academic-section-heading">
        <div>
          <h2>Sections</h2>
          <p>Organize each class into sections and optionally assign a campus.</p>
        </div>
        <span className="academic-result-count">
          {sections.length} section{sections.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="academic-selector-row">
        <FormField label="Academic year">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={yearOptions}
            value={yearOptions.find((item) => item.value === yearId) ?? null}
            onChange={(option) => onYearChange(option?.value ?? "")}
            isDisabled={!canReadYears}
            isLoading={yearsLoading}
            isSearchable
            placeholder="Select academic year"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
        <FormField label="Class">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={classOptions}
            value={classOptions.find((item) => item.value === classId) ?? null}
            onChange={(option) => onClassChange(option?.value ?? "")}
            isDisabled={!yearId || !canReadClasses}
            isLoading={classesLoading}
            isSearchable
            placeholder="Select class"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
      </div>

      {canCreateSection && classId && (
        <form className="academic-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> Create section</h3>
          <div className="academic-form-grid academic-form-grid--three">
            <FormField label="Section name">
              <input
                required
                maxLength={50}
                value={sectionName}
                onChange={(event) => onSectionNameChange(event.target.value)}
                placeholder="e.g. A"
              />
            </FormField>
            <FormField label="Campus (optional)">
              <Select<Option, false>
                classNamePrefix="academic-select"
                options={campuses}
                value={campuses.find((item) => item.value === campusId) ?? null}
                onChange={(option) => onCampusChange(option?.value ?? "")}
                isLoading={campusesLoading}
                isClearable
                isSearchable
                placeholder="No specific campus"
                noOptionsMessage={() => "No campuses available"}
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </FormField>
            <FormField label="Capacity (optional)">
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => onCapacityChange(event.target.value)}
                placeholder="e.g. 40"
              />
            </FormField>
          </div>
          <div className="academic-form-actions">
            <button className="academic-primary-button" type="submit" disabled={saving}>
              {saving ? <LoaderCircle size={16} className="academic-spin" /> : <Plus size={16} />}
              Create section
            </button>
          </div>
        </form>
      )}

      {classId && canCreateSection && campusesError && (
        <AcademicQueryError
          message={campusesError}
          retrying={campusesRetrying}
          onRetry={onRetryCampuses}
          retryLabel="campus options"
        />
      )}

      {!classId && (
        <div className="academic-inline-message">Select a class to view or create sections.</div>
      )}

      {sectionsLoading && (
        <div className="academic-loading" role="status" aria-live="polite">
          <RefreshCw size={19} className="academic-spin" /> Loading sections…
        </div>
      )}

      {classId && canReadSections && !sectionsLoading && sectionsError && (
        <AcademicQueryError
          message={sectionsError}
          retrying={sectionsRetrying}
          onRetry={onRetrySections}
          retryLabel="sections"
        />
      )}

      {classId && canReadSections && !sectionsLoading && !sectionsError && sections.length === 0 && (
        <div className="academic-empty">
          <Layers3 size={27} />
          <strong>No sections in this class</strong>
          <p>Create the first section above.</p>
        </div>
      )}

      {canReadSections && sections.length > 0 && (
        <div className="academic-table-wrap">
          <table className="academic-table">
            <caption className="academic-sr-only">Sections in the selected class</caption>
            <thead>
              <tr>
                <th scope="col">Section</th>
                <th scope="col">Capacity</th>
                <th scope="col">Enrolled</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="academic-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.capacity ?? "Not set"}</td>
                  <td>{item.activeEnrollmentCount}</td>
                  <td>
                    <span className={`academic-status ${item.active ? "academic-status--active" : "academic-status--closed"}`}>
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="academic-secondary-button"
                      onClick={() => onManageEnrollment(item)}
                      aria-label={`Manage enrollment for section ${item.name}`}
                    >
                      Manage enrollment
                    </button>
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
