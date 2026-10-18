import Select from "react-select";
import { Users } from "lucide-react";

import type { UserScope } from "../api/user-administration-types";
import { displayScopeName, scopeTitle, type SelectOption } from "./user-management-utils";

type UserOrganizationScopesSectionProps = {
  scopes: UserScope[];
  canAssign: boolean;
  canRevoke: boolean;
  saving: boolean;
  availableOptions: SelectOption[];
  selectedScopeValue: string;
  onSelectedScopeChange: (value: string) => void;
  onAssign: () => Promise<void>;
  onRevoke: (scope: UserScope) => void;
};

export function UserOrganizationScopesSection({
  scopes,
  canAssign,
  canRevoke,
  saving,
  availableOptions,
  selectedScopeValue,
  onSelectedScopeChange,
  onAssign,
  onRevoke,
}: UserOrganizationScopesSectionProps) {
  return (
    <section className="ua-access-section">
      <div className="ua-section-title">
        <div>
          <h3>Organization scopes</h3>
          <p>Scopes limit the organization data the user can access.</p>
        </div>
        <span className="ua-count-pill">{scopes.length}</span>
      </div>

      {scopes.length === 0 ? (
        <p className="ua-inline-empty">No organization scopes are assigned.</p>
      ) : (
        <div className="ua-assignment-list">
          {scopes.map((scope, index) => (
            <div
              className="ua-assignment-row"
              key={`${scope.scopeType}-${scope.scopeId}-${index}`}
            >
              <div className="ua-assignment-icon ua-assignment-icon--scope">
                <Users size={17} />
              </div>
              <div className="ua-assignment-label">
                <strong>{displayScopeName(scope)}</strong>
                <span>{scopeTitle(scope.scopeType)}</span>
              </div>
              {canRevoke && (
                <button
                  type="button"
                  className="ua-remove-button"
                  onClick={() => void onRevoke(scope)}
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAssign && (
        <div className="ua-inline-assign">
          <Select<SelectOption, false>
            value={availableOptions.find((option) => option.value === selectedScopeValue) ?? null}
            options={availableOptions}
            onChange={(option) => onSelectedScopeChange(option?.value ?? "")}
            isSearchable={availableOptions.length > 5}
            classNamePrefix="ua-select"
            placeholder="Choose a scope to assign"
            noOptionsMessage={() => "No additional accessible scopes"}
          />
          <button
            type="button"
            className="ua-button ua-button--primary"
            onClick={() => void onAssign()}
            disabled={saving || !selectedScopeValue}
          >
            Assign scope
          </button>
        </div>
      )}
    </section>
  );
}
