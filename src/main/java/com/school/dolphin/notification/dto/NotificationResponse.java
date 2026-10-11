
package com.school.dolphin.notification.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String notificationType,
        String title,
        String message,
        String referenceType,
        UUID referenceId,
        OffsetDateTime createdAt,
        OffsetDateTime readAt,
        boolean read
) {
}
