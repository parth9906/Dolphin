
package com.school.dolphin.notification.controller;

import com.school.dolphin.notification.dto.NotificationOutboxFailureResponse;
import com.school.dolphin.notification.dto.NotificationOutboxSummaryResponse;
import com.school.dolphin.notification.service.NotificationOutboxAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-outbox")
@RequiredArgsConstructor
public class NotificationOutboxAdminController {

    private final NotificationOutboxAdminService adminService;

    @GetMapping("/dead")
    @PreAuthorize("hasAuthority('NOTIFICATION_OUTBOX_READ')")
    public Page<NotificationOutboxFailureResponse> getDeadEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.getDeadEvents(page, size);
    }

    @PostMapping("/{eventId}/retry")
    @PreAuthorize("hasAuthority('NOTIFICATION_OUTBOX_RETRY')")
    public Map<String, String> retryDeadEvent(
            @PathVariable UUID eventId
    ) {
        adminService.retryDeadEvent(eventId);

        return Map.of(
                "eventId", eventId.toString(),
                "status", "PENDING",
                "message", "Notification event queued for retry"
        );
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('NOTIFICATION_OUTBOX_READ')")
    public NotificationOutboxSummaryResponse getSummary() {
        return adminService.getSummary();
    }
}
