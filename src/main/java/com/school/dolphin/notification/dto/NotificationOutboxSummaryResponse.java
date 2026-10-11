package com.school.dolphin.notification.dto;

public record NotificationOutboxSummaryResponse(
        long pending,
        long processing,
        long delivered,
        long dead,
        long total
) {
}