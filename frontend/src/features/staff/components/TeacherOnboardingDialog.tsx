import type { Dispatch, FormEvent, SetStateAction } from "react";
import Select from "react-select";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  UserPlus,
  X,
} from "lucide-react";

export interface TeacherForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  jobTitle: string;
  startDate: string;
  phone: string;
  campusId: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectedInstitution {
  id: string;
  name: string;
  campusId?: string;
}

interface TeacherOnboardingDialogProps {
  open: boolean;
  institution: SelectedInstitution | null;
  canReadCampuses: boolean;
  canOnboardTeacher: boolean;
  campusOptions: SelectOption[];
  selectedCampus: SelectOption | null;
  campusLoadError: string;
  form: TeacherForm;
  setForm: Dispatch<SetStateAction<TeacherForm>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  today: () => string;
}

export function TeacherOnboardingDialog({
  open,
  institution,
  canReadCampuses,
  canOnboardTeacher,
  campusOptions,
  selectedCampus,
  campusLoadError,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
  today,
}: TeacherOnboardingDialogProps) {
  return (
    open && (
        <div className="tm-modal-backdrop" role="presentation">
          <section
            className="tm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tm-onboard-title"
          >
            <header className="tm-modal-header">
              <div>
                <span className="tm-eyebrow">STAFF ONBOARDING</span>
                <h2 id="tm-onboard-title">Onboard a teacher</h2>
                <p>
                  Create the teacher profile and account invitation together.
                </p>
              </div>

              <button
                type="button"
                className="tm-close-button"
                onClick={onClose}
                disabled={saving}
                aria-label="Close onboarding dialog"
              >
                <X size={19} />
              </button>
            </header>

            <form className="tm-form" onSubmit={onSubmit}>
              <section className="tm-form-section">
                <div className="tm-form-section-heading">
                  <span className="tm-form-step">01</span>
                  <div>
                    <h3>Personal information</h3>
                    <p>Enter the details used for the staff record and login.</p>
                  </div>
                </div>

                <div className="tm-form-grid">
                  <div className="tm-field">
                    <label htmlFor="tm-first-name">First name *</label>
                    <input
                      id="tm-first-name"
                      required
                      maxLength={100}
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="tm-field">
                    <label htmlFor="tm-last-name">Last name *</label>
                    <input
                      id="tm-last-name"
                      required
                      maxLength={100}
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="tm-field tm-field--full">
                    <label htmlFor="tm-email">Email address *</label>
                    <input
                      id="tm-email"
                      type="email"
                      required
                      maxLength={255}
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="teacher@school.edu"
                    />
                    <span className="tm-field-help">
                      The account invitation will be sent to this address.
                    </span>
                  </div>

                  <div className="tm-field tm-field--full">
                    <label htmlFor="tm-username">Username *</label>
                    <input
                      id="tm-username"
                      required
                      maxLength={100}
                      autoComplete="username"
                      value={form.username}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      placeholder="e.g. meera.sharma"
                    />
                  </div>

                  <div className="tm-field tm-field--full">
                    <label htmlFor="tm-phone">Phone number</label>
                    <input
                      id="tm-phone"
                      maxLength={30}
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </section>

              <section className="tm-form-section">
                <div className="tm-form-section-heading">
                  <span className="tm-form-step">02</span>
                  <div>
                    <h3>Employment details</h3>
                    <p>
                      The teacher role and staff type are assigned automatically.
                    </p>
                  </div>
                </div>

                <div className="tm-form-grid">
                  <div className="tm-field tm-field--full">
                    <label>Institution</label>
                    <div className="tm-readonly-context">
                      <GraduationCap size={17} />
                      <span>{institution?.name ?? "No institution selected"}</span>
                    </div>
                    <span className="tm-field-help">
                      This is the institution selected in your Dolphin workspace.
                    </span>
                  </div>

                  <div className="tm-field tm-field--full">
                    <label>Campus</label>

                    {canReadCampuses ? (
                      <Select<SelectOption, false>
                        value={selectedCampus}
                        options={campusOptions}
                        onChange={(option) =>
                          setForm((current) => ({
                            ...current,
                            campusId: option?.value ?? "",
                          }))
                        }
                        isClearable
                        isSearchable
                        classNamePrefix="tm-select"
                        placeholder="Institution-wide / choose a campus"
                        noOptionsMessage={() => "No active campuses available"}
                      />
                    ) : (
                      <div className="tm-field-note">
                        <AlertCircle size={15} />
                        Campus selection is unavailable without CAMPUS_READ.
                        You may continue without selecting a campus.
                      </div>
                    )}

                    {campusLoadError && (
                      <span className="tm-field-error">
                        Campuses could not be loaded: {campusLoadError}
                      </span>
                    )}
                  </div>

                  <div className="tm-field">
                    <label htmlFor="tm-employee-number">Employee number *</label>
                    <input
                      id="tm-employee-number"
                      required
                      maxLength={50}
                      value={form.employeeNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          employeeNumber: event.target.value,
                        }))
                      }
                      placeholder="e.g. EMP-0102"
                    />
                  </div>

                  <div className="tm-field">
                    <label htmlFor="tm-job-title">Job title *</label>
                    <input
                      id="tm-job-title"
                      required
                      maxLength={120}
                      value={form.jobTitle}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          jobTitle: event.target.value,
                        }))
                      }
                      placeholder="e.g. Mathematics Teacher"
                    />
                  </div>

                  <div className="tm-field tm-field--full">
                    <label htmlFor="tm-start-date">Employment start date *</label>
                    <input
                      id="tm-start-date"
                      type="date"
                      required
                      max={today()}
                      value={form.startDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                    />
                    <span className="tm-field-help">
                      Future start dates are not accepted by the backend.
                    </span>
                  </div>
                </div>
              </section>

              <div className="tm-invitation-note">
                <CheckCircle2 size={17} />
                <p>
                  The backend assigns the <strong>TEACHER</strong> role,
                  creates the staff profile and assignment, and creates the
                  account invitation in one operation.
                </p>
              </div>

              <footer className="tm-modal-footer">
                <button
                  type="button"
                  className="tm-button tm-button--secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tm-button tm-button--primary"
                  disabled={
                    saving
                    || !institution?.id
                    || !canOnboardTeacher
                  }
                >
                  {saving
                    ? <LoaderCircle size={17} className="tm-spin" />
                    : <UserPlus size={17} />}
                  {saving ? "Onboarding…" : "Create teacher & invite"}
                </button>
              </footer>
            </form>
          </section>
        </div>
    )
  );
}
