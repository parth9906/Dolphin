
package com.school.dolphin.attendance.controller;

import com.school.dolphin.attendance.dto.*;
import com.school.dolphin.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_MARK')")
    public List<AttendanceResponse> markAttendance(
            @Valid @RequestBody MarkAttendanceRequest request,
            Authentication authentication) {

        return attendanceService.markAttendance(request, authentication);
    }

    @PutMapping("/{attendanceId}")
    @PreAuthorize("hasAuthority('ATTENDANCE_UPDATE')")
    public AttendanceResponse updateAttendance(
            @PathVariable UUID attendanceId,
            @Valid @RequestBody UpdateAttendanceRequest request,
            Authentication authentication) {

        return attendanceService.updateAttendance(
                attendanceId, request, authentication);
    }


    @GetMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_READ')")
    public org.springframework.data.domain.Page<AttendanceResponse>
    getInstitutionAttendance(
            @RequestParam UUID institutionId,
            @RequestParam java.time.LocalDate attendanceDate,
            @RequestParam(required = false) UUID studentId,
            @org.springframework.data.web.PageableDefault(
                    size = 20,
                    sort = "attendanceDate",
                    direction = org.springframework.data.domain.Sort.Direction.DESC
            ) org.springframework.data.domain.Pageable pageable,
            Authentication authentication) {

        return attendanceService.getInstitutionAttendance(
                institutionId, attendanceDate, studentId, pageable, authentication);
    }

    @GetMapping("/{attendanceId}/audit")
    @PreAuthorize("hasAuthority('ATTENDANCE_AUDIT_READ')")
    public List<AttendanceAuditResponse> getAttendanceAudit(
            @PathVariable UUID attendanceId,
            Authentication authentication) {

        return attendanceService.getAttendanceAudit(attendanceId, authentication);
    }


    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ATTENDANCE_READ')")
    public AttendanceSummaryResponse getDailySummary(
            @RequestParam UUID institutionId,
            @RequestParam java.time.LocalDate attendanceDate,
            @RequestParam(required = false) UUID campusId,
            Authentication authentication) {

        return attendanceService.getDailySummary(
                institutionId, campusId, attendanceDate, authentication);
    }

    @GetMapping("/summary/trend")
    @PreAuthorize("hasAuthority('ATTENDANCE_READ')")
    public List<DailyAttendanceTrendResponse> getAttendanceTrend(
            @RequestParam UUID institutionId,
            @RequestParam java.time.LocalDate from,
            @RequestParam java.time.LocalDate to,
            @RequestParam(required = false) UUID campusId,
            Authentication authentication) {

        return attendanceService.getAttendanceTrend(
                institutionId, campusId, from, to, authentication);
    }
}