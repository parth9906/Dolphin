import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelectedInstitutionId } from "../../organization/hooks/organization-selection";
import {
  AlertCircle,
  BookOpen,
  Files,
  LoaderCircle,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { academicService } from "../../academics/api/academic-service";
import type { StudentForEnrollment } from "../../academics/api/academic-types";
import { certificateService } from "../api/certificate-service";
import { CertificateTemplateLibrary } from "../components/CertificateTemplateLibrary";
import { CertificateTemplateForm } from "../components/CertificateTemplateForm";
import { CertificateIssueForm } from "../components/CertificateIssueForm";
import { IssuedDocumentList } from "../components/IssuedDocumentList";
import {
  IssuedDocumentPreview,
  downloadIssuedDocumentText,
  printIssuedDocument,
} from "../components/IssuedDocumentPreview";
import { TemplatePreview } from "../components/TemplatePreview";
import type {
  IssuedDocument,
} from "../api/certificate-types";

import "./certificates-page.css";


function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="cert-error" role="alert">
      <AlertCircle size={17} />
      <span>{errorText(error)}</span>
    </div>
  );
}

function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="cert-loading" role="status">
      <LoaderCircle size={17} className="cert-spin" />
      {label}
    </div>
  );
}

function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="cert-empty">
      <div className="cert-empty__icon"><Files size={23} /></div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function formatStudentName(student: StudentForEnrollment): string {
  return `${student.firstName} ${student.lastName ?? ""}`.trim();
}

