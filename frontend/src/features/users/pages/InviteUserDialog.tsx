import type { FormEvent } from "react";
import Select from "react-select";
import type { Enterprise, Region, Cluster, Institution } from "../../organization/api/organization-types";
import { LoaderCircle, Mail, X } from "lucide-react";

import type { InvitationForm, SelectOption } from "./user-management-utils";

type InviteUserDialogProps = {
  inviteForm: InvitationForm;
  setInviteForm: (updater: (current: InvitationForm) => InvitationForm) => void;
  selectedInvitationRole: SelectOption | null;
  invitationRoleOptions: SelectOption[];
  selectedInvitationScope: SelectOption | null;
  invitationScopeOptions: SelectOption[];
  scopeOptionsCount: number;
  isInstitutionAdminInvite: boolean;
  enterprises: Enterprise[];
  regions: Region[];
  clusters: Cluster[];
  institutions: Institution[];
  selectedEnterpriseId: string;
  selectedRegionId: string;
  selectedClusterId: string;
  selectedInstitutionIds: string[];
  institutionSearch: string;
  organizationLoading: boolean;
  organizationError: string;
  onEnterpriseChange: (id: string) => void;
  onRegionChange: (id: string) => void;
  onClusterChange: (id: string) => void;
  onInstitutionSelectionChange: (ids: string[]) => void;
  onInstitutionSearchChange: (value: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function InviteUserDialog({
  inviteForm,
  setInviteForm,
  selectedInvitationRole,
  invitationRoleOptions,
  selectedInvitationScope,
  invitationScopeOptions,
  scopeOptionsCount,
  isInstitutionAdminInvite,
  enterprises,
  regions,
  clusters,
  institutions,
  selectedEnterpriseId,
  selectedRegionId,
  selectedClusterId,
  selectedInstitutionIds,
  institutionSearch,
  organizationLoading,
  organizationError,
  onEnterpriseChange,
  onRegionChange,
  onClusterChange,
  onInstitutionSelectionChange,
  onInstitutionSearchChange,
  saving,
  onSubmit,
  onClose,
}: InviteUserDialogProps) {
  return (
    <div className="ua-modal-backdrop" role="presentation">
      <section
        className="ua-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ua-invite-title"
      >
        <header className="ua-modal-header">
          <div>
            <span className="ua-modal-kicker">ACCOUNT INVITATION</span>
            <h2 id="ua-invite-title">Invite a user</h2>
            <p>Invite a user and assign the role and organization access they need.</p>
          </div>
          <button
            type="button"
            className="ua-close-button"
            onClick={onClose}
            aria-label="Close invitation dialog"
          >
            <X size={19} />
          </button>
        </header>

        <form className="ua-form" onSubmit={onSubmit}>
          <div className="ua-form-grid">
            <div className="ua-field">
              <label htmlFor="ua-first-name">First name *</label>
              <input
                id="ua-first-name"
                required
                maxLength={100}
                value={inviteForm.firstName}
                onChange={(event) => setInviteForm((current) => ({ ...current, firstName: event.target.value }))}
              />
            </div>
            <div className="ua-field">
              <label htmlFor="ua-last-name">Last name</label>
              <input
                id="ua-last-name"
                maxLength={100}
                value={inviteForm.lastName}
                onChange={(event) => setInviteForm((current) => ({ ...current, lastName: event.target.value }))}
              />
            </div>
            <div className="ua-field ua-field--full">
              <label htmlFor="ua-username">Username *</label>
              <input
                id="ua-username"
                required
                maxLength={100}
                autoComplete="username"
                value={inviteForm.username}
                onChange={(event) => setInviteForm((current) => ({ ...current, username: event.target.value }))}
              />
            </div>
            <div className="ua-field ua-field--full">
              <label htmlFor="ua-email">Email address *</label>
              <input
                id="ua-email"
                required
                type="email"
                maxLength={255}
                autoComplete="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div className="ua-field ua-field--full">
              <label>Initial role *</label>
              <Select<SelectOption, false>
                value={selectedInvitationRole}
                options={invitationRoleOptions}
                onChange={(option) => setInviteForm((current) => ({ ...current, roleId: option?.value ?? "" }))}
                isSearchable
                classNamePrefix="ua-select"
                placeholder="Choose a role"
                noOptionsMessage={() => "No active roles available"}
              />
            </div>
            {isInstitutionAdminInvite ? (
              <div className="ua-field ua-field--full ua-institution-assignment">
                <div>
                  <label>Assign institutions *</label>
                  <p className="ua-field-help">Choose one or more institutions this administrator can manage.</p>
                </div>
                <div className="ua-hierarchy-grid">
                  <div className="ua-field">
                    <label htmlFor="ua-enterprise">Enterprise</label>
                    <select id="ua-enterprise" value={selectedEnterpriseId} onChange={(event) => onEnterpriseChange(event.target.value)} disabled={organizationLoading}>
                      <option value="">Choose enterprise</option>
                      {enterprises.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
                    </select>
                  </div>
                  <div className="ua-field">
                    <label htmlFor="ua-region">Region</label>
                    <select id="ua-region" value={selectedRegionId} onChange={(event) => onRegionChange(event.target.value)} disabled={!selectedEnterpriseId || organizationLoading}>
                      <option value="">Choose region</option>
                      {regions.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
                    </select>
                  </div>
                  <div className="ua-field">
                    <label htmlFor="ua-cluster">Cluster</label>
                    <select id="ua-cluster" value={selectedClusterId} onChange={(event) => onClusterChange(event.target.value)} disabled={!selectedRegionId || organizationLoading}>
                      <option value="">Choose cluster</option>
                      {clusters.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
                    </select>
                  </div>
                </div>
                <div className="ua-institution-picker">
                  <label htmlFor="ua-institution-search">Search institutions</label>
                  <input id="ua-institution-search" type="search" value={institutionSearch} onChange={(event) => onInstitutionSearchChange(event.target.value)} placeholder="Search by institution name or code" disabled={!selectedClusterId || organizationLoading} />
                  {organizationLoading && <p className="ua-field-help" role="status">Loading organization options…</p>}
                  {organizationError && <p className="ua-field-error" role="alert">{organizationError}</p>}
                  {!organizationLoading && selectedClusterId && institutions.length === 0 && !organizationError && <p className="ua-field-help">No active institutions found in this cluster.</p>}
                  {selectedClusterId && institutions.length > 0 && (
                    <div className="ua-institution-options" role="group" aria-label="Select institutions">
                      {institutions.filter((item) => item.active && `${item.name} ${item.code}`.toLowerCase().includes(institutionSearch.trim().toLowerCase())).map((item) => (
                        <label className="ua-institution-option" key={item.id}>
                          <input type="checkbox" checked={selectedInstitutionIds.includes(item.id)} onChange={(event) => onInstitutionSelectionChange(event.target.checked ? [...selectedInstitutionIds, item.id] : selectedInstitutionIds.filter((id) => id !== item.id))} />
                          <span><strong>{item.name}</strong><small>{item.code} · {item.institutionType}</small></span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="ua-selected-institutions" aria-live="polite">
                    <strong>{selectedInstitutionIds.length} institution{selectedInstitutionIds.length === 1 ? "" : "s"} selected</strong>
                    {institutions.filter((item) => selectedInstitutionIds.includes(item.id)).map((item) => <span key={item.id}>{item.name}</span>)}
                  </div>
                </div>
                <span className="ua-field-help">The backend validates every institution assignment and your permission to grant access.</span>
              </div>
            ) : (
              <div className="ua-field ua-field--full">
                <label>Organization scope *</label>
                <Select<SelectOption, false>
                  value={selectedInvitationScope}
                  options={invitationScopeOptions}
                  onChange={(option) => setInviteForm((current) => ({ ...current, scopeValue: option?.value ?? "" }))}
                  isSearchable={scopeOptionsCount > 5}
                  classNamePrefix="ua-select"
                  placeholder="Choose an organization scope"
                  noOptionsMessage={() => "No accessible scopes available"}
                />
                <span className="ua-field-help">The backend validates the selected scope and your access.</span>
              </div>
            )}
          </div>
          <footer className="ua-modal-footer">
            <button type="button" className="ua-button ua-button--secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="ua-button ua-button--primary"
              disabled={saving || !inviteForm.roleId || (isInstitutionAdminInvite ? selectedInstitutionIds.length === 0 : !inviteForm.scopeValue)}
            >
              {saving ? <LoaderCircle size={17} className="ua-spin" /> : <Mail size={17} />}
              Send invitation
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
