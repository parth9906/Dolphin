import type { ReactNode } from "react";
import Select, { type StylesConfig } from "react-select";
import { CalendarClock } from "lucide-react";

export interface Option { value: string; label: string }

const selectStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: state.isFocused ? "#3157d5" : "#e4e7ec",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(49,87,213,.10)" : "none",
    fontSize: 13,
    "&:hover": { borderColor: "#3157d5" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 11px", minWidth: 0 }),
  singleValue: (base) => ({ ...base, color: "#172033" }),
  placeholder: (base) => ({ ...base, color: "#98a2b3" }),
  indicatorSeparator: () => ({ display: "none" }),
  input: (base) => ({ ...base, boxShadow: "none" }),
  menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  menu: (base) => ({
    ...base,
    zIndex: 10000,
    overflow: "hidden",
    border: "1px solid #e4e7ec",
    borderRadius: 9,
    boxShadow: "0 10px 25px rgba(16,24,40,.14)",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    cursor: "pointer",
    backgroundColor: state.isSelected ? "#3157d5" : state.isFocused ? "#eef2ff" : "#fff",
    color: state.isSelected ? "#fff" : "#172033",
  }),
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="timetable-field"><span>{label}</span>{children}</label>;
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Select…",
  searchable = true,
  clearable = false,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
}) {
  return (
    <Field label={label}>
      <Select<Option, false>
        classNamePrefix="timetable-select"
        options={options}
        value={options.find((option) => option.value === value) ?? null}
        onChange={(option) => onChange(option?.value ?? "")}
        isDisabled={disabled}
        isLoading={loading}
        isSearchable={searchable}
        isClearable={clearable}
        placeholder={placeholder}
        noOptionsMessage={() => "No options found"}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </Field>
  );
}

export function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="timetable-empty">
      <CalendarClock size={27} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
