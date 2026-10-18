import type { FormEventHandler, ReactNode, Dispatch, SetStateAction } from "react";
import { CheckCircle2, LoaderCircle, Plus, X } from "lucide-react";

import type {
  AdmissionApplication,
  AdmissionAcademicYear,
  AdmissionCampus,
  AdmissionSchoolClass,
} from "../api/admissions-types";

export interface AdmissionApplicationFormState {
  applicantFirstName: string;
  applicantLastName: string;
  applicantDateOfBirth: string;
  applicationDate: string;
  campusId: string;
  academicYearId: string;
  applyingClassId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  notes: string;
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

interface AdmissionsApplicationFormPanelProps {
  editingApplication: AdmissionApplication | null;
  form: AdmissionApplicationFormState;
  setForm: Dispatch<SetStateAction<AdmissionApplicationFormState>>;
  academicYears: AdmissionAcademicYear[];
  campuses: AdmissionCampus[];
  classesForFormYear: AdmissionSchoolClass[];
  classesLoading: boolean;
  institutionId: string;
  busy: boolean;
  maxBirthDate: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
}

export function AdmissionsApplicationFormPanel({
  editingApplication,
  form,
  setForm,
  academicYears,
  campuses,
  classesForFormYear,
  classesLoading,
  institutionId,
  busy,
  maxBirthDate,
  onSubmit,
  onClose,
}: AdmissionsApplicationFormPanelProps) {
  return (
    <section className="admissions-panel admissions-editor" aria-labelledby="admissions-editor-title">
      <header className="admissions-panel__header">
        <div>
          <h2 id="admissions-editor-title">{editingApplication ? "Edit application" : "New admission application"}</h2>
          <p>
            {editingApplication
              ? "Applicant identity fields cannot be changed through this update endpoint."
              : "Capture applicant details and the class they are applying to."}
          </p>
        </div>
        <button type="button" className="admissions-icon-button" aria-label="Close application form" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      <form className="admissions-form" onSubmit={onSubmit}>
        <h3>Applicant details</h3>
        <div className="admissions-form-grid admissions-form-grid--three">
          <FormField label="First name" required>
            <input
              required
              maxLength={100}
              value={form.applicantFirstName}
              disabled={Boolean(editingApplication)}
              onChange={(event) => setForm((current) => ({ ...current, applicantFirstName: event.target.value }))}
            />
          </FormField>
          <FormField label="Last name" required>
            <input
              required
              maxLength={100}
              value={form.applicantLastName}
              disabled={Boolean(editingApplication)}
              onChange={(event) => setForm((current) => ({ ...current, applicantLastName: event.target.value }))}
            />
          </FormField>
          <FormField label="Date of birth" required>
            <input
              required
              type="date"
              max={maxBirthDate}
              value={form.applicantDateOfBirth}
              disabled={Boolean(editingApplication)}
              onChange={(event) => setForm((current) => ({ ...current, applicantDateOfBirth: event.target.value }))}
            />
          </FormField>
          {!editingApplication && (
            <FormField label="Application date" required>
              <input
                required
                type="date"
                value={form.applicationDate}
                onChange={(event) => setForm((current) => ({ ...current, applicationDate: event.target.value }))}
              />
            </FormField>
          )}
        </div>

        <h3>Academic placement</h3>
        <div className="admissions-form-grid admissions-form-grid--three">
          <FormField label="Academic year" required>
            <select
              required
              value={form.academicYearId}
              onChange={(event) => setForm((current) => ({
                ...current,
                academicYearId: event.target.value,
                applyingClassId: "",
              }))}
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name} · {year.status}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Applying for class" required>
            <select
              required
              value={form.applyingClassId}
              onChange={(event) => setForm((current) => ({ ...current, applyingClassId: event.target.value }))}
              disabled={!form.academicYearId || classesLoading}
            >
              <option value="">Select class</option>
              {classesForFormYear.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.code ? ` · ${item.code}` : ""}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Campus">
            <select
              value={form.campusId}
              onChange={(event) => setForm((current) => ({ ...current, campusId: event.target.value }))}
            >
              <option value="">No specific campus</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>{campus.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        <h3>Parent or guardian</h3>
        <div className="admissions-form-grid admissions-form-grid--three">
          <FormField label="Parent / guardian name">
            <input
              maxLength={200}
              value={form.parentName}
              onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))}
            />
          </FormField>
          <FormField label="Phone">
            <input
              type="tel"
              maxLength={30}
              value={form.parentPhone}
              onChange={(event) => setForm((current) => ({ ...current, parentPhone: event.target.value }))}
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              maxLength={200}
              value={form.parentEmail}
              onChange={(event) => setForm((current) => ({ ...current, parentEmail: event.target.value }))}
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea
            maxLength={2000}
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Additional application notes (optional)"
          />
        </FormField>

        <div className="admissions-form-actions">
          <button type="submit" className="admissions-primary-button" disabled={busy || !institutionId || !form.applyingClassId}>
            {busy
              ? <LoaderCircle size={16} className="admissions-spin" />
              : editingApplication ? <CheckCircle2 size={16} /> : <Plus size={16} />}
            {busy ? "Saving…" : editingApplication ? "Save changes" : "Create application"}
          </button>
          <button type="button" className="admissions-secondary-button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
