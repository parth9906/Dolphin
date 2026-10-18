import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { LoaderCircle, Plus, RefreshCw } from "lucide-react";

import type { SchoolRoom, TeacherSubjectAssignment } from "../api/timetable-types";
import { Dropdown, Empty, Field, type Option } from "./TimetableControls";

interface TimetableAssignmentsPanelProps {
  institutionId: string;
  assignments: TeacherSubjectAssignment[];
  assignmentsLoading: boolean;
  activeAssignmentCount: number;
  canAssignmentCreate: boolean;
  canAssignmentRead: boolean;
  canStaffRead: boolean;
  canSubjectRead: boolean;
  teacherOptions: Option[];
  subjectOptions: Option[];
  assignmentTeacherId: string;
  setAssignmentTeacherId: Dispatch<SetStateAction<string>>;
  assignmentSubjectId: string;
  setAssignmentSubjectId: Dispatch<SetStateAction<string>>;
  assignmentStartDate: string;
  setAssignmentStartDate: Dispatch<SetStateAction<string>>;
  assignmentEndDate: string;
  setAssignmentEndDate: Dispatch<SetStateAction<string>>;
  teacherCount: number;
  staffLoading: boolean;
  subjectsLoading: boolean;
  saving: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  formatDate: (value: string) => string;
}

