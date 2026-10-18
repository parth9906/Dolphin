import type { LucideIcon } from "lucide-react";

export type TimetableTabId =
  | "subjects"
  | "assignments"
  | "rooms"
  | "slots"
  | "lessons"
  | "occurrences";

export interface TimetableTabOption {
  id: TimetableTabId;
  label: string;
  icon: LucideIcon;
}

interface TimetableTabsProps {
  tabs: TimetableTabOption[];
  activeTab: TimetableTabId;
  onSelect: (tab: TimetableTabId) => void;
}

export function TimetableTabs({ tabs, activeTab, onSelect }: TimetableTabsProps) {
  return (
    <nav className="timetable-tabs" role="tablist" aria-label="Timetable sections">
      {tabs.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            id={`timetable-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls="timetable-tabpanel"
            tabIndex={activeTab === item.id ? 0 : -1}
            className={`timetable-tab${activeTab === item.id ? " timetable-tab--active" : ""}`}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => {
              const currentIndex = tabs.findIndex((tab) => tab.id === item.id);
              let nextIndex = currentIndex;
              if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
              else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = tabs.length - 1;
              else return;
              event.preventDefault();
              const nextTab = tabs[nextIndex];
              onSelect(nextTab.id);
              document.getElementById(`timetable-tab-${nextTab.id}`)?.focus();
            }}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
