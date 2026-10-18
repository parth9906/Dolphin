import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { AlertCircle, ClipboardList, LoaderCircle, RefreshCw, UserCheck, X } from "lucide-react";

import type { AdmissionApplication, AdmissionSection } from "../api/admissions-types";

interface AdmissionsEnrollmentPanelProps {
  application: AdmissionApplication;
  sections: AdmissionSection[];
  selectedSectionId: string;
  admissionNumber: string;
  startDate: string;
  busy: boolean;
  sectionsLoading: boolean;
  sectionsError: string;
  onSectionChange: (sectionId: string) => void;
  onAdmissionNumberChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="admissions-field">
      <span>{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function Message({ children, kind = "info" }: { children: ReactNode; kind?: "info" | "error" }) {
  const Icon = kind === "error" ? AlertCircle : ClipboardList;
  return (
    <div className={`admissions-message admissions-message--${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon size={17} />
      <span>{children}</span>
    </div>
  );
}

export function AdmissionsEnrollmentPanel({
  application,
  sections,
  selectedSectionId,
  admissionNumber,
  startDate,
  busy,
  sectionsLoading,
  sectionsError,
  onSectionChange,
  onAdmissionNumberChange,
  onStartDateChange,
  onSubmit,
  onClose,
}: AdmissionsEnrollmentPanelProps) {
  return (
    <section className="admissions-panel admissions-enroll-panel" aria-labelledby="admissions-enroll-title">
      <header className="admissions-panel__header">
        <div>
          <h2 id="admissions-enroll-title">Enroll accepted applicant</h2>
          <p>{application.applicantFirstName} {application.applicantLastName} · {application.className}</p>
        </div>
        <button
          type="button"
          className="admissions-icon-button"
          aria-label="Close enrollment panel"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>

      <form className="admissions-form" onSubmit={onSubmit}>
        <div className="admissions-form-grid admissions-form-grid--three">
          <FormField label="Section" required>
            <select
              required
              value={selectedSectionId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onSectionChange(event.target.value)}
              disabled={sectionsLoading || sections.length === 0 || busy}
              aria-describedby="admissions-enrollment-section-help"
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} · {section.activeEnrollmentCount} students
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Admission number" required>
            <input
              required
              maxLength={50}
              value={admissionNumber}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onAdmissionNumberChange(event.target.value)}
              placeholder="e.g. ADM-2026-001"
              autoComplete="off"
              disabled={busy}
            />
          </FormField>
          <FormField label="Enrollment start date" required>
            <input
              required
              type="date"
              value={startDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onStartDateChange(event.target.value)}
              disabled={busy}
            />
          </FormField>
        </div>

        <div id="admissions-enrollment-section-help">
          {sectionsLoading && (
            <div className="admissions-loading"><RefreshCw size={16} className="admissions-spin" /> Loading sections…</div>
          )}
          {!sectionsLoading && sectionsError && <Message kind="error">{sectionsError}</Message>}
          {!sectionsLoading && !sectionsError && sections.length === 0 && (
            <Message>No active sections were found for this class. Create a section in Academic Setup before enrolling.</Message>
          )}
        </div>

        <div className="admissions-form-actions">
          <button
            type="submit"
            className="admissions-primary-button"
            disabled={busy || sectionsLoading || Boolean(sectionsError) || !sections.length || !selectedSectionId || !admissionNumber.trim() || !startDate}
          >
            {busy ? <LoaderCircle size={16} className="admissions-spin" /> : <UserCheck size={16} />}
            Enroll student
          </button>
          <button
            type="button"
            className="admissions-secondary-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