export function TimetableAssignmentsPanel({
  institutionId,
  assignments,
  assignmentsLoading,
  activeAssignmentCount,
  canAssignmentCreate,
  canAssignmentRead,
  canStaffRead,
  canSubjectRead,
  teacherOptions,
  subjectOptions,
  assignmentTeacherId,
  setAssignmentTeacherId,
  assignmentSubjectId,
  setAssignmentSubjectId,
  assignmentStartDate,
  setAssignmentStartDate,
  assignmentEndDate,
  setAssignmentEndDate,
  teacherCount,
  staffLoading,
  subjectsLoading,
  saving,
  onSubmit,
  formatDate,
}: TimetableAssignmentsPanelProps) {
  return (
    <div className="timetable-workspace">
      <div className="timetable-section-heading">
        <div><h2>Teacher-subject assignments</h2><p>Assign an active teacher to a subject before scheduling lessons.</p></div>
        <span className="timetable-count">{activeAssignmentCount} active</span>
      </div>

      {canAssignmentCreate && institutionId && (
        <form className="timetable-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> Assign subject to teacher</h3>
          {!canStaffRead && <div className="timetable-inline-message">STAFF_READ permission is required to list teachers.</div>}
          <div className="timetable-form-grid timetable-form-grid--three">
            <Dropdown label="Teacher" options={teacherOptions} value={assignmentTeacherId} onChange={setAssignmentTeacherId} disabled={!canStaffRead} loading={staffLoading} placeholder="Select active teacher" />
            <Dropdown label="Subject" options={subjectOptions} value={assignmentSubjectId} onChange={setAssignmentSubjectId} disabled={!canSubjectRead} loading={subjectsLoading} placeholder="Select subject" />
            <Field label="Start date"><input required type="date" value={assignmentStartDate} onChange={(event) => setAssignmentStartDate(event.target.value)} /></Field>
            <Field label="End date (optional)"><input type="date" min={assignmentStartDate} value={assignmentEndDate} onChange={(event) => setAssignmentEndDate(event.target.value)} /></Field>
          </div>
          {teacherCount === 0 && !staffLoading && canStaffRead && <div className="timetable-inline-message">No active teachers were found. Create an active teacher in Staff Management first.</div>}
          <div className="timetable-form-actions">
            <button className="timetable-primary-button" type="submit" disabled={saving || !assignmentTeacherId || !assignmentSubjectId}>
              {saving ? <LoaderCircle size={16} className="timetable-spin" /> : <Plus size={16} />} Assign teacher
            </button>
          </div>
        </form>
      )}

      {assignmentsLoading && <div className="timetable-loading" role="status"><RefreshCw size={18} className="timetable-spin" /> Loading teacher assignments…</div>}
      {canAssignmentRead && !assignmentsLoading && assignments.length === 0 && <Empty title="No teacher-subject assignments" description="Assign teachers to subjects to enable scheduled lessons." />}
      {canAssignmentRead && assignments.length > 0 && (
        <div className="timetable-table-wrap">
          <table className="timetable-table">
            <caption className="timetable-sr-only">Teacher-subject assignments for the selected institution</caption>
            <thead><tr><th scope="col">Teacher</th><th scope="col">Employee no.</th><th scope="col">Subject</th><th scope="col">Start date</th><th scope="col">End date</th><th scope="col">Status</th></tr></thead>
            <tbody>{assignments.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.teacherName}</strong></td><td>{item.employeeNumber}</td><td>{item.subjectName} · {item.subjectCode}</td>
                <td>{formatDate(item.startDate)}</td><td>{item.endDate ? formatDate(item.endDate) : "Ongoing"}</td>
                <td><span className={`timetable-status ${item.active ? "timetable-status--active" : ""}`}>{item.active ? "Active" : "Ended"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface TimetableRoomsPanelProps {
  institutionId: string;
  rooms: SchoolRoom[];
  roomsLoading: boolean;
  canRoomCreate: boolean;
  canRoomRead: boolean;
  canCampusRead: boolean;
  campusOptions: Option[];
  campusesLoading: boolean;
  roomName: string;
  setRoomName: Dispatch<SetStateAction<string>>;
  roomCode: string;
  setRoomCode: Dispatch<SetStateAction<string>>;
  roomCampusId: string;
  setRoomCampusId: Dispatch<SetStateAction<string>>;
  roomCapacity: string;
  setRoomCapacity: Dispatch<SetStateAction<string>>;
  saving: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function TimetableRoomsPanel({
  institutionId,
  rooms,
  roomsLoading,
  canRoomCreate,
  canRoomRead,
  canCampusRead,
  campusOptions,
  campusesLoading,
  roomName,
  setRoomName,
  roomCode,
  setRoomCode,
  roomCampusId,
  setRoomCampusId,
  roomCapacity,
  setRoomCapacity,
  saving,
  onSubmit,
}: TimetableRoomsPanelProps) {
  return (
    <div className="timetable-workspace">
      <div className="timetable-section-heading">
        <div><h2>Rooms</h2><p>Register classrooms and optionally associate each with a campus.</p></div>
        <span className="timetable-count">{rooms.length} room{rooms.length === 1 ? "" : "s"}</span>
      </div>

      {canRoomCreate && institutionId && (
        <form className="timetable-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> Create room</h3>
          <div className="timetable-form-grid timetable-form-grid--three">
            <Field label="Room name"><input required maxLength={100} value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="e.g. Room 101" /></Field>
            <Field label="Room code"><input required maxLength={30} value={roomCode} onChange={(event) => setRoomCode(event.target.value)} placeholder="e.g. R-101" /></Field>
            <Dropdown label="Campus (optional)" options={campusOptions} value={roomCampusId} onChange={setRoomCampusId} disabled={!canCampusRead} loading={campusesLoading} placeholder="No specific campus" clearable />
            <Field label="Capacity (optional)"><input type="number" min={1} value={roomCapacity} onChange={(event) => setRoomCapacity(event.target.value)} placeholder="e.g. 40" /></Field>
          </div>
          <div className="timetable-form-actions"><button className="timetable-primary-button" type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="timetable-spin" /> : <Plus size={16} />} Create room</button></div>
        </form>
      )}

      {roomsLoading && <div className="timetable-loading" role="status"><RefreshCw size={18} className="timetable-spin" /> Loading rooms…</div>}
      {canRoomRead && !roomsLoading && rooms.length === 0 && <Empty title="No rooms registered" description="Create a room before adding a scheduled lesson with a room location." />}
      {canRoomRead && rooms.length > 0 && (
        <div className="timetable-table-wrap">
          <table className="timetable-table">
            <caption className="timetable-sr-only">Rooms registered for the selected institution</caption>
            <thead><tr><th scope="col">Room</th><th scope="col">Code</th><th scope="col">Capacity</th><th scope="col">Status</th></tr></thead>
            <tbody>{rooms.map((room) => (
              <tr key={room.id}><td><strong>{room.name}</strong></td><td>{room.code}</td><td>{room.capacity ?? "—"}</td><td><span className={`timetable-status ${room.active ? "timetable-status--active" : ""}`}>{room.active ? "Active" : "Inactive"}</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
