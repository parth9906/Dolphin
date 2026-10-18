import { ChevronLeft, ChevronRight, LoaderCircle, ShieldCheck, Users, X } from "lucide-react";

import type { UserAccount } from "../api/user-administration-types";

interface UserDirectoryTableProps {
  accounts: UserAccount[];
  loading: boolean;
  loadError: string;
  saving: boolean;
  totalElements: number;
  page: number;
  totalPages: number;
  currentUserId?: string;
  canManageAccess: boolean;
  canDeactivateAccounts: boolean;
  onManageAccess: (account: UserAccount) => void;
  onDeactivate: (account: UserAccount) => void;
  onPageChange: (updater: (current: number) => number) => void;
}

export function UserDirectoryTable({
  accounts,
  loading,
  loadError,
  saving,
  totalElements,
  page,
  totalPages,
  currentUserId,
  canManageAccess,
  canDeactivateAccounts,
  onManageAccess,
  onDeactivate,
  onPageChange,
}: UserDirectoryTableProps) {
  return (
    <section className="ua-table-card">
      <div className="ua-table-header">
        <div>
          <h2>Accounts</h2>
          <p>
            {loading
              ? "Loading accounts…"
              : `${totalElements} matching account${totalElements === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading && (
          <LoaderCircle className="ua-spin" size={20} aria-label="Loading" />
        )}
      </div>

      <div className="ua-table-wrap">
        <table className="ua-table">
          <caption className="ua-sr-only">User accounts and available actions</caption>
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Email</th>
              <th scope="col">Status</th>
              <th scope="col" className="ua-actions-heading">Actions</th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <div className="ua-user-cell">
                    <span className="ua-avatar">
                      {(account.firstName || account.username).charAt(0).toUpperCase()}
                    </span>
                    <span className="ua-user-names">
                      <strong>
                        {[account.firstName, account.lastName].filter(Boolean).join(" ") || account.username}
                      </strong>
                      <span>@{account.username}</span>
                    </span>
                  </div>
                </td>
                <td>{account.email || "—"}</td>
                <td>
                  <span className={account.active ? "ua-status ua-status--active" : "ua-status ua-status--inactive"}>
                    <span />
                    {account.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="ua-row-actions">
                    {canManageAccess && (
                      <button
                        type="button"
                        className="ua-icon-text-button"
                        onClick={() => onManageAccess(account)}
                        title={`Manage access for ${account.username}`}
                      >
                        <ShieldCheck size={16} />
                        Access
                      </button>
                    )}
                    {account.active && account.id !== currentUserId && canDeactivateAccounts && (
                      <button
                        type="button"
                        className="ua-icon-text-button ua-icon-text-button--danger"
                        onClick={() => onDeactivate(account)}
                        disabled={saving}
                      >
                        <X size={16} />
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!loading && accounts.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="ua-table-empty" role={loadError ? "status" : undefined}>
                    {loadError ? <LoaderCircle size={27} /> : <Users size={27} />}
                    <strong>{loadError ? "Accounts could not be loaded" : "No accounts found"}</strong>
                    <span>{loadError ? "Use Refresh above to try again." : "Try changing the search or organization filters."}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="ua-pagination" aria-label="User directory pagination">
        <span>Page {Math.min(page + 1, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}</span>
        <div>
          <button
            type="button"
            className="ua-pagination-button"
            onClick={() => onPageChange((current) => Math.max(0, current - 1))}
            disabled={loading || page <= 0}
            aria-label="Previous page"
          >
            <ChevronLeft size={17} />
            Previous
          </button>
          <button
            type="button"
            className="ua-pagination-button"
            onClick={() => onPageChange((current) => totalPages > 0 ? Math.min(totalPages - 1, current + 1) : current)}
            disabled={loading || totalPages <= 1 || page >= totalPages - 1}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={17} />
          </button>
        </div>
      </footer>
    </section>
  );
}
