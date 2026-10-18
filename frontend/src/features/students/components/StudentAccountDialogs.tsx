import type { FormEvent } from "react";
import {
  AlertCircle,
  Link2,
  Search,
  UserPlus,
  UserRound,
} from "lucide-react";

import { ApiError } from "../../../lib/api/api-error";
import type {
  UserAccountSearchPage,
  UserAccountSummary,
} from "../api/student-types";

interface CreateStudentLoginDialogProps {
  fullName: string;
  createdLoginUser: UserAccountSummary | null;
  creatingLogin: boolean;
  createLoginError: string;
  loginUsername: string;
  loginEmail: string;
  loginPassword: string;
  loginFirstName: string;
  loginLastName: string;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRetryLink: () => void;
  onClose: () => void;
}

export function CreateStudentLoginDialog({
  fullName,
  createdLoginUser,
  creatingLogin,
  createLoginError,
  loginUsername,
  loginEmail,
  loginPassword,
  loginFirstName,
  loginLastName,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onFirstNameChange,
  onLastNameChange,
  onSubmit,
  onRetryLink,
  onClose,
}: CreateStudentLoginDialogProps) {
  return (
    <div className="student-confirm-backdrop">
      <section
        className="student-confirm-dialog student-create-login-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-create-login-title"
        aria-describedby="student-create-login-description"
      >
        <div className="student-confirm-dialog__icon" aria-hidden="true">
          <UserPlus size={22} />
        </div>

        <h2 id="student-create-login-title">
          {createdLoginUser ? "Finish linking login" : "Create student login"}
        </h2>

        {createdLoginUser ? (
          <>
            <p id="student-create-login-description">
              The user account has been created, but is not yet linked. Do not
              create another account. Retry linking the account below.
            </p>

            <div className="student-account-created-summary">
              <span>Username</span>
              <strong>{createdLoginUser.username}</strong>
              <span>Email</span>
              <strong>{createdLoginUser.email}</strong>
              <span>User account ID</span>
              <strong>{createdLoginUser.id}</strong>
            </div>

            {createLoginError && (
              <p className="student-create-error" role="alert">
                <AlertCircle size={16} />
                {createLoginError}
              </p>
            )}

            <div className="student-confirm-dialog__actions">
              <button
                type="button"
                className="student-secondary-button"
                disabled={creatingLogin}
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="student-primary-button"
                disabled={creatingLogin}
                onClick={onRetryLink}
              >
                <Link2 size={16} />
                {creatingLogin ? "Linking..." : "Retry linking"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p id="student-create-login-description">
              Create a new user account for <strong>{fullName}</strong>. The
              account will automatically receive the Student role and be linked
              to this student's institution by the backend.
            </p>

            <form className="student-account-link-form" onSubmit={onSubmit}>
              <div className="student-search-form__field">
                <label htmlFor="create-login-username">
                  Username <span aria-hidden="true">*</span>
                </label>
                <input
                  id="create-login-username"
                  value={loginUsername}
                  onChange={(event) => onUsernameChange(event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  required
                  disabled={creatingLogin}
                />
              </div>

              <div className="student-search-form__field">
                <label htmlFor="create-login-email">
                  Email <span aria-hidden="true">*</span>
                </label>
                <input
                  id="create-login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(event) => onEmailChange(event.target.value)}
                  maxLength={255}
                  autoComplete="email"
                  required
                  disabled={creatingLogin}
                />
              </div>

              <div className="student-search-form__field">
                <label htmlFor="create-login-password">
                  Initial password <span aria-hidden="true">*</span>
                </label>
                <input
                  id="create-login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  minLength={8}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                  disabled={creatingLogin}
                />
                <span className="student-form-hint">
                  Use a temporary password and share it securely with the
                  student. Password must contain 8–100 characters.
                </span>
              </div>

              <div className="student-search-form__field">
                <label htmlFor="create-login-first-name">
                  First name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="create-login-first-name"
                  value={loginFirstName}
                  onChange={(event) => onFirstNameChange(event.target.value)}
                  maxLength={100}
                  autoComplete="given-name"
                  required
                  disabled={creatingLogin}
                />
              </div>

              <div className="student-search-form__field">
                <label htmlFor="create-login-last-name">
                  Last name <span className="student-field-optional">
                    (optional)
                  </span>
                </label>
                <input
                  id="create-login-last-name"
                  value={loginLastName}
                  onChange={(event) => onLastNameChange(event.target.value)}
                  maxLength={100}
                  autoComplete="family-name"
                  disabled={creatingLogin}
                />
              </div>

              {createLoginError && (
                <p className="student-create-error" role="alert">
                  <AlertCircle size={16} />
                  {createLoginError}
                </p>
              )}

              <div className="student-confirm-dialog__actions">
                <button
                  type="button"
                  className="student-secondary-button"
                  disabled={creatingLogin}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="student-primary-button"
                  disabled={creatingLogin}
                >
                  <UserPlus size={16} />
                  {creatingLogin ? "Creating and linking..." : "Create and link"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

interface ExistingAccountDialogProps {
  fullName: string;
  canReadUsers: boolean;
  linkingAccount: boolean;
  accountSearchText: string;
  onSearchTextChange: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  accountSearchRequested: boolean;
  query: {
    data: UserAccountSearchPage | undefined;
    error: unknown;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    isFetching: boolean;
    refetch: () => Promise<unknown>;
  };
  selectedAccount: UserAccountSummary | null;
  onSelectAccount: (account: UserAccountSummary | null) => void;
  onAccountSearchPageChange: (update: (page: number) => number) => void;
  accountLinkError: string;
  onLink: () => void;
  onClose: () => void;
}

export function ExistingStudentAccountDialog({
  fullName,
  canReadUsers,
  linkingAccount,
  accountSearchText,
  onSearchTextChange,
  onSearch,
  accountSearchRequested,
  query,
  selectedAccount,
  onSelectAccount,
  onAccountSearchPageChange,
  accountLinkError,
  onLink,
  onClose,
}: ExistingAccountDialogProps) {
  const page = query.data;

  return (
    <div className="student-confirm-backdrop">
      <section
        className="student-confirm-dialog student-find-account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-link-account-title"
        aria-describedby="student-link-account-description"
      >
        <div className="student-confirm-dialog__icon" aria-hidden="true">
          <Link2 size={22} />
        </div>

        <h2 id="student-link-account-title">Find existing account</h2>
        <p id="student-link-account-description">
          Search eligible accounts by username or email, then select the account
          to link to <strong>{fullName}</strong>.
        </p>

        <form className="student-account-link-form" onSubmit={onSearch}>
          <div className="student-search-form__field">
            <label htmlFor="student-account-search">Username or email</label>
            <input
              id="student-account-search"
              type="search"
              value={accountSearchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
              placeholder="e.g. rahul.student or rahul@example.com"
              autoComplete="off"
              disabled={linkingAccount || !canReadUsers}
            />
          </div>

          <div className="student-confirm-dialog__actions student-find-account-search-actions">
            <button
              type="submit"
              className="student-primary-button"
              disabled={linkingAccount || !canReadUsers}
            >
              <Search size={16} />
              Search accounts
            </button>
          </div>
        </form>

        {!canReadUsers && (
          <p className="student-create-error" role="alert">
            Your account needs USER_READ permission to search accounts.
          </p>
        )}

        {accountSearchRequested && query.isPending && (
          <div className="student-state student-find-account-state" role="status">
            <span className="student-spinner" />
            <p>Searching eligible accounts...</p>
          </div>
        )}

        {accountSearchRequested && query.isError && (
          <div className="student-find-account-error" role="alert">
            <p>
              {query.error instanceof ApiError
                ? query.error.status === 403
                  ? "You do not have permission to search existing user accounts."
                  : query.error.status === 401
                    ? "Your session may have expired. Sign in again and retry."
                    : query.error.message
                : "Unable to search accounts. Check your connection and retry."}
            </p>
            <button
              type="button"
              className="student-secondary-button"
              onClick={() => void query.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {accountSearchRequested && query.isSuccess && page && (
          <div className="student-eligible-account-results">
            <p className="student-form-hint">
              {page.totalElements === 0
                ? "No eligible accounts found. Try another username or email."
                : `${page.totalElements} eligible account(s) found. Select one to continue.`}
            </p>

            {page.content.map((account) => {
              const isSelected = selectedAccount?.id === account.id;
              const accountName =
                `${account.firstName} ${account.lastName ?? ""}`.trim();

              return (
                <button
                  key={account.id}
                  type="button"
                  className={`student-eligible-account-option ${
                    isSelected ? "student-eligible-account-option--selected" : ""
                  }`}
                  aria-pressed={isSelected}
                  disabled={linkingAccount}
                  onClick={() => onSelectAccount(account)}
                >
                  <span className="student-eligible-account-option__avatar">
                    <UserRound size={19} />
                  </span>
                  <span className="student-eligible-account-option__details">
                    <strong>{account.username}</strong>
                    <span>{account.email}</span>
                    {accountName && <span>{accountName}</span>}
                  </span>
                  <span className="student-eligible-account-option__select">
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </button>
              );
            })}

            {page.totalPages > 1 && (
              <div className="student-pagination student-find-account-pagination">
                <span>
                  Page {page.number + 1} of {page.totalPages}
                </span>
                <div className="student-pagination__actions">
                  <button
                    type="button"
                    className="student-secondary-button"
                    disabled={page.first || query.isFetching}
                    onClick={() => {
                      onAccountSearchPageChange((current) =>
                        Math.max(0, current - 1),
                      );
                      onSelectAccount(null);
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="student-secondary-button"
                    disabled={page.last || query.isFetching}
                    onClick={() => {
                      onAccountSearchPageChange((current) => current + 1);
                      onSelectAccount(null);
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {accountLinkError && (
          <p className="student-create-error" role="alert">
            <AlertCircle size={16} />
            {accountLinkError}
          </p>
        )}

        <div className="student-confirm-dialog__actions">
          <button
            type="button"
            className="student-secondary-button"
            disabled={linkingAccount}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="student-primary-button"
            disabled={!selectedAccount || linkingAccount}
            onClick={onLink}
          >
            <Link2 size={16} />
            {linkingAccount ? "Linking account..." : "Link selected account"}
          </button>
        </div>
      </section>
    </div>
  );
}
