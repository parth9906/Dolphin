export type HostelType = "BOYS" | "GIRLS" | "CO_ED";
export type HostelRoomType = "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
export type HostelAllocationStatus = "ACTIVE" | "VACATED";

export interface Hostel {
  id: string;
  institutionId: string;
  campusId: string | null;
  code: string;
  name: string;
  hostelType: HostelType;
  wardenName: string | null;
  address: string | null;
  active: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface HostelRoom {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number | null;
  roomType: HostelRoomType;
  capacity: number;
  occupied: number;
  available: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface HostelAllocation {
  id: string;
  hostelId: string;
  roomId: string;
  roomNumber: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  startDate: string;
  endDate: string | null;
  status: HostelAllocationStatus;
  notes: string | null;
  allocatedByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface HostelPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CreateHostelRequest {
  institutionId: string;
  campusId: string | null;
  code: string;
  name: string;
  hostelType: HostelType;
  wardenName: string | null;
  address: string | null;
}

export interface UpdateHostelRequest {
  name: string;
  hostelType: HostelType;
  wardenName: string | null;
  address: string | null;
  version: number;
}

export interface CreateHostelRoomRequest {
  roomNumber: string;
  floor: number | null;
  roomType: HostelRoomType;
  capacity: number;
}

export interface UpdateHostelRoomRequest extends CreateHostelRoomRequest {
  version: number;
}

export interface CreateHostelAllocationRequest {
  studentId: string;
  roomId: string;
  startDate: string;
  endDate?: string;
  notes?: string | null;
}

export interface VacateHostelAllocationRequest {
  endDate?: string;
  version: number;
}
