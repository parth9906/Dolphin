import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  UserX,
} from "lucide-react";

import { ApiError } from "../../../lib/api/api-error";
import { useAuth } from "../../../lib/auth/use-auth";
import {
  studentKeys,
  useStudent,
  useStudentAccountLink,
} from "../hooks/use-students";
import { studentService } from "../api/student-service";
import type { UserAccountSummary } from "../api/student-types";
import { StudentProfileSections } from "../components/StudentProfileSections";
import { StudentStatusConfirmationDialogs } from "../components/StudentStatusConfirmationDialogs";
import { StudentAccountAccessPanel } from "../components/StudentAccountAccessPanel";
import {
  CreateStudentLoginDialog,
  ExistingStudentAccountDialog,
} from "../components/StudentAccountDialogs";
import {
  useCampus,
  useInstitution,
} from "../../organization/hooks/use-organization";

import "./student-list-page.css";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session may have expired. Sign in again.";
      case 403:
        return "You do not have permission to view this student.";
      case 404:
        return "This student could not be found or is no longer active.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please try again."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not load this student. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function getDeactivateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "You do not have permission to deactivate this student.";
      case 404:
        return "This student could not be found or may already be inactive.";
      case 409:
        return error.message || "The student cannot be deactivated right now.";
      case 422:
        return error.message || "The student cannot be deactivated because of a business rule.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please retry."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not deactivate the student. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while deactivating the student.";
}

function getActivateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "The activation request could not be processed.";
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "You do not have permission to reactivate this student or access this organization.";
      case 404:
        return "This student could not be found.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please retry."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not reactivate the student. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while reactivating the student.";
}

function getCreateLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message ||
          "Check the username, email, password, and name fields.";
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "Your account needs USER_CREATE permission to create a login.";
      case 409:
        return error.message ||
          "That username or email is already in use. Choose different values.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Check the user list before retrying."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not create the user account. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while creating the login.";
}

function getAccountLinkErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "Enter a valid user account ID.";
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "You do not have permission to link accounts or access this student's institution.";
      case 404:
        return error.message || "The student or user account could not be found.";
      case 409:
        return error.message ||
          "This student or user account is already linked to another account.";
      case 422:
        return error.message ||
          "This account cannot be linked. It may be inactive or belong to a staff member or guardian.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please retry."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not link the account. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while linking the account.";
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const studentQuery = useStudent(id);
  const accountLinkQuery = useStudentAccountLink(id);

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivationError, setDeactivationError] = useState("");
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [showAccountLinkDialog, setShowAccountLinkDialog] = useState(false);
  const [accountSearchText, setAccountSearchText] = useState("");
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [accountSearchPage, setAccountSearchPage] = useState(0);
  const [accountSearchRequested, setAccountSearchRequested] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<UserAccountSummary | null>(null);
  const [linkingAccount, setLinkingAccount] = useState(false);
  const [accountLinkError, setAccountLinkError] = useState("");
  const [accountLinkSuccess, setAccountLinkSuccess] = useState("");
  const [showCreateLoginDialog, setShowCreateLoginDialog] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginFirstName, setLoginFirstName] = useState("");
  const [loginLastName, setLoginLastName] = useState("");
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [createLoginError, setCreateLoginError] = useState("");
  const [createdLoginUser, setCreatedLoginUser] =
    useState<UserAccountSummary | null>(null);

  const canReadInstitutions = hasPermission("INSTITUTION_READ");
  const canReadCampuses = hasPermission("CAMPUS_READ");
  const canReadUsers = hasPermission("USER_READ");

  const eligibleAccountsQuery = useQuery({
    queryKey: [
      "users",
      "eligible-student-accounts",
      id ?? "",
      accountSearchTerm,
      accountSearchPage,
    ],
    queryFn: () => {
      if (!id || !UUID_PATTERN.test(id)) {
        throw new Error("A valid student ID is required.");
      }
      return studentService.searchEligibleAccounts(
        id,
        accountSearchTerm,
        accountSearchPage,
        20,
      );
    },
    enabled:
      showAccountLinkDialog &&
      canReadUsers &&
      accountSearchRequested &&
      Boolean(id && UUID_PATTERN.test(id)),
    staleTime: 15_000,
  });


  const institutionQuery = useInstitution(
    canReadInstitutions ? studentQuery.data?.institutionId ?? "" : "",
  );
  const campusQuery = useCampus(
    canReadCampuses ? studentQuery.data?.campusId ?? "" : "",
  );

  const navigationState = location.state as
    | { updatedStudent?: boolean }
    | null;
  const showUpdatedMessage = navigationState?.updatedStudent === true;

  function openCreateLoginDialog() {
    const student = studentQuery.data;
    if (!student) return;

    setLoginUsername("");
    setLoginEmail("");
    setLoginPassword("");
    setLoginFirstName(student.firstName);
    setLoginLastName(student.lastName ?? "");
    setCreateLoginError("");
    setCreatedLoginUser(null);
    setShowCreateLoginDialog(true);
  }

  async function retryCreatedAccountLink() {
    if (!id || !studentQuery.data || !createdLoginUser) return;

    if (
      !hasPermission("STUDENT_ACCOUNT_LINK") ||
      !hasPermission("USER_CREATE")
    ) {
      setCreateLoginError(
        "Your account needs USER_CREATE and STUDENT_ACCOUNT_LINK permissions.",
      );
      return;
    }

    setCreatingLogin(true);
    setCreateLoginError("");

    try {
      await studentService.linkUserAccount(id, createdLoginUser.id);
      await queryClient.invalidateQueries({
        queryKey: studentKeys.accountLink(id),
      });

      const username = createdLoginUser.username;
      setShowCreateLoginDialog(false);
      setCreatedLoginUser(null);
      setAccountLinkSuccess(
        `Login "${username}" was linked to this student successfully.`,
      );
    } catch (error) {
      setCreateLoginError(
        `The account "${createdLoginUser.username}" already exists, but linking failed. ` +
        getAccountLinkErrorMessage(error),
      );
    } finally {
      setCreatingLogin(false);
    }
  }

  async function handleCreateStudentLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoginError("");

    if (!id || !UUID_PATTERN.test(id) || !studentQuery.data) {
      setCreateLoginError("Student details are unavailable. Reload the profile and try again.");
      return;
    }

    if (!studentQuery.data.active) {
      setCreateLoginError("An inactive student cannot be linked to a login account.");
      return;
    }

    if (
      !hasPermission("USER_CREATE") ||
      !hasPermission("STUDENT_ACCOUNT_LINK")
    ) {
      setCreateLoginError(
        "Your account needs both USER_CREATE and STUDENT_ACCOUNT_LINK permissions.",
      );
      return;
    }

    const username = loginUsername.trim();
    const email = loginEmail.trim();
    const firstName = loginFirstName.trim();
    const lastName = loginLastName.trim();

    if (!username || username.length > 100) {
      setCreateLoginError("Username is required and must not exceed 100 characters.");
      return;
    }
    if (!email || email.length > 255) {
      setCreateLoginError("A valid email address is required.");
      return;
    }
    if (loginPassword.length < 8 || loginPassword.length > 100) {
      setCreateLoginError("Password must be between 8 and 100 characters.");
      return;
    }
    if (!firstName || firstName.length > 100 || lastName.length > 100) {
      setCreateLoginError("First name is required; names must not exceed 100 characters.");
      return;
    }

    setCreatingLogin(true);
    let createdUser: UserAccountSummary | null = null;

    try {
      createdUser = await studentService.createUserAccount({
        username,
        email,
        password: loginPassword,
        firstName,
        lastName: lastName || null,
      });

      // Store the account before linking, allowing recovery without recreating it.
      setCreatedLoginUser(createdUser);
      setLoginPassword("");

      try {
        await studentService.linkUserAccount(id, createdUser.id);
      } catch (error) {
        setCreateLoginError(
          `Login "${createdUser.username}" was created, but linking failed. ` +
          getAccountLinkErrorMessage(error),
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: studentKeys.accountLink(id),
      });

      const createdUsername = createdUser.username;
      setShowCreateLoginDialog(false);
      setCreatedLoginUser(null);
      setAccountLinkSuccess(
        `Login "${createdUsername}" was created and linked successfully.`,
      );
    } catch (error) {
      setCreateLoginError(getCreateLoginErrorMessage(error));
    } finally {
      setCreatingLogin(false);
    }
  }

  function handleSearchExistingAccounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountLinkError("");
    setSelectedAccount(null);
    setAccountSearchPage(0);
    setAccountSearchTerm(accountSearchText.trim());
    setAccountSearchRequested(true);
  }

  async function handleLinkUserAccount() {
    if (!selectedAccount) {
      setAccountLinkError("Select an eligible user account first.");
      return;
    }

    if (!id || !UUID_PATTERN.test(id) || !studentQuery.data) {
      setAccountLinkError("Student details are unavailable. Reload the profile and try again.");
      return;
    }

    if (!studentQuery.data.active) {
      setAccountLinkError("An inactive student cannot be linked to an account.");
      return;
    }

    if (!hasPermission("STUDENT_ACCOUNT_LINK") || !canReadUsers) {
      setAccountLinkError(
        "Your account needs USER_READ and STUDENT_ACCOUNT_LINK permissions.",
      );
      return;
    }

    setLinkingAccount(true);
    setAccountLinkError("");

    try {
      const selectedUsername = selectedAccount.username;

      await studentService.linkUserAccount(id, selectedAccount.id);

      await queryClient.invalidateQueries({
        queryKey: studentKeys.accountLink(id),
      });

      await queryClient.invalidateQueries({
        queryKey: studentKeys.all,
        refetchType: "none",
      });

      setShowAccountLinkDialog(false);
      setSelectedAccount(null);
      setAccountSearchRequested(false);
      setAccountLinkSuccess(
        `User account "${selectedUsername}" linked successfully.`,
      );
    } catch (error) {
      setAccountLinkError(getAccountLinkErrorMessage(error));
    } finally {
      setLinkingAccount(false);
    }
  }

  async function confirmActivate() {
    if (!id || !UUID_PATTERN.test(id) || !studentQuery.data) {
      setActivationError("Student details are unavailable. Reload the profile and try again.");
      return;
    }

    if (!hasPermission("STUDENT_ACTIVATE")) {
      setActivationError("Your account does not have STUDENT_ACTIVATE permission.");
      return;
    }

    setActivating(true);
    setActivationError("");

    try {
      const currentStudent = studentQuery.data;
      await studentService.activateStudent(id);

      // Invalidate cached results; the list refreshes on navigation.
      await queryClient.invalidateQueries({
        queryKey: studentKeys.all,
        refetchType: "none",
      });

      const studentName =
        `${currentStudent.firstName} ${currentStudent.lastName ?? ""}`.trim();

      navigate("/students", {
        replace: true,
        state: { reactivatedStudentName: studentName },
      });
    } catch (error) {
      setActivationError(getActivateErrorMessage(error));
    } finally {
      setActivating(false);
    }
  }

  async function confirmDeactivate() {
    if (!id || !UUID_PATTERN.test(id)) {
      setDeactivationError("The student ID is invalid. Close this dialog and reload the profile.");
      return;
    }

    if (!hasPermission("STUDENT_DEACTIVATE")) {
      setDeactivationError("Your account does not have STUDENT_DEACTIVATE permission.");
      return;
    }

    setDeactivating(true);
    setDeactivationError("");

    try {
      await studentService.deactivateStudent(id);

      // Mark cached student queries stale without refetching the active-only
      // detail endpoint; the backend no longer returns inactive profiles.
      await queryClient.invalidateQueries({
        queryKey: studentKeys.all,
        refetchType: "none",
      });

      const currentStudent = studentQuery.data;
      const studentName = currentStudent
        ? `${currentStudent.firstName} ${currentStudent.lastName ?? ""}`.trim()
        : "Student";

      navigate("/students", {
        replace: true,
        state: { deactivatedStudentName: studentName },
      });
    } catch (error) {
      setDeactivationError(getDeactivateErrorMessage(error));
    } finally {
      setDeactivating(false);
    }
  }

  if (!id || !UUID_PATTERN.test(id)) {
    return (
      <main className="student-page">
        <Link to="/students" className="student-back-link">
          <ArrowLeft size={16} /> Back to students
        </Link>
        <section className="student-panel student-state student-state--error">
          <AlertCircle size={28} />
          <h3>Invalid student ID</h3>
          <p>The student address is not a valid ID.</p>
        </section>
      </main>
    );
  }

  if (studentQuery.isPending) {
    return (
      <main className="student-page">
        <section className="student-panel student-state" role="status">
          <span className="student-spinner" />
          <p>Loading student profile...</p>
        </section>
      </main>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <main className="student-page">
        <Link to="/students" className="student-back-link">
          <ArrowLeft size={16} /> Back to students
        </Link>
        <section className="student-panel student-state student-state--error" role="alert">
          <AlertCircle size={28} />
          <h3>Unable to load student</h3>
          <p>{getErrorMessage(studentQuery.error)}</p>
          <button
            type="button"
            className="student-secondary-button"
            onClick={() => void studentQuery.refetch()}
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  const student = studentQuery.data;
  const fullName =
    `${student.firstName} ${student.lastName ?? ""}`.trim();

  return (
    <main className="student-page">
      <Link to="/students" className="student-back-link">
        <ArrowLeft size={16} /> Back to students
      </Link>

      <header className="student-page__header">
        <div>
          <p className="student-page__eyebrow">STUDENT MANAGEMENT</p>
          <h1>{fullName || "Student profile"}</h1>
          <p className="student-page__subtitle">
            View the student's personal and organization details.
          </p>
        </div>

        {(hasPermission("STUDENT_UPDATE") ||
          (student.active && hasPermission("STUDENT_DEACTIVATE")) ||
          (!student.active && hasPermission("STUDENT_ACTIVATE"))) && (
          <div className="student-detail-actions">
            {hasPermission("STUDENT_UPDATE") && (
              <Link
                to={`/students/${student.id}/edit`}
                className="student-primary-button"
              >
                <Pencil size={16} />
                Edit student
              </Link>
            )}


            {!student.active && hasPermission("STUDENT_ACTIVATE") && (
              <button
                type="button"
                className="student-primary-button"
                onClick={() => {
                  setActivationError("");
                  setShowActivateConfirm(true);
                }}
              >
                <CheckCircle2 size={16} />
                Reactivate student
              </button>
            )}

            {student.active && hasPermission("STUDENT_DEACTIVATE") && (
              <button
                type="button"
                className="student-danger-button"
                onClick={() => {
                  setDeactivationError("");
                  setShowDeactivateConfirm(true);
                }}
              >
                <UserX size={16} />
                Deactivate student
              </button>
            )}
          </div>
        )}
      </header>

      {accountLinkSuccess && (
        <div className="student-update-success" role="status">
          <CheckCircle2 size={17} />
          {accountLinkSuccess}
        </div>
      )}

      {showCreateLoginDialog && (
        <CreateStudentLoginDialog
          fullName={fullName}
          createdLoginUser={createdLoginUser}
          creatingLogin={creatingLogin}
          createLoginError={createLoginError}
          loginUsername={loginUsername}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          loginFirstName={loginFirstName}
          loginLastName={loginLastName}
          onUsernameChange={setLoginUsername}
          onEmailChange={setLoginEmail}
          onPasswordChange={setLoginPassword}
          onFirstNameChange={setLoginFirstName}
          onLastNameChange={setLoginLastName}
          onSubmit={handleCreateStudentLogin}
          onRetryLink={() => void retryCreatedAccountLink()}
          onClose={() => {
            setShowCreateLoginDialog(false);
            setCreateLoginError("");
            setLoginPassword("");
          }}
        />
      )}

      {showAccountLinkDialog && (
        <ExistingStudentAccountDialog
          fullName={fullName}
          canReadUsers={canReadUsers}
          linkingAccount={linkingAccount}
          accountSearchText={accountSearchText}
          onSearchTextChange={setAccountSearchText}
          onSearch={handleSearchExistingAccounts}
          accountSearchRequested={accountSearchRequested}
          query={eligibleAccountsQuery}
          selectedAccount={selectedAccount}
          onSelectAccount={(account) => {
            setSelectedAccount(account);
            setAccountLinkError("");
          }}
          onAccountSearchPageChange={setAccountSearchPage}
          accountLinkError={accountLinkError}
          onLink={() => void handleLinkUserAccount()}
          onClose={() => {
            setShowAccountLinkDialog(false);
            setAccountLinkError("");
            setSelectedAccount(null);
          }}
        />
      )}

      <StudentStatusConfirmationDialogs
        fullName={fullName}
        showActivateConfirm={showActivateConfirm}
        showDeactivateConfirm={showDeactivateConfirm}
        activationError={activationError}
        deactivationError={deactivationError}
        activating={activating}
        deactivating={deactivating}
        onCancelActivate={() => {
          setShowActivateConfirm(false);
          setActivationError("");
        }}
        onConfirmActivate={() => void confirmActivate()}
        onCancelDeactivate={() => setShowDeactivateConfirm(false)}
        onConfirmDeactivate={() => void confirmDeactivate()}
      />

      {showUpdatedMessage && (
        <div className="student-update-success" role="status">
          Student details were updated successfully.
        </div>
      )}

      <StudentProfileSections
        student={student}
        canReadInstitutions={canReadInstitutions}
        canReadCampuses={canReadCampuses}
        institutionName={institutionQuery.data?.name}
        institutionLoading={institutionQuery.isPending}
        campusName={campusQuery.data?.name}
        campusLoading={campusQuery.isPending}
      />

      <StudentAccountAccessPanel
        isPending={accountLinkQuery.isPending}
        isError={accountLinkQuery.isError}
        isSuccess={accountLinkQuery.isSuccess}
        data={accountLinkQuery.data}
        onRetry={() => void accountLinkQuery.refetch()}
        canCreateLogin={
          student.active &&
          hasPermission("USER_CREATE") &&
          hasPermission("STUDENT_ACCOUNT_LINK")
        }
        canLinkExisting={
          student.active &&
          hasPermission("STUDENT_ACCOUNT_LINK") &&
          canReadUsers
        }
        onCreateLogin={openCreateLoginDialog}
        onFindExisting={() => {
          setAccountLinkError("");
          setAccountLinkSuccess("");
          setAccountSearchText("");
          setAccountSearchTerm("");
          setAccountSearchPage(0);
          setAccountSearchRequested(false);
          setSelectedAccount(null);
          setShowAccountLinkDialog(true);
        }}
      />

    </main>
  );
}
