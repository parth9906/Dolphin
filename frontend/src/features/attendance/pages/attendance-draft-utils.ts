import type {
  LessonAttendanceRosterItem,
  LessonAttendanceStatus,
} from "../api/attendance-types";

export interface AttendanceDraft {
  studentId: string;
  studentName: string;
  attendanceRecordId: string | null;
  status: LessonAttendanceStatus;
  remarks: string;
  originalStatus: LessonAttendanceStatus | null;
  originalRemarks: string;
}

export function createDraft(item: LessonAttendanceRosterItem): AttendanceDraft {
  return {
    studentId: item.studentId,
    studentName: item.studentName,
    attendanceRecordId: item.attendanceRecordId ?? null,
    status: item.status ?? "PRESENT",
    remarks: item.remarks ?? "",
    originalStatus: item.status ?? null,
    originalRemarks: item.remarks ?? "",
  };
}

export function hasAttendanceDraftChanges(draft: AttendanceDraft): boolean {
  return (
    draft.status !== (draft.originalStatus ?? "PRESENT") ||
    draft.remarks !== draft.originalRemarks
  );
}

/**
 * Reconcile the current server roster with local lesson-attendance edits.
 * Unchanged drafts adopt the latest server state; edited drafts keep their
 * local status and remarks while refreshing their server baseline. Edited
 * rows missing from the latest roster are retained so the UI can identify
 * and require explicit resolution of those stale edits.
 */
export function reconcileAttendanceDrafts(
  roster: LessonAttendanceRosterItem[],
  current: Record<string, AttendanceDraft>,
): Record<string, AttendanceDraft> {
  const nextDrafts: Record<string, AttendanceDraft> = {};
  const rosterStudentIds = new Set(roster.map((item) => item.studentId));

  for (const item of roster) {
    const serverDraft = createDraft(item);
    const localDraft = current[item.studentId];

    if (!localDraft) {
      nextDrafts[item.studentId] = serverDraft;
      continue;
    }

    nextDrafts[item.studentId] = hasAttendanceDraftChanges(localDraft)
      ? {
          ...serverDraft,
          status: localDraft.status,
          remarks: localDraft.remarks,
        }
      : serverDraft;
  }

  for (const [studentId, localDraft] of Object.entries(current)) {
    if (rosterStudentIds.has(studentId)) continue;
    if (hasAttendanceDraftChanges(localDraft)) {
      nextDrafts[studentId] = localDraft;
    }
  }

  return nextDrafts;
}

export function findStaleAttendanceDrafts(
  drafts: Record<string, AttendanceDraft>,
  roster: LessonAttendanceRosterItem[],
): AttendanceDraft[] {
  const rosterStudentIds = new Set(roster.map((item) => item.studentId));

  return Object.values(drafts).filter(
    (draft) =>
      !rosterStudentIds.has(draft.studentId) &&
      hasAttendanceDraftChanges(draft),
  );
}