export function CertificatesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const institutionId = useSelectedInstitutionId();

  const canReadTemplates = hasPermission("DOCUMENT_TEMPLATE_READ");
  const canCreateTemplates = hasPermission("DOCUMENT_TEMPLATE_CREATE");
  const canIssue = hasPermission("DOCUMENT_ISSUE");
  const canReadDocuments = hasPermission("DOCUMENT_READ");
  const canReadStudentPortal = hasPermission("STUDENT_PORTAL_READ");
  const canManage = canReadTemplates || canCreateTemplates || canIssue || canReadDocuments;

  const [mode, setMode] = useState<"manage" | "student">(canManage ? "manage" : "student");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateCode, setTemplateCode] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState(
    "This is to certify that {{student_name}}, admission number {{admission_number}}, is/was a student of {{institution_name}}.\n\nIssued on {{issue_date}}.",
  );
  const [templateError, setTemplateError] = useState("");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentForEnrollment | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [issueError, setIssueError] = useState("");
  const [activeDocument, setActiveDocument] = useState<IssuedDocument | null>(null);
  const [studentDocumentError, setStudentDocumentError] = useState("");

  const templatesQuery = useQuery({
    queryKey: ["certificates", "templates", institutionId],
    queryFn: () => certificateService.listTemplates(institutionId),
    enabled: Boolean(mode === "manage" && canReadTemplates && institutionId),
  });

  const studentSearchQuery = useQuery({
    queryKey: ["certificates", "student-search", institutionId, studentSearch.trim()],
    queryFn: () => academicService.searchStudents(institutionId, studentSearch.trim()),
    enabled: Boolean(
      mode === "manage" &&
      canIssue &&
      hasPermission("STUDENT_READ") &&
      institutionId &&
      studentSearch.trim().length >= 2
    ),
  });

  const studentDocumentsQuery = useQuery({
    queryKey: ["certificates", "student-documents", selectedStudent?.id],
    queryFn: () => certificateService.listStudentDocuments(selectedStudent!.id),
    enabled: Boolean(
      mode === "manage" &&
      canReadDocuments &&
      selectedStudent?.id
    ),
  });

  const myDocumentsQuery = useQuery({
    queryKey: ["certificates", "my-documents"],
    queryFn: () => certificateService.listMyDocuments(),
    enabled: Boolean(mode === "student" && canReadStudentPortal),
  });

  const createTemplateMutation = useMutation({
    mutationFn: () => {
      if (!institutionId) {
        throw new Error("Select an institution from Organization first.");
      }
      if (!templateCode.trim()) throw new Error("Template code is required.");
      if (!templateName.trim()) throw new Error("Template name is required.");
      if (!templateBody.trim()) throw new Error("Template body is required.");
      if (templateCode.trim().length > 50) throw new Error("Template code must be 50 characters or fewer.");
      if (templateName.trim().length > 120) throw new Error("Template name must be 120 characters or fewer.");
      if (templateBody.length > 20000) throw new Error("Template body must be 20,000 characters or fewer.");

      return certificateService.createTemplate({
        institutionId,
        code: templateCode.trim(),
        name: templateName.trim(),
        body: templateBody.trim(),
      });
    },
    onSuccess: async () => {
      setShowTemplateForm(false);
      setTemplateCode("");
      setTemplateName("");
      setTemplateError("");
      await queryClient.invalidateQueries({
        queryKey: ["certificates", "templates", institutionId],
      });
    },
    onError: (error) => setTemplateError(errorText(error)),
  });

  const issueMutation = useMutation({
    mutationFn: () => {
      if (!institutionId) throw new Error("Select an institution first.");
      if (!selectedStudent) throw new Error("Search for and select a student.");
      if (!selectedTemplateId) throw new Error("Choose a document template.");
      if (!documentTitle.trim()) throw new Error("Document title is required.");

      return certificateService.issueDocument({
        studentId: selectedStudent.id,
        institutionId,
        templateId: selectedTemplateId,
        title: documentTitle.trim(),
      });
    },
    onSuccess: async (document) => {
      setActiveDocument(document);
      setIssueError("");
      await queryClient.invalidateQueries({
        queryKey: ["certificates", "student-documents", selectedStudent?.id],
      });
    },
    onError: (error) => setIssueError(errorText(error)),
  });

  function submitTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTemplateError("");
    createTemplateMutation.mutate();
  }

  function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssueError("");
    issueMutation.mutate();
  }

  function refresh(): void {
    if (mode === "manage" && canReadTemplates && institutionId) {
      void templatesQuery.refetch();
    }

    if (mode === "manage" && canReadDocuments && selectedStudent?.id) {
      void studentDocumentsQuery.refetch();
    }

    if (
      mode === "manage" &&
      canIssue &&
      hasPermission("STUDENT_READ") &&
      institutionId &&
      studentSearch.trim().length >= 2
    ) {
      void studentSearchQuery.refetch();
    }

    if (mode === "student" && canReadStudentPortal) {
      void myDocumentsQuery.refetch();
    }
  }

  return (
    <main className="certificates-page">
      <header className="cert-hero">
        <div>
          <span className="cert-eyebrow">DOLPHIN · RECORDS</span>
          <h1>Certificates & Documents</h1>
          <p>
            Create reusable document templates, issue certificates, and access issued school records.
          </p>
        </div>
        <button className="cert-secondary-button" type="button" onClick={refresh}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {canManage && canReadStudentPortal && (
        <div className="cert-tabs" role="tablist" aria-label="Document workspace">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "manage"}
            className={mode === "manage" ? "is-active" : ""}
            onClick={() => setMode("manage")}
          >
            <Files size={17} /> Manage documents
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "student"}
            className={mode === "student" ? "is-active" : ""}
            onClick={() => setMode("student")}
          >
            <UserRound size={17} /> My documents
          </button>
        </div>
      )}

      {mode === "manage" && canManage && (
        <>
          {!institutionId && (
            <div className="cert-notice">
              <AlertCircle size={18} />
              <div>
                <strong>No institution selected</strong>
                <p>Open Organization and select an institution before managing templates or issuing documents.</p>
              </div>
            </div>
          )}

          <section className="cert-section-heading">
            <div>
              <span className="cert-eyebrow">TEMPLATE LIBRARY</span>
              <h2>Document templates</h2>
              <p>Templates support server-side text substitution when a document is issued.</p>
            </div>
            {canCreateTemplates && (
              <button className="cert-primary-button" type="button" onClick={() => {
                setTemplateError("");
                setShowTemplateForm((value) => !value);
              }}>
                <Plus size={17} /> New template
              </button>
            )}
          </section>

          {showTemplateForm && canCreateTemplates && (
            <CertificateTemplateForm
              code={templateCode}
              name={templateName}
              body={templateBody}
              error={templateError}
              isSaving={createTemplateMutation.isPending}
              canSave={Boolean(institutionId)}
              isPreviewShown={showTemplatePreview}
              onCodeChange={setTemplateCode}
              onNameChange={setTemplateName}
              onBodyChange={setTemplateBody}
              onSubmit={submitTemplate}
              onTogglePreview={() => setShowTemplatePreview((visible) => !visible)}
              onClose={() => setShowTemplateForm(false)}
            />
          )}

          {showTemplateForm && showTemplatePreview && (
            <TemplatePreview
              name={templateName}
              body={templateBody}
              onClose={() => setShowTemplatePreview(false)}
            />
          )}

          {canReadTemplates && templatesQuery.isLoading && <Loading label="Loading templates…" />}
          {canReadTemplates && templatesQuery.isError && <ErrorBox error={templatesQuery.error} />}

          {canReadTemplates && templatesQuery.data && (
            <CertificateTemplateLibrary
              templates={templatesQuery.data}
              canIssue={canIssue}
              onUseTemplate={(template) => {
                setSelectedTemplateId(template.id);
                setDocumentTitle(template.name);
                setIssueError("");
              }}
            />
          )}

          {!canReadTemplates && (
            <div className="cert-notice">
              <AlertCircle size={18} />
              <div>
                <strong>Template listing permission is not available</strong>
                <p>Your account does not have DOCUMENT_TEMPLATE_READ, so the template library cannot be loaded.</p>
              </div>
            </div>
          )}

          {canIssue && (
            <CertificateIssueForm
              canReadStudents={hasPermission("STUDENT_READ")}
              institutionSelected={Boolean(institutionId)}
              selectedStudent={selectedStudent}
              studentSearch={studentSearch}
              students={studentSearchQuery.data?.content ?? []}
              isSearchingStudents={studentSearchQuery.isFetching}
              hasStudentSearchResults={Boolean(studentSearchQuery.data)}
              studentSearchError={studentSearchQuery.isError ? errorText(studentSearchQuery.error) : ""}
              formatStudentName={formatStudentName}
              templates={templatesQuery.data}
              selectedTemplateId={selectedTemplateId}
              documentTitle={documentTitle}
              issueError={issueError}
              isIssuing={issueMutation.isPending}
              issueSucceeded={issueMutation.isSuccess && Boolean(activeDocument)}
              onStudentSearchChange={(value) => {
                setStudentSearch(value);
                setStudentDocumentError("");
              }}
              onSelectStudent={(student) => {
                setSelectedStudent(student);
                setStudentDocumentError("");
                setIssueError("");
              }}
              onClearStudent={() => setSelectedStudent(null)}
              onTemplateChange={(id) => {
                setSelectedTemplateId(id);
                const template = templatesQuery.data?.find((item) => item.id === id);
                if (template) setDocumentTitle(template.name);
              }}
              onDocumentTitleChange={setDocumentTitle}
              onSubmit={submitIssue}
            />
          )}

          {selectedStudent && canReadDocuments && (
            <section className="cert-panel cert-records-panel">
              <header className="cert-panel__header">
                <div>
                  <h2>Issued documents</h2>
                  <p>{formatStudentName(selectedStudent)} · Admission no. {selectedStudent.admissionNumber}</p>
                </div>
              </header>
              {studentDocumentsQuery.isLoading && <Loading label="Loading student documents…" />}
              {studentDocumentsQuery.isError && <ErrorBox error={studentDocumentsQuery.error} />}
              {studentDocumentsQuery.data && studentDocumentsQuery.data.length === 0 && (
                <Empty title="No documents issued" description="Issued documents for this student will appear here." />
              )}
              {studentDocumentsQuery.data && studentDocumentsQuery.data.length > 0 && (
                <IssuedDocumentList
                  documents={studentDocumentsQuery.data}
                  onView={(item) => {
                    setActiveDocument(item);
                    setStudentDocumentError("");
                  }}
                  onPrint={printIssuedDocument}
                  onDownload={downloadIssuedDocumentText}
                />
              )}
              {studentDocumentError && <ErrorBox error={studentDocumentError} />}
            </section>
          )}

          {activeDocument && (
            <IssuedDocumentPreview document={activeDocument} onClose={() => setActiveDocument(null)} />
          )}

          {!canIssue && !canReadTemplates && !canReadDocuments && (
            <Empty title="Document permissions required" description="Your account does not have a document-management permission." />
          )}
        </>
      )}

      {mode === "student" && canReadStudentPortal && (
        <section className="cert-panel">
          <header className="cert-panel__header">
            <div>
              <span className="cert-eyebrow">STUDENT RECORDS</span>
              <h2>My documents</h2>
              <p>Issued documents associated with your authenticated student account.</p>
            </div>
          </header>
          {myDocumentsQuery.isLoading && <Loading label="Loading your documents…" />}
          {myDocumentsQuery.isError && <ErrorBox error={myDocumentsQuery.error} />}
          {myDocumentsQuery.data && myDocumentsQuery.data.length === 0 && (
            <Empty title="No documents available" description="When the school issues a document to you, it will appear here." />
          )}
          {myDocumentsQuery.data && myDocumentsQuery.data.length > 0 && (
            <IssuedDocumentList
              documents={myDocumentsQuery.data}
              onView={setActiveDocument}
              onPrint={printIssuedDocument}
              onDownload={downloadIssuedDocumentText}
            />
          )}
          {activeDocument && (
            <IssuedDocumentPreview document={activeDocument} onClose={() => setActiveDocument(null)} />
          )}
        </section>
      )}

      {!canManage && !canReadStudentPortal && (
        <Empty title="Permission required" description="Your account does not have access to document management or the student document portal." />
      )}

      <footer className="cert-footer">
        <BookOpen size={16} />
        Issued documents are immutable in the current backend; template changes do not rewrite previously issued records.
      </footer>
    </main>
  );
}
