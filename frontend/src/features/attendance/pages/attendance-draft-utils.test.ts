import { describe, expect, it } from "vitest";

import {
  createDraft,
  findStaleAttendanceDrafts,
  hasAttendanceDraftChanges,
  reconcileAttendanceDrafts,
  type AttendanceDraft,
} from "./attendance-draft-utils";
import type { LessonAttendanceRosterItem } from "../api/attendance-types";

const rosterItem = (overrides: Partial<LessonAttendanceRosterItem> = {}): LessonAttendanceRosterItem => ({
  studentId: "student-1",
  studentName: "A Student",
  attendanceRecordId: "record-1",
  status: "PRESENT",
  remarks: null,
  ...overrides,
});

describe("attendance draft reconciliation", () => {
  it("preserves edited values while updating the server baseline", () => {
    const draft = createDraft(rosterItem());
    const edited: AttendanceDraft = { ...draft, status: "ABSENT", remarks: "Sick" };
    const result = reconcileAttendanceDrafts([
      rosterItem({ status: "LATE", remarks: "Updated server note", attendanceRecordId: "record-2" }),
    ], { "student-1": edited });

    expect(result["student-1"]).toMatchObject({
      attendanceRecordId: "record-2",
      originalStatus: "LATE",
      originalRemarks: "Updated server note",
      status: "ABSENT",
      remarks: "Sick",
    });
    expect(hasAttendanceDraftChanges(result["student-1"])).toBe(true);
  });

  it("retains changed drafts for students removed from the refreshed roster", () => {
    const edited: AttendanceDraft = {
      ...createDraft(rosterItem()),
      status: "ABSENT",
      remarks: "Sick",
    };
    const result = reconcileAttendanceDrafts([], { "student-1": edited });

    expect(findStaleAttendanceDrafts(result, [])).toEqual([edited]);
  });

  it("adopts the latest server values for drafts that have not been edited", () => {
    const unchanged = createDraft(rosterItem());
    const result = reconcileAttendanceDrafts([
      rosterItem({ status: "LATE", remarks: "Late arrival" }),
    ], { "student-1": unchanged });

    expect(result["student-1"].status).toBe("LATE");
    expect(result["student-1"].remarks).toBe("Late arrival");
    expect(hasAttendanceDraftChanges(result["student-1"])).toBe(false);
  });
});
