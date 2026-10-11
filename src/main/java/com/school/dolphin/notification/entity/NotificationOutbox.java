
package com.school.dolphin.notification.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "notification_outbox",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_notification_outbox_event",
                columnNames = {"event_type", "aggregate_type", "aggregate_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false)
    private UUID aggregateId;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false)
    private int attempts;

    @Column(name = "next_attempt_at", nullable = false)
    private OffsetDateTime nextAttemptAt;

    @Column(name = "locked_at")
    private OffsetDateTime lockedAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static NotificationOutbox attendanceAlert(UUID alertId) {
        NotificationOutbox event = new NotificationOutbox();
        OffsetDateTime now = OffsetDateTime.now();

        event.eventType = "ATTENDANCE_ALERT_CREATED";
        event.aggregateType = "ATTENDANCE_ALERT";
        event.aggregateId = alertId;
        event.status = "PENDING";
        event.attempts = 0;
        event.nextAttemptAt = now;
        event.createdAt = now;
        event.updatedAt = now;

        return event;
    }

    public void markProcessing(OffsetDateTime now) {
        status = "PROCESSING";
        attempts++;
        lockedAt = now;
        updatedAt = now;
        lastError = null;
    }

    public void markDelivered(OffsetDateTime now) {
        status = "DELIVERED";
        deliveredAt = now;
        lockedAt = null;
        updatedAt = now;
        lastError = null;
    }

    public void markDead(OffsetDateTime now, String error) {
        if (!"PROCESSING".equals(status)) {
            throw new IllegalStateException(
                    "Cannot mark outbox event " + id
                            + " as DEAD from status " + status
            );
        }

        status = "DEAD";
        lockedAt = null;
        updatedAt = now;
        lastError = error;
    }

    public void scheduleRetry(
            OffsetDateTime nextAttempt,
            String error,
            boolean permanentlyFailed
    ) {
        status = permanentlyFailed ? "DEAD" : "PENDING";
        nextAttemptAt = nextAttempt;
        lockedAt = null;
        updatedAt = OffsetDateTime.now();
        lastError = error;
    }
}
