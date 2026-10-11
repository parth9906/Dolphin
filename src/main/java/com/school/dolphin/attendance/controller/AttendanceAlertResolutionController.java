
package com.school.dolphin.attendance.controller;

import com.school.dolphin.attendance.dto.AttendanceAlertAdminResponse;
import com.school.dolphin.attendance.dto.AttendanceAlertAuditResponse;
import com.school.dolphin.attendance.service.AttendanceAlertResolutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance-alerts")
@RequiredArgsConstructor
public class AttendanceAlertResolutionController {

    private final AttendanceAlertResolutionService resolutionService;

    @PostMapping("/{alertId}/resolve")
    @PreAuthorize("hasAuthority('ATTENDANCE_ALERT_RESOLVE')")
    public Map<String, String> resolve(
            @PathVariable UUID alertId,
            Authentication authentication
    ) {
        resolutionService.resolve(alertId, authentication);

        return Map.of(
                "alertId", alertId.toString(),
                "status", "RESOLVED",
                "message", "Attendance alert resolved successfully"
        );
    }

    @GetMapping("/{alertId}/audit")
    @PreAuthorize("hasAuthority('ATTENDANCE_ALERT_READ')")
    public List<AttendanceAlertAuditResponse> getAuditHistory(
            @PathVariable UUID alertId,
            Authentication authentication
    ) {
        return resolutionService.getAuditHistory(alertId, authentication);
    }


    @PostMapping("/{alertId}/acknowledge")
    @PreAuthorize("hasAuthority('ATTENDANCE_ALERT_RESOLVE')")
    public Map<String, String> acknowledge(
            @PathVariable UUID alertId,
            Authentication authentication
    ) {
        resolutionService.acknowledge(alertId, authentication);

        return Map.of(
                "alertId", alertId.toString(),
                "status", "ACKNOWLEDGED",
                "message", "Attendance alert acknowledged successfully"
        );
    }


    @GetMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_ALERT_READ')")
    public Page<AttendanceAlertAdminResponse> searchAlerts(
            @RequestParam UUID institutionId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        return resolutionService.searchAlerts(
                institutionId,
                status,
                startDate,
                endDate,
                page,
                size,
                authentication
        );
    }

}
