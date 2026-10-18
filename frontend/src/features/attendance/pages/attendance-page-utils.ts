import Select, { type StylesConfig } from "react-select";

import { ApiError } from "../../../lib/api/api-error";
import type { LessonAttendanceStatus } from "../api/attendance-types";

export { createDraft } from "./attendance-draft-utils";
export type { AttendanceDraft } from "./attendance-draft-utils";

export interface SelectOption {
  value: string;
  label: string;
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function displayTime(value: string): string {
  const parts = value.split(":");
  if (parts.length < 2) return value;

  const hour = Number(parts[0]);
  const minute = parts[1];
  if (!Number.isFinite(hour)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute} ${suffix}`;
}

export function displayDate(value: string): string {
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function displayTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Your session may have expired. Sign in again.";
    }
    if (error.status === 403) {
      return "Your account does not have permission to perform this operation.";
    }
    if (error.status === 0) {
      return "Unable to reach the server. Check your connection and try again.";
    }
    return error.message || "The request could not be completed.";
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export const statusLabels: Record<LessonAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

export const attendanceStatusOptions: SelectOption[] = Object.entries(statusLabels).map(
  ([value, label]) => ({ value, label }),
);

export const attendanceSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderColor: state.isFocused ? "#3157d5" : "#e4e7ec",
    borderRadius: 8,
    boxShadow: state.isFocused
      ? "0 0 0 3px rgba(49, 87, 213, 0.10)"
      : "none",
    backgroundColor: state.isDisabled ? "#f8f9fb" : "#fff",
    fontSize: 13,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:hover": {
      borderColor: state.isFocused ? "#3157d5" : "#cbd5e1",
    },
  }),
  valueContainer: (base) => ({
    ...base, padding: "2px 11px", minWidth: 0,
  }),
  singleValue: (base) => ({ ...base, color: "#172033", fontSize: 13 }),
  placeholder: (base) => ({ ...base, color: "#98a2b3", fontSize: 13 }),
  input: (base) => ({ ...base, color: "#172033", fontSize: 13 }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({
    ...base,
    zIndex: 10000,
    overflow: "hidden",
    border: "1px solid #e4e7ec",
    borderRadius: 9,
    boxShadow: "0 10px 25px rgba(16, 24, 40, 0.14)",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  option: (base, state) => ({
    ...base,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    backgroundColor: state.isSelected
      ? "#3157d5"
      : state.isFocused
        ? "#eef2ff"
        : "#fff",
    color: state.isSelected ? "#fff" : "#172033",
  }),
};

