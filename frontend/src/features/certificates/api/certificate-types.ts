export interface DocumentTemplate {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  body: string;
  active: boolean;
}

export interface IssuedDocument {
  id: string;
  studentId: string;
  institutionId: string;
  templateId: string;
  templateName: string;
  title: string;
  content: string;
  issuedByUserId: string;
  issuedAt: string;
}

export interface CertificateStudent {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  active: boolean;
}
