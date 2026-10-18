import type { Hostel, HostelAllocation, HostelRoom } from "../api/hostel-types";

export type HostelDialogState =
  | { kind: "HOSTEL_CREATE" }
  | { kind: "HOSTEL_EDIT"; hostel: Hostel }
  | { kind: "ROOM_CREATE" }
  | { kind: "ROOM_EDIT"; room: HostelRoom }
  | { kind: "ALLOCATION_CREATE" }
  | { kind: "ALLOCATION_VACATE"; allocation: HostelAllocation }
  | null;
