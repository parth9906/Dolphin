import type { FormEvent } from "react";

type InstitutionCreateFormProps = {
  clusterName: string;
  isOpen: boolean;
  code: string;
  name: string;
  institutionType: string;
  error: string;
  isSubmitting: boolean;
  onOpen: () => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onInstitutionTypeChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function InstitutionCreateForm({
  clusterName,
  isOpen,
  code,
  name,
  institutionType,
  error,
  isSubmitting,
  onOpen,
  onCodeChange,
  onNameChange,
  onInstitutionTypeChange,
  onSubmit,
  onCancel,
}: InstitutionCreateFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  if (!isOpen) {
    return (
      <div className="org-create-action">
        <button type="button" className="org-button org-button-secondary" onClick={onOpen}>
          Create institution
        </button>
      </div>
    );
  }

  return (
    <div className="org-create-action is-open">
      <form className="org-create-form" onSubmit={handleSubmit} noValidate aria-label="Create institution">
        <strong>New institution</strong>
        <p className="org-create-form-context">Under {clusterName}</p>
        <label>
          Institution code
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            maxLength={50}
            required
            autoComplete="off"
            disabled={isSubmitting}
            placeholder="e.g. DOLPHIN-SCHOOL-01"
            aria-invalid={Boolean(error)}
          />
        </label>
        <label>
          Institution name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={200}
            required
            autoComplete="organization"
            disabled={isSubmitting}
            placeholder="e.g. Dolphin Public School"
            aria-invalid={Boolean(error)}
          />
        </label>
        <label>
          Institution type
          <input
            value={institutionType}
            onChange={(event) => onInstitutionTypeChange(event.target.value)}
            maxLength={50}
            required
            autoComplete="off"
            disabled={isSubmitting}
            placeholder="e.g. SCHOOL or COLLEGE"
            aria-invalid={Boolean(error)}
          />
        </label>
        {error && <p className="org-create-form-error" role="alert">{error}</p>}
        <div className="org-create-form-actions">
          <button type="button" className="org-button org-button-secondary" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="org-button org-button-primary" disabled={isSubmitting || !code.trim() || !name.trim() || !institutionType.trim()}>
            {isSubmitting ? "Creating…" : "Create institution"}
          </button>
        </div>
      </form>
    </div>
  );
}
