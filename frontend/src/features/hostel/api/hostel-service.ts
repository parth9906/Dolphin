import { apiClient } from "../../../lib/api/api-client";
import type {
  CreateHostelAllocationRequest,
  CreateHostelRequest,
  CreateHostelRoomRequest,
  Hostel,
  HostelAllocation,
  HostelAllocationStatus,
  HostelPage,
  HostelRoom,
  HostelRoomType,
  UpdateHostelRequest,
  UpdateHostelRoomRequest,
  VacateHostelAllocationRequest,
} from "./hostel-types";

function query(values: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export const hostelService = {
  searchHostels(
    institutionId: string,
    active: boolean | undefined,
    page: number,
    size = 20,
  ): Promise<HostelPage<Hostel>> {
    return apiClient.get<HostelPage<Hostel>>(
      `hostels?${query({
        institutionId,
        active,
        page,
        size,
        sort: "name,asc",
      })}`,
    );
  },

  getHostel(id: string): Promise<Hostel> {
    return apiClient.get<Hostel>(`hostels/${encodeURIComponent(id)}`);
  },

  createHostel(request: CreateHostelRequest): Promise<Hostel> {
    return apiClient.post<Hostel>("hostels", request);
  },

  updateHostel(id: string, request: UpdateHostelRequest): Promise<Hostel> {
    return apiClient.put<Hostel>(
      `hostels/${encodeURIComponent(id)}`,
      request,
    );
  },

  deactivateHostel(id: string): Promise<Hostel> {
    return apiClient.patch<Hostel>(
      `hostels/${encodeURIComponent(id)}/deactivate`,
      undefined,
    );
  },

  searchRooms(
    hostelId: string,
    roomType: HostelRoomType | undefined,
    active: boolean | undefined,
    page: number,
    size = 20,
  ): Promise<HostelPage<HostelRoom>> {
    return apiClient.get<HostelPage<HostelRoom>>(
      `hostels/${encodeURIComponent(hostelId)}/rooms?${query({
        roomType,
        active,
        page,
        size,
        sort: "roomNumber,asc",
      })}`,
    );
  },

  getRoom(hostelId: string, roomId: string): Promise<HostelRoom> {
    return apiClient.get<HostelRoom>(
      `hostels/${encodeURIComponent(hostelId)}/rooms/${encodeURIComponent(roomId)}`,
    );
  },

  createRoom(
    hostelId: string,
    request: CreateHostelRoomRequest,
  ): Promise<HostelRoom> {
    return apiClient.post<HostelRoom>(
      `hostels/${encodeURIComponent(hostelId)}/rooms`,
      request,
    );
  },

  updateRoom(
    hostelId: string,
    roomId: string,
    request: UpdateHostelRoomRequest,
  ): Promise<HostelRoom> {
    return apiClient.put<HostelRoom>(
      `hostels/${encodeURIComponent(hostelId)}/rooms/${encodeURIComponent(roomId)}`,
      request,
    );
  },

  deactivateRoom(hostelId: string, roomId: string): Promise<HostelRoom> {
    return apiClient.patch<HostelRoom>(
      `hostels/${encodeURIComponent(hostelId)}/rooms/${encodeURIComponent(roomId)}/deactivate`,
      undefined,
    );
  },

  searchAllocations(
    hostelId: string,
    status: HostelAllocationStatus | undefined,
    page: number,
    size = 20,
  ): Promise<HostelPage<HostelAllocation>> {
    return apiClient.get<HostelPage<HostelAllocation>>(
      `hostels/${encodeURIComponent(hostelId)}/allocations?${query({
        status,
        page,
        size,
        sort: "createdAt,desc",
      })}`,
    );
  },

  getAllocation(
    hostelId: string,
    allocationId: string,
  ): Promise<HostelAllocation> {
    return apiClient.get<HostelAllocation>(
      `hostels/${encodeURIComponent(hostelId)}/allocations/${encodeURIComponent(allocationId)}`,
    );
  },

  createAllocation(
    hostelId: string,
    request: CreateHostelAllocationRequest,
  ): Promise<HostelAllocation> {
    return apiClient.post<HostelAllocation>(
      `hostels/${encodeURIComponent(hostelId)}/allocations`,
      request,
    );
  },

  vacateAllocation(
    hostelId: string,
    allocationId: string,
    request: VacateHostelAllocationRequest,
  ): Promise<HostelAllocation> {
    return apiClient.patch<HostelAllocation>(
      `hostels/${encodeURIComponent(hostelId)}/allocations/${encodeURIComponent(allocationId)}/vacate`,
      request,
    );
  },
};
