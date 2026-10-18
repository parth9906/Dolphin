import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Save,
} from "lucide-react";

import { ApiError } from "../../../lib/api/api-error";
import { useAuth } from "../../../lib/auth/use-auth";
import { studentService } from "../api/student-service";
import { studentKeys, useStudent } from "../hooks/use-students";

import "./student-list-page.css";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "Please check the entered information.";
      case 401:
        return "Your session may have expired. Sign in again and retry.";
      case 403:
        return "You do not have permission to update this student.";
      case 404:
        return "This student could not be found or is no longer active.";
      case 409:
        return error.message ||
          "This admission number may already exist in the institution.";
      case 422:
        return error.message || "The requested change violates a business rule.";
      case 0:
        return error.code === "REQUEST_TIMEOUT"
          ? "The request timed out. Please try again."
          : "Unable to reach the server. Check your connection.";
      default:
        return error.status >= 500
          ? "The server could not update the student. Please try again later."
          : error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const studentQuery = useStudent(id);

  const [admissionNumber, setAdmissionNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const student = studentQuery.data;
    if (!student) return;

    setAdmissionNumber(student.admissionNumber);
    setFirstName(student.firstName);
    setLastName(student.lastName ?? "");
    setDateOfBirth(student.dateOfBirth ?? "");
  }, [studentQuery.data]);

  if (!hasPermission("STUDENT_UPDATE")) {
    return (
      <main className="student-page">
        <Link to="/students" className="student-back-link">
          <ArrowLeft size={16} /> Back to students
        </Link>
        <section className="student-panel student-state student-state--error">
          <AlertCircle size={28} />
          <h3>Access denied</h3>
          <p>Your account does not have STUDENT_UPDATE permission.</p>
        </section>
      </main>
    );
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
          <p>Loading student details...</p>
        </section>
      </main>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <main className="student-page">
        <Link to={`/students/${id}`} className="student-back-link">
          <ArrowLeft size={16} /> Back to student
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!hasPermission("STUDENT_UPDATE")) {
      setFormError("Your account does not have STUDENT_UPDATE permission.");
      return;
    }

    const cleanedAdmissionNumber = admissionNumber.trim();
    const cleanedFirstName = firstName.trim();
    const cleanedLastName = lastName.trim();

    if (!cleanedAdmissionNumber) {
      setFormError("Admission number is required.");
      return;
    }
    if (!cleanedFirstName) {
      setFormError("First name is required.");
      return;
    }
    if (cleanedAdmissionNumber.length > 50) {
      setFormError("Admission number must not exceed 50 characters.");
      return;
    }
    if (cleanedFirstName.length > 100 || cleanedLastName.length > 100) {
      setFormError("Names must not exceed 100 characters.");
      return;
    }

    setSaving(true);

    try {
      const updated = await studentService.updateStudent(id!, {
        admissionNumber: cleanedAdmissionNumber,
        firstName: cleanedFirstName,
        lastName: cleanedLastName || null,
        dateOfBirth: dateOfBirth || null,
      });

      await queryClient.invalidateQueries({
        queryKey: studentKeys.all,
      });

      navigate(`/students/${updated.id}`, {
        replace: true,
        state: { updatedStudent: true },
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="student-page">
      <Link to={`/students/${id}`} className="student-back-link">
        <ArrowLeft size={16} /> Back to student
      </Link>

      <header className="student-page__header">
        <div>
          <p className="student-page__eyebrow">STUDENT MANAGEMENT</p>
          <h1>Edit student</h1>
          <p className="student-page__subtitle">
            Update personal details. Institution and campus assignments are
            not changed by this form.
          </p>
        </div>
      </header>

      <section className="student-panel">
        <div className="student-panel__header">
          <div className="student-panel__heading-icon" aria-hidden="true">
            <Save size={19} />
          </div>
          <div>
            <h2>Student information</h2>
            <p>Fields marked with * are required.</p>
          </div>
        </div>

        <form className="student-create-form" onSubmit={handleSubmit}>
          <div className="student-search-form__field">
            <label htmlFor="edit-admission-number">
              Admission number <span aria-hidden="true">*</span>
            </label>
            <input
              id="edit-admission-number"
              name="admissionNumber"
              value={admissionNumber}
              onChange={(event) => setAdmissionNumber(event.target.value)}
              maxLength={50}
              autoComplete="off"
              required
              disabled={saving}
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="edit-first-name">
              First name <span aria-hidden="true">*</span>
            </label>
            <input
              id="edit-first-name"
              name="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={100}
              autoComplete="given-name"
              required
              disabled={saving}
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="edit-last-name">
              Last name <span className="student-field-optional">(optional)</span>
            </label>
            <input
              id="edit-last-name"
              name="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              maxLength={100}
              autoComplete="family-name"
              disabled={saving}
            />
          </div>

          <div className="student-search-form__field">
            <label htmlFor="edit-date-of-birth">
              <CalendarDays size={13} /> Date of birth
              <span className="student-field-optional">(optional)</span>
            </label>
            <input
              id="edit-date-of-birth"
              name="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="student-edit-organization-note">
            Institution and campus are read-only here. The existing backend
            update API does not accept organization fields.
          </div>

          {formError && (
            <p className="student-create-error" role="alert">
              <AlertCircle size={16} />
              {formError}
            </p>
          )}

          <div className="student-create-actions">
            <Link
              to={`/students/${id}`}
              className="student-secondary-button"
              aria-disabled={saving}
              onClick={(event) => {
                if (saving) event.preventDefault();
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="student-primary-button"
              disabled={saving || studentQuery.isFetching}
            >
              <Save size={16} />
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
