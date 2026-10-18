import type { FormEvent } from "react";

type EnterpriseCreateFormProps = {
  canCreate: boolean;
  isOpen: boolean;
  code: string;
  name: string;
  error: string;
  isSubmitting: boolean;
  onOpen: () => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function EnterpriseCreateForm({
  canCreate,
  isOpen,
  code,
  name,
  error,
  isSubmitting,
  onOpen,
  onCodeChange,
  onNameChange,
  onSubmit,
  onCancel,
}: EnterpriseCreateFormProps) {
  if (!canCreate) return null;

  if (!isOpen) {
    return (
      <div className="org-create-action">
        <button
          type="button"
          className="org-button org-button-secondary"
          onClick={onOpen}
        >
          Create enterprise
        </button>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="org-create-action is-open">
      <form
        className="org-create-form"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Create enterprise"
      >
        <strong>New enterprise</strong>
        <label>
          Enterprise code
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            maxLength={50}
            required
            autoComplete="off"
            disabled={isSubmitting}
            placeholder="e.g. NORTHSTAR"
            aria-invalid={Boolean(error) && !code.trim()}
          />
        </label>
        <label>
          Enterprise name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={200}
            required
            autoComplete="organization"
            disabled={isSubmitting}
            placeholder="e.g. Northstar Education Group"
            aria-invalid={Boolean(error) && !name.trim()}
          />
        </label>
        {error && <p className="org-create-form-error" role="alert">{error}</p>}
        <div className="org-create-form-actions">
          <button
            type="button"
            className="org-button org-button-secondary"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="org-button org-button-primary"
            disabled={isSubmitting || !code.trim() || !name.trim()}
          >
            {isSubmitting ? "Creating…" : "Create enterprise"}
          </button>
        </div>
      </form>
    </div>
  );
}
