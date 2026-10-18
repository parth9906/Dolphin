import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSelectedInstitutionId } from "../../organization/hooks/organization-selection";
import { confirmAction } from "../../../lib/ui/dialogs";
import Select from "react-select";
import {
  AlertCircle,
  BedDouble,
  Check,
  DoorOpen,
  Plus,
  Users,
  X,
} from "lucide-react";
import { studentService } from "../../students/api/student-service";
import type { Student } from "../../students/api/student-types";
import { useAuth } from "../../../lib/auth/use-auth";
import { hostelService } from "../api/hostel-service";
import type {
  CreateHostelAllocationRequest,
  CreateHostelRequest,
  CreateHostelRoomRequest,
  Hostel,
  HostelAllocation,
  HostelAllocationStatus,
  HostelPage as PageResult,
  HostelRoom,
  HostelRoomType,
  HostelType,
  UpdateHostelRequest,
  UpdateHostelRoomRequest,
} from "../api/hostel-types";
import { HostelSummaryMetrics } from "../components/HostelSummaryMetrics";
import { HostelRoomsPanel } from "../components/HostelRoomsPanel";
import { HostelAllocationsPanel } from "../components/HostelAllocationsPanel";
import { HostelDialog } from "../components/HostelDialog";
import { HostelDirectoryPanel } from "../components/HostelDirectoryPanel";
import { useHostelDirectory } from "../hooks/use-hostel-directory";
import type { HostelDialogState } from "../components/hostel-dialog-types";
import "./hostel-page.css";

type Option<T extends string> = { value: T; label: string };
type AllocationFilter = "ALL" | HostelAllocationStatus;
type Tab = "ROOMS" | "ALLOCATIONS";

const HOSTEL_TYPES: Option<HostelType>[] = [
  { value: "BOYS", label: "Boys' hostel" },
  { value: "GIRLS", label: "Girls' hostel" },
  { value: "CO_ED", label: "Co-educational" },
];

const ROOM_TYPES: Option<HostelRoomType>[] = [
  { value: "SINGLE", label: "Single room" },
  { value: "DOUBLE", label: "Double room" },
  { value: "TRIPLE", label: "Triple room" },
  { value: "DORMITORY", label: "Dormitory" },
];

function fixedCapacityForRoomType(roomType: HostelRoomType): number | null {
  switch (roomType) {
    case "SINGLE":
      return 1;
    case "DOUBLE":
      return 2;
    case "TRIPLE":
      return 3;
    case "DORMITORY":
      return null;
  }
}

function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function display(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function dateLabel(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function errorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message;
  }

  if (cause && typeof cause === "object") {
    const candidate = cause as {
      message?: unknown;
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
        };
      };
    };

    const message =
      candidate.response?.data?.message ??
      candidate.response?.data?.error ??
      candidate.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

