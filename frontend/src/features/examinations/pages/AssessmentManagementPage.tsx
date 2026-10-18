import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Plus,
  X,
} from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import { academicService } from "../../academics/api/academic-service";
import type { AcademicYear, ClassSection, SchoolClass } from "../../academics/api/academic-types";
import { assessmentService } from "../api/assessment-service";
import { AssessmentMarkAuditDialog } from "../components/AssessmentMarkAuditDialog";
import { AssessmentCreateDialog } from "./AssessmentCreateDialog";
import { AssessmentMarksWorkspace } from "./AssessmentMarksWorkspace";
import { AssessmentRegisterFilters } from "./AssessmentRegisterFilters";
import { AssessmentRegisterTable } from "./AssessmentRegisterTable";
import type {
  Assessment,
  AssessmentRosterItem,
  StudentMark,
} from "../api/assessment-types";

import {
  displayNumber,
  displayStudentName,
  errorMessage,
  todayLocal,
  type Option,
} from "./assessment-management-utils";

import "./assessment-management-page.css";

export function AssessmentManagementPage() {
  const { accessContext, hasPermission } = useAuth();
  const [organizationSelection] = useOrganizationSelection();

  const canRead = hasPermission("MARKS_READ");
  const canReadAudit = hasPermission("MARKS_AUDIT_READ");
  const canCreate = hasPermission("ASSESSMENT_CREATE");
  const canUpdateAssessment = hasPermission("ASSESSMENT_UPDATE");
  const canRecordMarks = hasPermission("MARKS_RECORD");
  const canUpdateMarks = hasPermission("MARKS_UPDATE");
  const canReadYears = hasPermission("ACADEMIC_YEAR_READ");
  const canReadClasses = hasPermission("CLASS_READ");
  const canReadSections = hasPermission("SECTION_READ");

  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const assessmentRequestId = useRef(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [academicError, setAcademicError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [createError, setCreateError] = useState("");
  const [assessmentName, setAssessmentName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(todayLocal());
  const [maxMarks, setMaxMarks] = useState("100");

  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(
    null,
  );
  const [roster, setRoster] = useState<AssessmentRosterItem[]>([]);
  const [results, setResults] = useState<StudentMark[]>([]);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [remarksDraft, setRemarksDraft] = useState<Record<string, string>>({});
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [auditMark, setAuditMark] = useState<StudentMark | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [savingMarkId, setSavingMarkId] = useState<string | null>(null);

  useEffect(() => {
    const selectedInstitution = organizationSelection.institution;
    const scoped = accessContext?.scopes.find(
      (scope) => scope.scopeType.toUpperCase() === "INSTITUTION",
    );

    if (selectedInstitution?.id) {
      setInstitutionId(selectedInstitution.id);
      setInstitutionName(selectedInstitution.name || null);
    } else if (scoped) {
      setInstitutionId(scoped.scopeId);
      setInstitutionName(null);
    } else {
      setInstitutionId(null);
      setInstitutionName(null);
    }
    setActiveAssessment(null);
    setRoster([]);
    setResults([]);
    setMarksDraft({});
    setRemarksDraft({});
    setWorkspaceError("");
    setWorkspaceNotice("");
    setAssessments([]);
    setTotalElements(0);
    setTotalPages(0);
    setPageError("");
    setPage(0);
  }, [accessContext?.scopes, organizationSelection.institution?.id, organizationSelection.institution?.name]);

  const loadAssessments = useCallback(async () => {
    const requestId = ++assessmentRequestId.current;
    if (!institutionId || !canRead) {
      setAssessments([]);
      setTotalElements(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const response = await assessmentService.list(institutionId, {
        page,
        size: 20,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      if (requestId !== assessmentRequestId.current) return;
      setAssessments(response.content ?? []);
      setTotalElements(response.totalElements ?? 0);
      setTotalPages(response.totalPages ?? 0);
    } catch (error) {
      if (requestId !== assessmentRequestId.current) return;
      // Keep the last successfully loaded page. A failed refresh is not an empty register.
      setPageError(errorMessage(error));
    } finally {
      if (requestId === assessmentRequestId.current) setLoading(false);
    }
  }, [institutionId, canRead, page, fromDate, toDate]);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    if (!institutionId || !canReadYears) {
      setYears([]);
      return;
    }

    let cancelled = false;
    setLoadingYears(true);
    setAcademicError("");

    academicService
      .getAcademicYears(institutionId)
      .then((items) => {
        if (!cancelled) {
          setYears(items.filter((item) => item.status !== "CLOSED"));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setAcademicError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoadingYears(false);
      });

    return () => {
      cancelled = true;
    };
  }, [institutionId, canReadYears]);

  const yearOptions = useMemo<Option[]>(
    () => years.map((item) => ({ value: item.id, label: item.name })),
    [years],
  );
  const classOptions = useMemo<Option[]>(
    () =>
      classes.map((item) => ({
        value: item.id,
        label: item.code ? `${item.name} (${item.code})` : item.name,
      })),
    [classes],
  );
  const sectionOptions = useMemo<Option[]>(
    () => sections.map((item) => ({ value: item.id, label: item.name })),
    [sections],
  );

  async function changeYear(option: Option | null) {
    const id = option?.value ?? "";
    setSelectedYearId(id);
    setSelectedClassId("");
    setSelectedSectionId("");
    setClasses([]);
    setSections([]);
    setAcademicError("");

    if (!id || !canReadClasses) return;

    setLoadingClasses(true);
    try {
      const items = await academicService.getClasses(id);
      setClasses(items.filter((item) => item.active));
    } catch (error) {
      setAcademicError(errorMessage(error));
    } finally {
      setLoadingClasses(false);
    }
  }

  async function changeClass(option: Option | null) {
    const id = option?.value ?? "";
    setSelectedClassId(id);
    setSelectedSectionId("");
    setSections([]);
    setAcademicError("");

    if (!id || !canReadSections) return;

    setLoadingSections(true);
    try {
      const items = await academicService.getSections(id);
      setSections(items.filter((item) => item.active));
    } catch (error) {
      setAcademicError(errorMessage(error));
    } finally {
      setLoadingSections(false);
    }
  }

  function resetCreateForm() {
    setEditingAssessment(null);
    setAssessmentName("");
    setSubjectName("");
    setAssessmentDate(todayLocal());
    setMaxMarks("100");
    setSelectedYearId("");
    setSelectedClassId("");
    setSelectedSectionId("");
    setClasses([]);
    setSections([]);
    setCreateError("");
    setAcademicError("");
  }

  function openCreateDialog() {
    resetCreateForm();
    setCreateOpen(true);
  }

  function openEditDialog(assessment: Assessment) {
    setCreateError("");
    setAcademicError("");
    setEditingAssessment(assessment);
    setAssessmentName(assessment.name);
    setSubjectName(assessment.subjectName);
    setAssessmentDate(assessment.assessmentDate);
    setMaxMarks(String(assessment.maxMarks));
    setSelectedYearId("");
    setSelectedClassId("");
    setSelectedSectionId("");
    setClasses([]);
    setSections([]);
    setCreateOpen(true);
  }

  async function submitAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");

    if (!editingAssessment && !institutionId) {
      setCreateError("Select an institution before creating an assessment.");
      return;
    }

    const maximum = Number(maxMarks);
    if (!Number.isFinite(maximum) || maximum <= 0) {
      setCreateError("Maximum marks must be greater than zero.");
      return;
    }

    setSavingAssessment(true);
    try {
      const currentEditingAssessment = editingAssessment;

      if (currentEditingAssessment) {
        await assessmentService.update(currentEditingAssessment.id, {
          scopeType: currentEditingAssessment.scopeType,
          schoolClassId: currentEditingAssessment.schoolClassId ?? null,
          sectionId: currentEditingAssessment.sectionId ?? null,
          name: assessmentName.trim(),
          subjectName: subjectName.trim(),
          assessmentDate: currentEditingAssessment.assessmentDate,
          maxMarks: maximum,
        });
      } else {
        const scopeType = selectedSectionId
          ? "SECTION"
          : selectedClassId
            ? "CLASS"
            : "INSTITUTION";

        await assessmentService.create({
          institutionId: institutionId!,
          scopeType,
          schoolClassId: scopeType === "CLASS" ? selectedClassId : null,
          sectionId: scopeType === "SECTION" ? selectedSectionId : null,
          name: assessmentName.trim(),
          subjectName: subjectName.trim(),
          assessmentDate,
          maxMarks: maximum,
        });
      }

      setCreateOpen(false);
      setPage(0);
      setNotice(
        currentEditingAssessment
          ? "Assessment updated successfully."
          : "Assessment created successfully.",
      );
      setEditingAssessment(null);
      await loadAssessments();
    } catch (error) {
      setCreateError(errorMessage(error));
    } finally {
      setSavingAssessment(false);
    }
  }

  async function openMarksWorkspace(assessment: Assessment) {
    setActiveAssessment(assessment);
    setRoster([]);
    setResults([]);
    setMarksDraft({});
    setRemarksDraft({});
    setWorkspaceError("");
    setWorkspaceNotice("");

    if (!canRead) {
      setWorkspaceError(
        "Your account requires MARKS_READ permission to open this marks register.",
      );
      return;
    }

    setWorkspaceLoading(true);

    try {
      const firstPage = await assessmentService.getRoster(assessment.id, 0, 100);
      const students: AssessmentRosterItem[] = [...(firstPage.content ?? [])];

      // Fetch all remaining pages so large institution/class rosters are complete.
      for (
        let pageIndex = 1;
        pageIndex < firstPage.totalPages;
        pageIndex += 1
      ) {
        const nextPage = await assessmentService.getRoster(
          assessment.id,
          pageIndex,
          firstPage.size || 100,
        );
        students.push(...(nextPage.content ?? []));
      }

      // The roster response already contains existing mark data, scoped by Dolphin.
      const savedMarks: StudentMark[] = students
        .filter((student) => student.markId !== null)
        .map((student) => ({
          markId: student.markId as string,
          assessmentId: assessment.id,
          studentId: student.studentId,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          marksObtained: student.marksObtained ?? 0,
          maxMarks: student.maxMarks ?? assessment.maxMarks,
          remarks: student.remarks,
          version: student.version ?? 0,
        }));

      const markByStudent = new Map(
        savedMarks.map((mark) => [mark.studentId, mark]),
      );

      const initialMarks: Record<string, string> = {};
      const initialRemarks: Record<string, string> = {};

      for (const student of students) {
        const existing = markByStudent.get(student.studentId);
        initialMarks[student.studentId] = existing
          ? String(existing.marksObtained)
          : "";
        initialRemarks[student.studentId] = existing?.remarks ?? "";
      }

      setRoster(students);
      setResults(savedMarks);
      setMarksDraft(initialMarks);
      setRemarksDraft(initialRemarks);
    } catch (error) {
      setWorkspaceError(errorMessage(error));
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function saveNewMarks() {
    if (!activeAssessment) return;

    const existingIds = new Set(results.map((mark) => mark.studentId));
    const pending = roster.filter(
      (student) =>
        !existingIds.has(student.studentId) &&
        (marksDraft[student.studentId] ?? "").trim() !== "",
    );

    if (pending.length === 0) {
      setWorkspaceNotice(
        "Enter marks for at least one student who does not already have a saved result.",
      );
      return;
    }

    if (pending.length > 500) {
      setWorkspaceError("Save no more than 500 student marks in one submission.");
      return;
    }

    const invalidStudent = pending.find((student) => {
      const raw = marksDraft[student.studentId];
      const number = Number(raw);
      return (
        raw.trim() === "" ||
        !Number.isFinite(number) ||
        number < 0 ||
        number > Number(activeAssessment.maxMarks)
      );
    });

    if (invalidStudent) {
      setWorkspaceError(
        `Enter a valid mark from 0 to ${displayNumber(activeAssessment.maxMarks)} for ${displayStudentName(invalidStudent)}.`,
      );
      return;
    }

    setSavingMarks(true);
    setWorkspaceError("");
    setWorkspaceNotice("");

    try {
      const saved = await assessmentService.recordMarks(activeAssessment.id, {
        records: pending.map((student) => ({
          studentId: student.studentId,
          marksObtained: Number(marksDraft[student.studentId]),
          remarks: (remarksDraft[student.studentId] ?? "").trim(),
        })),
      });

      setResults((current) => {
        const merged = new Map(current.map((mark) => [mark.studentId, mark]));
        for (const mark of saved) merged.set(mark.studentId, mark);
        return Array.from(merged.values());
      });
      setWorkspaceNotice(`Saved marks for ${saved.length} student(s).`);
      await loadAssessments();
    } catch (error) {
      setWorkspaceError(errorMessage(error));
    } finally {
      setSavingMarks(false);
    }
  }

  async function saveEditedMark(
    student: AssessmentRosterItem,
    existing: StudentMark,
  ) {
    if (!activeAssessment || !canUpdateMarks) return;

    if (!activeAssessment.active) {
      setWorkspaceError("Marks cannot be changed for an inactive assessment.");
      return;
    }

    const rawMarks = (marksDraft[student.studentId] ?? "").trim();
    const value = Number(rawMarks);

    if (
      !rawMarks ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > Number(activeAssessment.maxMarks)
    ) {
      setWorkspaceError(
        `Enter a valid mark from 0 to ${displayNumber(activeAssessment.maxMarks)} for ${displayStudentName(student)}.`,
      );
      return;
    }

    const remarks = (remarksDraft[student.studentId] ?? "").trim();

    if (remarks.length > 500) {
      setWorkspaceError("Remarks must not exceed 500 characters.");
      return;
    }

    setSavingMarkId(existing.markId);
    setWorkspaceError("");
    setWorkspaceNotice("");

    try {
      const saved = await assessmentService.updateMark(existing.markId, {
        version: existing.version,
        marksObtained: value,
        remarks: remarks || null,
      });

      setResults((current) =>
        current.map((mark) => mark.markId === saved.markId ? saved : mark),
      );
      setMarksDraft((current) => ({
        ...current,
        [saved.studentId]: String(saved.marksObtained),
      }));
      setRemarksDraft((current) => ({
        ...current,
        [saved.studentId]: saved.remarks ?? "",
      }));
      setEditingStudentId(null);
      setWorkspaceNotice(`Updated marks for ${displayStudentName(student)}.`);
    } catch (error) {
      const message = errorMessage(error);
      const staleVersion =
        /updated by someone else|reload the latest mark|stale resource version|version conflict/i.test(message);

      setWorkspaceError(
        staleVersion
          ? `${message} Close and reopen the marks register to reload the latest version before editing again.`
          : message,
      );

      if (staleVersion) setEditingStudentId(null);
    } finally {
      setSavingMarkId(null);
    }
  }

  const resultByStudentId = useMemo(
    () => new Map(results.map((mark) => [mark.studentId, mark])),
    [results],
  );

  return (
    <main className="asm-page">
      <header className="asm-header">
        <div>
          <div className="asm-eyebrow">
            <BookOpenCheck size={15} />
            ACADEMICS
          </div>
          <h1>Examinations &amp; Marks</h1>
          <p>Create assessments, record student results and review existing marks.</p>
          {institutionName && (
            <span className="asm-context">{institutionName}</span>
          )}
        </div>

        {canCreate && (
          <button
            type="button"
            className="asm-button asm-button--primary"
            onClick={openCreateDialog}
          >
            <Plus size={17} />
            Create assessment
          </button>
        )}
      </header>

      {notice && (
        <div className="asm-alert asm-alert--success" role="status">
          <ClipboardCheck size={17} />
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {!institutionId && (
        <div className="asm-alert asm-alert--warning" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>No institution is selected.</strong>
            <p>Choose an institution in your organization context and return here.</p>
          </div>
        </div>
      )}

      {pageError && (
        <div className="asm-alert asm-alert--error" role="alert">
          <AlertCircle size={17} />
          <span>{pageError}</span>
          <button className="asm-text-button" type="button" onClick={() => void loadAssessments()}>
            Retry
          </button>
        </div>
      )}

      <section className="asm-metrics">
        <article className="asm-metric">
          <span className="asm-metric__icon"><BookOpenCheck size={18} /></span>
          <div>
            <span className="asm-metric__label">Assessments found</span>
            <strong>{canRead ? totalElements : "—"}</strong>
          </div>
        </article>
        <article className="asm-metric">
          <span className="asm-metric__icon"><CalendarDays size={18} /></span>
          <div>
            <span className="asm-metric__label">Current page</span>
            <strong>{canRead && totalElements ? page + 1 : "—"}</strong>
          </div>
        </article>
        <article className="asm-metric">
          <span className="asm-metric__icon"><ClipboardCheck size={18} /></span>
          <div>
            <span className="asm-metric__label">Results on this page</span>
            <strong>{canRead ? assessments.length : "—"}</strong>
          </div>
        </article>
      </section>

      <section className="asm-panel">
        <AssessmentRegisterFilters
          loading={loading}
          canRefresh={Boolean(institutionId && canRead)}
          fromDate={fromDate}
          toDate={toDate}
          onRefresh={() => void loadAssessments()}
          onFromDateChange={(value) => {
            setFromDate(value);
            setPage(0);
          }}
          onToDateChange={(value) => {
            setToDate(value);
            setPage(0);
          }}
          onClear={() => {
            setFromDate("");
            setToDate("");
            setPage(0);
          }}
        />

        {!canRead ? (
          <div className="asm-empty">
            <ClipboardCheck size={30} />
            <h3>Assessment read permission required</h3>
            <p>Your account does not have MARKS_READ.</p>
          </div>
        ) : loading ? (
          <div className="asm-loading">
            <span className="asm-spinner" />
            Loading assessments…
          </div>
        ) : pageError && assessments.length === 0 ? (
          <div className="asm-empty" role="status">
            <AlertCircle size={30} />
            <h3>Assessments could not be loaded</h3>
            <p>Retry the request. The register will show an empty state only after a successful response confirms there are no assessments.</p>
            <button
              type="button"
              className="asm-button asm-button--secondary"
              onClick={() => void loadAssessments()}
              disabled={loading}
            >
              Retry loading assessments
            </button>
          </div>
        ) : assessments.length === 0 ? (
          <div className="asm-empty">
            <BookOpenCheck size={30} />
            <h3>No assessments found</h3>
            <p>
              {fromDate || toDate
                ? "Try clearing or widening the selected date range."
                : "Create an assessment to start recording marks."}
            </p>
            {canCreate && (
              <button
                type="button"
                className="asm-button asm-button--secondary"
                onClick={openCreateDialog}
              >
                <Plus size={16} />
                Create assessment
              </button>
            )}
          </div>
        ) : (
          <AssessmentRegisterTable
            assessments={assessments}
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            loading={loading}
            canRead={canRead}
            canUpdateAssessment={canUpdateAssessment}
            onEdit={openEditDialog}
            onOpenMarks={(assessment) => void openMarksWorkspace(assessment)}
            onPageChange={setPage}
          />
        )}
      </section>

      {createOpen && (
        <AssessmentCreateDialog
          editingAssessment={editingAssessment}
          savingAssessment={savingAssessment}
          institutionId={institutionId}
          onClose={() => setCreateOpen(false)}
          onSubmit={submitAssessment}
          assessmentName={assessmentName}
          setAssessmentName={setAssessmentName}
          subjectName={subjectName}
          setSubjectName={setSubjectName}
          assessmentDate={assessmentDate}
          setAssessmentDate={setAssessmentDate}
          maxMarks={maxMarks}
          setMaxMarks={setMaxMarks}
          yearOptions={yearOptions}
          selectedYearId={selectedYearId}
          loadingYears={loadingYears}
          canReadYears={canReadYears}
          changeYear={changeYear}
          classOptions={classOptions}
          selectedClassId={selectedClassId}
          loadingClasses={loadingClasses}
          canReadClasses={canReadClasses}
          changeClass={changeClass}
          sectionOptions={sectionOptions}
          selectedSectionId={selectedSectionId}
          loadingSections={loadingSections}
          canReadSections={canReadSections}
          setSelectedSectionId={setSelectedSectionId}
          academicError={academicError}
          createError={createError}
        />
      )}

      {activeAssessment && (
        <AssessmentMarksWorkspace
          activeAssessment={activeAssessment}
          setActiveAssessment={setActiveAssessment}
          workspaceNotice={workspaceNotice}
          setWorkspaceNotice={setWorkspaceNotice}
          workspaceError={workspaceError}
          setWorkspaceError={setWorkspaceError}
          canRead={canRead}
          openMarksWorkspace={openMarksWorkspace}
          workspaceLoading={workspaceLoading}
          roster={roster}
          results={results}
          marksDraft={marksDraft}
          setMarksDraft={setMarksDraft}
          remarksDraft={remarksDraft}
          setRemarksDraft={setRemarksDraft}
          canRecordMarks={canRecordMarks}
          canUpdateMarks={canUpdateMarks}
          canReadAudit={canReadAudit}
          savingMarks={savingMarks}
          savingMarkId={savingMarkId}
          editingStudentId={editingStudentId}
          setEditingStudentId={setEditingStudentId}
          saveEditedMark={saveEditedMark}
          setAuditMark={setAuditMark}
          saveNewMarks={saveNewMarks}
        />
      )}

      {auditMark && (
        <AssessmentMarkAuditDialog
          mark={auditMark}
          onClose={() => setAuditMark(null)}
        />
      )}
    </main>
  );
}
