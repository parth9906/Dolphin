import { LoaderCircle, X } from "lucide-react";

import type { Role, UserAccount, UserScope } from "../api/user-administration-types";
import type { SelectOption } from "./user-management-utils";
import { UserRoleAssignmentsSection } from "./UserRoleAssignmentsSection";
import { UserOrganizationScopesSection } from "./UserOrganizationScopesSection";

type UserAccessDialogProps = {
  accessUser: UserAccount;
  accessLoading: boolean;
  userRoles: Role[];
  userScopes: UserScope[];
  canRevokeRoles: boolean;
  canAssignRoles: boolean;
  canRevokeScopes: boolean;
  canAssignScopes: boolean;
  saving: boolean;
  availableRoleOptions: SelectOption[];
  roleToAssign: string;
  setRoleToAssign: (value: string) => void;
  assignRole: () => Promise<void>;
  revokeRole: (role: Role) => void;
  availableScopeOptions: SelectOption[];
  scopeToAssign: string;
  setScopeToAssign: (value: string) => void;
  assignScope: () => Promise<void>;
  revokeScope: (scope: UserScope) => void;
  onClose: () => void;
};

export function UserAccessDialog({
  accessUser,
  accessLoading,
  userRoles,
  userScopes,
  canRevokeRoles,
  canAssignRoles,
  canRevokeScopes,
  canAssignScopes,
  saving,
  availableRoleOptions,
  roleToAssign,
  setRoleToAssign,
  assignRole,
  revokeRole,
  availableScopeOptions,
  scopeToAssign,
  setScopeToAssign,
  assignScope,
  revokeScope,
  onClose,
}: UserAccessDialogProps) {
  return (
        <div className="ua-modal-backdrop" role="presentation">
          <section
            className="ua-modal ua-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ua-access-title"
          >
            <header className="ua-modal-header">
              <div>
                <span className="ua-modal-kicker">ACCESS CONTROL</span>
                <h2 id="ua-access-title">Manage access</h2>
                <p>
                  Roles and organization scopes for @{accessUser.username}.
                </p>
              </div>
              <button
                type="button"
                className="ua-close-button"
                onClick={onClose}
                aria-label="Close access dialog"
              >
                <X size={19} />
              </button>
            </header>

            {accessLoading ? (
              <div className="ua-dialog-loading">
                <LoaderCircle size={24} className="ua-spin" />
                <span>Loading assigned access…</span>
              </div>
            ) : (
              <div className="ua-access-content">
                <UserRoleAssignmentsSection
                  roles={userRoles}
                  canAssign={canAssignRoles}
                  canRevoke={canRevokeRoles}
                  saving={saving}
                  availableOptions={availableRoleOptions}
                  selectedRoleId={roleToAssign}
                  onSelectedRoleChange={setRoleToAssign}
                  onAssign={assignRole}
                  onRevoke={revokeRole}
                />

                <UserOrganizationScopesSection
                  scopes={userScopes}
                  canAssign={canAssignScopes}
                  canRevoke={canRevokeScopes}
                  saving={saving}
                  availableOptions={availableScopeOptions}
                  selectedScopeValue={scopeToAssign}
                  onSelectedScopeChange={setScopeToAssign}
                  onAssign={assignScope}
                  onRevoke={revokeScope}
                />
              </div>
            )}

            <footer className="ua-modal-footer">
              <button
                type="button"
                className="ua-button ua-button--secondary"
                onClick={onClose}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
  );
}
