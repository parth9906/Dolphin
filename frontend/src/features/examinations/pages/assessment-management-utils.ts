import Select, { type StylesConfig } from "react-select";

import { ApiError } from "../../../lib/api/api-error";
import type { AssessmentRosterItem } from "../api/assessment-types";

export interface Option {
  value: string;
  label: string;
}

export const selectStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderColor: state.isFocused ? "#4676d7" : "#d8dfeb",
    boxShadow: "none",
    "&:hover": { borderColor: "#9aabc6" },
    borderRadius: 9,
    fontSize: 13,
  }),
  menu: (base) => ({ ...base, zIndex: 1100, fontSize: 13 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#315fc2"
      : state.isFocused
        ? "#edf3ff"
        : "#fff",
    color: state.isSelected ? "#fff" : "#243247",
    fontSize: 13,
  }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function displayNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : String(value);
}

export function displayStudentName(student: AssessmentRosterItem): string {
  const fullName = [student.firstName, student.lastName]
    .filter((part) => Boolean(part?.trim()))
    .join(" ")
    .trim();

  return fullName || student.admissionNumber;
}

export function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