function studentName(student: {
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return [student.firstName, student.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim())
    .join(" ") || "Unnamed student";
}

export function HostelPage() {
  const { hasPermission } = useAuth();
  const institutionId = useSelectedInstitutionId();

  const canHostelRead = hasPermission("HOSTEL_READ");
  const canHostelCreate = hasPermission("HOSTEL_CREATE");
  const canHostelUpdate = hasPermission("HOSTEL_UPDATE");
  const canRoomRead = hasPermission("HOSTEL_ROOM_READ");
  const canRoomCreate = hasPermission("HOSTEL_ROOM_CREATE");
  const canRoomUpdate = hasPermission("HOSTEL_ROOM_UPDATE");
  const canAllocationRead = hasPermission("HOSTEL_ALLOCATION_READ");
  const canAllocationCreate = hasPermission("HOSTEL_ALLOCATION_CREATE");
  const canAllocationUpdate = hasPermission("HOSTEL_ALLOCATION_UPDATE");
  const canStudentRead = hasPermission("STUDENT_READ");

  const hostelDirectory = useHostelDirectory({
    institutionId,
    canRead: canHostelRead,
  });
  const {
    hostels,
    page: hostelPage,
    pageIndex: hostelPageIndex,
    setPageIndex: setHostelPageIndex,
    filter: hostelFilter,
    setFilter: setHostelFilter,
    loading: hostelsLoading,
    error: hostelDirectoryError,
    selectedHostelId,
    setSelectedHostelId,
    load: loadHostels,
  } = hostelDirectory;
  const selectedHostel = hostels.find((hostel) => hostel.id === selectedHostelId) ?? null;

  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [roomPage, setRoomPage] = useState<PageResult<HostelRoom> | null>(null);
  const [roomPageIndex, setRoomPageIndex] = useState(0);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const roomRequestSequence = useRef(0);

  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [allocationPage, setAllocationPage] = useState<PageResult<HostelAllocation> | null>(null);
  const [allocationPageIndex, setAllocationPageIndex] = useState(0);
  const [allocationFilter, setAllocationFilter] = useState<AllocationFilter>("ACTIVE");
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [allocationsError, setAllocationsError] = useState("");
  const allocationRequestSequence = useRef(0);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("ROOMS");
  const [dialog, setDialog] = useState<HostelDialogState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [hostelCode, setHostelCode] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [hostelType, setHostelType] = useState<HostelType>("BOYS");
  const [wardenName, setWardenName] = useState("");
  const [hostelAddress, setHostelAddress] = useState("");

  const [roomNumber, setRoomNumber] = useState("");
  const [roomFloor, setRoomFloor] = useState("");
  const [roomType, setRoomType] = useState<HostelRoomType>("DOUBLE");
  const [roomCapacity, setRoomCapacity] = useState("2");

  const [allocationStudentId, setAllocationStudentId] = useState("");
  const [allocationRoomId, setAllocationRoomId] = useState("");
  const [allocationStartDate, setAllocationStartDate] = useState(todayLocal());
  const [allocationEndDate, setAllocationEndDate] = useState("");
  const [allocationNotes, setAllocationNotes] = useState("");
  const [vacateEndDate, setVacateEndDate] = useState(todayLocal());

  const loadRooms = useCallback(async () => {
    const requestId = ++roomRequestSequence.current;
    if (!selectedHostelId || !canRoomRead) {
      setRooms([]);
      setRoomPage(null);
      setRoomsError("");
      setRoomsLoading(false);
      return;
    }

    setRoomsLoading(true);
    setRoomsError("");
    try {
      const result = await hostelService.searchRooms(
        selectedHostelId,
        undefined,
        undefined,
        roomPageIndex,
        20,
      );
      if (requestId !== roomRequestSequence.current) return;
      setRoomPage(result);
      setRooms(result.content ?? []);
    } catch (cause) {
      if (requestId !== roomRequestSequence.current) return;
      setRoomsError(errorMessage(cause));
      setRooms([]);
      setRoomPage(null);
    } finally {
      if (requestId === roomRequestSequence.current) setRoomsLoading(false);
    }
  }, [selectedHostelId, canRoomRead, roomPageIndex]);

  useEffect(() => {
    void loadRooms();
    return () => {
      roomRequestSequence.current += 1;
    };
  }, [loadRooms]);

  const loadAllocations = useCallback(async () => {
    const requestId = ++allocationRequestSequence.current;
    if (!selectedHostelId || !canAllocationRead) {
      setAllocations([]);
      setAllocationPage(null);
      setAllocationsError("");
      setAllocationsLoading(false);
      return;
    }

    setAllocationsLoading(true);
    setAllocationsError("");
    try {
      const result = await hostelService.searchAllocations(
        selectedHostelId,
        allocationFilter === "ALL" ? undefined : allocationFilter,
        allocationPageIndex,
        20,
      );
      if (requestId !== allocationRequestSequence.current) return;
      setAllocationPage(result);
      setAllocations(result.content ?? []);
    } catch (cause) {
      if (requestId !== allocationRequestSequence.current) return;
      setAllocationsError(errorMessage(cause));
      setAllocations([]);
      setAllocationPage(null);
    } finally {
      if (requestId === allocationRequestSequence.current) setAllocationsLoading(false);
    }
  }, [selectedHostelId, canAllocationRead, allocationFilter, allocationPageIndex]);

  useEffect(() => {
    void loadAllocations();
    return () => {
      allocationRequestSequence.current += 1;
    };
  }, [loadAllocations]);

  useEffect(() => {
    if (!institutionId || !canStudentRead) {
      setStudents([]);
      return;
    }
    let active = true;
    setStudentsLoading(true);
    studentService.searchStudents({
      institutionId,
      page: 0,
      size: 100,
    }).then((result) => {
      if (active) setStudents((result.content ?? []).filter((student) => student.active));
    }).catch(() => {
      if (active) setStudents([]);
    }).finally(() => {
      if (active) setStudentsLoading(false);
    });
    return () => { active = false; };
  }, [institutionId, canStudentRead]);

  const studentOptions = useMemo(
    () => students.map((student) => ({
      value: student.id,
      label: `${studentName(student)} · ${student.admissionNumber}`,
    })),
    [students],
  );

  const roomOptions = useMemo(
    () => rooms
      .filter((room) => room.active && room.available > 0)
      .map((room) => ({
        value: room.id,
        label: `Room ${room.roomNumber} · ${room.available} beds free · ${display(room.roomType)}`,
      })),
    [rooms],
  );

  const activeRoomCount = rooms.filter((room) => room.active).length;
  const totalAvailableBeds = rooms.reduce((sum, room) => sum + (room.active ? room.available : 0), 0);
  const activeAllocationCount = allocations.filter((allocation) => allocation.status === "ACTIVE").length;

  const clearMessage = () => {
    setError("");
    setNotice("");
  };

  const openCreateHostel = () => {
    setHostelCode("");
    setHostelName("");
    setHostelType("BOYS");
    setWardenName("");
    setHostelAddress("");
    clearMessage();
    setDialog({ kind: "HOSTEL_CREATE" });
  };

  const openEditHostel = (hostel: Hostel) => {
    setHostelCode(hostel.code);
    setHostelName(hostel.name);
    setHostelType(hostel.hostelType);
    setWardenName(hostel.wardenName ?? "");
    setHostelAddress(hostel.address ?? "");
    clearMessage();
    setDialog({ kind: "HOSTEL_EDIT", hostel });
  };

  const openCreateRoom = () => {
    setRoomNumber("");
    setRoomFloor("");
    setRoomType("DOUBLE");
    setRoomCapacity("2");
    clearMessage();
    setDialog({ kind: "ROOM_CREATE" });
  };

  const openEditRoom = (room: HostelRoom) => {
    setRoomNumber(room.roomNumber);
    setRoomFloor(room.floor === null ? "" : String(room.floor));
    setRoomType(room.roomType);
    setRoomCapacity(
      String(fixedCapacityForRoomType(room.roomType) ?? room.capacity),
    );
    clearMessage();
    setDialog({ kind: "ROOM_EDIT", room });
  };

  const openCreateAllocation = () => {
    setAllocationStudentId("");
    setAllocationRoomId("");
    setAllocationStartDate(todayLocal());
    setAllocationEndDate("");
    setAllocationNotes("");
    clearMessage();
    setDialog({ kind: "ALLOCATION_CREATE" });
  };

  const submitHostel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!institutionId || !hostelName.trim()) {
      setError("Institution and hostel name are required.");
      return;
    }
    if (!dialog || (dialog.kind !== "HOSTEL_CREATE" && dialog.kind !== "HOSTEL_EDIT")) return;
    if (dialog.kind === "HOSTEL_CREATE" && !hostelCode.trim()) {
      setError("Hostel code is required.");
      return;
    }
    if (hostelCode.trim().length > 50 || hostelName.trim().length > 200) {
      setError("Hostel code must be at most 50 characters and name at most 200 characters.");
      return;
    }
    if (wardenName.length > 200 || hostelAddress.length > 2000) {
      setError("Warden name or address exceeds its maximum length.");
      return;
    }

    setSaving(true);
    clearMessage();
    try {
      if (dialog.kind === "HOSTEL_CREATE") {
        const request: CreateHostelRequest = {
          institutionId,
          campusId: null,
          code: hostelCode.trim(),
          name: hostelName.trim(),
          hostelType,
          wardenName: wardenName.trim() || null,
          address: hostelAddress.trim() || null,
        };
        const created = await hostelService.createHostel(request);
        setNotice("Hostel created successfully.");
        setHostelFilter("ALL");
        setHostelPageIndex(0);
        setSelectedHostelId(created.id);
      } else {
        const request: UpdateHostelRequest = {
          name: hostelName.trim(),
          hostelType,
          wardenName: wardenName.trim() || null,
          address: hostelAddress.trim() || null,
          version: dialog.hostel.version,
        };
        await hostelService.updateHostel(dialog.hostel.id, request);
        setNotice("Hostel details updated.");
      }
      setDialog(null);
      await loadHostels();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const submitRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHostel) {
      setError("Select a hostel first.");
      return;
    }
    if (!dialog || (dialog.kind !== "ROOM_CREATE" && dialog.kind !== "ROOM_EDIT")) return;

    const fixedCapacity = fixedCapacityForRoomType(roomType);
    const capacity = fixedCapacity ?? Number(roomCapacity);
    const floorValue = roomFloor.trim() ? Number(roomFloor) : null;
    if (!roomNumber.trim() || roomNumber.trim().length > 20) {
      setError("Room number is required and must be at most 20 characters.");
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Room capacity must be a whole number of at least 1.");
      return;
    }
    if (floorValue !== null && !Number.isInteger(floorValue)) {
      setError("Floor must be a whole number or left blank.");
      return;
    }

    setSaving(true);
    clearMessage();
    try {
      const common: CreateHostelRoomRequest = {
        roomNumber: roomNumber.trim(),
        floor: floorValue,
        roomType,
        capacity,
      };
      if (dialog.kind === "ROOM_CREATE") {
        await hostelService.createRoom(selectedHostel.id, common);
        setNotice("Room created successfully.");
        setRoomPageIndex(0);
      } else {
        const request: UpdateHostelRoomRequest = {
          ...common,
          version: dialog.room.version,
        };
        await hostelService.updateRoom(selectedHostel.id, dialog.room.id, request);
        setNotice("Room details updated.");
      }
      setDialog(null);
      await loadRooms();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const submitAllocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHostel) {
      setError("Select a hostel first.");
      return;
    }
    if (!allocationStudentId || !allocationRoomId || !allocationStartDate) {
      setError("Student, available room, and start date are required.");
      return;
    }
    if (allocationEndDate && allocationEndDate < allocationStartDate) {
      setError("End date cannot be earlier than the start date.");
      return;
    }
    if (allocationNotes.length > 500) {
      setError("Notes must be 500 characters or fewer.");
      return;
    }

    const request: CreateHostelAllocationRequest = {
      studentId: allocationStudentId,
      roomId: allocationRoomId,
      startDate: allocationStartDate,
      ...(allocationEndDate ? { endDate: allocationEndDate } : {}),
      notes: allocationNotes.trim() || null,
    };

    setSaving(true);
    clearMessage();
    try {
      await hostelService.createAllocation(selectedHostel.id, request);
      setNotice("Student allocated to the hostel successfully.");
      setDialog(null);
      setTab("ALLOCATIONS");
      setAllocationFilter("ALL");
      setAllocationPageIndex(0);
      await loadRooms();
      await loadAllocations();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const deactivateHostel = async (hostel: Hostel) => {
    if (!(await confirmAction({
      title: "Deactivate hostel?",
      text: `${hostel.code} — ${hostel.name}`,
      confirmButtonText: "Deactivate hostel",
      cancelButtonText: "Keep active",
    }))) return;
    setSaving(true);
    clearMessage();
    try {
      await hostelService.deactivateHostel(hostel.id);
      setNotice("Hostel deactivated.");
      await loadHostels();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const deactivateRoom = async (room: HostelRoom) => {
    if (!selectedHostel) return;
    if (!(await confirmAction({
      title: "Deactivate room?",
      text: `Room ${room.roomNumber}`,
      confirmButtonText: "Deactivate room",
      cancelButtonText: "Keep active",
    }))) return;
    setSaving(true);
    clearMessage();
    try {
      await hostelService.deactivateRoom(selectedHostel.id, room.id);
      setNotice(`Room ${room.roomNumber} deactivated.`);
      await loadRooms();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const vacateAllocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHostel || !dialog || dialog.kind !== "ALLOCATION_VACATE") return;
    if (!vacateEndDate) {
      setError("Enter the vacation date.");
      return;
    }
    if (vacateEndDate < dialog.allocation.startDate) {
      setError("Vacation date cannot be earlier than the allocation start date.");
      return;
    }

    setSaving(true);
    clearMessage();
    try {
      await hostelService.vacateAllocation(
        selectedHostel.id,
        dialog.allocation.id,
        {
          endDate: vacateEndDate,
          version: dialog.allocation.version,
        },
      );
      setNotice("Hostel allocation vacated.");
      setDialog(null);
      await loadAllocations();
      await loadRooms();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const openVacate = (allocation: HostelAllocation) => {
    setVacateEndDate(todayLocal());
    clearMessage();
    setDialog({ kind: "ALLOCATION_VACATE", allocation });
  };

  return (
    <main className="hostel-page">
      <header className="hostel-header">
        <div>
          <div className="hostel-eyebrow"><BedDouble size={15} /> RESIDENTIAL OPERATIONS</div>
          <h1>Hostel Management</h1>
          <p>Manage hostels, room capacity, student allocations, and vacations.</p>
        </div>
        {canHostelCreate && (
          <button className="hostel-button hostel-button--primary" onClick={openCreateHostel}>
            <Plus size={17} /> New hostel
          </button>
        )}
      </header>

      {!institutionId && (
        <div className="hostel-alert hostel-alert--warning">
          <AlertCircle size={18} /> Select an institution in the organization selector first.
        </div>
      )}

      {error && (
        <div className="hostel-alert hostel-alert--error" role="alert">
          <AlertCircle size={18} /><span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {notice && (
        <div className="hostel-alert hostel-alert--success">
          <Check size={18} /><span>{notice}</span>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16} /></button>
        </div>
      )}

      <HostelSummaryMetrics
        hostelCount={canHostelRead ? hostels.length : "—"}
        activeRoomCount={canRoomRead ? activeRoomCount : "—"}
        availableBeds={canRoomRead ? totalAvailableBeds : "—"}
        activeAllocations={canAllocationRead ? activeAllocationCount : "—"}
      />

      <HostelDirectoryPanel
        hostels={hostels}
        page={hostelPage}
        pageIndex={hostelPageIndex}
        filter={hostelFilter}
        selectedHostelId={selectedHostelId}
        loading={hostelsLoading}
        error={hostelDirectoryError}
        hasInstitution={Boolean(institutionId)}
        canRead={canHostelRead}
        canUpdate={canHostelUpdate}
        saving={saving}
        onFilterChange={(filter) => {
          setHostelFilter(filter);
          setHostelPageIndex(0);
        }}
        onRefresh={() => void loadHostels()}
        onSelect={(hostel) => {
          setSelectedHostelId(hostel.id);
          setRoomPageIndex(0);
          setAllocationPageIndex(0);
        }}
        onEdit={openEditHostel}
        onDeactivate={(hostel) => void deactivateHostel(hostel)}
        onPrevious={() => setHostelPageIndex((current) => Math.max(0, current - 1))}
        onNext={() => setHostelPageIndex((current) => current + 1)}
      />

      {selectedHostel && (
        <section className="hostel-panel hostel-detail-panel">
          <div className="hostel-selected-heading">
            <div className="hostel-selected-mark"><BedDouble size={22} /></div>
            <div className="hostel-selected-info">
              <div className="hostel-selected-eyebrow">SELECTED HOSTEL</div>
              <h2>{selectedHostel.name}</h2>
              <p>{selectedHostel.code} · {display(selectedHostel.hostelType)} · {selectedHostel.wardenName || "No warden specified"}</p>
            </div>
            <span className={"hostel-active-pill " + (selectedHostel.active ? "hostel-active-pill--yes" : "hostel-active-pill--no")}>{selectedHostel.active ? "Active" : "Inactive"}</span>
          </div>

          {selectedHostel.address && <div className="hostel-address">{selectedHostel.address}</div>}

          <div className="hostel-tabs" role="tablist" aria-label="Hostel management sections">
            <button role="tab" aria-selected={tab === "ROOMS"} className={tab === "ROOMS" ? "is-active" : ""} onClick={() => setTab("ROOMS")}>
              <DoorOpen size={16} /> Rooms
            </button>
            <button role="tab" aria-selected={tab === "ALLOCATIONS"} className={tab === "ALLOCATIONS" ? "is-active" : ""} onClick={() => setTab("ALLOCATIONS")}>
              <Users size={16} /> Student allocations
            </button>
            <span className="hostel-tabs-spacer" />
            {tab === "ROOMS" && canRoomCreate && selectedHostel.active && (
              <button className="hostel-button hostel-button--primary" onClick={openCreateRoom}><Plus size={16} /> Add room</button>
            )}
            {tab === "ALLOCATIONS" && canAllocationCreate && selectedHostel.active && (
              <button className="hostel-button hostel-button--primary" onClick={openCreateAllocation}><Plus size={16} /> Allocate student</button>
            )}
          </div>

          {tab === "ROOMS" && (
            <HostelRoomsPanel
              rooms={rooms}
              page={roomPage}
              pageIndex={roomPageIndex}
              loading={roomsLoading}
              error={roomsError}
              onRetry={() => void loadRooms()}
              canRead={canRoomRead}
              canUpdate={canRoomUpdate}
              saving={saving}
              onEdit={openEditRoom}
              onDeactivate={(room) => void deactivateRoom(room)}
              onPrevious={() => setRoomPageIndex((current) => Math.max(0, current - 1))}
              onNext={() => setRoomPageIndex((current) => current + 1)}
            />
          )}

          {tab === "ALLOCATIONS" && (
            <HostelAllocationsPanel
              allocations={allocations}
              page={allocationPage}
              pageIndex={allocationPageIndex}
              filter={allocationFilter}
              loading={allocationsLoading}
              error={allocationsError}
              onRetry={() => void loadAllocations()}
              canRead={canAllocationRead}
              canUpdate={canAllocationUpdate}
              onFilterChange={(filter) => {
                setAllocationFilter(filter);
                setAllocationPageIndex(0);
              }}
              onVacate={openVacate}
              onPrevious={() => setAllocationPageIndex((current) => Math.max(0, current - 1))}
              onNext={() => setAllocationPageIndex((current) => current + 1)}
            />
          )}
        </section>
      )}

      {dialog && (
        <HostelDialog
          dialog={dialog}
          selectedHostelName={selectedHostel?.name ?? null}
          saving={saving}
          institutionId={institutionId}
          canStudentRead={canStudentRead}
          studentsLoading={studentsLoading}
          hostelTypes={HOSTEL_TYPES}
          roomTypes={ROOM_TYPES}
          studentOptions={studentOptions}
          roomOptions={roomOptions}
          hostelCode={hostelCode}
          setHostelCode={setHostelCode}
          hostelName={hostelName}
          setHostelName={setHostelName}
          hostelType={hostelType}
          setHostelType={setHostelType}
          wardenName={wardenName}
          setWardenName={setWardenName}
          hostelAddress={hostelAddress}
          setHostelAddress={setHostelAddress}
          roomNumber={roomNumber}
          setRoomNumber={setRoomNumber}
          roomFloor={roomFloor}
          setRoomFloor={setRoomFloor}
          roomType={roomType}
          setRoomType={setRoomType}
          roomCapacity={roomCapacity}
          setRoomCapacity={setRoomCapacity}
          allocationStudentId={allocationStudentId}
          setAllocationStudentId={setAllocationStudentId}
          allocationRoomId={allocationRoomId}
          setAllocationRoomId={setAllocationRoomId}
          allocationStartDate={allocationStartDate}
          setAllocationStartDate={setAllocationStartDate}
          allocationEndDate={allocationEndDate}
          setAllocationEndDate={setAllocationEndDate}
          allocationNotes={allocationNotes}
          setAllocationNotes={setAllocationNotes}
          vacateEndDate={vacateEndDate}
          setVacateEndDate={setVacateEndDate}
          fixedCapacityForRoomType={fixedCapacityForRoomType}
          formatDate={dateLabel}
          onClose={() => setDialog(null)}
          onSubmitHostel={submitHostel}
          onSubmitRoom={submitRoom}
          onSubmitAllocation={submitAllocation}
          onVacateAllocation={vacateAllocation}
        />
      )}
    </main>
  );
}
