import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, LoaderCircle, Waves } from "lucide-react";

import { userAdministrationService } from "../api/user-administration-service";
import "./user-management-page.css";

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The invitation could not be accepted. Check the invitation link and try again.";
}

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This invitation link does not contain a valid token.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await userAdministrationService.acceptInvitation({
          token,
          password,
        });

      setUsername(response.username);
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ua-accept-page">
      <section className="ua-accept-card">
        <div className="ua-accept-brand">
          <span className="ua-accept-logo">
            <Waves size={23} />
          </span>
          <span>
            <strong>Dolphin</strong>
            <small>School Management</small>
          </span>
        </div>

        {success ? (
          <div className="ua-accept-result">
            <span className="ua-result-icon ua-result-icon--success">
              <CheckCircle2 size={30} />
            </span>
            <h1>Account activated</h1>
            <p>
              Your account <strong>@{username}</strong> is ready. Sign in to
              continue to Dolphin.
            </p>
            <Link to="/login" className="ua-button ua-button--primary ua-button--full">
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="ua-accept-heading">
              <span className="ua-modal-kicker">WELCOME TO DOLPHIN</span>
              <h1>Set your password</h1>
              <p>
                Complete your invitation by creating a secure password for
                your account.
              </p>
            </div>

            {error && (
              <div className="ua-alert ua-alert--error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className="ua-form ua-accept-form" onSubmit={handleSubmit}>
              <div className="ua-field">
                <label htmlFor="ua-password">New password *</label>
                <input
                  id="ua-password"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="ua-field">
                <label htmlFor="ua-confirm-password">Confirm password *</label>
                <input
                  id="ua-confirm-password"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter the password again"
                />
              </div>

              <button
                type="submit"
                className="ua-button ua-button--primary ua-button--full"
                disabled={submitting || !token}
              >
                {submitting
                  ? <LoaderCircle size={18} className="ua-spin" />
                  : <CheckCircle2 size={18} />}
                Activate account
              </button>
            </form>

            {!token && (
              <p className="ua-accept-footnote">
                Open the full invitation link from your email to continue.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
