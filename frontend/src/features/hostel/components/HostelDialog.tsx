import type { FormEventHandler } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import Select from "react-select";
import type { HostelRoomType, HostelType } from "../api/hostel-types";
import type { HostelDialogState } from "./hostel-dialog-types";

type Option<T extends string> = { value: T; label: string };
type SelectOption = { value: string; label: string };

interface HostelDialogProps {
  dialog: HostelDialogState;
  selectedHostelName: string | null;
  saving: boolean;
  institutionId: string | null;
  canStudentRead: boolean;
  studentsLoading: boolean;
  hostelTypes: Option<HostelType>[];
  roomTypes: Option<HostelRoomType>[];
  studentOptions: SelectOption[];
  roomOptions: SelectOption[];
  hostelCode: string;
  setHostelCode: (value: string) => void;
  hostelName: string;
  setHostelName: (value: string) => void;
  hostelType: HostelType;
  setHostelType: (value: HostelType) => void;
  wardenName: string;
  setWardenName: (value: string) => void;
  hostelAddress: string;
  setHostelAddress: (value: string) => void;
  roomNumber: string;
  setRoomNumber: (value: string) => void;
  roomFloor: string;
  setRoomFloor: (value: string) => void;
  roomType: HostelRoomType;
  setRoomType: (value: HostelRoomType) => void;
  roomCapacity: string;
  setRoomCapacity: (value: string) => void;
  allocationStudentId: string;
  setAllocationStudentId: (value: string) => void;
  allocationRoomId: string;
  setAllocationRoomId: (value: string) => void;
  allocationStartDate: string;
  setAllocationStartDate: (value: string) => void;
  allocationEndDate: string;
  setAllocationEndDate: (value: string) => void;
  allocationNotes: string;
  setAllocationNotes: (value: string) => void;
  vacateEndDate: string;
  setVacateEndDate: (value: string) => void;
  fixedCapacityForRoomType: (roomType: HostelRoomType) => number | null;
  formatDate: (value?: string | null) => string;
  onClose: () => void;
  onSubmitHostel: FormEventHandler<HTMLFormElement>;
  onSubmitRoom: FormEventHandler<HTMLFormElement>;
  onSubmitAllocation: FormEventHandler<HTMLFormElement>;
  onVacateAllocation: FormEventHandler<HTMLFormElement>;
}

