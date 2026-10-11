package com.school.dolphin.attendance.controller;

import com.school.dolphin.attendance.dto.AttendanceAlertResponse;
import com.school.dolphin.attendance.dto.AttendanceResponse;
import com.school.dolphin.attendance.dto.ParentLessonAttendanceItemResponse;
import com.school.dolphin.attendance.dto.ParentLessonAttendanceSummaryResponse;
import com.school.dolphin.attendance.service.StudentPortalAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/student-portal")
@RequiredArgsConstructor
public class StudentPortalAttendanceController {

    private final StudentPortalAttendanceService studentPortalAttendanceService;

    @GetMapping("/attendance")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public List<AttendanceResponse> getMyAttendance(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,
            Authentication authentication
    ) {
        return studentPortalAttendanceService.getMyAttendance(
                from, to, authentication);
    }

    @GetMapping("/lesson-attendance")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public List<ParentLessonAttendanceItemResponse> getMyLessonAttendance(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,
            Authentication authentication
    ) {
        return studentPortalAttendanceService.getMyLessonAttendance(
                from, to, authentication);
    }

    @GetMapping("/lesson-attendance/summary")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public ParentLessonAttendanceSummaryResponse getMyLessonAttendanceSummary(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,
            Authentication authentication
    ) {
        return studentPortalAttendanceService.getMyLessonAttendanceSummary(
                from, to, authentication);
    }

    @GetMapping("/attendance-alerts")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public List<AttendanceAlertResponse> getMyAttendanceAlerts(
            Authentication authentication
    ) {
        return studentPortalAttendanceService.getMyAttendanceAlerts(
                authentication);
    }
}
