package com.school.dolphin.timetable.controller;

import com.school.dolphin.timetable.dto.*;

import com.school.dolphin.timetable.service.LessonOccurrenceService;
import com.school.dolphin.timetable.service.SubstituteAssignmentService;
import com.school.dolphin.timetable.service.TimetableService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/timetable")
public class TimetableController {
    
    private final TimetableService timetableService;
    private final LessonOccurrenceService lessonOccurrenceService;
    private final SubstituteAssignmentService substituteAssignmentService;
    
    public TimetableController(
            TimetableService timetableService,
            LessonOccurrenceService lessonOccurrenceService,
            SubstituteAssignmentService substituteAssignmentService
    ){
        this.timetableService = timetableService;
        this.lessonOccurrenceService = lessonOccurrenceService;
        this.substituteAssignmentService = substituteAssignmentService;
    }

    @GetMapping("/rooms")
    @PreAuthorize("hasAuthority('ROOM_READ')")
    public List<SchoolRoomResponse> getRooms(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return timetableService.getRooms(institutionId, authentication);
    }

    @GetMapping("/slots")
    @PreAuthorize("hasAuthority('TIMETABLE_SLOT_READ')")
    public List<TimetableSlotResponse> getSlots(
            @RequestParam UUID academicYearId,
            Authentication authentication
    ) {
        return timetableService.getSlots(academicYearId, authentication);
    }

    @GetMapping("/sections/{sectionId}")
    @PreAuthorize("hasAuthority('TIMETABLE_READ')")
    public List<ScheduledLessonResponse> getSectionTimetable(
            @PathVariable UUID sectionId,
            Authentication authentication
    ) {
        return timetableService.getSectionTimetable(sectionId, authentication);
    }

    @GetMapping("/teachers/{staffAssignmentId}")
    @PreAuthorize("hasAuthority('TEACHER_TIMETABLE_READ')")
    public List<ScheduledLessonResponse> getTeacherTimetable(
            @PathVariable UUID staffAssignmentId,
            Authentication authentication
    ) {
        return timetableService.getTeacherTimetable(staffAssignmentId, authentication);
    }

    @PutMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAuthority('TIMETABLE_LESSON_UPDATE')")
    public UUID rescheduleLesson(
            @PathVariable UUID lessonId,
            @Valid @RequestBody RescheduleLessonRequest request,
            Authentication authentication
    ) {
        return timetableService.rescheduleLesson(lessonId, request, authentication);
    }

    @PatchMapping("/lessons/{lessonId}/cancel")
    @PreAuthorize("hasAuthority('TIMETABLE_LESSON_CANCEL')")
    public UUID cancelLesson(
            @PathVariable UUID lessonId,
            Authentication authentication
    ) {
        return timetableService.cancelLesson(lessonId, authentication);
    }

    @PostMapping("/occurrences/generate")
    @PreAuthorize("hasAuthority('TIMETABLE_LESSON_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public int generateOccurrences(
            @Valid @RequestBody GenerateLessonOccurrencesRequest request,
            Authentication authentication) {

        // Verify the caller can access the institution that owns request.sectionId()
        // using your existing organization-scope authorization.
        return lessonOccurrenceService.generateForSection(
                request.sectionId(),
                request.startDate(),
                request.endDate());
    }

    @GetMapping("/occurrences")
    @PreAuthorize("hasAuthority('TIMETABLE_READ')")
    public List<LessonOccurrenceResponse> getOccurrences(
            @RequestParam UUID sectionId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        // Perform the same institution-scope authorization before reading.
        return lessonOccurrenceService.getSectionOccurrences(
                sectionId, startDate, endDate);
    }

    @PostMapping("/occurrences/{occurrenceId}/substitute")
    @PreAuthorize("hasAuthority('SUBSTITUTE_ASSIGN')")
    public SubstituteAssignmentResponse assignSubstitute(
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody AssignSubstituteRequest request,
            Authentication authentication) {

        return substituteAssignmentService.assign(
                occurrenceId,
                request,
                authentication);
    }

    @GetMapping("/occurrences/coverage")
    @PreAuthorize("hasAuthority('TIMETABLE_READ')")
    public List<LessonOccurrenceResponse> getCoverageOccurrences(
            @RequestParam UUID institutionId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        return lessonOccurrenceService.getCoverageOccurrences(
                institutionId,
                startDate,
                endDate,
                authentication);
    }

    @GetMapping("/occurrences/{occurrenceId}/substitute-audit")
    @PreAuthorize("hasAuthority('TIMETABLE_READ')")
    public List<LessonSubstituteAuditResponse> getSubstituteAuditHistory(
            @PathVariable UUID occurrenceId,
            Authentication authentication) {

        return substituteAssignmentService.getAuditHistory(
                occurrenceId, authentication);
    }
}
