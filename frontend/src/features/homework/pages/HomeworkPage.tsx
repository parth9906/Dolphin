import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelectedInstitutionId } from "../../organization/hooks/organization-selection";
import { confirmAction } from "../../../lib/ui/dialogs";
import Select, { type StylesConfig } from "react-select";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  LoaderCircle,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/use-auth";
import { academicService } from "../../academics/api/academic-service";
import type {
  AcademicYear,
  ClassSection,
  SchoolClass,
} from "../../academics/api/academic-types";
import { homeworkService } from "../api/homework-service";
import type {
  Assignment,
  AssignmentSubmission,
} from "../api/homework-types";
import { HomeworkSubmissionReview } from "../components/HomeworkSubmissionReview";
import { HomeworkAssignmentLibrary } from "../components/HomeworkAssignmentLibrary";
import { HomeworkAssignmentForm } from "../components/HomeworkAssignmentForm";
import { StudentAssignmentDetails } from "../components/StudentAssignmentDetails";
import { StudentAssignmentLibrary } from "../components/StudentAssignmentLibrary";
import "./homework-page.css";

type HomeworkFilterOption = {
  value: string;
  label: string;
};

const statusFilterOptions: HomeworkFilterOption[] = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

const statusFilterStyles: StylesConfig<HomeworkFilterOption, false> = {
  container: (base) => ({
    ...base,
    width: 190,
    minWidth: 190,
  }),
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 12,
    borderColor: state.isFocused ? "#3867e8" : "#d8e2f0",
    backgroundColor: "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(56, 103, 232, 0.14)" : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#3867e8",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 14px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#334155",
    fontWeight: 600,
  }),
  input: (base) => ({
    ...base,
    color: "#334155",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#64748b",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#3867e8" : "#64748b",
    "&:hover": {
      color: "#3867e8",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 1000,
    marginTop: 6,
    padding: 0,
    border: "1px solid #dbe3ef",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.16)",
  }),
  menuList: (base) => ({
    ...base,
    padding: 6,
  }),
  option: (base, state) => ({
    ...base,
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#334155",
    fontWeight: state.isSelected ? 600 : 500,
    backgroundColor: state.isSelected
      ? "#eaf0ff"
      : state.isFocused
        ? "#f4f7fb"
        : "#ffffff",
    "&:active": {
      backgroundColor: "#dce7ff",
    },
  }),
};




function localDateTime(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(date);
}

