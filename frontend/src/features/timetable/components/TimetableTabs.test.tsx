// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { TimetableTabs, type TimetableTabOption } from "./TimetableTabs";
import { BookOpen, DoorOpen } from "lucide-react";

const tabs: TimetableTabOption[] = [
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "rooms", label: "Rooms", icon: DoorOpen },
];

describe("TimetableTabs", () => {
  it("exposes the selected tab and linked panel semantics", () => {
    render(<TimetableTabs tabs={tabs} activeTab="subjects" onSelect={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "Subjects" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Subjects" })).toHaveAttribute("aria-controls", "timetable-tabpanel");
    expect(screen.getByRole("tab", { name: "Rooms" })).toHaveAttribute("tabindex", "-1");
  });

  it("supports arrow-key navigation and moves focus to the next tab", () => {
    const onSelect = vi.fn();
    render(<TimetableTabs tabs={tabs} activeTab="subjects" onSelect={onSelect} />);
    const subjectsTab = screen.getByRole("tab", { name: "Subjects" });

    fireEvent.keyDown(subjectsTab, { key: "ArrowRight" });

    expect(onSelect).toHaveBeenCalledWith("rooms");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Rooms" }));
  });
});
