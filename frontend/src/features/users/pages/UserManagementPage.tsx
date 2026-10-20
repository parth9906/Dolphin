import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { userAdministrationService } from "../api/user-administration-service";
import { organizationService } from "../../organization/api/organization-service";
import type { Enterprise, Region, Cluster, Institution } from "../../organization/api/organization-types";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserAccessDialog } from "./UserAccessDialog";
import { UserDirectoryControls } from "./UserDirectoryControls";
import { UserDirectoryTable } from "./UserDirectoryTable";
import { UserConfirmationDialog } from "./UserConfirmationDialog";

import type {
  OrganizationScopeType,
  Role,
  UserAccount,
  UserScope,
} from "../api/user-administration-types";

import {
  displayScopeName,
  emptyInvitation,
  errorText,
  PAGE_SIZE,
  toScopeOptions,
  unwrap,
  type InvitationForm,
  type PendingConfirmation,
  type ScopeOption,
  type SelectOption,
} from "./user-management-utils";

import "./user-management-page.css";

export function UserManagementPage() {
  const { user, accessContext, hasPermission } = useAuth();

  const canReadUsers = hasPermission("USER_READ");
  const canInviteUsers = hasPermission("USER_INVITATION_CREATE");
  const canAssignRoles = hasPermission("USER_ROLE_ASSIGN");
  const canRevokeRoles = hasPermission("USER_ROLE_REVOKE");
  const canAssignScopes = hasPermission("USER_SCOPE_ASSIGN");
  const canRevokeScopes = hasPermission("USER_SCOPE_REVOKE");

  const isPlatformAdmin = Boolean(
    accessContext?.roles.includes("PLATFORM_ADMIN"),
  );

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [scopeOptions, setScopeOptions] = useState<ScopeOption[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [directoryScope, setDirectoryScope] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [directoryLoadError, setDirectoryLoadError] = useState("");
  const directoryRequestId = useRef(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] =
    useState<InvitationForm>(emptyInvitation);
  const [inviteEnterprises, setInviteEnterprises] = useState<Enterprise[]>([]);
  const [inviteRegions, setInviteRegions] = useState<Region[]>([]);
  const [inviteClusters, setInviteClusters] = useState<Cluster[]>([]);
  const [inviteInstitutions, setInviteInstitutions] = useState<Institution[]>([]);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [selectedInstitutionIds, setSelectedInstitutionIds] = useState<string[]>([]);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [organizationError, setOrganizationError] = useState("");

  const [accessUser, setAccessUser] = useState<UserAccount | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userScopes, setUserScopes] = useState<UserScope[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [roleToAssign, setRoleToAssign] = useState("");
  const [scopeToAssign, setScopeToAssign] = useState("");

  const directoryScopeOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = [];

    if (isPlatformAdmin) {
      options.push({
        value: "ALL",
        label: "All organizations",
      });
    }

    options.push(...scopeOptions.map(({ value, label }) => ({
      value,
      label,
    })));

    return options;
  }, [isPlatformAdmin, scopeOptions]);

  const selectedDirectoryScope =
    directoryScopeOptions.find((option) => option.value === directoryScope)
    ?? null;

  const invitationRoleOptions = useMemo<SelectOption[]>(
    () => roles
      .filter((role) => role.active)
      .map((role) => ({
        value: role.id,
        label: `${role.name} (${role.code})`,
      })),
    [roles],
  );

  const selectedInvitationRole =
    invitationRoleOptions.find(
      (option) => option.value === inviteForm.roleId,
    ) ?? null;
  const selectedRoleCode = roles.find((role) => role.id === inviteForm.roleId)?.code;
  const isInstitutionAdminInvite = selectedRoleCode === "INSTITUTION_ADMIN";

  const invitationScopeOptions = useMemo<SelectOption[]>(
    () => scopeOptions.map(({ value, label }) => ({ value, label })),
    [scopeOptions],
  );

  const selectedInvitationScope =
    invitationScopeOptions.find(
      (option) => option.value === inviteForm.scopeValue,
    ) ?? null;

  const availableRoles = useMemo(
    () => roles.filter(
      (role) => role.active && !userRoles.some((assigned) => assigned.id === role.id),
    ),
    [roles, userRoles],
  );

  const availableRoleOptions = useMemo<SelectOption[]>(
    () => availableRoles.map((role) => ({
      value: role.id,
      label: `${role.name} (${role.code})`,
    })),
    [availableRoles],
  );

  const availableScopeOptions = useMemo<SelectOption[]>(
    () => scopeOptions
      .filter((option) => !userScopes.some(
        (assigned) =>
          assigned.scopeType === option.scopeType
          && assigned.scopeId === option.scopeId,
      ))
      .map(({ value, label }) => ({ value, label })),
    [scopeOptions, userScopes],
  );

  const canViewDirectory = canReadUsers && (
    isPlatformAdmin || scopeOptions.length > 0
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;

    async function loadAvailableScopes() {
      const ownScopes: UserScope[] = [];

      if (accessContext?.userId) {
        try {
          const response = await userAdministrationService.getUserScopes(
            accessContext.userId,
          );

          ownScopes.push(...response);
        } catch {
          // Access-context scopes remain a safe fallback for the UI.
        }
      }

      if (!ownScopes.length) {
        for (const scope of accessContext?.scopes ?? []) {
          if (scope.scopeType && scope.scopeId) {
            ownScopes.push({
              scopeType: scope.scopeType as OrganizationScopeType,
              scopeId: scope.scopeId,
            });
          }
        }
      }


      if (mounted) {
        const options = toScopeOptions(ownScopes);
        setScopeOptions(options);

        if (!isPlatformAdmin && options.length > 0) {
          setDirectoryScope((current) =>
            current === "ALL" ? options[0].value : current,
          );
        }

        setInviteForm((current) => ({
          ...current,
          scopeValue: current.scopeValue || options[0]?.value || "",
        }));
      }
    }

    void loadAvailableScopes();

    return () => {
      mounted = false;
    };
  }, [accessContext, isPlatformAdmin]);

  const loadDirectory = useCallback(async () => {
    const requestId = ++directoryRequestId.current;

    if (!canReadUsers) {
      setAccounts([]);
      setTotalElements(0);
      setTotalPages(0);
      setDirectoryLoadError("");
      setLoading(false);
      return;
    }

    if (!isPlatformAdmin && !scopeOptions.length) {
      setAccounts([]);
      setTotalElements(0);
      setTotalPages(0);
      setDirectoryLoadError("");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (activeFilter !== "ALL") {
      params.set("active", activeFilter);
    }

    if (directoryScope !== "ALL") {
      const selected = scopeOptions.find(
        (option) => option.value === directoryScope,
      );

      if (selected) {
        params.set("scopeType", selected.scopeType);
        params.set("scopeId", selected.scopeId);
      } else if (!isPlatformAdmin) {
        setAccounts([]);
        setLoading(false);
        return;
      }
    }

    params.set("page", String(page));
    params.set("size", String(PAGE_SIZE));


    setLoading(true);
    setDirectoryLoadError("");
    setError("");

    try {
      const response = await userAdministrationService.getDirectory(params);
      if (requestId !== directoryRequestId.current) return;
      const content = unwrap(response);

      setAccounts(content);

      if (!Array.isArray(response)) {
        setTotalElements(response.totalElements ?? content.length);
        setTotalPages(response.totalPages ?? 1);
      } else {
        setTotalElements(content.length);
        setTotalPages(1);
      }
    } catch (cause) {
      if (requestId !== directoryRequestId.current) return;
      const message = errorText(cause);
      setDirectoryLoadError(message);
      setError(message);
      // Preserve the last successful directory result instead of showing a false empty state.
    } finally {
      if (requestId === directoryRequestId.current) setLoading(false);
    }
  }, [
    canReadUsers,
    isPlatformAdmin,
    scopeOptions,
    search,
    activeFilter,
    directoryScope,
    page,
    refreshKey,
  ]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  const loadRoles = useCallback(async () => {
    const response = await userAdministrationService.getRoles();
    const available = unwrap(response);
    setRoles(available);
    return available;
  }, []);

  function openInvitation() {
    setError("");
    setNotice("");
    setOrganizationError("");
    setInviteForm({ ...emptyInvitation, scopeValue: scopeOptions[0]?.value ?? "" });
    setSelectedEnterpriseId("");
    setSelectedRegionId("");
    setSelectedClusterId("");
    setSelectedInstitutionIds([]);
    setInstitutionSearch("");
    setInviteRegions([]);
    setInviteClusters([]);
    setInviteInstitutions([]);
    setInviteOpen(true);

    void loadRoles()
      .then(async (available) => {
        const defaultRole =
          available.find((role) => role.code === (isPlatformAdmin ? "INSTITUTION_ADMIN" : "TEACHER"))
          ?? available.find((role) => role.active);

        if (defaultRole) {
          setInviteForm((current) => ({ ...current, roleId: defaultRole.id }));
        }

        if (isPlatformAdmin) {
          setOrganizationLoading(true);
          try {
            const enterprises = await organizationService.getEnterprises();
            setInviteEnterprises(enterprises);
          } catch (cause) {
            setOrganizationError(errorText(cause));
          } finally {
            setOrganizationLoading(false);
          }
        }
      })
      .catch((cause) => setError(errorText(cause)));
  }

  async function changeInviteEnterprise(id: string) {
    setSelectedEnterpriseId(id);
    setSelectedRegionId("");
    setSelectedClusterId("");
    setSelectedInstitutionIds([]);
    setInviteRegions([]);
    setInviteClusters([]);
    setInviteInstitutions([]);
    setOrganizationError("");
    if (!id) return;
    setOrganizationLoading(true);
    try {
      setInviteRegions(await organizationService.getRegions(id));
    } catch (cause) {
      setOrganizationError(errorText(cause));
    } finally {
      setOrganizationLoading(false);
    }
  }

  async function changeInviteRegion(id: string) {
    setSelectedRegionId(id);
    setSelectedClusterId("");
    setSelectedInstitutionIds([]);
    setInviteClusters([]);
    setInviteInstitutions([]);
    setOrganizationError("");
    if (!id) return;
    setOrganizationLoading(true);
    try {
      setInviteClusters(await organizationService.getClusters(id));
    } catch (cause) {
      setOrganizationError(errorText(cause));
    } finally {
      setOrganizationLoading(false);
    }
  }

  async function changeInviteCluster(id: string) {
    setSelectedClusterId(id);
    setSelectedInstitutionIds([]);
    setInviteInstitutions([]);
    setInstitutionSearch("");
    setOrganizationError("");
    if (!id) return;
    setOrganizationLoading(true);
    try {
      setInviteInstitutions(await organizationService.getInstitutions(id));
    } catch (cause) {
      setOrganizationError(errorText(cause));
    } finally {
      setOrganizationLoading(false);
    }
  }

  async function createInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvitationError("");
    setNotice("");

    if (!canInviteUsers) {
      setInvitationError("Your account does not have permission to invite users.");
      return;
    }

    if (!inviteForm.roleId) {
      setInvitationError("Select a role.");
      return;
    }

    const selectedScope = scopeOptions.find(
      (option) => option.value === inviteForm.scopeValue,
    );
    if (isInstitutionAdminInvite) {
      if (!isPlatformAdmin) {
        setInvitationError("Only an authorized platform administrator can initiate this institution-admin workflow.");
        return;
      }
      if (selectedInstitutionIds.length === 0) {
        setInvitationError("Select at least one institution.");
        return;
      }
      if (selectedInstitutionIds.some((id) => !inviteInstitutions.some((item) => item.id === id && item.active))) {
        setInvitationError("One or more selected institutions are no longer available. Review your selection.");
        return;
      }
    } else if (!selectedScope) {
      setInvitationError("Select a valid organization scope.");
      return;
    }

    setSaving(true);

    try {
      const baseRequest = {
        username: inviteForm.username.trim(),
        email: inviteForm.email.trim(),
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim() || null,
        roleId: inviteForm.roleId,
      };
      await userAdministrationService.createInvitation(
        isInstitutionAdminInvite
          ? {
              ...baseRequest,
              scopes: selectedInstitutionIds.map((scopeId) => ({
                scopeType: "INSTITUTION" as const,
                scopeId,
              })),
            }
          : {
              ...baseRequest,
              scopeType: selectedScope!.scopeType,
              scopeId: selectedScope!.scopeId,
            },
      );

      setInviteOpen(false);
      setInviteForm(emptyInvitation);
      setNotice(
        isInstitutionAdminInvite
          ? `Institution Admin invitation created for ${selectedInstitutionIds.length} institution${selectedInstitutionIds.length === 1 ? "" : "s"}.`
          : "Invitation created. The invitation email is handled by the backend.",
      );
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setInvitationError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  async function openAccessManagement(account: UserAccount) {
    setAccessUser(account);
    setAccessLoading(true);
    setError("");
    setNotice("");
    setUserRoles([]);
    setUserScopes([]);
    setRoleToAssign("");
    setScopeToAssign("");

    try {
      const results = await Promise.allSettled([
        userAdministrationService.getUserRoles(account.id),
        userAdministrationService.getUserScopes(account.id),
        loadRoles(),
      ]);

      if (results[0].status === "fulfilled") {
        setUserRoles(results[0].value);
      } else {
        throw results[0].reason;
      }

      if (results[1].status === "fulfilled") {
        setUserScopes(results[1].value);
      } else {
        throw results[1].reason;
      }
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setAccessLoading(false);
    }
  }

  async function assignRole() {
    if (!accessUser || !roleToAssign) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await userAdministrationService.assignRole(
        accessUser.id,
        roleToAssign,
      );

      const assigned = await userAdministrationService.getUserRoles(
        accessUser.id,
      );

      setUserRoles(assigned);
      setRoleToAssign("");
      setNotice("Role assigned.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  function revokeRole(role: Role) {
    if (!accessUser) {
      return;
    }

    const targetUserId = accessUser.id;
    const targetUsername = accessUser.username;

    setConfirmation({
      title: "Revoke assigned role?",
      description:
        `Remove the "${role.name}" role from @${targetUsername}? ` +
        "Their access to some parts of Dolphin may change immediately.",
      confirmLabel: "Revoke role",
      onConfirm: async () => {
        setSaving(true);
        setError("");

        try {
          await userAdministrationService.revokeRole(
            targetUserId,
            role.id,
          );

          const assigned =
            await userAdministrationService.getUserRoles(targetUserId);

          setUserRoles(assigned);
          setNotice(`The ${role.name} role was revoked.`);
          setConfirmation(null);
        } catch (cause) {
          setError(errorText(cause));
          setConfirmation(null);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  async function assignScope() {
    if (!accessUser || !scopeToAssign) {
      return;
    }

    const selected = scopeOptions.find(
      (option) => option.value === scopeToAssign,
    );

    if (!selected) {
      setError("Select a valid organization scope.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await userAdministrationService.assignScope(
        accessUser.id,
        selected.scopeType,
        selected.scopeId,
      );

      const assigned = await userAdministrationService.getUserScopes(
        accessUser.id,
      );

      setUserScopes(assigned);
      setScopeToAssign("");
      setNotice("Organization scope assigned.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  function revokeScope(scope: UserScope) {
    if (!accessUser) {
      return;
    }

    const targetUserId = accessUser.id;
    const targetUsername = accessUser.username;
    const label = displayScopeName(scope);

    setConfirmation({
      title: "Remove organization scope?",
      description:
        `Remove "${label}" access from @${targetUsername}? ` +
        "The user may lose access to data under this organization scope.",
      confirmLabel: "Remove scope",
      onConfirm: async () => {
        setSaving(true);
        setError("");

        try {
          await userAdministrationService.revokeScope(
            targetUserId,
            scope.scopeType,
            scope.scopeId,
          );

          const assigned =
            await userAdministrationService.getUserScopes(targetUserId);

          setUserScopes(assigned);
          setNotice(`The ${label} scope was removed.`);
          setConfirmation(null);
        } catch (cause) {
          setError(errorText(cause));
          setConfirmation(null);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function deactivateAccount(account: UserAccount) {
    if (account.id === user?.userId) {
      setError("You cannot deactivate your own account here.");
      return;
    }

    setConfirmation({
      title: "Deactivate user account?",
      description:
        `Deactivate @${account.username}? ` +
        "This account will lose access to Dolphin.",
      confirmLabel: "Deactivate account",
      onConfirm: async () => {
        setSaving(true);
        setError("");

        try {
          await userAdministrationService.deactivateUser(account.id);
          setNotice(`Account "${account.username}" has been deactivated.`);
          setConfirmation(null);
          setRefreshKey((value) => value + 1);
        } catch (cause) {
          setError(errorText(cause));
          setConfirmation(null);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function closeModals() {
    setInviteOpen(false);
    setAccessUser(null);
  }

  const directoryScopeLabel =
    selectedDirectoryScope?.label ?? "Organization scope";

  return (
    <div className="ua-page">
      <header className="ua-page-header">
        <div>
          <div className="ua-eyebrow">ADMINISTRATION</div>
          <h1>User Management</h1>
          <p>
            Manage user accounts, organization access, and invitations.
          </p>
        </div>

        <div className="ua-header-actions">
          <button
            type="button"
            className="ua-button ua-button--secondary"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {canInviteUsers && (
            <button
              type="button"
              className="ua-button ua-button--primary"
              onClick={openInvitation}
            >
              <UserPlus size={17} />
              Invite user
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="ua-alert ua-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="ua-alert ua-alert--success" role="status">
          <Check size={18} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <UserDirectoryControls
        totalElements={totalElements}
        activeOnPage={accounts.filter((account) => account.active).length}
        scopeLabel={directoryScopeLabel}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        activeFilter={activeFilter}
        onActiveFilterChange={(value) => {
          setActiveFilter(value);
          setPage(0);
        }}
        selectedDirectoryScope={selectedDirectoryScope}
        directoryScopeOptions={directoryScopeOptions}
        onDirectoryScopeChange={(value) => {
          setDirectoryScope(value);
          setPage(0);
        }}
      />

      {!canReadUsers ? (
        <section className="ua-empty-state">
          <Users size={30} />
          <h2>Directory access is not enabled</h2>
          <p>
            Your account can access only the user administration actions
            permitted by its assigned permissions.
          </p>
          {canInviteUsers && (
            <button
              type="button"
              className="ua-button ua-button--primary"
              onClick={openInvitation}
            >
              <UserPlus size={17} />
              Invite user
            </button>
          )}
        </section>
      ) : !canViewDirectory ? (
        <section className="ua-empty-state">
          <ShieldCheck size={30} />
          <h2>No organization scope available</h2>
          <p>
            A non-platform administrator must have an accessible organization
            scope before opening the user directory.
          </p>
        </section>
      ) : (
        <>
          <UserDirectoryTable
            accounts={accounts}
            loading={loading}
            loadError={directoryLoadError}
            saving={saving}
            totalElements={totalElements}
            page={page}
            totalPages={totalPages}
            currentUserId={user?.userId}
            canManageAccess={canAssignRoles || canRevokeRoles || canAssignScopes || canRevokeScopes}
            canDeactivateAccounts={hasPermission("USER_UPDATE")}
            onManageAccess={(account) => void openAccessManagement(account)}
            onDeactivate={(account) => void deactivateAccount(account)}
            onPageChange={setPage}
          />
        </>
      )}

      {inviteOpen && (
        <InviteUserDialog
          inviteForm={inviteForm}
          setInviteForm={setInviteForm}
          selectedInvitationRole={selectedInvitationRole}
          invitationRoleOptions={invitationRoleOptions}
          selectedInvitationScope={selectedInvitationScope}
          invitationScopeOptions={invitationScopeOptions}
          scopeOptionsCount={scopeOptions.length}
          isInstitutionAdminInvite={isInstitutionAdminInvite}
          enterprises={inviteEnterprises}
          regions={inviteRegions}
          clusters={inviteClusters}
          institutions={inviteInstitutions}
          selectedEnterpriseId={selectedEnterpriseId}
          selectedRegionId={selectedRegionId}
          selectedClusterId={selectedClusterId}
          selectedInstitutionIds={selectedInstitutionIds}
          institutionSearch={institutionSearch}
          organizationLoading={organizationLoading}
          organizationError={organizationError}
          onEnterpriseChange={(id) => void changeInviteEnterprise(id)}
          onRegionChange={(id) => void changeInviteRegion(id)}
          onClusterChange={(id) => void changeInviteCluster(id)}
          onInstitutionSelectionChange={setSelectedInstitutionIds}
          onInstitutionSearchChange={setInstitutionSearch}
          saving={saving}
          onSubmit={createInvitation}
          onClose={closeModals}
          invitationError={invitationError}
          setInvitationError={setInvitationError}
        />
      )}

      {accessUser && (
        <UserAccessDialog
          accessUser={accessUser}
          accessLoading={accessLoading}
          userRoles={userRoles}
          userScopes={userScopes}
          canRevokeRoles={canRevokeRoles}
          canAssignRoles={canAssignRoles}
          canRevokeScopes={canRevokeScopes}
          canAssignScopes={canAssignScopes}
          saving={saving}
          availableRoleOptions={availableRoleOptions}
          roleToAssign={roleToAssign}
          setRoleToAssign={setRoleToAssign}
          assignRole={assignRole}
          revokeRole={revokeRole}
          availableScopeOptions={availableScopeOptions}
          scopeToAssign={scopeToAssign}
          setScopeToAssign={setScopeToAssign}
          assignScope={assignScope}
          revokeScope={revokeScope}
          onClose={() => setAccessUser(null)}
        />
      )}

      {confirmation && (
        <UserConfirmationDialog
          confirmation={confirmation}
          saving={saving}
          onCancel={() => setConfirmation(null)}
        />
      )}

    </div>
  );
}
