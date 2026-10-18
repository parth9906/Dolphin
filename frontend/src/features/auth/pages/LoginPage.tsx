import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../../lib/api/api-error";
import { useAuth } from "../../../lib/auth/use-auth";

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return (
      <main className="auth-loading" aria-live="polite">
        <div className="auth-loading__spinner" />
        <p>Checking your session...</p>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        if (cause.status === 401) {
          setError("Invalid username or password.");
        } else if (cause.status === 429) {
          setError("Too many login attempts. Please try again later.");
        } else if (cause.isNetworkError) {
          setError("Unable to connect to the server. Check your connection.");
        } else {
          setError("Sign-in failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          <div className="auth-brand__mark" aria-hidden="true">
            D
          </div>
          <div>
            <p className="auth-brand__name">Dolphin</p>
            <p className="auth-brand__subtitle">School Management</p>
          </div>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1 id="login-title">Sign in to your account</h1>
          <p>Enter your credentials to continue to your workspace.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
              maxLength={100}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              maxLength={256}
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || !username.trim() || !password}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Secure access for your school community
        </p>
      </section>
    </main>
  );
}