function deadlineIndicator(
  value: string,
): { label: string; urgency: "today" | "soon" | "passed" } | null {
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return null;

  const now = new Date();

  if (dueDate.getTime() <= now.getTime()) {
    return { label: "Deadline passed", urgency: "passed" };
  }

  const isToday =
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getDate() === now.getDate();

  if (isToday) {
    return { label: "Due today", urgency: "today" };
  }

  if (dueDate.getTime() - now.getTime() <= 48 * 60 * 60 * 1000) {
    return { label: "Due soon", urgency: "soon" };
  }

  return null;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function ErrorBox({ error }: { error: unknown }) {
  return <div className="hw-error" role="alert"><AlertCircle size={17} /><span>{errorText(error)}</span></div>;
}

function Loading({ text = "Loading…" }: { text?: string }) {
  return <div className="hw-loading" role="status"><LoaderCircle size={17} className="hw-spin" />{text}</div>;
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="hw-empty">
      <div className="hw-empty__icon"><BookOpen size={23} /></div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}


export function HomeworkPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const institutionId = useSelectedInstitutionId();

  const canRead = hasPermission("ASSIGNMENT_READ");
  const canCreate = hasPermission("ASSIGNMENT_CREATE");
  const canUpdate = hasPermission("ASSIGNMENT_UPDATE");
  const canPublish = hasPermission("ASSIGNMENT_PUBLISH");
  const canReadSubmissions = hasPermission("ASSIGNMENT_SUBMISSION_READ");
  const canGrade = hasPermission("ASSIGNMENT_SUBMISSION_GRADE");
  const canManage = canRead || canCreate || canUpdate || canPublish || canReadSubmissions || canGrade;
  const canUseStudentPortal = hasPermission("STUDENT_PORTAL_READ");
  const canSubmit = hasPermission("ASSIGNMENT_SUBMISSION_CREATE");

  const [mode, setMode] = useState<"manage" | "student">(canManage ? "manage" : "student");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignmentPage, setAssignmentPage] = useState(0);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState(() => localDateTime(new Date(Date.now() + 7 * 86400000)));
  const [maxMarks, setMaxMarks] = useState("100");
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionPage, setSubmissionPage] = useState(0);
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [submissionText, setSubmissionText] = useState("");
const [originalSubmissionText, setOriginalSubmissionText] = useState("");
const isStudentResponseDirty =
  Boolean(selectedStudentAssignment) &&
  canSubmit &&
  submissionText !== originalSubmissionText;
  const [studentFeedback, setStudentFeedback] = useState("");
  const [studentAssignmentPage, setStudentAssignmentPage] = useState(0);

  const yearsQuery = useQuery({
    queryKey: ["homework", "academic-years", institutionId],
    queryFn: () => academicService.getAcademicYears(institutionId),
    enabled: Boolean(institutionId && canCreate && mode === "manage"),
  });
  const years: AcademicYear[] = yearsQuery.data ?? [];

  useEffect(() => {
    if (years.length && !years.some((year) => year.id === yearId)) {
      setYearId(years[0].id);
    }
  }, [years, yearId]);

  const classesQuery = useQuery({
    queryKey: ["homework", "classes", yearId],
    queryFn: () => academicService.getClasses(yearId),
    enabled: Boolean(yearId && canCreate && mode === "manage"),
  });
  const classes: SchoolClass[] = classesQuery.data ?? [];

  useEffect(() => {
    if (!classes.some((item) => item.id === classId)) setClassId(classes[0]?.id ?? "");
  }, [classes, classId]);

  const sectionsQuery = useQuery({
    queryKey: ["homework", "sections", classId],
    queryFn: () => academicService.getSections(classId),
    enabled: Boolean(classId && canCreate && mode === "manage"),
  });
  const sections: ClassSection[] = sectionsQuery.data ?? [];

  useEffect(() => {
    if (!sections.some((item) => item.id === sectionId)) setSectionId(sections[0]?.id ?? "");
  }, [sections, sectionId]);

  const assignmentsQuery = useQuery({
    queryKey: ["homework", "assignments", institutionId, statusFilter, assignmentPage],
    queryFn: () => homeworkService.listAssignments(institutionId, statusFilter, assignmentPage),
    enabled: Boolean(mode === "manage" && canRead && institutionId),
  });

  const studentAssignmentsQuery = useQuery({
    queryKey: ["homework", "my-assignments", studentAssignmentPage],
    queryFn: () => homeworkService.listMyAssignments(studentAssignmentPage),
    enabled: Boolean(mode === "student" && canUseStudentPortal),
  });

  const submissionsQuery = useQuery({
    queryKey: ["homework", "submissions", selectedAssignment?.id, submissionPage],
    queryFn: () => homeworkService.listSubmissions(selectedAssignment!.id, submissionPage),
    enabled: Boolean(mode === "manage" && selectedAssignment && canReadSubmissions),
  });

  const ownSubmissionQuery = useQuery({
    queryKey: ["homework", "my-submission", selectedStudentAssignment?.id],
    queryFn: async () => {
      try {
        return await homeworkService.getMySubmission(selectedStudentAssignment!.id);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          (error as { status?: number }).status === 404
        ) return null;
        throw error;
      }
    },
    enabled: Boolean(mode === "student" && selectedStudentAssignment && canUseStudentPortal),
    retry: false,
  });

  useEffect(() => {
  if (isStudentResponseDirty) return;

  const savedText = ownSubmissionQuery.data?.submissionText ?? "";
  setSubmissionText(savedText);
  setOriginalSubmissionText(savedText);
}, [
  selectedStudentAssignment?.id,
  ownSubmissionQuery.data?.id,
  ownSubmissionQuery.data?.updatedAt,
  isStudentResponseDirty,
]);

