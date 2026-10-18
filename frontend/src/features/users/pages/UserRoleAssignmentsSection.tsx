import Select from "react-select";
import { ShieldCheck } from "lucide-react";

import type { Role } from "../api/user-administration-types";
import type { SelectOption } from "./user-management-utils";

type UserRoleAssignmentsSectionProps = {
  roles: Role[];
  canAssign: boolean;
  canRevoke: boolean;
  saving: boolean;
  availableOptions: SelectOption[];
  selectedRoleId: string;
  onSelectedRoleChange: (value: string) => void;
  onAssign: () => Promise<void>;
  onRevoke: (role: Role) => void;
};

export function UserRoleAssignmentsSection({
  roles,
  canAssign,
  canRevoke,
  saving,
  availableOptions,
  selectedRoleId,
  onSelectedRoleChange,
  onAssign,
  onRevoke,
}: UserRoleAssignmentsSectionProps) {
  return (
    <section className="ua-access-section">
      <div className="ua-section-title">
        <div>
          <h3>Assigned roles</h3>
          <p>Roles determine which actions this user can perform.</p>
        </div>
        <span className="ua-count-pill">{roles.length}</span>
      </div>

      {roles.length === 0 ? (
        <p className="ua-inline-empty">No roles are assigned.</p>
      ) : (
        <div className="ua-assignment-list">
          {roles.map((role) => (
            <div className="ua-assignment-row" key={role.id}>
              <div className="ua-assignment-icon">
                <ShieldCheck size={17} />
              </div>
              <div className="ua-assignment-label">
                <strong>{role.name}</strong>
                <span>{role.code}</span>
              </div>
              {canRevoke && (
                <button
                  type="button"
                  className="ua-remove-button"
                  onClick={() => void onRevoke(role)}
                  disabled={saving}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAssign && (
        <div className="ua-inline-assign">
          <Select<SelectOption, false>
            value={availableOptions.find((option) => option.value === selectedRoleId) ?? null}
            options={availableOptions}
            onChange={(option) => onSelectedRoleChange(option?.value ?? "")}
            isSearchable
            classNamePrefix="ua-select"
            placeholder="Choose a role to assign"
            noOptionsMessage={() => "No additional active roles"}
          />
          <button
            type="button"
            className="ua-button ua-button--primary"
            onClick={() => void onAssign()}
            disabled={saving || !selectedRoleId}
          >
            Assign role
          </button>
        </div>
      )}
    </section>
  );
}
