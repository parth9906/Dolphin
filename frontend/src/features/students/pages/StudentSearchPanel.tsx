import type { FormEvent } from "react";
import { AlertCircle, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { Campus, Institution } from "../../organization/api/organization-types";
import { StudentSelect } from "./StudentSelect";

interface StudentSearchPanelProps {
  clusterId: string;
  institutionId: string;
  campusId: string;
  searchText: string;
  formError: string;
  canReadInstitutions: boolean;
  canReadCampuses: boolean;
  canReadOrganization: boolean;
  institutions: Institution[];
  campuses: Campus[];
  institutionsPending: boolean;
  institutionsError: boolean;
  campusesPending: boolean;
  campusesError: boolean;
  studentsFetching: boolean;
  onInstitutionChange: (institutionId: string) => void;
  onCampusChange: (campusId: string) => void;
  onSearchTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function StudentSearchPanel({
  clusterId,
  institutionId,
  campusId,
  searchText,
  formError,
  canReadInstitutions,
  canReadCampuses,
  canReadOrganization,
  institutions,
  campuses,
  institutionsPending,
  institutionsError,
  campusesPending,
  campusesError,
  studentsFetching,
  onInstitutionChange,
  onCampusChange,
  onSearchTextChange,
  onSubmit,
}: StudentSearchPanelProps) {
  return (
    <section className="student-panel">
      <div className="student-panel__header">
        <div className="student-panel__heading-icon" aria-hidden="true">
          <Search size={19} />
        </div>

        <div>
          <h2>Find students</h2>
          <p>Choose an institution and optionally narrow results to a campus.</p>
        </div>

        {canReadOrganization && (
          <Link to="/organization" className="student-secondary-link">
            Organization
            <ChevronRight size={15} />
          </Link>
        )}
      </div>

      <form className="student-search-form" onSubmit={onSubmit}>
        <div className="student-search-form__field">
          <label htmlFor="student-institution-id">
            Institution <span aria-hidden="true">*</span>
          </label>
          <StudentSelect
            id="student-institution-id"
            value={institutionId}
            onChange={onInstitutionChange}
            options={institutions.map((institution) => ({
              value: institution.id,
              label: `${institution.name} (${institution.code})`,
            }))}
            placeholder={
              !canReadInstitutions
                ? "Institution read permission required"
                : !clusterId
                  ? "Select a cluster in Organization first"
                  : institutionsPending
                    ? "Loading institutions..."
                    : institutionsError
                      ? "Unable to load institutions"
                      : "Select an institution"
            }
            searchPlaceholder="Search institutions..."
            emptyMessage="No institutions were found for this cluster."
            disabled={
              !canReadInstitutions || !clusterId || institutionsPending || institutionsError
            }
          />
          {clusterId && institutionsError && (
            <p className="student-form-hint student-form-hint--error">
              Institutions could not be loaded. Refresh the page or try again later.
            </p>
          )}
          {!clusterId && (
            <p className="student-form-hint">
              Open Organization, select a cluster, and return here to choose an institution.
            </p>
          )}
        </div>

        <div className="student-search-form__field">
          <label htmlFor="student-campus-id">Campus</label>
          <StudentSelect
            id="student-campus-id"
            value={campusId}
            onChange={onCampusChange}
            options={campuses.map((campus) => ({
              value: campus.id,
              label: `${campus.name} (${campus.code})`,
            }))}
            placeholder={
              !canReadCampuses
                ? "Campus read permission required"
                : !institutionId
                  ? "Select an institution first"
                  : campusesPending
                    ? "Loading campuses..."
                    : campusesError
                      ? "Unable to load campuses"
                      : "All campuses"
            }
            searchPlaceholder="Search campuses..."
            emptyMessage="No campuses were found for this institution."
            disabled={
              !institutionId || !canReadCampuses || campusesPending || campusesError
            }
          />
          {campusesError && institutionId && (
            <p className="student-form-hint student-form-hint--error">
              Campuses could not be loaded. Check your permissions or try again later.
            </p>
          )}
        </div>

        <div className="student-search-form__field student-search-form__field--search">
          <label htmlFor="student-search">Search students</label>
          <input
            id="student-search"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Name or admission number"
            autoComplete="off"
          />
        </div>

        <div className="student-search-form__actions">
          <button
            type="submit"
            className="student-primary-button"
            disabled={studentsFetching || !institutionId || !canReadInstitutions}
          >
            <Search size={16} />
            Search
          </button>
        </div>

        {formError && (
          <p className="student-form-error" role="alert">
            <AlertCircle size={15} />
            {formError}
          </p>
        )}
      </form>
    </section>
  );
}
