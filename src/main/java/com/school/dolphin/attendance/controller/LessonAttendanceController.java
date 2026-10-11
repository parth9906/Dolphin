package com.school.dolphin.attendance.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.school.dolphin.attendance.dto.CorrectLessonAttendanceRequest;
import com.school.dolphin.attendance.dto.LessonAttendanceAuditResponse;
import com.school.dolphin.attendance.dto.LessonAttendanceResponse;
import com.school.dolphin.attendance.dto.LessonAttendanceRosterItemResponse;
import com.school.dolphin.attendance.dto.MarkLessonAttendanceRequest;
import com.school.dolphin.attendance.service.LessonAttendanceService;
import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;

import com.school.dolphin.attendance.dto.AttendanceGroupAnalyticsResponse;
import com.school.dolphin.attendance.dto.StudentAttendanceAnalyticsResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/lesson-attendance")
@RequiredArgsConstructor
public class LessonAttendanceController {

    private final LessonAttendanceService lessonAttendanceService;

    @GetMapping("/occurrences/{occurrenceId}/roster")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<LessonAttendanceRosterItemResponse> getRoster(
            @PathVariable UUID occurrenceId,
            Authentication authentication) {

        return lessonAttendanceService.getRoster(
                occurrenceId, authentication);
    }

    @GetMapping("/occurrences/{occurrenceId}")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<LessonAttendanceResponse> getAttendance(
            @PathVariable UUID occurrenceId,
            Authentication authentication) {

        return lessonAttendanceService.getAttendance(
                occurrenceId, authentication);
    }

    @PostMapping("/occurrences/{occurrenceId}")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_MARK')")
    public List<LessonAttendanceResponse> markAttendance(
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody MarkLessonAttendanceRequest request,
            Authentication authentication) {

        return lessonAttendanceService.markAttendance(
                occurrenceId, request, authentication);
    }

    @PutMapping("/records/{attendanceRecordId}")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_UPDATE')")
    public LessonAttendanceResponse correctAttendance(
            @PathVariable UUID attendanceRecordId,
            @Valid @RequestBody CorrectLessonAttendanceRequest request,
            Authentication authentication) {

        return lessonAttendanceService.correctAttendance(
                attendanceRecordId, request, authentication);
    }

    @GetMapping("/records/{attendanceRecordId}/audit")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<LessonAttendanceAuditResponse> getAuditHistory(
            @PathVariable UUID attendanceRecordId,
            Authentication authentication) {

        return lessonAttendanceService.getAuditHistory(
                attendanceRecordId, authentication);
    }

    @GetMapping("/analytics/students")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<StudentAttendanceAnalyticsResponse> getStudentAnalytics(
            @RequestParam UUID institutionId,
            @RequestParam UUID sectionId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        return lessonAttendanceService.getStudentAnalytics(
                institutionId, sectionId, startDate, endDate, authentication);
    }


    @GetMapping("/analytics/sections")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<AttendanceGroupAnalyticsResponse> getSectionAnalytics(
            @RequestParam UUID institutionId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        return lessonAttendanceService.getSectionAnalytics(
                institutionId, startDate, endDate, authentication);
    }


    @GetMapping("/analytics/subjects")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<AttendanceGroupAnalyticsResponse> getSubjectAnalytics(
            @RequestParam UUID institutionId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {

        return lessonAttendanceService.getSubjectAnalytics(
                institutionId, startDate, endDate, authentication);
    }


    @GetMapping("/analytics/low-attendance")
    @PreAuthorize("hasAuthority('ATTENDANCE_LESSON_READ')")
    public List<StudentAttendanceAnalyticsResponse> getLowAttendanceStudents(
            @RequestParam UUID institutionId,
            @RequestParam UUID sectionId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            @RequestParam(defaultValue = "75.00") BigDecimal threshold,
            Authentication authentication) {

        return lessonAttendanceService.getLowAttendanceStudents(
                institutionId,
                sectionId,
                startDate,
                endDate,
                threshold,
                authentication);
    }
}