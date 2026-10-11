
package com.school.dolphin.notification.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationOutboxFailureResponse(
        UUID id,
        String eventType,
        String aggregateType,
        UUID aggregateId,
        String status,
        int attempts,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        String lastError
) {
}
