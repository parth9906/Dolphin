package com.school.dolphin.attendance.controller;

import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.school.dolphin.attendance.dto.GenerateAttendanceAlertsRequest;
import com.school.dolphin.attendance.service.AttendanceAlertService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/attendance-alerts")
@RequiredArgsConstructor
public class AttendanceAlertController {

    private final AttendanceAlertService attendanceAlertService;

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('ATTENDANCE_ALERT_GENERATE')")
    public int generateAlerts(
            @Valid @RequestBody GenerateAttendanceAlertsRequest request,
            Authentication authentication) {

        return attendanceAlertService.generateAlerts(
                request.institutionId(),
                request.sectionId(),
                request.startDate(),
                request.endDate(),
                request.thresholdPercent(),
                authentication);
    }
}