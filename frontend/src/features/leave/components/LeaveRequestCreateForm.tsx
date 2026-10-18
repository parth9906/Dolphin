import type { FormEvent } from "react";
import Select from "react-select";
import { LoaderCircle, Send, X } from "lucide-react";

import type { LeaveKind } from "../api/leave-types";

interface LeaveSelectOption {
  value: string;
  label: string;
}

interface LeaveRequestCreateFormProps {
  kind: LeaveKind;
  onKindChange: (kind: LeaveKind) => void;
  personOptions: LeaveSelectOption[];
  personId: string;
  onPersonChange: (personId: string) => void;
  peopleLoading: boolean;
  peopleCount: number;
  leaveTypeOptions: LeaveSelectOption[];
  leaveTypeId: string;
  onLeaveTypeChange: (leaveTypeId: string) => void;
  leaveTypesLoading: boolean;
  leaveTypesCount: number;
  institutionId: string;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onCancel: () => void;
}

const KIND_OPTIONS: { value: LeaveKind; label: string }[] = [
  { value: "staff", label: "Staff member" },
  { value: "student", label: "Student (on their behalf)" },
];

export function LeaveRequestCreateForm({
  kind,
  onKindChange,
  personOptions,
  personId,
  onPersonChange,
  peopleLoading,
  peopleCount,
  leaveTypeOptions,
  leaveTypeId,
  onLeaveTypeChange,
  leaveTypesLoading,
  leaveTypesCount,
  institutionId,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  reason,
  onReasonChange,
  saving,
  onSubmit,
  onClose,
  onCancel,
}: LeaveRequestCreateFormProps) {
  return (
    <section className="leave-panel">
      <div className="leave-panel__heading">
        <div>
          <h2>Create a leave request</h2>
          <p>Requests are created with PENDING status and reviewed by an authorized user.</p>
        </div>
        <button type="button" className="leave-icon-button" aria-label="Close form" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <form className="leave-form" onSubmit={onSubmit}>
        <label>
          Request for
          <Select
            className="leave-select"
            classNamePrefix="leave-select"
            options={KIND_OPTIONS}
            value={KIND_OPTIONS.find((option) => option.value === kind) ?? null}
            onChange={(option) => {
              if (option) onKindChange(option.value);
            }}
            isSearchable={false}
            isClearable={false}
          />
        </label>
        <label>
          {kind === "staff" ? "Active staff member" : "Active student"}
          <Select
            className="leave-select"
            classNamePrefix="leave-select"
            inputId="leave-person"
            options={personOptions}
            value={personOptions.find((option) => option.value === personId) ?? null}
            onChange={(option) => onPersonChange(option?.value ?? "")}
            isSearchable
            isClearable
            isLoading={peopleLoading}
            placeholder={peopleLoading ? "Loading people…" : "Search and select a person"}
            noOptionsMessage={() => peopleLoading ? "Loading people…" : "No people found"}
          />
          {!peopleLoading && peopleCount === 0 && (
            <small>No people were returned by the existing lookup API. Check the relevant read permission.</small>
          )}
        </label>
        <label>
          Leave type
          <Select
            className="leave-select"
            classNamePrefix="leave-select"
            inputId="leave-type"
            options={leaveTypeOptions}
            value={leaveTypeOptions.find((option) => option.value === leaveTypeId) ?? null}
            onChange={(option) => onLeaveTypeChange(option?.value ?? "")}
            isSearchable
            isClearable
            isLoading={leaveTypesLoading}
            isDisabled={leaveTypesLoading || !institutionId}
            placeholder={leaveTypesLoading ? "Loading leave types…" : "Search and select a leave type"}
            noOptionsMessage={() =>
              leaveTypesLoading ? "Loading leave types…" : "No active leave types found"
            }
          />
          {!leaveTypesLoading && leaveTypesCount === 0 && (
            <small>No active leave types were returned for this request type and institution.</small>
          )}
        </label>
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            required
          />
        </label>
        <label>
          End date
          <input
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            required
          />
        </label>
        <label className="leave-form__wide">
          Reason <span className="leave-muted">(optional, up to 1,000 characters)</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Add context for the request…"
          />
        </label>
        <div className="leave-form__actions leave-form__wide">
          <button type="button" className="leave-button leave-button--quiet" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="leave-button leave-button--primary"
            type="submit"
            disabled={saving || !institutionId}
          >
            {saving ? <LoaderCircle className="leave-spin" size={16} /> : <Send size={16} />}
            Submit request
          </button>
        </div>
      </form>
    </section>
  );
}
