import Select from "react-select";

import { FormField, type Option, selectStyles } from "./academic-ui";
import { AcademicQueryError } from "./AcademicQueryError";

interface AcademicOrganizationScopePanelProps {
  institutionId: string;
  institutionOptions: Option[];
  institutionName: string;
  isLoading: boolean;
  isDisabled: boolean;
  institutionError: string;
  institutionRetrying: boolean;
  onRetryInstitution: () => void;
  hasCluster: boolean;
  canReadInstitution: boolean;
  onInstitutionChange: (institutionId: string) => void;
}

export function AcademicOrganizationScopePanel({
  institutionId,
  institutionOptions,
  institutionName,
  isLoading,
  isDisabled,
  institutionError,
  institutionRetrying,
  onRetryInstitution,
  hasCluster,
  canReadInstitution,
  onInstitutionChange,
}: AcademicOrganizationScopePanelProps) {
  return (
    <section className="academic-panel academic-context-panel">
      <div className="academic-section-heading">
        <div>
          <h2>Organization scope</h2>
          <p>Choose the institution where you want to configure academic data.</p>
        </div>
      </div>

      <div className="academic-context-select">
        <FormField label="Institution">
          <Select<Option, false>
            classNamePrefix="academic-select"
            options={institutionOptions}
            value={institutionOptions.find((item) => item.value === institutionId) ?? null}
            onChange={(option) => onInstitutionChange(option?.value ?? "")}
            isLoading={isLoading}
            isDisabled={isDisabled}
            isSearchable
            placeholder="Select institution"
            noOptionsMessage={() => "No institutions available"}
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </FormField>
        {institutionId && (
          <p className="academic-scope-note">
            Current scope: <strong>{institutionName}</strong>
          </p>
        )}
      </div>

      <AcademicQueryError
        message={institutionError}
        retrying={institutionRetrying}
        onRetry={onRetryInstitution}
        retryLabel="institution options"
      />

      {!institutionId && !institutionError && (
        <div className="academic-inline-message">
          Select an institution in the Organization area first, then return here.
        </div>
      )}

      {!canReadInstitution && hasCluster && (
        <div className="academic-inline-message">
          Institution selection requires INSTITUTION_READ permission.
        </div>
      )}
    </section>
  );
}
