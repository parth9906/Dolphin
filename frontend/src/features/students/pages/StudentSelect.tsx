import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import "./student-select.css";

export interface StudentSelectOption {
  value: string;
  label: string;
}

interface StudentSelectProps {
  id: string;
  value: string;
  options: StudentSelectOption[];
  placeholder: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onChange: (value: string) => void;
}

export function StudentSelect({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No options available.",
  onChange,
}: StudentSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(
    (option) => option.value === value,
  );

  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(
      searchText.trim().toLocaleLowerCase(),
    ),
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
        setSearchText("");
      }
    }

    function handleDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearchText("");
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  function closeDropdown() {
    setOpen(false);
    setSearchText("");
    triggerRef.current?.focus();
  }

  function selectOption(optionValue: string) {
    onChange(optionValue);
    closeDropdown();
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const optionButtons =
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="option"]',
      );

    if (!optionButtons?.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      optionButtons[
        Math.min(index + 1, optionButtons.length - 1)
      ]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      if (index === 0) {
        searchRef.current?.focus();
      } else {
        optionButtons[index - 1]?.focus();
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      optionButtons[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      optionButtons[optionButtons.length - 1]?.focus();
    }
  }

  return (
    <div
      className={`student-select${open ? " student-select--open" : ""}`}
      ref={rootRef}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="student-select__trigger"
        role="combobox"
        aria-label={
          rootRef.current?.parentElement
            ?.querySelector("label")
            ?.textContent?.trim() ?? placeholder
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        disabled={disabled}
        onClick={() => {
          setOpen((current) => !current);
          setSearchText("");
        }}
        onKeyDown={(event) => {
          if (
            (event.key === "ArrowDown" || event.key === "Enter") &&
            !open
          ) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span
          className={`student-select__value${
            selectedOption ? "" : " student-select__value--placeholder"
          }`}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          size={17}
          className="student-select__chevron"
          aria-hidden="true"
        />
      </button>

      {open && !disabled && (
        <div className="student-select__popover">
          <div className="student-select__search">
            <Search size={16} aria-hidden="true" />

            <input
              ref={searchRef}
              type="text"
              value={searchText}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listboxId}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  rootRef.current
                    ?.querySelector<HTMLButtonElement>('[role="option"]')
                    ?.focus();
                }

                if (event.key === "Enter" && filteredOptions.length === 1) {
                  event.preventDefault();
                  selectOption(filteredOptions[0].value);
                }
              }}
            />

            {searchText && (
              <button
                type="button"
                className="student-select__clear"
                aria-label="Clear dropdown search"
                onClick={() => {
                  setSearchText("");
                  searchRef.current?.focus();
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            id={listboxId}
            className="student-select__options"
            role="listbox"
            aria-label={placeholder}
          >
            {filteredOptions.length === 0 ? (
              <div className="student-select__empty" role="status">
                {options.length === 0
                  ? emptyMessage
                  : "No matching options found."}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`student-select__option${
                      selected ? " student-select__option--selected" : ""
                    }`}
                    onClick={() => selectOption(option.value)}
                    onKeyDown={(event) =>
                      handleOptionKeyDown(event, index)
                    }
                  >
                    <span className="student-select__option-label">
                      {option.label}
                    </span>

                    {selected && (
                      <Check
                        size={16}
                        className="student-select__check"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="student-select__footer">
            {filteredOptions.length}{" "}
            {filteredOptions.length === 1 ? "option" : "options"}
          </div>
        </div>
      )}
    </div>
  );
}
