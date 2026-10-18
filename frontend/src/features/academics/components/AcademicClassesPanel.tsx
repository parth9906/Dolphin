import type { FormEvent } from "react";
import Select from "react-select";
import { BookOpen, LoaderCircle, Plus, RefreshCw } from "lucide-react";

import type { SchoolClass } from "../api/academic-types";
import { AcademicQueryError } from "./AcademicQueryError";
import { FormField, selectStyles, type Option } from "./academic-ui";

interface AcademicClassesPanelProps {
  institutionId: string;
  yearId: string;
  yearOptions: Option[];
  classes: SchoolClass[];
  canReadYears: boolean;
  canReadClasses: boolean;
  canCreateClass: boolean;
  canUpdateClass: boolean;
  loading: boolean;
  queryError: string;
  retrying: boolean;
  onRetry: () => void;
  saving: boolean;
  className: string;
  onClassNameChange: (value: string) => void;
  classCode: string;
  onClassCodeChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  editingClassId: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onYearChange: (yearId: string) => void;
  onCancelEdit: () => void;
  onEditClass: (schoolClass: SchoolClass) => void;
  onViewSections: (schoolClass: SchoolClass) => void;
}

export function AcademicClassesPanel({
  institutionId,
  yearId,
  yearOptions,
  classes,
  canReadYears,
  canReadClasses,
  canCreateClass,
  canUpdateClass,
  loading,
  queryError,
  retrying,
  onRetry,
  saving,
  className,
  onClassNameChange,
  classCode,
  onClassCodeChange,
  sortOrder,
  onSortOrderChange,
  editingClassId,
  onSubmit,
  onYearChange,
  onCancelEdit,
  onEditClass,
  onViewSections,
}: AcademicClassesPanelProps) {
  return (
    <div className="academic-workspace">
      <div className="academic-section-heading">
        <div>
          <h2>Classes</h2>
          <p>Classes belong to a specific academic year.</p>
        </div>
        <span className="academic-result-count">
          {classes.length} class{classes.length === 1 ? "" : "es"}
        </span>
      </div>

      <div className="academic-selector-row">
        <FormField label="Academic year">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={yearOptions}
            value={yearOptions.find((item) => item.value === yearId) ?? null}
            onChange={(option) => onYearChange(option?.value ?? "")}
            isDisabled={!canReadYears || !institutionId}
            isSearchable
            placeholder="Select academic year"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
      </div>

      {(canCreateClass || (Boolean(editingClassId) && canUpdateClass)) && yearId && (
        <form className="academic-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> {editingClassId ? "Edit class" : "Create class"}</h3>
          <div className="academic-form-grid academic-form-grid--three">
            <FormField label="Class name">
              <input
                required
                maxLength={80}
                value={className}
                onChange={(event) => onClassNameChange(event.target.value)}
                placeholder="e.g. Class 10"
              />
            </FormField>
            <FormField label="Class code">
              <input
                required
                maxLength={30}
                value={classCode}
                onChange={(event) => onClassCodeChange(event.target.value)}
                placeholder="e.g. CLASS-10"
              />
            </FormField>
            <FormField label="Sort order">
              <input
                required
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) => onSortOrderChange(event.target.value)}
              />
            </FormField>
          </div>
          <div className="academic-form-actions">
            <button className="academic-primary-button" type="submit" disabled={saving}>
              {saving ? <LoaderCircle size={16} className="academic-spin" /> : !editingClassId ? <Plus size={16} /> : null}
              {editingClassId ? "Save changes" : "Create class"}
            </button>
            {editingClassId && (
              <button
                type="button"
                className="academic-secondary-button"
                disabled={saving}
                onClick={onCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!yearId && (
        <div className="academic-inline-message">
          Select an academic year to view or create classes.
        </div>
      )}

      {loading && (
        <div className="academic-loading" role="status" aria-live="polite">
          <RefreshCw size={19} className="academic-spin" /> Loading classes…
        </div>
      )}

      {yearId && canReadClasses && !loading && queryError && (
        <AcademicQueryError
          message={queryError}
          retrying={retrying}
          onRetry={onRetry}
          retryLabel="classes"
        />
      )}

      {yearId && canReadClasses && !loading && !queryError && classes.length === 0 && (
        <div className="academic-empty">
          <BookOpen size={27} />
          <strong>No classes in this academic year</strong>
          <p>Create the first class above.</p>
        </div>
      )}

      {canReadClasses && classes.length > 0 && (
        <div className="academic-table-wrap">
          <table className="academic-table">
            <caption className="academic-sr-only">Classes in the selected academic year</caption>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Code</th>
                <th scope="col">Sort order</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="academic-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.code}</td>
                  <td>{item.sortOrder}</td>
                  <td>
                    <span className={`academic-status ${item.active ? "academic-status--active" : "academic-status--closed"}`}>
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="academic-row-actions">
                      {canUpdateClass && (
                        <button
                          type="button"
                          className="academic-secondary-button"
                          onClick={() => onEditClass(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="academic-secondary-button"
                        onClick={() => onViewSections(item)}
                        aria-label={`View sections for ${item.name}`}
                      >
                        View sections
                      </button>
                    </div>
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