useEffect(() => {
  setStudentFeedback("");
}, [selectedStudentAssignment?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!institutionId) throw new Error("Select an institution from Organization before creating assignments.");
      if (!title.trim()) throw new Error("Assignment title is required.");
      if (!instructions.trim()) throw new Error("Assignment instructions are required.");
      if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) throw new Error("Choose a valid due date.");
      if (!Number.isFinite(Number(maxMarks)) || Number(maxMarks) < 0.01) throw new Error("Maximum marks must be at least 0.01.");

      const common = {
        title: title.trim(),
        instructions: instructions.trim(),
        dueAt: new Date(dueAt).toISOString(),
        maxMarks: Number(maxMarks),
      };

      if (editing) {
        return homeworkService.updateDraft(editing.id, {
          version: editing.version,
          ...common,
        });
      }
      if (!sectionId) throw new Error("Choose a class section.");
      return homeworkService.createAssignment({
        institutionId,
        sectionId,
        ...common,
      });
    },
    onSuccess: async () => {
      setShowForm(false);
      setEditing(null);
      setFormError("");
      await queryClient.invalidateQueries({ queryKey: ["homework", "assignments"] });
    },
    onError: (error) => setFormError(errorText(error)),
  });

  const publishMutation = useMutation({
    mutationFn: (assignment: Assignment) =>
      homeworkService.publish(assignment.id, assignment.version),
    onSuccess: async () => {
      setSelectedAssignment(null);
      await queryClient.invalidateQueries({ queryKey: ["homework", "assignments"] });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAssignment || !selectedSubmission) throw new Error("Choose a submission to grade.");
      if (!gradeMarks.trim()) throw new Error("Enter marks before saving the grade.");
      const marks = Number(gradeMarks);
      if (!Number.isFinite(marks) || marks < 0) throw new Error("Marks must be zero or greater.");
      if (marks > selectedSubmission.maxMarks) throw new Error("Marks cannot exceed the assignment maximum.");
      return homeworkService.gradeSubmission(selectedAssignment.id, selectedSubmission.id, {
        marksObtained: marks,
        feedback: gradeFeedback.trim() || null,
        version: selectedSubmission.version,
      });
    },
    onSuccess: async () => {
      setSelectedSubmission(null);
      await queryClient.invalidateQueries({ queryKey: ["homework", "submissions", selectedAssignment?.id] });
    },
  });

  const confirmDiscardStudentResponse = async (): Promise<boolean> => {
    if (!isStudentResponseDirty) return true;
    return confirmAction({
      title: "Discard unsaved response?",
      text: "Your changes to this assignment response will be lost.",
      confirmButtonText: "Discard response",
      cancelButtonText: "Keep editing",
    });
  };

useEffect(() => {
  if (!isStudentResponseDirty) return;

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isStudentResponseDirty]);

