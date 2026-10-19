import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock3,
  DoorOpen,
  GraduationCap,
  LoaderCircle,
  Users,
} from "lucide-react";

import { ApiError } from "../../../lib/api/api-error";
import { useAuth } from "../../../lib/auth/use-auth";
import { organizationService } from "../../organization/api/organization-service";
import type { Institution } from "../../organization/api/organization-types";
import type { Option } from "../components/TimetableControls";
import { TimetableOrganizationScope } from "../components/TimetableOrganizationScope";
import { TimetablePageAlerts } from "../components/TimetablePageAlerts";
import { TimetableTabs, type TimetableTabId } from "../components/TimetableTabs";
import { TimetableSubjectsPanel } from "../components/TimetableSubjectsPanel";
import { TimetableAssignmentsPanel, TimetableRoomsPanel } from "../components/TimetableResourcePanels";
import { TimetableSlotsPanel } from "../components/TimetableSlotsPanel";
import { TimetableScheduledLessonsPanel } from "../components/TimetableScheduledLessonsPanel";
import { TimetableOccurrencesPanel } from "../components/TimetableOccurrencesPanel";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import { timetableService } from "../api/timetable-service";
import type {
  AcademicSubject,
  AcademicYear,
  ClassSection,
  LessonOccurrence,
  SchoolClass,
  SchoolRoom,
  ScheduledLesson,
  StaffAssignment,
  TeacherSubjectAssignment,
  TimetableSlot,
} from "../api/timetable-types";

import "./timetable-page.css";

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];
function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function friendlyDate(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function friendlyTime(value: string): string {
  const [rawHour, minute] = value.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour) || !minute) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}


