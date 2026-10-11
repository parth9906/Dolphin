
package com.school.dolphin.notification.controller;

import com.school.dolphin.notification.dto.NotificationResponse;
import com.school.dolphin.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(
            Authentication authentication
    ) {
        return Map.of(
                "unreadCount",
                notificationService.getUnreadCount(authentication)
        );
    }

    @PatchMapping("/{notificationId}/read")
    public Map<String, String> markRead(
            @PathVariable UUID notificationId,
            Authentication authentication
    ) {
        notificationService.markRead(notificationId, authentication);

        return Map.of(
                "notificationId", notificationId.toString(),
                "status", "READ"
        );
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(
            Authentication authentication
    ) {
        int updatedCount = notificationService.markAllRead(authentication);

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "updatedCount", updatedCount
        ));
    }

    @GetMapping
    public Page<NotificationResponse> getInbox(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(required = false) String type
    ) {
        return notificationService.getInbox(
                authentication,
                page,
                size,
                unreadOnly,
                type
        );
    }
}