const submitMutation = useMutation({
    mutationFn: () => {
      if (!selectedStudentAssignment) throw new Error("Choose an assignment.");
      if (!submissionText.trim()) throw new Error("Write your submission before sending it.");
      return homeworkService.submitMyAssignment(
        selectedStudentAssignment.id,
        submissionText.trim(),
        ownSubmissionQuery.data?.version ?? undefined,
      );
    },
    onSuccess: async () => {
  const savedText = submissionText.trim();
  setSubmissionText(savedText);
  setOriginalSubmissionText(savedText);
  setStudentFeedback("Your submission was saved.");
  await queryClient.invalidateQueries({
    queryKey: ["homework", "my-submission", selectedStudentAssignment?.id],
  });
},
    onError: (error) => setStudentFeedback(errorText(error)),
  });

  function openCreateForm() {
    setEditing(null);
    setTitle("");
    setInstructions("");
    setDueAt(localDateTime(new Date(Date.now() + 7 * 86400000)));
    setMaxMarks("100");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(assignment: Assignment) {
    setEditing(assignment);
    setTitle(assignment.title);
    setInstructions(assignment.instructions);
    setDueAt(localDateTime(new Date(assignment.dueAt)));
    setMaxMarks(String(assignment.maxMarks));
    setFormError("");
    setShowForm(true);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    saveMutation.mutate();
  }

  function canEditDraft(assignment: Assignment) {
    return assignment.status === "DRAFT" && canUpdate;
  }

  function handleGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    gradeMutation.mutate();
  }

  function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStudentFeedback("");
    submitMutation.mutate();
  }

  return (
    <main className="homework-page">
      <header className="hw-hero">
        <div>
          <span className="hw-eyebrow">DOLPHIN · LEARNING</span>
          <h1>Homework & Assignments</h1>
          <p>Create classwork, publish tasks, review student submissions, and track your own work.</p>
        </div>
        <button className="hw-secondary-button" type="button" onClick={() => {
          void assignmentsQuery.refetch();
          void studentAssignmentsQuery.refetch();
          void submissionsQuery.refetch();
          void ownSubmissionQuery.refetch();
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {canManage && canUseStudentPortal && (
        <div className="hw-mode-tabs" role="tablist" aria-label="Assignment workspace">
          <button type="button" role="tab" aria-selected={mode === "manage"} className={mode === "manage" ? "is-active" : ""} onClick={async () => { if (mode === "manage") return; if (!(await confirmDiscardStudentResponse())) return; setSelectedStudentAssignment(null); setSubmissionText(""); setOriginalSubmissionText(""); setStudentFeedback(""); setMode("manage"); }}>
            <Users size={17} /> Manage assignments
          </button>
          <button type="button" role="tab" aria-selected={mode === "student"} className={mode === "student" ? "is-active" : ""} onClick={() => { if (mode === "student") return; setMode("student"); }}>
            <GraduationCap size={17} /> My assignments
          </button>
        </div>
      )}

      {mode === "manage" && canManage && (
        <>
          <section className="hw-toolbar">
            <div>
              <span className="hw-eyebrow">STAFF WORKSPACE</span>
              <h2>Assignment library</h2>
              <p>Drafts can be edited; publishing makes an assignment available to enrolled students.</p>
            </div>
            <div className="hw-toolbar__actions">
              {canRead && (
                <Select<HomeworkFilterOption, false>
                  aria-label="Filter assignment status"
                  classNamePrefix="hw-status-filter"
                  options={statusFilterOptions}
                  value={
                    statusFilterOptions.find((option) => option.value === statusFilter)
                    ?? statusFilterOptions[0]
                  }
                  isSearchable={false}
                  onChange={(option) => {
                    setStatusFilter(option?.value ?? "ALL");
                    setAssignmentPage(0);
                  }}
                  styles={statusFilterStyles}
                />
              )}
              {canCreate && (
                <button className="hw-primary-button" type="button" onClick={openCreateForm}>
                  <Plus size={17} /> New assignment
                </button>
              )}
            </div>
          </section>

          {!institutionId && canRead && (
            <div className="hw-notice">
              <AlertCircle size={18} />
              <div><strong>No institution selected</strong><p>Open Organization and select an institution before managing assignments.</p></div>
            </div>
          )}

          {showForm && (
            <HomeworkAssignmentForm
              editing={editing}
              canCreate={canCreate}
              title={title}
              instructions={instructions}
              dueAt={dueAt}
              maxMarks={maxMarks}
              yearId={yearId}
              classId={classId}
              sectionId={sectionId}
              formError={formError}
              saving={saveMutation.isPending}
              years={years}
              classes={classes}
              sections={sections}
              yearsLoading={yearsQuery.isLoading}
              classesLoading={classesQuery.isLoading}
              sectionsLoading={sectionsQuery.isLoading}
              yearsError={yearsQuery.isError ? yearsQuery.error : undefined}
              classesError={classesQuery.isError ? classesQuery.error : undefined}
              sectionsError={sectionsQuery.isError ? sectionsQuery.error : undefined}
              selectStyles={statusFilterStyles}
              onSubmit={handleSave}
              onClose={() => { setShowForm(false); setEditing(null); }}
              onTitleChange={setTitle}
              onInstructionsChange={setInstructions}
              onDueAtChange={setDueAt}
              onMaxMarksChange={setMaxMarks}
              onYearChange={setYearId}
              onClassChange={setClassId}
              onSectionChange={setSectionId}
              onClassReset={() => setClassId("")}
              onSectionReset={() => setSectionId("")}
            />
          )}
          {!canRead && (
            <Empty title="Assignment listing permission required" description="Your account can create or manage assignments but does not have permission to browse the assignment library." />
          )}

          {canRead && assignmentsQuery.isLoading && <Loading text="Loading assignments…" />}
          {canRead && assignmentsQuery.isError && <ErrorBox error={assignmentsQuery.error} />}

          {canRead && assignmentsQuery.data && (
            <>
              <HomeworkAssignmentLibrary
                page={assignmentsQuery.data}
                canEditDraft={canEditDraft}
                canPublish={canPublish}
                canReadSubmissions={canReadSubmissions}
                isPublishing={publishMutation.isPending}
                formatDate={displayDate}
                onEdit={openEditForm}
                onPublish={async (assignment) => {
                  if (await confirmAction({
                    title: "Publish assignment?",
                    text: `“${assignment.title}” will become available to enrolled students. This cannot be undone.`,
                    confirmButtonText: "Publish assignment",
                    cancelButtonText: "Keep as draft",
                  })) publishMutation.mutate(assignment);
                }}
                onOpenSubmissions={(assignment) => {
                  setSelectedAssignment(assignment);
                  setSelectedSubmission(null);
                  setSubmissionPage(0);
                }}
                onPageChange={setAssignmentPage}
              />
            </>
          )}

          {publishMutation.isError && <ErrorBox error={publishMutation.error} />}

          {selectedAssignment && canReadSubmissions && (
            <HomeworkSubmissionReview
              assignment={selectedAssignment}
              submissions={submissionsQuery.data?.content ?? []}
              totalPages={submissionsQuery.data?.totalPages ?? 0}
              currentPage={submissionsQuery.data?.number ?? submissionPage}
              isLoading={submissionsQuery.isLoading}
              isFetching={submissionsQuery.isFetching}
              error={submissionsQuery.error}
              hasError={submissionsQuery.isError}
              canGrade={canGrade}
              selectedSubmission={selectedSubmission}
              gradeMarks={gradeMarks}
              gradeFeedback={gradeFeedback}
              isSavingGrade={gradeMutation.isPending}
              gradeError={gradeMutation.error}
              hasGradeError={gradeMutation.isError}
              onClose={() => {
                setSelectedAssignment(null);
                setSelectedSubmission(null);
                setSubmissionPage(0);
              }}
              onSelectSubmission={(submission) => {
                setSelectedSubmission(submission);
                setGradeMarks("");
                setGradeFeedback("");
              }}
              onGradeMarksChange={setGradeMarks}
              onGradeFeedbackChange={setGradeFeedback}
              onGrade={handleGrade}
              onPageChange={setSubmissionPage}
              formatDate={displayDate}
            />
          )}
        </>
      )}

      {mode === "student" && canUseStudentPortal && (
        <>
          <section className="hw-toolbar">
            <div>
              <span className="hw-eyebrow">STUDENT WORKSPACE</span>
              <h2>My assignments</h2>
              <p>View published assignments for your active section and submit your work as text.</p>
            </div>
          </section>
          {studentAssignmentsQuery.isLoading && <Loading text="Loading your assignments…" />}
          {studentAssignmentsQuery.isError && <ErrorBox error={studentAssignmentsQuery.error} />}
          <StudentAssignmentLibrary
            page={studentAssignmentsQuery.data}
            isFetching={studentAssignmentsQuery.isFetching}
            selectedAssignmentId={selectedStudentAssignment?.id ?? null}
            formatDate={displayDate}
            deadlineIndicator={deadlineIndicator}
            onOpenAssignment={async (assignment) => {
              if (selectedStudentAssignment?.id === assignment.id) return;
              if (!(await confirmDiscardStudentResponse())) return;
              setSubmissionText("");
              setOriginalSubmissionText("");
              setStudentFeedback("");
              setSelectedStudentAssignment(assignment);
            }}
            onPageChange={setStudentAssignmentPage}
          />

          {selectedStudentAssignment && (
            <StudentAssignmentDetails
              assignment={selectedStudentAssignment}
              submission={ownSubmissionQuery.data}
              isLoadingSubmission={ownSubmissionQuery.isLoading}
              submissionError={ownSubmissionQuery.error}
              hasSubmissionError={ownSubmissionQuery.isError}
              canSubmit={canSubmit}
              responseText={submissionText}
              feedback={studentFeedback}
              isSubmitting={submitMutation.isPending}
              submitError={submitMutation.isError}
              onResponseTextChange={setSubmissionText}
              onSubmit={handleStudentSubmit}
              onClose={async () => {
                if (!(await confirmDiscardStudentResponse())) return;
                setSelectedStudentAssignment(null);
                setSubmissionText("");
                setOriginalSubmissionText("");
                setStudentFeedback("");
              }}
              formatDate={displayDate}
            />
          )}

        </>
      )}

      {!canManage && !canUseStudentPortal && (
        <Empty title="Permission required" description="Your account does not have an assignment or student portal permission." />
      )}

      <footer className="hw-footer">
        <GraduationCap size={16} />
        Assignments are restricted by institution, section, enrolment, and your account permissions.
      </footer>
    </main>
  );
}
