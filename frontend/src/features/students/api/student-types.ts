export interface Student {
  id: string;
  institutionId: string;
  campusId: string | null;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  active: boolean;
}

export interface StudentPage {
  content: Student[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface StudentSearchParams {
  institutionId: string;
  campusId?: string;
  search?: string;
  page: number;
  size: number;
}

export interface CreateStudentRequest {
  institutionId: string;
  campusId?: string | null;
  admissionNumber: string;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
}

/**
 * Exact backend UpdateStudentRequest contract.
 * Organization fields are intentionally not included.
 */
export interface UpdateStudentRequest {
  admissionNumber: string;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
}

/** Response returned by POST /students/{id}/account-link. */
export interface StudentAccountLinkResponse {
  id: string;
  studentId: string;
  userAccountId: string;
  createdAt: string;
}

/** Response from GET /students/{id}/account-link. */
export interface StudentAccountLinkDetails {
  linked: boolean;
  id: string | null;
  studentId: string;
  userAccountId: string | null;
  username: string | null;
  email: string | null;
  createdAt: string | null;
}


/** Request for the existing POST /api/v1/users endpoint. */
export interface CreateUserAccountRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
}

/** Response from the existing POST /api/v1/users endpoint. */
export interface UserAccountSummary {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string | null;
  active: boolean;
}

/** Paginated response from GET /api/v1/users?studentId=... */
export interface UserAccountSearchPage {
  content: UserAccountSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
