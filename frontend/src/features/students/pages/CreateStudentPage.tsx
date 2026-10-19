import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Save,
} from "lucide-react";

import { ApiError } from "../../../lib/api/api-error";
import { useAuth } from "../../../lib/auth/use-auth";
import {
  useCampuses,
  useInstitutions,
} from "../../organization/hooks/use-organization";
import { useOrganizationSelection, setOrganizationSelection } from "../../organization/hooks/organization-selection";
import type { Institution } from "../../organization/api/organization-types";
import { StudentSelect } from "./StudentSelect";
import { studentService } from "../api/student-service";
import type {
  CreateStudentRequest,
  Student,
} from "../api/student-types";

import "./student-list-page.css";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "Please check the entered information.";
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "You don't have permission to create a student in this institution or campus.";
      case 404:
        return "The selected institution or campus could not be found.";
      case 409:
        return error.message ||
          "This admission number may already exist in the institution.";
      case 422:
        return error.message ||
          "The selected institution or campus cannot be used.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please try again."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not create the student. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function saveOrganizationSelection(institution: Institution) {
  setOrganizationSelection((current) => ({
    ...current,
    institution,
  }));
}

export function CreateStudentPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [organizationSelection] = useOrganizationSelection();
  const initialSelection = {
    clusterId: organizationSelection.cluster?.id ?? "",
    institutionId: organizationSelection.institution?.id ?? "",
    campusId: "",
  };

  const canReadInstitutions = hasPermission("INSTITUTION_READ");
  const canReadCampuses = hasPermission("CAMPUS_READ");

  const [institutionId, setInstitutionId] = useState(
    initialSelection.institutionId,
  );
  const [campusId, setCampusId] = useState(initialSelection.campusId);

  const [admissionNumber, setAdmissionNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInstitutionId(initialSelection.institutionId);
    setCampusId(initialSelection.campusId);
    setFormError("");
  }, [initialSelection.clusterId, initialSelection.institutionId, initialSelection.campusId]);

  const institutionsQuery = useInstitutions(
    canReadInstitutions ? initialSelection.clusterId : "",
  );
  const campusesQuery = useCampuses(
    canReadCampuses ? institutionId : "",
  );

  const institution = institutionsQuery.data?.find(
    (item) => item.id === institutionId,
  );
  const campus = campusesQuery.data?.find(
    (item) => item.id === campusId,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!hasPermission("STUDENT_CREATE")) {
      setFormError("Your account does not have STUDENT_CREATE permission.");
      return;
    }

    if (!canReadInstitutions) {
      setFormError(
        "Your account needs INSTITUTION_READ permission to choose an institution.",
      );
      return;
    }

    if (!UUID_PATTERN.test(institutionId)) {
      setFormError("Select an institution.");
      return;
    }

    if (campusId && !UUID_PATTERN.test(campusId)) {
      setFormError("Select a valid campus or choose Institution-wide.");
      return;
    }

    if (campusId && !canReadCampuses) {
      setFormError(
        "Your account needs CAMPUS_READ permission to select a campus.",
      );
      return;
    }

    if (!admissionNumber.trim()) {
      setFormError("Admission number is required.");
      return;
    }

    if (!firstName.trim()) {
      setFormError("First name is required.");
      return;
    }

    if (admissionNumber.trim().length > 50) {
      setFormError("Admission number must not exceed 50 characters.");
      return;
    }

    if (firstName.trim().length > 100 || lastName.trim().length > 100) {
      setFormError("Names must not exceed 100 characters.");
      return;
    }

    if (!institution) {
      setFormError(
        "The selected institution is not loaded. Return to Organization, select a cluster, and try again.",
      );
      return;
    }

    if (campusId && !campus) {
      setFormError("The selected campus is not available. Please select it again.");
      return;
    }

    const request: CreateStudentRequest = {
      institutionId,
      campusId: campusId || null,
      admissionNumber: admissionNumber.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      dateOfBirth: dateOfBirth || null,
    };

    setSaving(true);

    try {
      const created: Student = await studentService.createStudent(request);

      saveOrganizationSelection(institution);

      navigate("/students", {
        replace: true,
        state: {
          createdStudentId: created.id,
          createdStudentName:
            `${created.firstName} ${created.lastName ?? ""}`.trim(),
        },
      });
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!hasPermission("STUDENT_CREATE")) {
    return (
      <main className="student-page">
        <Link to="/students" className="student-secondary-link">
          <ArrowLeft size={16} />
          Back to Students
        </Link>
        <section className="student-panel">
          <div className="student-state student-state--error" role="alert">
            <AlertCircle size={28} />
            <h3>Access denied</h3>
            <p>Your account does not have STUDENT_CREATE permission.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="student-page">
      <Link to="/students" className="student-back-link">
        <ArrowLeft size={16} />
        Back to Students
      </Link>

      <header className="student-page__header">
        <div>
          <p className="student-page__eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Create student</h1>
          <p className="student-page__subtitle">
            Add a student profile to an institution.
          </p>
        </div>
        <div className="student-page__header-icon" aria-hidden="true">
          <GraduationCap size={27} />
        </div>
      </header>

      <section className="student-panel">
        <div className="student-panel__header">
          <div className="student-panel__heading-icon" aria-hidden="true">
            <GraduationCap size={19} />
          </div>
          <div>
            <h2>Student information</h2>
            <p>
              Fields marked with an asterisk are required. Admission numbers
              must be unique within an institution.
            </p>
          </div>
        </div>

        <form className="student-create-form" onSubmit={handleSubmit}>
          <div className="student-search-form__field">
            <label htmlFor="create-student-institution">
              Institution <span aria-hidden="true">*</span>
            </label>

            <StudentSelect
              id="create-student-institution"
              value={institutionId}
              onChange={(nextId) => {
                setInstitutionId(nextId);
                setCampusId("");
                setFormError("");
              }}
              options={
                institutionsQuery.data?.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.code})`,
                })) ?? []
              }
              placeholder={
                !canReadInstitutions
                  ? "Institution read permission required"
                  : !initialSelection.clusterId
                    ? "Select a cluster in Organization first"
                    : institutionsQuery.isPending
                      ? "Loading institutions..."
                      : "Select an institution"
              }
              searchPlaceholder="Search institutions..."
              emptyMessage="No institutions available for the selected cluster."
              disabled={
                !canReadInstitutions ||
                !initialSelection.clusterId ||
                institutionsQuery.isPending ||
                institutionsQuery.isError
              }
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="create-student-campus">Campus</label>

            <StudentSelect
              id="create-student-campus"
              value={campusId}
              onChange={(nextId) => {
                setCampusId(nextId);
                setFormError("");
              }}
              options={[
                { value: "", label: "Institution-wide (no campus)" },
                ...(campusesQuery.data?.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.code})`,
                })) ?? []),
              ]}
              placeholder={
                !institutionId
                  ? "Select an institution first"
                  : !canReadCampuses
                    ? "Campus read permission required"
                    : campusesQuery.isPending
                      ? "Loading campuses..."
                      : "Institution-wide (no campus)"
              }
              searchPlaceholder="Search campuses..."
              emptyMessage="No campuses available for this institution."
              disabled={
                !institutionId ||
                !canReadCampuses ||
                campusesQuery.isPending ||
                campusesQuery.isError
              }
            />

            <p className="student-form-hint">
              Optional. Choose Institution-wide if the student is not assigned
              to a specific campus.
            </p>
          </div>

          <div className="student-search-form__field">
            <label htmlFor="create-student-admission">
              Admission number <span aria-hidden="true">*</span>
            </label>
            <input
              id="create-student-admission"
              value={admissionNumber}
              onChange={(event) => setAdmissionNumber(event.target.value)}
              maxLength={50}
              autoComplete="off"
              required
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="create-student-first-name">
              First name <span aria-hidden="true">*</span>
            </label>
            <input
              id="create-student-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={100}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="create-student-last-name">Last name</label>
            <input
              id="create-student-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              maxLength={100}
              autoComplete="family-name"
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="create-student-date-of-birth">
              Date of birth
            </label>
            <input
              id="create-student-date-of-birth"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
            />
          </div>

          {formError && (
            <div className="student-create-error" role="alert">
              <AlertCircle size={17} />
              <span>{formError}</span>
            </div>
          )}

          <div className="student-create-actions">
            <Link to="/students" className="student-secondary-button">
              Cancel
            </Link>

            <button
              type="submit"
              className="student-primary-button"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Creating student..." : "Create student"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
