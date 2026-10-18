export type DisciplineCategory =
  | "BULLYING"
  | "PHYSICAL_AGGRESSION"
  | "DISRUPTION"
  | "DISRESPECT"
  | "ACADEMIC_DISHONESTY"
  | "PROPERTY_DAMAGE"
  | "ATTENDANCE"
  | "OTHER";

export type DisciplineSeverity = "MINOR" | "MODERATE" | "MAJOR";

export type DisciplineStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "CLOSED";

export interface DisciplineIncident {
  id: string;
  institutionId: string;
  campusId: string | null;
  studentId: string;
  admissionNumber: string;
  category: DisciplineCategory;
  severity: DisciplineSeverity;
  description: string;
  incidentDate: string;
  status: DisciplineStatus;
  reportedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisciplineIncidentRequest {
  institutionId: string;
  campusId?: string | null;
  studentId: string;
  category: DisciplineCategory;
  severity: DisciplineSeverity;
  description: string;
  incidentDate: string;
}

export interface DisciplineSearchFilters {
  institutionId: string;
  studentId?: string;
  status?: DisciplineStatus;
  severity?: DisciplineSeverity;
  fromDate?: string;
  toDate?: string;
  page: number;
  size: number;
}

export interface DisciplinePage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface DisciplineStatusOption {
  value: DisciplineStatus;
  label: string;
}