function dayLabel(day: number): string {
  return DAYS.find((item) => Number(item.value) === day)?.label ?? `Day ${day}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again.";
    if (error.status === 403) return "Your account does not have permission to perform this action.";
    if (error.status === 0) return "The server could not be reached. Check your connection.";
    return error.message;
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}


export function TimetablePage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [organizationSelection, setOrganizationSelection] = useOrganizationSelection();
  const clusterId = organizationSelection.cluster?.id ?? "";
  const institutionId = organizationSelection.institution?.id ?? "";
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [tab, setTab] = useState<TimetableTabId>("subjects");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const [assignmentTeacherId, setAssignmentTeacherId] = useState("");
  const [assignmentSubjectId, setAssignmentSubjectId] = useState("");
  const [assignmentStartDate, setAssignmentStartDate] = useState(localDate());
  const [assignmentEndDate, setAssignmentEndDate] = useState("");

  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCampusId, setRoomCampusId] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");

  const [slotDay, setSlotDay] = useState("1");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("09:45");
  const [slotLabel, setSlotLabel] = useState("");

  const [lessonSlotId, setLessonSlotId] = useState("");
  const [lessonTeacherId, setLessonTeacherId] = useState("");
  const [lessonSubjectId, setLessonSubjectId] = useState("");
  const [lessonRoomId, setLessonRoomId] = useState("");

  const [occurrenceStart, setOccurrenceStart] = useState(localDate());
  const [occurrenceEnd, setOccurrenceEnd] = useState(localDate());

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");

  // Permissions are checked in the frontend and remain enforced by Spring Security.
  const canInstitutionRead = hasPermission("INSTITUTION_READ");
  const canYearRead = hasPermission("ACADEMIC_YEAR_READ");
  const canClassRead = hasPermission("CLASS_READ");
  const canSectionRead = hasPermission("SECTION_READ");
  const canCampusRead = hasPermission("CAMPUS_READ");
  const canSubjectRead = hasPermission("SUBJECT_READ");
  const canSubjectCreate = hasPermission("SUBJECT_CREATE");
  const canSubjectUpdate = hasPermission("SUBJECT_UPDATE");
  const canAssignmentRead = hasPermission("TEACHER_SUBJECT_READ");
  const canAssignmentCreate = hasPermission("TEACHER_SUBJECT_ASSIGN");
  const canStaffRead = hasPermission("STAFF_READ");
  const canRoomRead = hasPermission("ROOM_READ");
  const canRoomCreate = hasPermission("ROOM_CREATE");
  const canSlotRead = hasPermission("TIMETABLE_SLOT_READ");
  const canSlotCreate = hasPermission("TIMETABLE_SLOT_CREATE");
  const canTimetableRead = hasPermission("TIMETABLE_READ");
  const canLessonCreate = hasPermission("TIMETABLE_LESSON_CREATE");
  const canLessonCancel = hasPermission("TIMETABLE_LESSON_CANCEL");
  const canOccurrenceGenerate = canLessonCreate;

  const institutionsQuery = useQuery({
    queryKey: ["organization", "institutions", clusterId],
    queryFn: () => organizationService.getInstitutions(clusterId),
    enabled: Boolean(clusterId && canInstitutionRead),
    staleTime: 60_000,
  });

  const singleInstitutionQuery = useQuery({
    queryKey: ["organization", "institution", institutionId],
    queryFn: () => organizationService.getInstitution(institutionId),
    enabled: Boolean(institutionId && !clusterId && canInstitutionRead),
    staleTime: 60_000,
  });

  const institutions: Institution[] = institutionsQuery.data ??
    (singleInstitutionQuery.data ? [singleInstitutionQuery.data] : []);

  const institutionOptions: Option[] = [
    ...institutions.map((item) => ({ value: item.id, label: item.name })),
    ...(institutionId && !institutions.some((item) => item.id === institutionId)
      ? [{ value: institutionId, label: singleInstitutionQuery.data?.name ?? "Selected institution" }]
      : []),
  ];

  const yearsQuery = useQuery({
    queryKey: ["academics", "years", institutionId],
    queryFn: () => timetableService.getAcademicYears(institutionId),
    enabled: Boolean(institutionId && canYearRead),
    staleTime: 30_000,
  });
  const years: AcademicYear[] = yearsQuery.data ?? [];
  const yearOptions = years.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.status}`,
  }));

  const classesQuery = useQuery({
    queryKey: ["academics", "classes", yearId],
    queryFn: () => timetableService.getClasses(yearId),
    enabled: Boolean(yearId && canClassRead),
    staleTime: 30_000,
  });
  const classes: SchoolClass[] = classesQuery.data ?? [];
  const classOptions = classes.map((item) => ({
    value: item.id,
    label: `${item.name}${item.code ? ` · ${item.code}` : ""}`,
  }));

  const sectionsQuery = useQuery({
    queryKey: ["academics", "sections", classId],
    queryFn: () => timetableService.getSections(classId),
    enabled: Boolean(classId && canSectionRead),
    staleTime: 30_000,
  });
  const sections: ClassSection[] = sectionsQuery.data ?? [];
  const sectionOptions = sections.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.activeEnrollmentCount} students`,
  }));

  const campusesQuery = useQuery({
    queryKey: ["organization", "campuses", institutionId],
    queryFn: () => timetableService.getCampuses(institutionId),
    enabled: Boolean(institutionId && canCampusRead),
    staleTime: 60_000,
  });
  const campuses = campusesQuery.data ?? [];
  const campusOptions = campuses.map((item) => ({ value: item.id, label: item.name }));

  const subjectsQuery = useQuery({
    queryKey: ["timetable", "subjects", institutionId],
    queryFn: () => timetableService.getSubjects(institutionId),
    enabled: Boolean(institutionId && canSubjectRead),
    staleTime: 30_000,
  });
  const subjects: AcademicSubject[] = subjectsQuery.data ?? [];
  const subjectOptions = subjects.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.code}`,
  }));

  const staffQuery = useQuery({
    queryKey: ["timetable", "staff", institutionId],
    queryFn: () => timetableService.getStaff(institutionId),
    enabled: Boolean(institutionId && canStaffRead),
    staleTime: 30_000,
  });
  const staff: StaffAssignment[] = (staffQuery.data?.content ?? [])
    .filter((item) => item.status === "ACTIVE");

  const teacherStaff = staff.filter((item) => item.staffType === "TEACHER");
  const teacherOptions = teacherStaff.map((item) => ({
    value: item.assignmentId,
    label: `${item.firstName} ${item.lastName} · ${item.employeeNumber}`,
  }));

  const assignmentsQuery = useQuery({
    queryKey: ["timetable", "teacher-subject-assignments", institutionId],
    queryFn: () => timetableService.getTeacherSubjectAssignments(institutionId),
    enabled: Boolean(institutionId && canAssignmentRead),
    staleTime: 30_000,
  });
  const assignments: TeacherSubjectAssignment[] = assignmentsQuery.data ?? [];
  const activeAssignments = assignments.filter((item) => item.active);

  const roomsQuery = useQuery({
    queryKey: ["timetable", "rooms", institutionId],
    queryFn: () => timetableService.getRooms(institutionId),
    enabled: Boolean(institutionId && canRoomRead),
    staleTime: 30_000,
  });
  const rooms: SchoolRoom[] = roomsQuery.data ?? [];
  const roomOptions = rooms.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.code}`,
  }));

  const slotsQuery = useQuery({
    queryKey: ["timetable", "slots", yearId],
    queryFn: () => timetableService.getSlots(yearId),
    enabled: Boolean(yearId && canSlotRead),
    staleTime: 30_000,
  });
  const slots: TimetableSlot[] = slotsQuery.data ?? [];
  const slotOptions = slots.map((item) => ({
    value: item.id,
    label: `${dayLabel(item.dayOfWeek)} · ${friendlyTime(item.startTime)}–${friendlyTime(item.endTime)}${item.label ? ` · ${item.label}` : ""}`,
  }));

  const lessonQuery = useQuery({
    queryKey: ["timetable", "section-lessons", sectionId],
    queryFn: () => timetableService.getSectionTimetable(sectionId),
    enabled: Boolean(sectionId && canTimetableRead),
    staleTime: 15_000,
  });
  const lessons: ScheduledLesson[] = lessonQuery.data ?? [];

  const occurrencesQuery = useQuery({
    queryKey: ["timetable", "occurrences", sectionId, occurrenceStart, occurrenceEnd],
    queryFn: () => timetableService.getOccurrences(sectionId, occurrenceStart, occurrenceEnd),
    enabled: Boolean(
      sectionId && canTimetableRead && occurrenceStart && occurrenceEnd &&
      occurrenceEnd >= occurrenceStart && tab === "occurrences",
    ),
    staleTime: 10_000,
  });
  const occurrences: LessonOccurrence[] = occurrencesQuery.data ?? [];

  const subjectsForLessonTeacher = activeAssignments.filter(
    (item) => item.staffAssignmentId === lessonTeacherId,
  );
  const lessonSubjectOptions: Option[] = subjectsForLessonTeacher.map((item) => ({
    value: item.subjectId,
    label: `${item.subjectName} · ${item.subjectCode}`,
  }));

  useEffect(() => {
    setYearId("");
    setClassId("");
    setSectionId("");
    setRoomCampusId("");
    setLessonSlotId("");
    setLessonTeacherId("");
    setLessonSubjectId("");
    setLessonRoomId("");
    setPageError("");
    setPageNotice("");
  }, [institutionId]);

  useEffect(() => {
    if (years.length && !years.some((item) => item.id === yearId)) {
      setYearId((years.find((item) => item.status === "ACTIVE") ?? years[0]).id);
    } else if (!years.length && yearId) {
      setYearId("");
    }
  }, [years, yearId]);

  useEffect(() => {
    if (classes.length && !classes.some((item) => item.id === classId)) {
      setClassId(classes[0].id);
    } else if (!classes.length && classId) {
      setClassId("");
    }
  }, [classes, classId]);

  useEffect(() => {
    if (sections.length && !sections.some((item) => item.id === sectionId)) {
      setSectionId(sections[0].id);
    } else if (!sections.length && sectionId) {
      setSectionId("");
    }
  }, [sections, sectionId]);

  useEffect(() => {
    if (!slots.some((item) => item.id === lessonSlotId)) setLessonSlotId("");
  }, [slots, lessonSlotId]);

  useEffect(() => {
    if (!teacherStaff.some((item) => item.assignmentId === lessonTeacherId)) {
      setLessonTeacherId("");
      setLessonSubjectId("");
    }
  }, [teacherStaff, lessonTeacherId]);

  useEffect(() => {
    if (!lessonSubjectOptions.some((item) => item.value === lessonSubjectId)) {
      setLessonSubjectId("");
    }
  }, [lessonSubjectOptions, lessonSubjectId]);

  function clearMessages() {
    setPageError("");
    setPageNotice("");
  }

  function changeInstitution(value: string) {
    const institution =
      institutions.find((item) => item.id === value) ??
      (organizationSelection.institution?.id === value
        ? organizationSelection.institution
        : null);
    setOrganizationSelection((current) => ({
      ...current,
      institution,
    }));
    setYearId("");
    setClassId("");
    setSectionId("");
    setRoomCampusId("");
    setLessonSlotId("");
    setLessonTeacherId("");
    setLessonSubjectId("");
    setLessonRoomId("");
    clearMessages();
  }

  function changeYear(value: string) {
    setYearId(value);
    setClassId("");
    setSectionId("");
    setLessonSlotId("");
    setLessonTeacherId("");
    setLessonSubjectId("");
    clearMessages();
  }

  function changeClass(value: string) {
    setClassId(value);
    setSectionId("");
    clearMessages();
  }

  function reportError(error: unknown) {
    const message = getErrorMessage(error);
    setPageError(message);

    if (error instanceof ApiError && error.status === 422) {
      void Swal.fire({
        icon: "error",
        title: "Request could not be completed",
        text: error.message,
        confirmButtonText: "Understood",
        confirmButtonColor: "#3157d5",
        customClass: {
          popup: "timetable-swal-popup",
          confirmButton: "timetable-swal-button",
        },
      });
    }
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: () => Promise<unknown>,
    success: string,
    keys: readonly (readonly unknown[])[],
  ) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    clearMessages();

    try {
      await action();
      setPageNotice(success);
      await Promise.all(keys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ));
    } catch (error) {
      reportError(error);
    } finally {
      setSaving(false);
    }
  }

  function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    const isEditing = Boolean(editingSubjectId);

    return submit(
      event,
      async () => {
        if (!institutionId) throw new Error("Select an institution first.");

        const details = {
          code: subjectCode.trim(),
          name: subjectName.trim(),
          description: subjectDescription.trim() || null,
        };

        if (editingSubjectId) {
          if (!canSubjectUpdate) {
            throw new Error("SUBJECT_UPDATE permission is required.");
          }
          await timetableService.updateSubject(editingSubjectId, details);
        } else {
          if (!canSubjectCreate) {
            throw new Error("SUBJECT_CREATE permission is required.");
          }
          await timetableService.createSubject({ institutionId, ...details });
        }

        setSubjectCode("");
        setSubjectName("");
        setSubjectDescription("");
        setEditingSubjectId(null);
      },
      isEditing ? "Subject updated successfully." : "Subject created successfully.",
      [["timetable", "subjects", institutionId]],
    );
  }

  function handleAssignTeacher(event: FormEvent<HTMLFormElement>) {
    return submit(
      event,
      async () => {
        if (!canAssignmentCreate) throw new Error("TEACHER_SUBJECT_ASSIGN permission is required.");
        if (!assignmentTeacherId || !assignmentSubjectId) {
          throw new Error("Select a teacher and subject.");
        }
        if (assignmentEndDate && assignmentEndDate < assignmentStartDate) {
          throw new Error("Assignment end date must be on or after its start date.");
        }

        await timetableService.assignTeacherSubject({
          staffAssignmentId: assignmentTeacherId,
          subjectId: assignmentSubjectId,
          startDate: assignmentStartDate,
          endDate: assignmentEndDate || null,
        });
        setAssignmentTeacherId("");
        setAssignmentSubjectId("");
        setAssignmentEndDate("");
      },
      "Teacher-subject assignment created successfully.",
      [["timetable", "teacher-subject-assignments", institutionId]],
    );
  }

  function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    return submit(
      event,
      async () => {
        if (!canRoomCreate) throw new Error("ROOM_CREATE permission is required.");
        if (!institutionId) throw new Error("Select an institution first.");
        await timetableService.createRoom({
          institutionId,
          campusId: roomCampusId || null,
          code: roomCode.trim(),
          name: roomName.trim(),
          capacity: roomCapacity.trim() ? Number(roomCapacity) : null,
        });
        setRoomCode("");
        setRoomName("");
        setRoomCapacity("");
        setRoomCampusId("");
      },
      "Room created successfully.",
      [["timetable", "rooms", institutionId]],
    );
  }

  function handleCreateSlot(event: FormEvent<HTMLFormElement>) {
    return submit(
      event,
      async () => {
        if (!canSlotCreate) throw new Error("TIMETABLE_SLOT_CREATE permission is required.");
        if (!yearId) throw new Error("Select an academic year first.");
        if (slotEnd <= slotStart) throw new Error("End time must be after start time.");
        await timetableService.createSlot({
          academicYearId: yearId,
          dayOfWeek: Number(slotDay),
          startTime: slotStart,
          endTime: slotEnd,
          label: slotLabel.trim() || null,
        });
        setSlotLabel("");
      },
      "Timetable slot created successfully.",
      [["timetable", "slots", yearId]],
    );
  }

  function handleCreateLesson(event: FormEvent<HTMLFormElement>) {
    return submit(
      event,
      async () => {
        if (!canLessonCreate) throw new Error("TIMETABLE_LESSON_CREATE permission is required.");
        if (!sectionId || !lessonSlotId || !lessonTeacherId || !lessonSubjectId) {
          throw new Error("Select a section, slot, teacher and subject.");
        }

        const teacherHasSubject = activeAssignments.some(
          (item) => item.staffAssignmentId === lessonTeacherId &&
            item.subjectId === lessonSubjectId,
        );
        if (!teacherHasSubject) {
          throw new Error("Assign this subject to the selected teacher before scheduling the lesson.");
        }

        await timetableService.createLesson({
          sectionId,
          slotId: lessonSlotId,
          teacherAssignmentId: lessonTeacherId,
          subjectId: lessonSubjectId,
          roomId: lessonRoomId || null,
        });
        setLessonRoomId("");
        setLessonSubjectId("");
      },
      "Scheduled lesson created successfully.",
      [["timetable", "section-lessons", sectionId]],
    );
  }

  async function handleCancelLesson(lesson: ScheduledLesson) {
    if (!canLessonCancel || saving) return;
    const confirmation = await Swal.fire({
      title: "Cancel scheduled lesson?",
      text: `${lesson.subjectName} for ${lesson.sectionName}, ${dayLabel(lesson.dayOfWeek)} at ${friendlyTime(lesson.startTime)} will no longer appear as an active scheduled lesson.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cancel lesson",
      cancelButtonText: "Keep lesson",
      reverseButtons: true,
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#667085",
      customClass: {
        popup: "timetable-swal-popup",
        confirmButton: "timetable-swal-button",
      },
    });
    if (!confirmation.isConfirmed) return;

    setSaving(true);
    clearMessages();
    try {
      await timetableService.cancelLesson(lesson.id);
      setPageNotice("Scheduled lesson cancelled.");
      await queryClient.invalidateQueries({
        queryKey: ["timetable", "section-lessons", sectionId],
      });
    } catch (error) {
      reportError(error);
    } finally {
      setSaving(false);
    }
  }

  function handleGenerateOccurrences(event: FormEvent<HTMLFormElement>) {
    return submit(
      event,
      async () => {
        if (!canOccurrenceGenerate) {
          throw new Error("TIMETABLE_LESSON_CREATE permission is required to generate occurrences.");
        }
        if (!sectionId) throw new Error("Select a section first.");
        if (occurrenceEnd < occurrenceStart) {
          throw new Error("End date must be on or after start date.");
        }
        const count = await timetableService.generateOccurrences({
          sectionId,
          startDate: occurrenceStart,
          endDate: occurrenceEnd,
        });
        setPageNotice(`${count} lesson occurrence${count === 1 ? "" : "s"} generated.`);
      },
      "Lesson occurrences generated.",
      [["timetable", "occurrences", sectionId, occurrenceStart, occurrenceEnd]],
    );
  }

  const tabs = useMemo(() => [
    { id: "subjects" as const, label: "Subjects", icon: BookOpen, visible: canSubjectRead || canSubjectCreate || canSubjectUpdate },
    { id: "assignments" as const, label: "Teacher assignments", icon: Users, visible: canAssignmentRead || canAssignmentCreate },
    { id: "rooms" as const, label: "Rooms", icon: DoorOpen, visible: canRoomRead || canRoomCreate },
    { id: "slots" as const, label: "Time slots", icon: Clock3, visible: canSlotRead || canSlotCreate },
    { id: "lessons" as const, label: "Scheduled lessons", icon: CalendarDays, visible: canTimetableRead || canLessonCreate || canLessonCancel },
    { id: "occurrences" as const, label: "Lesson occurrences", icon: CalendarClock, visible: canTimetableRead || canOccurrenceGenerate },
  ].filter((item) => item.visible), [
    canSubjectRead, canSubjectCreate, canSubjectUpdate, canAssignmentRead, canAssignmentCreate,
    canRoomRead, canRoomCreate, canSlotRead, canSlotCreate, canTimetableRead,
    canLessonCreate, canLessonCancel, canOccurrenceGenerate,
  ]);

  useEffect(() => {
    if (tabs.length && !tabs.some((item) => item.id === tab)) setTab(tabs[0].id);
  }, [tabs, tab]);

  const dashboardErrors = [
    institutionsQuery.isError ? institutionsQuery.error : null,
    singleInstitutionQuery.isError ? singleInstitutionQuery.error : null,
    yearsQuery.isError ? yearsQuery.error : null,
    classesQuery.isError ? classesQuery.error : null,
    sectionsQuery.isError ? sectionsQuery.error : null,
    campusesQuery.isError ? campusesQuery.error : null,
    subjectsQuery.isError ? subjectsQuery.error : null,
    staffQuery.isError ? staffQuery.error : null,
    assignmentsQuery.isError ? assignmentsQuery.error : null,
    roomsQuery.isError ? roomsQuery.error : null,
    slotsQuery.isError ? slotsQuery.error : null,
    lessonQuery.isError ? lessonQuery.error : null,
    occurrencesQuery.isError ? occurrencesQuery.error : null,
  ].filter(Boolean);

  const selectedYear = years.find((item) => item.id === yearId);
  const selectedClass = classes.find((item) => item.id === classId);
  const selectedSection = sections.find((item) => item.id === sectionId);

  return (
    <main className="timetable-page">
      <header className="timetable-page__header">
        <div>
          <p className="timetable-eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Timetable Management</h1>
          <p className="timetable-subtitle">
            Configure subjects, teachers, rooms, class timetables and lesson occurrences.
          </p>
        </div>
        <div className="timetable-page__icon"><CalendarClock size={25} /></div>
      </header>

      <TimetablePageAlerts
        pageError={pageError}
        pageNotice={pageNotice}
        dashboardErrorMessage={dashboardErrors.length ? getErrorMessage(dashboardErrors[0]) : ""}
        onDismissError={() => setPageError("")}
        onDismissNotice={() => setPageNotice("")}
        onRetryDashboard={() => {
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: ["organization", "institutions", clusterId] }),
            queryClient.invalidateQueries({ queryKey: ["organization", "institution", institutionId] }),
            queryClient.invalidateQueries({ queryKey: ["organization", "campuses", institutionId] }),
            queryClient.invalidateQueries({ queryKey: ["academics", "years", institutionId] }),
            queryClient.invalidateQueries({ queryKey: ["academics", "classes", yearId] }),
            queryClient.invalidateQueries({ queryKey: ["academics", "sections", classId] }),
            queryClient.invalidateQueries({ queryKey: ["timetable"] }),
          ]);
        }}
      />

      <TimetableOrganizationScope
        institutionId={institutionId}
        institutionOptions={institutionOptions}
        institutionCount={institutions.length}
        onInstitutionChange={changeInstitution}
        clusterId={clusterId}
        canInstitutionRead={canInstitutionRead}
        institutionsLoading={institutionsQuery.isLoading || singleInstitutionQuery.isLoading}
        yearId={yearId}
        yearOptions={yearOptions}
        canYearRead={canYearRead}
        yearsLoading={yearsQuery.isLoading}
        hasAcademicYears={years.length > 0}
        classId={classId}
        classOptions={classOptions}
        canClassRead={canClassRead}
        classesLoading={classesQuery.isLoading}
        sectionId={sectionId}
        sectionOptions={sectionOptions}
        canSectionRead={canSectionRead}
        sectionsLoading={sectionsQuery.isLoading}
        onYearChange={changeYear}
        onClassChange={changeClass}
        onSectionChange={(value) => { setSectionId(value); clearMessages(); }}
      />

      <section
        className="timetable-panel"
        id="timetable-tabpanel"
        role="tabpanel"
        aria-labelledby={`timetable-tab-${tab}`}
        tabIndex={0}
      >
        <TimetableTabs
          tabs={tabs}
          activeTab={tab}
          onSelect={(nextTab) => { setTab(nextTab); clearMessages(); }}
        />

        {tab === "subjects" && (
          <TimetableSubjectsPanel
            institutionId={institutionId}
            subjects={subjects}
            subjectsLoading={subjectsQuery.isLoading}
            canSubjectRead={canSubjectRead}
            canSubjectCreate={canSubjectCreate}
            canSubjectUpdate={canSubjectUpdate}
            saving={saving}
            editingSubjectId={editingSubjectId}
            subjectName={subjectName}
            setSubjectName={setSubjectName}
            subjectCode={subjectCode}
            setSubjectCode={setSubjectCode}
            subjectDescription={subjectDescription}
            setSubjectDescription={setSubjectDescription}
            onSubmit={handleCreateSubject}
            onEdit={(subject) => {
              setEditingSubjectId(subject.id);
              setSubjectName(subject.name);
              setSubjectCode(subject.code);
              setSubjectDescription(subject.description ?? "");
              clearMessages();
            }}
            onCancelEdit={() => {
              setEditingSubjectId(null);
              setSubjectCode("");
              setSubjectName("");
              setSubjectDescription("");
              clearMessages();
            }}
          />
        )}
        {tab === "assignments" && (
          <TimetableAssignmentsPanel
            institutionId={institutionId}
            assignments={assignments}
            assignmentsLoading={assignmentsQuery.isLoading}
            activeAssignmentCount={activeAssignments.length}
            canAssignmentCreate={canAssignmentCreate}
            canAssignmentRead={canAssignmentRead}
            canStaffRead={canStaffRead}
            canSubjectRead={canSubjectRead}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            assignmentTeacherId={assignmentTeacherId}
            setAssignmentTeacherId={setAssignmentTeacherId}
            assignmentSubjectId={assignmentSubjectId}
            setAssignmentSubjectId={setAssignmentSubjectId}
            assignmentStartDate={assignmentStartDate}
            setAssignmentStartDate={setAssignmentStartDate}
            assignmentEndDate={assignmentEndDate}
            setAssignmentEndDate={setAssignmentEndDate}
            teacherCount={teacherStaff.length}
            staffLoading={staffQuery.isLoading}
            subjectsLoading={subjectsQuery.isLoading}
            saving={saving}
            onSubmit={handleAssignTeacher}
            formatDate={friendlyDate}
          />
        )}
        {tab === "rooms" && (
          <TimetableRoomsPanel
            institutionId={institutionId}
            rooms={rooms}
            roomsLoading={roomsQuery.isLoading}
            canRoomCreate={canRoomCreate}
            canRoomRead={canRoomRead}
            canCampusRead={canCampusRead}
            campusOptions={campusOptions}
            campusesLoading={campusesQuery.isLoading}
            roomName={roomName}
            setRoomName={setRoomName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            roomCampusId={roomCampusId}
            setRoomCampusId={setRoomCampusId}
            roomCapacity={roomCapacity}
            setRoomCapacity={setRoomCapacity}
            saving={saving}
            onSubmit={handleCreateRoom}
          />
        )}
        {tab === "slots" && (
          <TimetableSlotsPanel
            yearId={yearId}
            slots={slots}
            loading={slotsQuery.isLoading}
            canRead={canSlotRead}
            canCreate={canSlotCreate}
            saving={saving}
            slotDay={slotDay}
            setSlotDay={setSlotDay}
            slotStart={slotStart}
            setSlotStart={setSlotStart}
            slotEnd={slotEnd}
            setSlotEnd={setSlotEnd}
            slotLabel={slotLabel}
            setSlotLabel={setSlotLabel}
            onSubmit={handleCreateSlot}
            dayLabel={dayLabel}
            friendlyTime={friendlyTime}
          />
        )}

        {tab === "lessons" && (
          <TimetableScheduledLessonsPanel
            sectionId={sectionId}
            yearId={yearId}
            lessons={lessons}
            canRead={canTimetableRead}
            canCreate={canLessonCreate}
            canCancel={canLessonCancel}
            canSlotRead={canSlotRead}
            canStaffRead={canStaffRead}
            canAssignmentRead={canAssignmentRead}
            canRoomRead={canRoomRead}
            saving={saving}
            loading={lessonQuery.isLoading}
            isError={lessonQuery.isError}
            errorMessage={lessonQuery.isError ? getErrorMessage(lessonQuery.error) : ""}
            slotOptions={slotOptions}
            slotsLoading={slotsQuery.isLoading}
            teacherOptions={teacherOptions}
            staffLoading={staffQuery.isLoading}
            lessonSubjectOptions={lessonSubjectOptions}
            assignmentsLoading={assignmentsQuery.isLoading}
            roomOptions={roomOptions}
            roomsLoading={roomsQuery.isLoading}
            lessonSlotId={lessonSlotId}
            setLessonSlotId={setLessonSlotId}
            lessonTeacherId={lessonTeacherId}
            setLessonTeacherId={(value) => {
              setLessonTeacherId(value);
              setLessonSubjectId("");
            }}
            lessonSubjectId={lessonSubjectId}
            setLessonSubjectId={setLessonSubjectId}
            lessonRoomId={lessonRoomId}
            setLessonRoomId={setLessonRoomId}
            onSubmit={handleCreateLesson}
            onCancelLesson={handleCancelLesson}
            dayLabel={dayLabel}
            friendlyTime={friendlyTime}
          />
        )}

        {tab === "occurrences" && (
          <TimetableOccurrencesPanel
            sectionId={sectionId}
            canGenerate={canOccurrenceGenerate}
            canRead={canTimetableRead}
            saving={saving}
            startDate={occurrenceStart}
            setStartDate={setOccurrenceStart}
            endDate={occurrenceEnd}
            setEndDate={setOccurrenceEnd}
            onGenerate={handleGenerateOccurrences}
            onReload={() => void occurrencesQuery.refetch()}
            isFetching={occurrencesQuery.isFetching}
            isLoading={occurrencesQuery.isLoading}
            isError={occurrencesQuery.isError}
            errorMessage={occurrencesQuery.isError ? getErrorMessage(occurrencesQuery.error) : ""}
            occurrences={occurrences}
            lessons={lessons}
            formatDate={friendlyDate}
            formatTime={friendlyTime}
          />
        )}
      </section>

      {saving && (
        <div className="timetable-saving-indicator" role="status">
          <LoaderCircle size={15} className="timetable-spin" /> Saving changes…
        </div>
      )}

      {selectedYear && selectedClass && selectedSection && (
        <div className="timetable-breadcrumb">
          <GraduationCap size={14} />
          <span>{selectedYear.name}</span>
          <span>/</span>
          <span>{selectedClass.name}</span>
          <span>/</span>
          <strong>{selectedSection.name}</strong>
        </div>
      )}
    </main>
  );
}
