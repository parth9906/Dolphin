import type { FormEvent } from "react";

type RegionCreateFormProps = {
  enterpriseName: string;
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

export function RegionCreateForm({
  enterpriseName,
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
}: RegionCreateFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  if (!isOpen) {
    return (
      <div className="org-create-action">
        <button type="button" className="org-button org-button-secondary" onClick={onOpen}>
          Create region
        </button>
      </div>
    );
  }

  return (
    <div className="org-create-action is-open">
      <form className="org-create-form" onSubmit={handleSubmit} noValidate aria-label="Create region">
        <strong>New region</strong>
        <p className="org-create-form-context">Under {enterpriseName}</p>
        <label>
          Region code
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            maxLength={50}
            required
            autoComplete="off"
            disabled={isSubmitting}
            placeholder="e.g. NORTH"
            aria-invalid={Boolean(error)}
          />
        </label>
        <label>
          Region name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={200}
            required
            autoComplete="organization"
            disabled={isSubmitting}
            placeholder="e.g. North Region"
            aria-invalid={Boolean(error)}
          />
        </label>
        {error && <p className="org-create-form-error" role="alert">{error}</p>}
        <div className="org-create-form-actions">
          <button type="button" className="org-button org-button-secondary" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="org-button org-button-primary" disabled={isSubmitting || !code.trim() || !name.trim()}>
            {isSubmitting ? "Creating…" : "Create region"}
          </button>
        </div>
      </form>
    </div>
  );
}