export function HostelDialog({
  dialog,
  selectedHostelName,
  saving,
  institutionId,
  canStudentRead,
  studentsLoading,
  hostelTypes,
  roomTypes,
  studentOptions,
  roomOptions,
  hostelCode,
  setHostelCode,
  hostelName,
  setHostelName,
  hostelType,
  setHostelType,
  wardenName,
  setWardenName,
  hostelAddress,
  setHostelAddress,
  roomNumber,
  setRoomNumber,
  roomFloor,
  setRoomFloor,
  roomType,
  setRoomType,
  roomCapacity,
  setRoomCapacity,
  allocationStudentId,
  setAllocationStudentId,
  allocationRoomId,
  setAllocationRoomId,
  allocationStartDate,
  setAllocationStartDate,
  allocationEndDate,
  setAllocationEndDate,
  allocationNotes,
  setAllocationNotes,
  vacateEndDate,
  setVacateEndDate,
  fixedCapacityForRoomType,
  formatDate,
  onClose,
  onSubmitHostel,
  onSubmitRoom,
  onSubmitAllocation,
  onVacateAllocation,
}: HostelDialogProps) {
  if (!dialog) return null;
  const title = dialog.kind === "HOSTEL_CREATE" ? "Create hostel"
    : dialog.kind === "HOSTEL_EDIT" ? "Edit hostel"
    : dialog.kind === "ROOM_CREATE" ? "Add room"
    : dialog.kind === "ROOM_EDIT" ? "Edit room"
    : dialog.kind === "ALLOCATION_CREATE" ? "Allocate student"
    : "Vacate student allocation";
  const description = dialog.kind === "HOSTEL_CREATE" ? "Create an institution-wide hostel."
    : dialog.kind === "HOSTEL_EDIT" ? "Hostel code cannot be changed after creation."
    : dialog.kind === "ROOM_CREATE" ? `Add a room to ${selectedHostelName ?? "the selected hostel"}.`
    : dialog.kind === "ROOM_EDIT" ? "Update room details using its latest version."
    : dialog.kind === "ALLOCATION_CREATE" ? "Choose an active student and an active room with capacity."
    : "Record the date the student vacates the room.";

  return (
    <div className="hostel-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="hostel-dialog" role="dialog" aria-modal="true" aria-labelledby="hostel-dialog-title">
        <div className="hostel-panel-heading">
          <div>
            <h2 id="hostel-dialog-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="hostel-icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
        </div>

        {(dialog.kind === "HOSTEL_CREATE" || dialog.kind === "HOSTEL_EDIT") && (
          <form className="hostel-form" onSubmit={onSubmitHostel}>
            {dialog.kind === "HOSTEL_CREATE" && (
              <label>Hostel code
                <input value={hostelCode} onChange={(event) => setHostelCode(event.target.value)} maxLength={50} required placeholder="e.g. HOSTEL-BOYS-01" />
                <small>Unique within the institution; not editable later.</small>
              </label>
            )}
            <label>Hostel name
              <input value={hostelName} onChange={(event) => setHostelName(event.target.value)} maxLength={200} required placeholder="Enter hostel name" />
            </label>
            <label>Hostel type
              <Select className="hostel-select" classNamePrefix="hostel-select" options={hostelTypes} value={hostelTypes.find((option) => option.value === hostelType) ?? null} onChange={(option) => { if (option) setHostelType(option.value); }} isSearchable={false} isClearable={false} />
            </label>
            <label>Warden name <span className="hostel-muted">(optional)</span>
              <input value={wardenName} onChange={(event) => setWardenName(event.target.value)} maxLength={200} placeholder="Enter warden name" />
            </label>
            <label className="hostel-form-wide">Address <span className="hostel-muted">(optional)</span>
              <textarea value={hostelAddress} onChange={(event) => setHostelAddress(event.target.value)} maxLength={2000} rows={3} placeholder="Hostel address" />
            </label>
            <div className="hostel-form-wide hostel-form-info">This form creates an institution-wide hostel. Campus-specific selection can be added when a campus lookup is connected.</div>
            <div className="hostel-form-actions hostel-form-wide">
              <button type="button" className="hostel-button hostel-button--quiet" onClick={onClose}>Cancel</button>
              <button type="submit" className="hostel-button hostel-button--primary" disabled={saving || !institutionId}>
                {saving ? <LoaderCircle className="hostel-spin" size={16} /> : <Check size={16} />}
                {dialog.kind === "HOSTEL_CREATE" ? "Create hostel" : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {(dialog.kind === "ROOM_CREATE" || dialog.kind === "ROOM_EDIT") && (
          <form className="hostel-form" onSubmit={onSubmitRoom}>
            <label>Room number
              <input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} maxLength={20} required placeholder="e.g. A-101" />
            </label>
            <label>Room type
              <Select className="hostel-select" classNamePrefix="hostel-select" options={roomTypes} value={roomTypes.find((option) => option.value === roomType) ?? null} onChange={(option) => {
                if (!option) return;
                setRoomType(option.value);
                const fixedCapacity = fixedCapacityForRoomType(option.value);
                if (fixedCapacity !== null) setRoomCapacity(String(fixedCapacity));
              }} isSearchable={false} isClearable={false} />
            </label>
            <label>Floor <span className="hostel-muted">(optional)</span>
              <input type="number" step="1" value={roomFloor} onChange={(event) => setRoomFloor(event.target.value)} placeholder="e.g. 1" />
            </label>
            <label>Capacity
              <input type="number" min="1" step="1" value={roomCapacity} onChange={(event) => setRoomCapacity(event.target.value)} disabled={roomType !== "DORMITORY"} required />
              <small className="hostel-field-hint">{roomType === "DORMITORY" ? "Set the maximum number of beds in this dormitory." : `Fixed by room type: ${fixedCapacityForRoomType(roomType)} ${fixedCapacityForRoomType(roomType) === 1 ? "bed" : "beds"}.`}</small>
            </label>
            {dialog.kind === "ROOM_EDIT" && <div className="hostel-form-wide hostel-form-info">Current occupancy: {dialog.room.occupied} / {dialog.room.capacity}. The backend validates room capacity against current occupancy.</div>}
            <div className="hostel-form-actions hostel-form-wide">
              <button type="button" className="hostel-button hostel-button--quiet" onClick={onClose}>Cancel</button>
              <button type="submit" className="hostel-button hostel-button--primary" disabled={saving}>
                {saving ? <LoaderCircle className="hostel-spin" size={16} /> : <Check size={16} />}
                {dialog.kind === "ROOM_CREATE" ? "Add room" : "Save room"}
              </button>
            </div>
          </form>
        )}

        {dialog.kind === "ALLOCATION_CREATE" && (
          <form className="hostel-form" onSubmit={onSubmitAllocation}>
            <label className="hostel-form-wide">Student
              <Select className="hostel-select" classNamePrefix="hostel-select" options={studentOptions} value={studentOptions.find((option) => option.value === allocationStudentId) ?? null} onChange={(option) => setAllocationStudentId(option?.value ?? "")} isSearchable isClearable isLoading={studentsLoading} isDisabled={!canStudentRead || studentsLoading} placeholder={studentsLoading ? "Loading students…" : "Search name or admission number"} noOptionsMessage={() => !canStudentRead ? "Student read permission is required" : "No active students found"} />
              {!canStudentRead && <small>Grant student read access for the user to search students.</small>}
            </label>
            <label className="hostel-form-wide">Available room
              <Select className="hostel-select" classNamePrefix="hostel-select" options={roomOptions} value={roomOptions.find((option) => option.value === allocationRoomId) ?? null} onChange={(option) => setAllocationRoomId(option?.value ?? "")} isSearchable isClearable placeholder="Select a room with available capacity" noOptionsMessage={() => "No active rooms have available capacity"} />
            </label>
            <label>Start date
              <input type="date" value={allocationStartDate} onChange={(event) => setAllocationStartDate(event.target.value)} required />
            </label>
            <label>End date <span className="hostel-muted">(optional)</span>
              <input type="date" min={allocationStartDate || undefined} value={allocationEndDate} onChange={(event) => setAllocationEndDate(event.target.value)} />
            </label>
            <label className="hostel-form-wide">Notes <span className="hostel-muted">(optional, up to 500 characters)</span>
              <textarea value={allocationNotes} onChange={(event) => setAllocationNotes(event.target.value)} maxLength={500} rows={3} />
            </label>
            <div className="hostel-form-wide hostel-form-info">The backend prevents students from holding multiple active allocations and enforces room capacity.</div>
            <div className="hostel-form-actions hostel-form-wide">
              <button type="button" className="hostel-button hostel-button--quiet" onClick={onClose}>Cancel</button>
              <button type="submit" className="hostel-button hostel-button--primary" disabled={saving || !allocationStudentId || !allocationRoomId}>
                {saving ? <LoaderCircle className="hostel-spin" size={16} /> : <Check size={16} />} Allocate student
              </button>
            </div>
          </form>
        )}

        {dialog.kind === "ALLOCATION_VACATE" && (
          <form className="hostel-form" onSubmit={onVacateAllocation}>
            <div className="hostel-form-wide hostel-vacate-summary">
              <strong>{dialog.allocation.studentName}</strong>
              <span>Admission: {dialog.allocation.admissionNumber} · Room {dialog.allocation.roomNumber}</span>
              <span>Start date: {formatDate(dialog.allocation.startDate)}</span>
            </div>
            <label className="hostel-form-wide">Vacate date
              <input type="date" min={dialog.allocation.startDate} value={vacateEndDate} onChange={(event) => setVacateEndDate(event.target.value)} required />
            </label>
            <div className="hostel-form-wide hostel-form-info">This action changes the allocation from Active to Vacated. A current version is sent to the backend.</div>
            <div className="hostel-form-actions hostel-form-wide">
              <button type="button" className="hostel-button hostel-button--quiet" onClick={onClose}>Cancel</button>
              <button type="submit" className="hostel-button hostel-button--primary" disabled={saving}>
                {saving ? <LoaderCircle className="hostel-spin" size={16} /> : <Check size={16} />} Confirm vacation
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
