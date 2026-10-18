import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { Clock3, LoaderCircle, Plus, RefreshCw } from "lucide-react";

import { Dropdown, Empty, Field } from "./TimetableControls";
import type { TimetableSlot } from "../api/timetable-types";

type DayOption = { value: string; label: string };

type TimetableSlotsPanelProps = {
  yearId: string;
  slots: TimetableSlot[];
  loading: boolean;
  canRead: boolean;
  canCreate: boolean;
  saving: boolean;
  slotDay: string;
  setSlotDay: Dispatch<SetStateAction<string>>;
  slotStart: string;
  setSlotStart: Dispatch<SetStateAction<string>>;
  slotEnd: string;
  setSlotEnd: Dispatch<SetStateAction<string>>;
  slotLabel: string;
  setSlotLabel: Dispatch<SetStateAction<string>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  dayLabel: (day: number) => string;
  friendlyTime: (value: string) => string;
};

const DAYS: DayOption[] = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

export function TimetableSlotsPanel({
  yearId, slots, loading, canRead, canCreate, saving,
  slotDay, setSlotDay, slotStart, setSlotStart, slotEnd, setSlotEnd,
  slotLabel, setSlotLabel, onSubmit, dayLabel, friendlyTime,
}: TimetableSlotsPanelProps) {
  return (
    <div className="timetable-workspace">
      <div className="timetable-section-heading">
        <div><h2>Timetable slots</h2><p>Define weekly periods for the selected academic year.</p></div>
        <span className="timetable-count">{slots.length} slot{slots.length === 1 ? "" : "s"}</span>
      </div>

      {!yearId && <div className="timetable-inline-message">Select an academic year above to manage time slots.</div>}

      {canCreate && yearId && (
        <form className="timetable-form" onSubmit={onSubmit}>
          <h3><Plus size={17} /> Create time slot</h3>
          <div className="timetable-form-grid timetable-form-grid--three">
            <Dropdown label="Weekday" options={DAYS} value={slotDay} onChange={setSlotDay} searchable={false} />
            <Field label="Start time">
              <input required type="time" value={slotStart} onChange={(event) => setSlotStart(event.target.value)} />
            </Field>
            <Field label="End time">
              <input required type="time" min={slotStart} value={slotEnd} onChange={(event) => setSlotEnd(event.target.value)} />
            </Field>
            <Field label="Label (optional)">
              <input maxLength={50} value={slotLabel} onChange={(event) => setSlotLabel(event.target.value)} placeholder="e.g. Period 1" />
            </Field>
          </div>
          <div className="timetable-form-actions">
            <button className="timetable-primary-button" type="submit" disabled={saving || !yearId || slotEnd <= slotStart}>
              {saving ? <LoaderCircle size={16} className="timetable-spin" /> : <Plus size={16} />} Create slot
            </button>
          </div>
        </form>
      )}

      {loading && <div className="timetable-loading"><RefreshCw size={18} className="timetable-spin" /> Loading slots…</div>}
      {yearId && canRead && !loading && slots.length === 0 && (
        <Empty title="No timetable slots for this year" description="Create the weekly periods that scheduled lessons will use." />
      )}
      {canRead && slots.length > 0 && (
        <div className="timetable-table-wrap">
          <table className="timetable-table">
            <caption className="timetable-sr-only">Timetable slots for the selected academic year</caption>
            <thead><tr><th scope="col">Weekday</th><th scope="col">Time</th><th scope="col">Label</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td><strong>{dayLabel(slot.dayOfWeek)}</strong></td>
                  <td>{friendlyTime(slot.startTime)} – {friendlyTime(slot.endTime)}</td>
                  <td>{slot.label || "—"}</td>
                  <td><span className={`timetable-status ${slot.active ? "timetable-status--active" : ""}`}>{slot.active ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="timetable-help">Weekdays use Monday = 1 through Sunday = 7. The backend prevents overlapping active slots on the same weekday.</p>
    </div>
  );
}
